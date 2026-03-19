"""
Founder Intelligence Engine - Gemini Version
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
class FounderProfile:
    name: str
    role: str
    background_summary: str
    prior_companies: list[str]
    education: list[str]
    domain_expertise: str
    founder_type: str
    years_experience: int
    has_prior_exit: bool
    notable_achievements: list[str]


@dataclass
class FounderIntelligence:
    founders: list[FounderProfile]
    team_size_mentioned: int
    founder_experience_score: float
    network_strength_score: float
    execution_ability_score: float
    technical_depth_score: float
    domain_fit_score: float
    founder_score: float
    key_strengths: list[str]
    key_gaps: list[str]
    red_flags: list[str]
    verdict: str


FOUNDER_PROMPT = """You are a senior VC partner evaluating founders. Analyze the founders mentioned in this pitch deck and return a structured JSON report.

PITCH DECK TEXT:
{pitch_deck_text}

Return ONLY this exact JSON structure:

{{
  "founders": [
    {{
      "name": "founder name or 'Unknown Founder'",
      "role": "CEO/CTO/etc",
      "background_summary": "2-3 sentence background",
      "prior_companies": ["company1"],
      "education": ["MIT CS"],
      "domain_expertise": "specific domain",
      "founder_type": "Technical | Business | Hybrid",
      "years_experience": 8,
      "has_prior_exit": false,
      "notable_achievements": ["achievement 1"]
    }}
  ],
  "team_size_mentioned": 5,
  "founder_experience_score": 7.5,
  "network_strength_score": 6.0,
  "execution_ability_score": 7.0,
  "technical_depth_score": 8.0,
  "domain_fit_score": 7.5,
  "founder_score": 7.2,
  "key_strengths": ["Specific strength with evidence"],
  "key_gaps": ["Missing capability"],
  "red_flags": ["Any concerning patterns"],
  "verdict": "One-line IC assessment of the founding team"
}}

Return ONLY the JSON. No additional text."""


async def analyze_founders(pitch_deck_text: str) -> FounderIntelligence:
    truncated = pitch_deck_text[:80_000]
    try:
        logger.info("Running founder intelligence analysis with Gemini...")
        response = model.generate_content(
            FOUNDER_PROMPT.format(pitch_deck_text=truncated)
        )
        data = _parse_response(response.text)
        return _build_intelligence(data)
    except Exception as e:
        logger.error(f"Founder analysis failed: {e}")
        return _fallback_intelligence()


def _parse_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in founder analysis response")
    return json.loads(match.group())


def _build_intelligence(data: dict) -> FounderIntelligence:
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
    return FounderIntelligence(
        founders=[], team_size_mentioned=0,
        founder_experience_score=5.0, network_strength_score=5.0,
        execution_ability_score=5.0, technical_depth_score=5.0,
        domain_fit_score=5.0, founder_score=5.0,
        key_strengths=[], key_gaps=["Founder analysis unavailable"],
        red_flags=[], verdict="Founder analysis could not be completed."
    )


def founder_intelligence_to_dict(fi: FounderIntelligence) -> dict:
    return asdict(fi)
