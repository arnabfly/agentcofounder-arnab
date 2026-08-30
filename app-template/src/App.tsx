// The application shell: search, filters, summary, form, list.
// Everything is driven by src/config.ts. The AI never edits this file.

import { useEffect, useMemo, useState } from "react";
import { config } from "./config";
import { ItemForm } from "./frame/ItemForm";
import { ItemList } from "./frame/ItemList";
import { useItems } from "./frame/useItems";
import { applyTheme } from "./frame/theme";
import type { Item } from "./frame/types";

export function App() {
  const { items, storageError, addItem, updateItem, setField, deleteItem } = useItems(
    config.storageKey,
  );
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editing, setEditing] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [flagOnly, setFlagOnly] = useState(false);

  useEffect(() => {
    applyTheme(config.icon, config.accent, config.appTitle);
  }, []);

  const filterField = config.filterField
    ? config.fields.find((f) => f.key === config.filterField) ?? null
    : null;

  const flaggedCount = useMemo(() => {
    if (!config.flag) return 0;
    return items.filter((it) => (it.values[config.flag!.field] ?? "").trim() !== "").length;
  }, [items]);

  const statText = useMemo(() => {
    if (!config.stat) return null;
    const { field, kind, label, prefix = "", suffix = "" } = config.stat;
    const valid = items.filter((it) => (it.values[field] ?? "").trim() !== "" && !Number.isNaN(Number(it.values[field])));
    const numbers = valid.map((it) => Number(it.values[field]));
    if (numbers.length === 0) return `${label}: ${prefix}0${suffix}`;
    const total = numbers.reduce((a, b) => a + b, 0);
    const value = kind === "sum" ? total : total / numbers.length;
    const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return `${label}: ${prefix}${rounded}${suffix}`;
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (q !== "") {
        const hay = config.fields
          .map((f) => (it.values[f.key] ?? "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      if (filterField && filterValue !== "" && (it.values[filterField.key] ?? "") !== filterValue) {
        return false;
      }
      if (flagOnly && config.flag) {
        if ((it.values[config.flag.field] ?? "").trim() === "") return false;
      }
      return true;
    });
  }, [items, search, filterField, filterValue, flagOnly]);

  const orderedItems = useMemo(() => {
    if (!config.sort) return visibleItems;
    const { field, direction } = config.sort;
    const fieldDef = config.fields.find((f) => f.key === field);
    const sorted = [...visibleItems].sort((a, b) => {
      const av = (a.values[field] ?? "").trim();
      const bv = (b.values[field] ?? "").trim();
      if (av === "" && bv === "") return 0;
      if (av === "") return 1;
      if (bv === "") return -1;
      let cmp: number;
      if (fieldDef?.type === "number") cmp = Number(av) - Number(bv);
      else cmp = av.localeCompare(bv);
      return direction === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [visibleItems]);

  return (
    <main className="shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">{config.icon}</span>
          <h1>{config.appTitle}</h1>
        </div>
        <p className="summary" aria-live="polite">
          {items.length} {items.length === 1 ? config.entityName : config.entityNamePlural}
          {config.flag ? <> · {flaggedCount} {config.flag.countLabel}</> : null}
          {statText ? <> · {statText}</> : null}
        </p>
      </header>

      {storageError ? (
        <p className="storage-error" role="alert">
          Saving failed — your latest change may not survive a refresh. Free up browser storage and
          try again.
        </p>
      ) : null}

      {mode === "list" ? (
        <>
          <div className="toolbar">
            <button type="button" className="primary" onClick={() => setMode("add")}>
              Add {config.entityName}
            </button>
            <input
              aria-label="Search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filterField ? (
              <select
                aria-label={`Filter by ${filterField.label}`}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">All {filterField.label.toLowerCase()}s</option>
                {(filterField.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : null}
            {config.flag ? (
              <label className="flag-toggle">
                <input
                  type="checkbox"
                  checked={flagOnly}
                  onChange={(e) => setFlagOnly(e.target.checked)}
                />{" "}
                {config.flag.filledLabel} only
              </label>
            ) : null}
          </div>
          <ItemList
            config={config}
            items={orderedItems}
            totalCount={items.length}
            onEdit={(item) => {
              setEditing(item);
              setMode("edit");
            }}
            onDelete={deleteItem}
            onSetField={setField}
          />
        </>
      ) : null}

      {mode === "add" ? (
        <ItemForm
          fields={config.fields}
          heading={`Add ${config.entityName}`}
          submitLabel="Add"
          onSubmit={(values) => {
            addItem(values);
            setMode("list");
          }}
          onCancel={() => setMode("list")}
        />
      ) : null}

      {mode === "edit" && editing ? (
        <ItemForm
          fields={config.fields}
          heading={`Edit ${config.entityName}`}
          submitLabel="Save"
          initialValues={editing.values}
          onSubmit={(values) => {
            updateItem(editing.id, values);
            setEditing(null);
            setMode("list");
          }}
          onCancel={() => {
            setEditing(null);
            setMode("list");
          }}
        />
      ) : null}
      <footer className="app-footer">
        <p>Your data stays in this browser — nothing is sent anywhere.</p>
      </footer>
    </main>
  );
}
