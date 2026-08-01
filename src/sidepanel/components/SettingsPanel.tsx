// Settings Drawer Panel Component

import React, { useEffect, useState } from "react";
import { ArrowLeft, Moon, Sun, Monitor, Trash2, Check } from "lucide-react";
import { useStore } from "../store";
import { Settings, ExportFormat } from "../../shared/types";
import { MessageType } from "../../shared/messages";

export const SettingsPanel: React.FC = () => {
  const settingsOpen = useStore((s) => s.settingsOpen);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const setHistory = useStore((s) => s.setHistory);
  const showToast = useStore((s) => s.showToast);

  const [exportFormat, setExportFormat] = useState<ExportFormat>("design-md");
  const [domLimit, setDomLimit] = useState<number>(2000);

  useEffect(() => {
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = res?.stylesnap_settings as Settings;
      if (s) {
        if (s.theme) setTheme(s.theme);
        if (s.defaultExportFormat) setExportFormat(s.defaultExportFormat);
        if (s.domSampleLimit) setDomLimit(s.domSampleLimit);
      }
    });
  }, []);

  if (!settingsOpen) return null;

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = (res?.stylesnap_settings || {}) as Settings;
      s.theme = newTheme;
      chrome.storage.local.set({ stylesnap_settings: s });
    });
  };

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
    <div className="absolute inset-0 bg-base z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Settings Header */}
      <header className="h-[48px] bg-surface border-b border-border px-4 flex items-center gap-3 shrink-0">
        <button
          onClick={toggleSettings}
          className="p-1 rounded text-secondary hover:text-primary hover:bg-hover transition-colors"
          title="Back to Panel"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-sm text-primary">Settings</h3>
      </header>

      {/* Settings Options Body */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* 1. Theme Setting */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">
            Appearance / Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "dark", label: "Dark", icon: Moon },
              { id: "light", label: "Light", icon: Sun },
              { id: "system", label: "System", icon: Monitor }
            ].map(({ id, label, icon: Icon }) => {
              const isSelected = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => handleThemeChange(id as any)}
                  className={`py-2 px-3 rounded border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                    isSelected
                      ? "border-accent bg-accent/15 text-accent font-semibold"
                      : "border-border bg-surface text-secondary hover:text-primary hover:bg-hover"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Default Export Format */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">
            Default Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => handleExportFormatChange(e.target.value as ExportFormat)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent"
          >
            <option value="design-md">DESIGN.md (AI-Ready Markdown)</option>
            <option value="tokens-json">tokens.json (W3C DTCG Specification)</option>
            <option value="tailwind-config">tailwind.config.js (Tailwind v3 Theme)</option>
          </select>
        </div>

        {/* 3. DOM Element Sample Limit */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary">
              DOM Sample Limit
            </label>
            <span className="font-mono text-xs font-bold text-accent">{domLimit} elements</span>
          </div>
          <input
            type="range"
            min={500}
            max={3000}
            step={250}
            value={domLimit}
            onChange={(e) => handleDomLimitChange(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <p className="text-[10px] text-muted leading-relaxed">
            Limits computed style sampling to maximize performance on heavy web pages.
          </p>
        </div>

        {/* 4. Storage & Data Privacy */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">
            Data & Privacy
          </label>
          <button
            onClick={handleClearHistory}
            className="w-full py-2 px-3 bg-error/10 border border-error/40 text-error hover:bg-error hover:text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Extraction History</span>
          </button>
          <p className="text-[10px] text-muted leading-relaxed">
            All design token extractions live 100% locally in your browser. Nothing is ever sent to an external server.
          </p>
        </div>
      </div>

      {/* Settings Footer Version info */}
      <footer className="h-10 border-t border-border bg-surface px-4 flex items-center justify-between text-[10px] text-muted">
        <span>StyleSnap v1.0.0</span>
        <span>Omenova Studio</span>
      </footer>
    </div>
  );
};
