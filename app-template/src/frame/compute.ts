// Per-row computed value engine. Domain-neutral: fields and labels come from
// src/config.ts. The AI never edits this file.

import type { AppConfig, Item } from "./types";

export function computeValue(config: AppConfig, item: Item): number | null {
  if (!config.computed) return null;
  const { a, b, op } = config.computed;
  const av = Number((item.values[a] ?? "").trim());
  const bv = Number((item.values[b] ?? "").trim());
  if (Number.isNaN(av) || Number.isNaN(bv)) return null;
  if ((item.values[a] ?? "").trim() === "" || (item.values[b] ?? "").trim() === "") return null;
  switch (op) {
    case "multiply": return av * bv;
    case "add": return av + bv;
    case "subtract": return av - bv;
    case "divide": return bv === 0 ? null : av / bv;
  }
}

export function formatComputed(config: AppConfig, value: number): string {
  const c = config.computed!;
  const decimals = c.decimals ?? 2;
  const text = Number.isInteger(value) ? String(value) : value.toFixed(decimals);
  return `${c.prefix ?? ""}${text}${c.suffix ?? ""}`;
}
