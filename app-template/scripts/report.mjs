#!/usr/bin/env node
// Builds report.partial.json from REAL vitest results + agent-authored meta.
// Zero LLM tokens. The agent only writes report.meta.json (summary,
// implemented_features, assumptions) and runs `npm run report`.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const REPORT_JSON = ".vitest-report.json";

// 1) Run the test suite with a JSON reporter.
const run = spawnSync(
  "npx",
  ["vitest", "run", "--reporter=json", `--outputFile=${REPORT_JSON}`, "--maxWorkers=1"],
  { encoding: "utf8" },
);

// 2) Parse test results into tests_run entries.
let testsRun = [];
let allPassed = false;
try {
  const data = JSON.parse(readFileSync(REPORT_JSON, "utf8"));
  const results = [];
  for (const file of data.testResults ?? []) {
    for (const t of file.assertionResults ?? []) {
      results.push({
        command: "npm test",
        journey: t.fullName || t.title,
        result: t.status === "passed" ? "passed" : "failed",
      });
    }
  }
  testsRun = results;
  allPassed =
    results.length > 0 &&
    results.every((r) => r.result === "passed") &&
    (data.numFailedTests ?? 1) === 0 &&
    (data.numPendingTests ?? 0) === 0 &&
    (data.numTodoTests ?? 0) === 0;
} catch {
  testsRun = [];
  allPassed = false;
}
try { rmSync(REPORT_JSON); } catch {}

// 3) Read agent-authored meta (best effort).
let meta = {};
try {
  meta = JSON.parse(readFileSync("report.meta.json", "utf8"));
} catch {}

// 4) Compose the report per AGENTS.md.
const report = {
  status: allPassed ? "success" : "partial",
  app_url: "http://localhost:3000",
  start_command: "npm run dev",
  summary: typeof meta.summary === "string" ? meta.summary : "",
  implemented_features: Array.isArray(meta.implemented_features)
    ? meta.implemented_features
    : [],
  assumptions: Array.isArray(meta.assumptions) ? meta.assumptions : [],
  tests_run: testsRun,
};

writeFileSync("report.partial.json", JSON.stringify(report, null, 2) + "\n");
console.log(
  `report.partial.json written: status=${report.status}, journeys=${testsRun.length}`,
);
process.exit(run.status === 0 ? 0 : 1);
