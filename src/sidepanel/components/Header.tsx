// Side Panel Top Header Zone Component

import React, { useEffect, useState } from "react";
import { Zap, MousePointer2, Settings as SettingsIcon } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";

export const Header: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>("Active Tab");
  const isInspecting = useStore((s) => s.isInspecting);
  const setInspecting = useStore((s) => s.setInspecting);
  const toggleSettings = useStore((s) => s.toggleSettings);

  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const urlObj = new URL(tabs[0].url);
          setCurrentUrl(urlObj.hostname);
        } catch {
          setCurrentUrl(tabs[0].url);
        }
      }
    });
  }, []);

  const handleToggleInspector = () => {
    const nextState = !isInspecting;
    setInspecting(nextState);
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: nextState ? MessageType.INSPECT_ACTIVATE : MessageType.INSPECT_DEACTIVATE
        });
      }
    });
  };

  return (
    <header className="h-[48px] bg-surface border-b border-border px-4 flex items-center justify-between shrink-0">
      {/* Left: Brand Logo & Wordmark */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-accent/15 flex items-center justify-center text-accent">
          <Zap className="w-4 h-4 fill-accent" />
        </div>
        <span className="font-bold text-sm text-primary tracking-tight">StyleSnap</span>
      </div>

      {/* Center: Truncated Active Tab URL */}
      <div className="max-w-[150px] truncate text-[11px] text-secondary font-mono bg-elevated/60 px-2 py-0.5 rounded border border-border/50">
        {currentUrl}
      </div>

      {/* Right: Actions (Inspector + Settings) */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleToggleInspector}
          className={`p-1.5 rounded transition-colors ${
            isInspecting
              ? "bg-accent text-white"
              : "text-secondary hover:text-primary hover:bg-hover"
          }`}
          title={isInspecting ? "Cancel Element Inspector" : "Inspect Element"}
          aria-label="Inspect Element"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        <button
          onClick={toggleSettings}
          className="p-1.5 rounded text-secondary hover:text-primary hover:bg-hover transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
