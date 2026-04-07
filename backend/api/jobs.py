from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from CVFilter.backend.core.database import get_db
from CVFilter.backend.core.deps import get_current_user_required
from CVFilter.backend.core.models import Job, ScreeningRun, User

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _iso(dt) -> str:
    if dt is None:
        return ""
    return dt.isoformat() + "Z"


@router.get("")
def list_jobs(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    sub = (
        db.query(
            ScreeningRun.job_id.label("job_id"),
            func.count(ScreeningRun.id).label("run_count"),
            func.max(ScreeningRun.created_at).label("last_run"),
        )
        .filter(ScreeningRun.user_id == user.id)
        .group_by(ScreeningRun.job_id)
        .subquery()
    )
    rows = (
        db.query(Job, sub.c.run_count, sub.c.last_run)
        .join(sub, Job.id == sub.c.job_id)
        .filter(Job.user_id == user.id)
        .order_by(sub.c.last_run.desc().nullslast())
        .all()
    )
    return {
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "run_count": int(rc or 0),
                "last_screened_at": _iso(lr),
                "jd_preview": (j.jd_text or "")[:240] + ("…" if len(j.jd_text or "") > 240 else ""),
            }
            for j, rc, lr in rows
        ]
    }


@router.get("/{job_id}")
def get_job(
    job_id: int,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job or job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    runs = (
        db.query(ScreeningRun)
        .filter(ScreeningRun.job_id == job.id, ScreeningRun.user_id == user.id)
        .order_by(ScreeningRun.created_at.desc())
        .all()
    )
    return {
        "id": job.id,
        "title": job.title,
        "jd_text": job.jd_text,
        "runs": [
            {
                "id": r.id,
                "created_at": _iso(r.created_at),
                "mode": r.mode,
                "resume_count": r.resume_count,
                "top_score": r.top_score,
            }
            for r in runs
        ],
    }
