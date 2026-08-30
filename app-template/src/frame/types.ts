// Frame types: the vocabulary shared by config, storage, UI, and tests.
// The AI never edits this file. It only edits src/config.ts.

export type FieldType = "text" | "select" | "number" | "date";

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
   * Optional derived statistic over a number field, shown in the header.
   * Example: { field: "amount", kind: "sum", label: "Total", suffix: " kr" }
   */
  stat: {
    field: string;
    kind: "sum" | "average";
    label: string;
    prefix?: string;
    suffix?: string;
  } | null;
  /** Optional default ordering of the list. */
  sort: { field: string; direction: "asc" | "desc" } | null;
}

export interface Item {
  id: string;
  values: Record<string, string>;
}
