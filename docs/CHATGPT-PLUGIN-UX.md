# Never86 ChatGPT Plugin UX

## Decision

Use a native ChatGPT plugin built on MCP Apps. Do not make Lovable the primary operator surface.

Lovable can still be useful for rapid standalone web prototypes, but it adds a second front-end product surface when Never86 already has a web codebase. The highest-leverage UX is to let the operator stay in ChatGPT while Never86 supplies structured tools, evidence, and an inline operator card.

## Experience thesis

Restaurant operators do not need a fourth dashboard. They need a decision loop.

The UI should compress the operating question into:

**Find the leak -> assign the fix -> keep the receipt.**

The default interaction is Action Shift:

**Yesterday -> one action -> night proof.**

## Inline card anatomy

1. Context: business date and tenant-safe location alias.
2. KPI strip: only the metrics needed to understand the decision.
3. Leak found: ranked issue, estimated impact, and confidence.
4. Do this now: one action, owner role, due window, proof requirement.
5. Receipts and proof: source chain and verification status.
6. Why it was flagged: current signal vs baseline.
7. Conversation handoff: ask ChatGPT to explain, draft the vendor conversation, or challenge the recommendation.

## In-card drill-ins

The card stays mounted while the user changes between:

- Action Shift
- Vendor Drift
- Item Trace
- Inventory Risk

These controls call read-only MCP data tools directly with `tools/call`. They do not cause a new widget to be mounted.

## Tool architecture

### Data tools

Data tools are small and reusable. They return structured content and no UI template.

### Render tool

`render_operator_console` is the only tool associated with the UI resource. The model should call the relevant data tool first, inspect/refine the result, then render it.

### Later authenticated tools

Private data tools should be introduced only after OAuth and tenant authorization exist. Write tools should be separate from reads and should make consequences explicit.

Candidate authenticated read tools:

- `get_action_shift`
- `get_vendor_drift`
- `get_item_trace`
- `get_inventory_risk`
- `get_evidence_receipt`

Candidate write tools after authorization/confirmation design:

- `assign_operator_action`
- `attach_proof`
- `mark_variance_reviewed`
- `update_order_quantity`

Do not implement these as unauthenticated public tools.

## Canonical data contract

The plugin should eventually read normalized facts through a server-side provider, not directly from spreadsheets or the UI.

Key crosswalk:

`POS item -> Never86 item -> recipe -> ingredient -> inventory item -> vendor SKU -> vendor -> invoice evidence`

Core domains needed for the first production Action Shift:

- sales / Z report
- labor
- invoices and invoice lines
- inventory and counts
- vendor SKU crosswalk
- recipes / recipe lines
- voids, comps and discounts
- evidence references
- actions and proof

## Privacy model

The public repository contains no private restaurant records.

For production:

- Google Drive can remain raw evidence.
- The canonical database supplies normalized facts.
- GitHub supplies logic and schemas.
- The MCP server is the authorization and tool boundary.
- ChatGPT is the conversational intelligence and UI host.

Private reads and every write must be authorized server-side.

## Deployment sequence

1. Validate this branch locally with TypeScript checks and MCP Inspector.
2. Connect through ChatGPT Developer mode with a development HTTPS endpoint.
3. Test direct, indirect, invalid-input, and out-of-scope prompts.
4. Prove the git repository/deployment that owns the production Never86 MCP endpoint.
5. Implement OAuth and tenant mapping.
6. Replace the demo provider with the authenticated canonical-data provider.
7. Add production logs, rate limits, error handling, and privacy review.
8. Only then merge/deploy and prepare for plugin submission.

## Non-goals for v1

- No private tenant data in the public repository.
- No fake live-data claims.
- No autonomous email/posting.
- No unauthenticated writes.
- No separate Lovable dashboard.
- No new Never86 repository.
