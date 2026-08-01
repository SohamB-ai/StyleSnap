// Progress Bar & Skeleton Loading Placeholder Component

import React from "react";
import { useStore } from "../store";

export const ExtractingState: React.FC = () => {
  const step = useStore((s) => s.progressStep);
  const pct = useStore((s) => s.progressPct);

  return (
    <div className="flex-1 p-4 space-y-6 overflow-hidden">
      {/* Progress Header */}
      <div className="space-y-2 bg-surface border border-border p-3.5 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary italic truncate pr-2">
            {step || "Analysing design system..."}
          </span>
          <span className="font-mono font-bold text-accent">{pct}%</span>
        </div>
        
        {/* Progress Bar Track */}
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Shimmer Skeletons */}
      <div className="space-y-4">
        {/* Colors Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-elevated rounded animate-shimmer" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-surface border border-border rounded-md p-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-elevated rounded animate-shimmer shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-2.5 w-16 bg-elevated rounded animate-shimmer" />
                  <div className="h-2 w-10 bg-elevated rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-24 bg-elevated rounded animate-shimmer" />
          <div className="h-20 bg-surface border border-border rounded-md p-3 space-y-2">
            <div className="h-4 w-32 bg-elevated rounded animate-shimmer" />
            <div className="h-2.5 w-full bg-elevated rounded animate-shimmer" />
            <div className="h-2.5 w-3/4 bg-elevated rounded animate-shimmer" />
          </div>
        </div>

        {/* Spacing Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-elevated rounded animate-shimmer" />
          <div className="h-10 bg-surface border border-border rounded-md p-2 flex items-center gap-2">
            <div className="h-3 w-full bg-elevated rounded animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};
