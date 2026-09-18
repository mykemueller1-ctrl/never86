# Operator papers — Gmail + Drive (One Seat)

Google-first. Fail-closed. No homework form. No invented $.

Live probe (2026-09-18): `GET /api/papers/status` returns `ready: false` and `GET /api/papers/google/start` returns **503** `papers_google_closed`. Secrets are Missing on the deploy that serves www.never86.ai. This repo ships the Connect path; Myke Yes is required to unlock it.

## Exact Vercel env vars

Set on the **Vercel project that deploys www.never86.ai** → Settings → Environment Variables → Production and Preview. Do not invent values. Do not put live secrets in Git or this PR.

| Name | Required to Connect? | Kind | What it does |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | **Yes** | public | OAuth web client id (`*.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | **Yes** | secret | OAuth web client secret (`GOCSPX-…`) |
| `PAPERS_GOOGLE_REDIRECT` | No (has default) | public | Must match Google Cloud Authorized redirect URI. Default: `https://www.never86.ai/api/papers/google/callback` |
| `NEXT_PUBLIC_SITE_URL` | No (has default) | public | Post-OAuth return host. Default: `https://www.never86.ai` |
| `DATABASE_URL` | Recommended | secret | Persists refresh tokens across Vercel isolates. Missing → Connect can work in-memory only and may look Missing on the next request |
| `ANTHROPIC_API_KEY` | No | secret | Not used to invent invoice $. SKU lines come from native PDF/CSV parse + `/try` formulas |

There is no `PAPERS_ENABLED` flag. Missing client id or secret fail-closes Connect, pull, folders POST, and invoices GET/POST with HTTP **503** `papers_google_closed`, honesty **Missing**, and `requiredEnv: ["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"]`. `envChecklist` lists presence only — never values.

`GET /api/papers/status` always returns `missingSecrets`, `requiredEnv`, `redirectUri`, and `envChecklist` (booleans). UI shows the exact names. Buttons stay disabled until both secrets exist.

## Google Cloud Console (Myke Yes)

1. APIs & Services → enable **Gmail API** and **Google Drive API**.
2. OAuth consent screen → External or Internal. App name Never 86'd. Scopes below.
3. Credentials → OAuth 2.0 Client → **Web application**.
4. Authorized JavaScript origins:
   - `https://www.never86.ai`
   - `https://never86.ai`
5. Authorized redirect URIs:
   - `https://www.never86.ai/api/papers/google/callback`
   - `http://localhost:3000/api/papers/google/callback` (local only)
6. Paste client id + secret into Vercel. Redeploy Production.

## Scopes (minimal)

- `openid` `email`
- `gmail.readonly` — last-week invoice / EOD / labor attachments
- `drive.readonly` — find existing operator folders and files
- `drive.file` — create **Never86 Papers / Invoices / Z-EOD / Labor / Liquor-Beer** if they are not already there

Readonly still auto-detects folders named Invoices, Z-EOD, Labor, Liquor-Beer (and common aliases). Create stays off without `drive.file`.

## Operator path

1. `/onboard` email + store → Connect Gmail + Drive
2. `/operator#papers-settings` same Connect + **Pull last-week invoices**
3. Agents ingest via `POST /api/papers/pull` (honesty labels, no invented $)
4. `/try` → **Load from connected papers** → two-invoice SKU compare (`/api/one-seat/compare`)

Native PDF text / CSV first. Scanned empty PDF stays **Missing**. Unit $ become **Verified** only after two matching vendor+SKU papers compare. One invoice stays Missing — not $0.

Outlook is designed, not live.
