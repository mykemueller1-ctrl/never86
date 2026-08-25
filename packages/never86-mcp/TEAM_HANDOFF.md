# TEAM HANDOFF — Never86 MCP + one-bot-per-system roster
**Date:** 2026-08-25  
**From:** Grok (operator intelligence session)  
**For:** Tim (CTO), Builder / Cursor pair, Victor / ops data, Jessica (brand voice only if public copy needed)  
**Not for:** Myke to implement. Myke approves external only.

---

## What shipped (done)

Local package: `packages/never86-mcp/` (this tree)

### MCP tools live in code
- `get_operator_system` / `get_operator_logic`
- `calculate_3p_marketplace_cost` (integer cents)
- `build_action_shift` (≤3 moves, Unverified)
- `build_vendor_silence_ticket`
- `list_pos_bots` / `get_pos_router` — Toast, PDQ, Square, Aloha, Simphony, Brink, Lightspeed, Clover, Revel, SpotOn
- `list_vendor_silos` / `get_vendor_silo` — Sysco, US Foods, PFG, Reinhart, Martin Brothers, produce, Coke, Pepsi, beer, chem/paper
- `list_system_bots` / `get_system_bot` — **MarginEdge, Restaurant365, MarketMan, xtraCHEF, BlueCart, Ottimate, meez, QuickBooks**

### Product rule (non-negotiable)
One bot per system. Not a mega-bot.  
Math is deterministic in MCP. Agents explain and route.  
No portal logins. Typed dollars stay UNVERIFIED.  
FACT → WHY → OWNER → ONE NEXT ACTION → $ → EVIDENCE STATUS.

---

## Ownership matrix (do this, not Myke)

| Owner | Job | Done when |
|---|---|---|
| **Tim / CTO** | Land branch, CI, wire MCP into never86.ai edge if needed | `packages/never86-mcp` builds; Cursor can call tools |
| **Builder (Cursor)** | Create **two** named agents only first: PDQ Router + MarginEdge System Bot | Both use MCP; PDQ asks for native Z not password; MarginEdge asks for line export + count before "food cost" |
| **Victor / ops data** | Supply one redacted CTap PDQ Z + one redacted invoice set for regression | Two real files pass twice (rollout gate) |
| **Jessica** | Only if we publish comparison language | Myke approves any public MarginEdge/R365 wording |
| **Myke** | Approve external messages only | No implementation tickets on founder |

---

## Builder — exact agent profiles (paste)

### 1) PDQ Router
**Name:** PDQ Router  
**Job:** Route Community Tap-style PDQ closes.  
**Description:**
You are the PDQ POS specialist for Never86.  
Required sources: native-text Z-report, MyPDQPOS Sales Details, payment/tender, void/refund/discount/tax/tip/EOD, Third Party Orders when configured.  
Never call Delivery / Pickup / House Account a marketplace.  
Empty Third Party Orders means no qualifying configured payment rows — not proof of zero marketplace sales.  
Never ask for a PDQ login. Show Z totals before any leak claim.  
Call MCP get_pos_router with slug "pdq". Output FACT → WHY → OWNER → ACTION → $ → EVIDENCE.

### 2) MarginEdge System Bot
**Name:** MarginEdge System Bot  
**Job:** Translate MarginEdge exports into Never86 evidence states.  
**Description:**
You are the MarginEdge specialist for Never86 — not MarginEdge support.  
Product logic: photo/email/EDI → coding ~24–48h → daily controllable P&L → recipe prices from invoices → QBO sync.  
Surface operator problems: posting lag, OCR/map errors, credit tracking, ~$300–350/loc, not full inventory.  
Hard: invoice spend ≠ actual food cost without complete physical count. OCR lines PARTIAL until category/pack review. No MarginEdge login. Never claim we replace bill-pay or their coding queue.  
Call MCP get_system_bot slug "marginedge".

Do **not** create all 30 bots on day one. PDQ + MarginEdge only. Prove twice. Then expand.

---

## Tim — engineering checklist
1. Merge branch `feat/never86-mcp-v3-roster`
2. `cd packages/never86-mcp && npm i && npm run build`
3. Point Cursor MCP config at `dist/index.js`
4. Smoke: `calculate_3p_marketplace_cost` with eligible_sales 10000, commission 1500, rest 0 → observed cost **15%**
5. Smoke: `get_system_bot` marginedge returns problems list
6. Do not expose store-private memory on public MCP

---

## Victor — evidence pack (minimum)
- One native-text PDQ Z (redact employees as needed)
- One Sysco or Martin Brothers invoice PDF (same store/period if possible)
- Optional: MarginEdge line export if CTap ever used it; else skip

Regression rule: parser/routine stays draft until **two real different inputs** succeed and a human reviews both.

---

## What this is not
- Not a Grok Bot swarm of 20 overnight money agents
- Not DoorDash/Toast OAuth
- Not store cadence invented for Sysco/Martin Brothers
- Not founder homework

---

## Status
PUBLIC_SPEC code + review-sourced system bots.  
Store memory empty until approved cadence/files land.  
Founder action: zero unless approving a public claim.
