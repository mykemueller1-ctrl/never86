# Free data that can earn an operator's attention

Checked September 9, 2026. Rankings are product judgments, not measured conversion rates. Public references are kept separate from a restaurant's private records.

## Build order

1. **A menu price check** for acquisition. Restaurant name + city + menu URL or photo. Compare a few genuinely comparable dishes on current first party menus, with source date, portion, sides and ordering channel. Do not require POS access to start. There is no verified universal free API here for current item level menu prices. Places can help identify businesses and their websites, but it is not a menu price database. Search, retrieval, extraction and hosting still cost money even when a menu is public.
2. **An invoice comparison** for the first measurable cost result. Two invoices, matching SKU and usable units, determine the operator's actual price change. Public commodity data supplies context. A market price change alone does not establish overcharging, recoverable dollars or distributor misconduct.
3. **One bottle, one pour** for an immediate useful calculation. Bottle cost, size and US fluid ounce pour produce spirit cost. Recipes and sales add expected consumption. Inventory counts, deliveries, transfers, comps and waste are needed to investigate actual variance. Do not infer a bartender's responsibility from shared inventory.

Owner's public grader asks for a restaurant name and offers a report on its online presence. The useful lesson is a small first request followed by a specific visible result. It does not prove our conversion or retention. [Owner grader](https://grader.owner.com/)

## Source shortlist

| Source | Access and cost boundary | Restaurant use | Decision |
|---|---|---|---|
| USDA LMPR / dairy API | Public endpoint, no user key. Respect service limits and bounded dates. | Meat and dairy market context beside invoice changes. Commodity, grade, package, location and report period must match the question. | Start with one or two relevant report series. |
| USDA MyMarketNews | Free account includes an API key. API organized around report IDs. | Poultry, eggs, produce and other available market reports. | Next food cost connector. Build a report catalog, not a generic search assumption. |
| Iowa liquor sales and products | Public Socrata data. App token and current access limits need verification. The direct data probe in this session returned HTTP 403. | Product, bottle size and market reference lookup. | Keep as a regional reference until coverage and the licensee are confirmed. |
| National Weather Service | Free for any purpose; no API key currently, identifying User Agent required. | Weather context for prep, patio and staffing decisions. | Useful supporting feature. Forecasts alone cannot determine how many people to schedule. |
| USDA FoodData Central | Free data.gov key. Default documented limit: 1,000 requests/hour/IP. DEMO_KEY is only for exploration: 30/hour and 50/day/IP. Public domain data. | Product lookup, ingredients and nutrition reference. | Useful cleanup/enrichment. It does not contain vendor invoice prices or complete restaurant recipes. |
| openFDA food enforcement | Free key; docs publish no-key limits as well. | Match purchased product and lot against recall evidence for manager review. | Supporting feature after exact matching and freshness work. A product-name match is not confirmation that a restaurant's stock is affected. |
| PageSpeed Insights / Lighthouse | API accepts no-key exploration; use a configured key and quotas for repeated API calls. Lighthouse can also run locally. | Mobile site friction and accessibility checks. | Secondary acquisition tool. Do not equate a page speed score with lost sales or search rankings. |
| Google Places | Metered service with monthly free caps by SKU and billing setup. Nearby Search Pro currently has 5,000 free monthly requests; requested fields affect the SKU. | Restaurant identification, location, website and broad price range. | Useful, but do not market as unlimited free menu analysis. |
| Open Food Facts | Open database with ODbL obligations, rate limits and product coverage constraints. | Barcode and packaged product reference. | Later. Keep licensing and community contributed accuracy in view before combining databases. |

Sources: [USDA API guide](https://mpr.datamart.ams.usda.gov/LMPRS-API-User-Guide.pdf), [MyMarketNews free account](https://mymarketnews.ams.usda.gov/faqs/what-my-market-news-account-and-what-are-benefits), [MyMarketNews API](https://mymarketnews.ams.usda.gov/mymarketnews-api), [Socrata dataset](https://dev.socrata.com/foundry/data.iowa.gov/m3tr-qhgy), [NWS API](https://www.weather.gov/documentation/services-web-api), [FoodData Central](https://fdc.nal.usda.gov/api-guide/), [openFDA authentication](https://open.fda.gov/apis/authentication/), [PageSpeed](https://developers.google.com/speed/docs/insights/v5/get-started), [Places pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [Places fields](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places), [Open Food Facts API](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md).

## Correction to the earlier Iowa idea

The public liquor dataset describes purchases by Iowa Class E licensees. Iowa's current license guide identifies Class E with grocery, liquor and convenience retailers and permitted wholesale activity. A bar may buy through one of those retailers. A retailer's purchase record is not automatically the downstream bar's purchase record.

Do not generate a bar's annual spirits spend, a peer percentile or an actual pour cost score merely by fuzzy matching its name. Require a confirmed entity/address and license scope. Use operator supplied invoices for their actual costs and counts plus sales for consumption. [Iowa license classifications](https://revenue.iowa.gov/permits-licensing/alcohol/license-classifications)

## What was actually tested

Four one time public API probes returned HTTP 200 and readable JSON:

- FoodData Central: three cheddar product search results using the published DEMO_KEY.
- NWS: the Fort Dodge city point resolved to its forecast grid.
- openFDA: one food enforcement record returned. This was a transport check, not a restaurant recall check.
- USDA dairy: final butter report rows returned. The newest row in this response was the week ending August 1, 2026. It must not be presented as this week's quote. The guide distinguishes final reports from recent reports subject to revision.

These are connectivity tests, not completed integrations or certified data quality tests. No account or paid subscription was created, and no private operator data was sent in these probes.

## Free does not mean zero operating cost

Store public references once and reuse them where the license permits. Refresh based on source cadence. Record the source URL, retrieved time, covered dates, geography, unit and provisional/final status. Fail visibly on stale or unmatched data. Set request budgets and timeouts. Use bounded retries and avoid a new vendor request for every chat message.

Keep private tenant records in tenant scoped storage. Do not feed private invoice rows into a public product database. Avoid defaulting to a free model tier until its data terms and commercial use rights have been checked.

Open-Meteo's hosted free API is for noncommercial use; its data license is different from its hosted service terms. It is not a free commercial production assumption for this business. [Open-Meteo pricing](https://open-meteo.com/en/pricing)

## First ten minutes

The test begins before sign in. The operator supplies a name and menu, sees a source backed observation, then chooses whether to bring one invoice or bottle cost. Show one result, one source and one next action. Allow a no-finding outcome. Measure time to a correct useful result, completion, corrections, cost per session and return next week. A free report that attracts clicks but does not lead to recurring usefulness has not validated the business.

The UI applies familiar job names and contextual help. Keep advanced connections behind the current job. [Recognition rather than recall](https://www.nngroup.com/articles/recognition-and-recall/), [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
