# Operator demo: vendor logic and visual refinement

September 9, 2026. Public fictional sample only.

## What changed

The operator desk uses warm ivory, charcoal and burnt orange. Headlines now use the same clear sans serif family as the controls, with stronger type hierarchy, tabular prices and a quieter sidebar. The first action is visible in the opening phone viewport. The result leads directly to an editable vendor question, owner, due time and proof request. Detailed reasoning follows the action.

Two vendor histories now sit beside one another. A confirmed manufacturer product and form mapping permits a comparison even when supplier SKUs differ. Unconfirmed products and substitutions withhold a price choice. Each vendor is compared against its own earlier record. Case weight, whole cases, usable yield, delivery, order minimums, other planned basket items, availability and arrival before prep affect the explanation.

## Bounded examples

- Hilltop: $72 / 30 lb earlier, $78 / 30 lb now. Unit price rises 8.3%.
- Lakefront: $73.50 / 30 lb earlier, $75 / 30 lb in the current quote. Unit price rises 2.0%.
- For 60 usable lb at 100% sample yield, Hilltop is $156 including the entered $0 delivery. Lakefront is $150 in cheese plus $12 delivery, or $162. The lower item price becomes a higher order cost.
- Lakefront at $65 / 25 lb needs three whole cases for 60 usable lb. The order is $195 plus $12 delivery, with 15 extra usable lb to store. Its lower case price still represents a 6.1% unit increase over its earlier $73.50 / 30 lb record.
- A missing delivery fee is Missing, never zero. A missing product match, usable yield, minimum, stock or timely delivery withholds a price choice. Known numeric subtotals remain visible.
- Other planned order items only satisfy a minimum. They are not silently included in the cheese total. Delivery is counted once for this sample order. Tax, rebates, additional charges and whole basket optimization are outside this example.

Seven scenario buttons restore the same fictional 60 lb order and change one relevant condition. Product, delivery and order fields are also editable. The draft is a snapshot; it stays in this tab, can be edited and saved again, and is never sent. Reload or Reset sample clears it. Switching workflow tabs keeps the entered vendor data.

## Research informing the choices

These sources inform the design and comparison rules; they do not validate the fictional records or establish measured customer outcomes.

- [GS1 GTIN Management Standard](https://ref.gs1.org/standards/gtin-management/): product identity, declared content and case quantity require explicit attention. The demo uses a clearly fictional confirmed product mapping, not fabricated GTINs or supplier SKU equality. A mapping does not eliminate the need to check pack and recipe fit.
- [USDA Food Buying Guide, Appendix A](https://foodbuyingguide.fns.usda.gov/Content/TablesFBG/USDA_FBG_Appendix_A.pdf): preparation yield relates purchased quantities to the form used in a recipe. The demo exposes its 100% sample yield assumption rather than using a general yield as a restaurant measurement.
- [Nielsen Norman Group: 8 Design Guidelines for Complex Applications](https://www.nngroup.com/articles/complex-application-design/): expose additional controls in the context of the immediate task. The demo starts with prepared records and one action; product and ordering conditions expand when needed.

These are implementation judgments informed by the sources. Ten minute activation still requires observed sessions with real operators.

## Verification

Thirteen new vendor calculation tests cover both vendor histories, confirmed product mapping, pack changes, whole case quantities, fee reversal, missing fees, minimums, stock, delivery, usable yield and invalid values. The nine original invoice, labor and pour tests also pass. Production build and type checks pass locally.

Browser checks at 390 px exercised all seven scenarios without horizontal overflow, created and edited a handoff assignment, and verified labor and pour calculations. Public deployment and video evidence are recorded in PUBLIC-DEMO-RELEASE.md after release verification.

No live seats, OCR, connections, vendor messages, ongoing learning or verified savings are established by this demo.
