// Service Worker Entry Point for StyleSnap Extension

import { MessageType } from "../shared/messages";
import { Settings } from "../shared/types";
import { handleExtractPage, handleExtractionComplete } from "./handlers/extraction";
import { handleExportFile } from "./handlers/export";
import { handleScreenshotRequest } from "./handlers/screenshot";
import { loadExtraction, deleteHistoryEntry, clearAllHistory, saveScreenshot } from "./services/db";
import { saveCheckpoint, loadCheckpoint, clearCheckpoint } from "./services/checkpoint";

// 1. Initialize default settings on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const defaultSettings: Settings = {
      schemaVersion: 1,
      theme: "system",
      defaultExportFormat: "design-md",
      defaultAITool: "cursor",
      domSampleLimit: 2000,
      enableAnimationDetection: true,
      installedAt: Date.now(),
      lastOpenedAt: Date.now()
    };
    await chrome.storage.local.set({ stylesnap_settings: defaultSettings });
  }

  // Set side panel behavior to open on action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

// 2. Action click handler fallback
chrome.action.onClicked.addListener((tab) => {
  if (tab.id && chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

// 3. Port connection for progress streaming & keeping SW alive
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "stylesnap-extraction") {
    port.onMessage.addListener((msg) => {
      if (msg.type === MessageType.EXTRACTION_PROGRESS) {
        // Forward progress message to side panel UI
        chrome.runtime.sendMessage(msg).catch(() => {});
      }
    });
  }
});

// 4. Global message dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case MessageType.EXTRACT_PAGE: {
      const tabId = message.payload?.tabId || sender.tab?.id;
      if (tabId) {
        handleExtractPage(tabId, message.payload?.options)
          .then(() => {
            sendResponse({ success: true, status: "started" });
          })
          .catch((err) => {
            sendResponse({ success: false, error: err?.message || "Extraction failed" });
          });
      } else {
        chrome.runtime.sendMessage({
          type: MessageType.EXTRACTION_ERROR,
          payload: { reason: "Target tab not found. Please click on a web tab and try again." }
        }).catch(() => {});
        sendResponse({ success: false, reason: "Target tab not found" });
      }
      return true; // Keep message channel open for async response
    }
    case MessageType.EXTRACTION_COMPLETE: {
      handleExtractionComplete(message.payload).then(() => {
        sendResponse({ success: true });
      }).catch(() => {
        sendResponse({ success: false });
      });
      clearCheckpoint().catch(() => {});
      return true;
    }
    case MessageType.EXPORT_FILE: {
      handleExportFile(message.payload).then(() => {
        sendResponse({ success: true });
      }).catch((err) => {
        sendResponse({ success: false, error: err?.message });
      });
      return true;
    }
    case MessageType.HISTORY_LOAD: {
      loadExtraction(message.payload.id).then((result) => {
        sendResponse({ result });
      });
      return true; // async response
    }
    case MessageType.HISTORY_DELETE: {
      deleteHistoryEntry(message.payload.id).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    case MessageType.HISTORY_CLEAR: {
      clearAllHistory().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    case MessageType.CAPTURE_SCREENSHOT: {
      const windowId = sender.tab?.windowId;
      return handleScreenshotRequest({ ...message.payload, windowId }, sendResponse);
    }
    case MessageType.SCREENSHOT_TILE:
    case MessageType.STITCH_TILES: {
      // Delivered directly to UI via extension runtime messaging
      break;
    }
    case MessageType.STORE_SCREENSHOT: {
      saveScreenshot(message.payload).then(() => {
        sendResponse({ success: true });
        chrome.runtime.sendMessage({
          type: MessageType.SCREENSHOT_COMPLETE,
          payload: { id: message.payload.id }
        }).catch(() => {});
      }).catch((err) => {
        console.warn("Failed to store screenshot in background:", err);
        sendResponse({ success: false });
      });
      return true;
    }
    case MessageType.CHECKPOINT_CHECK: {
      if ((message as any).action === "save") {
        saveCheckpoint(message.payload).then(() => {
          sendResponse({ success: true });
        });
      } else {
        loadCheckpoint().then((checkpoint) => {
          sendResponse({ checkpoint });
        });
      }
      return true;
    }
    case MessageType.CHECKPOINT_CLEAR: {
      clearCheckpoint().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    default:
      break;
  }
});
