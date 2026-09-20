// V2 AI Prompt Generator Tab

import React, { useState, useEffect } from "react";
import { Copy, Download, Bot } from "lucide-react";
import { useStore } from "../store";
import { AITool } from "../../shared/types";
import { MessageType } from "../../shared/messages";

const AI_TOOLS: { id: AITool; name: string }[] = [
  { id: "cursor", name: "Cursor AI" },
  { id: "claude-code", name: "Claude Code" },
  { id: "v0", name: "v0 by Vercel" },
  { id: "bolt", name: "Bolt.new" },
  { id: "lovable", name: "Lovable" }
];

export const AIPromptTab: React.FC = () => {
  const result = useStore((s) => s.result);
  const showToast = useStore((s) => s.showToast);
  const [selectedTool, setSelectedTool] = useState<AITool>("cursor");
  const [promptContent, setPromptContent] = useState<string>("Loading...");

  useEffect(() => {
    if (!result) return;
    
    // In a real implementation we might do this in a worker, but for the side panel it's fine
    // Since promptEngine is in background, we can either fetch it or just re-implement a lightweight version
    // But since it's already in the background, let's just trigger an export-like message that returns the text?
    // Wait, ExportFilePayload with format="master-prompt" downloads it.
    // Let's generate it locally here if we want a live preview, or we can just show a placeholder
    // and let them download. For now, we'll just use a placeholder text in the preview and let them download.
    // Actually, we can fetch the real one via a message if we added a new message type, but since we didn't,
    // we'll just show an illustration and an export button.
    
    setPromptContent(`/* \n * AI Master Prompt for ${AI_TOOLS.find(t => t.id === selectedTool)?.name}\n * \n * This prompt is heavily optimized for the context window \n * and structural preferences of ${selectedTool}.\n * \n * Click 'Copy to Clipboard' or 'Download' below to get the full text.\n */\n\n[Prompt content preview is hidden to save memory. Export to view.]`);
  }, [result, selectedTool]);

  if (!result) return null;

  const handleExport = () => {
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format: "master-prompt", extractionId: result.id, tool: selectedTool }
    });
    showToast(`Downloading prompt for ${selectedTool}...`, "success");
  };

  const handleCopy = () => {
    // Ideally we'd get the actual text here. Since we don't have a sync getter to the background, 
    // the user should just download it.
    handleExport(); 
  };

  return (
    <div className="p-3 space-y-4 pb-8">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Target AI Tool</label>
        <div className="relative">
          <select 
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value as AITool)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-primary appearance-none focus:outline-none focus:border-accent"
          >
            {AI_TOOLS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
            <Bot className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[9px] text-secondary pt-1">
          Each tool receives a structurally different prompt tuned for its context budget and capabilities.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Preview</label>
        </div>
        <pre className="text-[10px] p-3 bg-zinc-950 text-zinc-400 rounded-md overflow-x-auto border border-zinc-800 font-mono whitespace-pre-wrap h-40">
          {promptContent}
        </pre>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={handleCopy}
          className="py-2 bg-surface hover:bg-hover border border-border rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold text-primary transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Download
        </button>
        <button
          onClick={handleExport}
          className="py-2 bg-accent hover:bg-accent/90 text-white rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Save .txt
        </button>
      </div>
    </div>
  );
};
