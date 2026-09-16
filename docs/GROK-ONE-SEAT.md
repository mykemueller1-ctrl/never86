# Grok-native One Seat on never86.ai

**Myke lock:** Operators do **not** onboard on ChatGPT. The public core win stays on `www.never86.ai`.
**Equals:** One Seat = Action Shift = Community logic for 1–5 unit independents.
**Out of scope:** Command Center / Taco Bamba.

## What shipped in this door

| Path | Job |
|---|---|
| `/` | One Seat homepage. Gold mozzarella `$48 → $56` fictional sample. Free owner seat CTA. |
| `/try` | Cold two-invoice win. Same gold card + paste/compare. |
| `/try/labor` `/try/recipes` `/try/watch` | Labor / plate / film samples. Disclosed fiction. |
| `/check/invoices` `/check/labor` `/check/menu` | Native checks. No `chatgpt.site` redirect. |
| `/onboard` `/login` `/contact` | Native seat claim and sign-in. |
| `/api/one-seat/compare` | Deterministic vendor-drift formula. |
| `/api/one-seat/explain` | Optional Grok restatement. Fail-closed without `XAI_API_KEY`. |

ChatGPT Sites V28 (`action-shift-one-seat-v2.never86-d-9722.chatgpt.site`) is archived. Do not send `/check/*`, `/login`, or `/onboard` there.

## Grok / xAI inside the seat

Grok is the preferred **explain** voice. It does not compute dollars. It is not a resale of Grok.

| Env | Required? | What it does |
|---|---|---|
| `XAI_API_KEY` | No | Bearer for `https://api.x.ai/v1/chat/completions`. Missing key → formula cards still work; explain stays off. |
| `XAI_API_BASE` | No | Defaults to `https://api.x.ai/v1`. |
| `XAI_MODEL` | No | Defaults to `grok-4.6`. |

Put the live key only in **Vercel → Project that deploys never86.ai → Settings → Environment Variables** (Production + Preview) or local `.env.local`. Never Git, chat, or a shareable bot.

```bash
# local only
export XAI_API_KEY="paste-from-xAI-console"
npm run keys:probe
```

`GET /api/one-seat/explain` reports whether the key is present. It never returns the secret.

## LIVE 403 — `x-vercel-mitigated: deny`

This repo has **no** `middleware.ts` and **no** Vercel WAF `mitigate` block in `vercel.json` or `next.config.js`. A datacenter `GET https://www.never86.ai` that returns HTTP 403 with `x-vercel-mitigated: deny` is **platform Attack Challenge / system mitigation**, not an in-app deny.

This Cursor Vercel connection only sees team `myke-muellers-projects` project `compass`. It cannot toggle the never86.ai firewall from here. DNS is Namecheap → Vercel, so the live project lives on the Vercel team that owns that domain.

**Myke dashboard steps (do not run from this agent):**

1. Vercel → the project that serves `www.never86.ai` → **Firewall**.
2. If **Attack Challenge Mode** / Attack Mode is on, turn it off (`vercel firewall attack-mode disable` on that project) once the incident is over.
3. Review **System mitigations** and any custom rule whose action is `deny` against datacenter / ASN / bot score. Challenge is safer than deny for Googlebot and operator browsers.
4. If a specific agent IP is false-positive, **Firewall → System bypass** for that IP/CIDR, scoped to `www.never86.ai`.
5. Confirm the production deployment SHA in Vercel matches git `main` before blaming app code.

Do not add an in-repo deny rule to “fix” this. That would hide the platform control.

## Deploy

This branch targets **`main`** (LIVE SHA lineage `5cd84548…`). Default git branch `recovery-apr12` is the thin email-only launch and is **not** what currently serves the One Seat door.

**Do not merge or promote Production without Myke deploy Yes.**
