# Never86'd Operator OS — ChatGPT plugin launch

## Product contract

- One restaurant location + one primary operator is the free launch path.
- Manual upload, paste, photo, and forwarded-email workflows deliver first value before integrations.
- Public MCP tools are read-only.
- Store-specific targets are used only when supplied or approved by the operator.
- Human approval is required before consequential external actions.

## Production endpoints

- Website: `https://www.never86.ai`
- Human-facing MCP install page: `https://www.never86.ai/mcp`
- Existing compatibility MCP: `https://www.never86.ai/api/mcp`
- ChatGPT submission MCP: `https://www.never86.ai/mcp/server`
- Domain challenge: `https://www.never86.ai/.well-known/openai-apps-challenge`
- Privacy: `https://www.never86.ai/privacy`
- Terms: `https://www.never86.ai/terms`
- Support: `https://www.never86.ai/support`

`/mcp/server` is the standards-facing stateless Streamable HTTP endpoint. It reuses the mature v3 business logic from `/api/mcp`, adds MCP protocol-version negotiation, Origin validation, correct notification acknowledgements, `ping`, and transport-appropriate GET/DELETE behavior. The existing human-facing `/mcp` page remains unchanged.

## ChatGPT developer-mode test

1. Deploy this branch to the production-capable Never86'd host or a stable HTTPS preview.
2. In ChatGPT, enable Developer Mode under **Settings → Apps & Connectors → Advanced settings**.
3. Create a new MCP app/connection using the deployed `/mcp/server` URL.
4. Refresh the connection after any MCP metadata change.
5. Run initialization and inspect the 13 advertised tools.
6. Call each high-value tool with valid and invalid inputs:
   - `get_operator_system`
   - `build_action_shift`
   - `calculate_3p_marketplace_cost`
   - `build_vendor_silence_ticket`
   - `get_operator_logic`
   - `search_answers`
7. Run the five positive and three negative review cases in `chatgpt-app-submission.json`.

Current OpenAI MCP guidance: <https://developers.openai.com/plugins/build/mcp-server>

## Domain verification

The repo includes a route at `/.well-known/openai-apps-challenge`.

When the OpenAI submission portal supplies the verification token:

1. Set production environment variable `OPENAI_APPS_CHALLENGE` to the exact token.
2. Deploy.
3. Confirm the challenge URL returns only that token as `text/plain`.
4. Complete domain verification in the OpenAI submission flow.

Do not commit the temporary challenge value into the repository.

## Plugin package

The repo includes:

- `.codex-plugin/plugin.json`
- `skills/operator-read/SKILL.md`
- `skills/operator-read/agents/openai.yaml`
- `skills/operator-read/references/operator-read-rules.md`
- `chatgpt-app-submission.json`

The source package deliberately does **not** include `.app.json` yet. ChatGPT creates the registered MCP connection technical ID (`plugin_asdk_app...`) during account-side connection setup; add that mapping only after the real ID exists.

## Submission form

Suggested review fields:

- Display name: `Never86'd Operator OS`
- Subtitle: `Restaurant operator OS`
- Category: `FOOD`
- Website: `https://www.never86.ai`
- MCP type: Universal
- MCP URL: `https://www.never86.ai/mcp/server`
- Support URL: `https://www.never86.ai/support`
- Privacy URL: `https://www.never86.ai/privacy`
- Terms URL: `https://www.never86.ai/terms`
- Support email: `myke@n86.app`

Import `chatgpt-app-submission.json` where the submission UI supports the Apps SDK review import format.

## Review warnings before submission

- All 13 tools explicitly advertise `readOnlyHint: true`, `openWorldHint: false`, and `destructiveHint: false` and their inspected implementations match those claims.
- Tool descriptors do not currently declare `outputSchema`. This is not a blocker for the review import, but adding accurate output schemas later will improve model reliability.
- The public tool schemas do not request credentials, MFA codes, SSNs, full bank details, PHI, or similar sensitive identifiers.
- There is no custom MCP UI/CSP in this release; the plugin is conversational + skill driven first.

## Release order

1. CI: lint + Vitest + Next production build.
2. Deploy a stable HTTPS build containing `/mcp/server`, trust pages, and domain challenge route.
3. Connect `/mcp/server` in ChatGPT Developer Mode and run the review cases.
4. Set the OpenAI domain challenge token and verify the domain.
5. Complete verified-publisher / Apps Management permissions in the OpenAI account if not already complete.
6. Submit for review.
7. Publish only after review approval.
