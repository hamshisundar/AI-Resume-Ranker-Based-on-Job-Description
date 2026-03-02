import os
import re
import io
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify

import pdfplumber  # pip install pdfplumber


# -----------------------------
# Config / paths
# -----------------------------
ARTIFACTS_DIR = os.environ.get("ARTIFACTS_DIR", "./artifacts_ranker")

MODEL_PATH   = os.path.join(ARTIFACTS_DIR, "lgbm_ranker.pkl")
FEATS_PATH   = os.path.join(ARTIFACTS_DIR, "feature_names.pkl")
PAIRVEC_PATH = os.path.join(ARTIFACTS_DIR, "pair_tfidf_vectorizer.pkl")
JDVEC_PATH   = os.path.join(ARTIFACTS_DIR, "jd_vectorizer.pkl")
CONFIG_PATH  = os.path.join(ARTIFACTS_DIR, "config.json")


# -----------------------------
# Flask app (MUST be defined before decorators)
# -----------------------------
app = Flask(__name__)

# Simple CORS (no flask-cors dependency)
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# -----------------------------
# Skills list (same as training)
# -----------------------------
SKILLS = {
    "python","java","c#","c++","javascript","typescript","react","react native","flutter",
    "node","express","sql","mysql","postgresql","mongodb","firebase",
    "aws","azure","docker","kubernetes","linux","git",
    "machine learning","deep learning","nlp","computer vision",
    "pandas","numpy","tensorflow","pytorch","api","rest"
}
GENDER_WORDS = ["he","she","his","her","hers","him","mr","mrs","miss","ms","sir","madam"]


# -----------------------------
# Load artifacts
# -----------------------------
for p in [MODEL_PATH, FEATS_PATH, PAIRVEC_PATH, JDVEC_PATH]:
    if not os.path.exists(p):
        raise FileNotFoundError(f"Missing artifact: {p}")

ranker = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATS_PATH)
pair_vec = joblib.load(PAIRVEC_PATH)
jd_vectorizer = joblib.load(JDVEC_PATH)
jd_terms = np.array(jd_vectorizer.get_feature_names_out())

TOPN_JD_TERMS = 25
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, "r") as f:
            cfg = json.load(f)
        TOPN_JD_TERMS = int(cfg.get("topn_jd_terms", TOPN_JD_TERMS))
    except Exception:
        pass


# -----------------------------
# Utils (match training)
# -----------------------------
def clean_text(t: str) -> str:
    t = str(t).lower()
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", " email ", t)
    t = re.sub(r"\b(\+?\d[\d \-\(\)]{7,}\d)\b", " phone ", t)
    for w in GENDER_WORDS:
        t = re.sub(rf"\b{re.escape(w)}\b", " ", t)
    t = re.sub(r"[^a-z0-9\+\#\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def extract_skills(text: str):
    t = text.lower()
    return {s for s in SKILLS if s in t}

def experience_years(text: str) -> int:
    m = re.findall(r"(\d+)\s*(?:\+?\s*)?(?:years|year|yrs|yr)\b", text.lower())
    return int(max([int(x) for x in m])) if m else 0

def education_score(text: str) -> int:
    t = text.lower()
    score = 0
    if "phd" in t or "doctorate" in t: score = max(score, 3)
    if "master" in t or "msc" in t or "m.sc" in t or "mba" in t: score = max(score, 2)
    if "bachelor" in t or "bsc" in t or "b.sc" in t or "degree" in t: score = max(score, 1)
    return score

def get_jd_top_terms(jd_clean: str, topn: int = TOPN_JD_TERMS):
    v = jd_vectorizer.transform([jd_clean]).toarray().ravel()
    if v.sum() == 0:
        return []
    idx = v.argsort()[-topn:][::-1]
    return [jd_terms[i] for i in idx if v[i] > 0]

def keyword_coverage(resume_clean: str, terms):
    if not terms:
        return 0.0
    t = resume_clean.lower()
    hit = sum(1 for term in terms if term in t)
    return hit / len(terms)

def build_feature_df(jd_text: str, resumes: list):
    jd_clean = clean_text(jd_text)
    jd_len = len(jd_clean)

    jd_skills = extract_skills(jd_clean)
    jd_years = experience_years(jd_clean)
    jd_edu = education_score(jd_clean)
    jd_top = get_jd_top_terms(jd_clean)

    resume_ids = []
    resume_clean = []
    for r in resumes:
        resume_ids.append(r.get("resume_id", None))
        resume_clean.append(clean_text(r.get("resume_text", "")))

    # TF-IDF similarity in batch
    R = pair_vec.transform(resume_clean)
    J = pair_vec.transform([jd_clean])
    tfidf_sim = (R @ J.T).toarray().ravel().astype(float)

    skill_overlap = []
    keyword_cov = []
    years_gap = []
    edu_gap = []
    len_resume = []

    for rtxt in resume_clean:
        r_sk = extract_skills(rtxt)
        if len(jd_skills) == 0:
            skill_overlap.append(0.0)
        else:
            skill_overlap.append(len(r_sk.intersection(jd_skills)) / len(jd_skills))

        keyword_cov.append(keyword_coverage(rtxt, jd_top))
        years_gap.append(experience_years(rtxt) - jd_years)
        edu_gap.append(education_score(rtxt) - jd_edu)
        len_resume.append(len(rtxt))

    feat = pd.DataFrame({
        "tfidf_sim": tfidf_sim,
        "len_resume": np.array(len_resume, dtype=float),
        "len_jd": np.array([jd_len] * len(resume_clean), dtype=float),
        "skill_overlap": np.array(skill_overlap, dtype=float),
        "keyword_cov": np.array(keyword_cov, dtype=float),
        "years_gap": np.array(years_gap, dtype=float),
        "edu_gap": np.array(edu_gap, dtype=float),
    })

    X_df = feat[feature_names].copy()
    meta = [{"resume_id": resume_ids[i]} for i in range(len(resume_ids))]
    return X_df, meta

def extract_text_from_pdf_bytes(pdf_bytes: bytes, max_pages: int = 5) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages[:max_pages]:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts).strip()


# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/rank", methods=["POST", "OPTIONS"])
def rank_endpoint():
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(force=True, silent=True) or {}
    jd_text = data.get("jd_text", "")
    resumes = data.get("resumes", [])
    top_k = int(data.get("top_k", 10))
    explain = bool(data.get("explain", False))

    if not isinstance(jd_text, str) or jd_text.strip() == "":
        return jsonify({"error": "jd_text is required"}), 400
    if not isinstance(resumes, list) or len(resumes) == 0:
        return jsonify({"error": "resumes must be a non-empty list"}), 400

    X_df, meta = build_feature_df(jd_text, resumes)

    scores = np.array(ranker.predict(X_df), dtype=float)
    order = np.argsort(scores)[::-1][:min(top_k, len(scores))]

    out = {
        "top_k": top_k,
        "results": [{"resume_id": meta[i]["resume_id"], "score": float(scores[i])} for i in order]
    }

    if explain:
        contrib = np.array(ranker.predict(X_df, pred_contrib=True))  # (n, f+1)
        explanations = []
        for i in order:
            row = contrib[i, :-1]
            top_idx = np.argsort(-np.abs(row))[:5]
            explanations.append({
                "resume_id": meta[i]["resume_id"],
                "top_contributors": [
                    {"feature": feature_names[j], "contribution": float(row[j])}
                    for j in top_idx
                ]
            })
        out["explanations"] = explanations

    return jsonify(out)

@app.route("/rank_pdf", methods=["POST", "OPTIONS"])
def rank_pdf_endpoint():
    if request.method == "OPTIONS":
        return ("", 204)

    jd_text = (request.form.get("jd_text") or "").strip()
    top_k = int(request.form.get("top_k", "10"))
    explain = (request.form.get("explain", "false").lower() in ["true", "1", "yes"])

    if not jd_text:
        return jsonify({"error": "jd_text is required (form-data field)"}), 400

    if "files" not in request.files:
        return jsonify({"error": "No files uploaded. Use form-data key 'files'"}), 400

    files = request.files.getlist("files")
    resumes = []
    errors = []

    for f in files:
        filename = f.filename or "unknown.pdf"
        if not filename.lower().endswith(".pdf"):
            errors.append({"file": filename, "error": "Only .pdf supported"})
            continue

        pdf_bytes = f.read()
        if not pdf_bytes:
            errors.append({"file": filename, "error": "Empty file"})
            continue

        try:
            text = extract_text_from_pdf_bytes(pdf_bytes, max_pages=5)
            if not text:
                errors.append({"file": filename, "error": "No text extracted (maybe scanned PDF)"})
                continue
            resumes.append({"resume_id": filename, "resume_text": text})
        except Exception as e:
            errors.append({"file": filename, "error": str(e)})

    if not resumes:
        return jsonify({"error": "No valid PDFs processed", "file_errors": errors}), 400

    X_df, meta = build_feature_df(jd_text, resumes)
    scores = np.array(ranker.predict(X_df), dtype=float)
    order = np.argsort(scores)[::-1][:min(top_k, len(scores))]

    out = {
        "top_k": top_k,
        "processed_files": len(resumes),
        "file_errors": errors,
        "results": [{"resume_id": meta[i]["resume_id"], "score": float(scores[i])} for i in order],
    }

    if explain:
        contrib = np.array(ranker.predict(X_df, pred_contrib=True))
        explanations = []
        for i in order:
            row = contrib[i, :-1]
            top_idx = np.argsort(-np.abs(row))[:5]
            explanations.append({
                "resume_id": meta[i]["resume_id"],
                "top_contributors": [
                    {"feature": feature_names[j], "contribution": float(row[j])}
                    for j in top_idx
                ]
            })
        out["explanations"] = explanations

    return jsonify(out)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)