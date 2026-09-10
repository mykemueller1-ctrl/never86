# Claims and release checks

This file records the release owner’s verification of the public sample demo and keeps its claims separate from unfinished live restaurant features. The marketing author incorporated the evidence supplied by the release owner.

## Claim register

| Claim | Current basis | Copy decision |
| --- | --- | --- |
| Never86’d is being built for operators wearing too many hats. | User’s stated scope. | Use as positioning. |
| First location and first seat free; extra manager seats paid. | User’s stated intended offer. | Say “planned offer” or “building toward” until live provisioning and terms work. |
| One useful answer in ten minutes. | Product goal. No completed operator study supplied. | State as a goal. Do not say proven, guaranteed or already achieved. |
| Sample Hilltop invoices compare $72 and $78 for the same 30 lb case. | Canonical synthetic example checked in the deployed browser. | Use as a sample price comparison. A price difference is not money saved. |
| Sample Lakefront order is $6 higher after its $12 delivery fee, despite $6 less in cheese. | Need 60 usable lb at 100% sample yield: $156 versus $150 + $12. | Label fictional; no confirmed savings or invoice error. |
| Sample shift is two hours longer. | Scheduled 16:00–22:00 versus actual 16:00–00:00 next day, equal break assumption. | Use only with dates and same assumptions. No wage means no dollar claim. |
| Sample spirit pour costs $1.48. | $25 × 1.5 × 29.5735295625 ÷ 750 = $1.478676478125, rounded. | State spirit cost only. Ingredients and waste add cost. |
| Source records stay next to the answer. | Sample source controls checked in the deployed browser. | Describe the sample record and its result. |
| The handoff is a draft. | Draft behavior checked in the deployed browser. No message sending or live assignment. | Keep the draft label and explicit scope. |
| Live AI, photo reading and connections are incomplete. | Current project status supplied to this task. | Disclose in launch text and demo. Recheck when release scope changes. |
| Listed in ChatGPT’s store or endorsed by OpenAI. | No supporting evidence. | Do not claim. |
| 80% correct answers from a wider context window. | No evaluation result. | Do not claim. |
| Proven customer savings, theft identified or 100,000 users. | No supporting evidence for this release. | Do not claim. |

## Final release evidence

Verified against the updated public vendor demo on September 9, 2026 Central time:

| Evidence | Result |
| --- | --- |
| Public URL | https://never86-bnt24t594-myke-muellers-projects.vercel.app/demo/operator |
| Source commit | `6691b471c872267363a785e80faafd663440988d` |
| Deployment | `dpl_HZbh1Yj9DFnFJ7SX8xxNAZqk2Szg`, READY |
| Anonymous access | Public demo GET returned 200. Private `/operator/review` returned 404. |
| Live browser checks | Both vendor histories, order fees and pack changes, evidence, labor, pour, handoff and retained inputs checked. |
| Phone layout | 390 px live viewport: first action visible and no overflow. 320 px public start, result, terms and dialog reflow checked. |
| Focused tests | 22 focused tests passed, including 13 vendor tests. |
| Full CI | Linux [run 34436769601](https://github.com/mykemueller1-ctrl/never86/actions/runs/34436769601) succeeded. |
| Completed video | `deliverables/never86-vendor-demo-v2-60s.mp4`, 1,575,183 bytes, 60 seconds, 1920 × 1080, 30 fps, H.264, no audio. Assembled from six deployed demo screenshots with captions. |

The public release is a standalone sample with synthetic records. The private Community review is unavailable on that deployment. Continue to keep private Community documents and Max account data out of public pages, recordings and assets, as required by the repository instructions.

The copy now uses the verified public URL. The completed video is a silent captioned walkthrough made from still screenshots. No live interaction recording or voiceover was made. Narration and a recording of live interactions remain optional future work. The scorecard remains blank and does not establish a user study result. Nothing in this package has been posted, scheduled or promoted with paid spend.

## Voice and positioning audit

Main founder post: starts with item price and delivery, then explains the source comparison and the human question. AI status follows. PASS.

Landing copy: starts with the price change and the next order. Missing facts remain explicit. PASS.

X thread: starts with the delivery reversal, explains the records and decision, then names unfinished capabilities and the offer. PASS.

Copy blocks avoid the brand’s banned corporate words and contain no hyphen punctuation. Technical file names and source URLs may contain hyphens because they are references, not outbound sentences. Dollar examples remain labeled as synthetic.

Change log: Replaced a general AI launch pitch with one concrete cost question and the record behind it.
Change log: Changed unverified live product, savings and scale claims into clear demo scope and testable goals.
