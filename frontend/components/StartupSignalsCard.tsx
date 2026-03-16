/**
 * StartupSignalsCard
 * Displays growth signal analysis with signal strength indicators.
 * Visual design: data-dense, analyst-grade dashboard section.
 */

import React from "react";
import { TrendingUp, Zap, AlertCircle } from "lucide-react";
import { StartupSignals, GrowthSignal } from "../lib/api_v2";

interface Props {
  data: StartupSignals;
}

const STRENGTH_CONFIG = {
  STRONG:   { color: "#4ade80", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-500" },
  MODERATE: { color: "#d4a843", bg: "bg-amber-500/10",   border: "border-amber-500/25",   dot: "bg-amber-500" },
  WEAK:     { color: "#94a3b8", bg: "bg-slate-500/10",   border: "border-slate-500/25",   dot: "bg-slate-500" },
  ABSENT:   { color: "#64748b", bg: "bg-slate-700/20",   border: "border-slate-700/40",   dot: "bg-slate-700" },
};

const QUALITY_CONFIG = {
  "Data-rich":       { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  "Narrative-heavy": { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  "Sparse":          { color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-600/30" },
};

function SignalRow({ signal }: { signal: GrowthSignal }) {
  const cfg = STRENGTH_CONFIG[signal.strength] || STRENGTH_CONFIG.ABSENT;
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${cfg.bg} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-200 text-sm font-medium">{signal.signal}</span>
          <span className="text-xs font-mono flex-shrink-0" style={{ color: cfg.color }}>
            {signal.strength}
          </span>
        </div>
        {signal.evidence && (
          <p className="text-slate-500 text-xs mt-0.5 truncate">{signal.evidence}</p>
        )}
      </div>
    </div>
  );
}

function SignalSection({ title, signals }: { title: string; signals: GrowthSignal[] }) {
  if (signals.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{title}</p>
      {signals.map((s, i) => <SignalRow key={i} signal={s} />)}
    </div>
  );
}

export default function StartupSignalsCard({ data }: Props) {
  const qualityCfg = QUALITY_CONFIG[data.signal_quality] || QUALITY_CONFIG["Sparse"];
  const signalColor = data.signal_score >= 7 ? "#4ade80" : data.signal_score >= 5 ? "#d4a843" : "#f87171";

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="font-display text-slate-100 font-semibold">Growth Signals</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${qualityCfg.color} ${qualityCfg.bg} ${qualityCfg.border}`}>
            {data.signal_quality}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono">SIGNAL SCORE</span>
          <span className="font-mono text-xl font-bold" style={{ color: signalColor }}>
            {data.signal_score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key metrics strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Revenue", value: data.revenue_mentioned ? data.revenue_growth_rate : "Not mentioned", active: data.revenue_mentioned },
            { label: "Users", value: data.user_count_mentioned ? data.user_count : "Not mentioned", active: data.user_count_mentioned },
            { label: "Customers", value: `${data.key_customers_mentioned.length} named`, active: data.key_customers_mentioned.length > 0 },
            { label: "Partnerships", value: `${data.partnerships_mentioned.length} mentioned`, active: data.partnerships_mentioned.length > 0 },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-700/40 bg-white/3 p-3">
              <p className="text-xs text-slate-500 font-mono mb-1">{m.label.toUpperCase()}</p>
              <p className={`text-sm font-medium ${m.active ? "text-slate-200" : "text-slate-600"}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Traction vs Momentum scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-700/40 bg-white/3 p-4 text-center">
            <p className="text-xs text-slate-500 font-mono mb-2">TRACTION SCORE</p>
            <p className="font-mono text-2xl font-bold text-gold-400">{data.traction_score.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-slate-700/40 bg-white/3 p-4 text-center">
            <p className="text-xs text-slate-500 font-mono mb-2">MOMENTUM SCORE</p>
            <p className="font-mono text-2xl font-bold text-violet-400">{data.momentum_score.toFixed(1)}</p>
          </div>
        </div>

        {/* Growth assessment */}
        <div className="rounded-xl border border-slate-700/30 bg-white/3 px-4 py-3">
          <p className="text-xs text-slate-500 font-mono mb-1">GROWTH ASSESSMENT</p>
          <p className="text-slate-200 text-sm leading-relaxed">{data.growth_momentum_assessment}</p>
        </div>

        {/* Signal sections */}
        <div className="space-y-4">
          <SignalSection title="Traction Signals" signals={data.traction_signals} />
          <SignalSection title="Product Signals" signals={data.product_signals} />
          <SignalSection title="Market Signals" signals={data.market_signals} />
          <SignalSection title="Financial Signals" signals={data.financial_signals} />
        </div>

        {/* Top positive signals */}
        {data.top_positive_signals.length > 0 && (
          <div>
            <p className="text-xs text-emerald-500/70 font-mono mb-2">TOP POSITIVE SIGNALS</p>
            <ul className="space-y-1.5">
              {data.top_positive_signals.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing signals */}
        {data.missing_signals.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-amber-400 font-mono">CONSPICUOUSLY ABSENT</p>
            </div>
            <ul className="space-y-1">
              {data.missing_signals.map((s, i) => (
                <li key={i} className="text-amber-300/80 text-sm">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
