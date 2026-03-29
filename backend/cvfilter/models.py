from datetime import datetime

from cvfilter.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class RankingSession(db.Model):
    """Saved ranking run for history / re-analysis in the UI."""

    __tablename__ = "ranking_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    mode = db.Column(db.String(16), nullable=False)  # "text" | "pdf"
    jd_preview = db.Column(db.String(600), nullable=False)
    jd_text = db.Column(db.Text, nullable=False)
    resume_count = db.Column(db.Integer, nullable=False, default=0)
    top_score = db.Column(db.Integer, nullable=False, default=0)
    payload_json = db.Column(db.JSON, nullable=False)

    user = db.relationship("User", backref=db.backref("ranking_sessions", lazy="dynamic"))
