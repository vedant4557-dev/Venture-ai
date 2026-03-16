/**
 * RiskEngineCard
 * Displays risk analysis with severity-coded risk items and DD flags.
 * High information density — built for analyst review workflow.
 */

import React, { useState } from "react";
import { Shield, AlertTriangle, XCircle, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { RiskReport, RiskItem } from "../lib/api_v2";

interface Props {
  data: RiskReport;
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    dot: "bg-red-500",    label: "CRITICAL" },
  HIGH:     { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "bg-orange-500", label: "HIGH" },
  MEDIUM:   { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  dot: "bg-amber-500",  label: "MEDIUM" },
  LOW:      { color: "text-slate-400",  bg: "bg-slate-700/20",  border: "border-slate-700/40",  dot: "bg-slate-600",  label: "LOW" },
};

const VERDICT_CONFIG = {
  MANAGEABLE: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  ELEVATED:   { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  SEVERE:     { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/25" },
};

function RiskCard({ risk }: { risk: RiskItem }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.MEDIUM;

  return (
    <div className={`rounded-xl border overflow-hidden ${cfg.border} ${cfg.bg}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/3 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-200 text-sm font-medium">{risk.title}</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${cfg.color}`}>{risk.severity}</span>
            <span className="text-xs text-slate-500 font-mono">{risk.category}</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-1" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <p className="text-slate-300 text-sm leading-relaxed pt-3">{risk.description}</p>

          {risk.evidence && (
            <div className="rounded-lg bg-white/3 px-3 py-2">
              <p className="text-xs text-slate-500 font-mono mb-1">EVIDENCE</p>
              <p className="text-slate-400 text-xs italic">"{risk.evidence}"</p>
            </div>
          )}

          {risk.mitigation_possible && risk.mitigation_note && (
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
              <p className="text-xs text-emerald-500/70 font-mono mb-1">MITIGATION</p>
              <p className="text-emerald-300/80 text-xs">{risk.mitigation_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RiskEngineCard({ data }: Props) {
  const verdictCfg = VERDICT_CONFIG[data.risk_verdict] || VERDICT_CONFIG.ELEVATED;
  const riskColor = data.overall_risk_score <= 4 ? "#4ade80" : data.overall_risk_score <= 7 ? "#d4a843" : "#f87171";

  const criticalAndHigh = data.risks.filter(r => r.severity === "CRITICAL" || r.severity === "HIGH");
  const mediumAndLow = data.risks.filter(r => r.severity === "MEDIUM" || r.severity === "LOW");

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="font-display text-slate-100 font-semibold">Risk Analysis</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${verdictCfg.color} ${verdictCfg.bg} ${verdictCfg.border}`}>
            {data.risk_verdict}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono">RISK SCORE</span>
          <span className="font-mono text-xl font-bold" style={{ color: riskColor }}>
            {data.overall_risk_score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Risk count pills */}
        <div className="flex gap-3 flex-wrap">
          {[
            { count: data.critical_risk_count, label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
            { count: data.high_risk_count,     label: "High",     color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
            { count: data.medium_risk_count,   label: "Medium",   color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
            { count: data.low_risk_count,      label: "Low",      color: "text-slate-400", bg: "bg-slate-700/20", border: "border-slate-700/40" },
          ].map((r) => (
            <div key={r.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${r.bg} ${r.border}`}>
              <span className={`font-mono font-bold ${r.color}`}>{r.count}</span>
              <span className={`text-xs ${r.color}`}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Category risk scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Market", value: data.market_risk_score },
            { label: "Regulatory", value: data.regulatory_risk_score },
            { label: "Competitive", value: data.competitive_risk_score },
            { label: "Execution", value: data.execution_risk_score },
          ].map((s) => {
            const c = s.value <= 3 ? "#4ade80" : s.value <= 6 ? "#d4a843" : "#f87171";
            return (
              <div key={s.label} className="rounded-xl border border-slate-700/40 bg-white/3 p-3 text-center">
                <p className="text-xs text-slate-500 font-mono mb-1">{s.label.toUpperCase()}</p>
                <p className="font-mono text-lg font-bold" style={{ color: c }}>{s.value.toFixed(1)}</p>
              </div>
            );
          })}
        </div>

        {/* Biggest risk */}
        {data.biggest_risk && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-400 font-mono">PRIMARY RISK</p>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{data.biggest_risk}</p>
          </div>
        )}

        {/* Deal breakers */}
        {data.deal_breakers.length > 0 && (
          <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-red-500 font-mono">DEAL BREAKERS</p>
            </div>
            <ul className="space-y-1">
              {data.deal_breakers.map((d, i) => (
                <li key={i} className="text-red-300 text-sm font-medium">{d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk items */}
        {criticalAndHigh.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-mono">CRITICAL & HIGH RISKS</p>
            {criticalAndHigh.map((r, i) => <RiskCard key={i} risk={r} />)}
          </div>
        )}

        {mediumAndLow.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-mono">MEDIUM & LOW RISKS</p>
            {mediumAndLow.map((r, i) => <RiskCard key={i} risk={r} />)}
          </div>
        )}

        {/* DD flags */}
        {data.due_diligence_flags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-gold-400" />
              <p className="text-xs text-gold-400 font-mono">DUE DILIGENCE FLAGS</p>
            </div>
            <ul className="space-y-2">
              {data.due_diligence_flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-gold-500 font-mono text-xs mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
