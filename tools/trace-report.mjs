#!/usr/bin/env node
// Judge-friendly trace summarizer. Reads the newest artifacts/runs/<ts>/
// trace/telemetry and prints a readable phase-by-phase account.
// Usage: node tools/trace-report.mjs [runDir]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const runsDir = "artifacts/runs";
const runDir = process.argv[2] ?? join(runsDir, readdirSync(runsDir).sort().at(-1));
console.log(`# Run report: ${runDir}\n`);

const resultPath = ["result.json", join(runDir, "result.json")].find(existsSync);
if (resultPath) {
  const r = JSON.parse(readFileSync(resultPath, "utf8"));
  console.log(`Status: ${r.status} | model calls: ${r.model_calls}`);
  console.log(`Tokens: input ${r.input_tokens}, output ${r.output_tokens}, cache ${r.cache_read_tokens}`);
  console.log(`Weighted score: ${Math.round(r.input_tokens + 3 * r.output_tokens + 0.1 * r.cache_read_tokens)}\n`);
  console.log("Assumptions recorded:");
  for (const a of r.assumptions ?? []) console.log(`  - ${a}`);
  console.log("\nJourneys:");
  for (const t of r.tests_run ?? []) console.log(`  [${t.result}] ${t.journey}`);
  console.log("\nCall log (in/out per call):");
  for (const c of r.call_log ?? [])
    console.log(`  #${String(c.index).padStart(2)} in:${String(c.input_tokens).padStart(6)} out:${String(c.output_tokens).padStart(6)}`);
}
