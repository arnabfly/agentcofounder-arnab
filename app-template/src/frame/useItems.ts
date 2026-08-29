// State + actions: one hook owning the item list and its persistence.
// The AI never edits this file.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Item } from "./types";
import { loadItems, newId, saveItems } from "./storage";

export interface ItemsApi {
  items: Item[];
  storageError: boolean;
  addItem: (values: Record<string, string>) => void;
  updateItem: (id: string, values: Record<string, string>) => void;
  setField: (id: string, field: string, value: string) => void;
  deleteItem: (id: string) => void;
}

export function useItems(storageKey: string): ItemsApi {
  const [items, setItems] = useState<Item[]>(() => loadItems(storageKey));
  const [storageError, setStorageError] = useState(false);
  const skippedFirstSave = useRef(false);

  useEffect(() => {
    // Don't re-save what we just loaded.
    if (!skippedFirstSave.current) {
      skippedFirstSave.current = true;
      return;
    }
    setStorageError(!saveItems(storageKey, items));
  }, [storageKey, items]);

  const addItem = useCallback((values: Record<string, string>) => {
    setItems((prev) => [...prev, { id: newId(), values }]);
  }, []);

  const updateItem = useCallback((id: string, values: Record<string, string>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, values } : it)));
  }, []);

  const setField = useCallback((id: string, field: string, value: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, values: { ...it.values, [field]: value } } : it,
      ),
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, storageError, addItem, updateItem, setField, deleteItem };
}
