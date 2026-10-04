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
    ("What if the Sun disappeared right now?", "hook"),
    ("For 8 minutes and 20 seconds, nothing would change.", "stop"),
    ("That's how long sunlight takes to reach us. Even gravity waits.", "reveal"),
    ("Then the sky goes black. The Moon goes dark too.", "cold"),
    ("Earth flies off in a straight line, at about 30 km a second.", "walk"),
    ("Plants stop making food the moment the light is gone.", "reveal"),
    ("Day after day, the whole planet gets colder.", "cold"),
    ("Earth becomes a rogue planet, drifting alone through the dark.", "payoff"),
    ("Luckily, the Sun will keep shining for billions of years.", "cheer"),
    ("Subscribe, so next time someone asks you...", "cta"),
]
AT = dict(delay=1, why=2, dark=3, fly=4, plants=5, cold=6, rogue=7, safe=8)


def check_facts():
    need = {"Sun": "8 minutes and 20 seconds", "Earth's orbit": "29.78 km/s", "Speed of gravity": "speed of light",
            "Rogue planet": "rogue planet"}
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
    props = {"vo": vo, "hook": {"top": "THE SUN", "bottom": "DISAPPEARS?"}, "at": AT, "durationInSeconds": secs}
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
            "title": "What If the Sun Disappeared Right Now? ☀️",
            "description": ("What would happen if the Sun vanished?\n\n"
                            "- Sunlight takes about 8 minutes and 20 seconds to reach Earth - and changes in "
                            "gravity travel at the same speed, so for 8 min 20 s nothing would change\n"
                            "- Then Earth would fly off in a straight line at about 30 km a second "
                            "(its orbital speed averages 29.78 km/s)\n"
                            "- The Moon would go dark: it only reflects sunlight\n"
                            "- Earth would become a rogue planet\n\n"
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
