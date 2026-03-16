/**
 * FounderIntelligenceCard
 * Displays founder analysis with individual profiles and aggregate scores.
 * Designed for VC analysts — information density is high by design.
 */

import React, { useState } from "react";
import { User, Award, Briefcase, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { FounderIntelligence, FounderProfile } from "../lib/api_v2";

interface Props {
  data: FounderIntelligence;
}

const FOUNDER_TYPE_COLORS = {
  Technical: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  Business:  { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  Hybrid:    { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" },
};

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/3 border border-white/8">
      <span className="text-xs text-slate-500 font-mono text-center leading-tight">{label}</span>
      <span className="font-mono text-lg font-bold" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

function FounderCard({ founder }: { founder: FounderProfile }) {
  const [expanded, setExpanded] = useState(false);
  const typeStyle = FOUNDER_TYPE_COLORS[founder.founder_type] || FOUNDER_TYPE_COLORS.Hybrid;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-obsidian-800/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-white/3 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-slate-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-100 font-semibold">{founder.name}</span>
            <span className="text-slate-500 text-sm">{founder.role}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${typeStyle.bg} ${typeStyle.border} ${typeStyle.text}`}>
              {founder.founder_type}
            </span>
            {founder.has_prior_exit && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono">
                Prior Exit ✓
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">{founder.background_summary}</p>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30">
          <div className="grid grid-cols-2 gap-3 pt-3">
            {founder.education.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-mono mb-1">EDUCATION</p>
                {founder.education.map((e, i) => (
                  <p key={i} className="text-slate-300 text-sm">{e}</p>
                ))}
              </div>
            )}
            {founder.prior_companies.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-mono mb-1">PRIOR COMPANIES</p>
                {founder.prior_companies.map((c, i) => (
                  <p key={i} className="text-slate-300 text-sm">{c}</p>
                ))}
              </div>
            )}
          </div>

          {founder.notable_achievements.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 font-mono mb-2">ACHIEVEMENTS</p>
              <ul className="space-y-1">
                {founder.notable_achievements.map((a, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-gold-400 mt-2 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="font-mono">{founder.years_experience}y experience</span>
            <span>·</span>
            <span>{founder.domain_expertise}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FounderIntelligenceCard({ data }: Props) {
  const scoreColor = data.founder_score >= 7 ? "#4ade80" : data.founder_score >= 5 ? "#d4a843" : "#f87171";

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="font-display text-slate-100 font-semibold">Founder Intelligence</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono">FOUNDER SCORE</span>
          <span className="font-mono text-xl font-bold" style={{ color: scoreColor }}>
            {data.founder_score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Score breakdown */}
        <div className="grid grid-cols-5 gap-2">
          <ScorePill label="Experience" value={data.founder_experience_score} color="#d4a843" />
          <ScorePill label="Network" value={data.network_strength_score} color="#60a5fa" />
          <ScorePill label="Execution" value={data.execution_ability_score} color="#4ade80" />
          <ScorePill label="Technical" value={data.technical_depth_score} color="#a78bfa" />
          <ScorePill label="Domain Fit" value={data.domain_fit_score} color="#fb923c" />
        </div>

        {/* Verdict */}
        <div className="rounded-xl border border-slate-700/30 bg-white/3 px-4 py-3">
          <p className="text-xs text-slate-500 font-mono mb-1">IC VERDICT</p>
          <p className="text-slate-200 text-sm leading-relaxed">{data.verdict}</p>
        </div>

        {/* Founder profiles */}
        {data.founders.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-mono">FOUNDER PROFILES</p>
            {data.founders.map((f, i) => (
              <FounderCard key={i} founder={f} />
            ))}
          </div>
        )}

        {/* Strengths & Gaps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.key_strengths.length > 0 && (
            <div>
              <p className="text-xs text-emerald-500/70 font-mono mb-2">KEY STRENGTHS</p>
              <ul className="space-y-1.5">
                {data.key_strengths.map((s, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.key_gaps.length > 0 && (
            <div>
              <p className="text-xs text-amber-500/70 font-mono mb-2">KEY GAPS</p>
              <ul className="space-y-1.5">
                {data.key_gaps.map((g, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Red flags */}
        {data.red_flags.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-400 font-mono">RED FLAGS</p>
            </div>
            <ul className="space-y-1">
              {data.red_flags.map((flag, i) => (
                <li key={i} className="text-red-300 text-sm">{flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
