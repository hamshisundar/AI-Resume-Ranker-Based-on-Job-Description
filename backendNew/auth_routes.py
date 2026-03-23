import secrets

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from flask import Blueprint, jsonify, request, session

from extensions import db, limiter
from models import User
from security import (
    auth_disabled,
    csrf_required_handler,
    normalize_email,
    validate_email,
    validate_password,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
ph = PasswordHasher()


def _ensure_csrf() -> str:
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    session.modified = True
    return session["csrf_token"]


def _login_session(user_id: int) -> None:
    session.clear()
    session["user_id"] = user_id
    session["csrf_token"] = secrets.token_urlsafe(32)
    session.permanent = True
    session.modified = True


@auth_bp.get("/csrf")
def get_csrf():
    token = _ensure_csrf()
    return jsonify({"csrf_token": token})


@limiter.limit("20 per minute")
@auth_bp.post("/signup")
def signup():
    err = csrf_required_handler()
    if err:
        return err

    data = request.get_json(force=True, silent=True) or {}
    email = validate_email(data.get("email", ""))
    password = data.get("password", "")

    if not email:
        return jsonify({"error": "valid email is required"}), 400
    ok, msg = validate_password(password)
    if not ok:
        return jsonify({"error": msg}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    user = User(email=email, password_hash=ph.hash(password))
    db.session.add(user)
    db.session.commit()

    if not auth_disabled():
        _login_session(user.id)

    return jsonify({"ok": True, "user": {"id": user.id, "email": user.email}}), 201


@limiter.limit("10 per minute")
@auth_bp.post("/login")
def login():
    err = csrf_required_handler()
    if err:
        return err

    data = request.get_json(force=True, silent=True) or {}
    email = normalize_email(data.get("email", ""))
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "invalid email or password"}), 401

    try:
        ph.verify(user.password_hash, password)
    except VerifyMismatchError:
        return jsonify({"error": "invalid email or password"}), 401

    if ph.check_needs_rehash(user.password_hash):
        user.password_hash = ph.hash(password)
        db.session.commit()

    if not auth_disabled():
        _login_session(user.id)

    return jsonify({"ok": True, "user": {"id": user.id, "email": user.email}})


@auth_bp.post("/logout")
def logout():
    err = csrf_required_handler()
    if err:
        return err

    if auth_disabled():
        session.clear()
        return jsonify({"ok": True})

    if session.get("user_id") is None:
        return jsonify({"error": "authentication required"}), 401

    session.clear()
    _ensure_csrf()
    return jsonify({"ok": True})


@auth_bp.get("/me")
def me():
    if auth_disabled():
        return jsonify(
            {
                "authenticated": False,
                "auth_disabled": True,
                "user": None,
            }
        )

    uid = session.get("user_id")
    if not uid:
        return jsonify({"authenticated": False, "user": None})

    user = db.session.get(User, uid)
    if not user:
        session.clear()
        return jsonify({"authenticated": False, "user": None})

    return jsonify(
        {
            "authenticated": True,
            "user": {"id": user.id, "email": user.email},
        }
    )
