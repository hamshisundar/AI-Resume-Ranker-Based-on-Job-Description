from pydantic import BaseModel, Field, model_validator


class RankRequest(BaseModel):
    jd: str = Field(..., min_length=1, description="Job description text")
    cvs: list[str] = Field(..., min_length=1, description="List of CV/resume texts")
    resume_labels: list[str] | None = Field(
        default=None,
        description="Optional display names (same length as cvs), e.g. resume titles or filenames",
    )

    @model_validator(mode="after")
    def labels_len_matches(self) -> "RankRequest":
        if self.resume_labels is not None and len(self.resume_labels) != len(self.cvs):
            raise ValueError("resume_labels must have the same length as cvs")
        return self

