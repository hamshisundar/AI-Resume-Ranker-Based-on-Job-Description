import json
import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
from flask import current_app

from cvfilter.services import recruiter_insights as hr
from cvfilter.utils.text import (
    clean_text,
    education_score,
    experience_years,
    extract_skills,
)

_ranker = None
_feature_names = None
_pair_vec = None
_jd_vectorizer = None
_jd_terms = None
_topn_jd_terms = 25


def _artifacts_dir() -> str:
    return current_app.config["ARTIFACTS_DIR"]


def load_models() -> None:
    """Load pickled ranker and vectorizers from ARTIFACTS_DIR (call inside app context)."""
    global _ranker, _feature_names, _pair_vec, _jd_vectorizer, _jd_terms, _topn_jd_terms

    base = _artifacts_dir()
    paths = {
        "model": os.path.join(base, "lgbm_ranker.pkl"),
        "feats": os.path.join(base, "feature_names.pkl"),
        "pair": os.path.join(base, "pair_tfidf_vectorizer.pkl"),
        "jd": os.path.join(base, "jd_vectorizer.pkl"),
        "config": os.path.join(base, "config.json"),
    }
    for key, p in paths.items():
        if key != "config" and not os.path.exists(p):
            raise FileNotFoundError(f"Missing artifact: {p}")

    _ranker = joblib.load(paths["model"])
    _feature_names = joblib.load(paths["feats"])
    _pair_vec = joblib.load(paths["pair"])
    _jd_vectorizer = joblib.load(paths["jd"])
    _jd_terms = np.array(_jd_vectorizer.get_feature_names_out())

    _topn_jd_terms = 25
    if os.path.exists(paths["config"]):
        try:
            with open(paths["config"], "r") as f:
                cfg = json.load(f)
            _topn_jd_terms = int(cfg.get("topn_jd_terms", _topn_jd_terms))
        except Exception:
            pass


def get_jd_top_terms(jd_clean: str, topn: int | None = None):
    topn = topn if topn is not None else _topn_jd_terms
    v = _jd_vectorizer.transform([jd_clean]).toarray().ravel()
    if v.sum() == 0:
        return []
    idx = v.argsort()[-topn:][::-1]
    return [_jd_terms[i] for i in idx if v[i] > 0]


def keyword_coverage(resume_clean: str, terms):
    if not terms:
        return 0.0
    t = resume_clean.lower()
    hit = sum(1 for term in terms if term in t)
    return hit / len(terms)


def build_feature_df(jd_text: str, resumes: list):
    jd_clean = clean_text(jd_text)
    jd_len = len(jd_clean)

    jd_skills = extract_skills(jd_clean)
    jd_years = experience_years(jd_clean)
    jd_edu = education_score(jd_clean)
    jd_top = get_jd_top_terms(jd_clean)

    resume_ids = []
    resume_clean = []
    for r in resumes:
        resume_ids.append(r.get("resume_id", None))
        resume_clean.append(clean_text(r.get("resume_text", "")))

    R = _pair_vec.transform(resume_clean)
    J = _pair_vec.transform([jd_clean])
    tfidf_sim = (R @ J.T).toarray().ravel().astype(float)

    skill_overlap = []
    keyword_cov = []
    years_gap = []
    edu_gap = []
    len_resume = []
    row_metrics: list[dict] = []

    for idx, rtxt in enumerate(resume_clean):
        r_sk = extract_skills(rtxt)
        if len(jd_skills) == 0:
            skill_overlap.append(0.0)
        else:
            skill_overlap.append(len(r_sk.intersection(jd_skills)) / len(jd_skills))

        keyword_cov.append(keyword_coverage(rtxt, jd_top))
        ry = experience_years(rtxt)
        re_ = education_score(rtxt)
        years_gap.append(ry - jd_years)
        edu_gap.append(re_ - jd_edu)
        len_resume.append(len(rtxt))
        row_metrics.append(
            {
                "jd_clean": jd_clean,
                "resume_clean": rtxt,
                "jd_skills": set(jd_skills),
                "resume_skills": set(r_sk),
                "jd_years": jd_years,
                "resume_years": ry,
                "jd_edu": jd_edu,
                "resume_edu": re_,
                "skill_overlap": skill_overlap[-1],
                "keyword_cov": keyword_cov[-1],
                "years_gap": years_gap[-1],
                "edu_gap": edu_gap[-1],
                "tfidf_sim": float(tfidf_sim[idx]),
            }
        )

    feat = pd.DataFrame(
        {
            "tfidf_sim": tfidf_sim,
            "len_resume": np.array(len_resume, dtype=float),
            "len_jd": np.array([jd_len] * len(resume_clean), dtype=float),
            "skill_overlap": np.array(skill_overlap, dtype=float),
            "keyword_cov": np.array(keyword_cov, dtype=float),
            "years_gap": np.array(years_gap, dtype=float),
            "edu_gap": np.array(edu_gap, dtype=float),
        }
    )

    X_df = feat[_feature_names].copy()
    meta = [{"resume_id": resume_ids[i]} for i in range(len(resume_ids))]
    return X_df, meta, row_metrics


def rank_resumes(jd_text: str, resumes: list, top_k: int, explain: bool) -> dict[str, Any]:
    X_df, meta, row_metrics = build_feature_df(jd_text, resumes)
    scores = np.array(_ranker.predict(X_df), dtype=float)
    n = len(scores)
    order = np.argsort(scores)[::-1][: min(top_k, n)]

    tfidf = np.array([row_metrics[i]["tfidf_sim"] for i in range(n)], dtype=float)
    t_lo, t_hi = float(tfidf.min()), float(tfidf.max())
    if t_hi - t_lo < 1e-12:
        tfidf_norm = np.ones(n, dtype=float) * 0.5
    else:
        tfidf_norm = (tfidf - t_lo) / (t_hi - t_lo)

    s_lo, s_hi = float(scores.min()), float(scores.max())
    if s_hi - s_lo < 1e-12:
        model_norm = np.ones(n, dtype=float) * 50.0
        model_spread_01 = 0.0
    else:
        model_norm = ((scores - s_lo) / (s_hi - s_lo)) * 100.0
        model_spread_01 = min(1.0, (s_hi - s_lo) / (abs(s_hi) + 1e-6))

    hr_scores = np.array(
        [
            hr.hr_composite_100(
                row_metrics[i]["skill_overlap"],
                row_metrics[i]["years_gap"],
                row_metrics[i]["edu_gap"],
                float(tfidf_norm[i]),
                row_metrics[i]["keyword_cov"],
            )
            for i in range(n)
        ],
        dtype=float,
    )

    match_scores = np.array(
        [
            hr.blend_display_score(float(model_norm[i]), float(hr_scores[i]), model_spread_01)
            for i in range(n)
        ],
        dtype=float,
    )

    candidates: list[dict[str, Any]] = []
    results: list[dict[str, Any]] = []
    for rank_pos, i in enumerate(order, start=1):
        cand = hr.build_candidate(
            rank_pos,
            meta[i]["resume_id"],
            float(scores[i]),
            float(match_scores[i]),
            row_metrics[i],
            float(tfidf_norm[i]),
        )
        candidates.append(cand)
        results.append(
            {
                "resume_id": meta[i]["resume_id"],
                "score": cand["score"],
                "rank": rank_pos,
            }
        )

    out: dict[str, Any] = {
        "top_k": top_k,
        "results": results,
        "candidates": candidates,
    }
    if len(candidates) >= 2:
        out["comparison"] = hr.build_comparison(candidates[0], candidates[1])
    else:
        out["comparison"] = None

    if explain:
        contrib = np.array(_ranker.predict(X_df, pred_contrib=True))
        explanations = []
        for i in order:
            row = contrib[i, :-1]
            top_idx = np.argsort(-np.abs(row))[:5]
            explanations.append(
                {
                    "resume_id": meta[i]["resume_id"],
                    "top_contributors": [
                        {"feature": _feature_names[j], "contribution": float(row[j])}
                        for j in top_idx
                    ],
                }
            )
        out["explanations"] = explanations
        out["ml_explanations_note"] = (
            "Optional: raw model feature contributions for data teams — not shown in the main hiring view."
        )

    return out
