#!/usr/bin/env node
// One-line verifier: runs report (tests) + build, prints a single compact line.
// FAIL output is trimmed to the first error so agent feedback stays tiny.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(cmd, args) {
  return spawnSync(cmd, args, { encoding: "utf8" });
}

// 1) Tests + report (report.mjs writes report.partial.json)
let rep = run("node", ["scripts/report.mjs"]);
function readJourneys() {
  try {
    const r = JSON.parse(readFileSync("report.partial.json", "utf8"));
    return {
      journeys: (r.tests_run ?? []).length,
      failed: (r.tests_run ?? []).filter(t => t.result !== "passed").map(t => t.journey),
    };
  } catch {
    return { journeys: 0, failed: [] };
  }
}
let { journeys, failed: failedJourneys } = readJourneys();
// Retry once if the runner died without naming a failed test (e.g. resource
// pressure on small machines) — a real test failure lists journeys.
if ((rep.status !== 0 || journeys === 0) && failedJourneys.length === 0) {
  rep = run("node", ["scripts/report.mjs"]);
  ({ journeys, failed: failedJourneys } = readJourneys());
}

if (rep.status !== 0 || failedJourneys.length > 0 || journeys === 0) {
  const firstFail = failedJourneys[0] ?? "no journeys ran";
  // find first assertion error line in vitest output for context
  const out = (rep.stdout + "\n" + rep.stderr).split("\n");
  const errIdx = out.findIndex(l => /FAIL|AssertionError|Error:/.test(l));
  const context = errIdx >= 0 ? out.slice(errIdx, errIdx + 5).join(" | ") : "";
  console.log(`FAIL tests: ${firstFail} :: ${context}`.slice(0, 400));
  process.exit(1);
}

// 2) Build
const build = run("npm", ["run", "build"]);
if (build.status !== 0) {
  const out = (build.stdout + "\n" + build.stderr).split("\n");
  const errIdx = out.findIndex(l => /error/i.test(l));
  const context = errIdx >= 0 ? out.slice(errIdx, errIdx + 5).join(" | ") : "build failed";
  console.log(`FAIL build :: ${context}`.slice(0, 400));
  process.exit(1);
}

console.log(`OK: ${journeys} journeys passed, build clean`);
