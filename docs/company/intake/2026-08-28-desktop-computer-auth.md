# Intake — Desktop / Chrome / app standing order

**From:** Cursor cloud agent `bc-9181f277-5c45-43ff-af9a-1c898c9bdcde` (App and account setup)  
**Status:** done  
**For HQ:** Grok command hub `Cursor agents: You talk, I run`

## What I found (5 bullets max)

- At 8:35 PM CT on 28 Aug, Myke authorized workers to use connected apps, tools, Google Chrome, and desktop computer control whenever a real Never86 job needs them, and to tell him the exact click instead of stalling.
- This worker is a **cloud agent**, not Myke's Mac. It cannot take over local Chrome, accessibility, or type passwords/2FA/CAPTCHA. Grok Bot Agent Computer is the Chrome/login surface; Cursor desktop MCP Connect is the Gmail/Calendar/X surface.
- This run verified: Google Drive, Mobbin, Render, Supabase **ready**. Gmail, Google Calendar, X **needsAuth**. Apollo **needsAuth and banned**. Public Never86 MCP answers at `https://www.never86.ai/api/mcp`. No browser/computer-use tools were present.
- Drive HQ doc `1Q80SjIgf8HFF522lYT0h3c6MMpT6lVexqx-Z8F574O4` was not found on the connected Drive account. No accounts were created. No sends, posts, or CRM writes.
- Earlier 24 Aug “no Mac takeover” note is superseded for **authorized job surfaces**. Password/2FA/CAPTCHA still belong to Myke. Facebook stays deferred.

## Files created/changed

- this intake
- `docs/company/intake/INBOX.md`
- `docs/company/intake/CHATGPT_HANDOFF.md`
- `docs/company/intake/GROK_HANDOFF.md`
- `docs/company/AGENT_HQ.md`
- `docs/company/ONE_SPOT.md`
- `.cursor/rules/one-spot-hq.mdc`
- `.cursor/rules/agent-hq-intake.mdc`

## Open loops for Myke

- Cursor desktop → Settings → MCP → **Connect** Gmail, Google Calendar, and X. Do not connect Apollo.
- When a Grok Bot stops at login, take over Agent Computer, enter password/2FA/CAPTCHA yourself, then return control.
- If a site blocks the Grok Bot cloud address, use Bot **Settings → Beta** egress through this Mac. Do not Reset Agent Computer unless Update failed.

## Do NOT do from cloud

- Take over Myke's local Chrome / Accessibility from a cloud agent
- Type passwords, 2FA, passkeys, or CAPTCHAs
- Create random accounts with no owned job
- Send email, post, DM, spend, merge/deploy, or write CRM
- Use Apollo or request marketplace portal credentials
