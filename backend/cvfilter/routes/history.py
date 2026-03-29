from flask import Blueprint, jsonify, session

from cvfilter.security import auth_disabled, csrf_required, login_required
from cvfilter.services import history as history_svc

bp = Blueprint("history", __name__)


@bp.get("/history")
@login_required
def list_history():
    if auth_disabled():
        return jsonify({"sessions": [], "history_disabled": True})
    uid = session.get("user_id")
    return jsonify({"sessions": history_svc.list_for_user(uid)})


@bp.get("/history/<int:session_id>")
@login_required
def get_history(session_id: int):
    if auth_disabled():
        return jsonify({"error": "history requires signed-in users"}), 403
    uid = session.get("user_id")
    row = history_svc.get_for_user(session_id, uid)
    if row is None:
        return jsonify({"error": "not found"}), 404
    out = dict(row.payload_json)
    out["history_meta"] = {
        "id": row.id,
        "created_at": row.created_at.isoformat() + "Z",
        "mode": row.mode,
        "jd_text": row.jd_text,
    }
    return jsonify(out)


@bp.delete("/history/<int:session_id>")
@login_required
@csrf_required
def delete_history(session_id: int):
    if auth_disabled():
        return jsonify({"error": "history requires signed-in users"}), 403
    uid = session.get("user_id")
    if not history_svc.delete_for_user(session_id, uid):
        return jsonify({"error": "not found"}), 404
    return jsonify({"ok": True})
