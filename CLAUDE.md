# never86 — build guide

Next.js 14 (App Router, TypeScript) marketing wedge + self-serve product for
**Never 86'd** — restaurant financial intelligence for operators. Deploys to
Vercel from the default branch.

## The product in one line
Operators drop a POS CSV export and an **agent** names the leak (voids, labor,
tips, 3P fees, vendor drift, beverage cost, catering) with a real dollar figure.
Every figure is source-tagged **Verified / Estimated / Unverified**.

## Architecture that matters

### The 7 leak agents (`src/lib/*Csv.ts`)
Each agent is a **pure function**: `run<Agent>(csv: string) => Result | CsvAnalysisError`.
No DB, no I/O — just CSV in, analysis out. That's what makes them testable and
what powers the no-signup `/connect` upload path.

| Agent | File | Run fn |
|---|---|---|
| Void Hunter | `voidHunterCsv.ts` | `runVoidHunter` |
| Leak Detector | `leakDetectorCsv.ts` | `runLeakDetector` |
| Labor Drift | `laborDriftCsv.ts` | `runLaborDrift` |
| Tip Variance | `tipVarianceCsv.ts` | `runTipVariance` |
| Catering Leak | `cateringLeakCsv.ts` | `runCateringLeak` |
| Beverage Score | `beverageScoreCsv.ts` | `runBeverageCostScore` |
| Vendor Drift | `vendorDriftCsv.ts` | `runVendorDrift` |

Each is exposed at `POST /api/connect/<agent>` (multipart file or json `{csv}`).

### The shared CSV core (`src/lib/csv/core.ts`) ← use this
The mechanics every agent needs, in ONE tested place:
`parseCsv`, `findColumn(headers, aliases, negativeTokens?)`, `num`, `bool`,
`median`, `parseDate`, `norm`, `NOT_A_COUNT`, and the `CsvAnalysisError` type.

**When adding or editing an agent, import these from `csv/core` — do not
re-implement them.** Keep only the agent's own column aliases and its own
negative-token list (those legitimately differ per agent).

> Migration status: `voidHunterCsv` sources everything from `csv/core` and
> re-exports the shared names for backward-compat. The other six agents still
> carry local copies of `num`/`findColumn` (historical) — migrate them to
> `csv/core` incrementally; the vitest suite guards behavior on each change.

## Testing (`npm test` → vitest)
- `src/lib/csv/core.test.ts` — unit tests for the core (parser, column
  detection, number/bool/date parsing, median).
- `tests/agents.test.ts` — every agent must analyze its clean sample in
  `public/samples/` and reject empty / headerless / wrong-shape CSVs in
  `tests/fixtures/` without throwing.
- Add a case whenever you touch an agent or the core. `npm run test:watch` for TDD.
- CI (`.github/workflows/ci.yml`) runs lint → test → build on every push/PR.
- (`tests/run-*.mjs` are the legacy single-file harness — kept as `test:legacy`
  but superseded by vitest, which resolves shared imports.)

## Conventions / guardrails
- **Lazy clients:** `src/db/index.ts` (Neon) and `src/lib/email.ts` (Resend) are
  built on first use, not at import — a missing env var fails one request, never
  the whole build/route. Keep it that way.
- **Source-tag every figure** shown to an operator (Verified/Estimated/Unverified).
- **Public surfaces never name a real client.** Use "a design partner" /
  "an operator." Real operator numbers + the Pulse report internals stay in
  private repos only.
- **Two databases:** Neon (`DATABASE_URL`, app) and Supabase ops
  (`OPS_DATABASE_URL`, via `src/lib/opsDb.ts`, transaction pooler, `prepare:false`).
```
npm run dev     # local
npm test        # vitest: core + all 7 agents
npm run build   # prod build (works with no secrets set)
```
