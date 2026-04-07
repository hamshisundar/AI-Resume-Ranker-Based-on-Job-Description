"""Environment-backed settings for the API."""

import os
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-change-me-in-production-use-long-random")
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"sqlite:///{_BACKEND_DIR / 'instance' / 'cvfilter.db'}",
)
ACCESS_TOKEN_EXPIRE_DAYS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
ALGORITHM = "HS256"
