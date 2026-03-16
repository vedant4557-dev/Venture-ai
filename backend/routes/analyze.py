"""
/api/analyze Route
Orchestrates the full due diligence pipeline:
  1. Receive PDF upload
  2. Extract text via pdf_parser
  3. Analyze via ai_engine
  4. Process scores via scoring
  5. Return structured investment memo
"""

import logging
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import our internal modules
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf_parser import extract_text_from_pdf
from ai_engine import analyze_startup
from scoring import process_scores

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Response Schema ────────────────────────────────────────────────────────────
class InvestmentScoreResponse(BaseModel):
    market_size: float
    team_strength: float
    traction: float
    product_differentiation: float
    risk_level: float
    overall: float
    grade: str
    verdict: str


class AnalysisResponse(BaseModel):
    company_overview: str
    business_model: str
    market_analysis: str
    competitive_landscape: str
    strengths: list[str]
    risks: list[str]
    team_assessment: str
    traction_metrics: str
    recommendation: str
    investment_score: InvestmentScoreResponse
    key_questions: list[str]


# ── Endpoint ───────────────────────────────────────────────────────────────────
@router.post("/analyze", response_model=AnalysisResponse, summary="Analyze a startup pitch deck")
async def analyze_pitch_deck(file: UploadFile = File(...)):
    """
    Upload a PDF pitch deck and receive an AI-generated investment memo.

    - **file**: PDF file (max 50MB recommended)
    - Returns a full investment memo with scoring across 5 dimensions.
    """
    # ── Validation ─────────────────────────────────────────────────────────────
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")

    # ── Step 1: Extract Text ───────────────────────────────────────────────────
    logger.info(f"Processing PDF: {file.filename} ({len(file_bytes):,} bytes)")
    try:
        pitch_deck_text = extract_text_from_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── Step 2: AI Analysis ────────────────────────────────────────────────────
    try:
        analysis = await analyze_startup(pitch_deck_text)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ── Step 3: Process Scores ─────────────────────────────────────────────────
    raw_scores = analysis.get("investment_score", {})
    processed_score = process_scores(raw_scores)

    # ── Step 4: Build Response ─────────────────────────────────────────────────
    response = {
        "company_overview": analysis.get("company_overview", ""),
        "business_model": analysis.get("business_model", ""),
        "market_analysis": analysis.get("market_analysis", ""),
        "competitive_landscape": analysis.get("competitive_landscape", ""),
        "strengths": analysis.get("strengths", []),
        "risks": analysis.get("risks", []),
        "team_assessment": analysis.get("team_assessment", ""),
        "traction_metrics": analysis.get("traction_metrics", ""),
        "recommendation": analysis.get("recommendation", ""),
        "investment_score": {
            "market_size": processed_score.market_size,
            "team_strength": processed_score.team_strength,
            "traction": processed_score.traction,
            "product_differentiation": processed_score.product_differentiation,
            "risk_level": processed_score.risk_level,
            "overall": processed_score.overall,
            "grade": processed_score.grade,
            "verdict": processed_score.verdict,
        },
        "key_questions": analysis.get("key_questions", []),
    }

    logger.info(f"Analysis complete. Overall score: {processed_score.overall}/10 ({processed_score.grade})")
    return JSONResponse(content=response)
