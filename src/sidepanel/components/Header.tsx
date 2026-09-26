// Header Component — TypeUI DESIGN.md style header layout

import React, { useEffect, useState, useRef } from "react";
import { MousePointer2, Settings as SettingsIcon, MoreVertical } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";
import { StyleSnapLogoIcon } from "./Logo";
import { getActiveTab } from "../utils/tab";

export const Header: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>("Active Tab");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInspecting = useStore((s) => s.isInspecting);
  const setInspecting = useStore((s) => s.setInspecting);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const setTab = useStore((s) => s.setTab);
  const setResult = useStore((s) => s.setResult);

  useEffect(() => {
    getActiveTab((tab) => {
      if (tab?.url) {
        try {
          const urlObj = new URL(tab.url);
          setCurrentUrl(urlObj.hostname);
        } catch {
          setCurrentUrl(tab.url);
        }
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggleInspector = () => {
    const nextState = !isInspecting;
    setInspecting(nextState);
    getActiveTab((tab) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: nextState ? MessageType.INSPECT_ACTIVATE : MessageType.INSPECT_DEACTIVATE
          },
          () => {
            if (chrome.runtime?.lastError) {
              // Target tab not responding or restricted page; ignore
            }
          }
        );
      }
    });
  };

  return (
    <header className="bg-surface border-b border-border px-3.5 pt-3 pb-2.5 flex flex-col gap-1 shrink-0 select-none relative">
      {/* Top Row: Brand & Actions */}
      <div className="flex items-center justify-between w-full">
        {/* Left: Brand Icon + Title + Version Tag */}
        <div className="flex items-center gap-2">
          <StyleSnapLogoIcon size={24} />
          <div className="flex items-baseline gap-1.5">
            <h1 className="font-bold text-sm text-primary tracking-tight">
              StyleSnap
            </h1>
            <span className="text-[10px] text-secondary font-mono">
              v3.0.0
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 text-secondary relative">
          <button
            onClick={handleToggleInspector}
            className={`p-1 rounded transition-colors ${
              isInspecting
                ? "bg-accent text-accent-contrast shadow-xs"
                : "hover:text-primary hover:bg-hover"
            }`}
            title={isInspecting ? "Exit Inspector Mode" : "Hover Inspector Mode"}
            aria-label="Hover Inspector Mode"
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleSettings}
            className="p-1 rounded hover:text-primary hover:bg-hover transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:text-primary hover:bg-hover transition-colors"
            title="More Options"
            aria-label="More Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Three-Dot Dropdown Menu */}
          {menuOpen && (
            <div ref={menuRef} className="absolute right-0 top-7 w-44 bg-elevated border border-border rounded-lg shadow-lg py-1 z-50 text-xs animate-in fade-in duration-100">
              <button
                onClick={() => { setTab("history"); setMenuOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-primary hover:bg-hover transition-colors flex items-center justify-between"
              >
                <span>Extraction History</span>
                <span className="text-[10px] text-muted">View past</span>
              </button>
              <button
                onClick={() => { setTab("export"); setMenuOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-primary hover:bg-hover transition-colors flex items-center justify-between"
              >
                <span>Export & Downloads</span>
                <span className="text-[10px] text-muted">ZIP, MD</span>
              </button>
              <button
                onClick={() => { toggleSettings(); setMenuOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-primary hover:bg-hover transition-colors"
              >
                Extension Preferences
              </button>
              <div className="w-full h-[1px] bg-border my-1" />
              <button
                onClick={() => { setResult(null); setMenuOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-error hover:bg-hover transition-colors"
              >
                Scan New Page
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtitle Row */}
      <p className="text-[11px] text-secondary leading-snug">
        Auto generates from the active tab (<span className="text-primary font-mono">{currentUrl}</span>) based on DESIGN.md specifications.
      </p>
    </header>
  );
};

