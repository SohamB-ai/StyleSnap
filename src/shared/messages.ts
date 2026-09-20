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
  SCREENSHOT_RESPONSE = "SCREENSHOT_RESPONSE",
  STITCH_TILES = "STITCH_TILES",
  STORE_SCREENSHOT = "STORE_SCREENSHOT",

  // Export & storage
  EXPORT_FILE = "EXPORT_FILE",
  EXPORT_COMPLETE = "EXPORT_COMPLETE",
  EXPORT_ERROR = "EXPORT_ERROR",
  HISTORY_LOAD = "HISTORY_LOAD",
  HISTORY_RESULT = "HISTORY_RESULT",
  HISTORY_DELETE = "HISTORY_DELETE",
  HISTORY_CLEAR = "HISTORY_CLEAR"
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
  phase: 1 | 2 | 3 | 4;
};

export type CaptureScreenshotPayload = { tabId: number };
export type ScreenshotResponsePayload = { dataUrl: string };
export type StitchTilesPayload = {
  extractionId: string;
  tiles: string[];
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
