/**
 * MemoSection Component
 * Renders a single section of the investment memo.
 * Supports both prose content and list-based content (strengths/risks/questions).
 */

import React from "react";
import { LucideIcon } from "lucide-react";

interface MemoSectionProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  content: string | string[];
  variant?: "default" | "strength" | "risk" | "question";
  delay?: number;
}

const VARIANT_STYLES = {
  default: {
    bullet: "bg-slate-500",
    text: "text-slate-300",
    item: "border-slate-700/40 bg-obsidian-800/40",
  },
  strength: {
    bullet: "bg-emerald-500",
    text: "text-emerald-300",
    item: "border-emerald-500/20 bg-emerald-500/5",
  },
  risk: {
    bullet: "bg-crimson-500",
    text: "text-crimson-300",
    item: "border-crimson-500/20 bg-crimson-500/5",
  },
  question: {
    bullet: "bg-gold-500",
    text: "text-gold-300",
    item: "border-gold-400/20 bg-gold-400/5",
  },
};

export default function MemoSection({
  icon: Icon,
  iconColor = "#94a3b8",
  title,
  content,
  variant = "default",
  delay = 0,
}: MemoSectionProps) {
  const styles = VARIANT_STYLES[variant];
  const isList = Array.isArray(content);

  return (
    <div
      className="rounded-2xl border border-slate-700/40 bg-obsidian-800/60 backdrop-blur-sm overflow-hidden opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/30">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <h4 className="font-display text-slate-100 font-semibold">{title}</h4>
      </div>

      {/* Content */}
      <div className="p-6">
        {isList ? (
          <ul className="space-y-2.5">
            {(content as string[]).map((item, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles.item}`}
              >
                <span
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.bullet}`}
                />
                <span className={`text-sm leading-relaxed ${styles.text}`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed">
            {content as string}
          </p>
        )}
      </div>
    </div>
  );
}
