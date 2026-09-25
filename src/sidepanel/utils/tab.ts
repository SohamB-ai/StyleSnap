// Tab Utility for Side Panel & Popup — Handles active tab resolution across side panel and browser windows

import { MessageType, isRestrictedUrl } from "../../shared/messages";
import { useStore } from "../store";

/**
 * Resolves the current active browser tab for the Side Panel.
 * Uses a 3-tier fallback to ensure target tab is correctly resolved:
 * 1. lastFocusedWindow: true (Primary for Side Panel API in Manifest V3)
 * 2. currentWindow: true (Fallback for popup window)
 * 3. active: true across any window
 */
export function getActiveTab(callback: (tab: chrome.tabs.Tab | null) => void): void {
  if (typeof chrome === "undefined" || !chrome.tabs) {
    callback(null);
    return;
  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (chrome.runtime?.lastError) {
      // Query fallback
    }
    let activeTab = tabs?.[0];
    if (activeTab?.id) {
      callback(activeTab);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (fallbackTabs) => {
        if (chrome.runtime?.lastError) {
          // Query fallback
        }
        activeTab = fallbackTabs?.[0];
        if (activeTab?.id) {
          callback(activeTab);
        } else {
          chrome.tabs.query({ active: true }, (allTabs) => {
            if (chrome.runtime?.lastError) {
              // Ignore
            }
            callback(allTabs?.[0] || null);
          });
        }
      });
    }
  });
}

/**
 * Initiates page extraction safely from side panel UI.
 * Handles tab resolution, sets extraction state, and relays errors if communication fails.
 */
export function triggerPageExtraction(domLimit: number = 2000): void {
  const store = useStore.getState();
  if (store.isExtracting) return;

  store.startExtraction();

  const handleFail = (reason: string) => {
    useStore.setState({ isExtracting: false });
    useStore.getState().showToast(reason, "error");
  };

  getActiveTab((tab) => {
    if (!tab?.id) {
      handleFail("No active browser tab found. Please click on a web tab.");
      return;
    }

    if (tab.url && isRestrictedUrl(tab.url)) {
      handleFail("Cannot extract internal browser pages (like chrome:// or Web Store). Please switch to a regular web page tab.");
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: MessageType.EXTRACT_PAGE,
        payload: { tabId: tab.id, options: { domLimit } }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message || "";
          console.warn("EXTRACT_PAGE response warning:", errMsg);
          if (errMsg.includes("Could not establish connection")) {
            handleFail("Could not communicate with background service worker. Please reload the extension.");
          }
        } else if (response && response.success === false) {
          handleFail(response.reason || response.error || "Extraction could not be started.");
        }
      }
    );
  });
}
