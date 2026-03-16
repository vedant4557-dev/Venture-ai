# VentureAI — AI VC Due Diligence Platform

> Upload a startup pitch deck → AI analyzes it → receive an investment memo and score.

Built with **FastAPI** (Python), **Next.js 15** (TypeScript), **Tailwind CSS**, and **Claude AI**.

---

## Architecture

```
venture-ai/
├── backend/                    # Python FastAPI service
│   ├── main.py                 # App entry point + CORS
│   ├── pdf_parser.py           # PDF text extraction (pypdf)
│   ├── ai_engine.py            # Claude API integration
│   ├── scoring.py              # Score normalization + grading
│   ├── models.py               # SQLAlchemy ORM models (PostgreSQL)
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       └── analyze.py          # POST /api/analyze endpoint
│
└── frontend/                   # Next.js 15 + TypeScript
    ├── pages/
    │   ├── _app.tsx
    │   └── index.tsx           # Main UI page
    ├── components/
    │   ├── UploadZone.tsx      # Drag-and-drop PDF upload
    │   ├── ScoreCard.tsx       # Animated score display
    │   ├── MemoSection.tsx     # Memo section card
    │   └── AnalysisDashboard.tsx  # Full results layout
    ├── lib/
    │   └── api.ts              # Axios client + TypeScript types
    ├── styles/
    │   └── globals.css
    └── tailwind.config.js
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

---

### 1. Backend Setup

```bash
cd venture-ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd venture-ai/frontend

# Install dependencies
npm install

# Set environment (optional — defaults to localhost:8000)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

The app will be available at: `http://localhost:3000`

---

## API Reference

### `POST /api/analyze`

Upload a PDF pitch deck for analysis.

**Request:** `multipart/form-data` with field `file` (PDF, max 50MB)

**Response:**
```json
{
  "company_overview": "...",
  "business_model": "...",
  "market_analysis": "...",
  "competitive_landscape": "...",
  "strengths": ["..."],
  "risks": ["..."],
  "team_assessment": "...",
  "traction_metrics": "...",
  "recommendation": "INVEST — ...",
  "investment_score": {
    "market_size": 8,
    "team_strength": 7,
    "traction": 6,
    "product_differentiation": 8,
    "risk_level": 4,
    "overall": 7.4,
    "grade": "A",
    "verdict": "High-quality deal — recommend advancing to IC"
  },
  "key_questions": ["..."]
}
```

### `GET /health`
Returns `{ "status": "ok" }` — for uptime monitoring.

---

## Investment Scoring System

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Market Size | 25% | TAM/SAM assessment |
| Team Strength | 25% | Founder experience & domain expertise |
| Traction | 20% | Revenue, growth, retention |
| Product Differentiation | 20% | Moat, IP, uniqueness |
| Risk Level | 10% | Inverted (higher risk → lower score) |

**Grade Scale:**
- A+ (8.5–10): Strong conviction — lead or co-lead
- A (7.5–8.4): High-quality deal — advance to IC
- B+ (6.5–7.4): Solid — worth deeper diligence
- B (5.5–6.4): Interesting — needs validation
- C+ (4.5–5.4): Borderline — revisit later
- C (3.5–4.4): Below threshold — watchlist
- D (2.0–3.4): Significant concerns — pass
- F (<2.0): Hard pass

---

## Database (Optional)

PostgreSQL is prepared but optional for the MVP. To activate:

1. Set `DATABASE_URL` in `backend/.env`
2. Call `init_db(engine)` from `models.py` on startup

The `Analysis` and `AnalysisScore` models in `models.py` are production-ready.

---

## Production Deployment

### Backend (e.g., Railway, Render, Fly.io)
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
# Set NEXT_PUBLIC_API_URL to your backend URL
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key |
| `DATABASE_URL` | Optional | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | Optional | Backend URL (default: localhost:8000) |
