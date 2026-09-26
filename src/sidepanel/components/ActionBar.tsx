// Side Panel Bottom Action Bar Component (Extract CTA + DESIGN.md + SKILL.md + Export Dropdown)

import React, { useState, useRef, useEffect } from "react";
import { Zap, Download, Loader2, ChevronDown, FileText, Code, FileJson, Archive, Cpu, Camera, Check, Package, Eye } from "lucide-react";
import { useStore } from "../store";
import { MessageType } from "../../shared/messages";
import { ExportFormat } from "../../shared/types";
import { triggerPageExtraction, getActiveTab } from "../utils/tab";
import { hasUnlimitedStorage, requestUnlimitedStorage } from "../utils/permissions";
import { loadScreenshot } from "../../background/services/db";

export const ActionBar: React.FC = () => {
  const isExtracting = useStore((s) => s.isExtracting);
  const result = useStore((s) => s.result);
  const isCapturingScreenshot = useStore((s) => s.isCapturingScreenshot);
  const hasScreenshots = useStore((s) => s.hasScreenshots);
  const screenshotProgress = useStore((s) => s.screenshotProgress);
  const startScreenshotCapture = useStore((s) => s.startScreenshotCapture);
  const showToast = useStore((s) => s.showToast);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotSize, setScreenshotSize] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activeUrl: string | null = null;
    if (result?.id) {
      loadScreenshot(result.id)
        .then((record) => {
          if (record?.fullPage) {
            useStore.getState().setHasScreenshots(true);
            const url = URL.createObjectURL(record.fullPage);
            activeUrl = url;
            setScreenshotUrl(url);
            const kb = (record.totalSize / 1024).toFixed(0);
            setScreenshotSize(`${kb} KB`);
          } else {
            setScreenshotUrl(null);
          }
        })
        .catch(() => {
          setScreenshotUrl(null);
        });
    } else {
      setScreenshotUrl(null);
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [result?.id, hasScreenshots]);

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
    }).catch(() => {});
  };

  const handleCaptureScreenshots = async () => {
    if (!result) return;

    // 1. Ask user where to store the full-page screenshot BEFORE capturing
    let fileHandle: any = null;
    if ("showSaveFilePicker" in window) {
      try {
        let domainSlug = "page";
        try {
          const targetUrl = result.origin || result.url;
          if (targetUrl) domainSlug = new URL(targetUrl).hostname.replace(/[^a-z0-9]/gi, "_");
        } catch {}
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: `stylesnap-${domainSlug}-fullpage.png`,
          types: [
            {
              description: "PNG Image (*.png)",
              accept: { "image/png": [".png"] }
            }
          ]
        });
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // User cancelled save dialog — abort capture cleanly
          return;
        }
      }
    }

    useStore.getState().setPendingSaveHandle(fileHandle);

    // 2. Check & request unlimitedStorage permission (user-gesture required)
    const granted = await hasUnlimitedStorage();
    if (!granted) {
      const userGranted = await requestUnlimitedStorage();
      if (!userGranted) {
        showToast("Storage permission is required to capture full-page screenshots.", "error");
        useStore.getState().setPendingSaveHandle(null);
        return;
      }
    }

    startScreenshotCapture();
    getActiveTab((tab) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: MessageType.SCREENSHOT_CAPTURE_START,
            payload: { extractionId: result.id }
          },
          () => {
            if (chrome.runtime.lastError) {
              showToast("Cannot contact page content script. Please refresh the page.", "error");
              useStore.setState({ isCapturingScreenshot: false });
              useStore.getState().setPendingSaveHandle(null);
            }
          }
        );
      } else {
        showToast("No active tab found.", "error");
        useStore.setState({ isCapturingScreenshot: false });
        useStore.getState().setPendingSaveHandle(null);
      }
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
        /* Result Action Bar: DESIGN.md + SKILL.md + Screenshot Button + Export Dropdown */
        <div className="space-y-2">
          {/* Screenshot Capture Row */}
          {isCapturingScreenshot ? (
            <div className="h-[34px] px-2.5 bg-accent/10 border border-accent/30 text-accent rounded-md flex items-center justify-between text-[11px] font-medium">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Capturing full-page tiles ({screenshotProgress}%)...</span>
              </div>
            </div>
          ) : !hasScreenshots ? (
            <button
              onClick={handleCaptureScreenshots}
              className="w-full h-[32px] bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent font-semibold text-[11px] rounded-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="Capture full-page and section screenshots"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Full-Page Screenshot</span>
            </button>
          ) : (
            <div className="p-1.5 bg-surface border border-emerald-500/40 rounded-lg flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                {screenshotUrl && (
                  <div
                    onClick={() => window.open(screenshotUrl, "_blank")}
                    className="w-8 h-8 rounded border border-border bg-black/10 overflow-hidden shrink-0 cursor-pointer relative group"
                    title="Click to view full screenshot in a new tab"
                  >
                    <img
                      src={screenshotUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3 shrink-0" />
                    <span className="truncate">Full Screenshot Saved</span>
                  </div>
                  <div className="text-[9.5px] text-secondary truncate">
                    {screenshotSize ? `${screenshotSize} • ` : ""}Included in ZIP
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {screenshotUrl && (
                  <button
                    onClick={() => window.open(screenshotUrl, "_blank")}
                    className="px-2 py-0.5 bg-elevated hover:bg-hover border border-border text-primary rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                    title="Open full image in new tab"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                )}
                <button
                  onClick={handleCaptureScreenshots}
                  className="px-1.5 py-0.5 text-secondary hover:text-primary rounded text-[10px] hover:bg-hover transition-colors"
                  title="Retake screenshot"
                >
                  Retake
                </button>
              </div>
            </div>
          )}

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
                <div className="absolute right-0 bottom-[36px] w-52 bg-elevated border border-border rounded-md shadow-xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-3 py-1 text-[9px] uppercase font-bold text-muted border-b border-border/50">
                    Export Formats
                  </div>

                  <button
                    onClick={() => handleExport("full-zip")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors font-medium bg-accent/5"
                  >
                    <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px] text-accent">Full Project ZIP</div>
                      <div className="text-[9px] text-secondary">All docs, configs & assets</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport("tokens-json")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5 text-success shrink-0" />
                    <div>
                      <div className="font-medium text-[11px]">tokens.json</div>
                      <div className="text-[9px] text-secondary">W3C DTCG Format</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport("tailwind-config")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-warning shrink-0" />
                    <div>
                      <div className="font-medium text-[11px]">tailwind.config.js</div>
                      <div className="text-[9px] text-secondary">Tailwind v3 Config</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExport("tailwind-v4-css")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-medium text-[11px]">Tailwind v4 CSS</div>
                      <div className="text-[9px] text-secondary">@theme directive</div>
                    </div>
                  </button>

                  <div className="border-t border-border/50 my-1"></div>

                  <button
                    onClick={() => handleExport("assets-zip")}
                    className="w-full px-3 py-1.5 text-xs text-left text-primary hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-accent shrink-0" />
                    <div>
                      <div className="font-medium text-[11px]">Assets ZIP Only</div>
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
