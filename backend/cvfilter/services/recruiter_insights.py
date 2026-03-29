"""Recruiter-facing summaries: skills, gaps, explanations, fit labels — not raw ML jargon."""

from __future__ import annotations

import re
from typing import Any

import numpy as np

# Role / title signals (lightweight — no extra ML deps)
_ROLE_PATTERNS = [
    (r"\b(ml|machine learning|ai)\s+(engineer|scientist|developer)\b", "ML / AI engineering"),
    (r"\bdata\s+scientist\b", "Data science"),
    (r"\bsoftware\s+engineer\b", "Software engineering"),
    (r"\bfull[\s-]?stack\b", "Full-stack development"),
    (r"\bbackend\b", "Backend engineering"),
    (r"\bfrontend\b|\bfront[\s-]?end\b", "Frontend engineering"),
    (r"\bdevops\b|\bsre\b", "DevOps / SRE"),
    (r"\bproduct\s+manager\b", "Product management"),
    (r"\bqa\b|\btest\s+engineer\b", "Quality / testing"),
]


def _title_case_skill(s: str) -> str:
    parts = s.replace("_", " ").split()
    return " ".join(p[:1].upper() + p[1:].lower() if p else "" for p in parts)


def format_skill_list(skills: set) -> list[str]:
    return sorted(_title_case_skill(s) for s in skills)


def matched_and_missing(jd_skills: set, resume_skills: set) -> tuple[list[str], list[str]]:
    matched = jd_skills & resume_skills
    missing = jd_skills - resume_skills
    return format_skill_list(matched), format_skill_list(missing)


def display_name_from_resume_id(resume_id: str) -> str:
    """Readable label from filename or resume_id (e.g. PDF name → nicer title)."""
    if not resume_id or not str(resume_id).strip():
        return "Candidate"
    raw = str(resume_id).strip()
    base = re.sub(r"\.pdf\s*$", "", raw, flags=re.I)
    # Drop trailing "(2) (1)" style suffixes from merged PDFs
    no_trail = re.sub(r"(\s*\(\s*\d+\s*\))+$", "", base).strip()
    pretty = re.sub(r"\s+", " ", no_trail.replace("_", " ")).strip()
    without_merge = re.sub(r"(?i)^ilovepdf\s*merged\s*", "", pretty).strip()
    if without_merge:
        return without_merge
    if pretty:
        if re.fullmatch(r"(?i)ilovepdf[\s_-]*merged", pretty):
            return "Merged PDF (rename file to show candidate name)"
        return pretty
    return "Candidate"


def education_parenthetical(resume_clean: str) -> str | None:
    t = resume_clean.lower()
    hints = [
        ("computer science", "Computer Science"),
        ("data science", "Data Science"),
        ("machine learning", "ML-focused background"),
        ("electrical engineering", "Electrical Engineering"),
        ("information technology", "Information Technology"),
    ]
    for needle, label in hints:
        if needle in t:
            return label
    if "bachelor" in t or "b.tech" in t or "master" in t or "mba" in t or "phd" in t:
        return "Degree signaled on resume"
    return None


def extra_gap_phrases(jd_clean: str, resume_clean: str) -> list[str]:
    """JD phrases often searched by recruiters, not in the fixed skill set."""
    jd = jd_clean.lower()
    res = resume_clean.lower()
    pairs = [
        ("ci/cd", "ci/cd", "CI/CD"),
        ("continuous integration", "continuous integration", "CI/CD"),
        ("kubernetes", "kubernetes", "Kubernetes"),
        ("docker", "docker", "Docker"),
        ("terraform", "terraform", "Terraform"),
        ("jenkins", "jenkins", "Jenkins"),
        ("graphql", "graphql", "GraphQL"),
    ]
    out: list[str] = []
    for jd_sub, res_sub, label in pairs:
        if jd_sub in jd and res_sub not in res:
            out.append(f"No mention of {label}")
        if len(out) >= 5:
            break
    return out


def experience_one_liner(jd_years: int, resume_years: int, meets: bool) -> str:
    status = "Meets signal" if meets else "Needs review"
    if jd_years > 0:
        return f"~{resume_years} yrs vs ~{jd_years} yrs in JD · {status}"
    return f"~{resume_years} yrs on resume · JD silent on years · {status}"


def fit_label(score_0_100: float) -> str:
    if score_0_100 >= 80:
        return "Excellent Fit"
    if score_0_100 >= 60:
        return "Good Fit"
    if score_0_100 >= 40:
        return "Moderate Fit"
    return "Weak Fit"


def recommendation(score_0_100: float) -> str:
    if score_0_100 >= 75:
        return "Shortlist for interview"
    if score_0_100 >= 55:
        return "Consider — review gaps"
    if score_0_100 >= 35:
        return "Secondary list"
    return "Likely not a match"


def education_label(jd_edu: int, resume_edu: int) -> str:
    if resume_edu >= jd_edu and jd_edu > 0:
        return "Relevant"
    if resume_edu >= jd_edu:
        return "Meets or exceeds"
    if resume_edu == max(0, jd_edu - 1):
        return "Close — one level below JD signal"
    if resume_edu > 0:
        return "Below JD education signal"
    return "Not clear from resume"


def experience_block(jd_years: int, resume_years: int) -> dict[str, Any]:
    if jd_years <= 0:
        meets = resume_years > 0
        note = "Job did not specify years clearly; candidate shows experience." if meets else "No clear tenure detected."
    else:
        meets = resume_years >= max(0, jd_years - 1)
        note = (
            f"Resume shows ~{resume_years} yrs vs ~{jd_years} yrs implied in JD."
            if resume_years or jd_years
            else "Could not estimate years from JD or resume."
        )
    return {
        "jd_years_signal": jd_years,
        "candidate_years_estimate": resume_years,
        "meets_requirement": bool(meets),
        "summary": note,
    }


def role_relevance(resume_clean: str, jd_clean: str) -> str:
    r = resume_clean.lower()
    hits = []
    for pat, label in _ROLE_PATTERNS:
        if re.search(pat, r):
            hits.append(label)
    if not hits:
        return "Unclear from titles — review in interview."
    primary = hits[0]
    jd_l = jd_clean.lower()
    if any(re.search(pat, jd_l) for pat, lbl in _ROLE_PATTERNS if lbl == primary):
        return f"{primary}; consistent with the JD."
    return f"{primary}; confirm fit against the JD."


def score_breakdown_parts(
    skill_overlap: float,
    years_gap: float,
    edu_gap: float,
    tfidf_sim: float,
    keyword_cov: float,
    tfidf_norm: float,
) -> dict[str, float]:
    """Weighted slices (sum ≈ 100) for recruiter UI."""
    skills = 40.0 * float(np.clip(skill_overlap, 0, 1))
    # years_gap = resume - jd; positive => candidate has more years than JD extract
    exp_factor = float(np.clip(1.0 + years_gap / 6.0, 0, 1))
    experience = 25.0 * exp_factor
    edu_factor = float(np.clip(1.0 + edu_gap / 3.0, 0, 1))
    education = 10.0 * edu_factor
    semantic = 15.0 * float(np.clip(tfidf_norm, 0, 1))
    bonus = 10.0 * float(np.clip(keyword_cov, 0, 1))
    parts = {
        "skills": round(skills, 1),
        "experience": round(experience, 1),
        "education": round(education, 1),
        "semantic_similarity": round(semantic, 1),
        "keyword_alignment": round(bonus, 1),
    }
    total = sum(parts.values())
    if total < 1e-6:
        return {k: 20.0 for k in parts}
    scale = 100.0 / total
    return {k: round(v * scale, 1) for k, v in parts.items()}


def human_explanation(
    matched: list[str],
    missing: list[str],
    exp: dict[str, Any],
    edu_lbl: str,
    role_rel: str,
) -> str:
    """Short screening note — no marketing tone, suitable for HR records."""
    parts: list[str] = []
    if matched:
        parts.append("Strengths: " + ", ".join(matched[:5]) + ".")
    if missing:
        parts.append("Verify: " + ", ".join(missing[:4]) + ".")
    if exp.get("meets_requirement"):
        parts.append("Tenure lines up with the role.")
    else:
        parts.append("Tenure may be light — probe in screen.")
    parts.append(f"Education: {edu_lbl}. {role_rel}")
    return " ".join(parts)


def blend_display_score(model_norm_100: float, hr_score_100: float, model_spread_0_1: float) -> float:
    """Weight HR more when the ranker returns a flat score distribution."""
    w_model = 0.55 + 0.25 * model_spread_0_1
    w_hr = 1.0 - w_model
    return float(np.clip(w_model * model_norm_100 + w_hr * hr_score_100, 0, 100))


def hr_composite_100(
    skill_overlap: float,
    years_gap: float,
    edu_gap: float,
    tfidf_norm: float,
    keyword_cov: float,
) -> float:
    parts = score_breakdown_parts(skill_overlap, years_gap, edu_gap, 0, keyword_cov, tfidf_norm)
    return float(sum(parts.values()))


def build_candidate(
    rank: int,
    resume_id: str,
    raw_model_score: float,
    match_score: float,
    metrics: dict[str, Any],
    tfidf_norm: float,
) -> dict[str, Any]:
    jd_skills: set = metrics["jd_skills"]
    r_skills: set = metrics["resume_skills"]
    matched, missing = matched_and_missing(jd_skills, r_skills)
    jd_y = int(metrics["jd_years"])
    r_y = int(metrics["resume_years"])
    jd_e = int(metrics["jd_edu"])
    r_e = int(metrics["resume_edu"])
    exp_block = experience_block(jd_y, r_y)
    edu_lbl = education_label(jd_e, r_e)
    role_rel = role_relevance(metrics["resume_clean"], metrics["jd_clean"])
    breakdown = score_breakdown_parts(
        metrics["skill_overlap"],
        metrics["years_gap"],
        metrics["edu_gap"],
        metrics["tfidf_sim"],
        metrics["keyword_cov"],
        tfidf_norm,
    )
    label = fit_label(match_score)
    rec = recommendation(match_score)
    expl = human_explanation(matched, missing, exp_block, edu_lbl, role_rel)
    display_name = display_name_from_resume_id(resume_id)
    edu_paren = education_parenthetical(metrics["resume_clean"])
    education_display = f"{edu_lbl} ({edu_paren})" if edu_paren else edu_lbl
    gap_extras = extra_gap_phrases(metrics["jd_clean"], metrics["resume_clean"])
    miss_l = {m.lower() for m in missing}
    gap_extras = [
        g
        for g in gap_extras
        if not any(skill in g.lower() for skill in miss_l if len(skill) > 2)
    ]
    exp_line = experience_one_liner(jd_y, r_y, exp_block["meets_requirement"])

    return {
        "rank": rank,
        "name": resume_id,
        "display_name": display_name,
        "resume_id": resume_id,
        "raw_model_score": round(raw_model_score, 4),
        "score": int(round(match_score)),
        "label": label,
        "matched_skills": matched,
        "missing_skills": missing,
        "missing_skill_gaps": [f"Missing: {s}" for s in missing],
        "extra_gap_phrases": gap_extras,
        "experience_match": exp_block,
        "experience_one_liner": exp_line,
        "education_match": edu_lbl,
        "education_display": education_display,
        "role_relevance": role_rel,
        "score_breakdown": breakdown,
        "explanation": expl,
        "recommendation": rec,
    }


def build_comparison(c1: dict[str, Any], c2: dict[str, Any]) -> dict[str, Any]:
    def skill_ratio(c):
        m = c.get("matched_skills") or []
        miss = c.get("missing_skills") or []
        tot = len(m) + len(miss)
        return len(m) / tot if tot else 0.0

    return {
        "summary": f"#{c1['rank']} leads on match score and skill coverage vs #{c2['rank']}.",
        "factors": [
            {
                "factor": "Skills match (JD keywords)",
                "candidate_1": f"{len(c1.get('matched_skills', []))} matched",
                "candidate_2": f"{len(c2.get('matched_skills', []))} matched",
            },
            {
                "factor": "Match score",
                "candidate_1": f"{c1.get('score')}%",
                "candidate_2": f"{c2.get('score')}%",
            },
            {
                "factor": "Experience vs JD signal",
                "candidate_1": "Meets" if c1.get("experience_match", {}).get("meets_requirement") else "Review",
                "candidate_2": "Meets" if c2.get("experience_match", {}).get("meets_requirement") else "Review",
            },
            {
                "factor": "Relative skill coverage",
                "candidate_1": f"{int(skill_ratio(c1) * 100)}%",
                "candidate_2": f"{int(skill_ratio(c2) * 100)}%",
            },
        ],
    }
