// Export Tab Component (DESIGN.md, SKILL.md, Quick Install, JSON, Tailwind)

import React from "react";
import { FileText, Cpu, Code, FileJson, Archive, Sparkles } from "lucide-react";
import { useStore } from "../store";
import { QuickInstall } from "./QuickInstall";
import { MessageType } from "../../shared/messages";
import { ExportFormat } from "../../shared/types";

export const ExportTab: React.FC = () => {
  const result = useStore((s) => s.result);

  if (!result) return null;

  const handleExport = (format: ExportFormat) => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format, extractionId: result.id }
    });
  };

  return (
    <div className="p-3 space-y-4 pb-8 text-xs">
      {/* Overview Banner */}
      <div className="bg-surface border border-border rounded-md p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-accent font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Ready Design System Outputs</span>
        </div>
        <p className="text-[10px] text-secondary leading-relaxed">
          Export full design system documentation or agent skills directly into your project repo.
        </p>
      </div>

      {/* Primary Downloads */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleExport("design-md")}
          className="p-3 bg-accent/10 border border-accent/30 hover:border-accent rounded-md flex flex-col gap-1.5 text-left transition-all group"
        >
          <FileText className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-bold text-xs text-primary">DESIGN.md</div>
            <div className="text-[9px] text-secondary">Full Markdown Doc</div>
          </div>
        </button>

        <button
          onClick={() => handleExport("skill-md")}
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 rounded-md flex flex-col gap-1.5 text-left transition-all group"
        >
          <Cpu className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-bold text-xs text-primary">SKILL.md</div>
            <div className="text-[9px] text-secondary">AI Agent Skill File</div>
          </div>
        </button>
      </div>

      {/* Quick Install Section */}
      <QuickInstall />

      {/* Technical Formats */}
      <div className="space-y-1.5 pt-1">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-secondary">Other Formats</h4>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleExport("tokens-json")}
            className="p-2 bg-surface border border-border rounded text-left flex flex-col gap-1 hover:border-accent/40 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-success" />
            <span className="font-medium text-[10px]">tokens.json</span>
          </button>

          <button
            onClick={() => handleExport("tailwind-config")}
            className="p-2 bg-surface border border-border rounded text-left flex flex-col gap-1 hover:border-accent/40 transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-warning" />
            <span className="font-medium text-[10px]">tailwind.config</span>
          </button>

          <button
            onClick={() => handleExport("assets-zip")}
            className="p-2 bg-surface border border-border rounded text-left flex flex-col gap-1 hover:border-accent/40 transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium text-[10px]">Assets ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
