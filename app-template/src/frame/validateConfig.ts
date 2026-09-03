// Config sanity validator. Returns human-readable problems (empty = valid).
// Runs as the FIRST journey test after activation, so a bad fill fails fast
// with a precise message instead of cryptic downstream errors.
// The AI never edits this file.

import type { AppConfig } from "./types";

export function validateConfig(c: AppConfig): string[] {
  const problems: string[] = [];
  const keys = new Set(c.fields.map((f) => f.key));
  const fieldOf = (k: string) => c.fields.find((f) => f.key === k);

  if (!c.appTitle?.trim()) problems.push("appTitle is empty");
  if (!c.icon?.trim()) problems.push("icon is empty");
  if (c.fields.length === 0) problems.push("fields is empty");
  for (const f of c.fields) {
    if (f.type === "select" && (!f.options || f.options.length === 0))
      problems.push(`select field "${f.key}" has no options`);
  }
  if (c.filterField !== null) {
    const f = fieldOf(c.filterField);
    if (!f) problems.push(`filterField "${c.filterField}" is not a field key`);
    else if (f.type !== "select") problems.push(`filterField "${c.filterField}" must be a select field`);
  }
  if (c.flag !== null && !keys.has(c.flag.field))
    problems.push(`flag.field "${c.flag.field}" is not a field key`);
  for (const qa of c.quickActions) {
    if (!keys.has(qa.field)) problems.push(`quickAction "${qa.label}" field "${qa.field}" is not a field key`);
  }
  if (c.computed !== null) {
    const fa = fieldOf(c.computed.a);
    if (!fa) problems.push(`computed.a "${c.computed.a}" is not a field key`);
    else if (c.computed.op === "days_since") {
      if (fa.type !== "date") problems.push(`computed.a "${c.computed.a}" must be a date field for days_since`);
    } else {
      if (fa.type !== "number") problems.push(`computed.a "${c.computed.a}" must be a number field`);
      const bk = c.computed.b;
      if (!bk) problems.push(`computed.b is required for op "${c.computed.op}"`);
      else {
        const fb = fieldOf(bk);
        if (!fb) problems.push(`computed.b "${bk}" is not a field key`);
        else if (fb.type !== "number") problems.push(`computed.b "${bk}" must be a number field`);
      }
    }
  }
  for (const st of c.stats) {
    if (st.field === "@computed") {
      if (c.computed === null) problems.push('a stat uses "@computed" but computed is null');
    } else {
      const f = fieldOf(st.field);
      if (!f) problems.push(`stats field "${st.field}" is not a field key`);
      else if (st.kind !== "count_filled" && f.type !== "number")
        problems.push(`stats field "${st.field}" must be a number field for ${st.kind}`);
    }
  }
  if (c.sort !== null && !keys.has(c.sort.field))
    problems.push(`sort.field "${c.sort.field}" is not a field key`);
  if (c.chart !== null) {
    if (c.chart.value === "@computed") {
      if (c.computed === null) problems.push('chart.value is "@computed" but computed is null');
    } else {
      const f = fieldOf(c.chart.value);
      if (!f) problems.push(`chart.value "${c.chart.value}" is not a field key`);
      else if (f.type !== "number") problems.push(`chart.value "${c.chart.value}" must be a number field`);
    }
    const fo = fieldOf(c.chart.over);
    if (!fo) problems.push(`chart.over "${c.chart.over}" is not a field key`);
    else if (fo.type !== "select" && fo.type !== "date")
      problems.push(`chart.over "${c.chart.over}" must be a select or date field`);
  }
  if (c.groupBy !== null) {
    const f = fieldOf(c.groupBy);
    if (!f) problems.push(`groupBy "${c.groupBy}" is not a field key`);
    else if (f.type !== "select") problems.push(`groupBy "${c.groupBy}" must be a select field`);
  }
  if (c.review !== null) {
    const r = c.review;
    if (!keys.has(r.frontField)) problems.push(`review.frontField "${r.frontField}" is not a field key`);
    for (const bk of r.backFields) {
      if (!keys.has(bk)) problems.push(`review backField "${bk}" is not a field key`);
    }
    if (r.backFields.length === 0) problems.push("review.backFields is empty");
    if (r.resultField !== null) {
      const f = fieldOf(r.resultField);
      if (!f) problems.push(`review.resultField "${r.resultField}" is not a field key`);
      else if (f.type !== "checkbox") problems.push(`review.resultField "${r.resultField}" must be a checkbox field`);
    }
  }
  if (c.secondary !== null) {
    const sec = c.secondary;
    if (sec.storageKey === c.storageKey) problems.push("secondary.storageKey must differ from primary storageKey");
    if (sec.fields.length === 0) problems.push("secondary.fields is empty");
    const secKeys = new Set(sec.fields.map((f) => f.key));
    if (sec.linkField !== null && !secKeys.has(sec.linkField))
      problems.push(`secondary.linkField "${sec.linkField}" is not a secondary field key`);
    for (const f of sec.fields) {
      if (f.type === "select" && f.key !== sec.linkField && (!f.options || f.options.length === 0))
        problems.push(`secondary select field "${f.key}" has no options`);
    }
  }
  return problems;
}
