// Content Script Entry Point for Page Extraction & Inspector Messaging

import { MessageType } from "../../shared/messages";
import { ExtractionResult } from "../../shared/types";
import { extractTokens } from "./extractor/tokens";
import { scanAssets } from "./extractor/assets";
import { activateInspector, deactivateInspector } from "./inspector";

let port: chrome.runtime.Port | null = null;

function getPort(): chrome.runtime.Port {
  if (!port) {
    try {
      port = chrome.runtime.connect({ name: "stylesnap-extraction" });
      port.onDisconnect.addListener(() => {
        port = null;
      });
    } catch {
      // Connect fallback
    }
  }
  return port!;
}

function sendProgress(step: string, pct: number, phase: 1 | 2 | 3) {
  try {
    const p = getPort();
    if (p) {
      p.postMessage({
        type: MessageType.EXTRACTION_PROGRESS,
        payload: { step, pct, phase }
      });
    }
  } catch {
    // Port fallback
  }
}

function runFullExtraction(domLimit: number = 2000) {
  const startTime = Date.now();

  sendProgress("Reading CSS custom properties & breakpoints...", 15, 1);

  // Phase 1, 2, 3: Extract Tokens & Framework
  const { tokens, warnings, framework } = extractTokens(domLimit);
  sendProgress("Analyzing rendered colors, typography & spacing...", 60, 2);

  // Scan Assets
  const assets = scanAssets();
  sendProgress("Scanning page images, icons & favicons...", 85, 3);

  const duration = Date.now() - startTime;
  const extractionId = `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result: ExtractionResult = {
    id: extractionId,
    url: window.location.href,
    origin: window.location.origin,
    title: document.title || "Untitled Page",
    favicon: assets.favicon?.dataUri || "",
    timestamp: startTime,
    duration,
    version: "1.0.0",
    tokens,
    assets,
    warnings,
    confidence: 0.96,
    detectedFramework: framework
  };

  sendProgress("Extraction complete!", 100, 3);

  chrome.runtime.sendMessage({
    type: MessageType.EXTRACTION_COMPLETE,
    payload: result
  });
}

// Global Message Listener inside Content Script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case MessageType.EXTRACT_PAGE: {
      const domLimit = message.payload?.options?.domLimit || 2000;
      runFullExtraction(domLimit);
      sendResponse({ status: "started" });
      break;
    }
    case MessageType.INSPECT_ACTIVATE: {
      activateInspector();
      sendResponse({ status: "active" });
      break;
    }
    case MessageType.INSPECT_DEACTIVATE: {
      deactivateInspector();
      sendResponse({ status: "inactive" });
      break;
    }
    default:
      break;
  }
});
