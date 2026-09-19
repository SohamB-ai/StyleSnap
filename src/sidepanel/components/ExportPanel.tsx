// Export Panel Drawer Component — Task 3 Specification

import React, { useState } from "react";
import { X, Download, FileText, FileJson, Code, Cpu, Archive, Copy, Check } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";
import { ExportFormat } from "../../shared/types";
import { generateDesignMD, generateSkillMD } from "../../background/services/exporter";

export const ExportPanel: React.FC = () => {
  const exportPanelOpen = useStore((s) => s.exportPanelOpen);
  const closeExportPanel = useStore((s) => s.closeExportPanel);
  const extraction = useStore((s) => s.extraction || s.result);
  const showToast = useStore((s) => s.showToast);

  const [previewTab, setPreviewTab] = useState<"design-md" | "skill-md">("design-md");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAgentPath, setCopiedAgentPath] = useState<string | null>(null);

  if (!exportPanelOpen || !extraction) return null;

  const handleExportDownload = (format: ExportFormat, label: string) => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format, extractionId: extraction.id }
    });
    showToast(`${label} downloaded`, "success");
  };

  const previewText =
    previewTab === "skill-md"
      ? generateSkillMD(extraction)
      : generateDesignMD(extraction);

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopiedCode(true);
      showToast("Copied to clipboard", "success");
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      showToast("Copy failed — try again", "error");
    }
  };

  const handleCopyAgentPath = async (agentName: string, path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedAgentPath(agentName);
      showToast(`Copied ${agentName} skill path`, "success");
      setTimeout(() => setCopiedAgentPath(null), 1500);
    } catch {
      showToast("Copy failed — try again", "error");
    }
  };

  const AI_AGENTS = [
    { name: "Claude Code", path: "~/.claude/skills/DESIGN.md" },
    { name: "Cursor", path: ".cursor/skills/DESIGN.md" },
    { name: "Codex", path: "~/.codex/skills/DESIGN.md" },
    { name: "Google Antigravity", path: ".agents/skills/DESIGN.md" }
  ];

  return (
    <div className="absolute right-0 top-0 w-full h-full bg-base z-20 flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Panel Header */}
      <header className="h-[44px] bg-surface border-b border-border px-3.5 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-xs text-primary font-sans">
          Export & AI Skills
        </h3>
        <button
          onClick={closeExportPanel}
          className="p-1 rounded text-secondary hover:text-primary hover:bg-hover transition-colors"
          title="Close Export Panel"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Panel Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
        {/* SECTION 1 — FILE DOWNLOADS */}
        <section className="space-y-2">
          <h4 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
            File Downloads
          </h4>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleExportDownload("design-md", "DESIGN.md")}
              className="w-full h-[32px] px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-between text-xs font-medium text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>DESIGN.md</span>
              </div>
              <Download className="w-3.5 h-3.5 text-muted" />
            </button>

            <button
              onClick={() => handleExportDownload("tokens-json", "tokens.json")}
              className="w-full h-[32px] px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-between text-xs font-medium text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileJson className="w-3.5 h-3.5 text-success" />
                <span>tokens.json</span>
              </div>
              <Download className="w-3.5 h-3.5 text-muted" />
            </button>

            <button
              onClick={() => handleExportDownload("tailwind-config", "tailwind.config.js")}
              className="w-full h-[32px] px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-between text-xs font-medium text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-warning" />
                <span>tailwind.config.js</span>
              </div>
              <Download className="w-3.5 h-3.5 text-muted" />
            </button>

            <button
              onClick={() => handleExportDownload("skill-md", "SKILL.md")}
              className="w-full h-[32px] px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-between text-xs font-medium text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-accent" />
                <span>SKILL.md</span>
              </div>
              <Download className="w-3.5 h-3.5 text-muted" />
            </button>

            <button
              onClick={() => handleExportDownload("assets-zip", "All Assets (ZIP)")}
              className="w-full h-[32px] px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-between text-xs font-medium text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-accent" />
                <span>All Assets (ZIP)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-muted" />
            </button>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* SECTION 2 — AI QUICK COPY */}
        <section className="space-y-2">
          <h4 className="font-semibold text-[11px] uppercase tracking-wider text-muted font-sans">
            1-Click AI Tool Install
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {AI_AGENTS.map((agent) => {
              const isCopied = copiedAgentPath === agent.name;
              return (
                <button
                  key={agent.name}
                  onClick={() => handleCopyAgentPath(agent.name, agent.path)}
                  className="p-2 bg-surface hover:bg-hover border border-border rounded-md flex flex-col gap-1 text-left transition-colors"
                  title={`Copy path: ${agent.path}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-semibold text-[11px] text-primary">
                      {agent.name}
                    </span>
                    {isCopied ? (
                      <Check className="w-3 h-3 text-success shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted shrink-0" />
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-secondary truncate">
                    {agent.path}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* SECTION 3 — PREVIEW */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            {/* Toggle: DESIGN.md / SKILL.md */}
            <div className="bg-elevated p-[2px] rounded-md border border-border flex gap-1">
              <button
                onClick={() => setPreviewTab("design-md")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  previewTab === "design-md"
                    ? "bg-accent text-white"
                    : "text-secondary hover:text-primary"
                }`}
              >
                DESIGN.md
              </button>
              <button
                onClick={() => setPreviewTab("skill-md")}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  previewTab === "skill-md"
                    ? "bg-accent text-white"
                    : "text-secondary hover:text-primary"
                }`}
              >
                SKILL.md
              </button>
            </div>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyPreview}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface hover:bg-hover border border-border rounded text-[11px] font-medium text-secondary hover:text-primary transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>

          {/* Monospace Code Block */}
          <pre className="bg-elevated border border-border rounded-lg p-3 font-mono text-[11px] leading-relaxed max-h-[280px] overflow-y-auto select-text text-secondary">
            {previewText}
          </pre>
        </section>
      </div>
    </div>
  );
};
