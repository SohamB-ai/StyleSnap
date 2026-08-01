// IndexedDB Storage Engine (idb v8) & History Index

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ExtractionRecord, ExtractionResult, HistoryStore, HistoryEntry } from "../../shared/types";

interface StyleSnapDB extends DBSchema {
  extractions: {
    key: string;
    value: ExtractionRecord;
    indexes: {
      "by-url": string;
      "by-timestamp": number;
      "by-origin": string;
    };
  };
  screenshots: {
    key: string;
    value: { id: string; fullPage: Blob };
  };
}

let dbPromise: Promise<IDBPDatabase<StyleSnapDB>> | null = null;

export function openStyleSnapDB(): Promise<IDBPDatabase<StyleSnapDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StyleSnapDB>("stylesnap-db", 1, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const exStore = db.createObjectStore("extractions", { keyPath: "id" });
          exStore.createIndex("by-url", "url", { unique: false });
          exStore.createIndex("by-timestamp", "timestamp", { unique: false });
          exStore.createIndex("by-origin", "origin", { unique: false });

          db.createObjectStore("screenshots", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export function buildHistoryEntry(result: ExtractionResult): HistoryEntry {
  return {
    id: result.id,
    url: result.url,
    origin: result.origin,
    title: result.title,
    faviconDataUri: result.favicon,
    timestamp: result.timestamp,
    durationMs: result.duration,
    colorCount: result.tokens.colors.length,
    fontCount: result.tokens.typography.families.length,
    componentCount: 0,
    hasScreenshots: false,
    version: result.version,
  };
}

export async function saveExtraction(result: ExtractionResult): Promise<void> {
  const db = await openStyleSnapDB();

  // 1. Write to IndexedDB
  await db.put("extractions", {
    id: result.id,
    url: result.url,
    origin: result.origin,
    timestamp: result.timestamp,
    result,
  });

  // 2. Update chrome.storage.local history index
  const storage = await chrome.storage.local.get("stylesnap_history");
  const history: HistoryStore = storage.stylesnap_history ?? { entries: [] };
  
  // Filter out existing entry if re-extracted
  history.entries = history.entries.filter((e) => e.id !== result.id);
  
  const newEntry = buildHistoryEntry(result);
  history.entries.unshift(newEntry);

  // 3. FIFO Eviction (max 10 entries)
  if (history.entries.length > 10) {
    const evicted = history.entries.splice(10);
    await Promise.all(evicted.map((entry) => cascadeDelete(entry.id)));
  }

  await chrome.storage.local.set({ stylesnap_history: history });
}

export async function cascadeDelete(id: string): Promise<void> {
  const db = await openStyleSnapDB();
  const tx = db.transaction(["extractions", "screenshots"], "readwrite");
  await Promise.all([
    tx.objectStore("extractions").delete(id),
    tx.objectStore("screenshots").delete(id),
  ]);
  await tx.done;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await cascadeDelete(id);
  const storage = await chrome.storage.local.get("stylesnap_history");
  const history: HistoryStore = storage.stylesnap_history ?? { entries: [] };
  history.entries = history.entries.filter((e) => e.id !== id);
  await chrome.storage.local.set({ stylesnap_history: history });
}

export async function clearAllHistory(): Promise<void> {
  const db = await openStyleSnapDB();
  const tx = db.transaction(["extractions", "screenshots"], "readwrite");
  await Promise.all([
    tx.objectStore("extractions").clear(),
    tx.objectStore("screenshots").clear(),
  ]);
  await tx.done;
  await chrome.storage.local.set({ stylesnap_history: { entries: [] } });
}

export async function loadExtraction(id: string): Promise<ExtractionResult | null> {
  const db = await openStyleSnapDB();
  const record = await db.get("extractions", id);
  return record?.result ?? null;
}
