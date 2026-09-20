// Tab Utility for Side Panel & Popup — Handles active tab resolution across side panel and browser windows

import { MessageType } from "../../shared/messages";
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
    let activeTab = tabs?.[0];
    if (activeTab?.id) {
      callback(activeTab);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (fallbackTabs) => {
        activeTab = fallbackTabs?.[0];
        if (activeTab?.id) {
          callback(activeTab);
        } else {
          chrome.tabs.query({ active: true }, (allTabs) => {
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

    chrome.runtime.sendMessage(
      {
        type: MessageType.EXTRACT_PAGE,
        payload: { tabId: tab.id, options: { domLimit } }
      },
      (_response) => {
        if (chrome.runtime.lastError) {
          handleFail("Could not communicate with background service worker. Please reload the extension.");
        }
      }
    );
  });
}
