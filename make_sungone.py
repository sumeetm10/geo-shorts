"""One-off: "What if the Sun disappeared?"

    python make_sungone.py                build (acted voice, edge-tts if it fails)
    python make_sungone.py --free --props quick props for stills
    python make_sungone.py --post 2026-10-04T13:15Z   build and schedule it

Facts, read from Wikipedia at build time (the build stops if they change):
- Sun: light takes "about 8 minutes and 20 seconds" to reach Earth.
- Speed of gravity: changes in gravity travel at the speed of light, so Earth
  keeps orbiting the vanished Sun for the same 8 min 20 s.
- Earth's orbit: orbital speed "averages 29.78 km/s" - Earth would carry on in a
  straight line at about 30 km a second.
- Rogue planet: a planet with no star, drifting through space.
Plus plain physics: the Moon shines only by reflected sunlight; plants need
light to photosynthesise; the Sun has billions of years of life left (it is
4.6 billion years old, about halfway through its main-sequence life).
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
    ("You wouldn't even notice if the Sun vanished. Not for 8 minutes.", "hook"),
    ("Its last light is still on the way. So is its gravity.", "stop"),
    ("Then, 8 minutes and 20 seconds later: darkness.", "cold"),
    ("Earth shoots off in a straight line at nearly 30 km a second.", "walk"),
    ("Fast enough to cross the whole planet in 7 minutes.", "reveal"),
    ("But look up. The stars are still shining.", "cheer"),
    ("The planets go dark one by one. Jupiter after an hour, Saturn after two.", "reveal"),
    ("Deep-sea vent life carries on. It never needed sunlight.", "walk"),
    ("Earth becomes a rogue planet. Our galaxy may already have billions.", "payoff"),
    ("Subscribe. Because remember...", "cta"),
]
AT = dict(light=1, dark=2, fly=3, cross=4, stars=5, planets=6, vents=7, rogue=8)
# Light-time floor for a planet to go dark after the Sun does, as seen from Earth:
# (Sun->planet + planet->Earth) / c >= (a + a - 1 AU) / c, 1 AU of light = 8.317 min.
# Jupiter 5.20 AU (perihelion 4.95): >= 74 min; Saturn 9.59 AU (perihelion 9.0): >= 141 min.


def check_facts():
    need = {"Sun": "8 minutes and 20 seconds", "Earth's orbit": "diameter in 7 minutes",
            "Speed of gravity": "speed of light", "Rogue planet": "billions to trillions of rogue planets",
            "Hydrothermal vent": "instead of light", "Jupiter": "5.20 AU", "Saturn": "9.59 AU"}
    for title, text in need.items():
        if text.lower() not in wiki.page(title)["text"].lower():
            raise SystemExit(f"Wikipedia '{title}' no longer says '{text}' - check the script")


def main():
    check_facts()
    job = ROOT / "data" / "jobs" / "sungone"
    job.mkdir(parents=True, exist_ok=True)
    free = "--free" in sys.argv
    vo, voice = narrate.narrate([l for l, _ in LINES], [k for _, k in LINES], job,
                                style=None if free else "explore")
    secs = round(vo[-1]["end"] + 0.45, 2)
    props = {"vo": vo, "hook": {"top": "THE SUN VANISHED", "bottom": "WOULD YOU NOTICE?", "badge": "NOT FOR 8 MINUTES"},
             "at": AT, "durationInSeconds": secs}
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    if "--props" in sys.argv:
        print([round(v["start"], 1) for v in vo], secs)
        return
    print(f"[render] {secs:.1f}s")
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("SunGone", job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="surprising", seed=21)
    out = ROOT / "data" / "out" / "sungone.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out, bed_db=-9)
    found = [q for q in seo.suggestions("what if the sun disappeared") if len(q) < 60][:6]
    meta = {"kind": "whatif", "file": str(out),
            "title": "If the Sun Vanished, You Wouldn't Notice for 8 Minutes ☀️",
            "description": ("What would really happen if the Sun vanished?\n\n"
                            "- Sunlight takes about 8 minutes and 20 seconds to reach Earth - and changes in "
                            "gravity travel at the same speed, so for 8 min 20 s nothing would change\n"
                            "- Then Earth would fly off in a straight line at 29.78 km/s - fast enough to cross "
                            "its own diameter in 7 minutes\n"
                            "- The stars would keep shining; the planets, which only reflect sunlight, would go "
                            "dark one by one (Jupiter after over an hour, Saturn after over two)\n"
                            "- Life around deep-sea vents runs on chemicals, not light\n"
                            "- The Milky Way may have billions to trillions of rogue planets\n\n"
                            "Which what-if should I do next? Tell me in the comments \U0001F447\n\n"
                            "#space #sun #earth #shorts"),
            "tags": list(dict.fromkeys(["what if the sun disappeared", "sun disappeared", "what if the sun vanished",
                                        *found, "rogue planet", "space", "sun", "earth", "science", "shorts"])),
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
