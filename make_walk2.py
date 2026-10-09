"""Walk Shorts, v2 (2026-10-08 test): the same route, script and fact rules as
make_walk.py, drawn on the 3D globe instead of flat map crops.

    python make_walk2.py Nepal "United Kingdom"            build a preview (acted voice)
    python make_walk2.py Nepal "United Kingdom" --free     free voice

What changes on screen (GlobeWalk.tsx): the globe spins onto the start in the
first second with a big hook; a camera follows Atlas (the channel's walker)
along a glowing route; a flag pops up at every border; live counters for km
walked and days on foot; and the blocking sea comes alive instead of a still
end card. Days on foot use Wikipedia's average walking speed, 5.0 km/h
("Preferred walking speed"), 8 hours a day.
"""
import json
import math
import sys
from datetime import datetime
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import make_walk  # noqa: E402
import mix  # noqa: E402
import narrate  # noqa: E402
import score  # noqa: E402
import seo  # noqa: E402
import wiki  # noqa: E402
import geo  # noqa: E402
from make_walk import render  # noqa: E402

KMH = 5.0
HOURS = 8


def _gc(a, b, step_km=40):
    """Great-circle points from a to b, about every step_km."""
    la1, lo1, la2, lo2 = map(math.radians, (a[1], a[0], b[1], b[0]))
    d = 2 * math.asin(math.sqrt(math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2))
    n = max(1, int(d * 6371 / step_km))
    out = []
    for i in range(n + 1):
        f = i / n
        if d == 0:
            out.append((a[0], a[1]))
            continue
        A = math.sin((1 - f) * d) / math.sin(d); B = math.sin(f * d) / math.sin(d)
        x = A * math.cos(la1) * math.cos(lo1) + B * math.cos(la2) * math.cos(lo2)
        y = A * math.cos(la1) * math.sin(lo1) + B * math.cos(la2) * math.sin(lo2)
        z = A * math.sin(la1) + B * math.sin(la2)
        out.append((math.degrees(math.atan2(y, x)), math.degrees(math.atan2(z, math.hypot(x, y)))))
    return out


def dense(points):
    out = []
    for i in range(len(points) - 1):
        seg = _gc(points[i][:2], points[i + 1][:2])
        out += seg if not out else seg[1:]
    return [[round(x, 4), round(y, 4)] for x, y in out]


def borders(path, names):
    """Where along the path (0..1) it enters each country, in route order."""
    feats = json.loads((ROOT / "assets" / "ne10m.geojson").read_text(encoding="utf-8"))["features"]
    keep = [f for f in feats if f["properties"]["NAME"] in names or f["properties"]["ADMIN"] in names]
    geoms = [shape(f["geometry"]) for f in keep]
    tree = STRtree(geoms)
    out, last = [], None
    for i, (x, y) in enumerate(path):
        p = Point(x, y); hit = None
        for k in tree.query(p):
            if geoms[k].contains(p):
                hit = keep[k]["properties"]; break
        if hit and hit["NAME"] != last:
            last = hit["NAME"]
            iso = (hit.get("ISO_A2_EH") or "").lower()
            flag = f"flags/{iso}.png" if (ROOT / "media" / "flags" / f"{iso}.png").exists() else None
            out.append({"name": geo.short(hit["NAME"]).upper(), "frac": i / max(1, len(path) - 1), "flag": flag})
    return out


def make(origin, dest, date=None, free=False, props_only=False):
    """Build one walk Short; returns its meta (the same shape as make_walk.make)."""
    if "5.0 km/h" not in wiki.page("Preferred walking speed")["text"]:
        raise SystemExit("Wikipedia no longer gives 5.0 km/h as the average walking speed")
    slug = make_walk.slugify(origin, dest)
    job = ROOT / "data" / "jobs" / f"walk2-{slug}"
    job.mkdir(parents=True, exist_ok=True)

    route = make_walk.plan_route(origin, dest)
    route["origin"], route["dest"] = origin, dest
    legs = make_walk.plan_legs(route)
    built = make_walk.build_legs(route, legs, slug)
    cached = job / "script.json"
    if cached.exists():
        lines, beats = json.loads(cached.read_text(encoding="utf-8"))
    else:
        lines, beats = make_walk.write_script(route, legs, built)
        closing = seo.cta("walk_loop", slug)
        lines = lines + [closing]
        beats = [list(b) for b in beats] + [["loop", len(legs) - 1, closing]]
        cached.write_text(json.dumps([lines, beats]), encoding="utf-8")
    for i, l in enumerate(lines, 1):
        print(f"      {i:2d}. {l}")

    kinds = [k if k != "detail" else "payoff" for k, _, _ in beats]
    vo, voice = narrate.narrate(lines, kinds, job, style=None if free else "walk")
    secs = round(vo[-1]["end"] + 0.45, 2)

    path1 = dense(route["side1"])
    path2 = dense(route["side2"]) if route["side2"] else []
    km1 = route["km1"]
    gap = route["gap"]
    # the walk runs from the end of the hook to the line that names the water
    # (the second-to-last line); walkable routes walk until the last line
    walk_to = len(lines) - 2 if gap else len(lines) - 1
    props = {
        "vo": vo, "durationInSeconds": secs,
        "hook": {"top": f"{geo.short(origin).upper()} → {geo.short(dest).upper()}", "bottom": "ON FOOT?"},
        "origin": geo.short(origin).upper(), "dest": geo.short(dest).upper(),
        "path": path1, "path2": path2, "walkTo": walk_to,
        "borders": borders(path1, set(route["countries1"])),
        "km": round(km1), "days": round(km1 / KMH / HOURS),
        "walkable": route["walkable"],
        "gap": ({"a": list(gap["a"]), "b": list(gap["b"]), "km": gap["said"], "water": (gap["water"] or "open sea").upper(),
                 "what": gap["what"]} if gap else None),
    }
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    print(f"[render] {secs:.1f}s  {round(km1)} km, {props['days']} days, {len(props['borders'])} countries")
    if props_only:
        return None
    import subprocess
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("GlobeWalk", job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="curious", seed=len(slug))
    date = date or datetime.now().strftime("%Y-%m-%d")
    out = ROOT / "data" / "out" / f"{date}-walk-{slug}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out)
    found = seo.walk_meta(route, lines)
    meta = {
        "kind": "walk", "format": "globe-walk", "file": str(out), "slug": slug, "date": date,
        "title": found["title"], "description": found["description"], "tags": found["tags"],
        "facts": {"walkable": route["walkable"], "km1": round(km1), "days": props["days"],
                  "countries": route["countries1"] + route["countries2"],
                  "gap_km": round(gap["km"], 1) if gap else None, "water": gap["water"] if gap else None},
        "lines": lines,
    }
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {out}  ({mix.duration(out):.1f}s)")
    return meta


def main():
    make(sys.argv[1], sys.argv[2], free="--free" in sys.argv, props_only="--props" in sys.argv)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
