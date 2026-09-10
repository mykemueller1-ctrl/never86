# Never86’d public sample demo: design and capture brief

Date: 2026-09-09. Target route: `/demo/operator`. This is a design review and production brief, not a record of user testing or a claim that deployment is complete.

The demo should let a busy operator understand one cost change, inspect the records behind it, and draft the next step. Lead with two sample invoices. Give labor and pours their own smaller follow up stories. Ten minutes is the product target; no measured activation or conversion result exists yet.

## What stays

Keep the warm cream background, forest green navigation, conversational headline, and familiar restaurant folders from the private review. They give the work a calm place to happen. Use the private screenshots as design references only. Public captures must come from Cedar & Salt, the fictional sample restaurant. Do not publish the Community review screenshots, source document, people, or private numbers.

## Fixes in priority order

| Priority | Finding | Concrete recommendation |
|---|---|---|
| P0 | A marketing screenshot may be cropped away from the page banner. | Keep “Fictional sample” beside every financial result as well as “Sample demo · Fictional restaurant data” in the header. |
| P0 | Three equal choices make the visitor decide before seeing the work. | Give “Check two sample invoices” the dominant first screen action. Keep labor and pours available in navigation. |
| P0 | Case price alone can mislead when pack size changes. | Show SKU, dates, pack size, both case prices, and both prices per pound next to the answer. Changing a pack size must recompute the result. |
| P0 | A difference can be mistaken for money recovered or misconduct. | Say “$12 more on this sample order.” Never label it recovered, saved, stolen, or an annual loss. |
| P0 | A draft handoff can look like work assigned to a real teammate. | Label it “Draft kept in this tab.” Keep owner, due date, and requested proof visible. Do not claim a message was sent. |
| P0 | A public demo cannot imply that a real account or connected OCR flow is ready. | Use “Try the sample demo” in public posts. Show the free seat offer only with a working and verified destination. |
| P1 | The private mobile reference uses some very small, pale labels. | Use a 16 px body and form baseline, at least 14 px for useful secondary information, and stronger secondary text. Keep restaurant identity visible when the sidebar closes. |
| P1 | An answer without a next step becomes another report. | Put “Draft a vendor question” beside the invoice result. Default requested proof to “Vendor reply or corrected invoice.” |
| P1 | An empty field can quietly become a confident zero. | Missing wage, invalid pack size, or incomplete time data must show what is needed. Labor hours can be shown while wage cost remains unavailable. |
| P2 | Showing every folder at once makes a small operator think this is a big setup project. | Tell one complete story in the main content. Introduce the next useful record after the visitor sees the first result. |

These are expert review recommendations. They do not establish a measured usability score.

## Exact copy and arithmetic

Use this copy where it matches the implemented behavior:

| Surface | Copy |
|---|---|
| Page label | Sample demo · Fictional restaurant data |
| Headline | Let’s check one thing that’s costing you. |
| Supporting line | Two sample invoices. One price change. A next step you can check. |
| Primary action | Check two sample invoices |
| Invoice result | $12 more on this sample order |
| Result explanation | The same cheese went from $2.40 to $2.60 per lb. That is $6 more per case. |
| Evidence label | See the two sample invoices |
| Next step | Draft a vendor question |
| Requested proof | Vendor reply or corrected invoice |
| Draft state | Draft kept in this tab |
| Labor result | 2 hours beyond the scheduled shift |
| Labor follow up | Add the hourly rate to estimate wage cost. |
| Pour result | $1.48 of liquor per standard pour |
| Pour explanation | Sample bottle cost only. Add mixers, garnish, and waste to cost the whole drink. |
| Public call to action | Try the sample demo |

Canonical fictional examples agreed with the implementation:

* Invoice SKU `CHZ-600`: 6 bags × 5 lb = 30 lb per case. Prior case price $72; current $78. Two cases cost $144 before and $156 now. Unit price rose from $2.40 to $2.60 per lb, an 8.3% increase. The $12 is the comparison for the current sample quantity. It is not a verified supplier error or recovery.
* Labor: scheduled 4 PM to 10 PM; actual 4 PM to midnight on the next calendar day. Scheduled 6 hours; actual 8 hours; difference 2 hours. Wage unavailable until the visitor enters it. Do not label all of the difference waste.
* Pour: $25 bottle, 750 mL, 1.5 US fl oz standard pour. `25 × (1.5 × 29.5735295625) ÷ 750 = $1.48`, rounded for display. This alone cannot establish overpouring, theft, or total drink cost.

## The first ten minutes

1. Open directly into the sample restaurant. No account form before the sample result.
2. Select the invoice check. Show the records and the unit price comparison together.
3. Let the visitor change the price or pack size and see why the answer changes.
4. Draft one question, name a sample owner, choose a due date, and state what proof would close it.
5. Offer the next relevant check. For a real onboarding flow, ask for the minimum useful pair of records and explain why they are needed. Request Drive access only when that connected workflow is implemented and the operator understands the scope.

Measure from the first visit as well as from successful data capture. Report sample demo completion separately from time to a supported finding on an operator’s real records. An instant sample result is not evidence that real OCR or onboarding finishes in ten minutes.

## 60 second screen recording storyboard

Capture the real public sample build. Keep the fictional label visible in every financial frame. Record deliberate pointer movement and readable pauses. Record the source screen at useful resolution, then crop the same recording into a portrait social version. Do not replace the working UI with a generated mockup.

| Time | Capture | Voice or caption |
|---|---|---|
| 0–6 sec | Invoice result card beside Cedar & Salt identity and “Fictional sample.” | “Same cheese. Same case. Twelve dollars more on this order.” |
| 6–15 sec | Open both invoice records. Show 6 × 5 lb, $72, $78, and two cases. | “These are sample invoices. Six dollars more per case. Two cases. Here is the math.” |
| 15–24 sec | Show $2.40 → $2.60 per lb. Briefly highlight the pack size field. | “Case prices can fool you when the pack changes. Check the cost per pound.” |
| 24–36 sec | Select “Draft a vendor question.” Complete sample owner, due date, and proof fields. | “Give the next step an owner. Ask the vendor about the change. Keep the reply or corrected invoice.” |
| 36–45 sec | Open labor. Show scheduled 6 hours, actual 8 hours, wage unavailable. | “The same desk can compare a schedule with clock times. Two extra hours here. Find out why.” |
| 45–53 sec | Open pours. Show $25, 750 mL, 1.5 fl oz, $1.48. | “Or work out what your standard pour costs. This is bottle cost, before the rest of the drink.” |
| 53–60 sec | Return to the invoice result and the verified public demo address. | “One thing you can check. One next step. Try the Never86’d sample demo.” |

The sequence is a proposed edit plan, not an already recorded video. Use captions throughout. Do not speed the source inspection into unreadable motion. A second cut should tell only the invoice story in roughly 20 seconds.

Capture stills from these real states: first screen, invoice result with sources, draft with proof field, labor missing wage, and pour calculation. Use the invoice result as the primary social image. A giant list of features should not be the thumbnail. Suggested editorial exports are portrait 1080 × 1350 and landscape 1920 × 1080; these are design choices, not claims about current upload limits.

Suggested image alt text: “Never86’d fictional sample compares two cheese invoices. The same 30 lb case rises from $72 to $78, adding $12 across two cases. Both records and a draft vendor question are visible.” Adjust the final text to the exact captured state.

## Visual and accessibility specifications

Use forest `#17372F`, cream `#F8F7F0`, and secondary text `#526257`. Computed contrast is 12.04:1 for forest on cream, 6.03:1 for secondary text on cream, and 12.93:1 for white on forest. Those pairs exceed the 4.5:1 normal text requirement. Test the actual rendered combinations, including hover, disabled, focus, and error states. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Use 48 CSS px targets for important controls. This is our stronger touch design target; WCAG 2.2 AA has a 24 × 24 CSS px minimum with defined exceptions. [W3C target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Keep an obvious keyboard focus indicator, persistent field labels, meaningful button text, and programmatic feedback for calculation changes. Avoid color as the only indicator of a price increase or missing evidence. [W3C focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)

At 320 CSS px, present evidence in stacked cards or a readable equivalent rather than shrinking a desktop table. Verify zoom and reflow before describing the demo as accessible. Keep sample labels, units, and the next action readable on mobile. [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## Acceptance checks before publishing the capture

These checks are pending unless the release owner records their results:

* Public URL loads without local files, credentials, or an operator session.
* All visible people, dates, records, and amounts belong to the fictional fixture.
* The banner and every captured result clearly identify the sample.
* Invoice, labor, and pour math match the examples above; changing valid inputs changes the output correctly.
* Missing or invalid inputs never become invented costs, recovered dollars, or accusations.
* Draft actions do not send anything and accurately describe where the draft is kept.
* Keyboard navigation, focus, labels, 320 px reflow, and portrait captures remain usable.
* Every advertised interaction is shown working in the released build.
* The actual public destination is verified before inserting it into LinkedIn or X copy.
* No claim of a live ChatGPT store listing, live OCR, customer result, conversion rate, or ten minute result appears without supporting evidence.

## Brand pass

Public copy uses cost before features, short sentences, and operator language. It avoids corporate wording and outbound hyphens.

Change log: concentrated the story on a checkable invoice change and a next action. Preserved the sample disclosure and removed unsupported recovery, fraud, and launch claims.
