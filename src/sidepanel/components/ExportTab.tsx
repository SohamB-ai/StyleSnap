import React, { useState } from "react";
import { FileText, Cpu, Code, FileJson, Archive, Sparkles, Package, Layers, Download, Eye, LayoutDashboard } from "lucide-react";
import { useStore } from "../store";
import { QuickInstall } from "./QuickInstall";
import { DesignMDPreview } from "./DesignMDPreview";
import { ComponentsTab } from "./ComponentsTab";
import { LayoutView } from "./LayoutView";
import { MessageType } from "../../shared/messages";
import { ExportFormat } from "../../shared/types";

export const ExportTab: React.FC = () => {
  const result = useStore((s) => s.result);
  const hasScreenshots = useStore((s) => s.hasScreenshots);
  const [subTab, setSubTab] = useState<"files" | "components" | "layout">("files");

  if (!result) return null;

  const isTailwindV4 = result.detectedFramework === "tailwind-v4";
  const componentCount = result.components?.length || 0;
  const sectionCount = result.layout?.sections?.length || 0;

  const handleExport = (format: ExportFormat) => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format, extractionId: result.id }
    }).catch(() => {});
  };

  return (
    <div className="p-3 space-y-3.5 pb-8 text-xs">
      {/* Sub-navigation Switcher: Export Files vs Components vs Layout */}
      <div className="flex bg-elevated p-1 rounded-lg border border-border/60">
        <button
          onClick={() => setSubTab("files")}
          className={`flex-1 py-1.5 px-1.5 rounded-md font-medium text-[11px] flex items-center justify-center gap-1 transition-all ${
            subTab === "files"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Package className="w-3.5 h-3.5 text-accent" />
          <span>Export Files</span>
        </button>
        <button
          onClick={() => setSubTab("components")}
          className={`flex-1 py-1.5 px-1.5 rounded-md font-medium text-[11px] flex items-center justify-center gap-1 transition-all ${
            subTab === "components"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Components {componentCount > 0 && `(${componentCount})`}</span>
        </button>
        <button
          onClick={() => setSubTab("layout")}
          className={`flex-1 py-1.5 px-1.5 rounded-md font-medium text-[11px] flex items-center justify-center gap-1 transition-all ${
            subTab === "layout"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-primary"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
          <span>Layout {sectionCount > 0 && `(${sectionCount})`}</span>
        </button>
      </div>

      {subTab === "components" ? (
        <div className="-mx-3 -mt-2">
          <ComponentsTab />
        </div>
      ) : subTab === "layout" ? (
        <div className="-mx-3 -mt-2">
          <LayoutView />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Feature: DESIGN.md Live Preview */}
          <div id="design-md-preview-section">
            <DesignMDPreview initialFormat="design-md" defaultOpen={true} />
          </div>

          {/* Overview Banner */}
          <div className="bg-surface border border-border rounded-md p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-accent font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Ready Design System Outputs</span>
            </div>
            <p className="text-[10px] text-secondary leading-relaxed">
              Export full design system documentation, agent skills, or complete project packages directly into your repository.
            </p>
          </div>

          {/* Hero: Full Project ZIP Download */}
          <button
            onClick={() => handleExport("full-zip")}
            className="w-full p-3 bg-accent/15 border-2 border-accent/40 hover:border-accent rounded-lg flex items-center justify-between text-left transition-all group shadow-xs active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-accent text-accent-contrast flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span>Full Project ZIP Bundle</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-semibold uppercase">
                    Complete
                  </span>
                </div>
                <div className="text-[10px] text-secondary">
                  DESIGN.md + SKILL.md + tokens + prompts + assets
                </div>
                <div className="text-[9.5px] mt-0.5">
                  {hasScreenshots ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Includes full-page screenshot
                    </span>
                  ) : (
                    <span className="text-amber-500 font-medium">
                      Tip: Capture screenshot via the camera button in the bottom bar to include it in the ZIP
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
              Download →
            </span>
          </button>

      {/* Primary Markdown Downloads */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-accent/10 border border-accent/30 hover:border-accent/60 rounded-md flex flex-col justify-between gap-2 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              <div>
                <div className="font-bold text-xs text-primary">DESIGN.md</div>
                <div className="text-[9px] text-secondary">Full Markdown Doc</div>
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent/20 text-accent font-semibold uppercase">
              Doc
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => handleExport("design-md")}
              className="flex-1 py-1 px-2 bg-accent text-accent-contrast hover:bg-accent-hover rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-2xs"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("design-md-preview-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="py-1 px-2 bg-surface hover:bg-hover border border-border text-primary rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
              title="Jump to DESIGN.md Preview"
            >
              <Eye className="w-3 h-3 text-accent" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 rounded-md flex flex-col justify-between gap-2 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="font-bold text-xs text-primary">SKILL.md</div>
                <div className="text-[9px] text-secondary">AI Agent Skill File</div>
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
              Skill
            </span>
          </div>
          <div className="pt-1">
            <button
              onClick={() => handleExport("skill-md")}
              className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-2xs"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Motion & Scroll Specification Card [V3] */}
      {result.animations && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500/60 rounded-md flex items-center justify-between gap-2 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="font-bold text-xs text-primary flex items-center gap-1.5">
                <span>MOTION.md</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-semibold uppercase">
                  Tier {result.animations.overallTier}
                </span>
              </div>
              <div className="text-[9.5px] text-secondary">
                Lenis, GSAP, Three.js, WebGL & Scroll Architecture Spec
              </div>
            </div>
          </div>
          <button
            onClick={() => handleExport("motion-md")}
            className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-2xs shrink-0"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
        </div>
      )}

      {/* Quick Install Section */}
      <QuickInstall />

      {/* Technical Formats */}
      <div className="space-y-1.5 pt-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-secondary">Framework & Token Files</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleExport("tailwind-v4-css")}
            className={`p-2.5 bg-surface border rounded-md text-left flex flex-col gap-1 transition-all ${
              isTailwindV4
                ? "border-sky-500 bg-sky-500/10 shadow-xs"
                : "border-border hover:border-accent/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <Code className="w-4 h-4 text-sky-400" />
              {isTailwindV4 && (
                <span className="text-[9px] font-bold text-sky-500 uppercase">Detected</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-[11px] text-primary">Tailwind v4 CSS</span>
              <p className="text-[9px] text-secondary">@theme CSS variables</p>
            </div>
          </button>

          <button
            onClick={() => handleExport("tailwind-config")}
            className="p-2.5 bg-surface border border-border rounded-md text-left flex flex-col gap-1 hover:border-accent/40 transition-colors"
          >
            <Code className="w-4 h-4 text-warning" />
            <div>
              <span className="font-semibold text-[11px] text-primary">tailwind.config.js</span>
              <p className="text-[9px] text-secondary">Tailwind v3 JS Config</p>
            </div>
          </button>

          <button
            onClick={() => handleExport("tokens-json")}
            className="p-2.5 bg-surface border border-border rounded-md text-left flex flex-col gap-1 hover:border-accent/40 transition-colors"
          >
            <FileJson className="w-4 h-4 text-success" />
            <div>
              <span className="font-semibold text-[11px] text-primary">tokens.json</span>
              <p className="text-[9px] text-secondary">W3C DTCG Format</p>
            </div>
          </button>

          <button
            onClick={() => handleExport("components-md")}
            className="p-2.5 bg-surface border border-border rounded-md text-left flex flex-col gap-1 hover:border-accent/40 transition-colors"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <div>
              <span className="font-semibold text-[11px] text-primary">components.md</span>
              <p className="text-[9px] text-secondary">Component HTML & CSS</p>
            </div>
          </button>

          <button
            onClick={() => handleExport("assets-zip")}
            className="col-span-2 p-2.5 bg-surface border border-border rounded-md text-left flex items-center justify-between hover:border-accent/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-accent" />
              <div>
                <span className="font-semibold text-[11px] text-primary">Assets ZIP</span>
                <p className="text-[9px] text-secondary">Raw images, SVGs, and favicon archive</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-accent">Download →</span>
          </button>
        </div>
      </div>
    </div>
    )}
  </div>
  );
};
