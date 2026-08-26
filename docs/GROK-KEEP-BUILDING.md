# Grok — keep building (2026-08-26)

Myke: keep going. Supabase is **tomorrow morning**. Do not block the factory on it.

## Factory order (locked)
**Grok** (Myke’s phone hub) → **Cursor** (agents, bots, code, tests, PRs) → **Codex** (watchtower / review outside the factory).

One active Cursor job at a time. Stop stuck sales-org dumps. Do not merge `cursor/grok-sales-org`.

## Live stack (do not rebuild)
1. **#131–#134** landed on `codex/action-shift-122-safe` @ `f92f89d`. Dirty **#130** is closed.
2. Reconcile **#135** (two-date unattended gate; claimed red) and **#137** (ops apply + probe; claimed green) on `cursor/never86-pr-135-137-reconcile-c42a`.
3. Do not relaunch Current system context. No /loop, no subagent swarm, no Facebook.

Allowlisted ancestor: `codex/action-shift-122-safe`. Do **not** replay dirty #130.

## Right now
1. **One Neon apply path** (ops, not this agent): `npm run db:apply-free-seat` → `scripts/apply-free-seat.sh`. Exit 2 if `DATABASE_URL` is missing. Never paste the URL in chat, git, PR, or logs.
2. Probe: `node scripts/probe-free-seat-door.mjs https://www.never86.ai`
3. Walk stranger door once after Neon apply: `/onboard` → activate email → desk → PDQ close → ≤3 Action Shift → night proof.
4. Unattended morning/night stay **off** until Z, Hourly, and Void each parse on **two different business dates**.
5. Free seat stays on **Neon**. Supabase OPS is morning work.
6. Public MCP: `https://www.never86.ai/api/mcp`.

## Do not
- Wait on Supabase tonight
- Invent OPS columns
- Auto-send mail/social
- Put CTap private numbers in public Git
- Start a fourth Never86 repo
- Merge grok-sales-org (#121)
- Re-open dirty #130
- Deploy production or apply Neon from the factory
- Put `DATABASE_URL` in chat, git, PR body, or logs

## When Myke returns to Supabase (morning)
Pay invoices → restore project `never86` → paste `OPS_DATABASE_URL` → wire Toast/CTAP evidence onto the free seat. Neon free seats stay; OPS is the evidence plane.

## Residuals (ops / later)
- Neon 0002+0003 apply (tonight’s blocker)
- Inbound DNS
- Gmail poll later
- OCR later

## Cursor status packet
- Branch: `cursor/never86-pr-135-137-reconcile-c42a`
- PR: https://github.com/mykemueller1-ctrl/never86/pull/138
- Tip ancestor: `codex/action-shift-122-safe` @ `f92f89d` (#131–#134 landed)
- Dirty predecessor: PR #130 closed
- Local tests: vitest **221/221**, lint green, Next production build green
- Live probe: `POST /api/onboard/request` on www still 503 until 0002+0003 hit Neon
- Next: Codex reviews CI/preview; ops applies Neon from the secret box; no merge from desk.
