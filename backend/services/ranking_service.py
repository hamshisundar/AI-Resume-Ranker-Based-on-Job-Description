from CVFilter.models.ranker import ResumeRanker
from CVFilter.models.recruiter_detail import build_recruiter_profile


class RankingService:
    def __init__(self) -> None:
        self._ranker = ResumeRanker()

    def rank(self, jd: str, cvs: list[str], resume_labels: list[str] | None = None) -> dict:
        ranked = self._ranker.rank_candidates(jd, cvs)
        labels = resume_labels or []
        jd_preview = (jd[:560] + "…") if len(jd) > 560 else jd
        out_results: list[dict] = []
        for r in ranked:
            cid = int(r["candidate_id"])
            idx = cid - 1
            name = labels[idx] if 0 <= idx < len(labels) else None
            cv_text = cvs[idx] if 0 <= idx < len(cvs) else ""
            profile = build_recruiter_profile(
                jd,
                cv_text,
                tfidf_sim=float(r["tfidf_sim"]),
                skill_overlap_ratio=float(r["skill_overlap"]),
                explanation=list(r.get("explanation") or []),
                model_score=float(r["score"]),
            )
            out_results.append(
                {
                    "candidate_id": cid,
                    "score": float(r["score"]),
                    "explanation": list(r.get("explanation") or []),
                    "name": name,
                    **profile,
                }
            )
        return {"jd_preview": jd_preview, "results": out_results}


ranking_service = RankingService()

