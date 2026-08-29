# Never86 Chip Day + Bolt — Hero Video & Demo

Enterprise-grade demo for restaurant owners: in-feed **Buy Now** (never leave TikTok/IG), chef-driven food, Bolt last-mile delivery to the user's current location. No DoorDash, no third-party operator tax.

## What's in this branch

- `demo/` — interactive vertical (9:16) web demo of the full flow
- `scripts/generate_hero_clips.py` — Grok Imagine Video 1.5 generation for 3 hero clips (15s, 1080p, 9:16, native audio)
- `scripts/prompts/` — exact prompts per clip
- `docs/SHOT_LIST.md` — shot list, motion notes, stitch order
- `docs/COST.md` — cost estimate

## Run the demo

```bash
cd demo && npm install && npm run dev
```

Open the local URL on a phone or narrow the browser to 9:16.

## Generate the hero clips

```bash
export XAI_API_KEY=your_key
python scripts/generate_hero_clips.py
```

Outputs land in `out/`. Stitch with ffmpeg (notes in SHOT_LIST.md).

## Cost (Grok Imagine Video 1.5, 1080p)

~$0.30/sec × 15s = **~$4.50 per clip**. Three clips ≈ **$13.50** total. See docs/COST.md.

## Stack

- Demo: Next.js + Tailwind + Framer Motion (vertical, human-feel UI)
- Video: xAI `grok-imagine-video-1.5` via REST `/v1/videos/generations`
- Delivery: Bolt (10 drivers/unit, restaurant-feel) + Shipday routing brain
