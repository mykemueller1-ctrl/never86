# Tenant seeds

One JSON file per operator tenant. Load with the seed migration for that tenant.

## New American Grill (Max Turner)

- File: `new-american-grill.json`
- Location: 5700 VT Route 100, Londonderry, VT 05148
- Owner: Max Turner, chef/owner since January 2004
- Tagline: Vermont soul, world flavor

### What's in the file
- Store profile: address, phone, hours, cuisine, service modes
- Revenue centers with Aug 24-30 net sales: Bar, Dining Room, Music Room, Outside
- Week snapshot: net sales, voids, cash shortage, labor hours
- Full public menu with prices where available (entrees, pasta, BBQ, burgers, sandwiches, salads, soups/starters, desserts, kids, cocktails, beer, wine)
- Sources cited

### How to load
1. Run the tenant seed migration for `new-american-grill`.
2. It inserts the tenant row, revenue_center rows, and menu_items rows from this JSON.
3. Confirm prices with Max — public menu and Toast export can differ by daypart.

### Do not
- Do not include Taco Bamba data in this tenant.
- Do not publish prices without Max's confirmation.
