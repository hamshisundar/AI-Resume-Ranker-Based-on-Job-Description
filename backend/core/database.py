from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from CVFilter.backend.core.settings import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from pathlib import Path

    from CVFilter.backend.core import models  # noqa: F401

    instance_dir = Path(__file__).resolve().parent.parent / "instance"
    instance_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

    if DATABASE_URL.startswith("sqlite"):
        with engine.begin() as conn:
            cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info('screening_runs')").fetchall()}
            if "created_at" not in cols:
                conn.exec_driver_sql(
                    "ALTER TABLE screening_runs "
                    "ADD COLUMN created_at DATETIME NULL"
                )
