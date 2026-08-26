# Never 86'd — Cursor / any agent

Public site: https://www.never86.ai
MCP: `https://www.never86.ai/api/mcp`
`.cursor/mcp.json` already points here. Enable it in Cursor Settings if the cloud agent has not loaded it.

## How we work (locked)
- **Grok** is the founder front door. Myke talks to Grok on the phone. Grok dispatches Cursor.
- **Cursor** runs agents, bots, code, tests, and PRs. Cursor does not wait for Myke to merge from a laptop.
- **Codex** sits outside the factory: reviews Cursor work, keeps logical rails, ships safe branches Cursor may branch from (e.g. `codex/action-shift-122-safe`).
- One active Cursor factory job at a time. Stop/Archive stuck chats (including Grok sales organization) before starting the next.
- Do **not** merge `cursor/grok-sales-org` dumps or +40k-line reviews into product work.

## Product
- Find the leak. Assign the fix. Keep the receipt.
- **One location + one seat is free.** Extra seats paid. No role controls on free.
- Free seat goes **past MarginEdge**. Action Shift: yesterday → one action → night proof.
- Surface: Z/POS, voids, labor, tips, invoices, vendors, beverage, catering, 3P, shift.
- **3P is the Google door.** Homepage is the OS. `/trial` is the seat. `/audit` is the 60-second proof.
- Not R365's GL. Not Voosh (no merchant portal login).

## Loop
capture → parse → truth-gate → normalize → decide (formulas first) → assign (≤3, usually 1) → human approve → prove → learn → repeat

## Do not
- CTap private numbers, names, PINs, or mail on this site
- Guarantee recovery
- Shrink the brand to a fee calculator
- Start a fourth Never86 repo
- Auto-send mail or post
- Invent DB columns — confirm live schema first
- Bundle hunter / sales-org MCP into the operator path

## Active job
**#118 Monday gate** — stranger can join → verify email → activate one store → submit yesterday's close → ≤3 source-labeled actions → night proof. Without Myke touching the database.

**Supabase deferred** (Myke: morning). Free seat runs on **Neon** tonight (`drizzle/0002_free_seat_neon.sql`).

Branch from `codex/action-shift-122-safe` → `cursor/monday-gate-onboard-*`. See #121. SEO/GTM (#122) waits until the stranger door ships.

Grok keep-building brief: `docs/GROK-KEEP-BUILDING.md`. Status: `docs/MONDAY-GATE-STATUS.md`.
