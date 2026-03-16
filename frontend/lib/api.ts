/**
 * API Client
 * Centralized Axios instance for communicating with the FastAPI backend.
 * All requests include proper timeout and error handling.
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000, // 2 minutes — AI analysis can take time
  headers: {
    Accept: "application/json",
  },
});

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InvestmentScore {
  market_size: number;
  team_strength: number;
  traction: number;
  product_differentiation: number;
  risk_level: number;
  overall: number;
  grade: string;
  verdict: string;
}

export interface AnalysisResult {
  company_overview: string;
  business_model: string;
  market_analysis: string;
  competitive_landscape: string;
  strengths: string[];
  risks: string[];
  team_assessment: string;
  traction_metrics: string;
  recommendation: string;
  investment_score: InvestmentScore;
  key_questions: string[];
}

// ── API Functions ──────────────────────────────────────────────────────────────

/**
 * Upload a pitch deck PDF and receive the AI-generated investment memo.
 * @param file PDF file selected by the user
 * @param onUploadProgress Optional callback for upload progress (0–100)
 */
export async function analyzePitchDeck(
  file: File,
  onUploadProgress?: (percent: number) => void
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<AnalysisResult>(
    "/api/analyze",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total && onUploadProgress) {
          onUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    }
  );

  return response.data;
}
