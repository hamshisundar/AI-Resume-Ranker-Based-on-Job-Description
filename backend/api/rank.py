from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from CVFilter.backend.core.database import get_db
from CVFilter.backend.core.deps import get_current_user_optional
from CVFilter.backend.core.models import User
from CVFilter.backend.schemas.request import RankRequest
from CVFilter.backend.schemas.response import RankPdfResponse, RankResponse
from CVFilter.backend.services.persistence import save_screening
from CVFilter.backend.services.ranking_service import ranking_service
from CVFilter.backend.utils.documents import (
    DEFAULT_JD_PDF_MAX_PAGES,
    extract_resume_text,
    extract_text_from_pdf_bytes,
)

router = APIRouter(tags=["ranking"])


@router.post("/rank", response_model=RankResponse)
def rank_endpoint(
    payload: RankRequest,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    out = ranking_service.rank(payload.jd, payload.cvs, resume_labels=payload.resume_labels)
    labels = payload.resume_labels or [f"Resume {i + 1}" for i in range(len(payload.cvs))]
    if user is not None:
        out["history_id"] = save_screening(
            db,
            user=user,
            jd=payload.jd,
            mode="text",
            api_payload=out,
            resume_texts=list(payload.cvs),
            resume_labels=labels,
            source_filenames=[None] * len(payload.cvs),
        )
    return out


@router.post("/rank_pdf", response_model=RankPdfResponse)
async def rank_pdf_endpoint(
    jd_text: str | None = Form(None),
    top_k: int = Form(10),
    explain: str = Form("false"),
    jd_pdf: UploadFile | None = File(None),
    files: list[UploadFile] = File(),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> dict:
    jd = (jd_text or "").strip()

    if jd_pdf is not None and (jd_pdf.filename or "").strip():
        fn = jd_pdf.filename.strip()
        if not fn.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Job description upload must be a .pdf file")
        if jd:
            raise HTTPException(status_code=400, detail="Send either jd_text or jd_pdf, not both")
        raw_jd = await jd_pdf.read()
        if not raw_jd:
            raise HTTPException(status_code=400, detail="Job description PDF is empty")
        jd = extract_text_from_pdf_bytes(raw_jd, max_pages=DEFAULT_JD_PDF_MAX_PAGES)
        if not jd.strip():
            raise HTTPException(status_code=400, detail="No text extracted from job description PDF")

    if not jd.strip():
        raise HTTPException(
            status_code=400,
            detail="Provide jd_text (paste) or upload jd_pdf (PDF job description)",
        )

    resume_texts: list[str] = []
    labels: list[str] = []
    errors: list[dict[str, str]] = []

    for f in files:
        filename = (f.filename or "unknown").strip() or "unknown"
        raw = await f.read()
        if not raw:
            errors.append({"file": filename, "error": "Empty file"})
            continue
        try:
            text = extract_resume_text(filename, raw)
            if not text.strip():
                errors.append(
                    {"file": filename, "error": "No text extracted (try a text-based PDF/DOCX)"},
                )
                continue
            resume_texts.append(text)
            labels.append(filename)
        except ValueError as e:
            errors.append({"file": filename, "error": str(e)})
        except Exception as e:  # noqa: BLE001
            errors.append({"file": filename, "error": str(e)})

    if not resume_texts:
        return JSONResponse(
            status_code=400,
            content={"error": "No valid resumes processed", "file_errors": errors},
        )

    ranked = ranking_service.rank(jd, resume_texts, resume_labels=labels)
    ranked["processed_files"] = len(resume_texts)
    ranked["file_errors"] = errors
    if user is not None:
        ranked["history_id"] = save_screening(
            db,
            user=user,
            jd=jd,
            mode="pdf",
            api_payload=ranked,
            resume_texts=resume_texts,
            resume_labels=labels,
            source_filenames=labels,
        )
    return ranked
