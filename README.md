## AI Resume Ranker (ML Project)

Simple ML project to **rank resumes against a job description**.  
Backend is a Flask API with a LightGBM ranking model; frontend is a React/Vite dashboard for uploading PDF resumes or pasting resume text.

GitHub repo: [AI-Resume-Ranker-Based-on-Job-Description](https://github.com/hamshisundar/AI-Resume-Ranker-Based-on-Job-Description)

---

## Project Structure

- **backendNew** – Flask API that:
  - Loads the trained LightGBM ranker and TF‑IDF vectorizers.
  - Exposes endpoints:
    - `GET /health` – health check.
    - `GET /auth/csrf`, `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` – authentication (when enabled).
    - `POST /rank` – rank plain‑text resumes.
    - `POST /rank_pdf` – rank uploaded PDF resumes.
- **frontend** – React + Vite UI:
  - Upload multiple PDF resumes or paste resume text.
  - Sends requests to the backend and shows ranked results and feature explanations.
  - Sign up / sign in when authentication is enabled (see **Authentication** below).

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

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Session signing secret. **Set in production** (defaults to a dev placeholder). |
| `DATABASE_URL` | SQLAlchemy URL (default: `sqlite:///…/instance/app.db` under `backendNew/instance`). |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins (e.g. `http://localhost:5173`). Defaults include common Vite dev ports. |
| `SESSION_COOKIE_SECURE` | Set to `true` when serving the API over HTTPS. |
| `REQUIRE_AUTH` | Set to `false` to skip login and CSRF on ranking (local API testing only). |

### Database

On first run the app creates `backendNew/instance/app.db` and the `users` table. No separate migration CLI is required for this project; delete `instance/app.db` to reset users.

### Frontend env

- **Development:** The app **always** calls `/api/...` in dev; Vite proxies that to `VITE_PROXY_TARGET` from `frontend/.env.development` (default `http://127.0.0.1:5050`, matching Flask’s default `PORT`). If you run Flask on another port, change `VITE_PROXY_TARGET` to match. `VITE_API_BASE_URL` is ignored during `npm run dev`.
- **Production / direct API:** Set `VITE_API_BASE_URL` to the full API origin. It must appear in the backend `CORS_ORIGINS` list. The app uses `credentials: 'include'` and sends `X-CSRF-Token` on mutating requests.

If you call the API **directly** from the browser (no proxy), use the **same hostname** in `VITE_API_BASE_URL` as in the browser bar (`127.0.0.1` vs `localhost` matters for `SameSite=Lax` cookies).

### Local testing (auth enabled)

1. Start backend and frontend as in **Quick Start** (ensure the Vite origin is allowed by CORS, or set `CORS_ORIGINS`).
2. Open the app, go to **Sign up**, create an account, then use the dashboard.
3. `curl` against ranking endpoints with auth requires a session cookie and CSRF; for quick API-only tests, run the backend with `REQUIRE_AUTH=false`.

### Files touched by auth (reference)

**Backend:** `app.py`, `requirements.txt`, `extensions.py`, `models.py`, `security.py`, `auth_routes.py`, `.gitignore` (ignores `instance/`).

**Frontend:** `package.json`, `src/App.jsx`, `src/api/client.js`, `src/auth/*`, `src/pages/*`, `src/components/PrivateRoute.jsx`, `src/pages/Dashboard.jsx` (dashboard extracted from former `App.jsx`), minor lint fixes in `BackendStatus.jsx` and `PdfRankForm.jsx`.

**macOS note:** The context module is named `auth-context.js` (not `authContext.js`) so imports like `./auth/AuthContext` resolve to `AuthContext.jsx` on case-insensitive disks; otherwise `npm run build` can fail.

---

## Quick Start

The repo root (**CVFilter**) contains two folders side by side: **`backendNew`** and **`frontend`**.  
If your terminal is inside `backendNew`, the frontend is **`../frontend`**, not `frontend`.

### 1. Backend (Flask API)

```bash
cd backendNew

# (optional) create virtual env
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Run the server (pick one):

```bash
export SECRET_KEY="dev-change-me"
python app.py
```

Flask defaults to **port 5050** so `python app.py` works on macOS where **5000 is often taken** (AirPlay Receiver). To use 5000 instead: `export PORT=5000` and set `VITE_PROXY_TARGET=http://127.0.0.1:5000`.

Or use the helper script (defaults: `PORT=5050`, `SECRET_KEY=dev-secret-change-me`):

```bash
chmod +x run_dev.sh
./run_dev.sh
```

**zsh tip:** Put `export` lines on their own lines. Do not paste trailing text like `if 5000 is taken` without a `#` at the start of the comment, or zsh will error (`not an identifier: 5000`). Run `pip install -r requirements.txt` alone; do not paste `#` comments on the same line if your shell mangles them.

The API runs on `http://127.0.0.1:5050` by default (override with `PORT`).  
Check health (adjust port if needed):

```bash
curl http://127.0.0.1:5050/health
```

### 2. Frontend (React/Vite)

From the **repository root** (the folder that contains `frontend`):

```bash
cd frontend
npm install
npm run dev
```

If you are still inside **`backendNew`**, go up one level first:

```bash
cd ../frontend
npm install
npm run dev
```

Open the URL **Vite** prints (e.g. `http://localhost:5173`) in your browser — **not** the Flask API URL (e.g. `http://127.0.0.1:5050`). The UI only loads from Vite; the API alone shows a short HTML hint at `/`.

**Shell tip:** Run `python app.py`, not `run python app.py` (`run` is not a command).

In **development**, requests go to `/api/...` and Vite forwards them to `VITE_PROXY_TARGET` from `frontend/.env.development` (match your Flask `PORT`). Set `VITE_API_BASE_URL` only when you want to bypass the proxy (e.g. production build against a remote API).

### Troubleshooting

**`Port 5000 is in use` (macOS)**  
Common cause: **AirPlay Receiver** (System Settings → General → AirDrop & Handoff). This project defaults the API to **5050** so `python app.py` usually works without changing system settings. You can still run on 5000 with `PORT=5000` if that port is free.

**`Address already in use` (port 5050 or whatever you chose)**  
Another process is still bound to that port. Stop it or use another port — **and set `VITE_PROXY_TARGET` in `frontend/.env.development` to the same port**, then restart `npm run dev`.

```bash
lsof -i :5050
kill <PID>
```

Example alternate port:

```bash
export PORT=5002
python app.py
```

Then set `frontend/.env.development` to `VITE_PROXY_TARGET=http://127.0.0.1:5002` and restart Vite.

**`cd: no such file or directory: frontend`**  
You are inside `backendNew`. Use `cd ../frontend` (or `cd` to the repo root, then `cd frontend`).

**`npm` looks for `package.json` under `backendNew`**  
Same cause: run `npm` from the **`frontend`** directory, not `backendNew`.

---

## How to Use

1. Start the **backend** and **frontend** as above.
2. In the UI:
   - Choose **Upload & Rank PDFs** to upload candidate resumes as PDF files, or
   - Choose **Paste & Rank Text** to paste resume contents.
3. Paste the **job description**, set **Top K**, optionally enable **explanations**, and click **Rank Resumes**.

