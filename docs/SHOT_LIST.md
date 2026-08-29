# Shot list — Never86 + Bolt hero

## Clip A — Tailgate Buy Now (15s, 9:16)
1. 0–3s  Crowd at tailgate, phone in hand, scroll. Native audio: crowd + sizzle.
2. 3–6s  Thumb taps **Buy Now** inside the in-feed card. Haptic pulse.
3. 6–9s  Card flips to checkout, location auto-fills "you're here".
4. 9–12s Matte-black Bolt van rolls up, driver (restaurant-feel) hands over chef tray.
5. 12–15s Overlay: Never86 + Bolt. Line: "Buy now. We bring it to you."

## Clip B — Chef handoff (15s)
Back door, chef passes tray to Bolt driver, nod, van pulls out. Warm kitchen light.

## Clip C — Super Bowl party (15s)
Living room, big screen, someone taps buy in-feed mid-game, food arrives at door mid-celebration.

## Stitch
```bash
ffmpeg -f concat -safe 0 -i clips.txt -c copy hero.mp4
```
