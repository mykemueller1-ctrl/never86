# Never 86'd | Cursor / any agent

Public site: https://www.never86.ai
MCP: `https://www.never86.ai/api/mcp`
`.cursor/mcp.json` already points here. Enable it in Cursor Settings if the cloud agent has not loaded it.

Two products stay separate:

- **Action Shift** is the free one-seat, one-store product. Never call it Pulse. It does not grow a multi-store view, a roll-up, or Command Center pricing.
- **Never86.ai** (this repo, this site) is the multi-unit build for operators with 1 to 5 units, stretching to 9. Per-unit views and a simple all-units roll-up live here. Pricing for extra units is TBD until a price already in this repo is approved for the page. Do not invent a price. Do not use the Command Center name.

## Product
- Find the leak. Assign the fix. Keep the receipt.
- **One location + one seat is free.** Extra seats and extra units: pricing TBD on the public page.
- The free one-seat path is Action Shift. The board on `/close` is Never86.ai.
- Surface: Z/POS, voids, labor, tips, invoices, vendors, beverage, catering, 3P, shift.
- **3P is the Google door.** Homepage is the OS. `/trial` is the seat. `/audit` is the 60-second 3P proof. `/close` is the multi-unit board.
- Not R365's GL. Not a merchant portal login.

## Close board
Drop files, then the sorting summary, then the tally (How today went, category tiles, daily numbers, weekly prime cost), then at most 3 actions.

Every figure is Verified, Estimated, or Missing. A blank cell stays Missing. It is not $0. Do not invent dollars, targets, or a finished week.

Tally categories: food/COGS, beverage, paper/packaging, labor, delivery fees, other. Week dollars and percent of sales sit side by side. A target percent is optional and has no default. Daily over or under is actual spend minus (target percent times that day's sales), rounded to whole dollars and whole percents.

Food cost and prime cost need a count (beginning plus purchases minus ending) or a food-cost column on the file. Invoice lines are purchases. They can show on the food tile as spend, and they are not COGS. No count, no food cost. POS is not payout. An incomplete week stays Open.

Callouts use plain operator language. The biggest dollar misses come first and feed the 3 actions. Each action has an owner, a due date, an expected outcome, and a label.

## Loop
capture → parse → truth-gate → normalize → decide (formulas first) → assign (≤3, usually 1) → human approve → prove → learn → repeat

## Do not
- Call Action Shift "Pulse"
- Use Command Center pricing or the Command Center name on this product
- Use the word desk in product copy
- Accuse anyone of theft or skimming, or treat a name as a suspect
- Say a specific operator uses Toast
- Use em dashes in copy
- Invent money, a target percent, or a completed close
- Put Community Tap private numbers, names, PINs, or mail on this site
- Guarantee recovery
- Shrink the brand to a fee calculator
- Start another Never86 repo
- Auto-send mail or post
- Change never86d-beta-ctap, never86-action-shift-live, or app.never86.app. Those stay read-only. No redirect, link takeover, or DNS change for app.never86.app.

Active job: issue #122. docs/CURSOR-GTM.md. docs/STACK-MAP.md. Rules: `.cursor/rules/action-shift.mdc`.
