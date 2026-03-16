/**
 * VentureAI API Client v2
 * Extends existing api.ts with new intelligence module types.
 * The original analyzePitchDeck function is preserved.
 * New: analyzeFullPitchDeck for the v2 enhanced endpoint.
 */

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180_000, // 3 min — v2 runs 5 modules concurrently
  headers: { Accept: "application/json" },
});

// ── Original Types (v1 — preserved) ───────────────────────────────────────────

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

// ── New Types (v2) ─────────────────────────────────────────────────────────────

export interface FounderProfile {
  name: string;
  role: string;
  background_summary: string;
  prior_companies: string[];
  education: string[];
  domain_expertise: string;
  founder_type: "Technical" | "Business" | "Hybrid";
  years_experience: number;
  has_prior_exit: boolean;
  notable_achievements: string[];
}

export interface FounderIntelligence {
  founders: FounderProfile[];
  team_size_mentioned: number;
  founder_experience_score: number;
  network_strength_score: number;
  execution_ability_score: number;
  technical_depth_score: number;
  domain_fit_score: number;
  founder_score: number;
  key_strengths: string[];
  key_gaps: string[];
  red_flags: string[];
  verdict: string;
}

export interface GrowthSignal {
  category: string;
  signal: string;
  strength: "STRONG" | "MODERATE" | "WEAK" | "ABSENT";
  evidence: string;
  confidence: number;
}

export interface StartupSignals {
  traction_signals: GrowthSignal[];
  product_signals: GrowthSignal[];
  market_signals: GrowthSignal[];
  team_signals: GrowthSignal[];
  financial_signals: GrowthSignal[];
  revenue_mentioned: boolean;
  revenue_growth_rate: string;
  user_count_mentioned: boolean;
  user_count: string;
  key_customers_mentioned: string[];
  partnerships_mentioned: string[];
  traction_score: number;
  momentum_score: number;
  signal_score: number;
  growth_momentum_assessment: string;
  top_positive_signals: string[];
  missing_signals: string[];
  signal_quality: "Data-rich" | "Narrative-heavy" | "Sparse";
}

export interface RiskItem {
  category: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  evidence: string;
  mitigation_possible: boolean;
  mitigation_note: string;
}

export interface RiskReport {
  risks: RiskItem[];
  market_risk_summary: string;
  regulatory_risk_summary: string;
  competitive_risk_summary: string;
  team_risk_summary: string;
  financial_risk_summary: string;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  market_risk_score: number;
  regulatory_risk_score: number;
  competitive_risk_score: number;
  execution_risk_score: number;
  overall_risk_score: number;
  biggest_risk: string;
  risk_verdict: "MANAGEABLE" | "ELEVATED" | "SEVERE";
  due_diligence_flags: string[];
  deal_breakers: string[];
}

export interface EnhancedInvestmentScore {
  market_opportunity: number;
  team_quality: number;
  product_differentiation: number;
  traction_signals: number;
  risk_level: number;
  founder_score: number;
  signal_score: number;
  overall: number;
  grade: string;
  ic_recommendation: "STRONG_BUY" | "BUY" | "WATCH" | "PASS" | "HARD_PASS";
  verdict: string;
  score_confidence: "HIGH" | "MEDIUM" | "LOW";
  missing_data_flags: string[];
}

export interface FullAnalysisResult {
  company_overview: string;
  business_model: string;
  market_analysis: string;
  competitive_landscape: string;
  strengths: string[];
  recommendation: string;
  key_questions: string[];
  founder_intelligence: FounderIntelligence;
  startup_signals: StartupSignals;
  risk_report: RiskReport;
  investment_score: EnhancedInvestmentScore;
  meta: {
    file_name: string;
    analysis_time_seconds: number;
    modules_run: string[];
    api_version: string;
  };
}

// ── API Functions ──────────────────────────────────────────────────────────────

/** Original v1 analysis — preserved for backward compatibility */
export async function analyzePitchDeck(
  file: File,
  onUploadProgress?: (percent: number) => void
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<AnalysisResult>("/api/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (evt.total && onUploadProgress) {
        onUploadProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return response.data;
}

/** New v2 full analysis — all intelligence modules */
export async function analyzeFullPitchDeck(
  file: File,
  onUploadProgress?: (percent: number) => void
): Promise<FullAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<FullAnalysisResult>("/api/analyze/full", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (evt.total && onUploadProgress) {
        onUploadProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return response.data;
}
