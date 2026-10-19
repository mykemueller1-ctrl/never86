# One door — end the split brain

**Locked:** The free owner seat and Action Shift checks live on **https://www.never86.ai**.

| Surface | Role |
|---|---|
| `www.never86.ai` | **Canonical.** Marketing OS, `/try`, `/seat`, `/onboard`, `/operator`, `/check/*`, MCP. |
| `app.never86.app` | **Alias only.** Must 308 to `www.never86.ai` (same path). Not a second product. |
| ChatGPT Sites (`*.chatgpt.site`) | **Archive.** Do not onboard operators there. |
| Git `main` | **Product branch.** Deploys the live `.ai` seat lineage. |
| Git `recovery-apr12` | **Thin email-launch stub.** Agents must not open feature work here. |

## Why this existed

Grok could not start Cursor Cloud Agents. Cursor often checked out `recovery-apr12`. Action Shift UI also shipped on a ChatGPT custom domain at `app.never86.app`. Same brand, three machines — felt like nothing was “running.”

## What landed in this repo

1. `src/lib/oneDoor.ts` — canonical host + alias list.
2. `src/proxy.ts` — 308 alias hosts → `www.never86.ai` before auth gates.
3. `vercel.json` — host-based redirects for `.app` (platform layer).
4. `next.config.js` — `/trial` → `/onboard` (legacy seat bookmark).
5. `OperatorGoldLinks` — never86.ai only (no ChatGPT gold CTA).
6. `AGENTS.md` + `.cursor/rules/never86.mdc` — agents work on `main` only.

## Myke ops (this agent cannot finish these)

### 1. GitHub default branch → `main`

Cloud agent token got **403** on `PATCH /repos/...` (no admin). In GitHub:

**Settings → General → Default branch → `main`**

Until that flips, every new Cursor Cloud Agent may still open `recovery-apr12`.

### 2. DNS for `app.never86.app`

Today it resolves to `custom-domains.chatgpt.site`. Point it at Vercel so redirects fire:

1. Namecheap (or DNS host) → `app.never86.app` **CNAME** → `cname.vercel-dns.com`
2. Vercel → project that serves `www.never86.ai` → **Domains** → add `app.never86.app` (optional: set domain redirect target `www.never86.ai` with 308)
3. Wait for cert + verify: `curl -sI https://app.never86.app/check/invoices` → `308`/`301` Location `https://www.never86.ai/check/invoices`

Same for apex `never86.app` / `www.never86.app` if you use them.

### 3. Confirm deploy SHA

Vercel production for `www.never86.ai` should track **`main`**, not `recovery-apr12`.

## Seat path map (Track A)

| Path | Job |
|---|---|
| `/` | One Seat home |
| `/try` | Cold sample win (no card) |
| `/check/invoices` `/check/labor` `/check/menu` | Bring your papers |
| `/seat` | Public One Seat panels |
| `/onboard` | Claim free owner seat |
| `/login` → `/operator` | Signed-in seat |
| `/audit` | 60s 3P proof (Google door) |

Track B Command Center stays gated — never the first word to a 1–5 owner.

## Agent rule

If the checkout tip is `recovery-apr12` and the job is product/seat/GTM: **stop, fetch `main`, branch from `main`.**  
If asked to improve `app.never86.app` as a separate app: **redirect work to never86.ai instead.**
