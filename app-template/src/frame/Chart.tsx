// Simple horizontal bar chart, pure CSS. Domain-neutral; buckets and values
// come from config + items. The AI never edits this file.

import { useMemo } from "react";
import type { AppConfig, Item } from "./types";
import { computeValue } from "./compute";

export function Chart({ config, items }: { config: AppConfig; items: Item[] }) {
  const chart = config.chart!;
  const overField = config.fields.find((f) => f.key === chart.over);

  const buckets = useMemo(() => {
    const sums = new Map<string, number>();
    for (const it of items) {
      const key = (it.values[chart.over] ?? "").trim() || "—";
      const v =
        chart.value === "@computed"
          ? computeValue(config, it)
          : Number((it.values[chart.value] ?? "").trim());
      if (v === null || Number.isNaN(v)) continue;
      sums.set(key, (sums.get(key) ?? 0) + v);
    }
    let entries = [...sums.entries()];
    if (overField?.type === "select") {
      const order = overField.options ?? [];
      entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
    return entries;
  }, [items]);

  if (buckets.length === 0) return null;
  const max = Math.max(...buckets.map(([, v]) => v));

  return (
    <section className="card chart-card" aria-label={chart.label}>
      <h2>{chart.label}</h2>
      <div className="chart-rows">
        {buckets.map(([name, value]) => (
          <div key={name} className="chart-row">
            <span className="chart-name">{name}</span>
            <span className="chart-track">
              <span
                className="chart-bar"
                style={{ width: `${max > 0 ? Math.max(4, (value / max) * 100) : 4}%` }}
              />
            </span>
            <span className="chart-value">
              {Number.isInteger(value) ? value : value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
