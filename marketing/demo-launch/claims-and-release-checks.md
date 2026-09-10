# Claims and release checks

This file records the release owner’s verification of the public sample demo and keeps its claims separate from unfinished live restaurant features. The marketing author incorporated the evidence supplied by the release owner.

## Claim register

| Claim | Current basis | Copy decision |
| --- | --- | --- |
| Never86’d is being built for operators wearing too many hats. | User’s stated scope. | Use as positioning. |
| First location and first seat free; extra manager seats paid. | User’s stated intended offer. | Say “planned offer” or “building toward” until live provisioning and terms work. |
| One useful answer in ten minutes. | Product goal. No completed operator study supplied. | State as a goal. Do not say proven, guaranteed or already achieved. |
| Sample invoices compare $72 and $78 for the same 30 lb case. | Canonical synthetic example checked in the deployed browser. | Use as a sample price comparison. A price difference is not money saved. |
| Sample shift is two hours longer. | Scheduled 16:00–22:00 versus actual 16:00–00:00 next day, equal break assumption. | Use only with dates and same assumptions. No wage means no dollar claim. |
| Sample spirit pour costs $1.48. | $25 × 1.5 × 29.5735295625 ÷ 750 = $1.478676478125, rounded. | State spirit cost only. Ingredients and waste add cost. |
| Source records stay next to the answer. | Sample source controls checked in the deployed browser. | Describe the sample record and its result. |
| The handoff is a draft. | Draft behavior checked in the deployed browser. No message sending or live assignment. | Keep the draft label and explicit scope. |
| Live AI, photo reading and connections are incomplete. | Current project status supplied to this task. | Disclose in launch text and demo. Recheck when release scope changes. |
| Listed in ChatGPT’s store or endorsed by OpenAI. | No supporting evidence. | Do not claim. |
| 80% correct answers from a wider context window. | No evaluation result. | Do not claim. |
| Proven customer savings, theft identified or 100,000 users. | No supporting evidence for this release. | Do not claim. |

## Final release evidence

Verified by the release owner at approximately 03:23 UTC on September 10, 2026, or 10:23 pm Central on September 9:

| Evidence | Result |
| --- | --- |
| Public URL | https://never86-8xi9adiox-myke-muellers-projects.vercel.app/demo/operator |
| Source commit | `27bcbf81e1a4b1a56392c907da20d1338a344a63` |
| Deployment | `dpl_3YvRsht3JKWcgVsoFEx1fmc7vcbb`, READY |
| Anonymous access | Public demo GET returned 200. Private `/operator/review` returned 404. |
| Live browser checks | Canonical invoice, evidence, labor, pour and handoff checked. |
| Phone layout | 390 px live viewport: first action visible and no overflow. 320 px local reflow checked. |
| Focused tests | Nine focused tests passed. |
| Full CI | Linux [run 34432608726](https://github.com/mykemueller1-ctrl/never86/actions/runs/34432608726) succeeded. |
| Completed video | `deliverables/never86-sample-demo-60s.mp4`, 1,548,190 bytes, 60 seconds, 1920 × 1080, 30 fps, H.264, no audio. Assembled from six deployed demo screenshots with captions. |

The public release is a standalone sample with synthetic records. The private Community review is unavailable on that deployment. Continue to keep private Community documents and Max account data out of public pages, recordings and assets, as required by the repository instructions.

The copy now uses the verified public URL. The completed video is a silent captioned walkthrough made from still screenshots. No live interaction recording or voiceover was made. The original narration script is optional future work. The scorecard remains blank and does not establish a user study result. Nothing in this package has been posted, scheduled or promoted with paid spend.

## Voice and positioning audit

Main founder post: cost leads with “Your food bill went up.” Visibility follows with “You can see the numbers behind the answer.” Live AI is described as unfinished, after both. PASS.

Landing page: cost leads with “Where did the extra cost come from?” Source visibility follows in the subhead. No advanced capability leads the pitch. PASS.

X thread: cost leads in post 1. The source and missing information are explained in post 2. Product status follows in post 4. PASS.

Copy blocks avoid the brand’s banned corporate words and contain no hyphen punctuation. Technical file names and source URLs may contain hyphens because they are references, not outbound sentences. Dollar examples remain labeled as synthetic.

Change log: Replaced a general AI launch pitch with one concrete cost question and the record behind it.
Change log: Changed unverified live product, savings and scale claims into clear demo scope and testable goals.
