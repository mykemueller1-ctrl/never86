# Merge readiness — PR 259

Draft only. Do not merge until Myke says yes. Reviewed on `cursor/operator-seat-thicken-b382` against the five intake checks. No new seat features.

One fix landed with this note: a CSV drop rewrites the fictional mozzarella pair into a compare table. That pair stays **Demo · Estimated**. It does not become Verified.

## Checklist

| Check | Label | What was confirmed |
| --- | --- | --- |
| `gmail=false` elevates photo, PDF, and chat. Connect is not faked. | Verified | `POST /api/papers/upload` with Gmail off returns `elevated: true`, `lead: ["photo","upload","chat"]`, `connection.gmail: false`. Connect stays secondary and disabled until the Google client exists. `/try` has no Connect button. |
| `POST /api/papers/upload`, `/photo`, and `/chat` use Verified, Estimated, or Missing. No invented dollars. A chat-typed dollar is Estimated. Only a literal TOTAL/DUE line is peeled. | Verified | `TOTAL DUE $19.00` returns Estimated and that exact line. A SKU row at `56.00` returns Missing and an empty `text` (the `56.00` is not echoed). `truck was $4.00` returns Estimated and the text `$4.00`, not `$4.00` rewritten and not Verified. These three routes do not return Verified. |
| `/try` mozzarella sample and labor sample are Demo · Estimated. | Verified | `/try` renders Whole Milk Mozzarella `$48.00 → $56.00` with `aria-label="Honesty Demo Estimated"`. Step 3 says Demo · Estimated. `/try/labor` renders 8.00 h → 9.50 h and sample $31 with the same Demo · Estimated label. A reshaped sample drop compared live returns `disclosedSample: true` and Estimated on both SKUs. |
| `/chat#photo` and the invoice PDF drop are real targets. | Verified | `/chat` server HTML includes `id="photo"` and two file inputs (photo, then PDF/CSV/TXT). `/check/invoices` leads with `id="pdf"` and two invoice file inputs. `/try` links to `/chat#photo` and `/check/invoices`. |
| No secrets committed on this branch. | Verified | Diff has no live keys. `GOCSPX-` hits are test placeholders. `.env.example` is placeholders only. |

## Still Missing

- Site Gmail and Drive are not connected. Photos and scanned PDFs stay Missing. No OCR.
- The photo picker accept list is PDF, CSV, TXT, and HEIC. A JPEG posted to `POST /api/papers/photo` stays Missing and invents no dollars. The picker does not offer JPEG or PNG.
- Production still 404s these routes until this draft merges.
