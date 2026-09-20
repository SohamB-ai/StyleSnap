// Zustand Store for StyleSnap Side Panel UI

import { create } from "zustand";
import { ExtractionResult, HistoryEntry, Settings } from "../shared/types";
import { ElementSelectedPayload } from "../shared/messages";

export type TabType = "tokens" | "components" | "layout" | "assets" | "ai-prompt" | "export" | "history";

interface StyleSnapStore {
  activeTab: TabType;
  result: ExtractionResult | null;
  isExtracting: boolean;
  progressStep: string;
  progressPct: number;
  isInspecting: boolean;
  inspectedElement: ElementSelectedPayload | null;
  theme: "dark" | "light" | "system";
  settingsOpen: boolean;
  historyEntries: HistoryEntry[];
  toast: { message: string; type: "success" | "error" } | null;
  screenshotProgress: number; // 0-100

  // Actions
  setTab: (tab: TabType) => void;
  setResult: (res: ExtractionResult | null) => void;
  startExtraction: () => void;
  updateProgress: (step: string, pct: number) => void;
  finishExtraction: (res: ExtractionResult) => void;
  setInspecting: (inspecting: boolean) => void;
  setInspectedElement: (el: ElementSelectedPayload | null) => void;
  setTheme: (theme: "dark" | "light" | "system") => void;
  toggleSettings: () => void;
  setHistory: (entries: HistoryEntry[]) => void;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;
  setScreenshotProgress: (pct: number) => void;
}

export const useStore = create<StyleSnapStore>((set) => ({
  activeTab: "tokens",
  result: null,
  isExtracting: false,
  progressStep: "",
  progressPct: 0,
  isInspecting: false,
  inspectedElement: null,
  theme: "light",
  settingsOpen: false,
  historyEntries: [],
  toast: null,
  screenshotProgress: 0,

  setTab: (activeTab) => set({ activeTab, inspectedElement: null }),
  setResult: (result) => set({ result, isExtracting: false, activeTab: "tokens" }),
  startExtraction: () => set({ isExtracting: true, progressStep: "Initializing extraction...", progressPct: 5, inspectedElement: null }),
  updateProgress: (progressStep, progressPct) => set({ progressStep, progressPct }),
  finishExtraction: (result) => set({ result, isExtracting: false, progressPct: 100, activeTab: "tokens" }),
  setInspecting: (isInspecting) => set({ isInspecting }),
  setInspectedElement: (inspectedElement) => set({ inspectedElement, isInspecting: false }),
  setTheme: (_theme) => {
    document.documentElement.setAttribute("data-theme", "light");
    set({ theme: "light" });
  },
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  setHistory: (historyEntries) => set({ historyEntries }),
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 3000);
  },
  clearToast: () => set({ toast: null }),
  setScreenshotProgress: (pct) => set({ screenshotProgress: pct })
}));
