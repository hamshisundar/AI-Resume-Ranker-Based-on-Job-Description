import re

from cvfilter.utils.constants import GENDER_WORDS, SKILLS


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
    if "phd" in t or "doctorate" in t:
        score = max(score, 3)
    if "master" in t or "msc" in t or "m.sc" in t or "mba" in t:
        score = max(score, 2)
    if "bachelor" in t or "bsc" in t or "b.sc" in t or "degree" in t:
        score = max(score, 1)
    return score
