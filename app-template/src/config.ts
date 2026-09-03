// ============================================================
// THE BLANK. This is the ONLY file the agent edits for a new idea
// (plus optional extra tests). Everything else is the frame.
//
// Deliberately domain-neutral demo values below — replaced per idea.
// ============================================================

import type { AppConfig } from "./frame/types";

export const config: AppConfig = {
  icon: "📋",
  accent: "blue",
  appTitle: "Sample Tracker",
  entityName: "item",
  entityNamePlural: "items",
  storageKey: "app.items.v1",
  fields: [
    { key: "name", label: "Name", type: "text", required: true, placeholder: "Item name" },
    { key: "notes", label: "Notes", type: "text" },
    { key: "category", label: "Category", type: "select", options: ["General", "Other"] },
    { key: "assignedTo", label: "Assigned to", type: "text" },
  ],
  filterField: "category",
  flag: {
    field: "assignedTo",
    filledLabel: "Assigned",
    countLabel: "assigned right now",
  },
  quickActions: [
    { label: "Assign", field: "assignedTo", when: "empty", ask: "Assign to" },
    { label: "Unassign", field: "assignedTo", when: "filled", ask: null },
  ],
  computed: null,
  stats: [],
  sort: null,
  chart: null,
  groupBy: null,
  mode: "light",
  review: null,
  secondary: null,
};
