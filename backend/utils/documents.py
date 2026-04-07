"""Extract plain text from PDF / Word uploads for ranking."""

from __future__ import annotations

import io

import pdfplumber
from docx import Document

DEFAULT_JD_PDF_MAX_PAGES = 12
DEFAULT_RESUME_PDF_MAX_PAGES = 24


def extract_text_from_pdf_bytes(data: bytes, *, max_pages: int) -> str:
    if not data:
        return ""
    parts: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages[:max_pages]:
            t = page.extract_text()
            if t:
                parts.append(t)
    return "\n".join(parts).strip()


def extract_text_from_docx_bytes(data: bytes) -> str:
    if not data:
        return ""
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text).strip()


def extract_resume_text(filename: str, raw: bytes) -> str:
    name = (filename or "").strip().lower()
    if not raw:
        raise ValueError("Empty file")
    if name.endswith(".pdf"):
        return extract_text_from_pdf_bytes(raw, max_pages=DEFAULT_RESUME_PDF_MAX_PAGES)
    if name.endswith(".docx"):
        return extract_text_from_docx_bytes(raw)
    if name.endswith(".doc"):
        raise ValueError("Legacy .doc is not supported; save as .docx or PDF.")
    raise ValueError(f"Unsupported file type: {filename!r}")
