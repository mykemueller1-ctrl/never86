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

> Migration status: **all 7 agents source parsing / column detection / number
> parsing from `csv/core`** (verified byte-identical via golden snapshots). Two
> agents keep a one-line local wrapper: Leak Detector and Labor Drift delegate
> to `findColumn` while passing their own `NOT_A_COUNT` list; Tip Variance keeps
> a local `%`-stripping `num`. Those are intentional — don't "simplify" them away.

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

## The products (locked 2026-07-16 · TWO products for now)
1. **Daily Prime** (working name; "Pulse" retired — Aloha owns it): invoices +
   sales in → daily prime cost, coach cards, one next move. $199/mo, for the
   1–2 unit indie. CTAP (Myke's own store, PDQ POS) is the proof install.
   Build spec: docs/BUILD_SPEC_operator_coach.md.
2. **The Command Center**: multi-unit leadership intel — weekly brief, per-store
   coaching cards, market threats, every figure labeled, an owner on every move.
   The 16-unit design-partner demo (Toast + R365) is this product.
(The all-in store ops app — inventory, checklists, PIN logins, Brain — runs
live at CTAP but is ON HOLD as a sellable product. Don't market it yet.)

## Product north star (how to talk about it, how to build it)
**This is an operator coaching & decision system, not a dashboard.** The value
isn't the data or the agent count — it's the logic that goes **fact → why it
matters → who owns it → what to do next.** Most restaurant tools stop at
"sales down / labor up / voids high." We connect those facts, source-tag them,
admit uncertainty, and route each finding to the person who owns the response.

Rules that must hold in every surface we build or write:
- **Sell the first win, never "24 agents."** Entry line: *"Give us one report.
  We'll show you one leak, prove it, and tell you what to do next."* For a
  multi-unit CEO: *"One daily read showing where the brand is drifting, why, and
  who owns the next move."*
- **Simple to enter, powerful underneath.** The front door must stay dead
  simple even as the engine gets deeper. If a new operator can't tell where to
  start in 5 seconds, it's too complex — cut, don't add.
- **Every number carries its "now what."** One action + one owner + the $ at
  stake. A figure with no next-step is half-built.
- **Outcome, not "AI."** Describe the process/coaching and the recovered dollars.
  Don't lead with the technology.
- Keep this in mind alongside the guardrails above (source-tag everything;
  public surfaces never name a real client).
```
npm run dev     # local
npm test        # vitest: core + all 7 agents
npm run build   # prod build (works with no secrets set)
```
