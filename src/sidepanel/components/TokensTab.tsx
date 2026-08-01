// Tokens Tab View Component (Colors, Typography, Spacing, Shadows, Radii, Breakpoints)

import React, { useState } from "react";
import { useStore } from "../store";
import { CopyButton } from "./CopyButton";
import { ColorToken } from "../../shared/types";

export const TokensTab: React.FC = () => {
  const result = useStore((s) => s.result);
  const [showAllColors, setShowAllColors] = useState(false);

  if (!result) return null;

  const { tokens } = result;
  const displayedColors = showAllColors ? tokens.colors : tokens.colors.slice(0, 8);

  const formatCSSRootVariables = () => {
    let css = ":root {\n";
    for (const c of tokens.colors) {
      css += `  ${c.cssVarName || `--color-${c.suggestedName.toLowerCase().replace(/\s+/g, "-")}`}: ${c.hex};\n`;
    }
    css += "}";
    return css;
  };

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* 1. COLOURS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">Colours</h4>
            <span className="text-[10px] bg-elevated px-1.5 py-0.5 rounded text-muted">
              {tokens.colors.length}
            </span>
          </div>
          <CopyButton textToCopy={formatCSSRootVariables()} label="Copy CSS Vars" />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {displayedColors.map((color: ColorToken) => (
            <div
              key={color.id}
              className="bg-surface border border-border rounded-md p-2 flex items-center justify-between group hover:border-accent/50 transition-colors"
            >
              {/* Left: Swatch & Info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded border border-border shadow-sm shrink-0"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-primary">{color.hex}</span>
                    <span className="text-[10px] font-semibold text-secondary truncate max-w-[110px]">
                      {color.suggestedName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted font-mono">
                    <span>{color.hsl}</span>
                    <span className="capitalize bg-elevated px-1 rounded text-[9px] text-secondary">
                      {color.semanticGroup}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Frequency & Copy */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted bg-elevated px-1.5 py-0.5 rounded">
                  {color.frequency}x
                </span>
                <CopyButton textToCopy={color.hex} iconOnly />
              </div>
            </div>
          ))}
        </div>

        {tokens.colors.length > 8 && (
          <button
            onClick={() => setShowAllColors(!showAllColors)}
            className="w-full py-1.5 text-xs text-accent hover:text-accent-hover font-medium bg-surface/50 border border-border rounded hover:bg-hover transition-colors"
          >
            {showAllColors ? "Show Less" : `+ ${tokens.colors.length - 8} More Colours`}
          </button>
        )}
      </section>

      {/* 2. TYPOGRAPHY SECTION */}
      <section className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">Typography</h4>
          {tokens.typography.families[0] && (
            <CopyButton textToCopy={tokens.typography.families[0].stack} label="Copy Font Stack" />
          )}
        </div>

        {tokens.typography.families.map((family, i) => (
          <div key={i} className="bg-surface border border-border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div>
                <span className="font-bold text-xs text-primary">{family.name}</span>
                <span className="text-[10px] text-muted ml-2 font-mono">{family.category}</span>
              </div>
              <span className="text-[10px] text-muted">
                {family.weights.join(", ")}
              </span>
            </div>

            {/* Font Specimen Preview */}
            <div
              className="text-lg font-medium text-primary py-1 truncate"
              style={{ fontFamily: family.stack }}
            >
              The quick brown fox jumps over the lazy dog
            </div>

            {/* Type Scale Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tokens.typography.scale.slice(0, 6).map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-elevated px-2 py-0.5 rounded text-[10px] font-mono text-secondary flex items-center gap-1"
                >
                  <span className="font-semibold text-primary uppercase">{entry.role}:</span>
                  <span>{entry.fontSize}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 3. SPACING SCALE SECTION */}
      <section className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">Spacing Scale</h4>
            <span className="text-[10px] bg-elevated px-1.5 py-0.5 rounded text-muted font-mono">
              {tokens.spacing.baseUnit}px Grid
            </span>
          </div>
          <CopyButton
            textToCopy={tokens.spacing.values.map((v) => `${v.px}px`).join(", ")}
            label="Copy Scale"
          />
        </div>

        <div className="bg-surface border border-border rounded-md p-3 space-y-2.5">
          {tokens.spacing.values.slice(0, 8).map((sp, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-secondary w-12">{sp.px}px</span>
              
              {/* Visualizer Bar */}
              <div className="flex-1 mx-3 bg-elevated h-2 rounded overflow-hidden">
                <div
                  className="bg-accent h-full rounded"
                  style={{ width: `${Math.min(100, (sp.px / 64) * 100)}%` }}
                />
              </div>

              <span className="font-mono text-[10px] text-muted w-14 text-right">{sp.rem}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SHADOWS & BORDER RADII */}
      <section className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
        {/* Shadows */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary">Shadows</h4>
          <div className="bg-surface border border-border rounded-md p-2 space-y-1.5">
            {tokens.shadows.length > 0 ? (
              tokens.shadows.map((sh, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-primary capitalize">{sh.level}</span>
                  <CopyButton textToCopy={sh.value} iconOnly />
                </div>
              ))
            ) : (
              <span className="text-[10px] text-muted">No custom shadows</span>
            )}
          </div>
        </div>

        {/* Border Radii */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary">Border Radius</h4>
          <div className="bg-surface border border-border rounded-md p-2 space-y-1.5">
            {tokens.radii.length > 0 ? (
              tokens.radii.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-primary">{r.level} ({r.value})</span>
                  <CopyButton textToCopy={r.value} iconOnly />
                </div>
              ))
            ) : (
              <span className="text-[10px] text-muted">Default radii</span>
            )}
          </div>
        </div>
      </section>

      {/* 5. BREAKPOINTS SECTION */}
      {tokens.breakpoints.length > 0 && (
        <section className="space-y-2 pt-2 border-t border-border/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">Breakpoints</h4>
          <div className="grid grid-cols-2 gap-2">
            {tokens.breakpoints.map((b, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border rounded p-2 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-accent uppercase">{b.label}</span>
                <span className="font-mono text-[11px] text-secondary">{b.px}px ({b.em})</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
