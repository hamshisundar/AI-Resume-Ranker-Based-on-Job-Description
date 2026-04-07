from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from CVFilter.backend.core.database import get_db
from CVFilter.backend.core.models import User
from CVFilter.backend.core.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_optional(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    if not creds or not creds.credentials:
        return None
    user_id = decode_token(creds.credentials)
    if not user_id or not user_id.isdigit():
        return None
    return db.get(User, int(user_id))


def get_current_user_required(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
