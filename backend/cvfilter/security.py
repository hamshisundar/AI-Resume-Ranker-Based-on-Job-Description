import os
import re
from functools import wraps

from flask import jsonify, request, session


def auth_disabled() -> bool:
    return os.environ.get("REQUIRE_AUTH", "true").lower() not in ("1", "true", "yes")


def login_required_handler():
    if request.method == "OPTIONS":
        return None
    if auth_disabled():
        return None
    if session.get("user_id") is None:
        return jsonify({"error": "authentication required"}), 401
    return None


def csrf_required_handler():
    if request.method == "OPTIONS":
        return None
    if auth_disabled():
        return None
    if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
        return None
    token = request.headers.get("X-CSRF-Token")
    expected = session.get("csrf_token")
    if not token or not expected or token != expected:
        return jsonify({"error": "invalid or missing csrf token"}), 403
    return None


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email: str) -> str | None:
    e = normalize_email(email)
    if not e or len(e) > 255 or not _EMAIL_RE.match(e):
        return None
    return e


def validate_password(password: str) -> tuple[bool, str]:
    if not isinstance(password, str):
        return False, "password is required"
    if len(password) < 10:
        return False, "password must be at least 10 characters"
    if len(password) > 128:
        return False, "password must be at most 128 characters"
    if not re.search(r"[A-Za-z]", password):
        return False, "password must contain at least one letter"
    if not re.search(r"\d", password):
        return False, "password must contain at least one digit"
    return True, ""


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        r = login_required_handler()
        if r is not None:
            return r
        return f(*args, **kwargs)

    return decorated


def csrf_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        r = csrf_required_handler()
        if r is not None:
            return r
        return f(*args, **kwargs)

    return decorated
