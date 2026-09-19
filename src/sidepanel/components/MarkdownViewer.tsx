// Markdown Viewer Component — TypeUI DESIGN.md style code preview & quick install

import React, { useState } from "react";
import { Copy, Download, RefreshCw, Info, Check } from "lucide-react";
import { useStore } from "../store";
import { QuickInstall } from "./QuickInstall";
import { generateDesignMD, generateSkillMD } from "../../background/services/exporter";

export const MarkdownViewer: React.FC = () => {
  const result = useStore((s) => s.result);
  const activeTab = useStore((s) => s.activeTab);
  const [copied, setCopied] = useState<boolean>(false);

  if (!result) return null;

  const isSkillMD = activeTab === "assets";
  const markdownText = isSkillMD ? generateSkillMD(result) : generateDesignMD(result);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = isSkillMD ? "SKILL.md" : "DESIGN.md";
    const blob = new Blob([markdownText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Syntax highlighting helper for Markdown lines
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("# ")) {
        return (
          <div key={idx} className="text-accent font-bold text-sm my-1">
            {line}
          </div>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <div key={idx} className="text-accent font-semibold text-xs mt-2 mb-0.5">
            {line}
          </div>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <div key={idx} className="text-primary font-semibold text-xs mt-1.5 mb-0.5">
            {line}
          </div>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div key={idx} className="text-secondary pl-2 py-0.2">
            <span className="text-accent font-bold">•</span> {line.slice(2)}
          </div>
        );
      }
      if (line.includes(": ")) {
        const parts = line.split(": ");
        return (
          <div key={idx} className="py-0.2">
            <span className="text-primary font-medium">{parts[0]}: </span>
            <span className="text-secondary">{parts.slice(1).join(": ")}</span>
          </div>
        );
      }
      return (
        <div key={idx} className="text-secondary py-0.2">
          {line || "\u00A0"}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col gap-3 px-3.5 pb-4">
      {/* Generated Markdown Label */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase font-bold tracking-wider text-secondary">
          Generated Markdown
        </h2>
        <span className="text-[10px] font-mono text-muted">
          {isSkillMD ? "SKILL.md format" : "DESIGN.md format"}
        </span>
      </div>

      {/* Code Block Container */}
      <div className="bg-elevated border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
        {/* Floating Toolbar */}
        <div className="bg-hover/40 border-b border-border/60 px-3 py-1.5 flex items-center justify-end gap-1 select-none">
          <button
            onClick={handleCopy}
            className="p-1 text-secondary hover:text-accent rounded transition-colors"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1 text-secondary hover:text-accent rounded transition-colors"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1 text-secondary hover:text-accent rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-border mx-0.5" />
          <button
            className="p-1 text-secondary hover:text-accent rounded transition-colors"
            title="Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Code Content Viewport */}
        <div className="p-3 font-mono text-[11px] leading-relaxed max-h-[260px] overflow-y-auto overscroll-contain select-text">
          {renderFormattedMarkdown(markdownText)}
        </div>
      </div>

      {/* Quick Install Section */}
      <QuickInstall />
    </div>
  );
};
