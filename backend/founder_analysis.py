"""
Founder Intelligence Engine
===========================
Analyzes founder backgrounds, experience, and capabilities from pitch deck text.
This module is ADDITIVE — it extends the existing system without modifying core files.

Used by: routes/analyze.py (new extended endpoint)
Output feeds into: ai_engine.py enhanced memo generation
"""

import json
import logging
import os
import re
from dataclasses import dataclass, asdict

import anthropic

logger = logging.getLogger(__name__)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


# ── Data Structures ────────────────────────────────────────────────────────────

@dataclass
class FounderProfile:
    """Structured profile for a single founder extracted from pitch deck."""
    name: str
    role: str
    background_summary: str
    prior_companies: list[str]
    education: list[str]
    domain_expertise: str          # e.g., "Deep ML/AI", "B2B SaaS", "Fintech"
    founder_type: str              # "Technical", "Business", "Hybrid"
    years_experience: int          # Estimated years of relevant experience
    has_prior_exit: bool
    notable_achievements: list[str]


@dataclass
class FounderIntelligence:
    """Full founder intelligence report for the startup."""
    founders: list[FounderProfile]
    team_size_mentioned: int
    founder_experience_score: float    # 0–10: depth of relevant experience
    network_strength_score: float      # 0–10: quality of connections/background
    execution_ability_score: float     # 0–10: evidence of ability to ship
    technical_depth_score: float       # 0–10: engineering/product capability
    domain_fit_score: float            # 0–10: how well team matches the problem
    founder_score: float               # 0–10: composite weighted score
    key_strengths: list[str]
    key_gaps: list[str]
    red_flags: list[str]
    verdict: str                       # One-line investment-grade assessment


# ── System Prompt ──────────────────────────────────────────────────────────────

FOUNDER_SYSTEM_PROMPT = """You are a senior partner at a top-tier venture capital firm specializing in founder evaluation. 
You have conducted thousands of founder assessments and can identify exceptional operators from limited information.

Your job is to extract and evaluate founder intelligence from pitch deck text.
Be analytical, specific, and honest. Surface both strengths and concerns.
Always respond with ONLY valid JSON — no markdown, no commentary."""

FOUNDER_ANALYSIS_PROMPT = """Analyze the founders mentioned in this pitch deck text and return a structured founder intelligence report.

PITCH DECK TEXT:
{pitch_deck_text}

Return ONLY this exact JSON structure:

{{
  "founders": [
    {{
      "name": "founder name or 'Unknown Founder'",
      "role": "CEO/CTO/COO/etc",
      "background_summary": "2-3 sentence background",
      "prior_companies": ["company1", "company2"],
      "education": ["MIT CS", "Stanford MBA"],
      "domain_expertise": "specific domain area",
      "founder_type": "Technical | Business | Hybrid",
      "years_experience": 8,
      "has_prior_exit": false,
      "notable_achievements": ["achievement 1", "achievement 2"]
    }}
  ],
  "team_size_mentioned": 5,
  "founder_experience_score": 7.5,
  "network_strength_score": 6.0,
  "execution_ability_score": 7.0,
  "technical_depth_score": 8.0,
  "domain_fit_score": 7.5,
  "founder_score": 7.2,
  "key_strengths": [
    "Specific strength with evidence",
    "Another strength"
  ],
  "key_gaps": [
    "Missing capability or experience",
    "Another gap"
  ],
  "red_flags": [
    "Any concerning patterns"
  ],
  "verdict": "Strong technical founders with proven execution; commercial gap is a risk worth monitoring"
}}

Scoring Guide:
- founder_experience_score: 10 = serial founder with successful exits; 5 = first startup but deep domain; 1 = no relevant background
- network_strength_score: 10 = top-tier school + FAANG + strong references; 5 = solid network; 1 = no signal
- execution_ability_score: 10 = shipped products at scale; 5 = early traction; 1 = pre-product
- technical_depth_score: 10 = deep technical moat builder; 5 = competent tech; 1 = non-technical only
- domain_fit_score: 10 = spent 10+ years in this exact problem; 5 = adjacent; 1 = no domain fit
- founder_score: weighted avg = (experience*0.25 + execution*0.30 + domain_fit*0.25 + network*0.10 + technical*0.10)

If founders are not mentioned, still return the structure with reasonable inferences from context."""


async def analyze_founders(pitch_deck_text: str) -> FounderIntelligence:
    """
    Extract and score founder intelligence from pitch deck text.

    Args:
        pitch_deck_text: Full extracted text from pitch deck PDF.

    Returns:
        FounderIntelligence dataclass with structured founder analysis.
    """
    truncated = pitch_deck_text[:80_000]

    try:
        logger.info("Running founder intelligence analysis...")
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=FOUNDER_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": FOUNDER_ANALYSIS_PROMPT.format(pitch_deck_text=truncated)
            }]
        )

        raw = message.content[0].text
        data = _parse_response(raw)
        return _build_intelligence(data)

    except Exception as e:
        logger.error(f"Founder analysis failed: {e}")
        return _fallback_intelligence()


def _parse_response(raw: str) -> dict:
    """Parse and validate AI JSON response."""
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in founder analysis response")
    return json.loads(match.group())


def _build_intelligence(data: dict) -> FounderIntelligence:
    """Construct FounderIntelligence from parsed AI response."""
    founders = []
    for f in data.get("founders", []):
        founders.append(FounderProfile(
            name=f.get("name", "Unknown"),
            role=f.get("role", "Founder"),
            background_summary=f.get("background_summary", ""),
            prior_companies=f.get("prior_companies", []),
            education=f.get("education", []),
            domain_expertise=f.get("domain_expertise", "General"),
            founder_type=f.get("founder_type", "Hybrid"),
            years_experience=int(f.get("years_experience", 0)),
            has_prior_exit=bool(f.get("has_prior_exit", False)),
            notable_achievements=f.get("notable_achievements", [])
        ))

    return FounderIntelligence(
        founders=founders,
        team_size_mentioned=int(data.get("team_size_mentioned", 0)),
        founder_experience_score=float(data.get("founder_experience_score", 5.0)),
        network_strength_score=float(data.get("network_strength_score", 5.0)),
        execution_ability_score=float(data.get("execution_ability_score", 5.0)),
        technical_depth_score=float(data.get("technical_depth_score", 5.0)),
        domain_fit_score=float(data.get("domain_fit_score", 5.0)),
        founder_score=float(data.get("founder_score", 5.0)),
        key_strengths=data.get("key_strengths", []),
        key_gaps=data.get("key_gaps", []),
        red_flags=data.get("red_flags", []),
        verdict=data.get("verdict", "Insufficient founder information available.")
    )


def _fallback_intelligence() -> FounderIntelligence:
    """Return a neutral fallback when analysis fails."""
    return FounderIntelligence(
        founders=[],
        team_size_mentioned=0,
        founder_experience_score=5.0,
        network_strength_score=5.0,
        execution_ability_score=5.0,
        technical_depth_score=5.0,
        domain_fit_score=5.0,
        founder_score=5.0,
        key_strengths=[],
        key_gaps=["Founder analysis unavailable"],
        red_flags=[],
        verdict="Founder analysis could not be completed. Manual review required."
    )


def founder_intelligence_to_dict(fi: FounderIntelligence) -> dict:
    """Serialize FounderIntelligence to JSON-safe dict."""
    result = asdict(fi)
    return result
