// The application shell: search, filters, summary, form, list.
// Everything is driven by src/config.ts. The AI never edits this file.

import { useEffect, useMemo, useState } from "react";
import { config } from "./config";
import { ItemForm } from "./frame/ItemForm";
import { ItemList } from "./frame/ItemList";
import { Chart } from "./frame/Chart";
import { useItems } from "./frame/useItems";
import { applyTheme } from "./frame/theme";
import { computeValue, formatComputed } from "./frame/compute";
import type { Item } from "./frame/types";

export function App() {
  const { items, storageError, addItem, updateItem, setField, deleteItem } = useItems(
    config.storageKey,
  );
  const [mode, setMode] = useState<"list" | "add" | "edit" | "detail">("list");
  const [viewing, setViewing] = useState<Item | null>(null);
  const [tab, setTab] = useState<"primary" | "secondary">("primary");
  const sec = config.secondary;
  const secItems = useItems(sec ? sec.storageKey : `${config.storageKey}.secondary-unused`);
  const [secMode, setSecMode] = useState<"list" | "add" | "edit">("list");
  const [secEditing, setSecEditing] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [flagOnly, setFlagOnly] = useState(false);

  useEffect(() => {
    applyTheme(config.icon, config.accent, config.appTitle, config.mode);
  }, []);

  const filterField = config.filterField
    ? config.fields.find((f) => f.key === config.filterField) ?? null
    : null;

  const flaggedCount = useMemo(() => {
    if (!config.flag) return 0;
    return items.filter((it) => (it.values[config.flag!.field] ?? "").trim() !== "").length;
  }, [items]);

  const statTexts = useMemo(() => {
    return config.stats.map(({ field, kind, label, prefix = "", suffix = "" }) => {
      if (kind === "count_filled") {
        const n = items.filter((it) => (it.values[field] ?? "").trim() !== "").length;
        return `${label}: ${prefix}${n}${suffix}`;
      }
      const numbers =
        field === "@computed"
          ? items
              .map((it) => computeValue(config, it))
              .filter((v): v is number => v !== null)
          : items
              .filter(
                (it) =>
                  (it.values[field] ?? "").trim() !== "" &&
                  !Number.isNaN(Number(it.values[field])),
              )
              .map((it) => Number(it.values[field]));
      if (numbers.length === 0) return `${label}: ${prefix}0${suffix}`;
      const total = numbers.reduce((a, b) => a + b, 0);
      const value = kind === "sum" ? total : total / numbers.length;
      const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2);
      return `${label}: ${prefix}${rounded}${suffix}`;
    });
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

  function exportData() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.storageKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("not a list");
        for (const entry of parsed as Item[]) {
          if (entry && typeof entry === "object" && entry.values) {
            addItem(Object.fromEntries(
              Object.entries(entry.values).filter(([, v]) => typeof v === "string"),
            ) as Record<string, string>);
          }
        }
      } catch {
        window.alert("That file could not be read as exported data.");
      }
    };
    reader.readAsText(file);
  }

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
          {statTexts.map((t) => (
            <span key={t}> · {t}</span>
          ))}
        </p>
      </header>

      {sec ? (
        <nav className="tabs" aria-label="Sections">
          <button
            type="button"
            className={tab === "primary" ? "tab active" : "tab"}
            onClick={() => setTab("primary")}
          >
            {config.entityNamePlural}
          </button>
          <button
            type="button"
            className={tab === "secondary" ? "tab active" : "tab"}
            onClick={() => setTab("secondary")}
          >
            {sec.entityNamePlural}
          </button>
        </nav>
      ) : null}

      {storageError ? (
        <p className="storage-error" role="alert">
          Saving failed — your latest change may not survive a refresh. Free up browser storage and
          try again.
        </p>
      ) : null}

      {tab === "primary" && mode === "list" ? (
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
            <button type="button" onClick={exportData} title="Download all data as a file">
              Export
            </button>
            <label className="import-label" title="Load data from an exported file">
              Import
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importData(f);
                  e.target.value = "";
                }}
              />
            </label>
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
          {config.chart ? <Chart config={config} items={items} /> : null}
          {(() => {
            const groupField = config.groupBy
              ? config.fields.find((f) => f.key === config.groupBy) ?? null
              : null;
            const listProps = {
              config,
              totalCount: items.length,
              onEdit: (item: Item) => {
                setEditing(item);
                setMode("edit" as const);
              },
              onView: (item: Item) => {
                setViewing(item);
                setMode("detail" as const);
              },
              onDelete: deleteItem,
              onSetField: setField,
            };
            if (!groupField || items.length === 0) {
              return <ItemList {...listProps} items={orderedItems} />;
            }
            const buckets = [...(groupField.options ?? []), ""];
            return buckets.map((bucket) => {
              const inBucket = orderedItems.filter(
                (it) => (it.values[groupField.key] ?? "") === bucket,
              );
              if (inBucket.length === 0) return null;
              return (
                <section key={bucket || "__other"} className="group-section">
                  <h2 className="group-heading">
                    {bucket === "" ? `No ${groupField.label.toLowerCase()}` : bucket}
                  </h2>
                  <ItemList {...listProps} items={inBucket} />
                </section>
              );
            });
          })()}
        </>
      ) : null}

      {tab === "primary" && mode === "add" ? (
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

      {tab === "primary" && mode === "detail" && viewing ? (() => {
        const item = items.find((it) => it.id === viewing.id);
        if (!item) { setMode("list"); return null; }
        const computedV = computeValue(config, item);
        return (
          <section className="card detail-card" aria-label={`${config.entityName} details`}>
            <h2>{item.values[config.fields[0].key] || "(untitled)"}</h2>
            <dl className="detail-grid">
              {config.fields.map((f) => {
                const v = (item.values[f.key] ?? "").trim();
                return (
                  <div key={f.key} className="detail-row">
                    <dt>{f.label}</dt>
                    <dd>{f.type === "checkbox" ? (v === "yes" ? "Yes" : "No") : v || "—"}</dd>
                  </div>
                );
              })}
              {config.computed && computedV !== null ? (
                <div className="detail-row">
                  <dt>{config.computed.label}</dt>
                  <dd>{formatComputed(config, computedV)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="form-actions">
              <button type="button" className="primary" onClick={() => { setEditing(item); setMode("edit"); }}>
                Edit
              </button>
              <button type="button" onClick={() => { setViewing(null); setMode("list"); }}>
                Back to list
              </button>
            </div>
          </section>
        );
      })() : null}

      {tab === "primary" && mode === "edit" && editing ? (
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
      {tab === "secondary" && sec ? (() => {
        const mainKey = config.fields[0].key;
        const linkOptions = items
          .map((it) => (it.values[mainKey] ?? "").trim())
          .filter((v) => v !== "");
        const secFields = sec.fields.map((f) =>
          f.key === sec.linkField
            ? { ...f, type: "select" as const, options: linkOptions }
            : f,
        );
        const secConfigView = {
          ...config,
          entityName: sec.entityName,
          entityNamePlural: sec.entityNamePlural,
          fields: secFields,
          filterField: null,
          flag: null,
          quickActions: [],
          computed: null,
          chart: null,
          groupBy: null,
          sort: null,
        };
        return (
          <>
            {secMode === "list" ? (
              <>
                <div className="toolbar">
                  <button type="button" className="primary" onClick={() => setSecMode("add")}>
                    Add {sec.entityName}
                  </button>
                </div>
                <ItemList
                  config={secConfigView}
                  items={secItems.items}
                  totalCount={secItems.items.length}
                  onEdit={(item) => {
                    setSecEditing(item);
                    setSecMode("edit");
                  }}
                  onDelete={secItems.deleteItem}
                  onSetField={secItems.setField}
                />
              </>
            ) : null}
            {secMode === "add" ? (
              <ItemForm
                fields={secFields}
                heading={`Add ${sec.entityName}`}
                submitLabel="Add"
                onSubmit={(values) => {
                  secItems.addItem(values);
                  setSecMode("list");
                }}
                onCancel={() => setSecMode("list")}
              />
            ) : null}
            {secMode === "edit" && secEditing ? (
              <ItemForm
                fields={secFields}
                heading={`Edit ${sec.entityName}`}
                submitLabel="Save"
                initialValues={secEditing.values}
                onSubmit={(values) => {
                  secItems.updateItem(secEditing.id, values);
                  setSecEditing(null);
                  setSecMode("list");
                }}
                onCancel={() => {
                  setSecEditing(null);
                  setSecMode("list");
                }}
              />
            ) : null}
          </>
        );
      })() : null}

      <footer className="app-footer">
        <p>Your data stays in this browser — nothing is sent anywhere.</p>
      </footer>
    </main>
  );
}
