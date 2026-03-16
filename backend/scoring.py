"""
Investment Scoring Module
Processes and validates the raw scoring data returned by the AI engine.
Provides normalization, weighted scoring, and grade classification.
"""

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ── Scoring Weights ────────────────────────────────────────────────────────────
# These weights reflect standard VC evaluation priorities
WEIGHTS = {
    "market_size": 0.25,          # Largest driver — a big market forgives many sins
    "team_strength": 0.25,         # Team is everything at early stage
    "traction": 0.20,              # Proof of demand reduces risk
    "product_differentiation": 0.20,  # Defensibility matters for returns
    "risk_level": 0.10,            # Inverted: higher risk → lower contribution
}


@dataclass
class InvestmentScore:
    market_size: float
    team_strength: float
    traction: float
    product_differentiation: float
    risk_level: float
    overall: float
    grade: str
    verdict: str


def process_scores(raw_scores: dict) -> InvestmentScore:
    """
    Validate, normalize, and enrich the raw scores from the AI engine.

    Args:
        raw_scores: Dictionary with keys matching WEIGHTS plus 'overall'.

    Returns:
        InvestmentScore dataclass with all dimensions, overall score, and grade.
    """
    dimensions = ["market_size", "team_strength", "traction", "product_differentiation", "risk_level"]

    # Clamp all scores to [0, 10] range — AI can occasionally drift out of bounds
    clamped = {}
    for dim in dimensions:
        raw_val = raw_scores.get(dim, 5)
        try:
            clamped[dim] = max(0.0, min(10.0, float(raw_val)))
        except (TypeError, ValueError):
            logger.warning(f"Invalid score for '{dim}': {raw_val}. Defaulting to 5.")
            clamped[dim] = 5.0

    # Recalculate overall as a weighted score (risk is inverted: high risk = lower score)
    overall = (
        clamped["market_size"] * WEIGHTS["market_size"] +
        clamped["team_strength"] * WEIGHTS["team_strength"] +
        clamped["traction"] * WEIGHTS["traction"] +
        clamped["product_differentiation"] * WEIGHTS["product_differentiation"] +
        (10 - clamped["risk_level"]) * WEIGHTS["risk_level"]
    )
    overall = round(overall, 1)

    grade, verdict = _classify(overall)

    return InvestmentScore(
        market_size=clamped["market_size"],
        team_strength=clamped["team_strength"],
        traction=clamped["traction"],
        product_differentiation=clamped["product_differentiation"],
        risk_level=clamped["risk_level"],
        overall=overall,
        grade=grade,
        verdict=verdict,
    )


def _classify(score: float) -> tuple[str, str]:
    """
    Map a numeric score to an investment grade and one-line verdict.

    Grades follow a standard investment committee framework:
    - A: Strong conviction — lead or co-lead
    - B: Interesting — request more info / follow-on
    - C: Watchlist — revisit at a later stage
    - D/F: Pass — fundamental issues
    """
    if score >= 8.5:
        return "A+", "Exceptional opportunity — strong conviction to invest"
    elif score >= 7.5:
        return "A", "High-quality deal — recommend advancing to IC"
    elif score >= 6.5:
        return "B+", "Solid opportunity with some risks — worth deeper diligence"
    elif score >= 5.5:
        return "B", "Interesting but needs more validation — request follow-up"
    elif score >= 4.5:
        return "C+", "Borderline — revisit at next funding milestone"
    elif score >= 3.5:
        return "C", "Below threshold — watchlist only"
    elif score >= 2.0:
        return "D", "Significant concerns — recommend passing"
    else:
        return "F", "Fundamental issues — hard pass"
