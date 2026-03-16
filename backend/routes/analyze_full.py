"""
Extended Analysis Route — /api/analyze/full
============================================
New endpoint that runs ALL intelligence modules in parallel.
Does NOT modify the existing /api/analyze endpoint.
Additive route using FastAPI's router pattern.

Runs concurrently:
  1. PDF text extraction (existing)
  2. Core AI analysis (existing ai_engine)
  3. Founder Intelligence (new founder_analysis)
  4. Startup Signal Detection (new startup_signals)
  5. Risk Engine (new risk_engine)
  6. Enhanced scoring (scoring_v2)
"""

import asyncio
import logging
import time
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

# Existing modules (unchanged)
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf_parser import extract_text_from_pdf
from ai_engine import analyze_startup

# New intelligence modules
from founder_analysis import analyze_founders, founder_intelligence_to_dict
from startup_signals import detect_startup_signals, signals_to_dict
from risk_engine import analyze_risks, risk_report_to_dict
from scoring_v2 import calculate_enhanced_score

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/analyze/full",
    summary="Full AI Investment Intelligence Analysis",
    description="Runs all intelligence modules: founder analysis, signal detection, risk engine, and enhanced scoring."
)
async def full_analysis(file: UploadFile = File(...)):
    """
    Complete due diligence pipeline — runs all modules in parallel.

    Returns a comprehensive investment intelligence report suitable for IC presentation.
    """
    # ── Validation ─────────────────────────────────────────────────────────────
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 50MB.")

    # ── Step 1: Extract PDF Text ───────────────────────────────────────────────
    start_time = time.time()
    logger.info(f"Starting full analysis: {file.filename} ({len(file_bytes):,} bytes)")

    try:
        pitch_deck_text = extract_text_from_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── Step 2: Run All Intelligence Modules Concurrently ─────────────────────
    # Using asyncio.gather for parallel execution — reduces latency by ~3x
    try:
        core_analysis, founder_intel, startup_signals, risk_report = await asyncio.gather(
            analyze_startup(pitch_deck_text),
            analyze_founders(pitch_deck_text),
            detect_startup_signals(pitch_deck_text),
            analyze_risks(pitch_deck_text),
        )
    except Exception as e:
        logger.error(f"Intelligence module failure: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # ── Step 3: Enhanced Scoring ───────────────────────────────────────────────
    raw_scores = core_analysis.get("investment_score", {})

    enhanced_score = calculate_enhanced_score(
        market_size_score=raw_scores.get("market_size", 5.0),
        team_strength_score=raw_scores.get("team_strength", 5.0),
        traction_score=raw_scores.get("traction", 5.0),
        product_diff_score=raw_scores.get("product_differentiation", 5.0),
        risk_score=risk_report.overall_risk_score,             # Use risk engine score
        founder_score=founder_intel.founder_score,              # Use founder module
        signal_score=startup_signals.signal_score,             # Use signals module
        competitive_moat=raw_scores.get("product_differentiation", 5.0),
        data_quality=startup_signals.signal_quality
    )

    # ── Step 4: Assemble Response ──────────────────────────────────────────────
    elapsed = round(time.time() - start_time, 2)
    logger.info(f"Full analysis complete in {elapsed}s. Score: {enhanced_score.overall}/10 ({enhanced_score.grade})")

    response = {
        # ── Core Memo (from existing ai_engine) ──
        "company_overview":      core_analysis.get("company_overview", ""),
        "business_model":        core_analysis.get("business_model", ""),
        "market_analysis":       core_analysis.get("market_analysis", ""),
        "competitive_landscape": core_analysis.get("competitive_landscape", ""),
        "strengths":             core_analysis.get("strengths", []),
        "recommendation":        core_analysis.get("recommendation", ""),
        "key_questions":         core_analysis.get("key_questions", []),

        # ── Founder Intelligence (new) ──
        "founder_intelligence": founder_intelligence_to_dict(founder_intel),

        # ── Growth Signals (new) ──
        "startup_signals": signals_to_dict(startup_signals),

        # ── Risk Analysis (new) ──
        "risk_report": risk_report_to_dict(risk_report),

        # ── Enhanced Investment Score (upgraded) ──
        "investment_score": {
            "market_opportunity":       enhanced_score.market_opportunity,
            "team_quality":             enhanced_score.team_quality,
            "product_differentiation":  enhanced_score.product_differentiation,
            "traction_signals":         enhanced_score.traction_signals,
            "risk_level":               enhanced_score.risk_level,
            "founder_score":            enhanced_score.founder_score,
            "signal_score":             enhanced_score.signal_score,
            "overall":                  enhanced_score.overall,
            "grade":                    enhanced_score.grade,
            "ic_recommendation":        enhanced_score.ic_recommendation,
            "verdict":                  enhanced_score.verdict,
            "score_confidence":         enhanced_score.score_confidence,
            "missing_data_flags":       enhanced_score.missing_data_flags,
        },

        # ── Metadata ──
        "meta": {
            "file_name":      file.filename,
            "analysis_time_seconds": elapsed,
            "modules_run":    ["core_analysis", "founder_intelligence", "startup_signals", "risk_engine", "enhanced_scoring"],
            "api_version":    "2.0"
        }
    }

    return JSONResponse(content=response)


# ── Portfolio Preparation Routes (Future-Ready) ────────────────────────────────
# These stubs prepare the architecture for future portfolio features
# They return 501 with helpful messages until implemented

@router.get("/portfolio", summary="[Future] Portfolio monitoring")
async def portfolio_overview():
    return JSONResponse(
        status_code=501,
        content={"message": "Portfolio monitoring coming in v3.0", "status": "planned"}
    )


@router.get("/deal-flow", summary="[Future] Deal flow tracking")
async def deal_flow():
    return JSONResponse(
        status_code=501,
        content={"message": "Deal flow tracking coming in v3.0", "status": "planned"}
    )


@router.get("/lp-report", summary="[Future] LP reporting")
async def lp_report():
    return JSONResponse(
        status_code=501,
        content={"message": "LP reporting coming in v3.0", "status": "planned"}
    )
