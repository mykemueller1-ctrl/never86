# Private Grok → Cursor Cloud Agents bridge

This bridge is separate from the public read-only Never86 MCP.

## Endpoint

`https://www.never86.ai/api/orchestrator/mcp`

The endpoint fails closed unless either the private OAuth connector or the legacy bearer token is configured. Grok Web uses OAuth 2.1 authorization-code flow with PKCE and a confidential client secret; direct maintenance checks may use `NEVER86_ORCHESTRATOR_TOKEN`. Never put an OAuth secret, access token, legacy token, or Cursor API key in Git, a prompt, a handoff, or a public connector.

## Required secret configuration

- `NEVER86_ORCHESTRATOR_TOKEN` — private bearer token used only by Myke's Grok connector
- `NEVER86_OAUTH_CLIENT_ID` — fixed private Grok client ID; defaults to `grok-never86-cursor`
- `NEVER86_OAUTH_CLIENT_SECRET` — high-entropy secret used to authenticate Grok and sign short-lived OAuth artifacts
- `CURSOR_API_KEY` — Cursor user/service-account API key with access to the Never86 repository
- `CURSOR_AUTONOMOUS_DISPATCH_ENABLED` — leave unset/false until Myke reviews spend and repository access; set exactly `true` to enable launch
- `CURSOR_ALLOWED_STARTING_REFS` — comma-separated branch allowlist; defaults to `codex/action-shift-122-safe`
- `CURSOR_REPO_URL` — optional repository override; defaults to the canonical Never86 GitHub repository
- `CURSOR_MAX_ACTIVE_AGENTS` — active-agent cap, default 4, hard maximum 16

## Exposed tools

- `cursor_list_agents` — read-only worker inventory
- `cursor_get_agent` — read-only latest-run evidence
- `cursor_prepare_dispatch` — validates and previews a job without spending
- `cursor_launch_agent` — idempotent launch on a new Cursor branch, optional PR, no merge/deploy tool

Every launch is tied to a stable `task_id`. Repeating the same task produces the same Cursor `agentId`, preventing duplicate swarms. The server checks the active-agent cap before launch. Repository URL and starting branches are server-controlled/allowlisted rather than supplied freely by Grok.

## Rollout gate

1. Deploy with launch disabled.
2. Add the private endpoint to Grok using the private OAuth client, authorization endpoint `/api/orchestrator/oauth/authorize`, and token endpoint `/api/orchestrator/oauth/token`.
3. Verify `initialize`, `tools/list`, `cursor_list_agents`, and `cursor_prepare_dispatch`.
4. Set Cursor's account/team spend cap and confirm GitHub repository permissions.
5. Enable autonomous dispatch with a maximum of one active agent for the first live test.
6. Launch one harmless documentation/test task from Grok.
7. Verify agent, run, branch, tests, push, and PR evidence through `cursor_get_agent`.
8. Raise the active cap only after Codex watchtower confirms the first two different tasks completed without duplicate or private-data drift.

There are deliberately no cancel, archive, delete, merge, deployment, CRM, email, or social-send tools in this bridge.
