# Market research — where indie operators actually yell (2026)

Research-backed hunt priorities for Never86 hunter bots. **Listen first.** Humans send. Myke voice always.

Sources: operator forums, IRC/industry posts, TikTok/restaurant marketing playbooks, Never86 social pack, field work (Iowa / Victor lane).

---

## Channel rank (for **finding** pain, not posting ads)

| Rank | Channel | Why | Hunt method |
|---:|---|---|---|
| 1 | **Facebook groups** | Owners ask dumb-money questions here first; less performative than TikTok | Keyword alerts, daily scroll, Grok web search |
| 2 | **Reddit** | Long-form rants with numbers; r/restaurantowners is the canonical vent room | site:reddit.com searches, Grok web |
| 3 | **X** | Real-time spikes when a fee story breaks | Grok native X search |
| 4 | **TikTok comments** | Operators reply on rant videos; discovery is comment-thread not FYP ads | Search + read comments on operator-pain videos |
| 5 | **LinkedIn** | Myke authority posts + comment replies on owner/CFO posts | Myke account only, not Grok spray |

**Do not:** spray TikTok FYP with product ads. **Do:** find operator pain in comments and reply like a peer.

---

## What they're actually saying (pain language — use in queries)

From Reddit/operator forums and fee benchmarking (2026):

- "Commission rate isn't the real number" / "effective take rate"
- "30% plan actually costs 40%"
- "Restaurant-funded promos" / "paying for my own discounts"
- "Payout doesn't match" / "deposit short"
- "DoorDash is a second restaurant" (separate menu, blame on us)
- "MarginEdge / R365 doesn't match" / "garbage in"
- "Delivery is customer acquisition not profit"
- Grubhub: marketing + delivery + processing + **promotions opt-in** stacking (Giuseppe Badalamenti receipt story pattern)

**Hook that matches pain:** one redacted statement → every line separated → https://www.never86.ai/audit

---

## Reddit — best subs and rules

### Primary (hunt daily)

| Subreddit | Why | Drop risk |
|---|---|---|
| **r/restaurantowners** | Owner venting, fee threads, labor — #1 | Consultants pitching |
| **r/restaurateur** | Smaller, owner-weighted | Same |
| **r/smallbusiness** | "Restaurant" + delivery fee threads | Non-restaurant noise |
| **r/barowners** | Bar + delivery/taproom | Good for bar vertical |
| **r/FoodTrucks** | Truck owners, Grubhub receipt culture | Smaller volume |

### Secondary (weekly)

| Subreddit | Why | Caution |
|---|---|---|
| r/KitchenConfidential | High volume | **Mostly staff not owners** — drop unless clear owner flair |
| r/Entrepreneur | Occasional restaurant threads | Low signal |
| r/accounting | Accountants asking about restaurant clients | **Reply Desk** lane, not hunter ICP |

### Reddit hunt tactics

1. Search **last week** only — stale threads waste replies
2. **Answer in thread** before any link — sub rules hate drive-by links
3. One link max; disclose built by an operator
4. Never argue with marketplace employees or drivers
5. Upvote-worthy comments beat copy-paste — rewrite template per thread

**Queries:** `docs/gtm/hunter-bots/search-queries.md` + `reddit-hunt.md`

---

## TikTok — hunt vs post (different jobs)

### Hunt (Head of Marketing)

Operators show up in:

- **Comments** on videos about DoorDash fees, "restaurant failing," margin rants
- **Search** — "DoorDash fees restaurant owner," "restaurant profit margins," "3rd party delivery killing restaurants"
- **Creators to monitor (comment sections):** operator-education accounts, not food bloggers
- **Victor lane:** @ontheline515 — Iowa operators; engage where **owners** comment, not tourists

**Search hashtags (discovery, not for spam-posting):**

- `#restaurantowner` `#restaurantlife` `#restauranttok` `#foodtok`
- `#smallbusinessowner` `#margins` `#doordash` `#ubereats`
- Iowa: `#iowacheck` `#desmoines` `#midwest` + city names when visible

**Best practice (2026 research):** TikTok is a **search engine** for under-35 discovery — operators also **search** for help. Captions/comments with city + pain rank. For **hunt**, mirror that: search natural language pain phrases, not hashtag dumps.

### Post (GTM Head — later, permissioned proof only)

- **515 On The Line:** blunt hook, 15–35 sec, operator attention
- **Never 86'd / Community Tap:** product proof after real receipt
- Link in bio + comment **AUDIT** — never multiple CTAs
- Raw > polished; 3 sec hook
- Tracked URL from `100-statement-social-pack.md`

**Hunter does not post TikToks.** GTM drafts after permissioned audit.

Full playbook: `tiktok-hunt.md`

---

## Facebook — named groups (verify membership)

| Group | Link / find | Notes |
|---|---|---|
| **Restaurant Owners & Managers** | facebook.com/groups/RestaurantOwnersAndManagers | Large ROMG group; spam-filtered |
| **Restaurant Owners & Managers** (alt landing) | restaurantfbgroup.com → FB | Same ecosystem |
| Search: "independent restaurant owners" | FB search | Join 2–3 max; don't join 20 |
| Search: "[your city] restaurant owners" | Local | Iowa: Des Moines, Fort Dodge area groups if they exist |
| **Myke action:** add 3 groups you already read to `facebook-groups.local.md` (gitignored) | Private names |

---

## X — Grok strength

- Real-time fee news spikes
- Search operators not drivers (`-driver -dasher`)
- Reply within thread; Myke voice
- Victor / Iowa network when visible

---

## Verticals to overweight (ICP)

| Vertical | Pain signal | Where |
|---|---|---|
| **Pizza** | 3P + promo stack, thin margin | FB, Reddit, TikTok comments |
| **Bar / taproom** | Delivery vs on-prem, pour cost | r/barowners, FB |
| **QSR / fast casual 1–3 unit** | Labor + 3P | Reddit, X |
| **MarginEdge / R365 / 7shifts** | "Numbers don't tie" | Reddit, FB ops groups |
| **Iowa / Midwest** | Local operator network | 515, FB local, Grok geo search |

---

## Competitive noise to drop

- Multi-unit PE (5–100+ locations) — OPA index lane, not our ICP
- Delivery **drivers** forums
- SaaS vendors commenting on every thread
- "I built an app for restaurants" founders — not operators

---

## Measurement (what "win" means)

Not views. Qualified behavior:

1. Reply sent (human)
2. Operator clicked /audit (UTM)
3. Statement submitted
4. Audit completed

Log: `lead-ledger.template.md`

---

## Next files

- `reddit-hunt.md` — sub rules + daily routine
- `tiktok-hunt.md` — search + comment hunt routine
- `facebook-groups.md` — join list + scroll routine
- `objections.md` — reply without sounding like sales
- `handoff-to-sales.md` — Marketing → Sales when they bite
- `utm-links.md` — tracked /audit URLs per channel
