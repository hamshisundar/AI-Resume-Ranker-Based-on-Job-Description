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
    - `POST /rank` – rank plain‑text resumes.
    - `POST /rank_pdf` – rank uploaded PDF resumes.
- **frontend** – React + Vite UI:
  - Upload multiple PDF resumes or paste resume text.
  - Sends requests to the backend and shows ranked results and feature explanations.

---

## Quick Start

### 1. Backend (Flask API)

```bash
cd backendNew

# (optional) create virtual env
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

The API runs on `http://127.0.0.1:5000` by default.  
Check health:

```bash
curl http://127.0.0.1:5000/health
```

### 2. Frontend (React/Vite)

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`) in your browser.  
The frontend uses `VITE_API_BASE_URL` (or falls back to `http://127.0.0.1:5000`) to talk to the backend.

---

## How to Use

1. Start the **backend** and **frontend** as above.
2. In the UI:
   - Choose **Upload & Rank PDFs** to upload candidate resumes as PDF files, or
   - Choose **Paste & Rank Text** to paste resume contents.
3. Paste the **job description**, set **Top K**, optionally enable **explanations**, and click **Rank Resumes**.

