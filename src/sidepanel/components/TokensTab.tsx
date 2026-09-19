// Tokens Tab View Component — Visual Tokens Specification (Task 2)

import React, { useState } from "react";
import { CopyButton } from "./CopyButton";
import { useStore } from "../store";
import { ColorToken } from "../../shared/types";

export const TokensTab: React.FC = () => {
  const extraction = useStore((s) => s.extraction || s.result);
  const [showAllColors, setShowAllColors] = useState<boolean>(false);

  // If no extraction yet, show a grey placeholder skeleton for each section
  if (!extraction) {
    return (
      <div className="p-3.5 space-y-5 pb-8 select-none">
        {/* Colours Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-elevated rounded animate-shimmer" />
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-surface border border-border rounded-lg p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-elevated animate-shimmer shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-elevated rounded animate-shimmer" />
                    <div className="h-2.5 w-24 bg-elevated rounded animate-shimmer" />
                  </div>
                </div>
                <div className="h-3 w-12 bg-elevated rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Typography Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-elevated rounded animate-shimmer" />
          <div className="h-20 bg-surface border border-border rounded-lg p-3 space-y-2">
            <div className="h-4 w-32 bg-elevated rounded animate-shimmer" />
            <div className="flex gap-1.5 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 w-10 bg-elevated rounded-full animate-shimmer" />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Spacing Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-elevated rounded animate-shimmer" />
          <div className="h-16 bg-surface border border-border rounded-lg p-3 space-y-2">
            <div className="h-2 w-3/4 bg-elevated rounded animate-shimmer" />
            <div className="h-2 w-1/2 bg-elevated rounded animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  const { tokens } = extraction;

  // Helpers for Copying
  const getAllColorsCSS = () => {
    let css = ":root {\n";
    for (const c of tokens.colors) {
      const varName = c.cssVarName || `--color-${c.suggestedName.toLowerCase().replace(/\s+/g, "-")}`;
      css += `  ${varName}: ${c.hex};\n`;
    }
    css += "}";
    return css;
  };

  const getTypographyCSS = (familyStack?: string) => {
    if (familyStack) {
      return `font-family: ${familyStack};`;
    }
    let css = "/* Typography System */\n";
    for (const f of tokens.typography.families) {
      css += `/* ${f.name} */\n--font-${f.name.toLowerCase()}: ${f.stack};\n`;
    }
    return css;
  };

  const getSpacingScaleCSS = () => {
    let css = `/* Spacing Scale (${tokens.spacing.baseUnit}px grid) */\n`;
    tokens.spacing.values.forEach((v) => {
      css += `--${v.token}: ${v.px}px;\n`;
    });
    return css;
  };

  const getShadowsCSS = () => {
    let css = "/* Shadows */\n";
    tokens.shadows.forEach((sh) => {
      css += `--shadow-${sh.level}: ${sh.value};\n`;
    });
    return css;
  };

  const getBreakpointsCSS = () => {
    let css = "/* Media Query Breakpoints */\n";
    tokens.breakpoints.forEach((b) => {
      css += `@media (min-width: ${b.px}px) { /* ${b.label} */ }\n`;
    });
    return css;
  };

  const displayedColors = showAllColors ? tokens.colors : tokens.colors.slice(0, 5);
  const maxSpacingPx = tokens.spacing.values.length > 0 
    ? Math.max(...tokens.spacing.values.map((v) => v.px), 64) 
    : 64;

  return (
    <div className="p-3.5 space-y-5 pb-8 text-xs select-none">
      {/* SECTION A — COLOURS */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
            COLOURS
          </h3>
          <CopyButton textToCopy={getAllColorsCSS()} label="Copy CSS" />
        </div>

        <div className="space-y-1.5">
          {displayedColors.map((color: ColorToken) => (
            <div
              key={color.id}
              className="bg-surface border border-border rounded-lg p-2.5 flex items-center justify-between gap-3 group hover:border-accent/40 transition-colors"
            >
              {/* Left: Swatch */}
              <div
                className="w-7 h-7 rounded shrink-0 border border-border shadow-xs"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />

              {/* Center-left: Hex + suggestedName */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[12px] font-bold text-accent truncate">
                  {color.hex}
                </div>
                <div className="font-sans text-[12px] font-semibold text-primary truncate">
                  {color.suggestedName}
                </div>
              </div>

              {/* Center-right: HSL string */}
              <div className="hidden sm:block font-sans text-[11px] text-secondary font-normal truncate max-w-[120px]">
                {color.hsl}
              </div>

              {/* Right: Frequency badge + Copy icon (shows on hover) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-sans text-[11px] text-muted bg-elevated px-1.5 py-0.5 rounded">
                  {color.frequency}
                </span>
                <CopyButton
                  textToCopy={color.hex}
                  iconOnly
                  className="opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))}
        </div>

        {tokens.colors.length > 5 && (
          <button
            onClick={() => setShowAllColors(!showAllColors)}
            className="w-full py-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors text-center"
          >
            {showAllColors ? "Show top 5" : `Show all ${tokens.colors.length} colours`}
          </button>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* SECTION B — TYPOGRAPHY */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
            TYPOGRAPHY
          </h3>
          <CopyButton textToCopy={getTypographyCSS()} label="Copy CSS" />
        </div>

        <div className="space-y-2">
          {tokens.typography.families.map((family, idx) => {
            // Find size steps that match this family (or generic ones)
            const sizes = tokens.typography.scale
              .filter((s) => s.fontFamily === family.name || !s.fontFamily)
              .map((s) => s.fontSize);
            const displaySizes = Array.from(new Set(sizes.length > 0 ? sizes : ["12px", "14px", "16px", "24px", "32px"]));

            return (
              <div
                key={idx}
                className="bg-surface border border-border rounded-lg p-3 space-y-2"
              >
                {/* Family Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="font-sans font-semibold text-[13px] text-primary truncate">
                      {family.name}
                    </span>
                    <span className="font-sans text-[11px] text-muted truncate">
                      {family.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted bg-elevated px-1.5 py-0.5 rounded">
                      {family.weights.length} weights
                    </span>
                    <CopyButton textToCopy={getTypographyCSS(family.stack)} label="Copy CSS" />
                  </div>
                </div>

                {/* Size Scale Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {displaySizes.map((sz, szIdx) => (
                    <span
                      key={szIdx}
                      className="px-2 py-0.5 rounded-full bg-elevated border border-border text-[10px] font-mono text-secondary"
                    >
                      {sz}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* SECTION C — SPACING */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
              SPACING
            </h3>
            <span className="text-[10px] font-mono bg-elevated border border-border text-secondary px-1.5 py-0.5 rounded">
              {tokens.spacing.baseUnit}px grid
            </span>
          </div>
          <CopyButton textToCopy={getSpacingScaleCSS()} label="Copy Scale" />
        </div>

        <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
          {tokens.spacing.values.slice(0, 8).map((sp, idx) => {
            const barWidth = Math.min(160, Math.max(8, Math.round((sp.px / maxSpacingPx) * 160)));
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-12 text-right font-mono text-[11px] text-muted shrink-0">
                  {sp.px}px
                </span>
                <div className="flex-1 flex items-center">
                  <div
                    className="bg-accent rounded-xs"
                    style={{
                      width: `${barWidth}px`,
                      height: "6px",
                      borderRadius: "2px",
                      backgroundColor: "var(--accent)"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* SECTION D — SHADOWS + RADII (side by side, 2-col) */}
      <section className="grid grid-cols-2 gap-3">
        {/* Left Col: SHADOWS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
              SHADOWS
            </h3>
            <CopyButton textToCopy={getShadowsCSS()} label="Copy" />
          </div>

          <div className="bg-surface border border-border rounded-lg p-2.5 space-y-2">
            {(tokens.shadows.length > 0 ? tokens.shadows : [
              { level: "sm", value: "0 1px 2px 0 rgba(0,0,0,0.05)" },
              { level: "md", value: "0 4px 6px -1px rgba(0,0,0,0.1)" },
              { level: "lg", value: "0 10px 15px -3px rgba(0,0,0,0.1)" },
              { level: "xl", value: "0 20px 25px -5px rgba(0,0,0,0.1)" }
            ]).map((sh: any, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-primary uppercase">{sh.level}</span>
                <div
                  className="w-5 h-5 bg-elevated border border-border rounded"
                  style={{ boxShadow: sh.value }}
                  title={sh.value}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: RADII */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
              RADII
            </h3>
            <CopyButton
              textToCopy={tokens.radii.map((r) => `--radius-${r.level}: ${r.value};`).join("\n")}
              label="Copy"
            />
          </div>

          <div className="bg-surface border border-border rounded-lg p-2.5 space-y-2">
            {(tokens.radii.length > 0 ? tokens.radii : [
              { level: "none", value: "0px" },
              { level: "sm", value: "4px" },
              { level: "md", value: "8px" },
              { level: "lg", value: "12px" },
              { level: "full", value: "9999px" }
            ]).map((r: any, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-primary">{r.level}</span>
                <div
                  className="w-5 h-5 bg-elevated border border-accent/40"
                  style={{ borderRadius: r.value }}
                  title={r.value}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* SECTION E — BREAKPOINTS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
            BREAKPOINTS
          </h3>
          <CopyButton textToCopy={getBreakpointsCSS()} label="Copy CSS" />
        </div>

        <div className="flex flex-wrap gap-2">
          {tokens.breakpoints.map((b, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-full bg-surface border border-border font-mono text-[11px] text-primary"
            >
              {b.label ? `${b.label}: ` : ""}{b.px}px
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
