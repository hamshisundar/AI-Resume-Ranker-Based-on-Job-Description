"""Integration test: POST /rank returns standardized results."""

from fastapi.testclient import TestClient

from CVFilter.backend.main import app

client = TestClient(app)


def test_rank_returns_results_shape():
    r = client.post(
        "/rank",
        json={
            "jd": "Python developer with machine learning",
            "cvs": [
                "Python and ML engineer",
                "Sales and marketing",
            ],
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert "jd_preview" in data
    assert len(data["results"]) == 2
    for item in data["results"]:
        assert "candidate_id" in item
        assert "score" in item
        assert "explanation" in item
        assert isinstance(item["explanation"], list)
        assert "executive_summary" in item
        assert "lexical_overlap_100" in item


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_auth_me_when_logged_out():
    r = client.get("/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body.get("authenticated") is False
    assert body.get("user") is None
