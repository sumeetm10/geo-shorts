"""One-off: "How do you get to the deepest point on Earth?" (free edge-tts voice).

Facts, all fixed here (no model writes them):
- Challenger Deep, south end of the Mariana Trench: ~10,935 m (NOAA 2021), at
  11.37 N 142.59 E; Guam 13.44 N 144.79 E -> 332 km apart (said "over 300 km").
- No sunlight below ~1,000 m; the Titanic wreck lies at ~3,800 m.
- Everest 8,849 m -> 2,086 m of water still above its summit ("2 km to spare").
- Pressure at the bottom ~1,080 atmospheres ("over 1,000 times").
- Fewer people have reached it than have been to space (dozens vs 600+).
"""
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\ACER\OneDrive\Desktop\geo-shorts")
sys.path.insert(0, str(ROOT))
sys.stdout.reconfigure(encoding="utf-8")
import geo  # noqa: E402
import mix  # noqa: E402
import narrate  # noqa: E402
import score  # noqa: E402
from make_walk import render  # noqa: E402

SLUG = "deepest-point"
JOB = ROOT / "data" / "jobs" / SLUG
MEDIA_REL = f"jobs/{SLUG}"
MEDIA = ROOT / "media" / MEDIA_REL
OUT = JOB / "deepest-point.mp4"
JOB.mkdir(parents=True, exist_ok=True)
MEDIA.mkdir(parents=True, exist_ok=True)

GUAM = (144.79, 13.44)
DEEP = (142.59, 11.37)

LINES = [
    ("Could you actually get to the deepest point on Earth?", "hook"),
    ("Fly to Guam, a tiny island in the Pacific.", "walk"),
    ("Sail over 300 km, to the Mariana Trench.", "walk"),
    ("Dive in a special sub. By 1,000 metres, sunlight is gone.", "cold"),
    ("3,800 metres: as deep as the Titanic.", "walk"),
    ("Hours later, you hit the bottom. Nearly 11 km down.", "payoff"),
    ("Mount Everest would fit here, with 2 km to spare.", "reveal"),
    ("The pressure: over 1,000 times the surface.", "reveal"),
    ("Fewer people have been here than to space.", "payoff"),
    ("Subscribe, so next time someone asks you...", "cta"),
]
AT = dict(guam=1, sail=2, dive=3, titanic=4, bottom=5, everest=6, pressure=7, people=8, loop=9)


def pt(win, lonlat):
    x, y = win.px(*lonlat)
    return {"x": round(x, 1), "y": round(y, 1)}


wide = geo.fit_window([(124, 33), (156, -6)], pad=0.05, min_dlat=40, max_dlat=48)
near = geo.fit_window([GUAM, DEEP], pad=1.2, min_dlat=6.5, max_dlat=8)
geo.crop(wide.lon0, wide.lon1, wide.lat0, wide.lat1, MEDIA / "wide.jpg")
geo.crop(near.lon0, near.lon1, near.lat0, near.lat1, MEDIA / "near.jpg")

# the trench runs east from the Deep, just south of Guam: label it along that line
a, b = near.px(142.3, 11.2), near.px(145.2, 11.9)
angle = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
lab = near.px(143.7, 10.95)

FREE = "--free" in sys.argv                      # edge-tts only, keeps the Gemini voice quota
print("[voice ] " + ("edge-tts (free)" if FREE else "acted (Gemini), edge-tts if it fails"))
vo, voice = narrate.narrate([l for l, _ in LINES], [k for _, k in LINES], JOB,
                            style=None if FREE else "dive")
secs = round(vo[-1]["end"] + 0.45, 2)

props = {
    "vo": vo,
    "wide": {"image": f"{MEDIA_REL}/wide.jpg", "deep": pt(wide, DEEP)},
    "near": {"image": f"{MEDIA_REL}/near.jpg", "guam": pt(near, GUAM), "deep": pt(near, DEEP),
             "trench": {"x": round(lab[0], 1), "y": round(lab[1], 1), "angle": round(angle, 1)}},
    "at": AT,
    "hook": {"top": "The deepest point on Earth", "bottom": "could you get there?"},
    "durationInSeconds": secs,
}
(JOB / "props.json").write_text(json.dumps(props), encoding="utf-8")
print(f"[render] {secs:.1f}s  wide={props['wide']['deep']} near guam={props['near']['guam']} "
      f"deep={props['near']['deep']} trench={props['near']['trench']}")

if "--props" in sys.argv:
    sys.exit(0)
subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True)
silent = JOB / "silent.mp4"
render("GeoDive", JOB / "props.json", silent)
bed = JOB / "score.wav"
score.build_score(bed, secs + 0.5, tone="curious", seed=7)
mix.mix(silent, voice, bed, OUT, bed_db=-9)
print(f"[done  ] {OUT}  ({mix.duration(OUT):.1f}s)")

import seo  # noqa: E402
found = [q for q in seo.suggestions("deepest point on earth") + seo.suggestions("mariana trench")
         if any(w in q for w in ("deep", "mariana", "trench", "challenger"))][:6]
meta = {
    "kind": "dive", "file": str(OUT),
    "title": "How Do You Get to the Deepest Point on Earth? 🌊",
    "description": (
        "Could you actually get to the deepest point on Earth? Fly to Guam, sail over 300 km "
        "to the Mariana Trench, then dive almost 11 km down to Challenger Deep in a submersible.\n\n"
        "- Challenger Deep: about 10,935 m deep (NOAA estimate)\n"
        "- No sunlight below about 1,000 m\n"
        "- The Titanic lies at about 3,800 m\n"
        "- Mount Everest (8,849 m) would fit, with about 2 km of water above it\n"
        "- Pressure at the bottom: over 1,000 times the surface\n"
        "- Fewer people have been there than to space\n\n"
        "Where should we go next? Tell me in the comments 👇\n\n"
        "#geography #ocean #marianatrench #shorts"),
    "tags": list(dict.fromkeys(["deepest point on earth", "mariana trench", "challenger deep",
                                "how deep is the ocean", "deep sea", "ocean depth", "submarine",
                                "titanic depth", "mount everest", *found, "geography", "maps",
                                "shorts"])),
}
(JOB / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
if "--post" in sys.argv:
    from datetime import datetime, timezone
    import upload_geo
    at = datetime(2026, 9, 29, 5, 15, tzinfo=timezone.utc)          # 11:00 Nepal
    vid = upload_geo.upload(OUT, meta, "public", publish_at=at)
    print(f"[posted] https://youtu.be/{vid} scheduled {at:%Y-%m-%d %H:%M} UTC")
    (JOB / "posted.json").write_text(json.dumps({"youtube_id": vid, "publish_at": at.isoformat()}),
                                     encoding="utf-8")
