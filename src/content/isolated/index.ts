// Content Script Entry Point for Page Extraction & Inspector Messaging

import { MessageType } from "../../shared/messages";
import { ExtractionResult } from "../../shared/types";
import { extractTokens } from "./extractor/tokens";
import { scanAssets } from "./extractor/assets";
import { extractLayout } from "./extractor/layout";
import { detectComponents } from "./extractor/components";
import { activateInspector, deactivateInspector } from "./inspector";
import { captureFullPageScreenshots } from "./screenshotDriver";

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

function sendProgress(step: string, pct: number, phase: 1 | 2 | 3 | 4) {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) return;

  let sentViaPort = false;
  try {
    const p = getPort();
    if (p) {
      p.postMessage({
        type: MessageType.EXTRACTION_PROGRESS,
        payload: { step, pct, phase }
      });
      sentViaPort = true;
    }
  } catch {
    sentViaPort = false;
  }
  
  // Direct fallback if port not available
  if (!sentViaPort) {
    try {
      chrome.runtime.sendMessage({
        type: MessageType.EXTRACTION_PROGRESS,
        payload: { step, pct, phase }
      }).catch(() => {});
    } catch {}
  }
}

function runFullExtraction(domLimit: number = 2000) {
  const startTime = Date.now();
  const extractionId = `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  setTimeout(() => {
    try {
      sendProgress("Reading CSS custom properties & breakpoints...", 15, 1);

      // Phase 1, 2, 3: Extract Tokens & Framework
      const { tokens, warnings, framework } = extractTokens(domLimit);
      sendProgress("Analyzing rendered colors, typography & spacing...", 60, 2);

      // Checkpoint 1: Tokens extracted
      chrome.runtime.sendMessage({
        type: MessageType.CHECKPOINT_CHECK,
        action: "save",
        payload: {
          extractionId,
          tabId: 0,
          url: window.location.href,
          title: document.title || "Untitled Page",
          phase: 2,
          step: "Analyzing rendered colors, typography & spacing...",
          pct: 60,
          partialResult: { tokens, warnings, detectedFramework: framework },
          savedAt: Date.now()
        }
      }).catch(() => {});

      // Scan Assets
      const assets = scanAssets();
      sendProgress("Scanning page images, icons & favicons...", 80, 3);

      // Checkpoint 2: Assets extracted
      chrome.runtime.sendMessage({
        type: MessageType.CHECKPOINT_CHECK,
        action: "save",
        payload: {
          extractionId,
          tabId: 0,
          url: window.location.href,
          title: document.title || "Untitled Page",
          phase: 3,
          step: "Scanning page images, icons & favicons...",
          pct: 80,
          partialResult: { tokens, warnings, detectedFramework: framework, assets },
          savedAt: Date.now()
        }
      }).catch(() => {});

      // Phase 4: Layout & Components [V2]
      sendProgress("Analyzing page layout & component patterns...", 90, 4);
      const layout = extractLayout();
      const components = detectComponents(domLimit);

      const duration = Date.now() - startTime;

      const result: ExtractionResult = {
        id: extractionId,
        url: window.location.href,
        origin: window.location.origin,
        title: document.title || "Untitled Page",
        favicon: assets.favicon?.dataUri || "",
        timestamp: startTime,
        duration,
        version: "2.0.0",
        tokens,
        assets,
        layout,
        components,
        warnings,
        confidence: 0.96,
        detectedFramework: framework
      };

      // Clear checkpoint upon successful completion
      chrome.runtime.sendMessage({
        type: MessageType.CHECKPOINT_CLEAR
      }).catch(() => {});

      sendProgress("Extraction complete!", 100, 4);

      if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          type: MessageType.EXTRACTION_COMPLETE,
          payload: result
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error("StyleSnap Extraction Error:", err);
      let reason = err.message || "Failed to parse page styles.";
      if (reason === "empty-dom") {
        reason = "This page has minimal DOM content. Please wait for the page to finish loading and try again.";
      }
      chrome.runtime.sendMessage({
        type: MessageType.CHECKPOINT_CLEAR
      }).catch(() => {});
      if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          type: MessageType.EXTRACTION_ERROR,
          payload: { reason }
        }).catch(() => {});
      }
    }
  }, 10);
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
    case MessageType.SCREENSHOT_CAPTURE_START: {
      const extractionId = message.payload?.extractionId || `ex-${Date.now()}`;
      captureFullPageScreenshots(extractionId);
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
