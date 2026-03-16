"""
Startup Signal Detection Engine
================================
Detects early-stage growth signals from pitch deck text.
Signals indicate momentum, product-market fit, and execution velocity.

This is a NEW module — does not modify any existing files.
Additive extension to the analysis pipeline.
"""

import json
import logging
import os
import re
from dataclasses import dataclass, asdict
from enum import Enum

import anthropic

logger = logging.getLogger(__name__)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


# ── Signal Categories ──────────────────────────────────────────────────────────

class SignalStrength(str, Enum):
    STRONG   = "STRONG"
    MODERATE = "MODERATE"
    WEAK     = "WEAK"
    ABSENT   = "ABSENT"


@dataclass
class GrowthSignal:
    """A single detected growth signal."""
    category: str           # e.g., "Traction", "Hiring", "Product", "Market"
    signal: str             # e.g., "3x YoY revenue growth mentioned"
    strength: str           # SignalStrength value
    evidence: str           # Direct quote or reference from the deck
    confidence: float       # 0–1, how confident in the detection


@dataclass
class StartupSignals:
    """Full signal intelligence report."""
    # Individual signal categories
    traction_signals: list[GrowthSignal]
    product_signals: list[GrowthSignal]
    market_signals: list[GrowthSignal]
    team_signals: list[GrowthSignal]
    financial_signals: list[GrowthSignal]

    # Aggregate assessments
    revenue_mentioned: bool
    revenue_growth_rate: str        # e.g., "3x YoY", "Unknown"
    user_count_mentioned: bool
    user_count: str                 # e.g., "50,000 MAU", "Unknown"
    key_customers_mentioned: list[str]
    partnerships_mentioned: list[str]

    # Scores
    traction_score: float           # 0–10
    momentum_score: float           # 0–10
    signal_score: float             # 0–10 composite

    # Narrative
    growth_momentum_assessment: str
    top_positive_signals: list[str]
    missing_signals: list[str]      # What's conspicuously absent
    signal_quality: str             # "Data-rich" / "Narrative-heavy" / "Sparse"


# ── Prompts ────────────────────────────────────────────────────────────────────

SIGNALS_SYSTEM_PROMPT = """You are a venture capital analyst specializing in identifying startup growth signals.
You can read between the lines of pitch decks and detect real momentum vs. marketing spin.
Be specific — cite actual evidence from the text. Flag when key signals are absent.
Respond ONLY with valid JSON."""

SIGNALS_PROMPT = """Analyze this startup pitch deck for growth signals and momentum indicators.

PITCH DECK TEXT:
{pitch_deck_text}

Return ONLY this JSON structure:

{{
  "traction_signals": [
    {{
      "category": "Traction",
      "signal": "MRR grew from $10K to $80K in 6 months",
      "strength": "STRONG",
      "evidence": "Exact quote or paraphrase from deck",
      "confidence": 0.9
    }}
  ],
  "product_signals": [],
  "market_signals": [],
  "team_signals": [],
  "financial_signals": [],
  "revenue_mentioned": true,
  "revenue_growth_rate": "8x in 6 months",
  "user_count_mentioned": true,
  "user_count": "12,000 active users",
  "key_customers_mentioned": ["Enterprise customer 1", "Notable client"],
  "partnerships_mentioned": ["Strategic partner"],
  "traction_score": 7.5,
  "momentum_score": 8.0,
  "signal_score": 7.8,
  "growth_momentum_assessment": "Strong early traction with enterprise validation. Revenue trajectory is compelling but cohort data is absent.",
  "top_positive_signals": [
    "Specific positive signal 1",
    "Specific positive signal 2"
  ],
  "missing_signals": [
    "No churn/retention data",
    "No unit economics mentioned"
  ],
  "signal_quality": "Data-rich"
}}

Signal strength definitions:
- STRONG: Specific metrics with clear upward trajectory
- MODERATE: Evidence of progress but limited specifics  
- WEAK: Vague claims without data backing
- ABSENT: Category not addressed in deck

Signal quality:
- "Data-rich": Multiple specific metrics, clear KPIs
- "Narrative-heavy": Good story but few hard numbers
- "Sparse": Very limited traction information

Score traction 0-10: 10=hypergrowth with enterprise customers; 5=early revenue/users; 1=idea stage
Score momentum 0-10: 10=accelerating on all dimensions; 5=stable progress; 1=no visible momentum"""


async def detect_startup_signals(pitch_deck_text: str) -> StartupSignals:
    """
    Detect and score startup growth signals from pitch deck text.

    Args:
        pitch_deck_text: Full extracted text from the pitch deck.

    Returns:
        StartupSignals with categorized signals and composite scores.
    """
    truncated = pitch_deck_text[:80_000]

    try:
        logger.info("Running startup signal detection...")
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=SIGNALS_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": SIGNALS_PROMPT.format(pitch_deck_text=truncated)
            }]
        )

        raw = message.content[0].text
        data = _parse_response(raw)
        return _build_signals(data)

    except Exception as e:
        logger.error(f"Signal detection failed: {e}")
        return _fallback_signals()


def _parse_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in signals response")
    return json.loads(match.group())


def _build_signal_list(raw_list: list) -> list[GrowthSignal]:
    """Convert raw dict list to GrowthSignal objects."""
    signals = []
    for item in raw_list:
        signals.append(GrowthSignal(
            category=item.get("category", "Unknown"),
            signal=item.get("signal", ""),
            strength=item.get("strength", SignalStrength.ABSENT),
            evidence=item.get("evidence", ""),
            confidence=float(item.get("confidence", 0.5))
        ))
    return signals


def _build_signals(data: dict) -> StartupSignals:
    return StartupSignals(
        traction_signals=_build_signal_list(data.get("traction_signals", [])),
        product_signals=_build_signal_list(data.get("product_signals", [])),
        market_signals=_build_signal_list(data.get("market_signals", [])),
        team_signals=_build_signal_list(data.get("team_signals", [])),
        financial_signals=_build_signal_list(data.get("financial_signals", [])),
        revenue_mentioned=bool(data.get("revenue_mentioned", False)),
        revenue_growth_rate=data.get("revenue_growth_rate", "Unknown"),
        user_count_mentioned=bool(data.get("user_count_mentioned", False)),
        user_count=data.get("user_count", "Unknown"),
        key_customers_mentioned=data.get("key_customers_mentioned", []),
        partnerships_mentioned=data.get("partnerships_mentioned", []),
        traction_score=float(data.get("traction_score", 5.0)),
        momentum_score=float(data.get("momentum_score", 5.0)),
        signal_score=float(data.get("signal_score", 5.0)),
        growth_momentum_assessment=data.get("growth_momentum_assessment", ""),
        top_positive_signals=data.get("top_positive_signals", []),
        missing_signals=data.get("missing_signals", []),
        signal_quality=data.get("signal_quality", "Sparse")
    )


def _fallback_signals() -> StartupSignals:
    return StartupSignals(
        traction_signals=[], product_signals=[], market_signals=[],
        team_signals=[], financial_signals=[],
        revenue_mentioned=False, revenue_growth_rate="Unknown",
        user_count_mentioned=False, user_count="Unknown",
        key_customers_mentioned=[], partnerships_mentioned=[],
        traction_score=5.0, momentum_score=5.0, signal_score=5.0,
        growth_momentum_assessment="Signal analysis unavailable. Manual review required.",
        top_positive_signals=[], missing_signals=["Analysis failed"],
        signal_quality="Sparse"
    )


def signals_to_dict(signals: StartupSignals) -> dict:
    """Serialize StartupSignals to JSON-safe dict."""
    return asdict(signals)
