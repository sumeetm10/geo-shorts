"""One-off: "What if the Moon disappeared?"

    python make_moongone.py                build (acted voice, edge-tts if it fails)
    python make_moongone.py --free --props quick props for stills
    python make_moongone.py --post 2026-10-08T13:15Z   build and schedule it

Facts, read from Wikipedia at build time (the build stops if they change):
- Tide: the Sun causes tides too; its tidal force is "only 46% as large as the
  lunar" - so with the Moon gone, tides shrink to under half their usual size.
- Moon: "the brightest celestial object in Earth's night sky".
- Coral: "Mass coral spawning often occurs at night on days following a full moon".
- Solar eclipse: the Sun is about 400 times the Moon's diameter and about 400
  times its distance - which is why the Moon can exactly cover it.
- Axial tilt: "The Moon has a stabilizing effect on Earth's obliquity"; even
  without it (2011 simulations) the tilt might vary "by about 20-25°".
- Milankovitch cycles: Mars "has no moon large enough to stabilize its
  obliquity, which has varied from 10 to 70 degrees".
- Lunar distance: the Moon is moving away "at an average rate of 3.8 cm" a year,
  measured by the Lunar Laser Ranging experiment (the laser pulse on screen).
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
    ("If the Moon vanished, the tides would not stop.", "hook"),
    ("The Sun pulls on our oceans too. Just 46% as hard.", "reveal"),
    ("So tides would shrink to less than half their usual size.", "walk"),
    ("And the brightest thing in our night sky? Gone.", "cold"),
    ("Corals that spawn after a full moon would lose their calendar.", "walk"),
    ("Total solar eclipses would end forever.", "stop"),
    ("They only work because the Sun is 400 times wider, and 400 times farther away.", "reveal"),
    ("Without the Moon, Earth's tilt could swing by 20 degrees or more.", "walk"),
    ("Mars has no big moon. Its tilt has swung from 10 to 70 degrees.", "reveal"),
    ("The twist? The Moon is already leaving us. 3.8 centimetres every year.", "payoff"),
    ("Subscribe, before it's gone.", "cta"),
]
AT = dict(tides=1, shrink=2, dark=3, coral=4, eclipse=5, ratio=6, tilt=7, mars=8, leaving=9)


def check_facts():
    need = {"Tide": ["only 46% as large as the lunar", "The Sun similarly causes tides"],
            "Moon": ["brightest celestial object in Earth's night sky"],
            "Coral": ["Mass coral spawning often occurs at night on days following a full moon"],
            "Solar eclipse": ["the Sun's diameter is about 400 times the Moon's diameter",
                              "The Sun's distance from Earth is about 400 times the Moon's distance"],
            "Axial tilt": ["The Moon has a stabilizing effect on Earth's obliquity", "varying only by about 20"],
            "Milankovitch cycles": ["no moon large enough to stabilize its obliquity, which has varied from 10 to 70 degrees"],
            "Lunar distance": ["average rate of 3.8 cm", "detected by the Lunar Laser Ranging experiment"]}
    for title, texts in need.items():
        page = wiki.page(title)["text"].lower()
        for text in texts:
            if text.lower() not in page:
                raise SystemExit(f"Wikipedia '{title}' no longer says '{text}' - check the script")


def main():
    check_facts()
    job = ROOT / "data" / "jobs" / "moongone"
    job.mkdir(parents=True, exist_ok=True)
    free = "--free" in sys.argv
    vo, voice = narrate.narrate([l for l, _ in LINES], [k for _, k in LINES], job,
                                style=None if free else "explore")
    secs = round(vo[-1]["end"] + 0.45, 2)
    props = {"vo": vo, "hook": {"top": "THE MOON VANISHED", "bottom": "TIDES DON'T STOP", "badge": "HERE'S WHY"},
             "at": AT, "durationInSeconds": secs}
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    if "--props" in sys.argv:
        print([round(v["start"], 1) for v in vo], secs)
        return
    print(f"[render] {secs:.1f}s")
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("MoonGone", job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="surprising", seed=33)
    out = ROOT / "data" / "out" / "moongone.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out, bed_db=-9)
    found = [q for q in seo.suggestions("what if the moon disappeared") if len(q) < 60][:6]
    meta = {"kind": "whatif", "file": str(out),
            "title": "If the Moon Vanished, the Tides Wouldn't Stop \U0001F315",
            "description": ("What would really happen if the Moon disappeared?\n\n"
                            "- The Sun makes tides too - its pull is only 46% of the Moon's, so tides would "
                            "shrink to under half their usual size\n"
                            "- The brightest thing in the night sky would be gone\n"
                            "- Many corals spawn on the nights after a full moon\n"
                            "- Total solar eclipses would end: they only work because the Sun is about 400 times "
                            "wider and 400 times farther away than the Moon\n"
                            "- The Moon steadies Earth's tilt; Mars has no big moon and its tilt has varied "
                            "from 10 to 70 degrees\n"
                            "- The Moon is moving away from us by about 3.8 cm a year\n\n"
                            "Which what-if should I do next? Tell me in the comments \U0001F447\n\n"
                            "#space #moon #earth #shorts"),
            "tags": list(dict.fromkeys(["what if the moon disappeared", "moon disappeared", "no moon",
                                        *found, "tides", "solar eclipse", "space", "moon", "earth",
                                        "science", "shorts"])),
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
