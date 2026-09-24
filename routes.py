"""Walking routes between countries, computed from real borders.

The series is "Can you walk from X to Y?", so the pipeline has to answer that
question itself rather than take an LLM's word for it:

  * which countries a walker would cross, from a land-border graph built out of
    Natural Earth 10m polygons;
  * how far it is, by haversine along the waypoints;
  * and when the answer is NO, which water stops them and how wide it is,
    measured between the two coastlines.

Borders that exist on a map but cannot be walked (the Bering Strait, the
Channel, Gibraltar) are removed by hand below — this is the one place where a
data-only answer would be wrong, and it is the payoff of every video, so it is
worth stating explicitly.
"""
import json
import math
import pickle
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
CACHE = ROOT / "data" / "geograph.pkl"

# Countries whose polygons touch or nearly touch, but which no one can walk
# between. Each is the reason a video exists, so they are named, not inferred.
NOT_WALKABLE = {
    frozenset({"Russia", "United States of America"}),   # Bering Strait
    frozenset({"France", "United Kingdom"}),             # Channel (tunnel is rail only)
    frozenset({"Spain", "Morocco"}),                     # Strait of Gibraltar (Ceuta/Melilla aside)
    frozenset({"Denmark", "Sweden"}),                    # Oresund bridge, no pedestrians
    frozenset({"Italy", "Albania"}),
    frozenset({"Turkey", "Greece"}) - {"Turkey", "Greece"},  # (they DO share a land border)
    frozenset({"Egypt", "Saudi Arabia"}),                # Red Sea
    frozenset({"Yemen", "Djibouti"}),                    # Bab-el-Mandeb
    frozenset({"Indonesia", "Malaysia"}) - {"Indonesia", "Malaysia"},  # (Borneo is a land border)
    frozenset({"Panama", "Colombia"}) - {"Panama", "Colombia"},  # (Darien is land, if brutal)
}
NOT_WALKABLE = {p for p in NOT_WALKABLE if len(p) == 2}

CELL = 0.03          # degrees; borders sharing a cell are treated as touching
NCOLS = int(round(360 / CELL))   # the grid wraps: +180 and -180 are one column
R_EARTH = 6371.0


def haversine(a, b):
    """Kilometres between two [lon, lat] points."""
    lon1, lat1 = math.radians(a[0]), math.radians(a[1])
    lon2, lat2 = math.radians(b[0]), math.radians(b[1])
    h = (math.sin((lat2 - lat1) / 2) ** 2
         + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2)
    return 2 * R_EARTH * math.asin(math.sqrt(h))


def _load_raw():
    countries, capitals = {}, {}
    data = json.loads((ASSETS / "ne10m.geojson").read_text(encoding="utf-8"))
    for feat in data["features"]:
        name = feat["properties"].get("NAME")
        geom = feat["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        rings = [p[0] for p in polys]
        if name and rings:
            countries[name] = rings

    places = json.loads((ASSETS / "places.geojson").read_text(encoding="utf-8"))
    for feat in places["features"]:
        p = feat["properties"]
        if str(p.get("featurecla", "")).startswith("Admin-0 capital"):
            capitals.setdefault(p.get("adm0name"), feat["geometry"]["coordinates"])
    return countries, capitals


def build(force=False):
    """Border graph + capitals, cached — the parse alone takes a few seconds.

    The graph's nodes are LANDMASSES, not countries. On country nodes the first
    test route walked France -> Brazil, because Natural Earth's France includes
    French Guiana: a real border that no walker can reach from Paris. Splitting
    every country into its separate polygons removes that whole class of lie
    (Denmark/Greenland, the Netherlands' islands, Alaska, and so on).
    """
    if CACHE.exists() and not force:
        return pickle.loads(CACHE.read_bytes())

    countries, capitals = _load_raw()
    parts = {}                      # part id -> (country, ring)
    for name, rings in countries.items():
        for i, ring in enumerate(rings):
            parts[f"{name}#{i}"] = (name, ring)

    # Densify before gridding. Adjacency is "these two outlines pass through the
    # same cell", and a border drawn as one straight line has almost no vertices
    # in between: the Alaska-Canada border is a single meridian, so Alaska was
    # not connected to anything and America became unreachable by land.
    cells = {}
    for pid, (_, ring) in parts.items():
        for i in range(len(ring) - 1):
            (x0, y0), (x1, y1) = ring[i], ring[i + 1]
            steps = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / CELL))
            if steps > 4000:            # a ring that wraps the globe: skip the fill
                steps = 4000
            for k in range(steps):
                t = k / steps
                lon, lat = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
                # wrap the column, or the date line becomes an ocean: Natural
                # Earth splits polygons at 180, so Chukotka's tip past the line
                # is its own piece. Unjoined, Russia stopped 548 km short of
                # Alaska and every Asia-to-America video would have been wrong.
                cells.setdefault((round(lon / CELL) % NCOLS, round(lat / CELL)),
                                 set()).add(pid)

    adj = {}
    for pids in cells.values():
        if len(pids) < 2:
            continue
        for a in pids:
            for b in pids:
                if a == b:
                    continue
                ca, cb = parts[a][0], parts[b][0]
                if ca != cb and frozenset({ca, cb}) in NOT_WALKABLE:
                    continue
                adj.setdefault(a, set()).add(b)

    graph = {"countries": countries, "capitals": capitals, "adj": adj,
             "parts": parts}
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_bytes(pickle.dumps(graph))
    return graph


def _coast_points(ring, step=12):
    return ring[::step]


def _dlon(a, b):
    """Longitude difference the short way round — the Bering pair is 170E vs
    165W, which a naive subtraction calls 335 degrees apart and skips."""
    d = abs(a - b) % 360
    return min(d, 360 - d)


def _ring_area(ring):
    """Rough area in square degrees, latitude-corrected.

    A bounding box was not good enough: the USA's "biggest" ring came out as the
    Aleutian chain, because it crosses the antimeridian and its raw longitude
    span reads as most of the planet. Everything downstream then measured
    distances to a few specks in the Pacific instead of to America.
    """
    lons = [q[0] for q in ring]
    # unwrap: keep the ring continuous across the date line
    unwrapped, prev = [lons[0]], lons[0]
    for lon in lons[1:]:
        while lon - prev > 180:
            lon -= 360
        while prev - lon > 180:
            lon += 360
        unwrapped.append(lon)
        prev = lon
    lats = [q[1] for q in ring]
    mid = math.radians(sum(lats) / len(lats))
    area = 0.0
    for i in range(len(ring) - 1):
        area += (unwrapped[i] * lats[i + 1] - unwrapped[i + 1] * lats[i])
    return abs(area) / 2 * math.cos(mid)


def _main_part(graph, country):
    """The country's biggest landmass — where its capital and its people are."""
    best, area = None, -1
    for pid, (name, ring) in graph["parts"].items():
        if name != country or len(ring) < 4:
            continue
        a = _ring_area(ring)
        if a > area:
            best, area = pid, a
    return best


def component(graph, pid):
    """Every landmass you can walk to from this one."""
    seen, q = {pid}, deque([pid])
    while q:
        cur = q.popleft()
        for nxt in graph["adj"].get(cur, ()):
            if nxt not in seen:
                seen.add(nxt)
                q.append(nxt)
    return seen


def gap_between(graph, reach_parts, target_parts):
    """Narrowest water between two sets of landmasses.

    Measured part to part, and returned WITH the landmass it leaves from, so the
    walk can be drawn to the exact coast where it stops. Measuring to the target
    COUNTRY was wrong in an instructive way: from India, Argentina's nearest
    coast is across 5,800 km of Atlantic from Senegal, but the real answer is
    that the Americas are only ever 82 km away — at the Bering Strait.
    """
    tgt = [(pid, _coast_points(graph["parts"][pid][1], 10)) for pid in target_parts]

    def scan(window):
        best = (float("inf"), None, None, None)
        for pid in reach_parts:
            ring = graph["parts"][pid][1]
            if len(ring) < 8:
                continue
            for a in _coast_points(ring, 10):
                for _, pts in tgt:
                    for b in pts:
                        if _dlon(a[0], b[0]) > window or abs(a[1] - b[1]) > window:
                            continue
                        d = haversine(a, b)
                        if d < best[0]:
                            best = (d, pid, a, b)
        return best

    # a narrow window first (fast, and right for a strait), then widen — the UK
    # to America is an ocean apart and was being filtered out before measuring
    for window in (30, 90, 360):
        best = scan(window)
        if best[1] is not None:
            return best
    return best


def _named(graph, pids):
    out = []
    for pid in pids:
        name = graph["parts"][pid][0]
        if not out or out[-1] != name:
            out.append(name)
    return out


def _chain(prev, pid):
    out = []
    while pid is not None:
        out.append(pid)
        pid = prev[pid]
    out.reverse()
    return out


def route(start, end, graph=None):
    """Walk from start to end: the countries crossed, or where the water wins."""
    graph = graph or build()
    caps = graph["capitals"]
    for c in (start, end):
        if c not in graph["countries"]:
            raise KeyError(f"unknown country: {c}")

    src = _main_part(graph, start)
    goal = {pid for pid, (name, _) in graph["parts"].items() if name == end}

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

    def measure(path_names):
        pts = [caps.get(c) for c in path_names]
        return round(sum(haversine(pts[i], pts[i + 1])
                         for i in range(len(pts) - 1) if pts[i] and pts[i + 1]))

    if hit:
        path = _named(graph, _chain(prev, hit))
        return {"walkable": True, "path": path, "km": measure(path),
                "waypoints": [{"country": c, "lonlat": caps.get(c)} for c in path]}

    # Unreachable: the honest question is how close the walk can get to the
    # destination's landmass — its whole connected continent, not the country.
    target_side = component(graph, _main_part(graph, end))
    km_gap, from_pid, a, b = gap_between(graph, set(prev), target_side)
    path = _named(graph, _chain(prev, from_pid)) if from_pid else [start]
    return {"walkable": False, "path": path, "km": measure(path),
            "waypoints": [{"country": c, "lonlat": caps.get(c)} for c in path],
            "blocked_by": {"km": round(km_gap, 1),
                           "from_country": graph["parts"][from_pid][0] if from_pid else None,
                           "to_country": graph["parts"][
                               min(target_side, key=lambda p: haversine(b, graph["parts"][p][1][0]))
                           ][0] if from_pid else end,
                           "from": a, "to": b}}


if __name__ == "__main__":
    import sys

    g = build(force="--rebuild" in sys.argv)
    print(f"landmasses {len(g[chr(39)+chr(39)]) if False else len(g['parts'])}  capitals {len(g['capitals'])}")
    pairs = [("India", "United States of America"), ("India", "Argentina"),
             ("India", "Portugal"), ("India", "Australia"),
             ("Nepal", "South Africa"), ("United Kingdom", "United States of America")]
    for a, b in pairs:
        r = route(a, b, g)
        if r["walkable"]:
            print(f"\n{a} -> {b}: YES  {r['km']:,} km, {len(r['path'])} countries")
            print("   " + " > ".join(r["path"]))
        else:
            k = r["blocked_by"]
            print(f"\n{a} -> {b}: NO   {r['km']:,} km to {k['from_country']}, "
                  f"then {k['km']} km of water to {k['to_country']}")
            print("   " + " > ".join(r["path"]))
