from pydantic import BaseModel, Field


class RankedCandidate(BaseModel):
    candidate_id: int
    score: float
    explanation: list[str] = Field(default_factory=list)
    name: str | None = None
    lexical_overlap_100: int = 0
    skills_coverage_100: int = 0
    jd_keyword_hits: list[str] = Field(default_factory=list)
    jd_keyword_total: int = 0
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    extra_skills_in_cv: list[str] = Field(default_factory=list)
    score_breakdown: dict[str, float] = Field(default_factory=dict)
    gap_notes: list[str] = Field(default_factory=list)
    executive_summary: str = ""
    experience_hint: str | None = None
    education_hint: str | None = None
    role_focus_line: str | None = None


class RankResponse(BaseModel):
    jd_preview: str = ""
    results: list[RankedCandidate]
    history_id: int | None = None


class RankPdfResponse(BaseModel):
    jd_preview: str = ""
    results: list[RankedCandidate]
    processed_files: int
    file_errors: list[dict[str, str]]
    history_id: int | None = None
