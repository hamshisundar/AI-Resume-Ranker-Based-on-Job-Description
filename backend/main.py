from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from CVFilter.backend.api.auth import router as auth_router
from CVFilter.backend.api.history import router as history_router
from CVFilter.backend.api.jobs import router as jobs_router
from CVFilter.backend.api.rank import router as rank_router
from CVFilter.backend.core.database import init_db

app = FastAPI(title="Talent NEX AI Resume Ranker API", version="1.0.0")
init_db()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(127\.0\.0\.1|localhost)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(history_router)
app.include_router(jobs_router)
app.include_router(rank_router)


@app.get("/")
def home():
    return {"status": "ok", "service": "Talent NEX AI Resume Ranker API"}


@app.get("/health")
def health():
    return {"status": "ok"}

 