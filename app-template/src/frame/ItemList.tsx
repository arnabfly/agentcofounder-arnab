// List of items: rows with badges, quick actions, edit and delete.
// The AI never edits this file.

import { useState } from "react";
import type { AppConfig, Item } from "./types";

interface Props {
  config: AppConfig;
  items: Item[];
  totalCount: number;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onSetField: (id: string, field: string, value: string) => void;
}

export function ItemList({ config, items, totalCount, onEdit, onDelete, onSetField }: Props) {
  const [asking, setAsking] = useState<{ itemId: string; field: string; label: string } | null>(null);
  const [askValue, setAskValue] = useState("");

  const mainField = config.fields[0];
  const restFields = config.fields.slice(1);

  if (totalCount === 0) {
    return (
      <p className="empty-note">
        No {config.entityNamePlural} yet. Use “Add {config.entityName}” to create the first one.
      </p>
    );
  }
  if (items.length === 0) {
    return <p className="empty-note">No {config.entityNamePlural} match the current search or filter.</p>;
  }

  function confirmAsk() {
    if (!asking) return;
    const v = askValue.trim();
    if (v === "") return;
    onSetField(asking.itemId, asking.field, v);
    setAsking(null);
    setAskValue("");
  }

  return (
    <ul className="item-list">
      {items.map((item) => {
        const flagged =
          config.flag !== null && (item.values[config.flag.field] ?? "").trim() !== "";
        return (
          <li key={item.id} className="item-row">
            <div className="item-main">
              <span className="item-title">{item.values[mainField.key] || "(untitled)"}</span>
              {restFields.map((f) => {
                const v = (item.values[f.key] ?? "").trim();
                if (v === "") return null;
                return (
                  <span key={f.key} className="item-detail">
                    {f.label}: {v}
                  </span>
                );
              })}
              {flagged && config.flag ? (
                <span className="badge">{config.flag.filledLabel}</span>
              ) : null}
            </div>
            <div className="item-actions">
              {config.quickActions.map((qa) => {
                const filled = (item.values[qa.field] ?? "").trim() !== "";
                const visible = qa.when === "filled" ? filled : !filled;
                if (!visible) return null;
                return (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => {
                      if (qa.ask === null) {
                        onSetField(item.id, qa.field, "");
                      } else {
                        setAsking({ itemId: item.id, field: qa.field, label: qa.ask });
                        setAskValue("");
                      }
                    }}
                  >
                    {qa.label}
                  </button>
                );
              })}
              <button type="button" onClick={() => onEdit(item)}>
                Edit
              </button>
              <button type="button" className="danger" onClick={() => onDelete(item.id)}>
                Delete
              </button>
            </div>
            {asking && asking.itemId === item.id ? (
              <div className="ask-row">
                <label htmlFor={`ask-${item.id}`}>{asking.label}</label>
                <input
                  id={`ask-${item.id}`}
                  value={askValue}
                  onChange={(e) => setAskValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAsk();
                  }}
                />
                <button type="button" className="primary" onClick={confirmAsk}>
                  OK
                </button>
                <button type="button" onClick={() => setAsking(null)}>
                  Cancel
                </button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
