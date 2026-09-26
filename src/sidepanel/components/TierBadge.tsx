// src/sidepanel/components/TierBadge.tsx
// Visual badge displaying detection accuracy tier (Tier 1, 2, 3)

import React from "react";
import { AccuracyTier } from "../../shared/types";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface TierBadgeProps {
  tier: AccuracyTier;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = "" }) => {
  if (tier === 1) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
        title="Tier 1: High Accuracy (Runtime library globals & exact configuration extracted)"
      >
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        Tier 1 · High Accuracy
      </span>
    );
  }

  if (tier === 2) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}
        title="Tier 2: Heuristic (Motion components & inline CSS variables identified)"
      >
        <ShieldAlert className="w-3 h-3 text-amber-500" />
        Tier 2 · Heuristic
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 ${className}`}
      title="Tier 3: Presence Only (Computed CSS & DOM attribute scanning)"
    >
      <Shield className="w-3 h-3 text-zinc-400" />
      Tier 3 · DOM Scan
    </span>
  );
};
