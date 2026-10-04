"""One-off: "Is Russia really bigger than Africa?" - the Mercator map's trick, shown.

    python make_truesize.py --free --props   quick props for stills
    python make_truesize.py                  build (acted voice)
    python make_truesize.py --post 2026-10-05T13:15Z

Areas are measured from Natural Earth (assets/ne10m.geojson) in an equal-area
projection (zones.py): Russia 16.9 million km2, Africa (55 countries) 30.0 million,
Greenland 2.1 million - so the script says "about 17", "about 30", "almost twice"
(1.78x) and "14 times"; main() stops if the measurements stop supporting that.
The background is NASA Blue Marble re-drawn in the Mercator projection, the one
most world maps use; outlines slide by rotating them on the sphere, so they keep
their true size and shrink on screen as they near the Equator.
"""
import json
import math
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import zones  # noqa: E402

LON0, LON1, LAT0, LAT1 = -75.0, 195.0, -40.0, 84.0
MAP_W = 4320
MEDIA_REL = "truesize/mercator.jpg"


def ymerc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


S = MAP_W / math.radians(LON1 - LON0)                 # px per radian
MAP_H = int(round((ymerc(LAT1) - ymerc(LAT0)) * S))

LINES = [
    ("Is Russia really bigger than Africa?", "hook"),
    ("On most world maps, Russia looks bigger than Africa.", "walk"),
    ("But those maps stretch everything near the poles.", "reveal"),
    ("Watch Russia shrink as we slide it to the Equator.", "stop"),
    ("Russia: about 17 million square kilometres.", "walk"),
    ("Africa: about 30 million. Almost twice as big.", "payoff"),
    ("And Greenland? Africa is 14 times bigger.", "reveal"),
    ("That's the Mercator map's big trick.", "cheer"),
    ("Subscribe, so next time someone asks you...", "cta"),
]
AT = dict(looks=1, stretch=2, slide=3, russia=4, africa=5, greenland=6, trick=7)


def mercator_image(out):
    """Blue Marble re-projected to Mercator over the map's window."""
    if out.exists():
        return
    Image.MAX_IMAGE_PIXELS = None
    bm = Image.open(ROOT / "assets" / "bluemarble.jpg")
    bm = bm.reduce(2)                                  # 10800 x 5400: enough for 16 px/degree
    src = np.asarray(bm)
    sh, sw = src.shape[:2]
    ys = np.arange(MAP_H) + 0.5
    lat = np.degrees(np.arctan(np.sinh(ymerc(LAT1) - ys / S)))
    xs = np.arange(MAP_W) + 0.5
    lon = LON0 + xs / MAP_W * (LON1 - LON0)
    lonw = ((lon + 180) % 360) - 180
    col = np.clip(((lonw + 180) / 360 * sw).astype(int), 0, sw - 1)
    row = np.clip(((90 - lat) / 180 * sh).astype(int), 0, sh - 1)
    img = src[row[:, None], col[None, :]]
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(img).save(out, quality=88)


def rings(geom, tol, unwrap=False):
    geom = geom.simplify(tol, preserve_topology=True)
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    out = []
    for p in polys:
        if p.area < tol * tol * 40:                    # drop specks
            continue
        pts = [[round(x + (360 if unwrap and x < -60 else 0), 3), round(y, 3)] for x, y in p.exterior.coords]
        out.append(pts)
    return out


def shapes():
    feats = json.loads((ROOT / "assets" / "ne10m.geojson").read_text(encoding="utf-8"))["features"]
    by, africa = {}, []
    for f in feats:
        p = f["properties"]
        g = shape(f["geometry"])
        if not g.is_valid:
            g = g.buffer(0)
        by[p["ADMIN"]] = g
        if p.get("CONTINENT") == "Africa":
            africa.append(g)
    af = unary_union(africa)
    area = {"russia": zones._equal_area(by["Russia"]).area, "africa": sum(zones._equal_area(g).area for g in africa),
            "greenland": zones._equal_area(by["Greenland"]).area}
    return by["Russia"], af, by["Greenland"], area


def check(area):
    r, a, g = area["russia"] / 1e6, area["africa"] / 1e6, area["greenland"] / 1e6
    ok = {"Russia about 17M": 16.3 <= r <= 17.6, "Africa about 30M": 29.0 <= a <= 31.0,
          "almost twice (1.7-1.99x)": 1.7 <= a / r < 2.0, "14 times Greenland": 13.5 <= a / g < 14.5}
    bad = [k for k, v in ok.items() if not v]
    if bad:
        raise SystemExit(f"the measurements no longer support: {bad}")


def main():
    ru, af, gl, area = shapes()
    check(area)
    print({k: round(v / 1e6, 2) for k, v in area.items()})
    mercator_image(ROOT / "media" / MEDIA_REL)
    import narrate
    job = ROOT / "data" / "jobs" / "truesize"
    job.mkdir(parents=True, exist_ok=True)
    free = "--free" in sys.argv
    vo, voice = narrate.narrate([l for l, _ in LINES], [k for _, k in LINES], job, style=None if free else "explore")
    secs = round(vo[-1]["end"] + 0.45, 2)
    rc = ru.representative_point()
    props = {
        "vo": vo, "hook": {"top": "RUSSIA vs AFRICA", "bottom": "WHICH IS BIGGER?"}, "at": AT,
        "map": {"image": MEDIA_REL, "w": MAP_W, "h": MAP_H, "lon0": LON0, "lon1": LON1, "lat1": LAT1},
        "russia": rings(ru, 0.12, unwrap=True), "africa": rings(af, 0.12), "greenland": rings(gl, 0.1),
        "from": {"russia": [98.0, 63.0], "greenland": [-41.0, 74.0]},
        "to": {"russia": [21.0, 3.0], "greenland": [24.0, 2.0]},
        "labels": {"russia": "≈ 17 MILLION km²", "africa": "≈ 30 MILLION km²", "greenland": "AFRICA = 14 × GREENLAND"},
        "durationInSeconds": secs,
    }
    (job / "props.json").write_text(json.dumps(props), encoding="utf-8")
    print("rings:", len(props["russia"]), len(props["africa"]), len(props["greenland"]),
          "points:", sum(map(len, props["russia"])), sum(map(len, props["africa"])))
    if "--props" in sys.argv:
        print([round(v["start"], 1) for v in vo], secs)
        return
    import mix
    import score
    import seo
    from make_walk import render
    subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=ROOT / "remotion", check=True, capture_output=True)
    silent = job / "silent.mp4"
    render("TrueSize", job / "props.json", silent)
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="curious", seed=31)
    out = ROOT / "data" / "out" / "truesize.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    mix.mix(silent, voice, bed, out, bed_db=-9)
    found = [q for q in seo.suggestions("is russia bigger than africa") if len(q) < 60][:5]
    meta = {"kind": "truesize", "file": str(out),
            "title": "Is Russia Really Bigger Than Africa? \U0001F30D",
            "description": ("Most world maps use the Mercator projection, which stretches everything near the "
                            "poles. Slide Russia to the Equator at its true size and the trick falls apart.\n\n"
                            f"- Russia: about 17 million km²\n- Africa: about 30 million km² - almost twice "
                            f"as big\n- Greenland: Africa is 14 times bigger\n\n"
                            "Areas measured from Natural Earth country shapes in an equal-area projection.\n\n"
                            "Which country should I slide next? Tell me in the comments \U0001F447\n\n"
                            "#geography #maps #truesize #shorts"),
            "tags": list(dict.fromkeys(["is russia bigger than africa", "true size of africa", "mercator projection",
                                        "russia vs africa size", *found, "map distortion", "geography", "maps",
                                        "shorts"])),
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
