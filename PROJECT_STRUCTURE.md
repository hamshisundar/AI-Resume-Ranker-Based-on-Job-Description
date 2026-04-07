# Talent NEX AI Resume Ranker — project structure (VIVA reference)

This document maps **folders, main files, and data flow** so you can explain the system end-to-end.

---

## 1. Top-level layout

```
CVFilter/
├── PROJECT_STRUCTURE.md   ← this file
├── README.md              ← run commands, API overview
├── requirements.txt       ← Python dependencies (backend + ML)
├── __init__.py            ← makes `CVFilter` a package (imports like CVFilter.backend…)
│
├── backend/               ← FastAPI REST API, auth, SQLite persistence
├── frontend/              ← React + Vite + Tailwind UI
├── models/                ← ML: features, LightGBM ranker, explanations, recruiter-style detail
├── artifacts/             ← Trained model: ranker_model.pkl (not in git if large — keep a copy)
├── training/              ← train_model.py + training_data.csv
├── tests/                 ← pytest (API / features)
└── scripts/               ← Optional HTTP smoke (e.g. call_rank.py)
```

**Do not commit or submit as “source” (regenerate locally):**

- `frontend/node_modules/`, `frontend/dist/`
- `backend/.venv/` or any `venv/`
- `**/__pycache__/`, `.pytest_cache/`
- `backend/instance/*.db` (local SQLite after you run the app)

---

## 2. End-to-end flow (what to say in VIVA)

1. **User** logs in via **React** (`Login.jsx`) → JWT stored in `localStorage` → `api/client.js` sends `Authorization: Bearer …`.
2. **Dashboard** (`Dashboard.jsx`) collects **job description** + **resumes** (PDF upload or pasted text).
3. **Frontend** calls `POST /rank` or `POST /rank_pdf` (see `backend/api/rank.py`).
4. **Ranking service** (`backend/services/ranking_service.py`) uses **`models/`** (feature extraction + `ResumeRanker` + explanations) and loads **`artifacts/ranker_model.pkl`**.
5. If the user is authenticated, **`persistence.save_screening`** writes **Job**, **ScreeningRun**, and deduplicated **ResumeProfile** rows (`backend/services/persistence.py`, `backend/core/models.py`).
6. **History / Jobs** pages read **`GET /history`**, **`GET /jobs`** etc. (`backend/api/history.py`, `backend/api/jobs.py`).

---

## 3. Backend (`backend/`)

```
backend/
├── main.py              ← FastAPI app entry (`uvicorn CVFilter.backend.main:app`)
├── core/                ← database, ORM, auth helpers, settings
│   ├── database.py      ← engine, `Base`, `get_db`, `init_db`
│   ├── models.py        ← SQLAlchemy: User, Job, ScreeningRun, ResumeProfile
│   ├── settings.py      ← env: DB URL, JWT secret, expiry
│   ├── security.py      ← bcrypt + JWT
│   └── deps.py          ← optional / required current user
├── api/                 ← HTTP routers only
│   ├── auth.py
│   ├── rank.py
│   ├── history.py
│   └── jobs.py
├── services/
├── schemas/
└── utils/
```

### API routers (`backend/api/`)

| File | Endpoints (concept) |
|------|---------------------|
| `auth.py` | Signup, login, logout, `/auth/me` |
| `rank.py` | `POST /rank`, `POST /rank_pdf` |
| `history.py` | List / get / delete saved screenings |
| `jobs.py` | List jobs (roles) and job detail with runs |

### Services (`backend/services/`)

| File | Role |
|------|------|
| `ranking_service.py` | Bridges HTTP payloads ↔ `models` ranker |
| `persistence.py` | Saves screenings; upserts resume profiles by content hash |

### Utils & schemas

- `utils/documents.py` — PDF/DOCX text extraction for `/rank_pdf`
- `schemas/request.py`, `schemas/response.py` — Pydantic models for API bodies

---

## 4. Machine learning (`models/` + `training/` + `artifacts/`)

| File | Role |
|------|------|
| `feature_engine.py` | Turn JD + CV text into numeric features |
| `ranker.py` | Load LightGBM model, predict scores, order candidates |
| `explain.py` | Optional per-resume explanation / diagnostics |
| `recruiter_detail.py` | Richer “recruiter-style” fields for the UI |
| `training/train_model.py` | Train pipeline; writes `artifacts/ranker_model.pkl` |
| `training/training_data.csv` | Example training rows |

---

## 5. Frontend (`frontend/src/`)

```
src/
├── main.jsx                 ← Vite entry
├── app/
│   └── App.jsx              ← React Router + route layout
├── pages/                   ← one file per screen (Dashboard, Login, History, …)
├── features/
│   └── ranking/             ← rank workflow UI (forms + results)
│       ├── PdfRankForm.jsx
│       ├── TextRankForm.jsx
│       ├── ModeToggle.jsx
│       └── RecruiterResults.jsx
├── components/              ← shared: shell, toast, private route, …
├── auth/
├── api/client.js
└── lib/
```

| Path | Role |
|------|------|
| `main.jsx`, `app/App.jsx` | Entry, React Router routes |
| `auth/AuthContext.jsx` | Login state, bootstrap `/auth/me` |
| `api/client.js` | Axios instance, all API functions |
| `pages/Login.jsx` | Auth UI |
| `pages/Dashboard.jsx` | Main rank workflow + results |
| `pages/History.jsx`, `HistoryDetail.jsx` | Saved runs |
| `pages/Jobs.jsx`, `JobDetail.jsx` | Roles aggregated from JD hash |
| `features/ranking/*` | Upload/paste forms, mode toggle, ranked results |
| `components/ProductShell.jsx` | App chrome / nav |
| `lib/branding.js` | Product name strings |
| `lib/normalizeRankingResponse.js` | Shapes API JSON for the UI |

Config: `vite.config.js` (dev proxy to API), `tailwind.config.js`, `index.css`.

---

## 6. Tests (`tests/`)

- `test_rank.py` — Ranking / API-level checks (as configured in your project)
- `test_feature_engine.py` — Feature layer sanity

Run from repo root (parent of `CVFilter` or as documented in `README.md`): `pytest`.

---

## 7. Product naming

- **UI / document title:** Talent NEX AI Resume Ranker  
- **Python package folder:** still `CVFilter` (import paths unchanged)

---

## 8. Quick “where do I change X?”

| Goal | Where |
|------|--------|
| Model algorithm / features | `models/`, `training/train_model.py` |
| API shape or new endpoint | `backend/api/`, `schemas/` |
| DB tables | `backend/core/models.py`, then migrations or recreate DB |
| Screen layout / copy | `frontend/src/pages/`, `features/`, `components/` |
| Auth behaviour | `backend/api/auth.py`, `backend/core/security.py`, `AuthContext.jsx` |

---

*Generated for viva preparation: removed dead profile list API/UI; caches and build output should stay out of version control.*
