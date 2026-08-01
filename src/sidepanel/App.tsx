// Main Side Panel App Container Component

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

    // 2. Global Chrome Message Listener inside Side Panel
    const messageListener = (message: any) => {
      if (message.type === MessageType.EXTRACTION_PROGRESS) {
        updateProgress(message.payload.step, message.payload.pct);
      } else if (message.type === MessageType.EXTRACTION_COMPLETE) {
        finishExtraction(message.payload);
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
    <div className="w-full h-screen bg-base text-primary flex flex-col overflow-hidden relative font-sans">
      {/* Top Header */}
      <Header />

      {/* Tab Navigation */}
      <TabBar />

      {/* Main Content Scrollable Zone */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {inspectedElement ? (
          <ElementSelected />
        ) : isExtracting ? (
          <ExtractingState />
        ) : result ? (
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

      {/* Overlays */}
      <SettingsPanel />
      <Toast />
    </div>
  );
};
