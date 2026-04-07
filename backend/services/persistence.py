"""Persist screenings, jobs, and resume profiles."""

from __future__ import annotations

import hashlib
from typing import Any

from sqlalchemy.orm import Session

from CVFilter.backend.core.models import Job, ResumeProfile, ScreeningRun, User


def _jd_title(jd: str) -> str:
    line = (jd.strip().splitlines() or [""])[0].strip()
    return (line[:200] if line else "Untitled role") or "Untitled role"


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def upsert_resume_profiles(
    db: Session,
    user_id: int,
    texts: list[str],
    labels: list[str],
    source_filenames: list[str | None] | None = None,
) -> None:
    sf = source_filenames or []
    for i, text in enumerate(texts):
        label = labels[i] if i < len(labels) else f"Resume {i + 1}"
        src = sf[i] if i < len(sf) else None
        h = _content_hash(text)
        row = (
            db.query(ResumeProfile)
            .filter(ResumeProfile.user_id == user_id, ResumeProfile.content_hash == h)
            .first()
        )
        if row:
            row.display_name = label[:255]
            row.raw_text = text
            if src:
                row.source_filename = src[:512]
        else:
            db.add(
                ResumeProfile(
                    user_id=user_id,
                    content_hash=h,
                    display_name=label[:255],
                    source_filename=src[:512] if src else None,
                    raw_text=text,
                )
            )


def save_screening(
    db: Session,
    *,
    user: User,
    jd: str,
    mode: str,
    api_payload: dict[str, Any],
    resume_texts: list[str],
    resume_labels: list[str],
    source_filenames: list[str | None] | None = None,
) -> int:
    jd_hash = hashlib.sha256(jd.encode("utf-8")).hexdigest()
    job = (
        db.query(Job).filter(Job.user_id == user.id, Job.jd_hash == jd_hash).first()
    )
    title = _jd_title(jd)
    if not job:
        job = Job(user_id=user.id, jd_hash=jd_hash, jd_text=jd, title=title)
        db.add(job)
        db.flush()
    else:
        job.jd_text = jd
        job.title = title

    upsert_resume_profiles(db, user.id, resume_texts, resume_labels, source_filenames)

    results = api_payload.get("results") or []
    top = int(max((float(r.get("score", 0)) for r in results), default=0))

    storable = {
        "jd_preview": api_payload.get("jd_preview", "")[:600],
        "results": results,
        "file_errors": api_payload.get("file_errors", []),
    }

    run = ScreeningRun(
        user_id=user.id,
        job_id=job.id,
        mode=mode,
        jd_preview=storable["jd_preview"] or jd[:600],
        resume_count=len(resume_texts),
        top_score=min(100, top),
        payload_json=storable,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return int(run.id)
