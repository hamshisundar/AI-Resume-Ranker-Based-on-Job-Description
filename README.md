## Talent NEX AI Resume Ranker (CVFilter codebase)

Ranks CV texts against a job description using a **trained LightGBM model** (`artifacts/ranker_model.pkl`) and a **React/Vite** frontend. For a **folder-by-folder map and VIVA talking points**, see **`PROJECT_STRUCTURE.md`**.

### Layout

```
CVFilter/
├── backend/           # FastAPI: main.py, core/, api/, services/, schemas/
├── models/            # FeatureEngine, ResumeRanker, explanations
├── artifacts/         # ranker_model.pkl (trained)
├── training/          # train_model.py, training_data.csv
├── frontend/          # Vite UI (src/app, src/features, src/pages, …)
├── tests/
├── scripts/           # Optional HTTP smoke script
└── requirements.txt
```

### Backend (from repo root: `ML Project Final/`)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r CVFilter/requirements.txt
uvicorn CVFilter.backend.main:app --reload --port 8000
# If the port is busy, use e.g. 8002 and set VITE_PROXY_TARGET / VITE_API_BASE_URL to match.
```

- `GET /` — health-style JSON
- `POST /rank` — body `{ "jd": "...", "cvs": ["...", "..."] }` → `{ "results": [ { "candidate_id", "score", "explanation" }, ... ] }`

### Train / refresh the model

```bash
cd CVFilter/training
python train_model.py
```

(Run from `CVFilter/training` so imports resolve, or from repo root: `python CVFilter/training/train_model.py` — the script adds the repo root to `sys.path`.)

### Frontend dev

```bash
cd CVFilter/frontend
npm install
npm run dev
```

Set `VITE_PROXY_TARGET` in `frontend/.env.development` to match Uvicorn (default `http://127.0.0.1:8000`).

### Tests

From repo root:

```bash
pytest
```

### Optional: call `/rank` with curl

```bash
curl -s -X POST http://127.0.0.1:8000/rank \
  -H "Content-Type: application/json" \
  -d '{"jd":"Python ML","cvs":["Python ML AWS","Sales"]}' | python -m json.tool
```
