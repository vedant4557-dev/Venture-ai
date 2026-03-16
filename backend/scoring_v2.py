"""
Enhanced Investment Scoring Engine (v2)
========================================
Upgrades the existing scoring.py with richer multi-dimensional scoring.
This file REPLACES scoring.py — it is backward compatible (same function signatures).

Enhancements:
- Integrates founder_analysis, startup_signals, and risk_engine scores
- More granular scoring dimensions
- IC-ready investment classification
- Weighted scoring model tuned to VC best practices
"""

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


# ── Scoring Weights (v2) ───────────────────────────────────────────────────────
# Revised based on empirical VC return analysis
# Market + Team = 50% of decision (classic VC thesis)
WEIGHTS_V2 = {
    "market_opportunity":       0.22,   # TAM, timing, growth rate
    "team_quality":             0.25,   # Founder scores from founder_analysis
    "product_differentiation":  0.18,   # Technical moat, uniqueness
    "traction_signals":         0.20,   # Revenue, growth, customers
    "risk_adjusted_score":      0.15,   # Inverted risk penalty
}

# Investment committee classification thresholds
IC_THRESHOLDS = {
    "STRONG_BUY":  8.5,   # Lead round, highest conviction
    "BUY":         7.0,   # Participate, co-invest
    "WATCH":       5.5,   # Monitor, request follow-on data
    "PASS":        4.0,   # Below threshold
    "HARD_PASS":   0.0,   # Fundamental issues
}


@dataclass
class EnhancedInvestmentScore:
    """
    Full investment scoring breakdown for IC presentation.
    Compatible with original InvestmentScore interface plus enriched data.
    """
    # Core dimensions (0–10)
    market_opportunity: float
    team_quality: float
    product_differentiation: float
    traction_signals: float
    risk_level: float           # Raw risk (higher = worse)

    # Extended dimensions (0–10)
    founder_score: float
    signal_score: float
    competitive_moat: float

    # Computed
    risk_adjusted_score: float  # 10 - risk_level
    overall: float              # Final weighted score

    # Classification
    grade: str                  # A+ to F
    ic_recommendation: str      # STRONG_BUY / BUY / WATCH / PASS / HARD_PASS
    verdict: str                # One-line IC verdict

    # Context
    score_confidence: str       # HIGH / MEDIUM / LOW (based on data quality)
    missing_data_flags: list[str]


def calculate_enhanced_score(
    # From existing ai_engine output
    market_size_score: float = 5.0,
    team_strength_score: float = 5.0,
    traction_score: float = 5.0,
    product_diff_score: float = 5.0,
    risk_score: float = 5.0,

    # From new modules (optional — degrades gracefully)
    founder_score: Optional[float] = None,
    signal_score: Optional[float] = None,
    competitive_moat: Optional[float] = None,

    # Data quality signal
    data_quality: str = "MEDIUM"
) -> EnhancedInvestmentScore:
    """
    Calculate enhanced investment score combining all intelligence modules.

    Args:
        market_size_score:    Market opportunity (0–10)
        team_strength_score:  Team quality from AI analysis (0–10)
        traction_score:       Traction evidence (0–10)
        product_diff_score:   Product differentiation (0–10)
        risk_score:           Overall risk level (0–10, higher = more risk)
        founder_score:        From founder_analysis module (optional)
        signal_score:         From startup_signals module (optional)
        competitive_moat:     Product moat strength (optional)
        data_quality:         Signal of how much data was available

    Returns:
        EnhancedInvestmentScore with full IC-ready breakdown.
    """
    missing_flags = []

    # ── Enrich scores with module data when available ──────────────────────────
    effective_team = team_strength_score
    if founder_score is not None:
        # Blend AI engine team score with dedicated founder analysis
        effective_team = (team_strength_score * 0.4) + (founder_score * 0.6)
    else:
        missing_flags.append("Founder intelligence module not run")

    effective_traction = traction_score
    if signal_score is not None:
        effective_traction = (traction_score * 0.5) + (signal_score * 0.5)
    else:
        missing_flags.append("Signal detection module not run")

    effective_product = product_diff_score
    if competitive_moat is not None:
        effective_product = (product_diff_score * 0.6) + (competitive_moat * 0.4)

    # ── Clamp all inputs to [0, 10] ────────────────────────────────────────────
    def clamp(v: float) -> float:
        return max(0.0, min(10.0, float(v)))

    market     = clamp(market_size_score)
    team       = clamp(effective_team)
    product    = clamp(effective_product)
    traction   = clamp(effective_traction)
    risk       = clamp(risk_score)
    risk_adj   = 10.0 - risk    # Invert: lower risk = higher score contribution

    # ── Weighted Score Calculation ─────────────────────────────────────────────
    overall = (
        market   * WEIGHTS_V2["market_opportunity"] +
        team     * WEIGHTS_V2["team_quality"] +
        product  * WEIGHTS_V2["product_differentiation"] +
        traction * WEIGHTS_V2["traction_signals"] +
        risk_adj * WEIGHTS_V2["risk_adjusted_score"]
    )
    overall = round(overall, 1)

    # ── Deal-breaker penalty ───────────────────────────────────────────────────
    # Severe risk can cap the overall score
    if risk >= 8.5:
        overall = min(overall, 5.0)
        logger.warning("Risk penalty applied: overall score capped at 5.0")

    # ── Classification ─────────────────────────────────────────────────────────
    grade, ic_rec, verdict = _classify_investment(overall, risk)

    # ── Confidence ────────────────────────────────────────────────────────────
    score_confidence = _assess_confidence(data_quality, missing_flags)

    return EnhancedInvestmentScore(
        market_opportunity=market,
        team_quality=team,
        product_differentiation=product,
        traction_signals=traction,
        risk_level=risk,
        founder_score=founder_score or team_strength_score,
        signal_score=signal_score or traction_score,
        competitive_moat=competitive_moat or product_diff_score,
        risk_adjusted_score=risk_adj,
        overall=overall,
        grade=grade,
        ic_recommendation=ic_rec,
        verdict=verdict,
        score_confidence=score_confidence,
        missing_data_flags=missing_flags
    )


def _classify_investment(score: float, risk: float) -> tuple[str, str, str]:
    """
    Map numeric score to grade, IC recommendation, and verdict string.
    Considers risk level in the verdict narrative.
    """
    risk_note = " despite elevated risk" if risk >= 7 else ""
    risk_note_neg = " with high risk profile" if risk >= 7 else ""

    if score >= 8.5:
        return "A+", "STRONG_BUY", f"Exceptional deal{risk_note} — lead round candidate"
    elif score >= 7.5:
        return "A",  "STRONG_BUY", f"High-conviction investment{risk_note} — advance to term sheet"
    elif score >= 7.0:
        return "A-", "BUY",        f"Strong opportunity{risk_note} — recommend IC approval"
    elif score >= 6.5:
        return "B+", "BUY",        f"Solid deal{risk_note_neg} — co-invest or follow-on position"
    elif score >= 5.5:
        return "B",  "WATCH",      f"Interesting but needs validation{risk_note_neg}"
    elif score >= 5.0:
        return "B-", "WATCH",      f"Below threshold{risk_note_neg} — revisit at next milestone"
    elif score >= 4.0:
        return "C",  "PASS",       f"Significant concerns{risk_note_neg} — recommend passing"
    elif score >= 2.5:
        return "D",  "PASS",       "Fundamental issues — pass"
    else:
        return "F",  "HARD_PASS",  "Hard pass — core investment thesis not established"


def _assess_confidence(data_quality: str, missing_flags: list[str]) -> str:
    """Determine confidence level based on data completeness."""
    if data_quality == "HIGH" and len(missing_flags) == 0:
        return "HIGH"
    elif len(missing_flags) >= 2 or data_quality == "LOW":
        return "LOW"
    return "MEDIUM"


# ── Backward Compatibility ─────────────────────────────────────────────────────
# Keep original process_scores interface so existing routes still work

def process_scores(raw_scores: dict):
    """
    BACKWARD COMPATIBLE wrapper for existing routes/analyze.py.
    Accepts the original raw_scores dict and returns an object with
    the same attributes as the original InvestmentScore dataclass.
    """
    return calculate_enhanced_score(
        market_size_score=raw_scores.get("market_size", 5.0),
        team_strength_score=raw_scores.get("team_strength", 5.0),
        traction_score=raw_scores.get("traction", 5.0),
        product_diff_score=raw_scores.get("product_differentiation", 5.0),
        risk_score=raw_scores.get("risk_level", 5.0),
    )
