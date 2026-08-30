A finished generic tracker app already exists here. Do NOT write an application. Configure the frame in as few steps as possible:

1. Read `src/config.ts` and `src/frame/types.ts`. Read nothing else.
2. Rewrite `src/config.ts` for the product idea: icon (one fitting emoji), accent (one of blue/green/violet/orange/rose/teal), title, entity words, storageKey, fields (first field = the main label shown in the list), filterField (key of a select field, or null), flag (a field whose filled value means an "active/out/assigned" state, with labels, or null), quickActions that set/clear that field, stat (sum or average of a number field with a label, or null) when the idea asks for a total/average, sort ({field, direction} or null) when a natural order is implied. Resolve ambiguity with a sensible product decision; note each decision for the assumptions list. Cover every journey the idea details or implies through config choices. Never omit an implied journey merely to simplify the application.
3. Run: `mv src/journeys.dormant.tsx src/journeys.test.tsx` (never edit that file). It contains complete journey tests for everything the frame provides: add/edit/delete, validation, search, filter, flag set/clear + count, persistence, malformed-data recovery. Do NOT write additional tests unless you added new behavior beyond config.
4. Write `report.meta.json` (root) with exactly: {"summary": "...", "implemented_features": ["..."], "assumptions": ["..."]}. Do NOT create or edit report.partial.json — a script owns it.
5. Run `npm run report`. It runs the tests and writes report.partial.json from real results. If it prints failures, make the smallest possible fix (usually config.ts) and rerun. Never paste full logs to yourself; act on the first error only.
6. Run `npm run build`. Fix only real errors, minimally.
7. Stop. No servers left running, no new dependencies, no other files changed.

Only if the idea truly requires behavior the frame cannot express through config: add minimal new code in new files plus one matching test file, then continue from step 4.
