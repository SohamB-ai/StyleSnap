// V2 AI Prompt Generator & DESIGN.md Preview Tab

import React, { useState, useMemo } from "react";
import { Copy, Download, Bot, Check, FileText, Sparkles } from "lucide-react";
import { useStore } from "../store";
import { AITool } from "../../shared/types";
import { generateMasterPrompt } from "../../background/services/promptEngine";
import { generateDesignMD } from "../../background/services/exporter";

const AI_TOOLS: { id: AITool; name: string; tag: string }[] = [
  { id: "cursor", name: "Cursor AI", tag: "~4,000 tokens" },
  { id: "claude-code", name: "Claude Code", tag: "~6,000 tokens" },
  { id: "v0", name: "v0 by Vercel", tag: "~2,000 tokens" },
  { id: "bolt", name: "Bolt.new", tag: "~3,000 tokens" },
  { id: "lovable", name: "Lovable", tag: "~1,500 tokens" }
];

export const AIPromptTab: React.FC = () => {
  const result = useStore((s) => s.result);
  const showToast = useStore((s) => s.showToast);

  const [viewMode, setViewMode] = useState<"ai-prompt" | "design-md">("ai-prompt");
  const [selectedTool, setSelectedTool] = useState<AITool>("cursor");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedDesign, setCopiedDesign] = useState(false);

  // Generate real prompt dynamically based on selected tool and extraction result
  const activePromptText = useMemo(() => {
    if (!result) return "";
    return generateMasterPrompt(result, selectedTool);
  }, [result, selectedTool]);

  // Generate real DESIGN.md dynamically
  const designMDText = useMemo(() => {
    if (!result) return "";
    return generateDesignMD(result);
  }, [result]);

  if (!result) return null;

  const handleCopyPrompt = () => {
    if (!activePromptText) return;
    navigator.clipboard.writeText(activePromptText).then(() => {
      setCopiedPrompt(true);
      showToast(`Copied ${selectedTool} prompt to clipboard!`, "success");
      setTimeout(() => setCopiedPrompt(false), 2500);
    });
  };

  const handleDownloadPrompt = () => {
    if (!activePromptText) return;
    const blob = new Blob([activePromptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master-prompt-${selectedTool}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded prompt for ${selectedTool}`, "success");
  };

  const handleCopyDesign = () => {
    if (!designMDText) return;
    navigator.clipboard.writeText(designMDText).then(() => {
      setCopiedDesign(true);
      showToast("Copied DESIGN.md to clipboard!", "success");
      setTimeout(() => setCopiedDesign(false), 2500);
    });
  };

  const handleDownloadDesign = () => {
    if (!designMDText) return;
    const blob = new Blob([designMDText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "DESIGN.md";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded DESIGN.md", "success");
  };

  const estimatedTokens = Math.round(activePromptText.length / 4);

  return (
    <div className="p-3 space-y-3.5 pb-8 text-xs">
      {/* Sub-navigation Switcher: AI Master Prompt vs DESIGN.md Preview */}
      <div className="flex bg-elevated p-1 rounded-lg border border-border/60">
        <button
          onClick={() => setViewMode("ai-prompt")}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "ai-prompt"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>AI Master Prompt</span>
        </button>
        <button
          onClick={() => setViewMode("design-md")}
          className={`flex-1 py-1.5 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
            viewMode === "design-md"
              ? "bg-surface text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-primary"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" />
          <span>DESIGN.md Preview</span>
        </button>
      </div>

      {viewMode === "ai-prompt" ? (
        <>
          {/* Target AI Tool Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Target AI Coding Agent
              </label>
              <span className="text-[10px] font-mono text-accent">
                {AI_TOOLS.find((t) => t.id === selectedTool)?.tag}
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value as AITool)}
                className="w-full bg-surface border border-border rounded-md pl-3 pr-8 py-2 text-xs text-primary appearance-none focus:outline-none focus:border-accent font-medium cursor-pointer"
              >
                {AI_TOOLS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                <Bot className="w-4 h-4 text-accent" />
              </div>
            </div>
            <p className="text-[10px] text-secondary leading-snug">
              Structurally tailored for {AI_TOOLS.find((t) => t.id === selectedTool)?.name}'s context budget, token limit, and prompt syntax.
            </p>
          </div>

          {/* Prompt Code Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Live Prompt Preview
              </span>
              <span className="text-[10px] text-muted font-mono">
                ~{estimatedTokens} tokens • {activePromptText.length} chars
              </span>
            </div>
            <div className="relative rounded-lg border border-border bg-zinc-950 overflow-hidden shadow-inner">
              <pre className="text-[10.5px] p-3 text-zinc-300 font-mono whitespace-pre-wrap h-64 overflow-y-auto leading-relaxed select-text">
                {activePromptText}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyPrompt}
              className="py-2 px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold text-primary transition-all active:scale-[0.98]"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPrompt}
              className="py-2 px-3 bg-accent hover:bg-accent/90 text-white rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-[0.98] shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* DESIGN.md Preview Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                DESIGN.md Document
              </span>
              <span className="text-[10px] text-muted font-mono">
                {designMDText.length} chars
              </span>
            </div>
            <div className="relative rounded-lg border border-border bg-zinc-950 overflow-hidden shadow-inner">
              <pre className="text-[10.5px] p-3 text-zinc-300 font-mono whitespace-pre-wrap h-72 overflow-y-auto leading-relaxed select-text">
                {designMDText}
              </pre>
            </div>
          </div>

          {/* Action Buttons for DESIGN.md */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyDesign}
              className="py-2 px-3 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold text-primary transition-all active:scale-[0.98]"
            >
              {copiedDesign ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy DESIGN.md</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadDesign}
              className="py-2 px-3 bg-accent hover:bg-accent/90 text-white rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-[0.98] shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
