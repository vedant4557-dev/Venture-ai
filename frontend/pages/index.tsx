/**
 * Home Page — AI VC Analyzer
 * Main entry point. Manages the upload → loading → results state machine.
 */

import React, { useState } from "react";
import Head from "next/head";
import { BarChart2 } from "lucide-react";
import { analyzePitchDeck, AnalysisResult } from "../lib/api";
import UploadZone from "../components/UploadZone";
import AnalysisDashboard from "../components/AnalysisDashboard";

type AppState = "idle" | "loading" | "results" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage("");
    if (appState === "error") setAppState("idle");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAppState("loading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const analysisResult = await analyzePitchDeck(selectedFile, (pct) => {
        setUploadProgress(pct);
      });
      setResult(analysisResult);
      setAppState("results");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Analysis failed. Please try again.";
      setErrorMessage(msg);
      setAppState("error");
    }
  };

  const handleReset = () => {
    setAppState("idle");
    setSelectedFile(null);
    setResult(null);
    setUploadProgress(0);
    setErrorMessage("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>AI VC Analyzer — Due Diligence Platform</title>
        <meta
          name="description"
          content="Upload a startup pitch deck and get an AI-generated VC investment memo and score in seconds."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-obsidian-950 bg-radial-glow">
        {/* Subtle grid overlay */}
        <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="relative z-10 border-b border-slate-800/60 backdrop-blur-sm bg-obsidian-950/80 sticky top-0">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/20">
                <BarChart2 className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <span className="font-display text-slate-100 font-bold text-lg leading-none block">
                  VentureAI
                </span>
                <span className="text-slate-600 text-xs font-mono">
                  Due Diligence Platform
                </span>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Engine Online
            </div>
          </div>
        </header>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">

          {/* Results view */}
          {appState === "results" && result ? (
            <AnalysisDashboard
              result={result}
              fileName={selectedFile?.name || "pitch_deck.pdf"}
              onReset={handleReset}
            />
          ) : (
            /* Upload / Loading view */
            <div className="max-w-2xl mx-auto">
              {/* Hero text */}
              <div className="text-center mb-12 space-y-4">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-400/20 bg-gold-400/5 text-gold-400 text-xs font-mono uppercase tracking-widest opacity-0 animate-fade-up stagger-1"
                  style={{ animationFillMode: "forwards" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-gold" />
                  AI-Powered Due Diligence
                </div>

                <h1
                  className="font-display text-5xl md:text-6xl font-bold text-slate-100 leading-tight opacity-0 animate-fade-up stagger-2"
                  style={{ animationFillMode: "forwards" }}
                >
                  Analyze Any{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-500">
                    Pitch Deck
                  </span>
                  <br />
                  in Seconds
                </h1>

                <p
                  className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto opacity-0 animate-fade-up stagger-3"
                  style={{ animationFillMode: "forwards" }}
                >
                  Upload a startup's pitch deck and receive a comprehensive
                  VC-grade investment memo with scoring across 5 dimensions.
                </p>
              </div>

              {/* Upload card */}
              <div
                className="rounded-3xl border border-slate-700/40 bg-obsidian-800/60 backdrop-blur-sm p-8 space-y-6 opacity-0 animate-fade-up stagger-4"
                style={{ animationFillMode: "forwards" }}
              >
                <UploadZone
                  onFileSelect={handleFileSelect}
                  isLoading={appState === "loading"}
                  uploadProgress={uploadProgress}
                />

                {/* Error message */}
                {appState === "error" && errorMessage && (
                  <div className="rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-crimson-400 text-sm">
                    <strong>Error:</strong> {errorMessage}
                  </div>
                )}

                {/* Analyze button */}
                {appState !== "loading" && (
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile}
                    className={`
                      w-full py-4 rounded-2xl font-display font-semibold text-lg
                      transition-all duration-300 relative overflow-hidden
                      ${selectedFile
                        ? "bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 hover:from-gold-500 hover:to-gold-400 hover:shadow-lg hover:shadow-gold-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        : "bg-obsidian-700 text-slate-600 cursor-not-allowed border border-slate-700/50"
                      }
                    `}
                  >
                    {selectedFile ? "Analyze Pitch Deck →" : "Select a PDF to Begin"}
                  </button>
                )}
              </div>

              {/* Feature pills */}
              <div
                className="flex flex-wrap justify-center gap-2 mt-8 opacity-0 animate-fade-up stagger-5"
                style={{ animationFillMode: "forwards" }}
              >
                {[
                  "Company Overview",
                  "Market Analysis",
                  "Team Assessment",
                  "Risk Scoring",
                  "Investment Memo",
                  "IC Questions",
                ].map((label) => (
                  <span
                    key={label}
                    className="text-xs font-mono text-slate-500 border border-slate-700/50 rounded-full px-3 py-1"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-slate-800/60 mt-24 py-6">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-slate-600 text-xs font-mono">
            <span>VentureAI © {new Date().getFullYear()}</span>
            <span>Powered by Claude AI</span>
          </div>
        </footer>
      </div>
    </>
  );
}
