#!/usr/bin/env python3
"""Generate Never86 + Bolt hero clips with Grok Imagine Video 1.5.

Requires: export XAI_API_KEY=...
Pricing: ~$0.30/sec at 1080p -> ~$4.50/clip, ~$13.50 for all three.
"""
import os, time, json, requests

API = "https://api.x.ai/v1/videos/generations"
KEY = os.environ["XAI_API_KEY"]
HDR = {"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"}

CLIPS = {
  "A_tailgate_buynow": {
    "prompt": (
      "Vertical 9:16, 1080p, cinematic, native audio. A packed tailgate party at golden hour, "
      "crowd cheering, grill smoke. A young woman holds her phone, thumb taps a glowing 'Buy Now' "
      "button inside a TikTok-style in-feed video card — the card never leaves the scroll. "
      "Checkout flips open, location auto-fills 'you are here'. Cut to a matte-black Bolt van "
      "rolling up; a driver in a clean black uniform hands her a chef-driven food tray. "
      "She smiles. Text overlay fades in: Never86 + Bolt. Voiceover: 'Buy now. We bring it to you.' "
      "Photorealistic humans, shallow depth of field, warm practical lighting."
    ),
    "duration": 15, "aspect_ratio": "9:16", "resolution": "1080p",
  },
  "B_chef_handoff": {
    "prompt": (
      "Vertical 9:16, 1080p. Restaurant back door, warm kitchen light spilling out. "
      "A chef in whites passes a tray of chef-driven food to a Bolt driver in black. "
      "They exchange a nod. The matte-black van pulls away down the alley. "
      "Photorealistic, handheld intimacy, no logos except a subtle Never86 pin."
    ),
    "duration": 15, "aspect_ratio": "9:16", "resolution": "1080p",
  },
  "C_superbowl_party": {
    "prompt": (
      "Vertical 9:16, 1080p. A living room packed for the Super Bowl, big screen, snacks. "
      "Mid-game, a guest taps 'Buy Now' inside the in-feed on their phone. "
      "Moments later a knock at the door — Bolt driver hands over hot chef food. "
      "The room erupts. Overlay: Never86 + Bolt. Native crowd audio."
    ),
    "duration": 15, "aspect_ratio": "9:16", "resolution": "1080p",
  },
}

def start(name, spec):
    r = requests.post(API, headers=HDR, json={"model": "grok-imagine-video-1.5", **spec})
    r.raise_for_status()
    return r.json()["request_id"]

def poll(rid):
    while True:
        s = requests.get(f"https://api.x.ai/v1/videos/{rid}", headers=HDR).json()
        if s.get("status") == "done":
            return s
        time.sleep(5)

def main():
    os.makedirs("out", exist_ok=True)
    for name, spec in CLIPS.items():
        print(f"Starting {name}...")
        rid = start(name, spec)
        res = poll(rid)
        url = res.get("url") or res.get("video_url")
        print(name, "->", url)
        with open(f"out/{name}.json", "w") as f:
            json.dump(res, f, indent=2)

if __name__ == "__main__":
    main()
