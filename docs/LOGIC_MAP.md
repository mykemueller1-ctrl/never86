# N86 Logic Map — where everything lives + the rules that bind it
_Distilled 2026-07-17 from Myke's Drive (Compass_Full_Logic.md is the master;
this is the working index). If code disagrees with the master doc, the doc wins
until resolved in writing._

## The binding governance (short form — full text: Compass_Full_Logic.md in Drive)
1. Source-stamp every number — pills: **VERIFIED / ESTIMATED / SINGLE-SOURCE /
   UNVERIFIED** (four words, locked; no "Confirmed/Likely/Pending/Approximate").
2. Do not fabricate — no source → "we don't have enough data yet" empty state.
3. Corrections stay visible (Audit Layer: wrong struck + right + method change).
4. Canary discipline — nightly ingest validates canary store to the cent or the
   brief refuses to ship.
5. Multi-tenant generic — operator_id + RLS everywhere; nothing hard-coded.
6. Operator vocab — banned-vocab CI list (platform, leverage, AI-powered, …).
7. Cost → Visibility → Intelligence; cost leads, "AI" never leads.
8. Customer corrections ship to the methodology page with name + date
   (template: the top-tier loyalty −2 test-account rule).
9. No customer brand on public surfaces without written sign-off.
10. Verification gate — triangulate ≥2 independent sources before VERIFIED.

**Kill-rule:** the retired 3P headline model (industry-default blended rate ≈
$3.59M/yr; corrected to actual-contract-rate ~$1.71–2.06M/yr) must not
re-appear on any surface. Anything that re-introduces it = audit FAIL.

## Agent thresholds (calibrated to the operator's own data, never industry)
- Void Hunter: void_rate > 1.5% OR > $500/employee/period.
- Per-Guest Anomaly: dual gate — ≥35% below store median AND top-decile shifts.
- 3P Fee Exposure: operator's ACTUAL contracted rates from rate-card config;
  missing rate-card → UNVERIFIED pill, labeled placeholder.
- Catering Hidden Line: avg_check > 2× store median AND >5 orders/hr.
- Daypart Gap: >30% below same-DOW median, capped $500K/yr/finding.
- Top Performer: inverted dual gate (top per-guest + top-quartile turn time).
- Tip Variance: tip_pct < 50% of store median, min shifts.
- Data Hygiene: flags impossible ratios (guests/order > 10, Unknown > 5%);
  flags, never silently fixes.

## Canonical Z-report schema (Daily Prime ingest target)
`canonical_z_report(operator_id, location_id, business_date, net_sales,
gross_sales, voids_amount, discounts_amount, guest_count, order_count,
tip_amount, raw_payload jsonb, source_filename, source_pos, ingested_at)` —
raw_payload is the receipt for later re-parse/audit.

## The estate — where everything lives
**Repos (GitHub):** `never86` (this repo: marketing site + trial agents +
operator portal /login → /dashboard) · `n86-bootstrap` (private stash) ·
`agent-ctap-marketing`.

**Supabase `never86` (zjtbhsouhwyyfwoyjgow)** — ops DB. Key surfaces:
- `operator_users` (1=Community Pizza & Tap [Myke's own; PDQ], 3=the 16-unit
  design partner [Toast + R365; CEO Michael; Rik = door in]).
- `operator_locations` — renamed 2026-07-17 to Toast's real labels (Ballston,
  Shirlington, City Ridge, Landmark, Fair Lakes, Fairfax at University Mall…);
  backup: zz_backup_20260717_operator_locations.
- `v_latest_weekly_by_location` — stable view the dashboard reads for the
  freshest weekly pull (currently wk 2026-07-06..12, $963,065, stamped
  UNVERIFIED_PENDING_RECONCILE under a MYKE HALT: Ballston $4,460 delta).
  Repoint per new pull.
- `op_3_*` staging tables per pull date · `op_3_historical_2025_*` (253 rows,
  2025 weekly by store) · `tb_verified_*` · `agent_findings` (12-agent output)
  · `v_governance_exceptions` (feeds coach cards) · CTAP tables:
  `ctap_daily_sales`, `ctap_vendor_invoices`, `ctap_weekly_pl`,
  `operator_z_reports`.
- `operator_credentials` — per-operator logins (myke@n86.app → op 1,
  rik@n86.app → op 3).

**Drive (the project folders):**
- `Pulse CTAP - Pilot Build/` — 01 Intake · 02 Weekly CTAP Boards ·
  03 Invoice Photos and PDFs · 04 Operator Recaps (the Daily Prime pilot).
- CTAP paper by week: `Invoices paper ones June 21st thru 27th`, `Last week
  jun an 4th July week`, `Ctap July 5th thru 11th…`, `CTAP July 12th thru
  18th` (live: daily PDQ PDFs — ZReport_Summary / Hourly_Sales /
  Void_Promo — plus HEIC invoice photos).
- `Compass_Full_Logic.md` (master logic) · `COMPASS_V2_RIKS_BUILD.md` ·
  N86_COMPASS Weekly Brief / Coaching Cards / Market Trade Area PDFs (the
  demo design language the dashboard now matches).
- Handoffs: Never86d-CTap-Handoff-2026-05-02/03, Full-Handoff-v2,
  Claude Handoff 2026-05-19, enterprise-analysis (Toast IQ 2026-01..04).

**Netlify:** `never86-cc-review-2026-07-07` (Compass demo mock — source of the
brief design; NOTE: /compass/ route flagged 7/07 as leaking brand names
publicly — still to verify/close) · `never86ai` · `never86d-analyzer`
(app.never86.ai). **Vercel:** production never86.ai (deploys from main).

## Open loops (inherit, don't rediscover)
- Reconcile the Jul 6–12 pull (Ballston $4,460 delta) → flip rows VERIFIED.
- Conflicting corrected-3P figures across docs: $1.71M (audit template) vs
  $1.81M–$2.06M (weekly brief) — reconcile once, log on Audit Layer.
- /compass/ Netlify leak check; PLCB SSL blocker; daily-brief duplicate-send;
  2 cleartext env values → vault; toast_dining_options missing delivery leaf.
- Dashboard pills: add SINGLE-SOURCE as a first-class pill state (4-word set).
