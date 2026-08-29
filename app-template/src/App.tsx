// The application shell: search, filters, summary, form, list.
// Everything is driven by src/config.ts. The AI never edits this file.

import { useMemo, useState } from "react";
import { config } from "./config";
import { ItemForm } from "./frame/ItemForm";
import { ItemList } from "./frame/ItemList";
import { useItems } from "./frame/useItems";
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

  const filterField = config.filterField
    ? config.fields.find((f) => f.key === config.filterField) ?? null
    : null;

  const flaggedCount = useMemo(() => {
    if (!config.flag) return 0;
    return items.filter((it) => (it.values[config.flag!.field] ?? "").trim() !== "").length;
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

  return (
    <main className="shell">
      <header className="app-header">
        <h1>{config.appTitle}</h1>
        {config.flag ? (
          <p className="summary" aria-live="polite">
            {items.length} {items.length === 1 ? config.entityName : config.entityNamePlural} ·{" "}
            {flaggedCount} {config.flag.countLabel}
          </p>
        ) : (
          <p className="summary" aria-live="polite">
            {items.length} {items.length === 1 ? config.entityName : config.entityNamePlural}
          </p>
        )}
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
            items={visibleItems}
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
    </main>
  );
}
