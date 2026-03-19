"""
Risk Detection Engine - Gemini Version
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
class RiskItem:
    category: str
    title: str
    description: str
    severity: str
    evidence: str
    mitigation_possible: bool
    mitigation_note: str


@dataclass
class RiskReport:
    risks: list[RiskItem]
    market_risk_summary: str
    regulatory_risk_summary: str
    competitive_risk_summary: str
    team_risk_summary: str
    financial_risk_summary: str
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    market_risk_score: float
    regulatory_risk_score: float
    competitive_risk_score: float
    execution_risk_score: float
    overall_risk_score: float
    biggest_risk: str
    risk_verdict: str
    due_diligence_flags: list[str]
    deal_breakers: list[str]


RISK_PROMPT = """You are a VC risk analyst. Conduct a comprehensive risk analysis of this startup pitch deck and return ONLY valid JSON.

PITCH DECK TEXT:
{pitch_deck_text}

Return ONLY this exact JSON structure:

{{
  "risks": [
    {{
      "category": "Regulatory Risk",
      "title": "Short risk title",
      "description": "Detailed explanation",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "evidence": "What in the deck triggered this",
      "mitigation_possible": true,
      "mitigation_note": "How it could be mitigated"
    }}
  ],
  "market_risk_summary": "Summary of market risks",
  "regulatory_risk_summary": "Summary of regulatory risks",
  "competitive_risk_summary": "Summary of competitive risks",
  "team_risk_summary": "Summary of team risks",
  "financial_risk_summary": "Summary of financial risks",
  "critical_risk_count": 1,
  "high_risk_count": 2,
  "medium_risk_count": 3,
  "low_risk_count": 2,
  "market_risk_score": 4.0,
  "regulatory_risk_score": 7.0,
  "competitive_risk_score": 5.0,
  "execution_risk_score": 4.5,
  "overall_risk_score": 5.2,
  "biggest_risk": "The single most important risk",
  "risk_verdict": "MANAGEABLE | ELEVATED | SEVERE",
  "due_diligence_flags": ["Question to ask before investing"],
  "deal_breakers": []
}}

Return ONLY the JSON. No additional text."""


async def analyze_risks(pitch_deck_text: str) -> RiskReport:
    truncated = pitch_deck_text[:80_000]
    try:
        logger.info("Running risk detection with Gemini...")
        response = model.generate_content(
            RISK_PROMPT.format(pitch_deck_text=truncated)
        )
        data = _parse_response(response.text)
        return _build_risk_report(data)
    except Exception as e:
        logger.error(f"Risk analysis failed: {e}")
        return _fallback_risk_report()


def _parse_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in risk analysis response")
    return json.loads(match.group())


def _build_risk_report(data: dict) -> RiskReport:
    risks = []
    for r in data.get("risks", []):
        risks.append(RiskItem(
            category=r.get("category", "Unknown Risk"),
            title=r.get("title", "Unnamed Risk"),
            description=r.get("description", ""),
            severity=r.get("severity", "MEDIUM"),
            evidence=r.get("evidence", ""),
            mitigation_possible=bool(r.get("mitigation_possible", True)),
            mitigation_note=r.get("mitigation_note", "")
        ))
    return RiskReport(
        risks=risks,
        market_risk_summary=data.get("market_risk_summary", ""),
        regulatory_risk_summary=data.get("regulatory_risk_summary", ""),
        competitive_risk_summary=data.get("competitive_risk_summary", ""),
        team_risk_summary=data.get("team_risk_summary", ""),
        financial_risk_summary=data.get("financial_risk_summary", ""),
        critical_risk_count=int(data.get("critical_risk_count", 0)),
        high_risk_count=int(data.get("high_risk_count", 0)),
        medium_risk_count=int(data.get("medium_risk_count", 0)),
        low_risk_count=int(data.get("low_risk_count", 0)),
        market_risk_score=float(data.get("market_risk_score", 5.0)),
        regulatory_risk_score=float(data.get("regulatory_risk_score", 5.0)),
        competitive_risk_score=float(data.get("competitive_risk_score", 5.0)),
        execution_risk_score=float(data.get("execution_risk_score", 5.0)),
        overall_risk_score=float(data.get("overall_risk_score", 5.0)),
        biggest_risk=data.get("biggest_risk", ""),
        risk_verdict=data.get("risk_verdict", "ELEVATED"),
        due_diligence_flags=data.get("due_diligence_flags", []),
        deal_breakers=data.get("deal_breakers", [])
    )


def _fallback_risk_report() -> RiskReport:
    return RiskReport(
        risks=[], market_risk_summary="Analysis unavailable",
        regulatory_risk_summary="Analysis unavailable",
        competitive_risk_summary="Analysis unavailable",
        team_risk_summary="Analysis unavailable",
        financial_risk_summary="Analysis unavailable",
        critical_risk_count=0, high_risk_count=0,
        medium_risk_count=0, low_risk_count=0,
        market_risk_score=5.0, regulatory_risk_score=5.0,
        competitive_risk_score=5.0, execution_risk_score=5.0,
        overall_risk_score=5.0,
        biggest_risk="Risk analysis could not be completed",
        risk_verdict="ELEVATED",
        due_diligence_flags=["Manual risk assessment required"],
        deal_breakers=[]
    )


def risk_report_to_dict(report: RiskReport) -> dict:
    return asdict(report)
