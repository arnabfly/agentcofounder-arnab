// DORMANT until renamed. Frame journey tests. Config-driven: they adapt to whatever src/config.ts
// declares, so they keep passing after the agent fills in a new domain.
// The AI never edits this file (it may ADD its own extra tests separately).

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { config } from "./config";
import { computeValue } from "./frame/compute";

function sampleValue(fieldKey: string, suffix = "One"): string {
  const f = config.fields.find((x) => x.key === fieldKey)!;
  if (f.type === "select") return (f.options ?? [""])[0];
  if (f.type === "number") return "42";
  if (f.type === "date") return "2026-01-15";
  return `${f.label} ${suffix}`;
}

async function addItem(suffix = "One") {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: `Add ${config.entityName}` }));
  for (const f of config.fields) {
    const control = screen.getByLabelText(f.label);
    const value = sampleValue(f.key, suffix);
    if (f.type === "select") {
      await user.selectOptions(control, value);
    } else if (value !== "") {
      await user.clear(control);
      await user.type(control, value);
    }
  }
  await user.click(screen.getByRole("button", { name: "Add" }));
  return user;
}

const mainField = config.fields[0];
// Field used for distinct-value assertions: prefer a text field; fall back to main.
const probeField = config.fields.find((f) => f.type === "text") ?? mainField;

function distinctValue(tag: string): string {
  if (probeField.type === "date") return "2031-12-25";
  if (probeField.type === "number") return "7777";
  return `Zebra ${tag}`;
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("core user journeys", () => {
  it(`adds a ${config.entityName} and shows it in the list`, async () => {
    render(<App />);
    await addItem();
    expect(screen.getByText(sampleValue(mainField.key))).toBeInTheDocument();
  });

  it("keeps data after a page refresh", async () => {
    const first = render(<App />);
    await addItem();
    first.unmount();
    render(<App />); // simulates reopening the app
    expect(screen.getByText(sampleValue(mainField.key))).toBeInTheDocument();
  });

  it("rejects a submission with a missing required field", async () => {
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: `Add ${config.entityName}` }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    const required = config.fields.filter((f) => f.required);
    for (const f of required) {
      expect(screen.getByText(`${f.label} is required.`)).toBeInTheDocument();
    }
    // Still on the form; nothing was added.
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it(`edits an existing ${config.entityName}`, async () => {
    render(<App />);
    const user = await addItem();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const control = screen.getByLabelText(probeField.label);
    const changed = distinctValue("Edited");
    await user.clear(control);
    await user.type(control, changed);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText(new RegExp(changed))).toBeInTheDocument();
  });

  it(`deletes a ${config.entityName}`, async () => {
    render(<App />);
    const user = await addItem();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByText(sampleValue(mainField.key))).not.toBeInTheDocument();
  });

  it("searches by text", async () => {
    render(<App />);
    const user = await addItem("Alpha");
    // add a second, different item (fill every required field)
    const needle = distinctValue("Unique");
    await user.click(screen.getByRole("button", { name: `Add ${config.entityName}` }));
    for (const f of config.fields) {
      const control = screen.getByLabelText(f.label);
      const value = f.key === probeField.key ? needle : sampleValue(f.key, "Second");
      if (f.type === "select") await user.selectOptions(control, value);
      else if ((f.required || f.key === probeField.key) && value !== "") { await user.clear(control); await user.type(control, value); }
    }
    await user.click(screen.getByRole("button", { name: "Add" }));

    await user.type(screen.getByLabelText("Search"), needle.slice(0, 6));
    expect(screen.getByText(new RegExp(needle))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(sampleValue(mainField.key, "Alpha")))).not.toBeInTheDocument();
  });

  it("survives malformed saved data without crashing", async () => {
    window.localStorage.setItem(config.storageKey, "{not valid json!!");
    render(<App />);
    expect(
      screen.getByRole("button", { name: `Add ${config.entityName}` }),
    ).toBeInTheDocument();
  });
});

if (config.filterField) {
  describe("category filter", () => {
    it("filters by the configured dropdown", async () => {
      const filterField = config.fields.find((f) => f.key === config.filterField)!;
      const optionA = (filterField.options ?? [])[0];
      const optionB = (filterField.options ?? [])[1] ?? optionA;
      render(<App />);
      const user = userEvent.setup();

      // item with option A
      await addItem("Alpha");
      // item with option B (fill every required field)
      const marker = distinctValue("FilterB");
      await user.click(screen.getByRole("button", { name: `Add ${config.entityName}` }));
      for (const f of config.fields) {
        const control = screen.getByLabelText(f.label);
        if (f.key === filterField.key) { await user.selectOptions(control, optionB); continue; }
        const value = f.key === probeField.key ? marker : sampleValue(f.key, "Second");
        if (f.type === "select") await user.selectOptions(control, value);
        else if ((f.required || f.key === probeField.key) && value !== "") { await user.clear(control); await user.type(control, value); }
      }
      await user.click(screen.getByRole("button", { name: "Add" }));

      await user.selectOptions(
        screen.getByLabelText(`Filter by ${filterField.label}`),
        optionB,
      );
      expect(screen.getByText(new RegExp(marker))).toBeInTheDocument();
      if (optionB !== optionA) {
        expect(
          screen.queryByText(new RegExp(sampleValue(mainField.key, "Alpha"))),
        ).not.toBeInTheDocument();
      }
    });
  });
}

if (config.flag) {
  describe("flag journeys", () => {
    const flag = config.flag!;
    const setAction = config.quickActions.find(
      (qa) => qa.field === flag.field && qa.when === "empty" && qa.ask !== null,
    );
    const clearAction = config.quickActions.find(
      (qa) => qa.field === flag.field && qa.when === "filled" && qa.ask === null,
    );

    it("sets and clears the flag via quick actions and updates the count", async () => {
      if (!setAction || !clearAction) return;
      render(<App />);
      // Build an item whose flag field is EMPTY (skip it in the form).
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: `Add ${config.entityName}` }));
      for (const f of config.fields) {
        if (f.key === flag.field) continue;
        const control = screen.getByLabelText(f.label);
        const value = sampleValue(f.key);
        if (f.type === "select") await user.selectOptions(control, value);
        else if (value !== "") await user.type(control, value);
      }
      await user.click(screen.getByRole("button", { name: "Add" }));

      // Set the flag.
      await user.click(screen.getByRole("button", { name: setAction.label }));
      await user.type(screen.getByLabelText(setAction.ask as string), "Sam");
      await user.click(screen.getByRole("button", { name: "OK" }));
      expect(screen.getByText(flag.filledLabel)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`1 ${flag.countLabel}`))).toBeInTheDocument();

      // Filter to flagged only shows it.
      await user.click(screen.getByLabelText(`${flag.filledLabel} only`));
      expect(screen.getByText(sampleValue(mainField.key))).toBeInTheDocument();
      await user.click(screen.getByLabelText(`${flag.filledLabel} only`));

      // Clear the flag.
      await user.click(screen.getByRole("button", { name: clearAction.label }));
      expect(screen.queryByText(flag.filledLabel)).not.toBeInTheDocument();
      expect(screen.getByText(new RegExp(`0 ${flag.countLabel}`))).toBeInTheDocument();
    });
  });
}

if (config.stat) {
  describe("derived statistic", () => {
    const stat = config.stat!;
    it("shows the configured statistic and updates it when items change", async () => {
      render(<App />);
      await addItem("One");
      await addItem("Two");
      // sampleValue gives every number field the value 42.
      let per = 42;
      if (stat.field === "@computed" && config.computed) {
        const sample: Record<string, string> = {};
        for (const f of config.fields) sample[f.key] = sampleValue(f.key);
        per = computeValue(config, { id: "x", values: sample }) ?? 0;
      }
      const expected = String(stat.kind === "sum" ? per * 2 : per);
      const prefix = stat.prefix ?? "";
      const suffix = stat.suffix ?? "";
      expect(
        screen.getByText(new RegExp(`${stat.label}: ${prefix}${expected}${suffix}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
      ).toBeInTheDocument();
    });
  });
}

if (config.sort) {
  describe("default ordering", () => {
    const sort = config.sort!;
    it("orders the list by the configured field and direction", async () => {
      const sortField = config.fields.find((f) => f.key === sort.field)!;
      if (sortField.type !== "text") return; // generic check only for text sorts
      render(<App />);
      const user = userEvent.setup();
      for (const name of ["Mango", "Apple"]) {
        await user.click(screen.getByRole("button", { name: `Add ${config.entityName}` }));
        for (const f of config.fields) {
          const control = screen.getByLabelText(f.label);
          const value = f.key === sort.field ? name : sampleValue(f.key, name);
          if (f.type === "select") await user.selectOptions(control, sampleValue(f.key));
          else if ((f.required || f.key === sort.field) && value !== "") {
            await user.clear(control);
            await user.type(control, value);
          }
        }
        await user.click(screen.getByRole("button", { name: "Add" }));
      }
      const titles = screen.getAllByText(/Mango|Apple/).map((n) => n.textContent);
      const expectedOrder = sort.direction === "asc" ? ["Apple", "Mango"] : ["Mango", "Apple"];
      expect(titles[0]).toContain(expectedOrder[0]);
    });
  });
}

if (config.computed) {
  describe("computed value", () => {
    const computed = config.computed!;
    it("shows the computed value on each row", async () => {
      render(<App />);
      await addItem("One");
      // sampleValue gives every number field 42.
      const ops: Record<string, number> = {
        multiply: 42 * 42,
        add: 84,
        subtract: 0,
        divide: 1,
      };
      const value = ops[computed.op];
      const text = Number.isInteger(value) ? String(value) : value.toFixed(computed.decimals ?? 2);
      expect(
        screen.getByText(new RegExp(`${computed.label}: .*${text}`)),
      ).toBeInTheDocument();
    });
  });
}
