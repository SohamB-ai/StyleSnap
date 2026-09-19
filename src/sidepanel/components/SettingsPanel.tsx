// Settings Panel Component — Task 9 Specification

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore, Theme } from "../store";
import { Settings, ExportFormat } from "../../shared/types";
import { MessageType } from "../../shared/messages";

export const SettingsPanel: React.FC = () => {
  const settingsPanelOpen = useStore((s) => s.settingsPanelOpen || s.settingsOpen);
  const closeSettings = useStore((s) => s.closeSettings);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const setHistory = useStore((s) => s.setHistory);
  const showToast = useStore((s) => s.showToast);

  const [exportFormat, setExportFormat] = useState<ExportFormat>("design-md");

  useEffect(() => {
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = res?.stylesnap_settings as Settings;
      if (s) {
        if (s.theme) setTheme(s.theme);
        if (s.defaultExportFormat) setExportFormat(s.defaultExportFormat);
      }
    });
  }, []);

  if (!settingsPanelOpen) return null;

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = (res?.stylesnap_settings || {}) as Settings;
      s.theme = newTheme;
      chrome.storage?.local.set({ stylesnap_settings: s });
    });
  };

  const handleExportFormatChange = (fmt: ExportFormat) => {
    setExportFormat(fmt);
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = (res?.stylesnap_settings || {}) as Settings;
      s.defaultExportFormat = fmt;
      chrome.storage?.local.set({ stylesnap_settings: s });
    });
  };

  const handleClearHistory = () => {
    const confirmed = window.confirm("Delete all extraction history? This cannot be undone.");
    if (confirmed) {
      chrome.runtime.sendMessage({ type: MessageType.HISTORY_CLEAR }, () => {
        setHistory([]);
        showToast("All history cleared.", "success");
      });
    }
  };

  return (
    <div className="absolute right-0 top-0 w-full h-full bg-base z-30 flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Settings Header */}
      <header
        onClick={closeSettings}
        className="h-[44px] bg-surface border-b border-border px-3.5 flex items-center gap-2.5 cursor-pointer shrink-0 hover:bg-hover transition-colors"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeSettings();
          }}
          className="p-1 rounded text-secondary hover:text-primary transition-colors"
          title="Back to Panel"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-[14px] text-primary font-sans">
          Settings
        </h3>
      </header>

      {/* Settings Body */}
      <div className="flex-1 min-h-0 p-4 space-y-6 overflow-y-auto">
        {/* Section 1 — Theme */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-primary font-sans block">
            Theme
          </label>
          <div className="flex items-center gap-4 text-xs font-sans text-secondary">
            {(
              [
                { id: "dark", label: "Dark" },
                { id: "light", label: "Light" },
                { id: "system", label: "System" }
              ] as const
            ).map(({ id, label }) => {
              const isSelected = theme === id;
              return (
                <label
                  key={id}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                >
                  <input
                    type="radio"
                    name="theme"
                    checked={isSelected}
                    onChange={() => handleThemeChange(id)}
                    className="accent-accent cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 2 — Default export format */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-primary font-sans block">
            Default export format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => handleExportFormatChange(e.target.value as ExportFormat)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs font-sans text-primary focus:outline-none focus:border-accent"
          >
            <option value="design-md">DESIGN.md</option>
            <option value="tokens-json">tokens.json</option>
            <option value="tailwind-config">tailwind.config.js</option>
            <option value="skill-md">SKILL.md</option>
          </select>
        </div>

        {/* Section 3 — Data & Privacy */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-primary font-sans block">
            Data &amp; Privacy
          </label>
          <button
            onClick={handleClearHistory}
            className="w-full py-2 px-3 bg-error/10 border border-error/40 text-error hover:bg-error hover:text-white rounded-md text-xs font-medium transition-colors"
          >
            Clear all history
          </button>
          <p className="text-[12px] text-muted leading-relaxed font-sans">
            All data is stored locally in your browser. Nothing leaves your device.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-10 border-t border-border bg-surface px-4 flex items-center justify-center text-[11px] text-muted font-sans shrink-0">
        StyleSnap v1.0.0 &nbsp;&middot;&nbsp; Omenova Studio
      </footer>
    </div>
  );
};
