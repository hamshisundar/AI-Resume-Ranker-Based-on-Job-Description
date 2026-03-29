"""Application configuration from environment variables."""

import os
from datetime import timedelta
from pathlib import Path


def _parse_bool(val, default=False):
    if val is None:
        return default
    return str(val).lower() in ("1", "true", "yes")


def backend_root() -> Path:
    """Directory containing run.py, wsgi.py, and the `artifacts/` folder by default."""
    return Path(__file__).resolve().parent.parent


def resolve_artifacts_dir() -> Path:
    raw = os.environ.get("ARTIFACTS_DIR", "artifacts")
    p = Path(raw)
    if not p.is_absolute():
        p = backend_root() / p
    return p


def cors_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    origins = []
    for port in range(5173, 5205):
        origins.extend(
            [
                f"http://127.0.0.1:{port}",
                f"http://localhost:{port}",
            ]
        )
    return origins


def apply_flask_config(app) -> None:
    """Attach config keys to the Flask app instance."""
    root = backend_root()
    os.makedirs(app.instance_path, exist_ok=True)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or "dev-secret-change-in-production"
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + str(Path(app.instance_path) / "app.db"),
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = _parse_bool(os.environ.get("SESSION_COOKIE_SECURE"))
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)
    app.config["ARTIFACTS_DIR"] = str(resolve_artifacts_dir())
    app.config["BACKEND_ROOT"] = str(root)
