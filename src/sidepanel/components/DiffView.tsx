// src/sidepanel/components/DiffView.tsx
// Side-by-side Site-Diff Comparison View

import React, { useState } from "react";
import { useStore } from "../store";
import { CopyButton } from "./CopyButton";
import {
  X,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Palette,
  Type,
  Layout,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const DiffView: React.FC = () => {
  const diffResult = useStore((state) => state.diffResult);
  const clearDiff = useStore((state) => state.clearDiff);
  const showToast = useStore((state) => state.showToast);

  const [activeCategory, setActiveCategory] = useState<
    "all" | "tokens" | "layout" | "components" | "animations"
  >("all");

  if (!diffResult) return null;

  const getSimColor = (sim: number) => {
    if (sim >= 85) return "text-emerald-500 bg-emerald-500";
    if (sim >= 60) return "text-amber-500 bg-amber-500";
    return "text-rose-500 bg-rose-500";
  };

  const getSimBorder = (sim: number) => {
    if (sim >= 85) return "border-emerald-500/30 bg-emerald-500/10";
    if (sim >= 60) return "border-amber-500/30 bg-amber-500/10";
    return "border-rose-500/30 bg-rose-500/10";
  };

  const baselineHost = new URL(diffResult.baselineUrl).hostname;
  const comparisonHost = new URL(diffResult.comparisonUrl).hostname;

  return (
    <div className="fixed inset-0 z-50 bg-base/95 backdrop-blur-sm flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="p-3 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/10 text-accent">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span>Site-Diff Comparison</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${getSimBorder(
                  diffResult.overallSimilarity
                )}`}
              >
                {diffResult.overallSimilarity}% Match
              </span>
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-secondary">
              <span className="truncate max-w-[100px]" title={diffResult.baselineUrl}>
                {baselineHost}
              </span>
              <ArrowRight className="w-2.5 h-2.5" />
              <span className="truncate max-w-[100px]" title={diffResult.comparisonUrl}>
                {comparisonHost}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearDiff}
          className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors"
          aria-label="Close diff"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Similarity Progress Bar */}
      <div className="px-4 py-3 bg-base border-b border-border space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-secondary font-medium">Design System Compatibility:</span>
          <span className="font-bold text-primary font-mono">{diffResult.overallSimilarity}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${getSimColor(
              diffResult.overallSimilarity
            ).split(" ")[1]}`}
            style={{ width: `${diffResult.overallSimilarity}%` }}
          />
        </div>
        <p className="text-[11px] text-secondary leading-tight mt-1">{diffResult.summary}</p>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-accent text-accent-contrast font-semibold"
              : "text-secondary hover:text-primary hover:bg-hover"
          }`}
        >
          All Changes
        </button>
        <button
          onClick={() => setActiveCategory("tokens")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            activeCategory === "tokens"
              ? "bg-accent text-accent-contrast font-semibold"
              : "text-secondary hover:text-primary hover:bg-hover"
          }`}
        >
          <Palette className="w-3 h-3" />
          Tokens
        </button>
        <button
          onClick={() => setActiveCategory("components")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            activeCategory === "components"
              ? "bg-accent text-accent-contrast font-semibold"
              : "text-secondary hover:text-primary hover:bg-hover"
          }`}
        >
          <Layers className="w-3 h-3" />
          Components
        </button>
        <button
          onClick={() => setActiveCategory("layout")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            activeCategory === "layout"
              ? "bg-accent text-accent-contrast font-semibold"
              : "text-secondary hover:text-primary hover:bg-hover"
          }`}
        >
          <Layout className="w-3 h-3" />
          Layout
        </button>
        <button
          onClick={() => setActiveCategory("animations")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
            activeCategory === "animations"
              ? "bg-accent text-accent-contrast font-semibold"
              : "text-secondary hover:text-primary hover:bg-hover"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Motion
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tokens Diff Section */}
        {(activeCategory === "all" || activeCategory === "tokens") && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-accent" />
              Token Group Diffs
            </h4>

            {diffResult.tokenDiffs.map((group) => {
              if (group.changes.length === 0) {
                return (
                  <div
                    key={group.category}
                    className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between text-xs"
                  >
                    <span className="capitalize font-medium text-primary">{group.category}</span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% Identical
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={group.category}
                  className="p-3 rounded-lg border border-border bg-base space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-semibold text-primary">{group.category}</span>
                    <span className="text-[11px] font-mono text-secondary">
                      {group.similarity}% similar ({group.changes.length} changes)
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    {group.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded flex items-center justify-between border ${
                          change.changeType === "added"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : change.changeType === "removed"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {change.changeType === "added" ? (
                            <PlusCircle className="w-3 h-3 shrink-0" />
                          ) : change.changeType === "removed" ? (
                            <MinusCircle className="w-3 h-3 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 shrink-0" />
                          )}
                          <span className="truncate">{change.name}</span>
                        </div>
                        <span className="text-[10px] shrink-0 font-sans uppercase font-bold">
                          {change.changeType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Components Diff Section */}
        {(activeCategory === "all" || activeCategory === "components") && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" />
              Component Diffs ({diffResult.componentDiffs.length})
            </h4>

            {diffResult.componentDiffs.length === 0 ? (
              <p className="text-xs text-secondary italic">No component discrepancies found.</p>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {diffResult.componentDiffs.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-border bg-surface flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-primary">{comp.label.toUpperCase()}</div>
                      {comp.structuralChanges && (
                        <div className="text-[11px] text-secondary mt-0.5">
                          {comp.structuralChanges}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                        comp.changeType === "added"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : comp.changeType === "removed"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {comp.changeType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Layout Diff Section */}
        {(activeCategory === "all" || activeCategory === "layout") && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-accent" />
              Layout Structure Diffs ({diffResult.layoutDiffs.length})
            </h4>

            {diffResult.layoutDiffs.length === 0 ? (
              <p className="text-xs text-secondary italic">
                Both sites share identical section hierarchies.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {diffResult.layoutDiffs.map((layout, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-border bg-surface flex items-center justify-between"
                  >
                    <span className="text-primary font-medium">{layout.details}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        layout.changeType === "added"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {layout.changeType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Animations Diff Section */}
        {(activeCategory === "all" || activeCategory === "animations") && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Motion & Animation Diffs ({diffResult.animationDiffs.length})
            </h4>

            {diffResult.animationDiffs.length === 0 ? (
              <p className="text-xs text-secondary italic">
                Both sites share matching animation library footprints.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {diffResult.animationDiffs.map((anim, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-border bg-surface flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-primary uppercase">{anim.library}</span>
                      <p className="text-[11px] text-secondary mt-0.5">{anim.details}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        anim.changeType === "added"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {anim.changeType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-border bg-surface flex items-center justify-between shrink-0">
        <CopyButton
          textToCopy={JSON.stringify(diffResult, null, 2)}
          label="Copy Diff JSON"
        />
        <button
          onClick={clearDiff}
          className="px-3 py-1.5 rounded-md bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Close Diff
        </button>
      </div>
    </div>
  );
};
