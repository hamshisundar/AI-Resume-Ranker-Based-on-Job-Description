"""Persist ranking results per user for history and review."""

from __future__ import annotations

from typing import Any

from cvfilter.extensions import db
from cvfilter.models import RankingSession


def _preview(jd_text: str) -> str:
    t = (jd_text or "").strip().replace("\n", " ")
    return t[:600] if len(t) > 600 else t


def _stats_from_payload(payload: dict[str, Any]) -> tuple[int, int]:
    cands = payload.get("candidates") or []
    n = len(cands)
    top = max((int(c.get("score") or 0) for c in cands), default=0)
    return n, top


def save_session(user_id: int | None, mode: str, jd_text: str, payload: dict[str, Any]) -> int | None:
    """Store a completed ranking. Returns new row id, or None if not persisted."""
    if user_id is None:
        return None
    mode = "pdf" if mode == "pdf" else "text"
    resume_count, top_score = _stats_from_payload(payload)
    row = RankingSession(
        user_id=user_id,
        mode=mode,
        jd_preview=_preview(jd_text),
        jd_text=jd_text or "",
        resume_count=resume_count,
        top_score=top_score,
        payload_json=payload,
    )
    db.session.add(row)
    db.session.commit()
    return row.id


def list_for_user(user_id: int | None, limit: int = 100) -> list[dict[str, Any]]:
    if user_id is None:
        return []
    q = (
        RankingSession.query.filter_by(user_id=user_id)
        .order_by(RankingSession.created_at.desc())
        .limit(min(limit, 500))
    )
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat() + "Z",
            "mode": r.mode,
            "jd_preview": r.jd_preview,
            "resume_count": r.resume_count,
            "top_score": r.top_score,
        }
        for r in q.all()
    ]


def get_for_user(session_id: int, user_id: int | None) -> RankingSession | None:
    if user_id is None:
        return None
    row = db.session.get(RankingSession, session_id)
    if row is None or row.user_id != user_id:
        return None
    return row


def delete_for_user(session_id: int, user_id: int | None) -> bool:
    row = get_for_user(session_id, user_id)
    if row is None:
        return False
    db.session.delete(row)
    db.session.commit()
    return True
