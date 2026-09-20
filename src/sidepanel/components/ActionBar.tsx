// Side Panel Bottom Action Bar Component (Extract CTA + DESIGN.md + SKILL.md + Export Dropdown)

import React, { useState, useRef, useEffect } from "react";
import { Zap, Download, Loader2, ChevronDown, FileText, Code, FileJson, Archive, Cpu } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";
import { ExportFormat } from "../../shared/types";
import { triggerPageExtraction } from "../utils/tab";

export const ActionBar: React.FC = () => {
  const isExtracting = useStore((s) => s.isExtracting);
  const result = useStore((s) => s.result);
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
    triggerPageExtraction();
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
    <footer className="bg-surface border-t border-border p-2.5 space-y-2 shrink-0 relative">
      {!result ? (
        /* Zero-state Primary CTA: Extract Page */
        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className={`w-full h-[38px] rounded-md flex items-center justify-center gap-2 font-semibold text-xs transition-all ${
            isExtracting
              ? "bg-hover text-muted cursor-not-allowed"
              : "bg-primary text-base hover:opacity-90 shadow-md active:scale-[0.98]"
          }`}
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting Design Tokens...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Extract This Site's Design</span>
            </>
          )}
        </button>
      ) : (
        /* Result Action Bar: DESIGN.md + SKILL.md + More Export Options */
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* DESIGN.md Download Button */}
            <button
              onClick={() => handleExport("design-md")}
              disabled={isExtracting}
              className="h-[34px] px-2.5 bg-primary text-base font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 hover:opacity-90"
              title="Download DESIGN.md documentation"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>DESIGN.md</span>
            </button>

            {/* SKILL.md Download Button */}
            <button
              onClick={() => handleExport("skill-md")}
              disabled={isExtracting}
              className="h-[34px] px-2.5 bg-elevated hover:bg-hover text-primary border border-border font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
              title="Download SKILL.md for AI Coding Agents"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>SKILL.md</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Re-extract button */}
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="flex-1 h-[30px] bg-elevated hover:bg-hover text-secondary hover:text-primary font-medium text-[11px] border border-border rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3 h-3 text-secondary" />
              <span>Re-extract</span>
            </button>

            {/* Export Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={!result || isExtracting}
                className="h-[30px] px-2.5 rounded flex items-center gap-1 text-[11px] font-medium border border-border bg-surface text-secondary hover:text-primary hover:bg-hover transition-colors"
                title="More Export Formats"
              >
                <Download className="w-3 h-3" />
                <span>More</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 bottom-[36px] w-48 bg-elevated border border-border rounded-md shadow-xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3 py-1 text-[9px] uppercase font-bold text-muted border-b border-border/50">
                    Export Formats
                  </div>
                  
                  <button
                    onClick={() => handleExport("tokens-json")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5 text-success" />
                    <div>
                      <div className="font-medium text-[11px]">tokens.json</div>
                      <div className="text-[9px] text-secondary">W3C DTCG Format</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport("tailwind-config")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-warning" />
                    <div>
                      <div className="font-medium text-[11px]">tailwind.config.js</div>
                      <div className="text-[9px] text-secondary">Tailwind Theme</div>
                    </div>
                  </button>

                  <div className="border-t border-border/50 my-1"></div>

                  <button
                    onClick={() => handleExport("assets-zip")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-accent" />
                    <div>
                      <div className="font-medium text-[11px]">Download Assets ZIP</div>
                      <div className="text-[9px] text-secondary">SVGs & Images</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
