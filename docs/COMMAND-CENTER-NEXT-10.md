# Never86 Command Center — Next 10 Moves

**Status:** ~40% to governed, human-in-the-loop orchestration.
**Goal:** Wire the existing agents, skills, knowledge, and truth gates into a runnable command center that delegates correctly between swarms, specialists, and human execution.
**Owner:** Myke Mueller (Founder Chief of Staff routes everything).
**Date:** 2026-08-30

## The 10 Moves

1. **Merge and stabilize the command-center swarm PR**  
   Land the CSV-first draft (no external sends). Confirm it talks to Store Chief of Staff and company specialists without leaking private store data.

2. **Wire the deterministic backend**  
   One shared MCP/backend for all LLMs. Calculations, evidence states, memory rules, and approval gates live here — not in prompts.

3. **Implement the full capture-to-proof loop**  
   Capture → parse → truth-gate → normalize → decide → assign → approve → prove → learn → repeat. Every stage must emit evidence labels (Verified / Reconciled / Partial / Estimated / Unverified / Missing).

4. **Stand up store-scoped memory**  
   Version human-approved rules, owners, cadence, mappings, and exceptions. Never promote a store fact to a universal rule.

5. **Activate the six store specialists**  
   Store Chief of Staff, Source Collector, Margin Analyst, Operator Coach, Proof Verifier, Memory Curator. Each gets a clear job and handoff contract.

6. **Activate the company team**  
   Founder Chief of Staff, Product Researcher, Builder, Truth/QA Critic, GTM Operator. Route product, research, truth, and GTM work without mixing restaurant-private data.

7. **Build the morning / night / weekly routines**  
   Morning shift: one-line verdict, evidence status, one concept, ≤3 actions, one tribal question, approval checkpoint. Night close and weekly snapshot follow the same proof discipline.

8. **Enforce approval gates everywhere**  
   No external email, social post, DM, vendor request, or operational change without human approval. Read-only by default. Least privilege on tools.

9. **Add Truth/QA Critic as a hard gate**  
   Block unsupported math, fake integrations, and recovery claims before anything ships or publishes. Every LLM call must pass through it.

10. **Run the first real pilot end-to-end**  
    One store, one complete business day, real files. Measure: time-to-verdict, actions closed with proof, missing-evidence rate, and whether the fix held on the next comparable receipt.

## Success Criteria

- Operator gets a useful, evidence-labeled result in under 60 seconds.
- Every action names an owner, observed dollars, proof object, and claim boundary.
- No external side effect without approval.
- Memory only stores human-approved corrections with provenance.
- The system says "Missing Evidence" instead of guessing.

## Estimated Build Time

**3 to 5 weeks** of focused work for a runnable, governed command center on the current foundation.

- Weeks 1–2: Moves 1–4 (merge, backend, loop, memory).
- Week 3: Moves 5–7 (specialists + routines).
- Week 4: Moves 8–9 (gates + critic).
- Week 5: Move 10 (pilot) + hardening.

Assumes one primary builder plus swarm support, and that the existing operator system pack (v3.1) and DoorDash audit pilot remain the source of truth.

## Non-Goals (for now)

- Auto-sending anything.
- Multi-unit coordination.
- Paid seats or role-based billing UI.
- Native POS API collectors (manual upload / paste / photo / forwarded email is the launch path).

---
*This packet is the source of intent for the command-center swarm, Cursor agents, and human execution. Update it as evidence changes.*