// Error State Component — Task 4 Specification (3 Variants: extraction, restricted, interrupted)

import React from "react";
import { AlertTriangle, Lock, Zap, RefreshCw } from "lucide-react";
import { useStore, UIState } from "../store";
import { MessageType } from "../../shared/messages";

interface ErrorStateProps {
  variant?: "error-extraction" | "error-restricted" | "error-interrupted";
}

export const ErrorState: React.FC<ErrorStateProps> = ({ variant }) => {
  const storeUIState = useStore((s) => s.uiState);
  const progress = useStore((s) => s.progress);
  const startExtraction = useStore((s) => s.startExtraction);
  const setUIState = useStore((s) => s.setUIState);

  const activeVariant: UIState =
    variant ||
    (storeUIState.startsWith("error-") ? storeUIState : "error-extraction");

  const handleRetry = () => {
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

  const handleStartFresh = () => {
    setUIState("idle");
  };

  // Variant B — "RESTRICTED PAGE"
  if (activeVariant === "error-restricted") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-3">
        <div className="w-12 h-12 rounded-full bg-elevated border border-border flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted" />
        </div>
        <p className="text-xs text-secondary max-w-[260px] leading-relaxed">
          StyleSnap cannot run on this page. Navigate to any website to extract.
        </p>
      </div>
    );
  }

  // Variant C — "EXTRACTION INTERRUPTED"
  if (activeVariant === "error-interrupted") {
    const pct = progress.pct || 0;
    const stepLabel = progress.step || "Scanning styles";

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-4">
        <div className="w-12 h-12 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center">
          <Zap className="w-5 h-5 text-warning" />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-primary">
            Extraction interrupted
          </h3>
          <p className="text-xs text-secondary leading-relaxed">
            Saved at {pct}% — {stepLabel}.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full max-w-[240px] pt-1">
          <button
            onClick={handleRetry}
            className="flex-1 h-[34px] bg-primary text-base hover:opacity-90 font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <button
            onClick={handleStartFresh}
            className="flex-1 h-[34px] bg-transparent hover:bg-hover text-secondary hover:text-primary font-medium text-xs rounded-md border border-border transition-colors"
          >
            Start fresh
          </button>
        </div>
      </div>
    );
  }

  // Variant A — "EXTRACTION FAILED" (Default)
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-4">
      <div className="w-12 h-12 rounded-full bg-error/10 border border-error/30 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-error" />
      </div>

      <div className="space-y-1 max-w-[260px]">
        <h3 className="font-semibold text-sm text-primary">
          Could not extract this page
        </h3>
        <p className="text-xs text-secondary leading-relaxed">
          This page may be blocking scripts, or it may still be loading.
        </p>
      </div>

      <button
        onClick={handleRetry}
        className="w-full max-w-[200px] h-[34px] bg-primary text-base hover:opacity-90 font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try again</span>
      </button>
    </div>
  );
};
