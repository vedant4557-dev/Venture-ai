"""
AI Venture Capital Due Diligence Platform - Backend Entry Point
FastAPI application that orchestrates PDF parsing, AI analysis, and scoring.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router

# ── App Configuration ──────────────────────────────────────────────────────────
app = FastAPI(
    title="AI VC Due Diligence Platform",
    description="Upload a startup pitch deck and receive an AI-generated investment memo and score.",
    version="1.0.0",
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
# Allow Next.js frontend (localhost:3000) and any deployed domain to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Route Registration ─────────────────────────────────────────────────────────
app.include_router(analyze_router, prefix="/api", tags=["Analysis"])


@app.get("/health")
async def health_check():
    """Simple health check endpoint for infrastructure monitoring."""
    return {"status": "ok", "service": "venture-ai-backend"}
