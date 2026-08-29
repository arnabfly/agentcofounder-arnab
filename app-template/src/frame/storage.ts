// Persistence: load/save items in localStorage.
// Hand-written and hand-tested. Survives malformed data and storage failures.
// The AI never edits this file.

import type { Item } from "./types";

export function loadItems(storageKey: string): Item[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep only entries that look like valid items; repair what we can.
    const items: Item[] = [];
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as Item).id === "string" &&
        (entry as Item).values &&
        typeof (entry as Item).values === "object"
      ) {
        const values: Record<string, string> = {};
        for (const [k, v] of Object.entries((entry as Item).values)) {
          if (typeof v === "string") values[k] = v;
        }
        items.push({ id: (entry as Item).id, values });
      }
    }
    return items;
  } catch {
    // Malformed JSON or storage unavailable: start clean instead of crashing.
    return [];
  }
}

export function saveItems(storageKey: string, items: Item[]): boolean {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
    return true;
  } catch {
    // Storage full or blocked: report failure so the UI can tell the user.
    return false;
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
