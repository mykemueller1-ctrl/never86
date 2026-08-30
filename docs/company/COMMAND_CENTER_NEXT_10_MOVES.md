# Never86 Command Center — Next 10 Moves Packet

**Status:** Draft for Myke approval. Source-stamped. No external sends. No live merges without sign-off.
**Goal:** Move from ~40% (scaffolding + proven agents) to a governed, human-in-the-loop operator system that runs daily Action Shifts, audits, and multi-unit coordination without leaking private data or auto-sending.
**Current anchor:** PR #174 (command-center swarm v1, CSV-first), PR #173 (keys access), PR #172 (Grok shareable harness). Operator System v3.1 live on public MCP.

## The 10 Moves

1. **Merge + smoke PR #174 on a staging branch.** Run the 10 CSV workers + Action Shift end-to-end. Confirm truth gates and blocked-pending-approval hold. Owner: Builder. Evidence: green tests + one sample receipt.

2. **Wire the Founder Chief of Staff router.** Route store-team output to Sales/Marketing/GTM/Social/Audit/Product heads per company org. No auto-handoff past approval gates. Owner: Founder Chief of Staff + Builder.

3. **Add the second real store baseline.** Replace Sample Store One with one live operator's last four POS/Z, labor, invoice, and marketplace periods. Mark every field Partial/Missing until complete. Owner: Source Collector + Margin Analyst.

4. **Stand up the daily morning routine.** Prior-day Action Shift → one verdict → ≤3 actions → owner + proof. Night close updates state from proof only. Owner: Store Chief of Staff.

5. **Close the keys gap.** Place XAI_API_KEY in encrypted Vercel storage if model calls are required; re-run keys:probe. Never commit secrets. Owner: Myke (human) + Builder.

6. **Harden the approval loop.** Every external email, social post, DM, or recovery claim stays blocked-pending-approval until Myke signs. Add a single approval inbox surface. Owner: Truth/QA Critic + Social Publishing Queue.

7. **Expand memory curator.** Version store-specific rules (vendor cadence, owners, mappings) with provenance. Never promote one store's fact to universal. Owner: Memory Curator.

8. **Add vendor-silence + service-draft workers.** First 14 days advisory; duplicate vendor/day does not duplicate tickets. Drafts only, never send. Owner: Builder + Proof Verifier.

9. **Run the first real audit on a second operator.** Evidence gate → marketplace recon → operator receipt with VERIFIED/CALCULATED/MISSING labels. Owner: Audit Head.

10. **Ship the multi-unit desk (read-only).** Aggregate Action Shifts across stores without mixing private data. One founder approval packet per day. Owner: Founder Chief of Staff.

## Time Estimate
- Moves 1–3: 3–5 days of focused agent + human review.
- Moves 4–7: 1–2 weeks.
- Moves 8–10: 2–4 weeks depending on second-store data quality.
- **Ballpark to a runnable governed system: 3–6 weeks** at current pace, assuming Myke sleeps and signs off daily.

## Hard Boundaries (do not violate)
- No portal credentials requested.
- No auto-send, auto-post, refund, or payroll.
- No live migration or production deploy from draft PRs.
- Every dollar tagged VERIFIED / CALCULATED / MISSING.
- Brand name Never 86'd stays operator-facing only.

## Next Human Action
Myke: approve this packet or edit the moves. Then Builder starts move 1 on the swarm branch.
