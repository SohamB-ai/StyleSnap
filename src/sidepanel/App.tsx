// Main Side Panel App Container Component — V1 Specification

import React, { useEffect } from "react";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { TabBar } from "./components/TabBar";
import { ActionBar } from "./components/ActionBar";
import { EmptyState } from "./components/EmptyState";
import { ExtractingState } from "./components/ExtractingState";
import { TokensTab } from "./components/TokensTab";
import { AssetsTab } from "./components/AssetsTab";
import { HistoryTab } from "./components/HistoryTab";
import { ElementSelected } from "./components/ElementSelected";
import { SettingsPanel } from "./components/SettingsPanel";
import { ExportPanel } from "./components/ExportPanel";
import { ErrorState } from "./components/ErrorState";
import { Toast } from "./components/Toast";
import { MessageType } from "../shared/messages";
import { Settings } from "../shared/types";

export const App: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const extraction = useStore((s) => s.extraction || s.result);
  const uiState = useStore((s) => s.uiState);
  const isExtracting = useStore((s) => s.isExtracting || s.uiState === "extracting");
  const inspectedElement = useStore((s) => s.inspectedElement);
  const updateProgress = useStore((s) => s.updateProgress);
  const finishExtraction = useStore((s) => s.finishExtraction);
  const setInspectedElement = useStore((s) => s.setInspectedElement);
  const setUIState = useStore((s) => s.setUIState);
  const setTheme = useStore((s) => s.setTheme);
  const showToast = useStore((s) => s.showToast);

  useEffect(() => {
    // 1. Load initial saved settings & theme
    chrome.storage?.local.get("stylesnap_settings", (res) => {
      const s = res?.stylesnap_settings as Settings;
      if (s?.theme) {
        setTheme(s.theme);
      }
    });

    // 2. Global Chrome Message Listener inside Popup / Side Panel
    const messageListener = (message: any) => {
      if (message.type === MessageType.EXTRACTION_PROGRESS) {
        updateProgress(message.payload.step, message.payload.pct);
      } else if (message.type === MessageType.EXTRACTION_COMPLETE) {
        finishExtraction(message.payload);
      } else if (message.type === MessageType.EXTRACTION_ERROR) {
        const reason = message.payload?.reason || "";
        if (reason === "restricted") {
          setUIState("error-restricted");
        } else if (reason === "interrupted") {
          setUIState("error-interrupted");
        } else {
          setUIState("error-extraction");
          showToast(reason === "empty-dom" ? "Page has empty DOM" : reason || "Extraction failed. Please refresh.", "error");
        }
      } else if (message.type === MessageType.ELEMENT_SELECTED) {
        setInspectedElement(message.payload);
      }
    };

    chrome.runtime?.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime?.onMessage.removeListener(messageListener);
    };
  }, []);

  const isError = uiState.startsWith("error-");

  return (
    <div className="w-full h-full bg-base text-primary flex flex-col overflow-hidden relative font-sans select-none">
      {/* Top Header */}
      <Header />

      {/* Tab Navigation: [Tokens] [Assets] [History] */}
      <TabBar />

      {/* Main Content Scrollable Zone */}
      <main className="flex-1 min-h-0 overflow-y-auto relative flex flex-col">
        {inspectedElement ? (
          <ElementSelected />
        ) : isError ? (
          <ErrorState variant={uiState as any} />
        ) : isExtracting ? (
          <ExtractingState />
        ) : extraction ? (
          <>
            {activeTab === "tokens" && <TokensTab />}
            {activeTab === "assets" && <AssetsTab />}
            {activeTab === "history" && <HistoryTab />}
          </>
        ) : activeTab === "history" ? (
          <HistoryTab />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Bottom Action Bar */}
      <ActionBar />

      {/* Overlays / Slide-over Drawers */}
      <ExportPanel />
      <SettingsPanel />
      <Toast />
    </div>
  );
};
