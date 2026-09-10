# Operator knowledge that earns trust

Research snapshot: September 9, 2026. This is an implementation brief and research record. The source catalog and evaluation cases are authored; retrieval and model evaluation are not connected to the running app.

## Decision

Build a large, maintained reference library and bring the relevant evidence into each answer. A model's context window has a fixed capacity. Reading more websites does not increase that capacity, train the model, create permanent memory or establish an 80% probability of correctness. Earlier long context research found that evidence position and task complexity can affect results. Those studies support testing our chosen model; they do not supply an accuracy forecast for Never86'd. [Lost in the Middle](https://arxiv.org/abs/2307.03172), [RULER](https://arxiv.org/abs/2404.06654)

The first result should answer one practical question, show the evidence and make the next step easy. Breadth matters behind the scenes; the operator should not have to learn our integrations before getting help.

## Three evidence collections

| Collection | Purpose | Authority boundary |
|---|---|---|
| Operator research | Understand the words, friction and questions of owners, managers and employees. Include successful workflows and counterexamples. | A complaint is a reported experience. It cannot establish an industry rate, accounting definition or another restaurant's condition. |
| Vendor reference | Interpret a named product, edition, version and report. Keep official documentation, source dates and test fixtures. | Documentation can be old or configuration dependent. A vendor name alone cannot select a calculation. |
| Restaurant records and approved rules | Answer questions about this location using its invoices, counts, sales, schedules and confirmed practices. | Tenant membership, source completeness, covered dates and units must be checked before using the data. |

Google, Yelp and Tripadvisor reviews predominantly describe diner experiences. They can suggest a service issue to investigate; they do not explain a restaurant's labor cost, void logic or employee responsibility.

## Research findings so far

The browser visit to Reddit encountered a human verification screen. Publicly indexed pages were consulted through search; no verification was bypassed and no bulk review corpus was collected. These are selected examples, not a representative survey.

| Observed topic | Product inference to test | Public research reference |
|---|---|---|
| Inventory work competes with limited management time | Ask for the smallest useful input, and show which additional input would improve the answer. | [Inventory administration discussion](https://www.reddit.com/r/restaurantowners/comments/1vtln00/inventory_and_administration_cost_v_benefit/) |
| Reports can be difficult to interpret; experiences vary by operator | Use familiar job names and explain one number with its source. Include positive experiences when selecting interview participants. | [Reporting discussion](https://www.reddit.com/r/restaurantowners/comments/1o0cfbe) |
| Food cost explanations can include inconsistent arithmetic | Use reviewed formulas and reproducible calculations; do not adopt a popular comment as a rule. | [Food cost discussion](https://www.reddit.com/r/restaurantowners/comments/1gv5dwq) |
| Void comments may be incomplete | Show missing reasons and distinguish the check owner from the person who changed it. | [Void comments discussion](https://www.reddit.com/r/ToastPOS/comments/1tpqn1u/void_comments/) |
| Late schedule publication creates uncertainty | Show the schedule version and publication time, then clarify who approved a change. | [Scheduling notice discussion](https://www.reddit.com/r/KitchenConfidential/comments/1uvs4pp/scheduling_how_much_notice_is_enough_for_making/) |
| Unit confusion can undermine costing | Normalize pack, weight and volume explicitly; show when products cannot be compared. | [Costing discussion](https://www.reddit.com/r/restaurantowners/comments/hjofcd) |

Research notes should paraphrase the problem and retain a source link. Do not preserve a user's identity merely to improve model answers. Review complaints, neutral reports and examples of things working well across roles and restaurant types. Do not equate search ranking or comment votes with prevalence.

## What the vendor research changes

Existing products already provide cost fluctuation, scheduled versus actual labor, and actual versus theoretical inventory reports. Never86'd should not claim those calculations are new. The hypothesis is that simpler intake, clearer explanations and a completed follow up can reach operators who are not getting value from their current tools. [xtraCHEF reports](https://support.toasttab.com/en/article/xtraCHEF-Reports-Cost-Management), [7shifts variance](https://kb.7shifts.com/hc/en-us/articles/4417513558675-Variance-Report), [WISK variance](https://help.wisk.ai/en/articles/3859570-variance-report)

A missing invoice, bad inventory count, missing sales or incorrect recipe mapping can create apparent beverage variance. Investigate those causes before drawing conclusions about loss. A variance cannot, by itself, identify theft or the responsible employee. [WISK troubleshooting](https://help.wisk.ai/en/articles/3286787-why-is-my-variance-so-large)

## Answer workflow to implement

1. Resolve the authenticated restaurant and the question. Keep permissions in server code, outside model control.
2. Identify available files, date range, report family, source version and missing inputs. Extract text from digital files first; use OCR for images and scanned pages. Preserve originals, page or row references and uncertain fields for review.
3. Retrieve authorized restaurant evidence and relevant vendor definitions. Use lexical search for exact SKUs and report fields, with semantic search for natural language. Filter by tenant and source scope before ranking.
4. Check input completeness and units, then execute a versioned calculation. The model explains the result; arithmetic, deduplication and financial classifications belong in tested code.
5. Present the finding, source, limitation and one next action. Ask for one missing item when it would change the conclusion. Permit a correct no-finding result.
6. Store the operator's correction as a proposed, dated change. Require the appropriate person to confirm operating rules. Preserve the original and make changes reversible. A correction in one restaurant never becomes another restaurant's fact.

Treat retrieved pages, PDFs, comments and OCR text as untrusted data. Instructions embedded in them must not change permissions, send messages, overwrite rules or redirect data to another account.

Use the existing database and private object storage before adding another vendor. Maintain a source record with owner, tenant or public scope, URL/file identity, content hash, retrieved time, effective dates, product/version, report type, geography, units, permitted uses, review state and deletion status. Index document sections and table rows with references back to the original. Add vector search only after a retrieval comparison demonstrates value over the simpler baseline.

## Review content access

Public visibility does not establish permission to copy an entire service into a commercial knowledge base. Rights for display, storage, indexing, inference and training are separate questions. The following is an engineering access decision based on published terms, not a legal determination for every jurisdiction.

- Reddit's Data API terms require a separate agreement for commercial purposes and do not grant general model training rights in user content. Do not start a commercial Reddit ingestion job on the basis of public access. [Reddit terms](https://redditinc.com/policies/data-api-terms)
- Google Places has caching and attribution restrictions. Keep any permitted Places use within its service terms; do not assume a permanent review index is allowed. [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- Tripadvisor's published Content API caching policy permits retaining Location IDs and prohibits storing or indexing other returned attributes. A persistent review index would need additional permission. [Tripadvisor policy](https://tripadvisor-content-api.readme.io/reference/caching-policy)
- Yelp's API terms restrict use of its content for generative AI development and training. Confirm the intended use with the provider before implementing a connector that retains or processes reviews this way. [Yelp API terms](https://terms.yelp.com/developers/api_terms/20250909_en_us/)

No review scraping connector, license agreement or training run has been created. Start the product library with material we own or have permission to use, official references used within their terms, and operator supplied records under an explicit service agreement. Reading another vendor's documentation does not authorize its API or expose a customer's account data.

## Measuring whether answers are right

The starter file in `evals/operator-knowledge/cases.v1.json` contains original synthetic cases and expected behavior. It is a review checklist, not a scored model run. No accuracy percentage is available yet.

Before a pilot, expand to at least 100 reviewed cases across the first supported report families. Keep development examples separate from an unseen evaluation set. Split real examples by restaurant and period so similar documents do not appear on both sides. Compare a baseline prompt, filtered retrieval and broader context on the same set, with the same model and configuration. Record both median and slow-session latency plus cost.

Measure these separately:

- Correctness among attempted answers, including the calculation and cited evidence.
- Coverage: how often the system can answer, needs another file or correctly declines to infer.
- Unsupported claims, wrong source selection, tenant access failures and stale definitions.
- Extraction accuracy for consequential fields, not only whole-document text similarity.
- Time to the first correct useful result, operator corrections, action completion and return use.

An 80% result on one test set is not an 80% probability for every answer. Critical errors need case review even if the average is high. Tenant leakage, fabricated evidence and incorrect financial arithmetic block release. A language model must not grade itself as the sole judge of its own answer.

## First ten minute experiment

Proposed timing is a design target, not a measured result:

- Minute 0–1: Choose the job in ordinary language: invoice cost, extra hours, void review, drink cost or next shift.
- Minute 1–3: Bring the minimum useful record. For price drift, obtain two comparable prices; for pour cost, obtain cost, bottle size and pour.
- Minute 3–6: Confirm consequential readings and show one result or the exact missing item.
- Minute 6–8: Explain the number in the operator's terms and link its source.
- Minute 8–10: Save one next step, then explain why an optional connection would save work next week.

Ask for a Drive or OneDrive connection only when its purpose is clear. Let the operator select permitted folders, review sync scope and revoke access. A permission screen should explain the benefit and scope plainly; growth must not depend on misleading someone into uploading more.

The local review currently demonstrates source viewing, selected workflow rules, keyword search, draft handoff and a pour calculator. It does not yet implement this ingestion, retrieval, evaluation or learning workflow.
