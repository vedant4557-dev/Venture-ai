/**
 * EnhancedScoreCard (v2)
 * Displays the upgraded investment score with IC recommendation,
 * confidence level, and all scoring dimensions.
 * Replaces the original ScoreCard for v2 full analysis.
 */

import React, { useEffect, useRef } from "react";
import { EnhancedInvestmentScore } from "../lib/api_v2";

interface Props {
  score: EnhancedInvestmentScore;
  recommendation: string;
}

const IC_COLORS = {
  STRONG_BUY: "#4ade80",
  BUY:        "#86efac",
  WATCH:      "#d4a843",
  PASS:        "#f87171",
  HARD_PASS:  "#ef4444",
};

const IC_LABELS = {
  STRONG_BUY: "STRONG BUY",
  BUY:        "BUY",
  WATCH:      "WATCH",
  PASS:        "PASS",
  HARD_PASS:  "HARD PASS",
};

const CONFIDENCE_CONFIG = {
  HIGH:   { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  MEDIUM: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  LOW:    { color: "text-slate-400",   bg: "bg-slate-700/20",   border: "border-slate-600/30" },
};

const DIMENSIONS = [
  { key: "market_opportunity",      label: "Market Opportunity", color: "#d4a843" },
  { key: "team_quality",            label: "Team Quality",       color: "#60a5fa" },
  { key: "product_differentiation", label: "Product Diff.",      color: "#a78bfa" },
  { key: "traction_signals",        label: "Traction",           color: "#4ade80" },
  { key: "founder_score",           label: "Founder Intel.",     color: "#fb923c" },
  { key: "signal_score",            label: "Signal Quality",     color: "#22d3ee" },
  { key: "risk_level",              label: "Risk Level",         color: "#f87171", inverted: true },
] as const;

export default function EnhancedScoreCard({ score, recommendation }: Props) {
  const ringRef = useRef<SVGCircleElement>(null);
  const icColor = IC_COLORS[score.ic_recommendation] || "#d4a843";
  const icLabel = IC_LABELS[score.ic_recommendation] || score.ic_recommendation;
  const confidenceCfg = CONFIDENCE_CONFIG[score.score_confidence] || CONFIDENCE_CONFIG.MEDIUM;

  useEffect(() => {
    if (!ringRef.current) return;
    const r = 70;
    const circumference = 2 * Math.PI * r;
    const filled = (score.overall / 10) * circumference;
    const offset = circumference - filled;
    ringRef.current.style.strokeDasharray = `${circumference}px`;
    ringRef.current.style.setProperty("--target-offset", `${offset}px`);
  }, [score.overall]);

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/30 flex items-center justify-between">
        <h3 className="font-display text-slate-100 text-lg font-semibold">Investment Score</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${confidenceCfg.color} ${confidenceCfg.bg} ${confidenceCfg.border}`}>
            {score.score_confidence} CONFIDENCE
          </span>
          <span
            className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border"
            style={{ color: icColor, borderColor: `${icColor}40`, backgroundColor: `${icColor}15` }}
          >
            {score.grade}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <svg width="160" height="160" className="-rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                ref={ringRef}
                cx="80" cy="80" r="70"
                fill="none"
                stroke={icColor}
                strokeWidth="10"
                strokeLinecap="round"
                className="score-ring"
                style={{ filter: `drop-shadow(0 0 8px ${icColor}50)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-bold" style={{ color: icColor }}>{score.overall}</span>
              <span className="text-slate-500 text-xs font-mono">/ 10</span>
            </div>
          </div>

          {/* IC recommendation badge */}
          <div
            className="px-4 py-1.5 rounded-full border text-sm font-display font-bold tracking-wider"
            style={{ color: icColor, borderColor: `${icColor}40`, backgroundColor: `${icColor}15` }}
          >
            {icLabel}
          </div>

          <p className="text-slate-400 text-sm text-center max-w-xs leading-relaxed">{score.verdict}</p>
        </div>

        {/* Dimension bars */}
        <div className="space-y-3.5">
          {DIMENSIONS.map((dim) => {
            const val = score[dim.key as keyof EnhancedInvestmentScore] as number;
            const displayVal = typeof val === "number" ? val : 5;
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-xs font-medium">
                    {dim.label}
                    {"inverted" in dim && dim.inverted && (
                      <span className="text-slate-600 ml-1 text-xs">(lower = better)</span>
                    )}
                  </span>
                  <span className="font-mono text-xs font-semibold" style={{ color: dim.color }}>
                    {displayVal.toFixed(1)}/10
                  </span>
                </div>
                <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 delay-300"
                    style={{
                      width: `${(displayVal / 10) * 100}%`,
                      backgroundColor: dim.color,
                      boxShadow: `0 0 6px ${dim.color}50`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendation */}
        <div className="rounded-xl border border-slate-700/30 bg-white/3 p-4">
          <p className="text-xs text-slate-500 font-mono mb-2">FULL RECOMMENDATION</p>
          <p className="text-slate-300 text-sm leading-relaxed">{recommendation}</p>
        </div>

        {/* Missing data flags */}
        {score.missing_data_flags.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-400 font-mono mb-2">DATA GAPS</p>
            {score.missing_data_flags.map((flag, i) => (
              <p key={i} className="text-amber-300/70 text-xs">{flag}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
