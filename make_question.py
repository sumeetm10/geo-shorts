"""Build one "your country" question short from a curated topic.

    python make_question.py one-neighbour-1

The facts come from topics.py and the narration is assembled from them by
template, so nothing here can invent a country or a number.
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import geo
import mix
import narrate
import routes
import seo
import topics
from make_walk import render

ROOT = Path(__file__).resolve().parent
JOBS = ROOT / "data" / "jobs"
OUT = ROOT / "data" / "out"
MEDIA = ROOT / "media"


def _bbox(graph, country):
    ring = graph["parts"][geo.main_part(graph, country)][1]
    pts = geo.unwrap([tuple(p) for p in ring[::max(1, len(ring) // 800)]])
    return pts


def _window(graph, item):
    if item.get("view"):
        v = item["view"]
        dlat = v["dlat"]
        dlon = dlat * geo.ASPECT
        return geo.Window(v["lon"] - dlon / 2, v["lon"] + dlon / 2,
                          v["lat"] - dlat / 2, v["lat"] + dlat / 2)
    pts = _bbox(graph, item["country"])
    if item.get("neighbour"):
        near = _bbox(graph, item["neighbour"])
        # frame the country itself, with only as much of a big neighbour as fits
        cx = sum(p[0] for p in pts) / len(pts)
        near = [(cx + ((x - cx + 180) % 360 - 180), y) for x, y in near]
        span = max(max(p[0] for p in pts) - min(p[0] for p in pts),
                   max(p[1] for p in pts) - min(p[1] for p in pts)) * 1.4 + 3
        pts = pts + [p for p in near if abs(p[0] - cx) < span and
                     abs(p[1] - sum(q[1] for q in pts) / len(pts)) < span]
    return geo.fit_window(pts, pad=0.35, min_dlat=6, max_dlat=70)


def _label(graph, country, win, main):
    rings = graph["countries"][country]
    vis = geo.country_points_in(rings, win, step=3)
    if not vis:
        return None
    x = sum(p[0] for p in vis) / len(vis)
    y = sum(p[1] for p in vis) / len(vis)
    x, y = min(880, max(200, x)), min(1380, max(520, y))
    return {"name": geo.short(country).upper(), "x": round(x, 1), "y": round(y, 1), "main": main}


def make(topic_id, date=None):
    topic = next((t for t in topics.QUESTIONS if t["id"] == topic_id), None)
    if not topic:
        raise SystemExit(f"unknown topic: {topic_id}")
    date = date or datetime.now().strftime("%Y-%m-%d")
    job = JOBS / f"{date}-{topic_id}"
    job.mkdir(parents=True, exist_ok=True)
    g = routes.build()
    print(f"[topic ] {topic['title']}")

    closing = seo.cta("question", topic_id)
    lines = ([topic["hook"]] + [it["line"] for it in topic["items"]] + [topic["payoff"]]
             + [closing])
    kinds = ["question"] + ["list"] * len(topic["items"]) + ["reveal", "cta"]

    items = []
    for i, it in enumerate(topic["items"]):
        win = _window(g, it)
        rel = f"jobs/{date}-{topic_id}/item-{i + 1:02d}.jpg"
        geo.crop(win.lon0, win.lon1, win.lat0, win.lat1, MEDIA / rel)
        flags, labels, pins = [], [], []
        for c, main in ((it["country"], True), (it.get("neighbour"), False)):
            if not c:
                continue
            fl, d = geo.flag(c), geo.svg_path(g["countries"][c], win)
            if fl and d:
                flags.append({"file": fl, "d": d, "main": main})
            lb = _label(g, c, win, main)
            if lb and all(abs(lb["x"] - l["x"]) + abs(lb["y"] - l["y"]) > 170 for l in labels):
                labels.append(lb)
        if it.get("pin"):
            v = it.get("view") or {}
            lon, lat = v.get("lon"), v.get("lat")
            if lon is None:
                lon, lat = geo.capital(g, it["country"])
            x, y = win.px(lon, lat)
            pins.append({"x": round(x, 1), "y": round(y, 1)})
            labels = [l for l in labels if not l["main"]]
            labels.insert(0, {"name": geo.short(it["country"]).upper(), "x": round(x, 1),
                              "y": round(y - 90, 1), "main": True})
        items.append({"id": f"item-{i + 1:02d}", "image": rel, "from": 0 if i == 0 else i + 1,
                      "flags": flags, "labels": labels, "pins": pins})

    vo, voice = narrate.narrate(lines, kinds, job, style="question")
    secs = round(vo[-1]["end"] + 1.0, 2)
    props = {"items": items, "vo": vo, "title": topic["title"], "durationInSeconds": secs,
             "cta": {"fromLine": len(lines) - 1, "text": "for more map facts"}}
    props_path = job / "props.json"
    props_path.write_text(json.dumps(props), encoding="utf-8")

    print(f"[render] {secs:.1f}s, {len(items)} items")
    silent = job / "silent.mp4"
    render("GeoList", props_path, silent)

    import score
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="curious", seed=len(topic_id))
    OUT.mkdir(parents=True, exist_ok=True)
    final = OUT / f"{date}-question-{topic_id}.mp4"
    mix.mix(silent, voice, bed, final, bed_db=-7)     # 2 dB under the old mix: a clearer voice

    found = seo.question_meta(topic, lines)
    meta = {
        "kind": "question", "file": str(final), "slug": topic_id, "date": date,
        "title": found["title"], "description": found["description"], "tags": found["tags"],
        "lines": lines,
    }
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {final}  ({mix.duration(final):.1f}s)")
    return meta


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("topic", help="|".join(t["id"] for t in topics.QUESTIONS))
    a = ap.parse_args()
    make(a.topic)
