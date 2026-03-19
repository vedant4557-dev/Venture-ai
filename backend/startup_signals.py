"""
Startup Signal Detection Engine - Gemini Version
"""

import json
import logging
import os
import re
from dataclasses import dataclass, asdict
import google.generativeai as genai

logger = logging.getLogger(__name__)
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


@dataclass
class GrowthSignal:
    category: str
    signal: str
    strength: str
    evidence: str
    confidence: float


@dataclass
class StartupSignals:
    traction_signals: list[GrowthSignal]
    product_signals: list[GrowthSignal]
    market_signals: list[GrowthSignal]
    team_signals: list[GrowthSignal]
    financial_signals: list[GrowthSignal]
    revenue_mentioned: bool
    revenue_growth_rate: str
    user_count_mentioned: bool
    user_count: str
    key_customers_mentioned: list[str]
    partnerships_mentioned: list[str]
    traction_score: float
    momentum_score: float
    signal_score: float
    growth_momentum_assessment: str
    top_positive_signals: list[str]
    missing_signals: list[str]
    signal_quality: str


SIGNALS_PROMPT = """You are a VC analyst identifying startup growth signals. Analyze this pitch deck and return ONLY valid JSON.

PITCH DECK TEXT:
{pitch_deck_text}

Return ONLY this JSON structure:

{{
  "traction_signals": [
    {{
      "category": "Traction",
      "signal": "description",
      "strength": "STRONG | MODERATE | WEAK | ABSENT",
      "evidence": "evidence from deck",
      "confidence": 0.9
    }}
  ],
  "product_signals": [],
  "market_signals": [],
  "team_signals": [],
  "financial_signals": [],
  "revenue_mentioned": true,
  "revenue_growth_rate": "3x YoY",
  "user_count_mentioned": true,
  "user_count": "12,000 active users",
  "key_customers_mentioned": ["Customer 1"],
  "partnerships_mentioned": ["Partner 1"],
  "traction_score": 7.5,
  "momentum_score": 8.0,
  "signal_score": 7.8,
  "growth_momentum_assessment": "Assessment of growth momentum",
  "top_positive_signals": ["Signal 1", "Signal 2"],
  "missing_signals": ["Missing data point 1"],
  "signal_quality": "Data-rich | Narrative-heavy | Sparse"
}}

Return ONLY the JSON. No additional text."""


async def detect_startup_signals(pitch_deck_text: str) -> StartupSignals:
    truncated = pitch_deck_text[:80_000]
    try:
        logger.info("Running startup signal detection with Gemini...")
        response = model.generate_content(
            SIGNALS_PROMPT.format(pitch_deck_text=truncated)
        )
        data = _parse_response(response.text)
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
    signals = []
    for item in raw_list:
        signals.append(GrowthSignal(
            category=item.get("category", "Unknown"),
            signal=item.get("signal", ""),
            strength=item.get("strength", "ABSENT"),
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
        growth_momentum_assessment="Signal analysis unavailable.",
        top_positive_signals=[], missing_signals=["Analysis failed"],
        signal_quality="Sparse"
    )


def signals_to_dict(signals: StartupSignals) -> dict:
    return asdict(signals)
