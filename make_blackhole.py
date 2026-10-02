"""One-off: "What if a black hole passed by Earth?"

    python make_blackhole.py            build (acted voice, edge-tts if it fails)
    python make_blackhole.py --free     free voice
    python make_blackhole.py --post 2026-10-03T09:15Z   build and schedule it

Facts (checked, not generated):
- Gaia BH1: about 1,560 light-years away, the nearest known black hole "as of
  2026" - read from Wikipedia at build time; the build stops if that changes.
- A black hole of 10 solar masses has a Schwarzschild radius of 2.95 km per
  solar mass = 29.5 km, so it is about 60 km across.
- At the Sun's distance its pull is 10 times the Sun's (gravity scales with mass).
- Tidal break-up (Roche) distance for Earth around 10 solar masses:
  R_earth * (2 M/m)^(1/3) = 6,371 km * (2 * 3.3e6)^(1/3) ~ 1.2 million km
  (fluid estimate ~2.3 million km), so "closer than a million km" tears it apart.
- No known black hole is on course for the Solar System.
Black holes give off no light of their own; an isolated one is seen only by how
it bends the light behind it - which is what the video draws.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import mix  # noqa: E402
import narrate  # noqa: E402
import score  # noqa: E402
import seo  # noqa: E402
import wiki  # noqa: E402
from make_walk import render  # noqa: E402

LINES = [
    ("What if a black hole passed by Earth?", "hook"),
    ("You wouldn't see it coming. Black holes give off no light.", "cold"),
    ("The nearest one we know, Gaia BH1, is 1,560 light-years away.", "walk"),
    ("Now imagine one with 10 times the Sun's mass drifting in.", "stop"),
    ("It would be only about 60 km wide.", "reveal"),
    ("But even as far away as the Sun, it would pull 10 times harder.", "reveal"),
    ("That could fling Earth out of its orbit, into the cold.", "cold"),
    ("Closer than a million kilometres, it would tear Earth apart.", "payoff"),
    ("Luckily, none is known to be heading our way.", "cheer"),
    ("Subscribe, so next time someone asks you...", "cta"),
]
AT = dict(invisible=1, nearest=2, mass=3, size=4, pull=5, fling=6, rip=7, safe=8)
LABELS = {"nearest": "GAIA BH1", "nearestSub": "1,560 light-years away", "size": "≈ 60 km",
          "rip": "TORN APART", "safe": "NONE HEADING OUR WAY"}


def check_facts():
    t = wiki.page("Gaia BH1")["text"]
    if "1,560 light-years" not in t or "nearest known" not in t:
        raise SystemExit("Wikipedia no longer says Gaia BH1 is the nearest known at 1,560 ly - rewrite line 3")


def main():
    check_facts()
    job = ROOT / "data" / "jobs" / "blackhole"
    job.mkdir(parents=True, exist_ok=True)
    free = "--free" in sys.argv
    vo, voice = narrate.narrate([l for l, _ in LINES], [k for _, k in LINES], job,
                                style=None if free else "explore")
    secs = round(vo[-1]["end"] + 0.45, 2)
    props = {"vo": vo, "hook": {"top": "What if a black hole", "bottom": "passed by Earth?"},
             "at": AT, "labels": LABELS, "durationInSeconds": secs}
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    print(f"[render] {secs:.1f}s")
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("BlackHole", job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="surprising", seed=11)
    out = ROOT / "data" / "out" / "blackhole.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out, bed_db=-9)
    found = [q for q in seo.suggestions("what if a black hole") if len(q) < 60][:6]
    meta = {"kind": "whatif", "file": str(out),
            "title": "What If a Black Hole Passed by Earth? \U0001F573️",
            "description": ("What would happen if a black hole drifted past Earth?\n\n"
                            "- The nearest known black hole, Gaia BH1, is about 1,560 light-years away\n"
                            "- A black hole of 10 Suns is only about 60 km across\n"
                            "- At the Sun's distance it would pull 10 times harder than the Sun\n"
                            "- Closer than about a million km, its tides would tear Earth apart\n\n"
                            "Which what-if should I do next? Tell me in the comments \U0001F447\n\n"
                            "#space #blackhole #earth #shorts"),
            "tags": list(dict.fromkeys(["what if a black hole passed by earth", "black hole", "gaia bh1",
                                        "black hole near earth", *found, "space", "earth", "science", "shorts"])),
            "lines": [l for l, _ in LINES]}
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {out}  ({mix.duration(out):.1f}s)")
    if "--post" in sys.argv:
        import upload_geo
        at = datetime.strptime(sys.argv[sys.argv.index("--post") + 1], "%Y-%m-%dT%H:%MZ").replace(tzinfo=timezone.utc)
        vid = upload_geo.upload(out, meta, "public", publish_at=at)
        print(f"[posted] https://youtu.be/{vid} scheduled {at:%Y-%m-%d %H:%M} UTC")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
