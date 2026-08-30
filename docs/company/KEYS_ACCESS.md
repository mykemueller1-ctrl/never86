# Keys access — xAI / Grok and Never86 factory

**Task:** `keys-access-env-v1`  
**State:** catalog + probes **tested** on this branch. Production secrets were **not** written. No key was invented, rotated, or pasted.

Command-center workers authenticate two different ways. Do not mix them.

| Surface | Auth | Needs `XAI_API_KEY`? |
|---|---|---|
| Public operator MCP `https://www.never86.ai/api/mcp` | None (read-only) | No |
| Private Grok → Cursor factory `https://www.never86.ai/api/orchestrator/mcp` | OAuth 2.1 / PKCE or legacy bearer | No |
| xAI Grok **model** API `https://api.x.ai/v1` | `Authorization: Bearer $XAI_API_KEY` | Yes |
| Grok Bot desktop / Routines | xAI workspace login (human) | No — different product |

Grok Bot shareable templates copy prompts, not keys. Official xAI rule: strip API keys, internal URLs, and customer data before sharing.

## Honest status (this factory worker)

| Check | State |
|---|---|
| Public operator MCP | **live-verified** — `initialize` + `tools/list` HTTP 200, server `never86`, **16** tools |
| Private factory MCP without credentials | **fail-closed** — HTTP 401, no tools leaked |
| `XAI_API_KEY` in this Cursor cloud worker | **absent** — xAI `GET /v1/models` not attempted; status `not-configured` |
| Vercel `never86` env names | **not readable** from this worker's Vercel MCP (only the unrelated `compass` project is visible) |
| `grok-shareable-86-swarm` (`bc-ee4c1774`) | Authenticates to public MCP with no xAI key. Draft API notes live on PR `#172`. Not merged. |
| Production env / deploy | **not changed** |

## Where secrets live

Put real values only in approved secret storage:

1. **Vercel → Project `never86` → Settings → Environment Variables** (encrypted). Production / preview / development as needed.
2. **Local** `.env.local` (gitignored). Copy names from `.env.example`.
3. **xAI console** for creating or rotating `XAI_API_KEY`.
4. **Cursor desktop → Settings → MCP → Connect** for Gmail / Calendar / X. Cloud agents cannot finish those OAuth clicks.

Never put a live value in Git, a PR, a shareable Grok Bot, `CHATGPT_HANDOFF.md`, or chat.

## xAI / Grok model API

Official env name is `XAI_API_KEY` ([xAI quickstart](https://docs.x.ai/developers/quickstart)).

```bash
# local only — never commit
export XAI_API_KEY="paste-from-console"
# optional
export XAI_API_BASE="https://api.x.ai/v1"
npm run keys:probe
```

The probe calls `GET /v1/models` only. It does not send a chat completion and does not spend a generation. A 200 with a model list is `live-verified`. Missing key is `not-configured`. 401/403 is `unauthorized` — rotate only with new evidence.

Factory workers that only call public MCP do **not** need this key. Add it when a job must call the Grok model API from the app or a script.

## Grok command hub and Cursor workers

Already documented in `docs/company/GROK_CURSOR_DISPATCH.md` and `docs/company/GROK_SETUP.md`.

Required for the **private** factory (Vercel, not Git):

- `NEVER86_OAUTH_CLIENT_SECRET`
- `CURSOR_API_KEY`
- Optional: `NEVER86_ORCHESTRATOR_TOKEN`, `NEVER86_OAUTH_CLIENT_ID` (defaults to `grok-never86-cursor`)
- Flags: `CURSOR_AUTONOMOUS_DISPATCH_ENABLED`, `CURSOR_ALLOWED_STARTING_REFS`, `CURSOR_MAX_ACTIVE_AGENTS`

This worker does not receive those values. That is correct. The Grok hub already launched this job through the live connector.

Canonical Cursor MCP file: `.cursor/mcp.json` → `never86-operator-system` → public MCP URL. No secret.

## Related app secrets (placeholders only)

See `.env.example`. Names used by the site:

- `DATABASE_URL` · `OPS_DATABASE_URL` · `ANTHROPIC_API_KEY` · `RESEND_API_KEY` · `CRON_SECRET` · `OWNER_EMAIL`
- Staff claim (fail-closed until Myke enables): `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `STAFF_SEAT_LOGIN_ENABLED`

Do not set `STAFF_SEAT_LOGIN_ENABLED=true` from a factory job. Do not apply Neon from here.

## Verification steps

1. `npm test -- src/lib/keysAccess.test.ts` — catalog, no-leak, mocked probes.
2. `npm run keys:probe` — live public MCP + fail-closed private MCP + xAI models if the key is present.
3. Confirm `.gitignore` includes `.env` and `.env*.local`.
4. Confirm `git grep` for `xai-` / `sk-ant-` live patterns returns only placeholders.
5. Human: if a job needs the Grok **model** API, paste `XAI_API_KEY` into Vercel or the local secret box, then re-run the probe. Do not paste it into chat.

## Next owner

Myke: store `XAI_API_KEY` in Vercel (and Cursor factory env if a worker must call the model API). Codex: confirm this PR does not claim production secret writes or a live xAI model login from a cloud worker that has no key.
