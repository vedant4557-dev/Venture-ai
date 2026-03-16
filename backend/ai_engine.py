"""
AI Engine Module
Sends pitch deck text to the Anthropic Claude API and receives structured
investment analysis formatted as a VC analyst would produce.
"""

import json
import logging
import os
import re
import anthropic

logger = logging.getLogger(__name__)

# ── Client Initialization ──────────────────────────────────────────────────────
# ANTHROPIC_API_KEY must be set in the environment (e.g., via .env or secrets manager)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# ── System Prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a senior venture capital analyst at a top-tier VC firm with 15+ years of experience evaluating early-stage startups. You have deep expertise across SaaS, fintech, healthtech, consumer, and deep-tech sectors.

Your job is to analyze startup pitch decks and produce rigorous, investment-grade due diligence memos. You are honest, direct, and data-driven. You flag risks clearly and do not sugarcoat weaknesses.

Always respond with ONLY valid JSON — no markdown fences, no preamble, no commentary outside the JSON structure."""

# ── Analysis Prompt Template ───────────────────────────────────────────────────
ANALYSIS_PROMPT_TEMPLATE = """Analyze the following startup pitch deck text as a senior VC analyst.

PITCH DECK CONTENT:
{pitch_deck_text}

Produce a comprehensive investment memo in the following exact JSON structure. Be specific, analytical, and reference actual details from the pitch deck where possible.

{{
  "company_overview": "2-3 sentence summary of what the company does, its stage, and core value proposition",
  "business_model": "Clear explanation of how the company makes money, pricing model, and unit economics if available",
  "market_analysis": "Analysis of the total addressable market (TAM), serviceable addressable market (SAM), and market timing. Include market size estimates and growth trends.",
  "competitive_landscape": "Key competitors identified, how the startup differentiates, and defensibility of the moat",
  "strengths": [
    "Specific strength 1 with evidence from the deck",
    "Specific strength 2 with evidence from the deck",
    "Specific strength 3 with evidence from the deck"
  ],
  "risks": [
    "Specific risk 1 with explanation of why it matters",
    "Specific risk 2 with explanation of why it matters",
    "Specific risk 3 with explanation of why it matters"
  ],
  "team_assessment": "Assessment of the founding team's background, relevant experience, and ability to execute",
  "traction_metrics": "Summary of key traction data: revenue, users, growth rate, partnerships, or notable milestones mentioned",
  "recommendation": "INVEST / PASS / WATCH — followed by 2-3 sentences explaining the rationale",
  "investment_score": {{
    "market_size": <integer 0-10>,
    "team_strength": <integer 0-10>,
    "traction": <integer 0-10>,
    "product_differentiation": <integer 0-10>,
    "risk_level": <integer 0-10>,
    "overall": <float to one decimal, weighted average>
  }},
  "key_questions": [
    "Critical question an investor should ask before committing capital",
    "Critical question 2",
    "Critical question 3"
  ]
}}

Scoring Guide:
- market_size: 10 = $100B+ TAM, 5 = $1-10B TAM, 1 = <$100M TAM
- team_strength: 10 = serial founders with exits, deep domain expertise; 1 = first-time founders, no relevant experience
- traction: 10 = strong revenue growth, high retention; 5 = early revenue / pilot customers; 1 = pre-revenue idea stage
- product_differentiation: 10 = strong patent/tech moat, 5 = differentiated but replicable, 1 = commodity product
- risk_level: 10 = very high risk (regulatory, market, execution); 1 = low risk
- overall: weighted score = (market_size*0.25 + team_strength*0.25 + traction*0.20 + product_differentiation*0.20 + (10-risk_level)*0.10)

Return ONLY the JSON object. No additional text."""


async def analyze_startup(pitch_deck_text: str) -> dict:
    """
    Send pitch deck text to Claude for VC-grade analysis.

    Args:
        pitch_deck_text: Cleaned text extracted from the pitch deck PDF.

    Returns:
        Parsed dictionary containing the full investment memo and scores.

    Raises:
        ValueError: If the AI returns malformed JSON or the API call fails.
    """
    # Truncate very long decks to stay within context limits (~100k chars)
    truncated_text = pitch_deck_text[:100_000]
    if len(pitch_deck_text) > 100_000:
        logger.warning("Pitch deck text truncated to 100,000 characters.")

    prompt = ANALYSIS_PROMPT_TEMPLATE.format(pitch_deck_text=truncated_text)

    try:
        logger.info("Sending pitch deck to Claude for analysis...")
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_response = message.content[0].text
        logger.info(f"Received AI response ({len(raw_response)} characters).")

        return _parse_ai_response(raw_response)

    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        raise ValueError(f"AI analysis failed: {str(e)}")


def _parse_ai_response(raw: str) -> dict:
    """
    Parse and validate the JSON response from the AI.

    Handles common edge cases: markdown fences, leading/trailing whitespace,
    and partial JSON by extracting the outermost {...} block.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()

    # Extract the outermost JSON object as a fallback
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("AI returned a response with no valid JSON object.")

    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nRaw: {cleaned[:500]}")
        raise ValueError("AI returned malformed JSON. Please try again.")

    # Validate required top-level keys
    required_keys = [
        "company_overview", "business_model", "market_analysis",
        "competitive_landscape", "strengths", "risks",
        "recommendation", "investment_score"
    ]
    missing = [k for k in required_keys if k not in parsed]
    if missing:
        raise ValueError(f"AI response missing required fields: {missing}")

    return parsed
