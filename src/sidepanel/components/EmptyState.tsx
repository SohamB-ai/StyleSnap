// Empty State UI Component — Stitch-designed landing screen

import React from "react";
import { Zap, Sparkles } from "lucide-react";
import { StyleSnapLogoIcon } from "./Logo";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";

export const EmptyState: React.FC = () => {
  const isExtracting = useStore((s) => s.isExtracting);
  const startExtraction = useStore((s) => s.startExtraction);

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
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Central Illustration Badge */}
      <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center mb-4 shadow-sm">
        <StyleSnapLogoIcon size={36} />
      </div>

      <h3 className="text-sm font-bold text-primary mb-1">
        No design tokens extracted yet
      </h3>

      <p className="text-xs text-secondary leading-relaxed max-w-[240px] mb-6">
        Click below to scan the active web page and generate DESIGN.md & SKILL.md specs.
      </p>

      {/* Primary Call To Action Button */}
      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className="w-full max-w-[280px] py-2.5 px-4 rounded-xl bg-primary text-base font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90"
      >
        {isExtracting ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Extracting design system...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>Extract Page Design</span>
          </>
        )}
      </button>
    </div>
  );
};

