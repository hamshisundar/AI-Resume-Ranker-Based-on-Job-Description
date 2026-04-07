from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from CVFilter.backend.core.database import get_db
from CVFilter.backend.core.deps import get_current_user_required
from CVFilter.backend.core.models import ScreeningRun, User

router = APIRouter(tags=["history"])


def _iso(dt) -> str:
    if dt is None:
        return ""
    return dt.isoformat() + "Z"


@router.get("/history")
def list_history(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    runs = (
        db.query(ScreeningRun)
        .filter(ScreeningRun.user_id == user.id)
        .order_by(ScreeningRun.created_at.desc().nullslast())
        .all()
    )
    sessions = [
        {
            "id": r.id,
            "created_at": _iso(r.created_at),
            "mode": r.mode,
            "jd_preview": r.jd_preview,
            "resume_count": r.resume_count,
            "top_score": r.top_score,
            "job_id": r.job_id,
        }
        for r in runs
    ]
    return {"history_disabled": False, "sessions": sessions}


@router.get("/history/{history_id}")
def get_history(
    history_id: int,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    run = db.get(ScreeningRun, history_id)
    if not run or run.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    job = run.job
    payload = dict(run.payload_json or {})
    return {
        "history_id": run.id,
        "history_meta": {
            "id": run.id,
            "jd_text": job.jd_text if job else "",
            "created_at": _iso(run.created_at),
            "mode": run.mode,
            "job_id": run.job_id,
            "title": job.title if job else "",
        },
        "jd_preview": payload.get("jd_preview", run.jd_preview),
        "results": payload.get("results", []),
        "file_errors": payload.get("file_errors", []),
    }


@router.delete("/history/{history_id}")
def delete_history(
    history_id: int,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    run = db.get(ScreeningRun, history_id)
    if not run or run.user_id != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(run)
    db.commit()
    return {"ok": True}
