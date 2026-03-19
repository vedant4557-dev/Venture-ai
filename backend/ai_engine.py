"""
AI Engine Module - Gemini Version
Sends pitch deck text to Google Gemini API and receives structured
investment analysis formatted as a VC analyst would produce.
"""

import json
import logging
import os
import re
import google.generativeai as genai

logger = logging.getLogger(__name__)

# ── Client Initialization ──────────────────────────────────────────────────────
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PROMPT = """You are a senior venture capital analyst at a top-tier VC firm with 15+ years of experience evaluating early-stage startups.

Your job is to analyze startup pitch decks and produce rigorous, investment-grade due diligence memos. You are honest, direct, and data-driven.

Always respond with ONLY valid JSON — no markdown fences, no preamble, no commentary outside the JSON structure."""

ANALYSIS_PROMPT_TEMPLATE = """Analyze the following startup pitch deck text as a senior VC analyst.

PITCH DECK CONTENT:
{pitch_deck_text}

Produce a comprehensive investment memo in the following exact JSON structure:

{{
  "company_overview": "2-3 sentence summary of what the company does, its stage, and core value proposition",
  "business_model": "Clear explanation of how the company makes money, pricing model, and unit economics if available",
  "market_analysis": "Analysis of the TAM, SAM, and market timing. Include market size estimates and growth trends.",
  "competitive_landscape": "Key competitors identified, how the startup differentiates, and defensibility of the moat",
  "strengths": [
    "Specific strength 1 with evidence from the deck",
    "Specific strength 2 with evidence from the deck",
    "Specific strength 3 with evidence from the deck"
  ],
  "risks": [
    "Specific risk 1 with explanation",
    "Specific risk 2 with explanation",
    "Specific risk 3 with explanation"
  ],
  "team_assessment": "Assessment of the founding team background and ability to execute",
  "traction_metrics": "Summary of key traction data: revenue, users, growth rate, partnerships",
  "recommendation": "INVEST / PASS / WATCH — followed by 2-3 sentences explaining the rationale",
  "investment_score": {{
    "market_size": <integer 0-10>,
    "team_strength": <integer 0-10>,
    "traction": <integer 0-10>,
    "product_differentiation": <integer 0-10>,
    "risk_level": <integer 0-10>,
    "overall": <float to one decimal>
  }},
  "key_questions": [
    "Critical question 1 for IC",
    "Critical question 2",
    "Critical question 3"
  ]
}}

Return ONLY the JSON object. No additional text."""


async def analyze_startup(pitch_deck_text: str) -> dict:
    """Send pitch deck text to Gemini for VC-grade analysis."""
    truncated_text = pitch_deck_text[:100_000]
    prompt = f"{SYSTEM_PROMPT}\n\n{ANALYSIS_PROMPT_TEMPLATE.format(pitch_deck_text=truncated_text)}"

    try:
        logger.info("Sending pitch deck to Gemini for analysis...")
        response = model.generate_content(prompt)
        raw_response = response.text
        logger.info(f"Received AI response ({len(raw_response)} characters).")
        return _parse_ai_response(raw_response)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise ValueError(f"AI analysis failed: {str(e)}")


def _parse_ai_response(raw: str) -> dict:
    """Parse and validate the JSON response from Gemini."""
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("AI returned a response with no valid JSON object.")
    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError as e:
        raise ValueError("AI returned malformed JSON. Please try again.")

    required_keys = ["company_overview", "business_model", "market_analysis",
                     "competitive_landscape", "strengths", "risks", "recommendation", "investment_score"]
    missing = [k for k in required_keys if k not in parsed]
    if missing:
        raise ValueError(f"AI response missing required fields: {missing}")
    return parsed
