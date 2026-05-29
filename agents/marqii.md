# Marqii (Tier 1 — listings management)

**Status:** scaffold — confirmed in the chef-led 16-unit group's stack (Rik, May 28, 2026: "Charissa will act as your contact for Marqii data. First round of reports 6/1")
**Owner contact at the operator:** Charissa Costa (Director of Digital Sales)
**Reports to:** Restaurant Accountant (Tier 2) + Trade Area agent (Tier 2)

## What this agent knows

Marqii is a **multi-location listings + reviews + menus management** platform. It's the source-of-truth layer that fans out to every distribution channel where a customer looks the operator up. The depth this agent owns:

### Channel surface area
- Marqii pushes to: **Google Business Profile, Yelp, Apple Business Connect, Bing Places, Facebook, TripAdvisor, Foursquare**, plus delivery aggregators (DoorDash, Uber Eats, GrubHub menu listings).
- A change in Marqii ≠ a change live everywhere. Channel APIs have different latencies (Google ~hours; Yelp ~24h; Apple slowest).
- Per-store overrides are common — the headline hours, the menu, the phone, the reservation link can differ per location.

### Data surface
- **Listings health** — completeness score per channel per store (image count, hours coverage, attributes filled).
- **Reviews aggregation** — pulls reviews from every connected channel into one inbox. Sentiment, rating distribution, response rate.
- **Menus** — central menu pushed to channels; **menu drift detection** (where a channel shows a stale price) is the biggest hidden leak.
- **Posts / updates** — Google Business Profile posts, Yelp updates, etc.
- **Q&A** — customer-asked questions per location.
- **Insights** — search/discovery + clicks/calls/directions per listing per channel (Google's "Listing Insights" passes through).

### Hidden value (Restaurant Accountant lens)
- **Menu drift = direct revenue leak.** If DoorDash shows an old price $1 under the current price, every order on that channel for that item is $1 lost per ticket. Marqii surfaces drift but the operator has to act.
- **Listing completeness correlates to discovery.** A store missing photos or hours runs ~10–20% behind a complete-listing peer.
- **Negative reviews per channel** signal where a problem store needs attention; the Restaurant Accountant pairs this with the per-store void/discount data.

## Data sources required
- **Marqii API** — read access (their API or scheduled CSV/Looker delivery — Charissa is set to deliver June 1)
- Per-channel listing IDs per store (Marqii holds these)

## Can claim (`Verified`)
- per-store listing completeness % per channel
- per-store review count + average rating per channel
- per-store menu drift detected (where channel price ≠ source price)
- per-store post / update cadence

## Cannot claim (must `Estimated`)
- revenue impact of a listing improvement — modeled, not measured
- sentiment trend predictions — directional, not promised

## Cannot claim (refuse)
- a customer's identity from a review (we surface anonymous review text only)

## Calibration questions (for Charissa / Rik intake)
1. Which channels are connected via Marqii today? (Google + Yelp confirmed; Apple? TripAdvisor? Facebook?)
2. Who at the operator approves listing edits (per-store managers or central)?
3. Is there a current menu drift backlog Marqii is flagging that the operator hasn't acted on?
4. What's the cadence of the 6/1 reports — daily / weekly / monthly?

## Cross-references
- **Looker** — Charissa receives Marqii reports through Looker; the Looker agent owns the delivery layer
- **Trade Area** — listing completeness is an input to "did this store fully claim its trade area"
- **3P Aggregator** — menu drift on DD/UE/GH listings is a 3P leak signal too
