# PDQ EOD gap — Community Pizza 2026-09-02

**Status:** drafted / tested / committed on this branch — not merged, not deployed, not live-verified  
**Store:** Community Pizza (private reference tenant)  
**Business date:** 2026-09-02 only  
**Owner after this packet:** Grok hub → Myke for PDQ schedule/export; factory does not send mail

## What a complete PDQ EOD email contains

Yes. One scheduled `EOD Reports` message from `pdqreports@pdqpos.com` should attach **three native PDFs** for the same store and filename date:

- `M-D-YYYY ZReport_Summary … .pdf`
- `M-D-YYYY Hourly_Sales_Report … .pdf`
- `M-D-YYYY Void_Promo_Report … .pdf`

Issue #118 recorded a complete three-file packet on 8/24 and 8/29. The same thread recorded Void-only messages on 8/26 and 9/1. This night matches that Void-only pattern.

## 9/2 evidence state

| Family | State | Notes |
|---|---|---|
| Void_Promo_Report | Landed in the Gmail message from pdqreports | Do not invent void dollars here |
| ZReport_Summary | **Missing Evidence** | Not in the Gmail attachment list; not in connected Drive under `9-2-2026` |
| Hourly_Sales_Report | **Missing Evidence** | Not in the Gmail attachment list; not in connected Drive under `9-2-2026` |

No sales, labor, mix, hourly, or cash dollars are claimed for 9/2. Missing Evidence is not $0. Action Shift cannot rank a sales move until the Z lands.

## Why the two PDFs did not land

Two separate gaps, both labeled:

1. **Upstream PDQ packet** — the Gmail message itself was Void-only. This factory could not open Gmail MCP (`needsAuth`). Resend inbound is not the PDQ inbox (only DMARC/other mail to never86.ai). Connected Drive showed July `ZReport_Summary` titles, not `9-2-2026`.
2. **Intake pipe** — SES/raw MIME previously kept the body and dropped attachment parts. A cover letter that listed all three filenames could be misread as a Z with no fields. Same-date Void-only desks could overwrite a later Z.

This branch fixes (2). (1) still needs the native PDFs from PDQ Reports or a later complete EOD email.

## Export path so Action Shift can land

1. In **PDQ Reports**, export native PDFs for Community Pizza / business date **9/2/2026**: Z Report / End of Day and Hourly Sales. No Never86 portal login. Do not type dollars.
2. Confirm the PDQ scheduled EOD job attaches all three families every night. Recurring Void-only nights (8/26, 9/1, 9/2) vs complete nights (8/24, 8/29) is a scheduler/attachment failure, not a Never86 dollar invention.
3. Forward those two PDFs to the operator close mailbox, or drop them on the free-seat desk. Same-date families now merge.
4. Operator Drive dated copies are a fallback only when `9-2-2026 ZReport_Summary` and `9-2-2026 Hourly_Sales_Report` already exist.

## Do not

Invent dollars. Treat missing Z/Hourly as a clean night. Ask Myke for a POS password. Put CTAP private totals, staff names, or PINs in git. Merge or deploy from this worker.
