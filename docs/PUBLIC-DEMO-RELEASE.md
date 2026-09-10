# Never86’d operator sample release

Verified September 9, 2026, Central time. This release is a working public sample demo. It does not provision a live restaurant seat.

[Open the sample](https://never86-8xi9adiox-myke-muellers-projects.vercel.app/demo/operator)

## What works

The fictional Cedar & Salt desk compares two invoices by unit weight, compares a scheduled shift with actual clock times, calculates spirit cost from a bottle and house pour, and keeps one sample handoff draft in the current tab. Inputs change the calculations. Source values, units and limits appear with the results. Reset and reload clear the draft.

The opening action appears above the sample records. The desktop sidebar becomes three simple workflow buttons on a phone. A sample disclosure stays visible as the page scrolls. Changing workflows returns to the start of the next check.

## Release evidence

| Check | Result |
| --- | --- |
| Public access | Anonymous HTTP GET `/demo/operator` returned 200 without authentication or a redirect to login. |
| Private source boundary | `/operator/review` returned 404 on the same deployment. No private source snapshot was committed or included in the demo. |
| Invoice | Same SKU and vendor: $72 / 30 lb versus $78 / 30 lb. $2.40 to $2.60 per lb, 8.3% increase, $6 per case and $12 across two current cases. |
| Pack change | Changing the current case to $36 / 15 lb produced the same $2.40 per lb and zero unit price increase. |
| Invalid input | Zero case weight withheld the result. |
| Labor | 16:00–22:00 scheduled versus 16:00–00:00 next day actual produced 2 additional hours. Wage cost remained missing until supplied. |
| Wage and break | A supplied $18 hourly rate and 30 minute unpaid break produced 90 extra minutes and a $27 straight wage estimate. |
| Pour | $25 / 750 ml / 1.5 US fl oz produced $1.48. Changing to 2 US fl oz produced $1.97. These are spirit costs only. |
| Handoff | Owner, due time and requested proof appeared in a sample draft. Nothing was sent. Reload cleared the draft. |
| Phone | Published 390 px view had no horizontal overflow; the first action ended at 525 px in an 844 px viewport. The first invoice interaction worked. Local 320 px reflow also had no horizontal overflow. |
| Tests | All 9 new calculator tests passed. Full Linux CI, including dependency audit, lint, tests and production build, succeeded. |
| Media | Seven JPEG screenshots captured from the published sample. A 60 second, 1920 × 1080, 30 fps H.264 MP4 was rendered and visually checked. It is a captioned sequence of still screenshots without audio, not a recording of live interaction. |

Local full testing reported 827 passing tests and one existing Bash dependent test that could not execute on this Windows host. Linux CI succeeded on the same source. Local lint passed with two existing image warnings after excluding the uncommitted local tool runtime. These runtime tools are not part of the repository or release.

Source: `27bcbf81e1a4b1a56392c907da20d1338a344a63`. Vercel preview: `dpl_3YvRsht3JKWcgVsoFEx1fmc7vcbb`, READY. [CI run](https://github.com/mykemueller1-ctrl/never86/actions/runs/34432608726). The deployment was started through the existing Vercel project's Create Preview Deployment control after automatic deployment did not start. The production domain was not promoted.

## Readiness scorecard

| Area | Assessment |
| --- | --- |
| Public product demonstration | Ready to share as a labeled sample. |
| Math and supporting records | Verified for the three bounded examples and tested edge cases. |
| Marketing package | Draft assets prepared for human publication. No posts, messages, schedules or ad purchases were made. |
| Ten minute operator activation | Not measured. The included scorecard is blank; run observed sessions with real operators. |
| Community and Max live seats | Not completed by this demo release. Private source review is separate. |
| Live AI, OCR, Drive/POS connections and ongoing learning | Still require implementation, authorized data access, and evaluation on real records. |
| ChatGPT distribution | No store submission, approval or OpenAI endorsement established. |

Next production milestone: one authorized restaurant user signs in, supplies a real source pair, reviews an extracted and reconciled finding, assigns one action, returns proof, and sees that history on the next visit. Measure that full path before claiming ten minute activation or repeatable customer savings.
