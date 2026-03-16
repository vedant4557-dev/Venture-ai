"""
Database Models
SQLAlchemy ORM models for persisting analysis results.
Currently optional for MVP — set DATABASE_URL env var to activate.

Schema:
  - analyses: One record per pitch deck analysis
  - analysis_scores: Linked scoring breakdown per analysis
"""

from datetime import datetime, UTC
from sqlalchemy import (
    Column, String, Float, Integer, Text, DateTime,
    ForeignKey, JSON, create_engine
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker
from sqlalchemy.dialects.postgresql import UUID
import uuid
import os


# ── Base ───────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Models ─────────────────────────────────────────────────────────────────────

class Analysis(Base):
    """
    Stores the full investment memo generated for a single pitch deck upload.
    """
    __tablename__ = "analyses"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Source document metadata
    file_name = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)

    # AI-generated memo fields
    company_overview = Column(Text, nullable=True)
    business_model = Column(Text, nullable=True)
    market_analysis = Column(Text, nullable=True)
    competitive_landscape = Column(Text, nullable=True)
    team_assessment = Column(Text, nullable=True)
    traction_metrics = Column(Text, nullable=True)
    recommendation = Column(String(512), nullable=True)

    # Lists stored as JSON arrays
    strengths = Column(JSON, default=list)
    risks = Column(JSON, default=list)
    key_questions = Column(JSON, default=list)

    # Relationship to scoring breakdown
    score = relationship("AnalysisScore", back_populates="analysis", uselist=False)

    def __repr__(self):
        return f"<Analysis id={self.id} file={self.file_name}>"


class AnalysisScore(Base):
    """
    Normalized scoring breakdown linked to an Analysis record.
    Stored separately to allow easy filtering and ranking queries.
    """
    __tablename__ = "analysis_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(
        UUID(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Dimension scores (0.0–10.0)
    market_size = Column(Float, nullable=False, default=5.0)
    team_strength = Column(Float, nullable=False, default=5.0)
    traction = Column(Float, nullable=False, default=5.0)
    product_differentiation = Column(Float, nullable=False, default=5.0)
    risk_level = Column(Float, nullable=False, default=5.0)

    # Computed fields
    overall = Column(Float, nullable=False, default=5.0)
    grade = Column(String(4), nullable=True)
    verdict = Column(String(256), nullable=True)

    analysis = relationship("Analysis", back_populates="score")

    def __repr__(self):
        return f"<AnalysisScore overall={self.overall} grade={self.grade}>"


# ── Database Engine Factory ────────────────────────────────────────────────────

def get_engine(database_url: str | None = None):
    """
    Create a SQLAlchemy engine from DATABASE_URL environment variable.
    Returns None if DATABASE_URL is not set (DB is optional for MVP).
    """
    url = database_url or os.environ.get("DATABASE_URL")
    if not url:
        return None
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


def get_session_factory(engine):
    """Return a configured session factory bound to the given engine."""
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db(engine):
    """Create all tables if they don't exist. Safe to call on every startup."""
    Base.metadata.create_all(bind=engine)
