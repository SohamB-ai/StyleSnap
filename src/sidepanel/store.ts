// Zustand Store for StyleSnap Side Panel UI

import { create } from "zustand";
import { ExtractionResult, HistoryEntry, ExtractionCheckpoint } from "../shared/types";
import { ElementSelectedPayload } from "../shared/messages";

export type TabType = "ai-prompt" | "assets" | "export" | "history";

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
  isCapturingScreenshot: boolean;
  hasScreenshots: boolean;
  pendingCheckpoint: ExtractionCheckpoint | null;
  pendingSaveHandle: any | null;

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
  startScreenshotCapture: () => void;
  finishScreenshotCapture: () => void;
  setHasScreenshots: (has: boolean) => void;
  setPendingCheckpoint: (cp: ExtractionCheckpoint | null) => void;
  setPendingSaveHandle: (handle: any | null) => void;
}

export const useStore = create<StyleSnapStore>((set) => ({
  activeTab: "ai-prompt",
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
  isCapturingScreenshot: false,
  hasScreenshots: false,
  pendingCheckpoint: null,
  pendingSaveHandle: null,

  setTab: (activeTab) => set({ activeTab, inspectedElement: null }),
  setResult: (result) =>
    set({
      result,
      isExtracting: false,
      activeTab: "ai-prompt",
      hasScreenshots: false,
      isCapturingScreenshot: false
    }),
  startExtraction: () =>
    set({
      isExtracting: true,
      progressStep: "Initializing extraction...",
      progressPct: 5,
      inspectedElement: null,
      pendingCheckpoint: null
    }),
  updateProgress: (progressStep, progressPct) => set({ progressStep, progressPct }),
  finishExtraction: (result) =>
    set({
      result,
      isExtracting: false,
      progressPct: 100,
      activeTab: "ai-prompt",
      pendingCheckpoint: null
    }),
  setInspecting: (isInspecting) => set({ isInspecting }),
  setInspectedElement: (inspectedElement) => set({ inspectedElement, isInspecting: false }),
  setTheme: (theme) => {
    const resolvedTheme =
      theme === "system"
        ? (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
        : theme;
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolvedTheme);
    }
    set({ theme });
  },
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  setHistory: (historyEntries) => set({ historyEntries }),
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 3500);
  },
  clearToast: () => set({ toast: null }),
  setScreenshotProgress: (pct) => set({ screenshotProgress: pct }),
  startScreenshotCapture: () =>
    set({ isCapturingScreenshot: true, screenshotProgress: 5 }),
  finishScreenshotCapture: () =>
    set({ isCapturingScreenshot: false, screenshotProgress: 100, hasScreenshots: true }),
  setHasScreenshots: (hasScreenshots) => set({ hasScreenshots }),
  setPendingCheckpoint: (pendingCheckpoint) => set({ pendingCheckpoint }),
  setPendingSaveHandle: (pendingSaveHandle) => set({ pendingSaveHandle })
}));
