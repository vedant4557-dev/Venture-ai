/**
 * VentureAI Platform v2 — Full Intelligence Dashboard
 * Main page for the enhanced analysis experience.
 * Uses /api/analyze/full endpoint — all 5 intelligence modules.
 *
 * Preserves v1 upload interface, adds v2 results display.
 */

import React, { useState } from "react";
import Head from "next/head";
import {
  BarChart2, Shield, TrendingUp, Users, Building2,
  Globe, ChevronRight, RotateCcw, Clock, CheckCircle,
  Layers, Cpu
} from "lucide-react";
import { analyzeFullPitchDeck, FullAnalysisResult } from "../lib/api_v2";

// Components
import FounderIntelligenceCard from "../components/FounderIntelligenceCard";
import StartupSignalsCard from "../components/StartupSignalsCard";
import RiskEngineCard from "../components/RiskEngineCard";
import EnhancedScoreCard from "../components/EnhancedScoreCard";

type AppState = "idle" | "uploading" | "analyzing" | "results" | "error";

// ── Loading Steps Component ────────────────────────────────────────────────────
function AnalysisProgress({ step }: { step: number }) {
  const steps = [
    { label: "Extracting PDF text", icon: Layers },
    { label: "Core AI analysis", icon: Cpu },
    { label: "Founder intelligence", icon: Users },
    { label: "Signal detection", icon: TrendingUp },
    { label: "Risk assessment", icon: Shield },
    { label: "Scoring & synthesis", icon: BarChart2 },
  ];

  return (
    <div className="space-y-3 w-full max-w-sm mx-auto">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 ${
              done   ? "border-emerald-500/30 bg-emerald-500/5 opacity-70" :
              active ? "border-gold-400/40 bg-gold-400/5" :
                       "border-slate-700/30 opacity-30"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${done ? "bg-emerald-500/20" : active ? "bg-gold-400/20" : "bg-slate-700/30"}`}>
              {done ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${active ? "text-gold-400" : "text-slate-600"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${done ? "text-emerald-400" : active ? "text-gold-300" : "text-slate-600"}`}>
              {s.label}
            </span>
            {active && (
              <div className="ml-auto flex gap-1">
                {[0,1,2].map(d => (
                  <div key={d} className="w-1 h-1 rounded-full bg-gold-400 animate-pulse" style={{ animationDelay: `${d * 0.2}s` }} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Memo Section Component ────────────────────────────────────────────────────
function MemoSection({ title, content, icon: Icon, iconColor }: {
  title: string; content: string | string[];
  icon: React.ElementType; iconColor: string;
}) {
  const isList = Array.isArray(content);
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-700/30">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${iconColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <h4 className="font-display text-slate-100 font-semibold text-sm">{title}</h4>
      </div>
      <div className="p-5">
        {isList ? (
          <ul className="space-y-2">
            {(content as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm leading-relaxed">
                <ChevronRight className="w-3.5 h-3.5 text-gold-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed">{content as string}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FullAnalysisPage() {
  const [state, setAppState] = useState<AppState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) { setError("PDF files only."); return; }
    if (f.size > 50 * 1024 * 1024) { setError("Max 50MB."); return; }
    setFile(f); setError("");
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAppState("uploading");
    setUploadPct(0);
    setAnalysisStep(0);

    // Simulate step progression during analysis
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => Math.min(prev + 1, 5));
    }, 8000);

    try {
      const data = await analyzeFullPitchDeck(file, (pct) => {
        setUploadPct(pct);
        if (pct === 100) setAppState("analyzing");
      });
      clearInterval(stepInterval);
      setResult(data);
      setAppState("results");
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err?.response?.data?.detail || err?.message || "Analysis failed.");
      setAppState("error");
    }
  };

  const reset = () => {
    setAppState("idle"); setFile(null); setResult(null);
    setError(""); setUploadPct(0); setAnalysisStep(0);
  };

  return (
    <>
      <Head>
        <title>VentureAI — Investment Intelligence Platform</title>
        <meta name="description" content="AI-powered VC due diligence with founder intelligence, signal detection, and risk analysis." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-[#050507]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Grid overlay */}
        <div className="fixed inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(212,168,67,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.05) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Glow */}
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 40% at 50% -5%, rgba(212,168,67,0.07), transparent)" }} />

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="relative z-10 border-b border-slate-800/60 bg-[#050507]/90 backdrop-blur-sm sticky top-0">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#d4a843]/10 border border-[#d4a843]/20">
                <BarChart2 className="w-5 h-5 text-[#d4a843]" />
              </div>
              <div>
                <span className="text-slate-100 font-bold text-lg leading-none block" style={{ fontFamily: "'Playfair Display', serif" }}>
                  VentureAI
                </span>
                <span className="text-slate-600 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Investment Intelligence v2.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {result && (
                <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-[#d4a843] text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-[#d4a843]/5 border border-transparent hover:border-[#d4a843]/20">
                  <RotateCcw className="w-3.5 h-3.5" />
                  New Analysis
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                5 Modules Active
              </div>
            </div>
          </div>
        </header>

        {/* ── Main ──────────────────────────────────────────────────────────── */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">

          {/* ── RESULTS VIEW ────────────────────────────────────────────────── */}
          {state === "results" && result ? (
            <div className="space-y-8">
              {/* Results header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest">
                      Analysis Complete · {result.meta?.analysis_time_seconds}s · {result.meta?.modules_run?.length} modules
                    </span>
                  </div>
                  <h1 className="text-slate-100 font-bold text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Investment Intelligence Report
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 font-mono">{result.meta?.file_name}</p>
                </div>
              </div>

              {/* 3-column layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left col: Memo sections */}
                <div className="xl:col-span-2 space-y-4">
                  <MemoSection title="Company Overview" content={result.company_overview} icon={Building2} iconColor="#d4a843" />
                  <MemoSection title="Business Model" content={result.business_model} icon={BarChart2} iconColor="#60a5fa" />
                  <MemoSection title="Market Analysis" content={result.market_analysis} icon={Globe} iconColor="#a78bfa" />
                  <MemoSection title="Competitive Landscape" content={result.competitive_landscape} icon={Layers} iconColor="#fb923c" />
                  <MemoSection title="Strengths" content={result.strengths} icon={CheckCircle} iconColor="#4ade80" />
                  <MemoSection title="Key IC Questions" content={result.key_questions} icon={Cpu} iconColor="#d4a843" />

                  {/* Intelligence modules */}
                  <FounderIntelligenceCard data={result.founder_intelligence} />
                  <StartupSignalsCard data={result.startup_signals} />
                  <RiskEngineCard data={result.risk_report} />
                </div>

                {/* Right col: Score card (sticky) */}
                <div className="xl:col-span-1">
                  <div className="sticky top-24">
                    <EnhancedScoreCard
                      score={result.investment_score}
                      recommendation={result.recommendation}
                    />
                  </div>
                </div>
              </div>
            </div>

          /* ── LOADING VIEW ──────────────────────────────────────────────── */
          ) : state === "uploading" || state === "analyzing" ? (
            <div className="max-w-lg mx-auto text-center py-16 space-y-8">
              <div>
                <p className="text-[#d4a843] text-sm font-mono uppercase tracking-widest mb-2">
                  {state === "uploading" ? `Uploading… ${uploadPct}%` : "Running intelligence modules…"}
                </p>
                <h2 className="text-slate-100 text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Analyzing Pitch Deck
                </h2>
                <p className="text-slate-500 text-sm mt-2">Running 5 AI modules concurrently — ~30–60 seconds</p>
              </div>
              <AnalysisProgress step={state === "uploading" ? 0 : analysisStep + 1} />
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-mono">This is more thorough than the standard analysis</span>
              </div>
            </div>

          /* ── IDLE / UPLOAD VIEW ────────────────────────────────────────── */
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* Hero */}
              <div className="text-center mb-12 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/5 text-[#d4a843] text-xs font-mono uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4a843] animate-pulse" />
                  5-Module Intelligence Platform
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-slate-100 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Institutional-Grade{" "}
                  <span style={{ color: "#d4a843" }}>Due Diligence</span>
                  <br />in Minutes
                </h1>

                <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                  Upload a pitch deck and receive a complete IC-ready investment memo —
                  with founder intelligence, signal detection, and risk analysis.
                </p>
              </div>

              {/* Module pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  { icon: Building2, label: "Core Analysis", color: "#d4a843" },
                  { icon: Users, label: "Founder Intel", color: "#60a5fa" },
                  { icon: TrendingUp, label: "Signal Detection", color: "#4ade80" },
                  { icon: Shield, label: "Risk Engine", color: "#f87171" },
                  { icon: BarChart2, label: "Enhanced Scoring", color: "#a78bfa" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/40" style={{ color: m.color }}>
                    <m.icon className="w-3 h-3" />
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Upload card */}
              <div className="rounded-3xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-sm p-8 space-y-5">
                {/* Drop zone */}
                <div
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => document.getElementById("file-input")?.click()}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 p-12 text-center overflow-hidden
                    ${isDragging ? "border-[#d4a843] bg-[#d4a843]/5 scale-[1.01]" : file ? "border-emerald-500/50 bg-emerald-500/3" : "border-slate-600/40 hover:border-[#d4a843]/40 hover:bg-[#d4a843]/3"}`}
                >
                  {/* Scan line */}
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/40 to-transparent animate-pulse" />

                  <div className="flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-2xl border transition-colors ${isDragging ? "border-[#d4a843]/40 bg-[#d4a843]/10" : file ? "border-emerald-500/40 bg-emerald-500/10" : "border-slate-600/30 bg-slate-800"}`}>
                      {file ? <CheckCircle className="w-8 h-8 text-emerald-400" /> : <BarChart2 className={`w-8 h-8 ${isDragging ? "text-[#d4a843]" : "text-slate-500"}`} />}
                    </div>

                    {file ? (
                      <div>
                        <p className="text-emerald-400 font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{file.name}</p>
                        <p className="text-slate-500 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-300 font-medium text-lg">Drop your pitch deck here</p>
                        <p className="text-slate-500 text-sm mt-1">or <span className="text-[#d4a843]">browse files</span> · PDF only · Max 50MB</p>
                      </div>
                    )}
                  </div>
                  <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Analyze button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!file}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300
                    ${file
                      ? "bg-gradient-to-r from-[#b8881a] to-[#d4a843] text-[#050507] hover:from-[#d4a843] hover:to-[#e8c87a] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#d4a843]/20"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50"
                    }`}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {file ? "Run Full Intelligence Analysis →" : "Select a PDF to Begin"}
                </button>

                <p className="text-center text-slate-600 text-xs font-mono">
                  Runs 5 AI modules · ~30–60 seconds · IC-ready output
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800/60 mt-24 py-6">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-slate-600 text-xs font-mono">
            <span>VentureAI v2.0 © {new Date().getFullYear()}</span>
            <span>Founder Intelligence · Signal Detection · Risk Engine · Enhanced Scoring</span>
          </div>
        </footer>
      </div>
    </>
  );
}
