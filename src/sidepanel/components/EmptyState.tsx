// Empty State UI Component — Stitch-designed landing screen

import React from "react";
import { Zap, Sparkles } from "lucide-react";
import { StyleSnapLogoIcon } from "./Logo";
import { useStore } from "../store";
import { triggerPageExtraction } from "../utils/tab";

export const EmptyState: React.FC = () => {
  const isExtracting = useStore((s) => s.isExtracting);

  const handleExtract = () => {
    triggerPageExtraction();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Central Illustration Badge */}
      <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center mb-4 shadow-sm">
        <StyleSnapLogoIcon size={36} />
      </div>

      <h3 className="text-sm font-bold text-primary mb-1">
        No design tokens extracted yet
      </h3>

      <p className="text-xs text-secondary leading-relaxed max-w-[240px] mb-6">
        Click below to scan the active web page and generate DESIGN.md & SKILL.md specs.
      </p>

      {/* Primary Call To Action Button */}
      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className="w-full max-w-[280px] py-2.5 px-4 rounded-xl bg-accent text-accent-contrast font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90"
      >
        {isExtracting ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Extracting design system...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>Extract Page Design</span>
          </>
        )}
      </button>

      {/* Inspector Mode Hint */}
      <div className="mt-5 p-2.5 bg-surface border border-border/70 rounded-lg max-w-[280px] text-[11px] text-secondary text-left flex items-start gap-2">
        <span className="text-accent text-sm leading-none mt-0.5">🎯</span>
        <div>
          <span className="font-semibold text-primary">Hover Inspector:</span>{" "}
          Click the target cursor icon in the top header to inspect any single element on the page.
        </div>
      </div>

      {/* Feature Capabilities Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-[280px]">
        {["🎨 Design Tokens", "🧩 Components", "📐 Layout Structure", "⚡ AI Prompts", "📦 ZIP Export"].map((feat) => (
          <span key={feat} className="text-[10px] font-mono px-2 py-0.5 bg-elevated border border-border/60 text-secondary rounded-full">
            {feat}
          </span>
        ))}
      </div>
    </div>
  );
};

