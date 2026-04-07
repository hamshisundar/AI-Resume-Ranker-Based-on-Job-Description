"""Smoke test: feature engine + ranker run without raising."""

from CVFilter.models.feature_engine import FeatureEngine
from CVFilter.models.ranker import ResumeRanker


def test_feature_engine_builds_vector():
    fe = FeatureEngine()
    v = fe.build_features("python aws", "python developer aws docker")
    assert v.shape == (3,)


def test_resume_ranker_ranks():
    ranker = ResumeRanker()
    out = ranker.rank_candidates(
        "Looking for Python developer with machine learning experience",
        [
            "Python developer with machine learning and AWS experience",
            "Marketing specialist with sales and communication skills",
        ],
    )
    assert len(out) == 2
    assert all("candidate_id" in r and "score" in r for r in out)
