# Operator launch review — September 9, 2026

Scope: current main-derived build plus PR 252. This is a source-code and local-test review, not a production penetration test or a measured operator trial.

## Scorecard

Judgment scores, not measured conversion rates. Overall launch readiness: 4/10. Do not average away missing authentication/data verification or the absent conversational model.

| Area | Score / 10 | Evidence |
|---|---:|---|
| Operator problem and focused starting jobs | 8 | Invoice, labor, handoff choices now prepare a question. |
| Landing page and desktop UX | 6 | Improved copy and browser-checked interaction; mobile and outside-operator testing pending. |
| Evidence and restaurant isolation | 5 | Selected membership fix and source-scoped parsers tested; production access and full permission review pending. |
| Ten-minute useful result | 3 | No observed completion cohort. Upload receipt is not a financial result. |
| Conversational AI in this desk | 2 | api/ask -> SimpleOwnerDemoService -> composeAskAnswer is deterministic. No LLM call in that path. |
| Continuous learning | 1 | Feedback/memory schema exists elsewhere, but no read/write loop connects it to this desk. |
| Scale readiness | 3 | Synchronous parsing, repeated schema setup and full upload scans; quotas, durable jobs and recovery need work. |

## Changes made during review

- Dependency lock updated: Next 16.3.1 -> 16.3.4 and compatible dependency patches. Production npm audit reports zero findings at review time. Four moderate development-only transitive findings remain under drizzle-kit; do not accept npm's proposed breaking downgrade blindly.
- Production demo signing fails closed without configured secrets. Development fallback cannot verify a production demo cookie.
- Production cannot use volatile in-memory storage while claiming persistence.
- Request body is bounded while streaming: upload 24 MiB including multipart overhead; ask 64 KiB. Upload batches reject more than 12 files or any file above 8 MiB before storage. Question text capped at 8,000 characters before repository work.
- Upload collection no longer silently truncates the batch. The UI names partial failures and preserves the operator's chosen question after upload.
- CI now checks production dependency advisories at high severity and above. No automatic dependency merge.

These changes do not provide distributed rate limiting or monthly quotas, malware scanning, image OCR, account provisioning, a model integration, or a complete security audit. They are not live until deployed.

## Build next, before outside operators

1. Connect one conversational model through Responses with streamed text and typed tool calls. Server-side tools own tenant selection, arithmetic and permissions. The model explains evidence and asks the next useful question. Do not pass provider credentials or accept tenant IDs selected by model output.
2. Separate file states: received, processing, needs review, usable, failed. A photograph filed under Schedule is not parsed schedule evidence. Add OCR/vision with source location, date, currency, unit and confidence, then operator confirmation for ambiguous fields.
3. Save originals in private R2, parsed records in Neon, and processing work in a durable queue. Use content hashes and idempotency keys, bounded retries, dead-letter handling and visible progress. Parse once, retrieve relevant records; do not download and scan every historical file for every ask. Move recurring DDL out of the request path.
4. Add per-workspace processing budgets, request limits, token accounting and latency traces. Avoid private document text in analytics. Test restore, deletion, export, invitations and revoked access.
5. Wire the authenticated ChatGPT tool surface to the same workspace service. The existing public api/mcp explicitly does not read tenant records. Do not confuse its availability with a functioning private restaurant plugin.

## Learning that improves rather than amplifies mistakes

Two separate loops:

- Restaurant memory: proposed fact -> operator confirmation -> versioned fact scoped to restaurant and source -> retrieval on the next relevant question. Track actor, source, effective dates, expiry and superseded version. Examples: vendor delivery day, approved SKU alias, week boundary, pack size. Corrections override older confirmed versions, while conflicting evidence asks for review. No automatic cross-restaurant reuse.
- Product improvement: consented/redacted failures -> human-reviewed expected answers -> held-out evaluation set -> candidate prompt/model -> compare accuracy, latency and cost -> controlled release and rollback. Never train on the model's own unverified answers as truth. A thumbs-up does not certify accounting accuracy.

No fine-tuning, model training or complete memory loop was run or installed in this review.

## Technology decisions

- Keep Next, Neon and private R2. No platform rewrite justified by current evidence.
- Benchmark GPT-5.6 Terra for the default conversational job, Luna for simpler high-volume work, Astra for difficult exceptions. These are candidates, not measured winners. Choose by correct first result, latency and cost on restaurant fixtures; keep model selection configurable.
- Use schema-constrained extraction and deterministic calculations. Structured output can constrain shape, not guarantee a correct number.
- Use Promptfoo/local versioned evaluations rather than starting a new dependency on the hosted OpenAI Evals dashboard/API. Keep prompts in Git.
- Use one durable job system; Cloudflare Queues is a candidate alongside the existing R2 footprint. Verify hosting fit before provisioning. Do not add a swarm or multiple agent frameworks to a one-question interaction.
- Defer a separate vector database, model training, broad mailbox crawls and automatic model upgrades. Start with scoped structured queries and searchable approved documents.

Sources checked: [models](https://developers.openai.com/api/docs/models), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [retrieval](https://developers.openai.com/api/docs/guides/retrieval), [Queues](https://developers.cloudflare.com/queues/), [Promptfoo migration](https://developers.openai.com/cookbook/examples/evaluation/moving-from-openai-evals-to-promptfoo).

OpenAI's [deprecation page](https://developers.openai.com/api/docs/deprecations) schedules Evals dashboard/API shutdown for November 30, 2026 and restricts self-serve fine-tuning access. Do not assume this organization is eligible to create training jobs.

## Public restaurant filings

Use filings as a separate, cited research library, not as the truth for an independent restaurant's books. Brinker FY2026 reports brand segments including company-operated sales, franchise revenue and allocated costs; those definitions do not equal an individual kitchen's P&L. Capture issuer, filing date, fiscal period, brand, ownership model, metric definition, denominator and source section. Avoid direct peer claims without comparability checks.

The reports can help teach terminology, financial statement navigation and questions to ask. They cannot provide a small operator's actual invoices, worked hours, waste or corrected pack sizes. Public accessibility also is not a blanket license to redistribute every embedded document or train on any content without checking applicable rights and provider terms.

Start prelaunch preparation with approved SOPs, invented fixtures clearly labeled synthetic, redacted permissioned documents and holdout cases from different restaurants. Do not fine-tune by dumping PDFs into a model.

Primary example: [Brinker FY2026 Form 10-K, segment reporting](https://www.sec.gov/Archives/edgar/data/703351/000070335126000029/eat-20260624.htm).

## Ten-minute acceptance test

Timer begins before sign-in. Operator chooses one job, supplies available evidence, sees a correct source-backed result, confirms one next action and can reopen it. Test wrong date, unreadable photo, duplicate invoice, changing pack size, overnight clock entry, partial upload, disconnected Drive, prompt injection in a document and access to another restaurant.

Proposed pilot gate: 16 of 20 outside operators complete unaided in ten minutes; zero cross-restaurant disclosures or invented financial facts in the tested cases. Track abandonment, corrections, next-week return, cost per useful result and support minutes. This gate has not been achieved.
