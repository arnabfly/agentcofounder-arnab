// Frame types: the vocabulary shared by config, storage, UI, and tests.
// The AI never edits this file. It only edits src/config.ts.

export type FieldType = "text" | "select" | "number" | "date" | "checkbox";

export interface FieldDef {
  /** internal key, e.g. "title" */
  key: string;
  /** label shown to the user, e.g. "Title" */
  label: string;
  type: FieldType;
  /** must be filled in? */
  required?: boolean;
  /** for type "select": the dropdown choices */
  options?: string[];
  placeholder?: string;
}

/**
 * A one-click action on a list row that sets a single field.
 * Example: "Lend" asks for a name and stores it in `field`;
 * "Return" clears `field` again.
 */
export interface QuickAction {
  /** button label, e.g. "Lend out" */
  label: string;
  /** which field it writes */
  field: string;
  /** show the button only when that field is "empty" or "filled" */
  when: "empty" | "filled";
  /**
   * If a string: ask the user for a value with this prompt label.
   * If null: clear the field.
   */
  ask: string | null;
}

export type AccentName = "blue" | "green" | "violet" | "orange" | "rose" | "teal";

export interface AppConfig {
  /** One emoji used as the app's logo mark and favicon, e.g. "📚". */
  icon: string;
  /** Theme color for the header band and primary buttons. */
  accent: AccentName;
  /** heading shown at the top */
  appTitle: string;
  /** entity words, e.g. "book" / "books" */
  entityName: string;
  entityNamePlural: string;
  /** localStorage key; change per app domain */
  storageKey: string;
  /** the fields of one item, in display order; first field is the main label */
  fields: FieldDef[];
  /** key of a select field to offer as a dropdown filter, or null */
  filterField: string | null;
  /**
   * Optional "flag" concept based on one field being filled.
   * Drives: a toggle filter, a per-row badge, and a summary count.
   * Example: field "borrowedBy" filled means "currently lent out".
   */
  flag: {
    field: string;
    /** badge + filter label when filled, e.g. "Lent out" */
    filledLabel: string;
    /** summary text, e.g. "lent out right now" */
    countLabel: string;
  } | null;
  /** row buttons that set/clear a single field */
  quickActions: QuickAction[];
  /**
   * Optional per-row computed value between two number fields.
   * Example: { label: "Earnings", a: "cups", b: "price", op: "multiply" }
   * Shown in every row; can be aggregated by stat via field "@computed".
   */
  computed: {
    label: string;
    /** key of the first field (number; or date for days_since) */
    a: string;
    /** key of the second number field (omit for days_since) */
    b?: string;
    op: "multiply" | "add" | "subtract" | "divide" | "days_since";
    /** decimal places for display (default 2, integers shown plain) */
    decimals?: number;
    prefix?: string;
    suffix?: string;
  } | null;
  /**
   * Derived statistics shown in the header (empty array = none).
   * field: a number field key, or "@computed" to aggregate the computed value.
   * Example: [{ field: "amount", kind: "sum", label: "Total", suffix: " kr" }]
   */
  stats: {
    field: string;
    kind: "sum" | "average" | "count_filled";
    label: string;
    prefix?: string;
    suffix?: string;
  }[];
  /** Optional default ordering of the list. */
  sort: { field: string; direction: "asc" | "desc" } | null;
  /**
   * Optional simple bar chart, or null.
   * value: a number field key or "@computed"; over: a select or date field
   * whose values become the buckets. Bars show the SUM of value per bucket.
   */
  chart: { value: string; over: string; label: string } | null;
  /** Optional: key of a select field to group the list under headings, or null. */
  groupBy: string | null;
  /** Color scheme of the app. */
  mode: "light" | "dark";
  /**
   * Optional step-through review/practice mode, or null.
   * Shows one item at a time: front first, flip reveals back fields,
   * optional right/wrong marking writes to a checkbox field.
   */
  review: {
    /** field shown as the front of the card */
    frontField: string;
    /** fields revealed after flipping */
    backFields: string[];
    /** checkbox field set by Right/Wrong marking, or null for flip-only */
    resultField: string | null;
    /** toolbar button label, e.g. "Practice" (default "Review") */
    label?: string;
  } | null;
  /**
   * Optional second, related list of records (own tab), or null.
   * linkField: key of a secondary field that references a primary item;
   * it is rendered as a dropdown of the primary items' main-field values.
   */
  secondary: {
    entityName: string;
    entityNamePlural: string;
    storageKey: string;
    fields: FieldDef[];
    linkField: string | null;
  } | null;
}

export interface Item {
  id: string;
  values: Record<string, string>;
}

/**
 * Props handed to the optional custom panel (src/custom.tsx).
 * The frame renders that file automatically when it exists.
 */
export interface CustomPanelProps {
  config: AppConfig;
  items: Item[];
  addItem: (values: Record<string, string>) => void;
  updateItem: (id: string, values: Record<string, string>) => void;
  setField: (id: string, field: string, value: string) => void;
  deleteItem: (id: string) => void;
}
