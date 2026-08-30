# Frame-First Autonomous App Builder

An autonomous pipeline that turns a plain-English product idea into a tested,
runnable web application. Designed for **token efficiency first**: the LLM
configures a pre-built, domain-neutral application frame instead of generating
an application from scratch.

Submission for the Stockholm AI AgentCofounder challenge (Contracts-compatible,
built on the official starter and Pi runner).

## Quickstart (Linux/macOS, matches the judging environment)

Requirements: Node **22.19.x** (the repo rejects other majors), npm 10.9.x.
On Windows, use WSL or GitHub Codespaces.

```bash
npm ci --ignore-scripts
npm --prefix app-template ci --ignore-scripts
export OPENROUTER_API_KEY="..."   # or any Pi-supported provider credential
CHALLENGE_PROVIDER=openrouter CHALLENGE_MODEL=qwen/qwen3-coder npm run challenge
```

To run a different idea:

```bash
npm run challenge -- --idea-file ideas/plants.txt
```

After a run: `npm --prefix output/app run dev` → http://localhost:3000.
The audited bill is in `result.json`; per-run artifacts in `artifacts/runs/`.

## How it works

1. **Frame, not freehand.** `app-template/` ships a complete, hand-tested,
   domain-neutral tracker application: list and detail views, add/edit/delete
   forms with validation, search, dropdown filter, flagged-state toggle with
   live count, per-item computed values (arithmetic between fields or
   days-since a date), header statistics, sorting, grouping, a CSS bar chart,
   an optional second related list with linked records, export/import,
   localStorage persistence that survives refresh and malformed data, themed
   product UI with light/dark modes, accessibility and responsive layout.
   The agent's job shrinks to rewriting **one config file** (`src/config.ts`).
   A config validator runs as the first journey test, so an inconsistent fill
   fails immediately with a precise message.
2. **Dormant test suite.** `src/journeys.dormant.tsx` holds config-driven
   journey tests covering every frame capability. The agent activates them
   with a single rename; they adapt to whatever domain the config declares.
   The untouched seed intentionally fails verification (no active tests).
3. **Report by code, not by memory.** `npm run report` (a zero-token script)
   runs Vitest, converts real results into `tests_run` entries, and writes
   `report.partial.json`. The LLM only authors `report.meta.json`
   (summary / features / assumptions) — so the report can never claim tests
   that did not run.
4. **Escape hatch.** If an idea demands behavior beyond the config's
   expressiveness, the prompt directs the agent to add minimal new code plus
   matching tests — the pipeline degrades in cost, not in success.

Everything reusable is **domain-neutral** (per the organizers' guidance);
no challenge vocabulary appears outside per-run output.

## Measured results (qwen3-coder via OpenRouter)

Weighted score = input + 3×output + 0.1×cache_read. Unmodified starter
baseline on the public book idea: **≈ 82,700, status `partial`**.

| Idea | Status | Journeys tested | Weighted score |
|---|---|---|---|
| Books (official public idea) | success | 12 | ≈ 15,100 |
| Gym workouts | success | 13 | ≈ 11,400 |
| Plants watering log | success | 14 | ≈ 20,900 |
| Shared expenses | success | 9 | ≈ 9,600 |
| Lemonade stand (per-row computed value + chart) | success | 13 | ≈ 11,000–50,000 (run variance) |

Typical tracker-shaped ideas run 4–7× cheaper than baseline while delivering
a richer, fully tested app (12–14 verified journeys). Ideas needing
calculations, charts, or related lists are covered through configuration
alone; the escape hatch remains for anything beyond that.

## Repository layout

- `app-template/` — the frame (seed copied into each run)
- `solution/system-prompt.md` — the agent's instructions
- `ideas/` — extra test ideas used to prove domain generality
- `src/`, `test/` — organizer runner and verifier (upstream, unmodified)
- `artifacts/runs/` — per-run audit logs

## Model provider

The pipeline is provider-agnostic: `CHALLENGE_PROVIDER` and `CHALLENGE_MODEL`
select any provider/model supported by the Pi harness at run time — nothing
in the repository is tied to a specific vendor. OpenRouter with
`qwen/qwen3-coder` is shown in the quickstart because development and the
measured results used it; organizer-controlled values work unchanged.
Providers not built into Pi (e.g. Berget AI) can be added via
`~/.pi/agent/models.json` — see Pi's provider documentation.

## Notes for reviewers

- `npm run check` passes (organizer test suite).
- The frame was authored before runs and contains no idea-specific vocabulary;
  generality is demonstrated by the five-idea table above, reproducible via
  the files in `ideas/`.

## Author

Arnab — github.com/arnabfly
