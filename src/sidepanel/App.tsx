// Main Side Panel / Popup App Container Component — TypeUI & Stitch design layout

import React, { useEffect } from "react";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { TabBar } from "./components/TabBar";
import { ActionBar } from "./components/ActionBar";
import { EmptyState } from "./components/EmptyState";
import { ExtractingState } from "./components/ExtractingState";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { TokensTab } from "./components/TokensTab";
import { AssetsTab } from "./components/AssetsTab";
import { HistoryTab } from "./components/HistoryTab";
import { ElementSelected } from "./components/ElementSelected";
import { SettingsPanel } from "./components/SettingsPanel";
import { Toast } from "./components/Toast";
import { MessageType } from "../shared/messages";
import { Settings } from "../shared/types";

export const App: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const result = useStore((s) => s.result);
  const isExtracting = useStore((s) => s.isExtracting);
  const inspectedElement = useStore((s) => s.inspectedElement);
  const updateProgress = useStore((s) => s.updateProgress);
  const finishExtraction = useStore((s) => s.finishExtraction);
  const setInspectedElement = useStore((s) => s.setInspectedElement);
  const setTheme = useStore((s) => s.setTheme);

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
        useStore.setState({ isExtracting: false });
        useStore.getState().showToast(message.payload?.reason || "Extraction failed. Please refresh the page.", "error");
      } else if (message.type === MessageType.ELEMENT_SELECTED) {
        setInspectedElement(message.payload);
      }
    };

    chrome.runtime?.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime?.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <div className="w-full h-full bg-base text-primary flex flex-col overflow-hidden relative font-sans select-none">
      {/* Top Header */}
      <Header />

      {/* Tab Segmented Control */}
      <TabBar />

      {/* Main Content Scrollable Zone */}
      <main className="flex-1 min-h-0 overflow-y-auto relative flex flex-col pt-1">
        {inspectedElement ? (
          <ElementSelected />
        ) : isExtracting ? (
          <ExtractingState />
        ) : result ? (
          <>
            {activeTab === "tokens" && <MarkdownViewer />}
            {activeTab === "assets" && <MarkdownViewer />}
            {activeTab === "export" && <TokensTab />}
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

