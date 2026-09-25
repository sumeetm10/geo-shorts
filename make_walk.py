"""Build one "Can you walk from X to Y?" short, end to end.

    python make_walk.py India "United States of America"

The answer is computed, not written: routes.py decides which countries a walker
crosses and, when the land runs out, which water stops them and how wide it is.
The script is then written AROUND those facts and gated on them — any number the
model puts in the narration must be one we computed, or the line is rejected.
The format lives on a single surprising fact (the Bering Strait is 82 km), so a
made-up figure is not a style problem, it is the whole video being wrong.
"""
import argparse
import json
import math
import re
import subprocess
import sys
from collections import deque
from datetime import datetime
from pathlib import Path

import ambience
import geo
import mix
import narrate
import routes

ROOT = Path(__file__).resolve().parent
JOBS = ROOT / "data" / "jobs"
OUT = ROOT / "data" / "out"
MEDIA = ROOT / "media"
REMOTION = ROOT / "remotion"

# Boxes (lon0, lon1, lat0, lat1) where a mountain sticker belongs. Coarse on
# purpose: a sticker is a signpost, and these ranges are unmistakable.
MOUNTAINS = [
    (72, 97, 27, 36),       # Himalaya / Tibet
    (66, 75, 34, 39),       # Hindu Kush / Pamir
    (72, 95, 40, 49),       # Tian Shan / Altai
    (5, 15, 44, 47.5),      # Alps
    (39, 49, 41, 44),       # Caucasus
    (45, 55, 28, 35),       # Zagros
    (56, 62, 50, 66),       # Urals
    (-125, -104, 35, 60),   # Rockies
    (-155, -140, 60, 64),   # Alaska Range
    (-78, -66, -40, 5),     # Andes (north and central)
    (-73, -69, -55, -40),   # Andes (south)
    (-8, 10, 29, 36),       # Atlas
    (36, 41, 7, 14),        # Ethiopian highlands
]
DESERTS = [
    (-15, 35, 16, 32),      # Sahara
    (35, 60, 15, 32),       # Arabia
    (69, 76, 24, 30),       # Thar
    (53, 68, 36, 46),       # Karakum / Kyzylkum
    (12, 26, -28, -18),     # Kalahari / Namib
    (115, 145, -32, -18),   # Australian outback
    (-118, -105, 28, 37),   # US Southwest
    (-71, -68, -27, -18),   # Atacama
]
# The water between two landmasses, by the countries on either side. Only named
# when we are sure; anything else is called what it is: open sea.
WATER = {
    frozenset({"Russia", "United States of America"}): "Bering Strait",
    frozenset({"United Kingdom", "France"}): "English Channel",
    frozenset({"Spain", "Morocco"}): "Strait of Gibraltar",
    frozenset({"Denmark", "Sweden"}): "Oresund",
    frozenset({"Malaysia", "Indonesia"}): "Strait of Malacca",
    frozenset({"Papua New Guinea", "Australia"}): "Torres Strait",
    frozenset({"Indonesia", "Australia"}): "Timor Sea",
    frozenset({"India", "Sri Lanka"}): "Palk Strait",
    frozenset({"Egypt", "Saudi Arabia"}): "Red Sea",
    frozenset({"Yemen", "Djibouti"}): "Bab-el-Mandeb",
    frozenset({"South Korea", "Japan"}): "Korea Strait",
    frozenset({"China", "Taiwan"}): "Taiwan Strait",
    frozenset({"Italy", "Albania"}): "Strait of Otranto",
    frozenset({"Mozambique", "Madagascar"}): "Mozambique Channel",
}
# Famous crossings have a width everyone can look up. Ours is measured on
# generalised coastlines and came out 37 km for Dover (really 33) and 64 km for
# India-Sri Lanka (really 29, from Dhanushkodi over Adam's Bridge), so a named
# crossing says the published figure. "ends" moves the drawn line to where the
# crossing really is, when the measured nearest points sit elsewhere.
KNOWN_GAPS = {
    frozenset({"Russia", "United States of America"}): {"km": 82, "what": "open water"},
    frozenset({"United Kingdom", "France"}): {"km": 33, "what": "open water"},
    frozenset({"India", "Sri Lanka"}): {
        "km": 29, "what": "shallow sea",
        "ends": {"India": (79.44, 9.15), "Sri Lanka": (79.73, 9.08)}},
    frozenset({"South Korea", "Japan"}): {"km": 200, "what": "sea"},
    frozenset({"Mozambique", "Madagascar"}): {"km": 419, "what": "open water"},
}
# Crossings where "no road, no bridge" is true but viewers will (rightly) bring
# up something else. France-UK is the gap on every walk that ends in the UK.
NOTES = {
    frozenset({"United Kingdom", "France"}):
        "A tunnel runs under it, but it is for trains only. Nobody may walk it.",
    frozenset({"India", "Sri Lanka"}):
        "A chain of sandbanks almost joins them, but the sea breaks it.",
    frozenset({"South Korea", "Japan"}):
        "Japan's island of Tsushima sits in the middle, but it joins nothing.",
}
# Named regions (lon0, lon1, lat0, lat1). A leg that stays inside one huge
# country ("more of Russia", twice) needs somewhere to be, not a repeat.
REGIONS = [
    # the range runs diagonally, so two boxes; one rectangle took in Delhi's plains
    ("the Himalayas", 73, 81, 30.3, 35.5), ("the Himalayas", 81, 97, 27.6, 29.6),
    ("the Hindu Kush", 66, 75, 34, 39),
    ("the Tibetan Plateau", 78, 100, 30, 37), ("the Gobi Desert", 90, 115, 38, 46),
    ("the Kazakh steppe", 50, 85, 43, 52), ("Siberia", 60, 180, 50, 78),
    ("the Russian Far East", 130, 180, 42, 70), ("the Arabian Desert", 35, 60, 15, 32),
    ("the Sahara", -15, 35, 16, 32), ("the Alps", 5, 15, 44, 47.5),
    ("Alaska", -168.5, -130, 54, 72), ("the Canadian Rockies", -125, -110, 49, 60),
    ("the Great Plains", -105, -95, 33, 49), ("the Rocky Mountains", -115, -104, 35, 49),
    ("the Amazon", -75, -50, -12, 5), ("Patagonia", -75, -63, -55, -38),
    ("the Andes", -78, -66, -40, 5), ("the Congo rainforest", 12, 30, -5, 5),
    ("the Australian outback", 115, 145, -32, -18), ("Central America", -92, -77, 7, 18),
]
ALIASES = {
    "United States of America": ["usa", "united states", "america", "u.s."],
    "United Kingdom": ["uk", "britain", "united kingdom", "england", "london"],
}


# ------------------------------------------------------------------ route

def _bfs(graph, src, goal):
    prev, hit = {src: None}, None
    q = deque([src])
    while q:
        cur = q.popleft()
        if cur in goal:
            hit = cur
            break
        for nxt in sorted(graph["adj"].get(cur, ())):
            if nxt not in prev:
                prev[nxt] = cur
                q.append(nxt)
    return prev, hit


def _chain(prev, pid):
    out = []
    while pid is not None:
        out.append(pid)
        pid = prev[pid]
    return out[::-1]


def _names(graph, chain):
    out = []
    for pid in chain:
        n = graph["parts"][pid][0]
        if not out or out[-1] != n:
            out.append(n)
    return out


def _waypoints(graph, chain, start, end):
    pts = [tuple(start)]
    for pa, pb in zip(chain, chain[1:]):
        if graph["parts"][pa][0] != graph["parts"][pb][0]:
            pts.append(geo.crossing(graph, pa, pb, pts[-1], end))
    pts.append(tuple(end))
    return pts


def _length(pts):
    return sum(routes.haversine(pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def _floor_km(km):
    """Round DOWN. Every walking distance here is a straight-line minimum said as
    "at least", so rounding 7,971 up to 8,000 (or 788 up to 1,000) makes it false."""
    step = 1000 if km >= 10000 else 100
    return int(km // step * step)


def _islands_between(g, a, b, shores):
    """Countries the straight crossing a->b passes over, other than its two shores.

    A gap is measured coast to coast, so Malaysia -> Australia is 2,797 km with
    Indonesia's islands in between. Calling that "open water" would be false.
    """
    from shapely.geometry import LineString, Polygon
    (x0, y0), (x1, y1) = geo.unwrap([tuple(a), tuple(b)])
    # stay off the two coasts themselves
    line = LineString([(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) for t in (0.02, 0.98)])
    lx0, ly0, lx1, ly1 = line.bounds
    hits = []
    for name, ring in g["parts"].values():
        if name in shores or name in hits or len(ring) < 4:
            continue
        ys = [p[1] for p in ring]
        if max(ys) < ly0 or min(ys) > ly1:
            continue
        xs = [p[0] for p in ring]
        for shift in (-360, 0, 360):
            if max(xs) + shift < lx0 or min(xs) + shift > lx1:
                continue
            poly = Polygon([(x + shift, y) for x, y in zip(xs, ys)])
            if not poly.is_valid:
                poly = poly.buffer(0)
            if poly.intersects(line):
                hits.append(name)
                break
    return hits


def plan_route(origin, dest):
    g = routes.build()
    for c in (origin, dest):
        if c not in g["countries"]:
            raise SystemExit(f"unknown country: {c}")
    src = geo.main_part(g, origin)
    goal = {geo.main_part(g, dest)}
    prev, hit = _bfs(g, src, goal)
    if not hit:
        # not reachable on its main landmass, but maybe on another part of it
        any_part = {pid for pid, (n, _) in g["parts"].items() if n == dest}
        prev, hit = _bfs(g, src, any_part)
    start, finish = geo.capital(g, origin), geo.capital(g, dest)

    if hit:
        chain = _chain(prev, hit)
        side1 = _waypoints(g, chain, start, finish)
        return {"walkable": True, "side1": side1, "side2": [], "gap": None,
                "countries1": _names(g, chain), "countries2": [],
                "km1": _length(side1), "km2": 0.0, "graph": g}

    target_side = routes.component(g, geo.main_part(g, dest))
    km_gap, from_pid, a, b = routes.gap_between(g, set(prev), target_side)
    frm = g["parts"][from_pid][0]
    to = g["parts"][geo.part_at(g, target_side, b)][0]
    known = KNOWN_GAPS.get(frozenset({frm, to}), {})
    if known.get("ends"):
        a, b = known["ends"][frm], known["ends"][to]
    chain1 = _chain(prev, from_pid)
    side1 = _waypoints(g, chain1, start, a)
    land = geo.part_at(g, target_side, b)
    prev2, hit2 = _bfs(g, land, {geo.main_part(g, dest)})
    chain2 = _chain(prev2, hit2) if hit2 else [land]
    side2 = _waypoints(g, chain2, b, finish)
    to = g["parts"][land][0]
    islands = _islands_between(g, a, b, {frm, to})
    # what we SAY: the published width for a famous crossing, else ours, rounded
    # as honestly as it was measured
    said = known.get("km") or (round(km_gap) if km_gap < 1000 else int(round(km_gap, -2)))
    return {"walkable": False, "side1": side1, "side2": side2,
            "gap": {"km": km_gap, "a": tuple(a), "b": tuple(b), "from": frm, "to": to,
                    "water": WATER.get(frozenset({frm, to})),
                    "islands": islands, "said": said,
                    "what": known.get("what", "open water")},
            "countries1": _names(g, chain1), "countries2": _names(g, chain2),
            "km1": _length(side1), "km2": _length(side2), "graph": g}


# ------------------------------------------------------------------ legs

def _densify(pts, names, step=0.6):
    """Points along the route, each tagged with the country it is walking in.

    Segment k of a side runs from waypoint k to k+1, and _waypoints only adds a
    point where the country changes, so segment k lies in names[k] by
    construction. Tagging by what is VISIBLE in a frame instead once had the
    walker "crossing more of the USA" before he had even reached the strait.
    """
    out = [(pts[0][0], pts[0][1], names[0])]
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])):
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / step))
        who = names[min(k, len(names) - 1)]
        for j in range(1, n + 1):
            out.append((x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n, who))
    return out


def _split(pts, names, k):
    """k chunks of roughly equal ground distance, sharing their end points."""
    dense = _densify(pts, names)
    seg = [routes.haversine(dense[i][:2], dense[i + 1][:2]) for i in range(len(dense) - 1)]
    total = sum(seg) or 1
    chunks, cur, acc, target = [], [dense[0]], 0.0, total / k
    for i, d in enumerate(seg):
        cur.append(dense[i + 1])
        acc += d
        if acc >= target * (len(chunks) + 1) and len(chunks) < k - 1:
            chunks.append(cur)
            cur = [dense[i + 1]]
    chunks.append(cur)
    return [c for c in chunks if len(c) >= 2] or [dense]


def _regions(points):
    seen = []
    for pt in points[::3]:
        lon = ((pt[0] + 180) % 360) - 180
        lat = pt[1]
        for name, a, b, c, d in REGIONS:
            if a <= lon <= b and c <= lat <= d and name not in seen:
                seen.append(name)
    return seen


def _in_boxes(lon, lat, boxes):
    lon = ((lon + 180) % 360) - 180
    return any(a <= lon <= b and c <= lat <= d for a, b, c, d in boxes)


def plan_legs(route):
    legs = []
    s1 = geo.unwrap(route["side1"])
    # about 40 seconds: 2-4 legs before the water, 1-2 after it
    k1 = min(4, max(2, round(route["km1"] / 3000))) if not route["walkable"] \
        else min(5, max(3, round(route["km1"] / 2800)))
    for chunk in _split(s1, route["countries1"], k1):
        legs.append({"kind": "walk", "points": [c[:2] for c in chunk],
                     "walked": list(dict.fromkeys(c[2] for c in chunk)),
                     "regions": _regions(chunk)})
    if not route["walkable"]:
        a, b = route["gap"]["a"], route["gap"]["b"]
        ab = geo.unwrap([s1[-1], a, b])
        legs.append({"kind": "gap", "points": [ab[1], ab[2]],
                     "walked": [route["gap"]["from"], route["gap"]["to"]], "regions": []})
        s2 = geo.unwrap([ab[2]] + route["side2"][1:])
        if len(s2) >= 2:
            k2 = 1 if route["km2"] < 3500 else 2
            for chunk in _split(s2, route["countries2"], k2):
                legs.append({"kind": "after", "points": [c[:2] for c in chunk],
                             "walked": list(dict.fromkeys(c[2] for c in chunk)),
                             "regions": _regions(chunk)})

    for i, leg in enumerate(legs):
        pts = leg["points"]
        if leg["kind"] == "gap":
            # a strait needs zooming out around it; an ocean needs both shores in frame
            span = max(abs(pts[1][0] - pts[0][0]), abs(pts[1][1] - pts[0][1]))
            leg["win"] = geo.fit_window(pts, pad=2.4 if span < 4 else 0.3, min_dlat=12,
                                        max_dlat=28 if span < 4 else 110)
        else:
            leg["win"] = geo.fit_window(pts, pad=0.35, min_dlat=18, max_dlat=75)
        mid = pts[len(pts) // 2]
        cold = abs(mid[1]) > 52
        if leg["kind"] == "gap":
            leg["mood"] = "stop"
        elif i == len(legs) - 1:
            leg["mood"] = "cheer"
        elif leg["kind"] == "after":
            leg["mood"] = "tired"
        elif _in_boxes(mid[0], mid[1], DESERTS):
            leg["mood"] = "hot"
        elif cold:
            leg["mood"] = "cold"
        else:
            leg["mood"] = "walk"
        leg["cold"] = cold
    return legs


def _stickers(leg, img):
    win, pts, props = leg["win"], leg["points"], []
    width = win.lon1 - win.lon0
    scale = max(0.9, min(1.7, 22 / (win.lat1 - win.lat0) * 1.3))

    def ok_land(x, y):
        return 90 < x < 990 and 380 < y < 1420 and not geo.is_water(img, x, y)

    for a, b, c, d in MOUNTAINS:
        for fx, fy in ((0.5, 0.5), (0.3, 0.62), (0.72, 0.4)):
            lon, lat = a + (b - a) * fx, c + (d - c) * fy
            if win.contains(lon, lat, -0.05):
                x, y = win.px(lon, lat)
                if ok_land(x, y) and all(abs(x - p["x"]) + abs(y - p["y"]) > 150 for p in props):
                    props.append({"kind": "mountain", "x": x, "y": y, "s": scale})
        if len(props) >= 3:
            break

    kind = "pine" if leg["cold"] and leg["mood"] != "stop" else "dune" if leg["mood"] == "hot" else None
    if kind:
        n = len(pts)
        for frac, side in ((0.25, 1), (0.55, -1), (0.8, 1)):
            lon, lat = pts[min(n - 1, int(n * frac))]
            lon += side * width * 0.18
            x, y = win.px(lon, lat)
            if ok_land(x, y) and len(props) < 5:
                props.append({"kind": kind, "x": x, "y": y, "s": scale})

    if leg["mood"] == "stop" and leg["cold"]:
        (ax, ay), (bx, by) = [win.px(*p) for p in pts]
        for t, dy in ((0.35, 90), (0.6, -120), (0.5, 260)):
            x, y = ax + (bx - ax) * t, ay + (by - ay) * t + dy
            if geo.is_water(img, x, y):
                props.append({"kind": "floe", "x": x, "y": y, "s": 1.0})
    return props


def build_legs(route, legs, slug):
    g = route["graph"]
    countries = list(dict.fromkeys(route["countries1"] + route["countries2"]))
    job_media = MEDIA / "jobs" / slug
    out = []
    for i, leg in enumerate(legs):
        win = leg["win"]
        rel = f"jobs/{slug}/leg-{i + 1:02d}.jpg"
        img = geo.crop(win.lon0, win.lon1, win.lat0, win.lat1, job_media / f"leg-{i + 1:02d}.jpg")

        flags, labels = [], []
        for c in countries:
            rings = g["countries"][c]
            visible = geo.country_points_in(rings, win)
            if len(visible) < 6:
                continue
            f = geo.flag(c)
            d = geo.svg_path(rings, win)
            if f and d:
                flags.append({"file": f, "d": d})
            if len(visible) >= 10:
                x = sum(p[0] for p in visible) / len(visible)
                y = sum(p[1] for p in visible) / len(visible)
                x, y = min(900, max(180, x)), min(1400, max(480, y))
                if all(abs(x - l["x"]) + abs(y - l["y"]) > 160 for l in labels):
                    labels.append({"name": geo.short(c).upper(), "x": round(x, 1), "y": round(y, 1)})

        path = [[round(v, 1) for v in win.px(*p)] for p in leg["points"]]
        if leg["kind"] == "gap":
            path = path[:1]                      # he stops at the coast
        snow = 0
        if leg["cold"]:
            snow = 75 if leg["mood"] == "stop" else 45 if leg["mood"] == "tired" else 55
        out.append({
            "id": f"leg-{i + 1:02d}", "image": rel, "from": 0, "flags": flags,
            "labels": labels, "path": path, "props": _stickers(leg, img),
            "snow": snow, "mood": leg["mood"],
            "countries": [c for c in countries if any(fl["file"] == geo.flag(c) for fl in flags)],
        })
    return out


# ------------------------------------------------------------------ script

def _llm():
    import llm
    return llm.config(), llm


def _beats(route, legs, built):
    """One beat per line: the facts that line has to carry, nothing else."""
    o, d = geo.short(route["origin"]), geo.short(route["dest"])
    beats = [("hook", 0, f"Ask whether you could walk from {_the(route['origin'])} to "
                         f"{_the(route['dest'])}. Name both.")]
    seen = {route["origin"]}                  # you start there; you do not "enter" it
    for i, leg in enumerate(legs):
        if leg["kind"] == "gap":
            gap = route["gap"]
            isles = [geo.short(c) for c in gap.get("islands", [])][:2]
            water = gap["water"] or ("sea, with islands scattered across it" if isles else "open sea")
            beats.append(("stop", i, f"The land ends at the coast of {geo.short(gap['from'])}. "
                                    f"In front of you: the {water}."))
            if isles:
                detail = (f"{geo.short(gap['to'])} is about {gap['said']:,} km away across the "
                          f"sea, past the islands of {' and '.join(isles)}. No road, no bridge.")
            else:
                detail = (f"{gap['said']:,} km of {gap['what']} to {geo.short(gap['to'])}. "
                          f"No road, no bridge.")
            note = NOTES.get(frozenset({gap["from"], gap["to"]}))
            beats.append(("detail", i, detail + (f" {note}" if note else "")))
            continue
        new = [geo.short(c) for c in leg["walked"] if c not in seen]
        seen.update(leg["walked"])
        facts = []
        if leg["kind"] == "after":
            # everything past the water is imagined: the answer is already "no"
            facts.append("HYPOTHETICAL - you cannot actually cross, so this line must stay "
                         "imagined: 'even if you got across', 'you would', never that you did "
                         "cross or that you finally arrive")
        if new:
            facts.append("Countries you enter: " + ", ".join(new))
        else:
            facts.append("Still inside " + geo.short(leg["walked"][-1]))
        if leg["regions"]:
            facts.append("Region: " + ", ".join(leg["regions"][:2]))
        facts.append({"hot": "Heat and dry desert", "cold": "Bitter cold",
                      "walk": "Long days on foot", "tired": "Exhausted, still far to go",
                      "cheer": "You finally make it"}[leg["mood"]])
        if any(p["kind"] == "mountain" for p in built[i]["props"]):
            facts.append("Mountains")
        beats.append((leg["mood"], i, ". ".join(facts) + "."))
    km = _floor_km(route["km1"])
    if route["walkable"]:
        pay = f"Yes. At least {km:,} km on foot, through {len(route['countries1'])} countries."
    elif route["gap"].get("islands"):
        pay = f"No. At least {km:,} km of walking, and then the land runs out."
    else:
        pay = (f"No. At least {km:,} km of walking, stopped by "
               f"{route['gap']['said']:,} km of water.")
    beats.append(("payoff", len(legs) - 1, pay))
    return beats


def _allowed_numbers(route):
    nums = {len(route["countries1"]), len(route["countries1"]) + len(route["countries2"])}
    for km in (route["km1"], route["km1"] + route["km2"]):
        # floors only: a walking distance is a minimum, said as "at least"
        nums |= {n for n in (_floor_km(km), int(km // 1000) * 1000) if n > 0}
    if route["gap"]:
        nums.add(route["gap"]["said"])
    return nums


def _gate(lines, beats, route):
    if len(lines) != len(beats):
        return f"{len(lines)} lines for {len(beats)} beats"
    allowed = _allowed_numbers(route)
    for i, line in enumerate(lines):
        words = line.split()
        if not 3 <= len(words) <= 20:
            return f"line {i + 1} has {len(words)} words"
        for n in re.findall(r"\d[\d,]*", line):
            v = int(n.replace(",", ""))
            if v not in allowed:
                return f"line {i + 1} uses {v}, which we did not compute"
    if "at least" not in lines[-1].lower():
        return "payoff must say 'at least' (our distance is a straight-line minimum)"
    if route["gap"] and (route["gap"].get("islands") or route["gap"]["what"] != "open water") and any(
            w in line.lower() for line in lines for w in ("open water", "open ocean", "open sea")):
        return "calls it open water, but there are islands in between"
    for line in lines:
        low = line.lower()
        if not route["walkable"] and any(w in low for w in ("after crossing", "once you cross",
                                                               "you cross the strait",
                                                               "after you cross")):
            return "a line says you crossed water that cannot be crossed"
    for line, (_, _, txt) in zip(lines, beats):
        if "HYPOTHETICAL" in txt and not re.search(r"\b(would|if|could|imagine)\b", line.lower()):
            return f"'{line}' is past the water but does not say it is imagined"
    hook = lines[0].lower()
    for c in (route["origin"], route["dest"]):
        names = [geo.short(c).lower(), c.lower()] + ALIASES.get(c, [])
        if not any(n in hook for n in names):
            return f"hook does not name {geo.short(c)}"
    return None


def write_script(route, legs, built):
    beats = _beats(route, legs, built)
    plan = "\n".join(f"{i + 1}. [{k.upper()}] {txt}" for i, (k, _, txt) in enumerate(beats))
    prompt = f"""Write the narration for a YouTube Short: "Can you walk from
{geo.short(route['origin'])} to {geo.short(route['dest'])}?"

Write EXACTLY {len(beats)} lines, one per beat, in order:
{plan}

RULES
- Each line 6-15 words. Plain spoken English a 12-year-old would use.
- Talk to the viewer as "you", present tense, as if walking it together.
- Every line must sound different. Never start two lines the same way, never
  use the word "feeling", never copy the beat wording - turn the facts into
  something you would actually say. Name the region when one is given.
- Write numbers as digits. Use ONLY the numbers given in the beats. Never add a
  distance, temperature, time or statistic that is not written above.
- No "subscribe". The only question is the first line.

GOOD STYLE, for tone only:
"Could you walk from India to America?"
"You cross into China and climb the roof of the world."
"Siberia. Nothing but frozen forest for weeks."
"And then the land just ends."

Return ONLY JSON: {{"lines": ["line 1", ...]}}"""
    cfg, llm = _llm()
    last = None
    for attempt in range(3):
        try:
            out = llm.run_json(cfg, prompt, temperature=0.8)
            lines = [str(x).strip() for x in out.get("lines", []) if str(x).strip()]
            problem = _gate(lines, beats, route)
            if not problem:
                return lines, beats
            last = problem
            print(f"      [script] rejected: {problem}")
        except Exception as e:
            last = f"{type(e).__name__}: {str(e)[:90]}"
            print(f"      [script] error: {last}")
    print(f"      [script] using the plain template ({last})")
    lines = []
    for k, _, txt in beats:
        line = _template(k, txt, route)
        if lines and line == lines[-1]:       # two legs in one region read the same
            line = {"cold": "The cold never lets up.", "hot": "The heat never lets up."}.get(
                k, "Days pass, and it still goes on.")
        lines.append(line)
    return lines, beats


def _article(short):
    """'the UK', 'the USA' - short names that need an article in a sentence."""
    return f"the {short}" if short in ("UK", "USA", "UAE", "DR Congo", "Philippines", "Netherlands",
                                       "Central African Republic", "Czech Republic") else short


def _the(country):
    return _article(geo.short(country))


def _template(kind, beat, route):
    """A plain, always-true line per beat for when the model cannot be trusted."""
    o, d = geo.short(route["origin"]), geo.short(route["dest"])
    if kind == "hook":
        return f"Could you walk from {_the(route['origin'])} to {_the(route['dest'])}?"
    if kind == "payoff":
        return beat.replace("The answer: ", "").strip()
    if kind == "stop":
        gap = route["gap"]
        return f"You reach {_the(gap['from'])}, and the land runs out."
    if kind == "detail":
        gap = route["gap"]
        if gap.get("islands"):
            return f"{_the(gap['to'])} is about {gap['said']:,} km away, across the sea and islands."
        return f"{gap['said']:,} km of {gap['what']} to {_the(gap['to'])}, and no road across."
    m = re.search(r"Countries you enter: (.+?)[.]", beat)
    r = re.search(r"Region: (.+?)[.]", beat)
    if m:
        names = [_article(n) for n in m.group(1).split(", ")]
        into = names[0] if len(names) == 1 else ", ".join(names[:-1]) + " and " + names[-1]
        where = f"into {into}"
    elif r:
        regs = r.group(1).split(", ")
        where = "on through " + (" and ".join(regs))
    else:
        still = re.search(r"Still inside (.+?)[.]", beat)
        where = f"on, still inside {_article(still.group(1))}" if still else "on and on"
    if "HYPOTHETICAL" in beat:                # after the water: it never happens
        return f"Even if you got across, you would walk {where}."
    return f"Next you walk {where}." if m else f"You keep walking {where}."


# ------------------------------------------------------------------ build

def slugify(origin, dest):
    s = f"{geo.short(origin)}-to-{geo.short(dest)}".lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def _ensure_registry():
    reg = REMOTION / "src" / "registry.gen.tsx"
    if "GeoWalk" not in reg.read_text(encoding="utf-8") or "GeoList" not in reg.read_text(encoding="utf-8"):
        subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=REMOTION, check=True,
                       shell=False)


def render(comp, props_path, out_path):
    _ensure_registry()
    r = subprocess.run(["node", "scripts/render-geo.mjs", comp, str(props_path), str(out_path)],
                       cwd=REMOTION, capture_output=True, text=True)
    if r.returncode != 0 or not Path(out_path).exists():
        raise RuntimeError(f"render failed: {(r.stderr or r.stdout)[-600:]}")


def make(origin, dest, date=None):
    date = date or datetime.now().strftime("%Y-%m-%d")
    slug = slugify(origin, dest)
    job = JOBS / f"{date}-{slug}"
    job.mkdir(parents=True, exist_ok=True)
    print(f"[route ] {origin} -> {dest}")

    route = plan_route(origin, dest)
    route["origin"], route["dest"] = origin, dest
    if route["walkable"]:
        print(f"      YES, {route['km1']:,.0f} km: {' > '.join(route['countries1'])}")
    else:
        gp = route["gap"]
        print(f"      NO: {route['km1']:,.0f} km to {gp['from']}, then {gp['km']:.0f} km of water"
              f" ({gp['water'] or 'open sea'}) to {gp['to']}")

    legs = plan_legs(route)
    built = build_legs(route, legs, slug)
    print(f"[legs  ] {len(built)}: " + ", ".join(b["mood"] for b in built))

    lines, beats = write_script(route, legs, built)
    for i, l in enumerate(lines, 1):
        print(f"      {i:2d}. {l}")

    kinds = [k if k != "detail" else "payoff" for k, _, _ in beats]
    vo, voice = narrate.narrate(lines, kinds, job)
    first_line = {}
    for li, (_, leg_i, _) in enumerate(beats):
        first_line.setdefault(leg_i, li)
    for i, b in enumerate(built):
        b["from"] = 0 if i == 0 else first_line.get(i, 0)
    secs = round(vo[-1]["end"] + 1.2, 2)

    card = None
    if not route["walkable"]:
        gap_leg = next(i for i, l in enumerate(legs) if l["kind"] == "gap")
        start = first_line[gap_leg]
        gp = route["gap"]
        card = {"title": (gp["water"] or "No land route").upper(),
                "sub": f"{gp['said']:,} km of "
                       + ("sea and islands" if gp.get("islands") else gp["what"]),
                "fromLine": start, "toLine": min(len(vo) - 1, start + 2)}

    props = {
        "legs": [{k: v for k, v in b.items() if k != "countries"} for b in built],
        "vo": vo,
        "hook": {"top": f"{geo.short(origin)} → {geo.short(dest)}", "bottom": "on foot?"},
        "card": card,
        "durationInSeconds": secs,
    }
    props_path = job / "props.json"
    props_path.write_text(json.dumps(props), encoding="utf-8")

    print(f"[render] {secs:.1f}s")
    silent = job / "silent.mp4"
    render("GeoWalk", props_path, silent)

    import score
    bed = job / "score.wav"
    score.build_score(bed, secs + 0.5, tone="curious", seed=len(slug))
    kinds_map = {"hot": "desert", "cold": "wind_cold", "walk": "wind_warm",
                 "tired": "wind_cold", "cheer": "wind_warm"}
    segments = []
    for b, leg in zip(built, legs):
        kind = ("sea_ice" if leg["cold"] else "sea") if leg["mood"] == "stop" \
            else kinds_map.get(leg["mood"], "wind_warm")
        if leg["mood"] == "tired" and not leg["cold"]:
            kind = "wind_warm"
        segments.append((vo[b["from"]]["start"], kind))
    amb = ambience.build_track(segments, secs + 0.5, job / "ambience.wav")

    OUT.mkdir(parents=True, exist_ok=True)
    final = OUT / f"{date}-walk-{slug}.mp4"
    mix.mix(silent, voice, bed, final, ambience=amb)

    o, d = geo.short(origin), geo.short(dest)
    meta = {
        "kind": "walk", "file": str(final), "slug": slug, "date": date,
        "title": f"Can You Walk from {o} to {d}? 🌍🚶",
        "description": (f"Can you really walk from {o} to {d}? We traced the route on real "
                        f"borders.\n\n" + " ".join(lines) + "\n\n"
                        "#geography #maps #shorts #travel #didyouknow"),
        "tags": ["geography", "maps", "walk", o, d, "geography facts", "map animation",
                 "can you walk", "shorts"],
        "facts": {"walkable": route["walkable"], "km1": round(route["km1"]),
                  "countries": route["countries1"] + route["countries2"],
                  "gap_km": round(route["gap"]["km"], 1) if route["gap"] else None,
                  "water": route["gap"]["water"] if route["gap"] else None},
        "lines": lines,
    }
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {final}  ({mix.duration(final):.1f}s)")
    return meta


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("origin")
    ap.add_argument("dest")
    a = ap.parse_args()
    make(a.origin, a.dest)
