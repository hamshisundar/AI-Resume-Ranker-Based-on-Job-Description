import joblib
import pandas as pd
from pathlib import Path

from CVFilter.models.feature_engine import FeatureEngine
from CVFilter.models.explain import generate_explanation


class ResumeRanker:

    def __init__(self):
        self.engine = FeatureEngine()
        model_path = Path(__file__).resolve().parents[1] / "artifacts" / "ranker_model.pkl"
        self.model = joblib.load(model_path)

    def rank_candidates(self, jd, cvs):
        results = []

        for i, cv in enumerate(cvs):
            features = self.engine.build_features(jd, cv)

            # Convert to DataFrame (fix warning)
            features_df = pd.DataFrame(
                [features],
                columns=["tfidf", "semantic", "skill"]
            )

            raw_score = self.model.predict(features_df)[0]

            # Normalize score (0–100)
            score = (raw_score + 5) * 20
            score = max(0, min(100, score))

            explanation = generate_explanation(features)

            results.append({
                "candidate_id": i + 1,
                "score": round(score, 2),
                "explanation": explanation,
                "tfidf_sim": float(features[0]),
                "skill_overlap": float(features[2]),
            })

        ranked = sorted(results, key=lambda x: x["score"], reverse=True)

        return ranked