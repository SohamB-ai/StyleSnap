// Background Handler for Triggering Page Extraction & Relaying Messages

import { MessageType } from "../../shared/messages";
import { ExtractionResult } from "../../shared/types";
import { saveExtraction } from "../services/db";

export async function handleExtractPage(tabId: number, options: { domLimit: number }): Promise<void> {
  try {
    // 1. Ensure content script is injected
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content/isolated/index.js"]
    }).catch(() => {
      // Content script may already be running from manifest content_scripts
    });

    // 2. Send EXTRACT_PAGE to content script
    chrome.tabs.sendMessage(tabId, {
      type: MessageType.EXTRACT_PAGE,
      payload: { options }
    });
  } catch (error: any) {
    chrome.runtime.sendMessage({
      type: MessageType.EXTRACTION_ERROR,
      payload: { reason: error.message || "Failed to inject content script on tab." }
    });
  }
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
