from flask import Blueprint, jsonify, request, session

from cvfilter.security import auth_disabled, csrf_required, login_required
from cvfilter.services import history as history_svc
from cvfilter.services import ranking as rank_svc
from cvfilter.utils.documents import (
    DEFAULT_JD_PDF_MAX_PAGES,
    extract_resume_text,
    extract_text_from_pdf_bytes,
    jd_is_pdf_filename,
)

bp = Blueprint("rank", __name__)


@bp.route("/rank", methods=["POST", "OPTIONS"])
@login_required
@csrf_required
def rank_endpoint():
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(force=True, silent=True) or {}
    jd_text = data.get("jd_text", "")
    resumes = data.get("resumes", [])
    top_k = int(data.get("top_k", 10))
    explain = bool(data.get("explain", False))

    if not isinstance(jd_text, str) or jd_text.strip() == "":
        return jsonify({"error": "jd_text is required"}), 400
    if not isinstance(resumes, list) or len(resumes) == 0:
        return jsonify({"error": "resumes must be a non-empty list"}), 400

    ranked = rank_svc.rank_resumes(jd_text, resumes, top_k, explain)
    out = {
        "top_k": ranked["top_k"],
        "results": ranked["results"],
        "candidates": ranked.get("candidates", []),
        "comparison": ranked.get("comparison"),
    }
    if "explanations" in ranked:
        out["explanations"] = ranked["explanations"]
    if "ml_explanations_note" in ranked:
        out["ml_explanations_note"] = ranked["ml_explanations_note"]

    uid = session.get("user_id")
    if uid and not auth_disabled():
        hid = history_svc.save_session(uid, "text", jd_text, out)
        if hid:
            out["history_id"] = hid

    return jsonify(out)


@bp.route("/rank_pdf", methods=["POST", "OPTIONS"])
@login_required
@csrf_required
def rank_pdf_endpoint():
    if request.method == "OPTIONS":
        return ("", 204)

    jd_text_form = (request.form.get("jd_text") or "").strip()
    top_k = int(request.form.get("top_k", "10"))
    explain = request.form.get("explain", "false").lower() in ["true", "1", "yes"]

    jd_pdf = request.files.get("jd_pdf")
    jd_text = jd_text_form

    if jd_pdf and jd_pdf.filename and jd_pdf.filename.strip():
        fn = jd_pdf.filename.strip()
        if not jd_is_pdf_filename(fn):
            return jsonify({"error": "Job description upload must be a .pdf file"}), 400
        pdf_bytes = jd_pdf.read()
        if not pdf_bytes:
            return jsonify({"error": "Job description PDF is empty"}), 400
        try:
            jd_text = extract_text_from_pdf_bytes(pdf_bytes, max_pages=DEFAULT_JD_PDF_MAX_PAGES)
        except Exception as e:
            return jsonify({"error": f"Could not read job description PDF: {e}"}), 400
        if not jd_text.strip():
            return jsonify({"error": "No text extracted from job description PDF"}), 400
        if jd_text_form:
            return jsonify({"error": "Send either jd_text or jd_pdf, not both"}), 400
    elif not jd_text:
        return jsonify(
            {
                "error": "Provide jd_text (paste) or upload jd_pdf (PDF job description)",
            },
        ), 400

    if "files" not in request.files:
        return jsonify({"error": "No files uploaded. Use form-data key 'files'"}), 400

    files = request.files.getlist("files")
    resumes = []
    errors = []

    for f in files:
        filename = f.filename or "unknown"
        raw = f.read()
        if not raw:
            errors.append({"file": filename, "error": "Empty file"})
            continue

        try:
            text = extract_resume_text(filename, raw)
            if not text:
                errors.append({"file": filename, "error": "No text extracted (try PDF/DOCX or non-scanned file)"})
                continue
            resumes.append({"resume_id": filename, "resume_text": text})
        except ValueError as e:
            errors.append({"file": filename, "error": str(e)})
        except Exception as e:
            errors.append({"file": filename, "error": str(e)})

    if not resumes:
        return jsonify({"error": "No valid resumes processed", "file_errors": errors}), 400

    ranked = rank_svc.rank_resumes(jd_text, resumes, top_k, explain)
    out = {
        "top_k": ranked["top_k"],
        "processed_files": len(resumes),
        "file_errors": errors,
        "results": ranked["results"],
        "candidates": ranked.get("candidates", []),
        "comparison": ranked.get("comparison"),
    }
    if "explanations" in ranked:
        out["explanations"] = ranked["explanations"]
    if "ml_explanations_note" in ranked:
        out["ml_explanations_note"] = ranked["ml_explanations_note"]

    uid = session.get("user_id")
    if uid and not auth_disabled():
        hid = history_svc.save_session(uid, "pdf", jd_text, out)
        if hid:
            out["history_id"] = hid

    return jsonify(out)
