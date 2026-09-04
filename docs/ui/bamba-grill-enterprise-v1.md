# Bamba / Grill Enterprise UI v1

## Tenants
- **Bamba** (Lane C): 16 stores under John / Red / Travis / Yas. Big Excel drill-down: sales vs PY vs forecast, checks, catering, comps, voids, daypart, ticket times, p-mix.
- **The New American Grill**: single-store Toast close. Small-operator base seat. Cash short $242.83 is a till question, not a sales miss.

## Memory
- Zep (Graphiti) shared temporal store. Validity windows on facts.
- agentmemory MCP for coding agents (Cursor + Grok swarm).
- Hard tenant isolation: Bamba memory never leaks to Grill.

## Image task
Generate ONE hero mockup with Grok Imagine Image 2.0:

> Dark-mode enterprise ops dashboard, split view. Left: Bamba 16-store grid, red void alert on Landmark, green catering win on Herndon. Right: The New American Grill single-store Toast close card, cash shortage flagged. Top bar: operator selector Bamba / Grill. Clean, dense, no clutter. 16:9, 2K.

Save to `public/ui-mockups/hero-bamba-grill-v1.png`.

## Acceptance
- Builds on branch `ui/bamba-grill-enterprise-v1`
- Image committed
- No tenant bleed
- PR opened
