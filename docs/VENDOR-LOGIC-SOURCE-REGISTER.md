# Vendor logic source register

Checked September 9, 2026. This is a proposed coverage list of ten POS products and ten restaurant software products, not a verified market-share ranking. Source discovery does not mean an integration is built or a report's entire logic has been certified. Prioritize products actually used by pilot restaurants.

## POS coverage candidates

| Product and scope | Starting primary reference | Rule or gap to carry into validation |
|---|---|---|
| PDQ | [Enterprise brochure, 2017](https://pdqpos.com/wp-content/uploads/2017/01/Enterprise-1.pdf) | Legacy capability reference only. Obtain current export headers, report settings and vendor definitions before implementing financial mappings. |
| Toast | [Accounting integration checklist](https://doc.toasttab.com/doc/cookbook/apiIntegrationChecklistAccounting.html) | Business dates, closeout configuration and void business dates require explicit handling. Match report periods before comparing totals. |
| Square Orders / Refunds APIs | [Refunds and exchanges](https://developer.squareup.com/docs/orders-api/order-returns-exchanges) | Return orders can be itemized or custom amounts. A custom refund does not identify which item was consumed or wasted. Reconcile linked refunds without double counting. |
| Clover | [Orders FAQ](https://docs.clover.com/dev/docs/orders-faqs), [Ecommerce refunds](https://docs.clover.com/dev/docs/ecommerce-refunding-payments) | Ecommerce and device or Platform APIs have different capabilities. Verify settlement state and API family before applying void versus refund rules. |
| Lightspeed Restaurant K-Series | [Reporting troubleshooting](https://k-series-support.lightspeedhq.com/hc/en-us/articles/16602420725915-Troubleshooting-reporting-issues) | Record K-Series explicitly. Do not apply K-Series definitions to other Lightspeed product lines. Verify report and payment dates and report filters. |
| SpotOn Restaurant | [API introduction](https://developers.spoton.com/restaurant/docs/introduction), [Orders](https://developers.spoton.com/restaurant/docs/orders-1) | Keep Restaurant and Express separate. Check order, item, modifier and discount relationships before adding totals. |
| TouchBistro | [Version 9.5.0 release notes](https://cdn.help.touchbistro.com/TouchBistro-release-notes-v-9-5-0.pdf) | Version-specific historical reference. Obtain current version and reporting documentation; do not apply an old void window universally. |
| Revel Systems | [Reporting API overview](https://developer.revelsystems.com/revelsystems/reference/overview-4) | Reporting summaries need reconciliation with selected filters and transaction detail. Do not confuse Revel Systems with unrelated products sharing the name. |
| PAR POS / Brink | [PAR POS cloud APIs](https://developers.partech.com/docs/parpos-cloud-apis) | Current cloud REST and legacy SOAP are different contracts. Record the interface and version; old SOAP-only material is insufficient for current implementation. |
| NCR Voyix Aloha Smart Manager | [Sales reporting](https://docs.ncrvoyix.com/restaurant/aloha-smart-manager/reporting/sales/about_sales_reporting) | This is Smart Manager scope. Confirm date selection, POS edition and source report before interpreting an Aloha export. |

Each candidate needs representative authorized exports and expected totals. A publicly documented API may still require a vendor agreement, credentials, account permissions and fees. None of these sources grants access to an operator's POS.

## Restaurant software coverage candidates

| Product | Starting primary reference | Rule or gap to carry into validation |
|---|---|---|
| 7shifts | [Variance report](https://kb.7shifts.com/hc/en-us/articles/4417513558675-Variance-Report) | Scheduled and actual labor are different inputs; actual data depends on a supported timekeeping source. Confirm wage and cost inclusion settings. |
| MarginEdge | [Theoretical usage](https://help.marginedge.com/hc/en-us/articles/360015245314-How-do-I-see-my-Theoretical-Usage) | Closed inventories and the report's mapping requirements matter. Distinguish restaurant and commissary workflows rather than assuming identical input requirements. |
| Restaurant365 | [Actual versus theoretical analysis](https://docs.restaurant365.com/docs/actual-vs-theoretical-analysis), [Inventory variance](https://docs.restaurant365.com/docs/inventory-variance-by-location) | Record costing method, waste inclusion, dates and location selection. A differently configured report can produce a different valid result. |
| MarketMan | [Actual versus theoretical report](https://www.marketman.com/page/actual-vs-theoretical-food-cost-report) | First party explanatory article, not an API field dictionary. Obtain current report definitions and exports before implementing an adapter. |
| WISK | [Variance report](https://help.wisk.ai/en/articles/3859570-variance-report), [Variance troubleshooting](https://help.wisk.ai/en/articles/3286787-why-is-my-variance-so-large) | Preserve the report's sign convention and mapping scope. Missing invoices, sales, counts or incorrect recipe quantities can create apparent loss. |
| Backbar | [Inventory variance report](https://www.getbackbar.com/support/inventory-variance-report), [Missing usage items](https://www.getbackbar.com/support/why-dont-my-items-show-on-usage-reports) | Two inventory sessions define the period. The documented usage report excludes negative calculated usage; an absent row is not proof of zero use. |
| Craftable | [Actual versus theoretical summary](https://help.craftable.com/learning/actual-vs-theoretical-summary-report) | Distinguish inventory quantities from cost summaries. Purchases, transfers, sales and audit periods need matching. |
| xtraCHEF by Toast | [Cost management reports](https://support.toasttab.com/en/article/xtraCHEF-Reports-Cost-Management) | Price fluctuation and contracted price variance answer different questions. Confirm pack sizes, dates and contract evidence before alleging an overcharge. |
| Fourth HotSchedules | [Employee hours report](https://help.hotschedules.com/hc/en-us/articles/214872808-HS-Employee-Hours-Report), [iQ alerts](https://help.hotschedules.com/hc/en-us/articles/40822268267533-HotSchedules-iQ-Alerts-Actions) | Distinguish scheduled, actual and forecast labor; plan and feature configuration affect available alerts. Verify costs and permissions. |
| Crunchtime | [Inventory product brief](https://www.crunchtime.com/hubfs/2023%20Resource%20Page%20Assets/Crunchtime%20Inventory%20Management%20-%20Product%20Brief.pdf?hsLang=en) | Capability reference only. Obtain versioned report documentation and sample calculations before claiming a supported import. |

These products already solve parts of the problem. The proposed difference is a quick, understandable result and a traceable follow up, with less setup for the first useful task. That is a product hypothesis to test with operators.

## Minimum report contract

Before a parser is marked supported, record and test:

- Product, edition, version, source URL and last verified date.
- Restaurant, location, authenticated data owner and permission scope.
- Report family, source format, export settings, covered dates, timezone, business-day cutoff and fiscal calendar.
- Gross versus net sales, taxes, tips, service charges, delivery fees, discounts, comps, voids, refunds, gift cards, deposits and their inclusion rules.
- Original transaction date, adjustment date, settlement state and reporting date.
- Check owner, action performer, approver and clocked employee as separate roles where supplied.
- Stable IDs, revisions, import hashes, duplicate rules and how corrected exports replace prior facts without losing history.
- Currency, units, packs, usable yield, recipe version, costing method and rounding.
- Missing rows or pages, failed sync periods, provisional records and completeness checks.
- Sample source records, expected normalized facts and reconciliation against the vendor's report.

An unknown field remains unknown. Store unsupported or unverified imports for review without letting them silently enter financial findings. A general LLM summary is not a substitute for this contract.

## Distributor scope

Food and beverage distributors are a separate catalog. Start with the operator's actual vendors, invoice formats, delivery days, substitutions, credits, pack sizes, taxes and freight. National distributor marketing pages cannot establish an operator's contracted prices. No top-ten distributor ranking or supplier-account integration was completed in this pass.
