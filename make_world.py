"""Atlas on other worlds: "Can you walk around Mars?", "What would you weigh on the Moon?"

    python make_world.py mars-around --free --props    free voice, timings only
    python make_world.py mars-around                   acted voice + render

The script is a template filled with numbers from worlds.py, which are checked
against Wikipedia here before anything is voiced (no model-written lines, so no
fact-gate failures). The composition is remotion/src/shots/geo/WorldWalk.tsx with
a procedural planet shader (PlanetShader.tsx).
"""
import json
import math
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import mix  # noqa: E402
import narrate  # noqa: E402
import score  # noqa: E402
import wiki  # noqa: E402
import worlds  # noqa: E402
from make_walk import render  # noqa: E402

KMH, HOURS = 5.0, 8                     # Wikipedia "Preferred walking speed"; 8 h on foot a day
EARTH_KG = 70


def check_facts(w):
    for title, texts in w["facts"].items():
        page = wiki.page(title)["text"].lower()
        for t in texts:
            if t.lower() not in page:
                raise SystemExit(f"Wikipedia '{title}' no longer says '{t}' - check worlds.py ({w['id']})")


def _cap(name):
    return name[0].upper() + name[1:]


def _yrs(y):
    """8.8 / 26 / 3,700 - as it would be said."""
    if y < 20:
        return f"{y:.1f}".rstrip("0").rstrip(".")
    if y < 100:
        return f"{round(y)}"
    return f"{int(round(y, -2)):,}"


def script(w):
    """(lines, kinds, numbers) for one world topic."""
    W = w["world"]
    if w["type"] == "around":
        around = round(math.pi * w["diameter"], -2)
        days = round(around / KMH / HOURS)
        months = days / 30.4
        span = f"That's about {round(months)} months" if months < 22 else f"That's almost {round(days / 365, 1):g} years"
        lines = [
            (f"Can you walk all the way around {W}? Guess before the end.", "hook"),
            (f"Atlas lands on {W}. {w['land']}", "walk"),
            (f"{_cap(W)} is about {w['diameter']:,} km wide. So the walk around its middle is about {int(around):,} km.", "reveal"),
            (w["gravity_line"], "walk"),
            (w["extra_line"], "stop"),
            (f"Walking 8 hours a day, at a normal pace, it would take about {days} days. {span}, just walking.", "payoff"),
            ("So next time someone asks you...", "cta"),
        ]
        nums = {"diameter": w["diameter"], "around": int(around), "days": days}
        at = {"land": 1, "size": 2, "gravity": 3, "extra": 4, "days": 5}
    elif w["type"] == "to":
        years = w["distance"] / KMH / HOURS / 365.25
        nonstop = w["distance"] / KMH / 24 / 365.25
        lines = [
            (f"How long would it take to walk from Earth to {W}? Guess before the end.", "hook"),
            ("Imagine a road through space. Atlas sets off from Earth.", "walk"),
            (w["dist_line"], "reveal"),
            (w["extra_line"], "walk"),
            (f"Walking 8 hours a day, at a normal pace, it would take about {_yrs(years)} years.", "stop"),
            (f"Even walking non-stop, day and night, it would still take about {_yrs(nonstop)} years.", "payoff"),
            ("So next time someone asks you...", "cta"),
        ]
        nums = {"distance": w["distance"], "years": _yrs(years), "nonstop": _yrs(nonstop)}
        at = {"road": 1, "dist": 2, "extra": 3, "years": 4, "nonstop": 5}
    else:
        kg = round(EARTH_KG * w["ratio"])
        jump = round(1 / w["ratio"], 1)
        lines = [
            (f"What would you weigh on {W}? Guess before the end.", "hook"),
            (f"Say you weigh {EARTH_KG} kilograms here on Earth.", "walk"),
            (f"Gravity on {W} is only {w['gravity']}.", "reveal"),
            (f"So a bathroom scale would read about {kg} kilograms.", "stop"),
            ("You're not any smaller. The planet just pulls on you less.", "walk"),
            (f"Which means you could jump about {jump:g} times higher.", "payoff"),
            ("So next time someone asks you...", "cta"),
        ]
        nums = {"kgEarth": EARTH_KG, "kgThere": kg, "jump": jump, "ratio": w["ratio"]}
        at = {"earth": 1, "gravity": 2, "scale": 3, "same": 4, "jump": 5}
    return [l for l, _ in lines], [k for _, k in lines], nums, at


def _check_planet(video):
    """The planet is a WebGL shader; if WebGL silently fails it renders blank (the first
    cloud test, 2026-10-13). One second in, the middle of the frame must hold the planet."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", "1", "-i", str(video), "-frames:v", "1",
                          "-vf", "crop=600:600:240:780,scale=60:60,format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    mean = sum(raw) / max(1, len(raw))
    if mean < 25:
        raise RuntimeError(f"the planet did not render (centre brightness {mean:.0f}) - WebGL problem")
    print(f"      [check] planet visible (centre brightness {mean:.0f})")


def make(topic_id, date=None, free=False, props_only=False):
    w = next(x for x in worlds.WORLDS if x["id"] == topic_id)
    check_facts(w)
    lines, kinds, nums, at = script(w)
    for i, l in enumerate(lines, 1):
        print(f"      {i:2d}. {l}")
    job = ROOT / "data" / "jobs" / f"world-{topic_id}"
    job.mkdir(parents=True, exist_ok=True)
    vo, voice = narrate.narrate(lines, kinds, job, style=None if free else "walk")
    secs = round(vo[-1]["end"] + 0.45, 2)
    W = w["world"]
    if w["type"] == "to":
        hook = {"top": f"WALK TO {W.upper()}?", "badge": "GUESS BEFORE THE END"}
    elif w["type"] == "around":
        hook = {"top": f"WALK AROUND {W.upper()}?", "badge": "GUESS BEFORE THE END"}
    else:
        hook = {"top": f"YOUR WEIGHT ON {W.upper()}?", "badge": "GUESS BEFORE THE END"}
    props = {"vo": vo, "durationInSeconds": secs, "type": w["type"], "world": W.upper(), "look": w["look"],
             "hook": hook, "at": at, "nums": nums, "extraLabel": w.get("extra_label", ""), "distLine": w.get("dist_line", ""),
             "gravityLabel": (w.get("gravity") or "").upper()}
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    print(f"[render] {secs:.1f}s  {nums}")
    if props_only:
        return None
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("WorldWalk", job / "props.json", silent)
    _check_planet(silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="curious", seed=len(topic_id) * 7)
    date = date or datetime.now().strftime("%Y-%m-%d")
    out = ROOT / "data" / "out" / f"{date}-world-{topic_id}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out)
    if w["type"] == "to":
        title = f"How Long Would It Take to Walk to {_cap(W)}? 🚶🌌"
        what = (f"- {w['dist_line']}\n- At 5 km/h, 8 hours a day, that's about {nums['years']} years on foot "
                f"(about {nums['nonstop']} years walking non-stop)\n")
    elif w["type"] == "around":
        title = f"Can You Walk All the Way Around {_cap(W)}? 🚶🪐"
        what = (f"- {_cap(W)} is about {w['diameter']:,} km wide, so the walk around its middle is about "
                f"{nums['around']:,} km (pi x diameter)\n- At 5 km/h, 8 hours a day, that's about {nums['days']} days on foot\n")
    else:
        title = f"What Would You Weigh on {_cap(W)}? ⚖️🪐"
        what = (f"- Gravity on {W} is {w['gravity']}\n- A 70 kg person would read about {nums['kgThere']} kg on a "
                f"bathroom scale there, and could jump about {nums['jump']:g} times higher\n")
    sources = ", ".join(w["facts"].keys())
    meta = {"kind": "world", "format": "atlas-worlds", "file": str(out), "date": date, "title": title,
            "description": (f"Atlas, our walker, visits {W}.\n\n{what}\nSources: Wikipedia - {sources}. "
                            f"The planet is drawn in code.\n\n#space #planets #science #shorts"),
            "tags": [f"walk around {W.lower()}", W.lower().replace("the ", ""), "space facts", "planets", "what if",
                     "solar system", "astronomy", "science", "shorts"],
            "lines": lines}
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {out}  ({mix.duration(out):.1f}s)")
    return meta


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    make(sys.argv[1], free="--free" in sys.argv, props_only="--props" in sys.argv)
