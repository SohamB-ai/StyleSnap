// Settings Drawer Panel Component

import React, { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Info } from "lucide-react";
import { useStore } from "../store";
import { Settings, ExportFormat } from "../../shared/types";
import { MessageType } from "../../shared/messages";

export const SettingsPanel: React.FC = () => {
  const settingsOpen = useStore((s) => s.settingsOpen);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const setHistory = useStore((s) => s.setHistory);
  const showToast = useStore((s) => s.showToast);

  const [exportFormat, setExportFormat] = useState<ExportFormat>("design-md");
  const [domLimit, setDomLimit] = useState<number>(2000);

  useEffect(() => {
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = res?.stylesnap_settings as Settings;
      if (s) {
        if (s.defaultExportFormat) setExportFormat(s.defaultExportFormat);
        if (s.domSampleLimit) setDomLimit(s.domSampleLimit);
      }
    });
  }, []);

  if (!settingsOpen) return null;

  const handleExportFormatChange = (fmt: ExportFormat) => {
    setExportFormat(fmt);
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = (res?.stylesnap_settings || {}) as Settings;
      s.defaultExportFormat = fmt;
      chrome.storage.local.set({ stylesnap_settings: s });
    });
  };

  const handleDomLimitChange = (val: number) => {
    setDomLimit(val);
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = (res?.stylesnap_settings || {}) as Settings;
      s.domSampleLimit = val;
      chrome.storage.local.set({ stylesnap_settings: s });
    });
  };

  const handleClearHistory = () => {
    chrome.runtime.sendMessage({ type: MessageType.HISTORY_CLEAR }, () => {
      setHistory([]);
      showToast("All history cleared", "success");
    });
  };

  return (
    <div className="absolute inset-0 bg-base z-50 flex flex-col animate-in slide-in-from-right duration-200 text-xs">
      {/* Settings Header */}
      <header className="h-[48px] bg-surface border-b border-border px-4 flex items-center gap-3 shrink-0">
        <button
          onClick={toggleSettings}
          className="p-1 rounded text-secondary hover:text-primary hover:bg-hover transition-colors"
          title="Back to Panel"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-sm text-primary">Preferences & Settings</h3>
      </header>

      {/* Settings Options Body */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* 1. DOM Element Sample Limit with Detailed Explanation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary">
              DOM Sample Limit
            </label>
            <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              {domLimit} elements
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={3000}
            step={250}
            value={domLimit}
            onChange={(e) => handleDomLimitChange(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />

          {/* Explanation Box */}
          <div className="p-3 bg-surface border border-border/80 rounded-lg space-y-1.5 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Info className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>What is DOM Sample Limit?</span>
            </div>
            <p className="text-secondary text-[10.5px]">
              This sets the maximum number of visible HTML elements on the page that StyleSnap computes styles for during extraction.
            </p>
            <ul className="text-secondary text-[10.5px] space-y-1 pl-1 list-disc list-inside">
              <li>
                <strong className="text-primary">2,000 – 3,000 (Recommended):</strong> Deepest scan. Discovers nested components, full typography hierarchy, and all color variations.
              </li>
              <li>
                <strong className="text-primary">500 – 1,000 (Fast Mode):</strong> Faster extraction. Recommended for massive web pages (e.g. social feeds, dashboards) to avoid browser slowdown.
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Default Export Format */}
        <div className="space-y-2 pt-3 border-t border-border/60">
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">
            Default Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => handleExportFormatChange(e.target.value as ExportFormat)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent font-medium cursor-pointer"
          >
            <option value="full-zip">Full Project ZIP (DESIGN.md + Prompts + Assets + Screenshots)</option>
            <option value="design-md">DESIGN.md (AI-Ready Markdown Document)</option>
            <option value="skill-md">SKILL.md (AI Agent Skill for Claude Code & Cursor)</option>
            <option value="tokens-json">tokens.json (W3C DTCG 2025.10 Specification)</option>
            <option value="tailwind-v4-css">Tailwind v4 theme.css (@theme format)</option>
            <option value="tailwind-config">tailwind.config.js (Tailwind v3 Theme)</option>
          </select>
        </div>

        {/* 3. Storage & Data Privacy */}
        <div className="space-y-2 pt-3 border-t border-border/60">
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">
            Data & Privacy
          </label>
          <button
            onClick={handleClearHistory}
            className="w-full py-2 px-3 bg-error/10 border border-error/40 text-error hover:bg-error hover:text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Extraction History & Cached Screenshots</span>
          </button>
          <p className="text-[10px] text-muted leading-relaxed">
            All design token extractions and screenshot tiles live 100% locally in your browser's IndexedDB. Nothing is ever transmitted to an external server.
          </p>
        </div>
      </div>

      {/* Settings Footer Version info */}
      <footer className="h-10 border-t border-border bg-surface px-4 flex items-center justify-between text-[10px] text-muted shrink-0">
        <span>StyleSnap v2.0.0</span>
        <span>Omenova Studio</span>
      </footer>
    </div>
  );
};
