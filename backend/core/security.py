from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from CVFilter.backend.core.settings import ALGORITHM, ACCESS_TOKEN_EXPIRE_DAYS, SECRET_KEY


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:
        return False


def create_access_token(*, sub: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = data.get("sub")
        return str(sub) if sub is not None else None
    except JWTError:
        return None
