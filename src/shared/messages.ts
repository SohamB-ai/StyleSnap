// Message Protocol Schema for Inter-Context Communication

import { ExtractionResult, ExportFormat, AITool, HistoryStore } from "./types";

export const enum MessageType {
  // Extraction lifecycle
  EXTRACT_PAGE = "EXTRACT_PAGE",
  EXTRACTION_PROGRESS = "EXTRACTION_PROGRESS",
  EXTRACTION_COMPLETE = "EXTRACTION_COMPLETE",
  EXTRACTION_ERROR = "EXTRACTION_ERROR",
  EXTRACTION_TIMEOUT = "EXTRACTION_TIMEOUT",

  // Inspector
  INSPECT_ACTIVATE = "INSPECT_ACTIVATE",
  INSPECT_DEACTIVATE = "INSPECT_DEACTIVATE",
  ELEMENT_SELECTED = "ELEMENT_SELECTED",

  // Screenshots [V2]
  CAPTURE_SCREENSHOT = "CAPTURE_SCREENSHOT",
  SCREENSHOT_CAPTURE_START = "SCREENSHOT_CAPTURE_START",
  SCREENSHOT_TILE = "SCREENSHOT_TILE",
  SCREENSHOT_RESPONSE = "SCREENSHOT_RESPONSE",
  STITCH_TILES = "STITCH_TILES",
  STORE_SCREENSHOT = "STORE_SCREENSHOT",
  SCREENSHOT_COMPLETE = "SCREENSHOT_COMPLETE",

  // Checkpoints [V2]
  CHECKPOINT_CHECK = "CHECKPOINT_CHECK",
  CHECKPOINT_RESUME = "CHECKPOINT_RESUME",
  CHECKPOINT_CLEAR = "CHECKPOINT_CLEAR",

  // Export & storage
  EXPORT_FILE = "EXPORT_FILE",
  EXPORT_COMPLETE = "EXPORT_COMPLETE",
  EXPORT_ERROR = "EXPORT_ERROR",
  HISTORY_LOAD = "HISTORY_LOAD",
  HISTORY_RESULT = "HISTORY_RESULT",
  HISTORY_DELETE = "HISTORY_DELETE",
  HISTORY_CLEAR = "HISTORY_CLEAR",

  // Animations & 3D / WebGL [V3]
  DETECT_ANIMATIONS = "DETECT_ANIMATIONS",
  ANIMATION_RESULT = "ANIMATION_RESULT",

  // Site Diff [V3]
  DIFF_EXTRACTIONS = "DIFF_EXTRACTIONS",
  DIFF_RESULT = "DIFF_RESULT"
}

export type Context = "panel" | "content-script" | "service-worker";

export interface Message<T extends MessageType, P = void> {
  type: T;
  payload: P;
  requestId?: string;
  fromCtx?: Context;
}

export type ExtractPagePayload = {
  url: string;
  tabId: number;
  options: { domLimit: number };
};

export type ProgressPayload = {
  step: string;
  pct: number;
  phase: 1 | 2 | 3 | 4 | 5;
};

export type CaptureScreenshotPayload = { tabId: number };
export type ScreenshotResponsePayload = { dataUrl: string };
export type ScreenshotCaptureStartPayload = { extractionId: string };
export type ScreenshotTilePayload = {
  extractionId: string;
  dataUrl: string;
  tileIndex: number;
  totalTiles: number;
};
export type ScreenshotTileInfo = {
  dataUrl: string;
  y?: number;
};

export type StitchTilesPayload = {
  extractionId: string;
  tiles: (string | ScreenshotTileInfo)[];
  pageHeight: number;
  viewportHeight: number;
};

export type ElementSelectedPayload = {
  tagName: string;
  html: string;
  css: string;
  boundingBox: { top: number; left: number; width: number; height: number };
  selector: string;
};

export type ExportFilePayload = {
  format: ExportFormat;
  extractionId: string;
  tool?: AITool;
};

export type HistoryDeletePayload = {
  id: string;
};

export type HistoryLoadPayload = {
  id: string;
};

export function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://") ||
    url.startsWith("view-source:") ||
    url.includes("chromewebstore.google.com") ||
    url.includes("addons.mozilla.org")
  );
}
