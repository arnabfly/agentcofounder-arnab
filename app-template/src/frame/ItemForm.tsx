// Add/edit form with validation, driven entirely by config.
// The AI never edits this file.

import { useState } from "react";
import type { FieldDef } from "./types";

interface Props {
  fields: FieldDef[];
  heading: string;
  submitLabel: string;
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

export function validateValues(
  fields: FieldDef[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.key] ?? "").trim();
    if (f.required && v === "") {
      errors[f.key] = f.type === "checkbox" ? `${f.label} must be checked.` : `${f.label} is required.`;
    } else if (f.type === "number" && v !== "" && Number.isNaN(Number(v))) {
      errors[f.key] = `${f.label} must be a number.`;
    }
  }
  return errors;
}

export function ItemForm({ fields, heading, submitLabel, initialValues, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of fields) v[f.key] = initialValues?.[f.key] ?? "";
    return v;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const trimmed: Record<string, string> = {};
    for (const f of fields) trimmed[f.key] = (values[f.key] ?? "").trim();
    const errs = validateValues(fields, trimmed);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(trimmed);
  }

  return (
    <section className="card form-card" aria-label={heading}>
      <h2>{heading}</h2>
      <div className="form-grid">
        {fields.map((f) => (
          <div className="form-field" key={f.key}>
            <label htmlFor={`field-${f.key}`}>{f.label}</label>
            {f.type === "checkbox" ? (
              <input
                id={`field-${f.key}`}
                type="checkbox"
                checked={(values[f.key] ?? "") === "yes"}
                onChange={(e) => setValue(f.key, e.target.checked ? "yes" : "")}
              />
            ) : f.type === "select" ? (
              <select
                id={`field-${f.key}`}
                value={values[f.key] ?? ""}
                onChange={(e) => setValue(f.key, e.target.value)}
              >
                <option value="">— choose —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${f.key}`}
                type={f.type === "number" ? "text" : f.type}
                inputMode={f.type === "number" ? "decimal" : undefined}
                placeholder={f.placeholder ?? ""}
                value={values[f.key] ?? ""}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            )}
            {errors[f.key] ? (
              <p className="field-error" role="alert">
                {errors[f.key]}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="primary" onClick={handleSubmit}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
