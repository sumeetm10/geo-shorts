"""One-off: "What if Earth were split into just 4 countries?"

    python make_zones.py                 build (acted voice, edge-tts if it fails)
    python make_zones.py --free          free voice
    python make_zones.py --post 2026-10-04T09:15Z   build and schedule it

Every number is counted by zones.py from Natural Earth (2019 population
estimates), and the script's spoken ratios are checked against those counts
here before anything is voiced: if the data says otherwise, the build stops.
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
import zones  # noqa: E402
from make_walk import render  # noqa: E402

LINES = [
    ("What if Earth were split into just 4 countries?", "hook"),
    ("Cut it at the Equator and at the line through Greenwich.", "walk"),
    ("The North-East gets 3 out of every 4 people on Earth.", "reveal"),
    ("The North-West: about 1 in 8.", "walk"),
    ("The South-East: fewer than 1 in 10.", "walk"),
    ("And the South-West? Fewer than 1 in 20.", "stop"),
    ("Brazil would be cut in two, and London would sit on the border.", "cheer"),
    ("The North-East has less than half the land, yet it would rule the planet.", "payoff"),
    ("Subscribe, so next time someone asks you...", "cta"),
]
AT = dict(cut=1, ne=2, nw=3, se=4, sw=5, split=6, land=7)


def _people(n):
    return f"{n / 1e9:.1f} BILLION PEOPLE" if n >= 1e9 else f"{round(n / 1e7) * 10:,} MILLION PEOPLE"


def check(out):
    """The spoken ratios must match the counted data."""
    s = {z: out[z]["people_share"] for z in out}
    brazil = next(sp for name, sp in out["SW"]["split"] if name == "Brazil")
    checks = {
        "NE is 3 in 4": 0.70 <= s["NE"] <= 0.80,
        "NW is about 1 in 8": 0.11 <= s["NW"] <= 0.14,
        "SE is fewer than 1 in 10": s["SE"] < 0.10,
        "SW is fewer than 1 in 20": s["SW"] < 0.05,
        "NE has less than half the land": out["NE"]["land_share"] < 0.5,
        "Brazil is cut in two (land on both sides)": "NW" in brazil and "SW" in brazil,
    }
    bad = [k for k, ok in checks.items() if not ok]
    if bad:
        raise SystemExit(f"the data no longer supports: {bad}")


def main():
    out, people, land = zones.compute()
    check(out)
    names = {"NE": "NORTH-EAST", "NW": "NORTH-WEST", "SE": "SOUTH-EAST", "SW": "SOUTH-WEST"}
    ratio = {"NE": "3 IN 4 PEOPLE", "NW": "ABOUT 1 IN 8", "SE": "FEWER THAN 1 IN 10", "SW": "FEWER THAN 1 IN 20"}
    zp = {z: {"name": names[z], "people": _people(out[z]["people"]), "ratio": ratio[z]} for z in out}
    print({z: (zp[z]["people"], round(100 * out[z]["people_share"], 1), round(100 * out[z]["land_share"], 1)) for z in out})

    job = ROOT / "data" / "jobs" / "zones"
    job.mkdir(parents=True, exist_ok=True)
    free = "--free" in sys.argv
    vo, voice = narrate.narrate([l for l, _ in LINES], [k for _, k in LINES], job,
                                style=None if free else "explore")
    secs = round(vo[-1]["end"] + 0.45, 2)
    props = {"vo": vo, "hook": {"top": "EARTH SPLIT", "bottom": "INTO 4"}, "at": AT,
             "zones": zp, "land": {"land": round(out["NE"]["land_share"], 3), "people": round(out["NE"]["people_share"], 3)},
             "durationInSeconds": secs}
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    if "--props" in sys.argv:
        return
    print(f"[render] {secs:.1f}s")
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("Zones", job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="curious", seed=4)
    final = ROOT / "data" / "out" / "zones.mp4"
    final.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, final, bed_db=-9)
    found = [q for q in seo.suggestions("what if earth was divided") if len(q) < 60][:5]
    meta = {"kind": "whatif", "file": str(final),
            "title": "What If Earth Were Split Into 4 Countries? \U0001F30D",
            "description": (
                "Cut the world at the Equator and the Greenwich meridian and you get 4 giant countries.\n\n"
                f"- North-East: {zp['NE']['people'].lower()} ({100 * out['NE']['people_share']:.0f}% of everyone) on "
                f"{100 * out['NE']['land_share']:.0f}% of the land\n"
                f"- North-West: {zp['NW']['people'].lower()} ({100 * out['NW']['people_share']:.0f}%)\n"
                f"- South-East: {zp['SE']['people'].lower()} ({100 * out['SE']['people_share']:.0f}%)\n"
                f"- South-West: {zp['SW']['people'].lower()} ({100 * out['SW']['people_share']:.1f}%)\n\n"
                "Counted from Natural Earth country data (2019 population estimates); countries the lines cut are "
                "split by where their cities' people live.\n\n"
                "Which zone would you live in? Tell me in the comments \U0001F447\n\n#geography #maps #earth #shorts"),
            "tags": list(dict.fromkeys(["what if earth was divided into 4", "earth split into 4", "equator",
                                        "prime meridian", "world population map", *found, "geography", "maps",
                                        "shorts"])),
            "lines": [l for l, _ in LINES]}
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {final}  ({mix.duration(final):.1f}s)")
    if "--post" in sys.argv:
        import upload_geo
        at = datetime.strptime(sys.argv[sys.argv.index("--post") + 1], "%Y-%m-%dT%H:%MZ").replace(tzinfo=timezone.utc)
        vid = upload_geo.upload(final, meta, "public", publish_at=at)
        print(f"[posted] https://youtu.be/{vid} scheduled {at:%Y-%m-%d %H:%M} UTC")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
