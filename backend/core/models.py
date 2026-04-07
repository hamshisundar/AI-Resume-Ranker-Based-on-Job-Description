from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from CVFilter.backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="owner")
    runs: Mapped[list["ScreeningRun"]] = relationship("ScreeningRun", back_populates="owner")
    profiles: Mapped[list["ResumeProfile"]] = relationship("ResumeProfile", back_populates="owner")


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("user_id", "jd_hash", name="uq_job_user_jdhash"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    jd_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    jd_text: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="jobs")
    runs: Mapped[list["ScreeningRun"]] = relationship("ScreeningRun", back_populates="job")


class ScreeningRun(Base):
    __tablename__ = "screening_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    mode: Mapped[str] = mapped_column(String(16), nullable=False)
    jd_preview: Mapped[str] = mapped_column(String(600), nullable=False)
    resume_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    top_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="runs")
    job: Mapped["Job"] = relationship("Job", back_populates="runs")


class ResumeProfile(Base):
    __tablename__ = "resume_profiles"
    __table_args__ = (UniqueConstraint("user_id", "content_hash", name="uq_profile_user_hash"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="profiles")
