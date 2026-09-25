// Extraction Checkpoint Service (Crash Recovery & Resumption)
// Uses chrome.storage.session per Backend Schema §8.1

import { ExtractionCheckpoint } from "../../shared/types";

const CHECKPOINT_KEY = "stylesnap_checkpoint";

export async function saveCheckpoint(cp: ExtractionCheckpoint): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      await chrome.storage.session.set({ [CHECKPOINT_KEY]: cp });
    } catch (err) {
      console.warn("Failed to save checkpoint in session storage:", err);
    }
  }
}

export async function loadCheckpoint(): Promise<ExtractionCheckpoint | null> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      const data = await chrome.storage.session.get(CHECKPOINT_KEY);
      return data?.[CHECKPOINT_KEY] ?? null;
    } catch (err) {
      console.warn("Failed to load checkpoint from session storage:", err);
      return null;
    }
  }
  return null;
}

export async function clearCheckpoint(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      await chrome.storage.session.remove(CHECKPOINT_KEY);
    } catch (err) {
      console.warn("Failed to clear checkpoint from session storage:", err);
    }
  }
}
