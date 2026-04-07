from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from CVFilter.backend.core.database import get_db
from CVFilter.backend.core.deps import get_current_user_optional
from CVFilter.backend.core.models import User
from CVFilter.backend.core.security import create_access_token, hash_password, verify_password
from CVFilter.backend.schemas.auth import LoginBody, SignupBody, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/csrf")
def auth_csrf():
    """Kept for older clients; JWT auth does not require CSRF."""
    return {"csrf_token": ""}


@router.get("/me")
def auth_me(
    user: User | None = Depends(get_current_user_optional),
):
    if user is None:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": {"id": user.id, "email": user.email},
    }


@router.post("/signup", response_model=TokenResponse)
def auth_signup(body: SignupBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    u = User(
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    token = create_access_token(sub=str(u.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(u))


@router.post("/login", response_model=TokenResponse)
def auth_login(body: LoginBody, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(sub=str(u.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(u))


@router.post("/logout")
def auth_logout():
    return {"ok": True}
