# Never 86'd email delivery — receipt

**Promise:** Find the leak. Assign the fix. Keep the receipt.

## Leak (2026-09-05)

| Fact | Evidence |
|---|---|
| Domain `never86.ai` is verified on Resend (DKIM + SPF + receiving MX) | Resend domain `841f55af-a73d-43d2-91f8-3675aeb0b3c9` |
| `myke@n86.app` is **bounce-suppressed** since 2026-07-25 | Resend suppression `019f96c9-6361-73c9-a63a-eabaadb062d3` (origin: bounce) |
| Daily briefs Aug 7–16 all went to `myke@n86.app` → **status: suppressed**, **0 delivered** | Resend `list-emails` + metrics |
| Those briefs were sent by **Supabase Edge** (`n86-daily-brief` key), not Vercel | Resend API logs User-Agent `SupabaseEdgeRuntime` |
| Outbound from `hello@never86.ai` to Gmail + `myke@never86.ai` **delivers** | Probe `21200c70-e165-44de-a96a-14ef6c6db0a2` (delivered 2026-09-05) |

## Fix (this PR)

1. `getOwnerEmail()` rejects the retired `myke@n86.app` address (case-insensitive).
2. `/api/briefing` uses `getOwnerEmail()` — never the suppressed default.
3. Public mailto / contact copy → `myke@never86.ai` (Resend inbound MX).
4. `.env.example` + `DEPLOY.md` + keys map tell operators not to set `OWNER_EMAIL=myke@n86.app`.
5. `/api/onboard/request` logs Resend message id or error name (no tokens in logs).

## Assign

| Owner | Action |
|---|---|
| Myke | Set Vercel Production `OWNER_EMAIL=mykemueller1@gmail.com` (or `myke@never86.ai`). Confirm the key is `never86-vercel` on the **same** Resend account that owns `never86.ai`. |
| Myke | Point Supabase daily-brief cron at the same deliverable inbox — stop sending to `myke@n86.app`. |
| Myke | Do **not** clear the `myke@n86.app` suppression until that Outlook mailbox accepts SES mail again (or leave it retired). |
| Agent | Code + public contact cutover (this branch). |

## Do not

- Auto-mail vendors or staff.
- Put CTap private numbers / PINs / staff names in mail.
- Treat `$0` audit variance as a bug.
- Start a fourth Never86 repo.
