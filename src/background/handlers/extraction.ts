// Background Handler for Triggering Page Extraction & Relaying Messages

import { MessageType } from "../../shared/messages";
import { ExtractionResult } from "../../shared/types";
import { saveExtraction } from "../services/db";

/**
 * Resolves the content script filename from the built manifest.
 * The filename contains a Vite hash that changes every build,
 * so we read it dynamically from chrome.runtime.getManifest().
 */
function getContentScriptFile(): string {
  try {
    const manifest = chrome.runtime.getManifest();
    const cs = manifest.content_scripts;
    if (cs && cs.length > 0 && cs[0].js && cs[0].js.length > 0) {
      return cs[0].js[0];
    }
  } catch {}
  return "";
}

/** URLs where content scripts cannot be injected */
function isRestrictedUrl(url: string): boolean {
  return (
    !url ||
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

export async function handleExtractPage(tabId: number, options?: { domLimit?: number }): Promise<void> {
  const safeOptions = { domLimit: options?.domLimit ?? 2000 };

  try {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: MessageType.EXTRACT_PAGE,
        payload: { options: safeOptions }
      },
      (_response) => {
        if (chrome.runtime.lastError) {
          console.warn("Content script not found, injecting dynamically:", chrome.runtime.lastError.message);
          injectAndRetry(tabId, safeOptions);
        }
      }
    );
  } catch (error: any) {
    // Synchronous throw (rare, but possible on invalid tabId)
    sendExtractionError(error.message || "Failed to trigger extraction on tab.");
  }
}

async function injectAndRetry(tabId: number, options: { domLimit: number }): Promise<void> {
  try {
    // 1. Check if the tab URL is injectable
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || "";

    if (isRestrictedUrl(url)) {
      sendExtractionError("Cannot extract from browser internal pages (chrome://, extensions, etc.). Navigate to a website and try again.");
      return;
    }

    // 2. Resolve the content script filename from the manifest
    const scriptFile = getContentScriptFile();
    if (!scriptFile) {
      sendExtractionError("Content script not found in manifest. Please reinstall the extension.");
      return;
    }

    // 3. Dynamically inject the content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptFile]
    });

    // 4. Wait briefly for the script to register its message listener, then retry
    setTimeout(() => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: MessageType.EXTRACT_PAGE,
          payload: { options }
        },
        (_response) => {
          if (chrome.runtime.lastError) {
            sendExtractionError("Failed to communicate after script injection. Please refresh the page and try again.");
          }
        }
      );
    }, 300);
  } catch (err: any) {
    const msg = err.message || "Script injection failed.";
    // Common: "Cannot access a chrome:// URL" or permissions error
    if (msg.includes("Cannot access")) {
      sendExtractionError("Cannot extract from this page. Navigate to a regular website and try again.");
    } else {
      sendExtractionError(msg);
    }
  }
}

function sendExtractionError(reason: string): void {
  chrome.runtime.sendMessage({
    type: MessageType.EXTRACTION_ERROR,
    payload: { reason }
  }).catch(() => {});
}

export async function handleExtractionComplete(result: ExtractionResult): Promise<void> {
  try {
    // 1. Save extraction to IndexedDB and history index
    await saveExtraction(result);

    // 2. Broadcast complete result to Side Panel
    chrome.runtime.sendMessage({
      type: MessageType.EXTRACTION_COMPLETE,
      payload: result
    });
  } catch (err: any) {
    console.error("Error saving extraction in background:", err);
    chrome.runtime.sendMessage({
      type: MessageType.EXTRACTION_COMPLETE,
      payload: result
    });
  }
}

