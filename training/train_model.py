"""Train LightGBM ranker; writes ``CVFilter/artifacts/ranker_model.pkl``."""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import lightgbm as lgb
import pandas as pd

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from CVFilter.models.feature_engine import FeatureEngine  # noqa: E402

_TRAINING_DIR = Path(__file__).resolve().parent
_ARTIFACT_PATH = _TRAINING_DIR.parent / "artifacts" / "ranker_model.pkl"


def main() -> None:
    df = pd.read_csv(_TRAINING_DIR / "training_data.csv")
    engine = FeatureEngine()

    X_rows = []
    y = []
    for _, row in df.iterrows():
        features = engine.build_features(row["jd"], row["cv"])
        X_rows.append(features)
        y.append(row["label"])

    X = pd.DataFrame(X_rows, columns=["tfidf", "semantic", "skill"])
    y_s = pd.Series(y)
    group = [len(X)]

    model = lgb.LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        n_estimators=100,
        learning_rate=0.05,
    )
    model.fit(X, y_s, group=group)

    _ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, _ARTIFACT_PATH)
    print(f"Saved model to {_ARTIFACT_PATH}")


if __name__ == "__main__":
    main()
