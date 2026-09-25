// Main Side Panel / Popup App Container Component — TypeUI & Stitch design layout

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { TabBar } from "./components/TabBar";
import { ActionBar } from "./components/ActionBar";
import { EmptyState } from "./components/EmptyState";
import { ExtractingState } from "./components/ExtractingState";
import { AssetsTab } from "./components/AssetsTab";
import { HistoryTab } from "./components/HistoryTab";
import { ExportTab } from "./components/ExportTab";
import { AIPromptTab } from "./components/AIPromptTab";
import { ElementSelected } from "./components/ElementSelected";
import { SettingsPanel } from "./components/SettingsPanel";
import { Toast } from "./components/Toast";
import { MessageType } from "../shared/messages";
import { Settings } from "../shared/types";
import { stitchTiles } from "./utils/stitcher";
import { triggerPageExtraction } from "./utils/tab";

export const App: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const result = useStore((s) => s.result);
  const isExtracting = useStore((s) => s.isExtracting);
  const inspectedElement = useStore((s) => s.inspectedElement);
  const pendingCheckpoint = useStore((s) => s.pendingCheckpoint);
  const updateProgress = useStore((s) => s.updateProgress);
  const finishExtraction = useStore((s) => s.finishExtraction);
  const setInspectedElement = useStore((s) => s.setInspectedElement);
  const setTheme = useStore((s) => s.setTheme);

  useEffect(() => {
    // 1. Load initial saved settings & theme
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      if (chrome.runtime?.lastError) return;
      const s = res?.stylesnap_settings as Settings;
      if (s?.theme) {
        setTheme(s.theme);
      }
    });

    // 2. Check for recent extraction checkpoint (crash recovery)
    try {
      chrome.runtime?.sendMessage({ type: MessageType.CHECKPOINT_CHECK }, (res) => {
        if (chrome.runtime?.lastError) {
          // Service worker waking up or no receiver yet; safe to ignore
          return;
        }
        if (res?.checkpoint) {
          const cp = res.checkpoint;
          // Check if checkpoint is recent (< 5 minutes old)
          if (Date.now() - cp.savedAt < 5 * 60 * 1000) {
            useStore.getState().setPendingCheckpoint(cp);
          } else {
            chrome.runtime?.sendMessage({ type: MessageType.CHECKPOINT_CLEAR }, () => {
              if (chrome.runtime?.lastError) { /* ignore */ }
            });
          }
        }
      });
    } catch {}

    // 3. Global Chrome Message Listener inside Popup / Side Panel
    const messageListener = (message: any) => {
      if (message.type === MessageType.EXTRACTION_PROGRESS) {
        updateProgress(message.payload.step, message.payload.pct);
      } else if (message.type === MessageType.EXTRACTION_COMPLETE) {
        finishExtraction(message.payload);
      } else if (message.type === MessageType.EXTRACTION_ERROR) {
        useStore.setState({ isExtracting: false });
        useStore.getState().showToast(message.payload?.reason || "Extraction failed. Please refresh the page.", "error");
      } else if (message.type === MessageType.ELEMENT_SELECTED) {
        setInspectedElement(message.payload);
      } else if (message.type === MessageType.SCREENSHOT_TILE) {
        const { tileIndex, totalTiles } = message.payload;
        const pct = Math.min(95, Math.round(((tileIndex + 1) / totalTiles) * 100));
        useStore.getState().setScreenshotProgress(pct);
      } else if (message.type === MessageType.STITCH_TILES) {
        const currentResult = useStore.getState().result;
        const pendingHandle = useStore.getState().pendingSaveHandle;

        stitchTiles(message.payload, currentResult)
          .then(async (record) => {
            useStore.getState().finishScreenshotCapture();
            useStore.getState().setPendingSaveHandle(null);

            // 1. If user pre-selected a file via showSaveFilePicker, stream directly to disk!
            if (pendingHandle) {
              try {
                const writable = await pendingHandle.createWritable();
                await writable.write(record.fullPage);
                await writable.close();
                useStore.getState().showToast("Screenshot saved to your chosen file!", "success");
                return;
              } catch (writeErr) {
                console.warn("Could not write to chosen file handle:", writeErr);
              }
            }

            // 2. Fallback: ask where to store via chrome.downloads saveAs dialog
            try {
              if (chrome.downloads && chrome.downloads.download) {
                const url = URL.createObjectURL(record.fullPage);
                let hostSlug = "page";
                try {
                  const targetUrl = currentResult?.origin || currentResult?.url;
                  if (targetUrl) hostSlug = new URL(targetUrl).hostname.replace(/[^a-z0-9]/gi, "_");
                } catch {}
                chrome.downloads.download(
                  {
                    url,
                    filename: `stylesnap-${hostSlug}-screenshot.png`,
                    saveAs: true
                  },
                  () => {
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                  }
                );
              }
            } catch (dlErr) {
              console.warn("Download saveAs prompt failed:", dlErr);
            }

            useStore.getState().showToast("Full-page screenshot captured!", "success");
          })
          .catch((err) => {
            console.error("Screenshot stitch failed:", err);
            useStore.getState().setPendingSaveHandle(null);
            useStore.setState({ isCapturingScreenshot: false });
            useStore.getState().showToast("Screenshot stitching failed.", "error");
          });
      } else if (message.type === MessageType.SCREENSHOT_COMPLETE) {
        useStore.getState().finishScreenshotCapture();
      }
    };

    chrome.runtime?.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime?.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleResumeCheckpoint = () => {
    try {
      chrome.runtime?.sendMessage({ type: MessageType.CHECKPOINT_CLEAR }, () => {
        if (chrome.runtime?.lastError) { /* ignore */ }
      });
    } catch {}
    useStore.getState().setPendingCheckpoint(null);
    triggerPageExtraction();
  };

  const handleDismissCheckpoint = () => {
    try {
      chrome.runtime?.sendMessage({ type: MessageType.CHECKPOINT_CLEAR }, () => {
        if (chrome.runtime?.lastError) { /* ignore */ }
      });
    } catch {}
    useStore.getState().setPendingCheckpoint(null);
  };

  return (
    <div className="w-full h-full bg-base text-primary flex flex-col overflow-hidden relative font-sans select-none">
      {/* Top Header */}
      <Header />

      {/* Tab Segmented Control */}
      <TabBar />

      {/* Crash Recovery Checkpoint Banner */}
      {pendingCheckpoint && !isExtracting && (
        <div className="mx-3.5 mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="truncate">
              <div className="font-semibold text-primary truncate">Interrupted extraction detected</div>
              <div className="text-[10px] text-secondary truncate">
                {pendingCheckpoint.title} ({pendingCheckpoint.pct}% completed)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleResumeCheckpoint}
              className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-semibold transition-colors"
            >
              Resume
            </button>
            <button
              onClick={handleDismissCheckpoint}
              className="px-1.5 py-0.5 text-secondary hover:text-primary text-[10px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Scrollable Zone */}
      <main className="flex-1 min-h-0 overflow-y-auto relative flex flex-col pt-1">
        {inspectedElement ? (
          <ElementSelected />
        ) : isExtracting ? (
          <ExtractingState />
        ) : result ? (
          <>
            {activeTab === "ai-prompt" && <AIPromptTab />}
            {activeTab === "assets" && <AssetsTab />}
            {activeTab === "export" && <ExportTab />}
            {activeTab === "history" && <HistoryTab />}
          </>
        ) : activeTab === "history" ? (
          <HistoryTab />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Bottom Action Bar — rendered only when results exist */}
      {result && <ActionBar />}

      {/* Overlays */}
      <SettingsPanel />
      <Toast />
    </div>
  );
};

