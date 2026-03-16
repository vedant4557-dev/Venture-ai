/**
 * ScoreCard Component
 * Renders the investment score with an animated ring, dimension bars,
 * and grade badge. Designed to communicate conviction at a glance.
 */

import React, { useEffect, useRef } from "react";
import { InvestmentScore } from "../lib/api";

interface ScoreCardProps {
  score: InvestmentScore;
}

const DIMENSIONS = [
  { key: "market_size", label: "Market Size", color: "#d4a843" },
  { key: "team_strength", label: "Team Strength", color: "#60a5fa" },
  { key: "traction", label: "Traction", color: "#4ade80" },
  { key: "product_differentiation", label: "Product Diff.", color: "#a78bfa" },
  { key: "risk_level", label: "Risk Level", color: "#f87171", inverted: true },
] as const;

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#4ade80";
  if (grade.startsWith("B")) return "#d4a843";
  if (grade.startsWith("C")) return "#fb923c";
  return "#f87171";
}

function getRecommendationStyle(rec: string) {
  const upper = rec.toUpperCase();
  if (upper.startsWith("INVEST"))
    return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "INVEST" };
  if (upper.startsWith("PASS"))
    return { bg: "bg-crimson-500/10", border: "border-crimson-500/30", text: "text-crimson-400", label: "PASS" };
  return { bg: "bg-gold-400/10", border: "border-gold-400/30", text: "text-gold-400", label: "WATCH" };
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const ringRef = useRef<SVGCircleElement>(null);
  const gradeColor = getGradeColor(score.grade);
  const recStyle = getRecommendationStyle(score.recommendation);

  // Animate the SVG ring on mount
  useEffect(() => {
    if (!ringRef.current) return;
    const circumference = 2 * Math.PI * 70; // r=70
    const filled = (score.overall / 10) * circumference;
    const offset = circumference - filled;
    ringRef.current.style.setProperty("--target-offset", `${offset}px`);
    ringRef.current.style.strokeDasharray = `${circumference}px`;
  }, [score.overall]);

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/30 flex items-center justify-between">
        <h3 className="font-display text-slate-100 text-lg font-semibold">
          Investment Score
        </h3>
        <span
          className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg border"
          style={{
            color: gradeColor,
            borderColor: `${gradeColor}40`,
            backgroundColor: `${gradeColor}15`,
          }}
        >
          {score.grade}
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Circular score display */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <svg width="180" height="180" className="-rotate-90">
              {/* Track */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
              />
              {/* Animated fill */}
              <circle
                ref={ringRef}
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={gradeColor}
                strokeWidth="10"
                strokeLinecap="round"
                className="score-ring"
                style={{ filter: `drop-shadow(0 0 8px ${gradeColor}60)` }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-display text-4xl font-bold"
                style={{ color: gradeColor }}
              >
                {score.overall}
              </span>
              <span className="text-slate-500 text-sm font-mono">/ 10</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            {score.verdict}
          </p>
        </div>

        {/* Dimension bars */}
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const raw = score[dim.key as keyof InvestmentScore] as number;
            const displayVal = dim.inverted ? 10 - raw : raw;
            const pct = (raw / 10) * 100;

            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 text-xs font-medium">
                    {dim.label}
                    {dim.inverted && (
                      <span className="text-slate-600 ml-1">(lower = better)</span>
                    )}
                  </span>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: dim.color }}
                  >
                    {raw.toFixed(0)}/10
                  </span>
                </div>
                <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 delay-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: dim.color,
                      boxShadow: `0 0 6px ${dim.color}60`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendation badge */}
        <div
          className={`rounded-xl border px-4 py-3 text-center ${recStyle.bg} ${recStyle.border}`}
        >
          <p className="text-slate-500 text-xs mb-1 uppercase tracking-widest font-mono">
            Recommendation
          </p>
          <p className={`font-display text-xl font-bold ${recStyle.text}`}>
            {recStyle.label}
          </p>
        </div>
      </div>
    </div>
  );
}
