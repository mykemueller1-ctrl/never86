# DISPATCH DIRECTIVE — Manus → never86 / CTAP migration

> **For Dispatch (the browser-control agent on Myke's Mac).** Code (Claude in the cloud) cannot navigate Manus. This is your lane. Execute when the URL is reachable from Myke's browser.

---

## Mission

Myke has two Manus-deployed apps that contain the **full platform logic** he wants ported to our infrastructure. Both are Manus-hosted, behind authenticated sessions only he and you can reach. The goal: **export everything reachable**, normalize it, commit it to a **private location** (because it contains real operator and staff data — same brand-burn rule as Taco Bamba, even more sensitive given staff PII).

## The two targets

1. **https://never86d-buwjnwsn.manus.space/**
   - Myke's note: *"that one is almost finished"*
   - Operator-side near-final build of never86. Likely contains the full dashboard, agent matrix, and demo flows Myke wants reflected on never86.ai.
2. **`ctappizza.manus`** (likely `https://ctappizza.manus.space/` — verify exact subdomain when you open it)
   - Access code: **`8484`** (Myke supplied — likely a PIN to login, or part of a deeper URL path)
   - This is **CTAP — the full people platform** for **Community Tap & Pizza** (Storm Lake, Iowa)
   - Per `CTAP_MASTER_NOTES.md` (already in this repo on the `archive/ctap-people-platform` branch as snapshot from May 5): 41 staff, 7 departments, gamified shifts, knowledge brain, sales intel, food cost, scheduling — all the "for the people first" build Myke wants copied
   - Stack: React 19 + Express + tRPC + Drizzle + TiDB; auth via Manus OAuth + staff PIN

## What to export — in priority order

### From `never86d-buwjnwsn.manus.space`
1. **Page inventory** — every reachable route + a screenshot of each
2. **Component HTML/JSX exports** — the rendered shape of each page (for visual diff vs what's live on never86.ai)
3. **API endpoints called** — open browser DevTools → Network tab → record every API request the app makes during a normal session
4. **Any operator data displayed** — the demo numbers, screenshots, copy
5. **The exact navigation structure** — sidebar / header / dropdown menus (so we can mirror them on never86.ai)
6. **Any agent-related UI** — list of agents shown, how they're presented, dropdown layouts

### From `ctappizza.manus` (CTAP — the bigger pull)
1. **Login first** — use PIN `8484` (or whatever the access mechanism is at that subdomain)
2. **Page-by-page export** — every page reachable to every role (staff / manager / owner)
3. **The full data model** — for each list/grid/dashboard, capture the JSON the app receives (via Network tab)
4. **Knowledge Brain corpus** — the 389+ knowledge entries across 9 stations · export verbatim
5. **Recipe corpus** — 10 recipes + 42 ingredients · export
6. **Vendor data** — 78 vendor products (PFG, Sysco, Hughes, Fort Dodge, Sawyer's) · export
7. **Staff list** — 41 employees with departments, roles, hours, points/streaks/achievements · export
8. **EOD report submissions** — any historical submissions visible
9. **Schedule data** — current week + recent history
10. **The gamification config** — 12 achievement types, 6 reward tiers, leaderboard ranking logic

## Where to land it (**private** — not the public `never86` repo)

Two options; recommend (A) if it exists, (B) as fallback:

- **(A)** Push to **`mykemueller1-ctrl/never86d-beta-ctap`** (Myke's existing private repo, mentioned in prior session work). If it exists and is private, that's the home.
- **(B)** Create a new private repo `mykemueller1-ctrl/manus-mirror` and push there. Tag the README with the export date.

Folder structure inside the target repo:
```
/exports/
  /never86d-manus/
    /pages/
    /api-traces/
    /screenshots/
  /ctap-pizza-manus/
    /pages/
    /api-traces/
    /screenshots/
    /data/
      knowledge-brain.json
      recipes.json
      vendor-products.json
      staff-roster.json   <-- PII; mark "DO NOT EVER SHARE"
      eod-history.json
      schedules.json
      gamification-config.json
README.md   <-- the export manifest (date, methodology, any pages that failed to load)
```

## The hard rules

- **Nothing here lands in the public `never86` repo.** Staff names, PII, recipe IP, vendor pricing are all in scope. Public repo = brand-burn.
- **Do not modify the Manus apps.** Read-only navigation. Don't click "delete," "save," or any mutating action.
- **Screenshots for design, not for distribution.** Capture so Code can mirror the layout; don't post them anywhere.
- **API traces include auth tokens.** Strip Bearer tokens / cookies before commit. If you can't strip cleanly, redact the entire `Authorization` header column.

## When you're done

Push to the target repo (per (A) or (B) above) and ping Code with the repo URL. Code mirrors the structure into the never86.ai marketing surface (Agents dropdown, Quick wins dropdown, Outside-the-stack dropdown — already in place as of this PR) and stands up the CTAP people-platform side as its own surface (likely `/people` route, private-gated separately from `/command-center`).

— Code
