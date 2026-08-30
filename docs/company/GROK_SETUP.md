# Grok Setup — Company Org + Department Heads

Wire Grok to the same Never86 backend Cursor agents use. One brain; Grok handles conversation, MCP handles math and org routing.

---

## 1. Connect MCP in Grok

1. Open [grok.com/connectors](https://grok.com/connectors)
2. **New Connector → Custom**
3. Name: **Never86'd Operator Intelligence**
4. Endpoint: `https://www.never86.ai/api/mcp`
5. Save — no restaurant login required

Public install page: https://www.never86.ai/mcp

---

## 2. Founder routing prompt (paste first)

```
Use Never86'd get_operator_system first.
I am Myke, Founder. The response includes companyOrg — route as Founder Chief of Staff.
For social work, hand off to Head of Social — Grok. For sales work, hand off to Sales Head.
Draft only — I approve every external message, post, and send.
```

After deploy, you can also call `get_company_org` and `get_department_playbook` directly.

---

## 3. Department head prompts

### Sales Head

```
Act as Never86 Sales Head. Call get_department_playbook with dept_id sales.
Show today's intake queue, reply drafts for AUDIT mentions, and any outbound drafts.
Format each item for my approval inbox. Do not send or post anything.
```

### GTM Head

```
Act as Never86 GTM Head. Call get_department_playbook with dept_id gtm.
From permissioned audit outcomes only, draft proof-to-content for each account voice.
Run Truth/QA on every dollar claim. Queue for my approval — no posting.
```

### Head of Social — Grok

```
Act as Never86 Head of Social. Call get_department_playbook with dept_id social.
Read the ChatGPT handoff and social operating system. Run Social Intelligence, Editorial, platform desks, Short-Form, Repurposing, Publishing Queue, and Performance as one newsroom.
Return one approval packet in Cursor HQ. Never create separate chats or post automatically.
```

### Audit Head

```
Act as Never86 Audit Head. Call get_department_playbook with dept_id audit.
Use calculate_3p_marketplace_cost and get_3p_audit_logic before any narrative.
Return an Operator Receipt: verdict, money map, payout check, proven, not proven, next move.
```

### Product Head

```
Act as Never86 Product Head. Call get_department_playbook with dept_id product.
Review [describe change] against get_operator_system truth gates.
Truth/QA: pass or block with missing evidence.
```

---

## 4. Example sessions

**Morning sales check**

> Sales Head, show new intakes since yesterday and draft replies for any AUDIT comments. Approval inbox format.

**Weekly GTM**

> GTM Head, we have permission on the anonymized DoorDash case. Draft LinkedIn (Myke voice) and Never86 TikTok. One CTA each.

**Statement audit**

> Audit Head, here is a redacted DoorDash statement [paste]. Evidence gate first, then reconcile, then Operator Receipt.

---

## 5. Cursor desktop prerequisites

For live social research and approved replies, authenticate the required connector in Cursor desktop:

- **Cursor Settings → MCP → X** — authenticate
- **Sentia+** — use the signed-in app for CRM lookups and Myke-approved updates; Apollo is not used
- **Gmail MCP** — confirm auth for approved outbound sends (enabled in `.cursor/settings.json`)

Cloud agents cannot complete interactive MCP auth; do this once on desktop.

---

## 6. MCP tools reference

| Tool | When |
|---|---|
| `get_operator_system` | Always first — operator logic, safety, loops |
| `get_company_org` | Company routing, reporting lines, approval gates |
| `get_department_playbook` | Hand off to a department (`sales`, `marketing`, `social`, `gtm`, `audit`, `product`) |
| `calculate_3p_marketplace_cost` | Deterministic statement reconciliation |
| `get_3p_audit_logic` | Before interpreting payout variance |
| `list_answers` | Reply Desk — cite public evidence guides |

---

## 7. What Grok does not do

- Auto-post, auto-email, or auto-DM
- Access private restaurant store memory or credentials
- Promise refunds or recovery without evidence
- Mix CTAP/private operator numbers into public GTM

---

## 8. Keys access

Public operator MCP needs no API key. The private Cursor factory uses Vercel secrets (`NEVER86_OAUTH_CLIENT_SECRET`, `CURSOR_API_KEY`). The optional Grok **model** API uses `XAI_API_KEY` at `https://api.x.ai/v1`.

Canonical names, storage rules, and the no-secret probe: `docs/company/KEYS_ACCESS.md`.  
Copy placeholders from `.env.example`. Never paste a live key into Git, a shareable bot, or this file.

```bash
npm run keys:probe
```
