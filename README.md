## AI Resume Ranker (ML Project)

Simple ML project to **rank resumes against a job description**.  
Backend is a Flask API with a LightGBM ranking model; frontend is a React/Vite dashboard for uploading PDF resumes or pasting resume text.

GitHub repo: [AI-Resume-Ranker-Based-on-Job-Description](https://github.com/hamshisundar/AI-Resume-Ranker-Based-on-Job-Description)

---

## Repository layout

```
CVFilter/
├── .gitignore              # Repo-wide ignores (Python, Node, secrets, OS junk)
├── README.md
├── backend/                # Flask API (Python)
│   ├── .env.example        # Template for local/production env vars (copy → .env)
│   ├── .gitignore
│   ├── artifacts/          # Trained model + vectorizers (tracked in git if you choose)
│   ├── cvfilter/           # Application package (`create_app`, routes, services)
│   ├── instance/           # Local SQLite (created at runtime; not committed)
│   ├── requirements.txt
│   ├── run.py              # Dev server: python run.py
│   ├── run_dev.sh          # Same with default SECRET_KEY / PORT
│   └── wsgi.py             # Production: gunicorn wsgi:app
└── frontend/               # React + Vite UI
    ├── .env.development    # Vite dev proxy target (optional overrides)
    └── src/
```

**Separation of concerns:** `frontend/` is only the browser app; `backend/` is only the API. They communicate over HTTP (dev proxy or `VITE_API_BASE_URL` in production builds).

---

## Backend package (`cvfilter/`)

| Area | Role |
|------|------|
| `cvfilter/__init__.py` | `create_app()` — wires config, CORS, DB, blueprints, loads ML artifacts |
| `cvfilter/config.py` | Paths and Flask config from environment |
| `cvfilter/extensions.py` | Shared `db`, `limiter` |
| `cvfilter/models.py` | SQLAlchemy models |
| `cvfilter/security.py` | Auth/CSRF helpers and decorators |
| `cvfilter/auth/routes.py` | `/auth/*` blueprint |
| `cvfilter/routes/main.py` | `/`, `/health` |
| `cvfilter/routes/rank.py` | `/rank`, `/rank_pdf` |
| `cvfilter/services/ranking.py` | Feature building, PDF text, LightGBM inference |
| `cvfilter/services/recruiter_insights.py` | Recruiter-facing scores, skills gaps, explanations, #1 vs #2 comparison |
| `cvfilter/utils/` | Reusable text helpers and constants |

### Ranking API response (recruiter-focused)

`POST /rank` and `POST /rank_pdf` return JSON including:

- **`results`** — compact list: `rank`, `resume_id`, **`score` as 0–100** (normalized blend of ranker + hiring heuristics).
- **`candidates`** — full cards: matched/missing skills, experience/education summaries, fit **label**, **recommendation**, **score_breakdown**, plain-language **explanation**.
- **`comparison`** — when at least two candidates: table-style **Why #1 vs #2**.
- **`explanations`** (optional) — only if `explain: true`: raw LightGBM feature contributions for ML/debug use.

**Optional upgrade:** To add true semantic similarity beyond TF-IDF, install `sentence-transformers`, encode JD + resume paragraphs in a small service module, and blend that cosine score into `recruiter_insights.score_breakdown_parts` (keep LightGBM for final ordering until you retrain).

---

## Authentication

The API uses **Flask server-side sessions** (HTTP-only, `SameSite=Lax` cookies), **Argon2** password hashes, **SQLite** (via Flask-SQLAlchemy), **CSRF** tokens on state-changing requests when `REQUIRE_AUTH` is enabled, **Flask-Limiter** on signup/login, and **flask-cors** with `supports_credentials=True` and an explicit origin allowlist.

| Endpoint | Purpose |
|----------|---------|
| `GET /auth/csrf` | Issue or refresh CSRF token (also establishes session cookie). |
| `POST /auth/signup` | Register (JSON: `email`, `password`). Rate limited. |
| `POST /auth/login` | Log in. Rate limited. |
| `POST /auth/logout` | Clear session (requires CSRF when auth is enforced). |
| `GET /auth/me` | Current user or `{ "authenticated": false }`. |

`POST /rank` and `POST /rank_pdf` require a logged-in session and a valid `X-CSRF-Token` header when `REQUIRE_AUTH` is **not** disabled. `GET /health` stays public.

### Environment variables (backend)

Copy `backend/.env.example` to `backend/.env` and adjust. `python-dotenv` loads `.env` when the app starts (do **not** commit `.env`).

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Session signing secret. **Set in production** (defaults to a dev placeholder). |
| `DATABASE_URL` | SQLAlchemy URL (default: `sqlite:///…/instance/app.db` under `backend/instance`). |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins (e.g. `http://localhost:5173`). Defaults include common Vite dev ports. |
| `SESSION_COOKIE_SECURE` | Set to `true` when serving the API over HTTPS. |
| `REQUIRE_AUTH` | Set to `false` to skip login and CSRF on ranking (local API testing only). |
| `PORT` | Used by `run.py` only (default `5050`). |
| `ARTIFACTS_DIR` | Directory with `lgbm_ranker.pkl`, vectorizers, `config.json`. Default: `artifacts/` next to `run.py`. |

### Database

On first run the app creates `backend/instance/app.db` and the `users` table. Delete `instance/app.db` to reset users.

### Frontend env

- **Development:** The app calls `/api/...`; Vite proxies to `VITE_PROXY_TARGET` from `frontend/.env.development` (default `http://127.0.0.1:5050`). Match your Flask `PORT` if you change it.
- **Production / direct API:** Set `VITE_API_BASE_URL` to the full API origin. It must appear in the backend `CORS_ORIGINS`. The app uses `credentials: 'include'` and sends `X-CSRF-Token` on mutating requests.

Use the **same hostname** in `VITE_API_BASE_URL` as in the browser bar (`127.0.0.1` vs `localhost` matters for `SameSite=Lax` cookies).

### Local testing (auth enabled)

1. Start backend and frontend as in **Quick Start**.
2. Open the app, **Sign up**, then use the dashboard.
3. For quick API-only tests, run the backend with `REQUIRE_AUTH=false`.

---

## Quick Start

The repo root (**CVFilter**) has **`backend`** and **`frontend`** side by side.  
If your shell is inside `backend`, the frontend is **`../frontend`**.

### 1. Backend (Flask API)

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env        # optional; edit secrets for real deploys
```

Run the server:

```bash
export SECRET_KEY="dev-change-me"
python run.py
```

Default **port 5050** avoids macOS **5000** (AirPlay). For port 5000: `export PORT=5000` and set `VITE_PROXY_TARGET=http://127.0.0.1:5000` in the frontend env.

Or:

```bash
chmod +x run_dev.sh
./run_dev.sh
```

Check health:

```bash
curl http://127.0.0.1:5050/health
```

### 2. Frontend (React/Vite)

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`) — **not** only the API URL. The UI is served by Vite; the API shows a short HTML hint at `/`.

### Production-style API process

From `backend/` (after `pip install -r requirements.txt`):

```bash
gunicorn -w 2 -b 0.0.0.0:5050 wsgi:app
```

Set `SECRET_KEY`, `CORS_ORIGINS`, `SESSION_COOKIE_SECURE=true`, and a real `DATABASE_URL` in the environment (or `.env` on the server). Serve the **frontend** as static files (e.g. `npm run build` → CDN or nginx) with `VITE_API_BASE_URL` pointing at your API.

### Troubleshooting

**`Port 5000 is in use` (macOS)** — Often AirPlay. This project defaults the API to **5050**.

**`Address already in use`** — Change `PORT` and `VITE_PROXY_TARGET`, restart Vite.

**`cd: no such file or directory: frontend`** — You are inside `backend`; use `cd ../frontend`.

---

## How to Use

1. Start **backend** and **frontend**.
2. In the UI: **Upload & Rank PDFs** or **Paste & Rank Text**.
3. Paste the **job description**, set **Top K**, optionally **explanations**, then **Rank Resumes**.

---

## What not to commit (see `.gitignore`)

| Pattern | Why |
|---------|-----|
| `.venv/`, `venv/` | Local Python environments; recreate with `python -m venv`. |
| `node_modules/` | npm dependencies; restore with `npm install`. |
| `.env`, `.env.local` | Secrets and machine-specific URLs. |
| `instance/`, `*.db` (under instance) | Local SQLite and runtime data. |
| `__pycache__/`, `*.pyc` | Python bytecode. |
| `frontend/dist/` | Production build output; CI/build servers regenerate it. |
| `.DS_Store` | macOS folder metadata. |
| `*.zip` | Large ad-hoc archives; keep canonical files under `backend/artifacts/`. |

**Note:** The `.git/` directory is your repository metadata; it is not listed in `.gitignore` because Git already manages it — you never “commit `.git`” as project files.
