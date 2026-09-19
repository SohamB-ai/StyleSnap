// Zustand Store for StyleSnap Side Panel UI
// Adheres strictly to Section 5 of StyleSnap Specification

import { create } from "zustand";
import { ExtractionResult, HistoryEntry } from "../shared/types";
import { ElementSelectedPayload } from "../shared/messages";

export type UIState =
  | "idle"
  | "extracting"
  | "inspecting"
  | "element-selected"
  | "exporting"
  | "error-extraction"
  | "error-restricted"
  | "error-interrupted";

export type Tab = "tokens" | "assets" | "history";
export type Theme = "dark" | "light" | "system";

export interface StyleSnapStore {
  // data
  extraction: ExtractionResult | null;
  history: HistoryEntry[];

  // ui state
  uiState: UIState;
  activeTab: Tab;
  progress: { pct: number; step: string };
  inspectorActive: boolean;
  inspectedElement: ElementSelectedPayload | null;
  exportPanelOpen: boolean;
  settingsPanelOpen: boolean;

  // theme
  theme: Theme;

  // toast
  toast: { message: string; type: "success" | "error" } | null;

  // legacy / compatibility aliases
  result: ExtractionResult | null;
  historyEntries: HistoryEntry[];
  isExtracting: boolean;
  isInspecting: boolean;
  progressStep: string;
  progressPct: number;
  settingsOpen: boolean;

  // actions
  setExtraction: (r: ExtractionResult | null) => void;
  setUIState: (s: UIState) => void;
  setActiveTab: (t: Tab) => void;
  setProgress: (p: { pct: number; step: string }) => void;
  setTheme: (t: Theme) => void;
  openExportPanel: () => void;
  closeExportPanel: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  dismissToast: () => void;

  // additional helper actions
  setHistory: (entries: HistoryEntry[]) => void;
  setInspectedElement: (el: ElementSelectedPayload | null) => void;
  setInspectorActive: (active: boolean) => void;
  setInspecting: (active: boolean) => void;
  startExtraction: () => void;
  updateProgress: (step: string, pct: number) => void;
  finishExtraction: (r: ExtractionResult) => void;
  setTab: (t: Tab) => void;
  setResult: (r: ExtractionResult | null) => void;
  toggleSettings: () => void;
  clearToast: () => void;
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === "undefined") return;
  let resolvedTheme = theme;
  if (theme === "system") {
    resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", resolvedTheme);
}

export const useStore = create<StyleSnapStore>((set) => ({
  extraction: null,
  history: [],
  uiState: "idle",
  activeTab: "tokens",
  progress: { pct: 0, step: "" },
  inspectorActive: false,
  inspectedElement: null,
  exportPanelOpen: false,
  settingsPanelOpen: false,
  theme: "system",
  toast: null,

  // Compatibility aliases
  result: null,
  historyEntries: [],
  isExtracting: false,
  isInspecting: false,
  progressStep: "",
  progressPct: 0,
  settingsOpen: false,

  setExtraction: (extraction) =>
    set({
      extraction,
      result: extraction,
      uiState: extraction ? "idle" : "idle",
      isExtracting: false,
      activeTab: "tokens"
    }),

  setUIState: (uiState) =>
    set({
      uiState,
      isExtracting: uiState === "extracting",
      isInspecting: uiState === "inspecting"
    }),

  setActiveTab: (activeTab) =>
    set({
      activeTab,
      inspectedElement: null,
      uiState: "idle"
    }),

  setProgress: (progress) =>
    set({
      progress,
      progressPct: progress.pct,
      progressStep: progress.step
    }),

  setTheme: (theme) => {
    applyThemeToDocument(theme);
    set({ theme });
  },

  openExportPanel: () => set({ exportPanelOpen: true }),
  closeExportPanel: () => set({ exportPanelOpen: false }),

  openSettings: () => set({ settingsPanelOpen: true, settingsOpen: true }),
  closeSettings: () => set({ settingsPanelOpen: false, settingsOpen: false }),

  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((state) => {
        if (state.toast?.message === message) {
          return { toast: null };
        }
        return state;
      });
    }, 3000);
  },

  dismissToast: () => set({ toast: null }),

  setHistory: (history) => set({ history, historyEntries: history }),

  setInspectedElement: (inspectedElement) =>
    set({
      inspectedElement,
      uiState: inspectedElement ? "element-selected" : "idle",
      inspectorActive: false,
      isInspecting: false
    }),

  setInspectorActive: (inspectorActive) =>
    set({
      inspectorActive,
      isInspecting: inspectorActive,
      uiState: inspectorActive ? "inspecting" : "idle"
    }),

  setInspecting: (isInspecting) =>
    set({
      inspectorActive: isInspecting,
      isInspecting,
      uiState: isInspecting ? "inspecting" : "idle"
    }),

  startExtraction: () =>
    set({
      uiState: "extracting",
      isExtracting: true,
      progress: { pct: 5, step: "Initializing extraction..." },
      progressPct: 5,
      progressStep: "Initializing extraction...",
      inspectedElement: null
    }),

  updateProgress: (step, pct) =>
    set({
      progress: { pct, step },
      progressPct: pct,
      progressStep: step
    }),

  finishExtraction: (extraction) =>
    set({
      extraction,
      result: extraction,
      uiState: "idle",
      isExtracting: false,
      progress: { pct: 100, step: "Complete" },
      progressPct: 100,
      progressStep: "Complete",
      activeTab: "tokens"
    }),

  setTab: (activeTab) =>
    set({
      activeTab,
      inspectedElement: null
    }),

  setResult: (result) =>
    set({
      extraction: result,
      result,
      uiState: "idle",
      isExtracting: false,
      activeTab: "tokens"
    }),

  toggleSettings: () =>
    set((state) => {
      const next = !state.settingsPanelOpen;
      return {
        settingsPanelOpen: next,
        settingsOpen: next
      };
    }),

  clearToast: () => set({ toast: null })
}));
