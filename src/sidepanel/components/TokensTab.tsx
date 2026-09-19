// Tokens Tab View Component — Collapsible "Read More" Accordion Layout

import React from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "../store";
import { CopyButton } from "./CopyButton";
import { CollapsibleSection } from "./CollapsibleSection";
import { ColorToken } from "../../shared/types";

export const TokensTab: React.FC = () => {
  const result = useStore((s) => s.result);

  if (!result) return null;

  const { tokens } = result;

  const formatCSSRootVariables = () => {
    let css = ":root {\n";
    for (const c of tokens.colors) {
      css += `  ${c.cssVarName || `--color-${c.suggestedName.toLowerCase().replace(/\s+/g, "-")}`}: ${c.hex};\n`;
    }
    css += "}";
    return css;
  };

  return (
    <div className="p-3 space-y-4 pb-8 text-xs">
      {/* Theme Summary Banner */}
      {tokens.themeSummary && (
        <div className="bg-accent/10 border border-accent/25 rounded-md p-2.5 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[11px] text-accent uppercase tracking-wider">Website Theme</div>
            <p className="text-[11px] text-secondary leading-snug">{tokens.themeSummary}</p>
          </div>
        </div>
      )}

      {/* 1. COLOURS SECTION */}
      <CollapsibleSection
        title="Colours"
        count={tokens.colors.length}
        defaultOpen={true}
        headerExtra={<CopyButton textToCopy={formatCSSRootVariables()} label="Copy CSS" />}
        previewSummary={
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {tokens.colors.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="w-5 h-5 rounded border border-border shrink-0 shadow-xs"
                style={{ backgroundColor: c.hex }}
                title={`${c.suggestedName}: ${c.hex}`}
              />
            ))}
            {tokens.colors.length > 6 && (
              <span className="text-[10px] text-muted font-mono">+{tokens.colors.length - 6}</span>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-1.5">
          {tokens.colors.map((color: ColorToken) => (
            <div
              key={color.id}
              className="bg-surface border border-border rounded p-2 flex items-center justify-between group hover:border-accent/50 transition-colors"
            >
              {/* Left: Swatch & Info */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded border border-border shadow-xs shrink-0"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-primary">{color.hex}</span>
                    <span className="text-[10px] text-secondary truncate max-w-[100px]">
                      {color.suggestedName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted font-mono">
                    <span>{color.hsl}</span>
                    <span className="capitalize bg-elevated px-1 rounded text-[8px] text-secondary">
                      {color.semanticGroup}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Frequency & Copy */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-muted bg-elevated px-1.5 py-0.5 rounded">
                  {color.frequency}x
                </span>
                <CopyButton textToCopy={color.hex} iconOnly />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 2. TYPOGRAPHY SECTION */}
      <CollapsibleSection
        title="Typography"
        count={tokens.typography.families.length}
        defaultOpen={false}
        headerExtra={
          tokens.typography.families[0] ? (
            <CopyButton textToCopy={tokens.typography.families[0].stack} label="Copy Font" />
          ) : undefined
        }
        previewSummary={
          <div className="text-[11px] text-secondary font-mono">
            {tokens.typography.families[0]?.name || "System fonts"} · {tokens.typography.scale.length} scale steps
          </div>
        }
      >
        {tokens.typography.families.map((family, i) => (
          <div key={i} className="bg-surface border border-border rounded p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <div>
                <span className="font-bold text-xs text-primary">{family.name}</span>
                <span className="text-[9px] text-muted ml-2 font-mono">{family.category}</span>
              </div>
              <span className="text-[9px] text-muted font-mono">
                {family.weights.join(", ")}
              </span>
            </div>

            {/* Font Specimen Preview */}
            <div
              className="text-base font-medium text-primary py-0.5 truncate"
              style={{ fontFamily: family.stack }}
            >
              The quick brown fox jumps over the lazy dog
            </div>

            {/* Type Scale Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {tokens.typography.scale.slice(0, 6).map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-elevated px-1.5 py-0.5 rounded text-[9px] font-mono text-secondary flex items-center gap-1"
                >
                  <span className="font-semibold text-primary uppercase">{entry.role}:</span>
                  <span>{entry.fontSize}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CollapsibleSection>

      {/* 3. SPACING SCALE SECTION */}
      <CollapsibleSection
        title="Spacing Scale"
        count={`${tokens.spacing.baseUnit}px Grid`}
        defaultOpen={false}
        headerExtra={
          <CopyButton
            textToCopy={tokens.spacing.values.map((v) => `${v.px}px`).join(", ")}
            label="Copy Scale"
          />
        }
        previewSummary={
          <div className="text-[11px] font-mono text-secondary">
            {tokens.spacing.values.slice(0, 5).map((v) => `${v.px}px`).join(" · ")}
          </div>
        }
      >
        <div className="bg-surface border border-border rounded p-2.5 space-y-2">
          {tokens.spacing.values.map((sp, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-secondary w-10">{sp.px}px</span>
              
              {/* Visualizer Bar */}
              <div className="flex-1 mx-2 bg-elevated h-1.5 rounded overflow-hidden">
                <div
                  className="bg-accent h-full rounded"
                  style={{ width: `${Math.min(100, (sp.px / 64) * 100)}%` }}
                />
              </div>

              <span className="font-mono text-[9px] text-muted w-12 text-right">{sp.rem}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 4. SHADOWS & RADII */}
      <CollapsibleSection
        title="Shadows & Border Radius"
        count={`${tokens.shadows.length} sh / ${tokens.radii.length} rad`}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-2">
          {/* Shadows */}
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-secondary">Shadows</h5>
            <div className="bg-surface border border-border rounded p-2 space-y-1">
              {tokens.shadows.length > 0 ? (
                tokens.shadows.map((sh, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-primary capitalize">{sh.level}</span>
                    <CopyButton textToCopy={sh.value} iconOnly />
                  </div>
                ))
              ) : (
                <span className="text-[9px] text-muted">No custom shadows</span>
              )}
            </div>
          </div>

          {/* Border Radii */}
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-secondary">Border Radius</h5>
            <div className="bg-surface border border-border rounded p-2 space-y-1">
              {tokens.radii.length > 0 ? (
                tokens.radii.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-primary">{r.level} ({r.value})</span>
                    <CopyButton textToCopy={r.value} iconOnly />
                  </div>
                ))
              ) : (
                <span className="text-[9px] text-muted">Default radii</span>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 5. BREAKPOINTS SECTION */}
      {tokens.breakpoints.length > 0 && (
        <CollapsibleSection
          title="Breakpoints"
          count={tokens.breakpoints.length}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {tokens.breakpoints.map((b, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border rounded p-1.5 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-accent uppercase text-[10px]">{b.label}</span>
                <span className="font-mono text-[10px] text-secondary">{b.px}px</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};
