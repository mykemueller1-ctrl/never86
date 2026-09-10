# Never86’d operator sample release

Updated vendor demo, September 9, 2026 Central time. This release is a working public sample; it does not provision live restaurant seats.

[Try the refreshed demo](https://never86-bnt24t594-myke-muellers-projects.vercel.app/demo/operator) · [Watch the updated video](https://drive.google.com/file/d/1ba5xXn2EcHNoh8aR_QRk_zNXyyNEofLQ/view)

## What changed

Warm ivory, charcoal and burnt orange replace the green palette. Sans serif headlines, clearer prices and more legible phone controls simplify the desk. The next action follows the order result; detailed reasoning appears below it.

The fictional Cedar & Salt desk now compares two vendor histories and explains what changes the actual order. Same product mapping, pack size, usable yield, whole cases, delivery charges, minimum order, stock and arrival before prep matter. Missing information withholds a price choice. Seven editable scenarios demonstrate how one detail changes the answer. A vendor question can be edited, assigned a sample owner and due time, and kept in the tab. Switching workflows preserves vendor inputs. Reload or Reset sample clears them and the draft.

Labor and spirit cost calculations remain available. No real restaurant record, message or vendor order is part of the public sample.

## Verified release evidence

| Check | Result |
| --- | --- |
| Public access | Anonymous GET `/demo/operator`: 200, no login redirect, new vendor content present. |
| Private boundary | `/operator/review`: 404 on the same deployment. |
| Both histories | Hilltop $2.40 → $2.60/lb, +8.3%. Lakefront $2.45 → $2.50/lb, +2.0%; latest Lakefront record is a quote. |
| Actual order | Need 60 usable lb. Hilltop: $156 cheese + $0 delivery. Lakefront: $150 cheese + $12 delivery = $162. Lower item price becomes $6 higher order cost. |
| Smaller pack | Lakefront $65 / 25 lb: 3 whole cases, $195 cheese + $12 delivery, 15 extra usable lb. |
| Missing facts | Unknown fees are not zero. Product mismatch, missing yield, minimum uncertainty, unmet minimum, late delivery or unavailable stock withhold a price choice. |
| Scenario interaction | Seven scenarios exercised in a 390 px browser, with expected headlines and no horizontal overflow. |
| Workflow continuity | A $65 / 25 lb edit and its result remained after switching to labor and back on the public deployment. |
| Handoff | Vendor question, owner, due time and evidence saved as a tab draft. Changing the assignment allows saving again. No message sent. |
| Labor and pours | 2 extra hours with wage missing. Supplied $18/hr plus a 30 minute break: 90 extra minutes, $27 straight wages. $25 / 750 ml / 1.5 US fl oz: $1.48 spirit cost. |
| Phone | Published 390 px page had no horizontal overflow; first action ended at 678 px in an 844 px viewport. Published 320 px start, result, expanded terms and dialog fit without horizontal overflow. |
| Local checks | 22 calculator tests pass, including 13 new vendor tests. Production build and TypeScript pass. Lint has zero errors and two pre-existing image warnings. |
| CI | Full Linux dependency audit, lint, tests and build succeeded in [run 466](https://github.com/mykemueller1-ctrl/never86/actions/runs/34436769601). |
| Video | 60 sec, 1920 × 1080, H.264, 30 fps, 1,575,183 bytes. Six published screenshots, silent captions. Full decode and visual frame inspection pass. |

Application source: `6691b471c872267363a785e80faafd663440988d`, tree `d3f7c8a923bf324f0f4c12ac7a033dd1701a3886`. Vercel preview `dpl_HZbh1Yj9DFnFJ7SX8xxNAZqk2Szg`, READY, existing Never86 project. Automatic deployment started successfully for this revision. The production domain was not promoted.

[Design and source rationale](DEMO-VENDOR-REFINEMENT.md) records the business rules and primary references. Delivery is counted once for this order. Tax, rebates, other charges and whole basket optimization remain outside this sample. Calculated differences are not confirmed errors, credits or recovered money.

## Readiness

The sample is ready to review and share as a sample. Ten minute activation has not been measured. Community and Max live seats, authenticated workflows, live AI, OCR, authorized Drive/POS connections, ongoing learning and ChatGPT app submission remain incomplete. This release establishes no OpenAI endorsement or measured customer savings.

The next live milestone is an authorized restaurant user supplying a real source pair, reviewing extracted and reconciled facts, assigning one action, bringing back proof and seeing it on the next visit.
