// Step-through review/practice mode. Domain-neutral: which fields are the
// front/back and where results go all come from src/config.ts.
// The AI never edits this file.

import { useState } from "react";
import type { AppConfig, Item } from "./types";

interface Props {
  config: AppConfig;
  items: Item[];
  onSetField: (id: string, field: string, value: string) => void;
  onExit: () => void;
}

export function Review({ config, items, onSetField, onExit }: Props) {
  const review = config.review!;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rightCount, setRightCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const fieldLabel = (key: string) =>
    config.fields.find((f) => f.key === key)?.label ?? key;

  if (items.length === 0) {
    return (
      <section className="card review-card" aria-label="Review">
        <p>Nothing to review yet — add some {config.entityNamePlural} first.</p>
        <div className="form-actions">
          <button type="button" onClick={onExit}>Back to list</button>
        </div>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="card review-card" aria-label="Review summary">
        <h2>Round complete</h2>
        <p className="review-summary">
          {review.resultField !== null
            ? `You marked ${rightCount} of ${items.length} right.`
            : `You went through all ${items.length} ${config.entityNamePlural}.`}
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="primary"
            onClick={() => {
              setIndex(0);
              setFlipped(false);
              setRightCount(0);
              setFinished(false);
            }}
          >
            Go again
          </button>
          <button type="button" onClick={onExit}>Back to list</button>
        </div>
      </section>
    );
  }

  const item = items[index];

  function advance() {
    setFlipped(false);
    if (index + 1 >= items.length) setFinished(true);
    else setIndex(index + 1);
  }

  function mark(right: boolean) {
    if (review.resultField !== null) {
      onSetField(item.id, review.resultField, right ? "yes" : "");
    }
    if (right) setRightCount((n) => n + 1);
    advance();
  }

  return (
    <section className="card review-card" aria-label="Review">
      <p className="review-progress">
        {index + 1} / {items.length}
      </p>
      <p className="review-front">{item.values[review.frontField] || "(empty)"}</p>
      {flipped ? (
        <dl className="review-back">
          {review.backFields.map((key) => (
            <div key={key} className="detail-row">
              <dt>{fieldLabel(key)}</dt>
              <dd>{(item.values[key] ?? "").trim() || "—"}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="form-actions">
        {!flipped ? (
          <button type="button" className="primary" onClick={() => setFlipped(true)}>
            Show answer
          </button>
        ) : review.resultField !== null ? (
          <>
            <button type="button" className="primary" onClick={() => mark(true)}>
              Got it right
            </button>
            <button type="button" onClick={() => mark(false)}>
              Got it wrong
            </button>
          </>
        ) : (
          <button type="button" className="primary" onClick={advance}>
            Next
          </button>
        )}
        <button type="button" onClick={onExit}>
          Stop
        </button>
      </div>
    </section>
  );
}
