// Zero-State Landing UI Component

import React from "react";
import { Zap, Sparkles } from "lucide-react";

export const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 animate-pulse">
        <Zap className="w-7 h-7 fill-accent" />
      </div>

      <h3 className="text-sm font-bold text-primary mb-2">Ready to Extract Design Tokens</h3>
      
      <p className="text-xs text-secondary leading-relaxed max-w-[240px] mb-6">
        Visit any website and click <strong className="text-primary font-semibold">Extract Full Page</strong> below to capture colors, typography, spacing, and assets.
      </p>

      <div className="w-full max-w-[260px] bg-surface border border-border rounded-lg p-3 text-left space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-secondary">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Colors deduplicated & HSL clustered</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-secondary">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Typography scale & font stacks extracted</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-secondary">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Export to DESIGN.md, tokens.json & Tailwind</span>
        </div>
      </div>
    </div>
  );
};
