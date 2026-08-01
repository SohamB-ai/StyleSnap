// Side Panel Bottom Action Bar Component (Extract CTA + Export Dropdown)

import React, { useState, useRef, useEffect } from "react";
import { Zap, Download, Loader2, ChevronDown, FileText, Code, FileJson, Archive } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";
import { ExportFormat } from "../../shared/types";

export const ActionBar: React.FC = () => {
  const isExtracting = useStore((s) => s.isExtracting);
  const result = useStore((s) => s.result);
  const startExtraction = useStore((s) => s.startExtraction);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExtract = () => {
    if (isExtracting) return;
    startExtraction();
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.runtime.sendMessage({
          type: MessageType.EXTRACT_PAGE,
          payload: { tabId: tabs[0].id, options: { domLimit: 2000 } }
        });
      }
    });
  };

  const handleExport = (format: ExportFormat) => {
    if (!result) return;
    setDropdownOpen(false);
    chrome.runtime.sendMessage({
      type: MessageType.EXPORT_FILE,
      payload: { format, extractionId: result.id }
    });
  };

  return (
    <footer className="h-[52px] bg-surface border-t border-border px-4 flex items-center gap-2 shrink-0 relative">
      {/* Primary CTA: Extract Full Page */}
      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className={`flex-1 h-[36px] rounded flex items-center justify-center gap-2 font-semibold text-xs transition-all ${
          isExtracting
            ? "bg-hover text-muted cursor-not-allowed"
            : "bg-accent hover:bg-accent-hover text-white shadow-sm active:scale-[0.98]"
        }`}
      >
        {isExtracting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Extracting...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 fill-white" />
            <span>Extract Full Page</span>
          </>
        )}
      </button>

      {/* Export Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={!result || isExtracting}
          className={`h-[36px] px-3 rounded flex items-center gap-1.5 font-medium text-xs border transition-colors ${
            !result || isExtracting
              ? "border-border/50 bg-surface text-muted cursor-not-allowed"
              : "border-accent text-accent hover:bg-accent/10 active:scale-[0.98]"
          }`}
          title="Export Files"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 bottom-[44px] w-48 bg-elevated border border-border rounded-md shadow-lg py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-muted border-b border-border/50">
              Select Export Format
            </div>
            
            <button
              onClick={() => handleExport("design-md")}
              className="w-full px-3 py-2 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              <div>
                <div className="font-medium">DESIGN.md</div>
                <div className="text-[10px] text-secondary">AI-ready Markdown doc</div>
              </div>
            </button>

            <button
              onClick={() => handleExport("tokens-json")}
              className="w-full px-3 py-2 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
            >
              <FileJson className="w-3.5 h-3.5 text-success" />
              <div>
                <div className="font-medium">tokens.json</div>
                <div className="text-[10px] text-secondary">W3C DTCG 2025.10 Spec</div>
              </div>
            </button>

            <button
              onClick={() => handleExport("tailwind-config")}
              className="w-full px-3 py-2 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-warning" />
              <div>
                <div className="font-medium">tailwind.config.js</div>
                <div className="text-[10px] text-secondary">Drop-in Tailwind v3 Theme</div>
              </div>
            </button>

            <div className="border-t border-border/50 my-1"></div>

            <button
              onClick={() => handleExport("assets-zip")}
              className="w-full px-3 py-2 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
            >
              <Archive className="w-3.5 h-3.5 text-accent" />
              <div>
                <div className="font-medium">Download Assets ZIP</div>
                <div className="text-[10px] text-secondary">All SVGs, Images & Icons</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};
