"""Derive recruiter-readable signals from JD + CV text (aligned with FeatureEngine skills)."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

from CVFilter.models.feature_engine import FeatureEngine

_TRACKED_SKILLS: tuple[str, ...] | None = None


def _tracked_skills() -> tuple[str, ...]:
    global _TRACKED_SKILLS
    if _TRACKED_SKILLS is None:
        _TRACKED_SKILLS = tuple(FeatureEngine().skills)
    return _TRACKED_SKILLS


_STOPWORDS = frozenset(
    """
    the a an and or for to of in on at with by from as is are was were be been being
    this that these those it its we you our your they their will can could should would
    must may might have has had do does did not no yes all any some such both each few
    more most other into than then so if about over after before between under again
    further once here there when where why how what which who whom own same so than too
    very just also only own same into through during including excluding per via et al
    etc e g i e vs ll re ve d ll m s t don doesn didn isn wasn weren shouldn wouldn
    """.split(),
)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9+#.]+", text.lower())


def jd_significant_terms(jd: str, max_terms: int = 20) -> list[str]:
    toks = [t for t in _tokenize(jd) if len(t) > 2 and t not in _STOPWORDS and not t.isdigit()]
    if not toks:
        return []
    cnt = Counter(toks)
    out: list[str] = []
    for w, _ in cnt.most_common(max_terms * 3):
        if w not in out:
            out.append(w)
        if len(out) >= max_terms:
            break
    return out


def terms_hits_in_cv(terms: list[str], cv_lower: str) -> list[str]:
    return [t for t in terms if t in cv_lower]


def jd_cv_tracked_skills(jd: str, cv: str) -> tuple[list[str], list[str], list[str], list[str]]:
    skills = list(_tracked_skills())
    jl, cl = jd.lower(), cv.lower()
    jd_skills = [s for s in skills if s in jl]
    cv_skills = [s for s in skills if s in cl]
    matched = [s for s in jd_skills if s in cl]
    missing = [s for s in jd_skills if s not in cl]
    extra = [s for s in cv_skills if s not in jd_skills]
    return matched, missing, extra, jd_skills


def _sniff_experience(cv: str) -> str | None:
    m = re.search(r"(\d+)\s*\+?\s*(?:years?|yrs?)", cv, re.I)
    if m:
        return f"Text scan: ~{m.group(1)}+ years mentioned — validate scope vs JD seniority."
    if re.search(r"\b(19|20)\d{2}\s*[–-]\s*(19|20)\d{2}|present|current\b", cv, re.I):
        return "Date ranges present — reconcile total relevant tenure with role requirements."
    return None


def _sniff_education(cv: str) -> str | None:
    if re.search(r"\b(ph\.?\s*d|doctorate)\b", cv, re.I):
        return "Doctoral-level credential referenced."
    if re.search(r"\b(master|mba|m\.s\.|msc|m\.tech)\b", cv, re.I):
        return "Master’s-level credential referenced."
    if re.search(r"\b(bachelor|b\.s\.|b\.tech|b\.e\.|undergraduate)\b", cv, re.I):
        return "Bachelor’s-level credential referenced."
    return None


def _executive_summary(
    *,
    explanation: list[str],
    matched: list[str],
    missing: list[str],
    kw_hits: list[str],
    model_score: float,
) -> str:
    lead = " ".join(explanation).strip() if explanation else ""
    parts: list[str] = []
    if lead:
        parts.append(lead)
    parts.append(
        f"Model rank score: {round(float(model_score), 1)}/100 (relative to this shortlist only).",
    )
    if matched:
        parts.append(f"Tracked skills also in the JD: {', '.join(matched)}.")
    if kw_hits:
        shown = kw_hits[:10]
        tail = "…" if len(kw_hits) > 10 else ""
        parts.append(f"JD terms surfaced in the CV: {', '.join(shown)}{tail}")
    if missing:
        parts.append(f"JD asks for {', '.join(missing[:5])}{'…' if len(missing) > 5 else ''} — confirm depth elsewhere in the file or in screening.")
    return " ".join(parts)


def _gap_notes(missing: list[str], terms: list[str], kw_hits: list[str], jd_skill_req: list[str]) -> list[str]:
    notes: list[str] = []
    for m in missing[:5]:
        notes.append(f"Standard scan: “{m}” appears in the JD but not in the tracked skill list for this CV.")
    if jd_skill_req and not missing:
        notes.append("Tracked JD skills are covered — still verify depth (projects, scale, ownership).")
    if terms:
        threshold = max(2, min(5, len(terms) // 3))
        if len(kw_hits) < threshold:
            notes.append("JD vocabulary is thin in this CV — could be formatting, synonyms, or a real gap; read manually.")
    return notes


def _role_focus_line(kw_hits: list[str], matched: list[str]) -> str | None:
    bits = (kw_hits[:5] + matched[:3])[:6]
    if not bits:
        return None
    return "Signals: " + ", ".join(bits)


def build_recruiter_profile(
    jd: str,
    cv: str,
    *,
    tfidf_sim: float,
    skill_overlap_ratio: float,
    explanation: list[str],
    model_score: float,
) -> dict[str, Any]:
    cv_low = cv.lower()
    matched, missing, extra, jd_skill_req = jd_cv_tracked_skills(jd, cv)
    terms = jd_significant_terms(jd)
    kw_hits = terms_hits_in_cv(terms, cv_low)

    lexical_100 = max(0, min(100, round(float(tfidf_sim) * 100)))
    if jd_skill_req:
        skills_cov = max(0, min(100, round((len(matched) / len(jd_skill_req)) * 100)))
    else:
        skills_cov = max(0, min(100, round(float(skill_overlap_ratio) * 100)))

    kw_cov = max(0, min(100, round((len(kw_hits) / len(terms)) * 100))) if terms else 0

    score_breakdown: dict[str, float] = {
        "semantic_similarity": float(lexical_100),
        "skills": float(skills_cov),
        "keyword_alignment": float(kw_cov),
    }

    gap_notes = _gap_notes(missing, terms, kw_hits, jd_skill_req)
    exec_summary = _executive_summary(
        explanation=explanation,
        matched=matched,
        missing=missing,
        kw_hits=kw_hits,
        model_score=model_score,
    )

    return {
        "lexical_overlap_100": lexical_100,
        "skills_coverage_100": skills_cov,
        "jd_keyword_hits": kw_hits[:18],
        "jd_keyword_total": len(terms),
        "matched_skills": matched,
        "missing_skills": missing,
        "extra_skills_in_cv": extra[:10],
        "score_breakdown": score_breakdown,
        "gap_notes": gap_notes,
        "executive_summary": exec_summary,
        "experience_hint": _sniff_experience(cv),
        "education_hint": _sniff_education(cv),
        "role_focus_line": _role_focus_line(kw_hits, matched),
    }
