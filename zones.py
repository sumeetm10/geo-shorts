"""Split the world into 4 by the Equator and the Greenwich meridian, and count it.

    python zones.py          print the numbers the video will use

Everything is computed from Natural Earth (assets/ne10m.geojson, population
estimates for 2019, and assets/places.geojson, 7,342 cities):
- land area: each country's shape cut by the two lines, measured in an
  equal-area projection (Lambert cylindrical: x = lon, y = sin(lat));
- people: a country inside one zone counts whole; a country the lines cut
  (Brazil, the UK, France, Indonesia, Kenya...) is split by where its cities'
  people live, or by land area if it has no listed cities.
"""
import json
import math
import sys
from pathlib import Path

from shapely.geometry import box, shape
from shapely.ops import transform

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
ZONES = {"NE": box(0, 0, 180, 90), "NW": box(-180, 0, 0, 90),
         "SE": box(0, -90, 180, 0), "SW": box(-180, -90, 0, 0)}
EARTH_R = 6371.0088


def _equal_area(geom):
    return transform(lambda x, y, z=None: (math.radians(x) * EARTH_R, math.sin(math.radians(y)) * EARTH_R), geom)


def zone_of(lon, lat):
    return ("N" if lat >= 0 else "S") + ("E" if lon >= 0 else "W")


def compute():
    countries = json.loads((ASSETS / "ne10m.geojson").read_text(encoding="utf-8"))["features"]
    places = json.loads((ASSETS / "places.geojson").read_text(encoding="utf-8"))["features"]
    by_a3 = {}
    for p in places:
        pr = p["properties"]
        by_a3.setdefault(pr.get("adm0_a3"), []).append((pr["longitude"], pr["latitude"], pr.get("pop_max") or 0))
    out = {z: {"people": 0.0, "area": 0.0, "countries": 0, "split": []} for z in ZONES}
    for c in countries:
        pr = c["properties"]
        geom = shape(c["geometry"])
        if not geom.is_valid:
            geom = geom.buffer(0)
        parts = {z: geom.intersection(b) for z, b in ZONES.items()}
        areas = {z: _equal_area(g).area for z, g in parts.items()}
        total = sum(areas.values()) or 1
        inside = [z for z, a in areas.items() if a / total > 0.001]
        pop = float(pr.get("POP_EST") or 0)
        for z in ZONES:
            out[z]["area"] += areas[z]
        if len(inside) == 1:
            out[inside[0]]["people"] += pop
            out[inside[0]]["countries"] += pr.get("TYPE") in ("Sovereign country", "Country")
            continue
        cities = by_a3.get(pr.get("ADM0_A3"), [])
        weights = {z: 0.0 for z in ZONES}
        for lon, lat, n in cities:
            weights[zone_of(lon, lat)] += n
        wsum = sum(weights.values())
        if wsum <= 0:                                  # no listed cities: share by land
            weights, wsum = {z: areas[z] for z in ZONES}, total
        for z in ZONES:
            out[z]["people"] += pop * weights[z] / wsum
        out_split = {z: round(100 * weights[z] / wsum) for z in inside}
        for z in inside:
            out[z]["split"].append((pr["NAME"], out_split))
    people = sum(v["people"] for v in out.values())
    land = sum(v["area"] for v in out.values())
    for z, v in out.items():
        v["people_share"] = v["people"] / people
        v["land_share"] = v["area"] / land
    return out, people, land


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    out, people, land = compute()
    print(f"world: {people / 1e9:.2f} billion people, {land / 1e6:.1f} million km2 of land")
    for z, v in out.items():
        print(f"{z}: {v['people'] / 1e9:5.2f} bn ({100 * v['people_share']:4.1f}%)  land {v['area'] / 1e6:5.1f} M km2 "
              f"({100 * v['land_share']:4.1f}%)  whole countries {v['countries']}")
    split = {}
    for z, v in out.items():
        for name, s in v["split"]:
            split[name] = s
    print("cut by the lines:", "; ".join(f"{n} {s}" for n, s in sorted(split.items())))
