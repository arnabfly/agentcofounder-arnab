// Per-row computed value engine. Domain-neutral: fields and labels come from
// src/config.ts. The AI never edits this file.

import type { AppConfig, Item } from "./types";

export function computeValue(config: AppConfig, item: Item): number | null {
  if (!config.computed) return null;
  const { a, b, op } = config.computed;
  const rawA = (item.values[a] ?? "").trim();
  if (op === "days_since") {
    if (rawA === "") return null;
    const t = Date.parse(rawA);
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 86400000));
  }
  const rawB = (item.values[b ?? ""] ?? "").trim();
  const av = Number(rawA);
  const bv = Number(rawB);
  if (rawA === "" || rawB === "" || Number.isNaN(av) || Number.isNaN(bv)) return null;
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
