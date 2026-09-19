// Side Panel Bottom Action Bar Component (Extract CTA + Export Panel trigger)

import React from "react";
import { Zap, Download, Loader2 } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";

export const ActionBar: React.FC = () => {
  const isExtracting = useStore((s) => s.isExtracting || s.uiState === "extracting");
  const extraction = useStore((s) => s.extraction || s.result);
  const startExtraction = useStore((s) => s.startExtraction);
  const openExportPanel = useStore((s) => s.openExportPanel);

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

  return (
    <footer className="bg-surface border-t border-border p-2.5 shrink-0 select-none">
      {!extraction ? (
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
        /* Result Action Bar: Re-extract + Export (opens ExportPanel) */
        <div className="flex items-center gap-2">
          {/* Re-extract button */}
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex-1 h-[34px] bg-elevated hover:bg-hover text-secondary hover:text-primary font-medium text-xs border border-border rounded-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-secondary" />
            <span>Re-extract</span>
          </button>

          {/* Export button (opens ExportPanel) */}
          <button
            onClick={openExportPanel}
            disabled={isExtracting}
            className="flex-1 h-[34px] bg-primary text-base hover:opacity-90 font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            title="Open Export & AI Skills Panel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      )}
    </footer>
  );
};
