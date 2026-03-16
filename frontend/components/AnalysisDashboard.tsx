/**
 * AnalysisDashboard Component
 * Renders the complete investment memo after analysis is complete.
 * Two-column layout: memo sections on left, score card on right.
 */

import React from "react";
import {
  Building2,
  TrendingUp,
  Globe,
  Swords,
  CheckCircle2,
  AlertTriangle,
  Users,
  BarChart3,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { AnalysisResult } from "../lib/api";
import ScoreCard from "./ScoreCard";
import MemoSection from "./MemoSection";

interface AnalysisDashboardProps {
  result: AnalysisResult;
  fileName: string;
  onReset: () => void;
}

export default function AnalysisDashboard({
  result,
  fileName,
  onReset,
}: AnalysisDashboardProps) {
  return (
    <div className="w-full space-y-8">
      {/* Results header */}
      <div
        className="flex items-start justify-between opacity-0 animate-fade-up"
        style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest">
              Analysis Complete
            </span>
          </div>
          <h2 className="font-display text-2xl text-slate-100 font-bold">
            Investment Memo
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-mono truncate max-w-sm">
            {fileName}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-slate-400 hover:text-gold-400 text-sm transition-colors px-3 py-2 rounded-lg hover:bg-gold-400/5 border border-transparent hover:border-gold-400/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Analysis
        </button>
      </div>

      {/* Main layout: memo left, score right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Memo sections (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          <MemoSection
            icon={Building2}
            iconColor="#d4a843"
            title="Company Overview"
            content={result.company_overview}
            delay={100}
          />

          <MemoSection
            icon={TrendingUp}
            iconColor="#60a5fa"
            title="Business Model"
            content={result.business_model}
            delay={150}
          />

          <MemoSection
            icon={Globe}
            iconColor="#a78bfa"
            title="Market Analysis"
            content={result.market_analysis}
            delay={200}
          />

          <MemoSection
            icon={Swords}
            iconColor="#fb923c"
            title="Competitive Landscape"
            content={result.competitive_landscape}
            delay={250}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MemoSection
              icon={CheckCircle2}
              iconColor="#4ade80"
              title="Strengths"
              content={result.strengths}
              variant="strength"
              delay={300}
            />
            <MemoSection
              icon={AlertTriangle}
              iconColor="#f87171"
              title="Key Risks"
              content={result.risks}
              variant="risk"
              delay={350}
            />
          </div>

          <MemoSection
            icon={Users}
            iconColor="#34d399"
            title="Team Assessment"
            content={result.team_assessment}
            delay={400}
          />

          <MemoSection
            icon={BarChart3}
            iconColor="#22d3ee"
            title="Traction & Metrics"
            content={result.traction_metrics}
            delay={450}
          />

          {result.key_questions?.length > 0 && (
            <MemoSection
              icon={HelpCircle}
              iconColor="#d4a843"
              title="Key Questions for IC"
              content={result.key_questions}
              variant="question"
              delay={500}
            />
          )}
        </div>

        {/* Right: Score card (1/3 width, sticky) */}
        <div className="xl:col-span-1">
          <div className="sticky top-8 opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
            <ScoreCard score={result.investment_score} />

            {/* Full recommendation text */}
            <div className="mt-4 rounded-2xl border border-slate-700/40 bg-obsidian-800/60 p-5">
              <h4 className="text-slate-500 text-xs uppercase tracking-widest font-mono mb-2">
                Full Recommendation
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {result.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
