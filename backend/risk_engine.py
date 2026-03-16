"""
Risk Detection Engine
=====================
AI-powered risk analysis module for startup investment due diligence.
Detects, categorizes, and scores investment risks from pitch deck text.

NEW module — does not modify existing files.
Designed to integrate cleanly into the extended analysis pipeline.
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


# ── Risk Taxonomy ──────────────────────────────────────────────────────────────

class RiskCategory(str, Enum):
    MARKET          = "Market Risk"
    REGULATORY      = "Regulatory Risk"
    COMPETITIVE     = "Competitive Risk"
    TECHNOLOGY      = "Technology Risk"
    TEAM            = "Team Risk"
    FINANCIAL       = "Financial Risk"
    BUSINESS_MODEL  = "Business Model Risk"
    EXECUTION       = "Execution Risk"
    CUSTOMER        = "Customer Concentration Risk"
    MACRO           = "Macro / External Risk"


class RiskSeverity(str, Enum):
    CRITICAL = "CRITICAL"   # Deal-breaker level
    HIGH     = "HIGH"       # Significant concern, requires mitigation
    MEDIUM   = "MEDIUM"     # Worth monitoring
    LOW      = "LOW"        # Minor, typical for stage


@dataclass
class RiskItem:
    """A single identified risk."""
    category: str           # RiskCategory value
    title: str              # Short descriptive title
    description: str        # Detailed explanation of the risk
    severity: str           # RiskSeverity value
    evidence: str           # What in the deck triggered this risk flag
    mitigation_possible: bool
    mitigation_note: str    # How it could be mitigated if possible


@dataclass
class RiskReport:
    """Complete risk assessment for a startup."""
    risks: list[RiskItem]

    # Category-level summaries
    market_risk_summary: str
    regulatory_risk_summary: str
    competitive_risk_summary: str
    team_risk_summary: str
    financial_risk_summary: str

    # Aggregate metrics
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int

    # Scores (0–10, higher = MORE risk)
    market_risk_score: float
    regulatory_risk_score: float
    competitive_risk_score: float
    execution_risk_score: float
    overall_risk_score: float       # Composite risk score

    # Narrative outputs
    biggest_risk: str               # The single most important risk
    risk_verdict: str               # MANAGEABLE / ELEVATED / SEVERE
    due_diligence_flags: list[str]  # Specific questions to ask before investing
    deal_breakers: list[str]        # Risks severe enough to kill the deal


# ── Prompts ────────────────────────────────────────────────────────────────────

RISK_SYSTEM_PROMPT = """You are a risk analyst at a top-tier venture capital fund.
Your specialty is identifying investment risks that other analysts miss.
You are skeptical but fair. You look for real risks backed by evidence, not generic boilerplate.
Surface deal-breakers immediately. Be specific. Respond ONLY with valid JSON."""

RISK_ANALYSIS_PROMPT = """Conduct a comprehensive risk analysis of this startup pitch deck.

PITCH DECK TEXT:
{pitch_deck_text}

Return ONLY this exact JSON structure:

{{
  "risks": [
    {{
      "category": "Regulatory Risk",
      "title": "Healthcare data compliance exposure",
      "description": "The platform handles PHI but no HIPAA compliance framework is mentioned",
      "severity": "HIGH",
      "evidence": "References to storing patient records with no mention of compliance",
      "mitigation_possible": true,
      "mitigation_note": "Can be addressed with BAA agreements and SOC2 certification"
    }}
  ],
  "market_risk_summary": "...",
  "regulatory_risk_summary": "...",
  "competitive_risk_summary": "...",
  "team_risk_summary": "...",
  "financial_risk_summary": "...",
  "critical_risk_count": 1,
  "high_risk_count": 2,
  "medium_risk_count": 3,
  "low_risk_count": 2,
  "market_risk_score": 4.0,
  "regulatory_risk_score": 7.0,
  "competitive_risk_score": 5.0,
  "execution_risk_score": 4.5,
  "overall_risk_score": 5.2,
  "biggest_risk": "Regulatory exposure without compliance framework is the primary concern",
  "risk_verdict": "ELEVATED",
  "due_diligence_flags": [
    "Request HIPAA compliance roadmap and timeline",
    "Validate customer concentration — what % of revenue from top 3 customers?"
  ],
  "deal_breakers": []
}}

Risk categories to evaluate:
- Market Risk: TAM assumptions, market timing, demand validation
- Regulatory Risk: Compliance, licensing, legal exposure
- Competitive Risk: Defensibility, moat strength, incumbent response
- Technology Risk: Technical debt, build complexity, IP protection
- Team Risk: Key person dependency, gaps, culture signals
- Financial Risk: Burn rate, runway, unit economics
- Business Model Risk: Monetization viability, pricing power
- Execution Risk: Ability to deliver on roadmap
- Customer Concentration Risk: Revenue dependency on few customers
- Macro Risk: External factors that could derail growth

Severity definitions:
- CRITICAL: Could kill the company or make investment unviable
- HIGH: Significant risk requiring active mitigation plan
- MEDIUM: Normal startup risk, worth monitoring
- LOW: Minor risk, typical for the stage

Risk score (0-10): 10 = extremely high risk, 0 = minimal risk
Risk verdict: MANAGEABLE (0-4), ELEVATED (4-7), SEVERE (7-10)"""


async def analyze_risks(pitch_deck_text: str) -> RiskReport:
    """
    Perform comprehensive risk analysis on a startup pitch deck.

    Args:
        pitch_deck_text: Extracted text from the pitch deck PDF.

    Returns:
        RiskReport with categorized risks, scores, and DD flags.
    """
    truncated = pitch_deck_text[:80_000]

    try:
        logger.info("Running risk detection analysis...")
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,
            system=RISK_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": RISK_ANALYSIS_PROMPT.format(pitch_deck_text=truncated)
            }]
        )

        raw = message.content[0].text
        data = _parse_response(raw)
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
            severity=r.get("severity", RiskSeverity.MEDIUM),
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
        risks=[],
        market_risk_summary="Analysis unavailable",
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
    """Serialize RiskReport to JSON-safe dict."""
    return asdict(report)
