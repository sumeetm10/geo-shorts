"""River lines for the river-journey Shorts (RiverSwim.tsx).

Natural Earth's 10m river centrelines (assets/ne10m_rivers.geojson, public
domain) store a big river as several named pieces (the Yangtze is "Jinsha",
"Yangtze" and "Chang Jiang", all name_en "Yangtze"). river() joins the pieces
into one line running from the source to the sea and thins it for drawing.

    python rivers.py Yangtze      prints the joined line's length and ends
"""
import json
import math
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent / "assets" / "ne10m_rivers.geojson"


def _km(a, b):
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(math.radians(b[0] - a[0]) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def length_km(line):
    return sum(_km(line[i], line[i + 1]) for i in range(len(line) - 1))


def _pieces(name):
    d = json.loads(SRC.read_text(encoding="utf-8"))
    out = []
    for f in d["features"]:
        names = name if isinstance(name, (list, tuple)) else [name]     # e.g. Amazon = Ucayali + Amazonas
        if (f["properties"].get("name_en") or f["properties"].get("name")) not in names:
            continue
        g = f["geometry"]
        out += g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
    return [[tuple(p[:2]) for p in seg] for seg in out if len(seg) > 1]


def river(name, mouth, points=320):
    """The river as one [lon, lat] line from source to mouth. `mouth` is a
    (lon, lat) near where it reaches the sea: the chain is grown backwards from
    the piece that ends nearest it, always taking the piece whose end meets the
    current start, so side branches and islands' channels are left out."""
    pieces = _pieces(name)
    if not pieces:
        raise SystemExit(f"no river called {name} in {SRC.name}")
    # orient every piece so it flows toward the mouth end of the chain later
    first = min(pieces, key=lambda s: min(_km(s[0], mouth), _km(s[-1], mouth)))
    left = [p for p in pieces if p is not first]
    chain = list(first[::-1] if _km(first[0], mouth) < _km(first[-1], mouth) else first)
    while left:
        head = chain[0]
        best, flip, gap = None, False, 25.0                       # km: pieces must touch
        for s in left:
            for cand, fl in ((s, False), (s[::-1], True)):
                g = _km(cand[-1], head)
                if g < gap:
                    best, flip, gap = s, fl, g
        if best is None:
            break
        seg = best[::-1] if flip else best
        chain = list(seg) + chain
        left.remove(best)
    if _km(chain[-1], mouth) > 5:                                  # the data can stop short of the coast
        chain.append(tuple(mouth))
    # thin to about `points` vertices, evenly by distance
    total = length_km(chain)
    step = total / points
    out, acc = [chain[0]], 0.0
    for i in range(1, len(chain)):
        acc += _km(chain[i - 1], chain[i])
        if acc >= step:
            out.append(chain[i])
            acc = 0.0
    if out[-1] != chain[-1]:
        out.append(chain[-1])
    return [[round(x, 4), round(y, 4)] for x, y in out]


if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Yangtze"
    mouths = {"Yangtze": (121.9, 31.4), "Nile": (31.3, 31.5), "Ganges": (90.5, 22.3), "Amazonas": (-50.0, -0.2)}
    line = river(name, mouths[name])
    print(name, len(line), "points", round(length_km(line)), "km", "source", line[0], "mouth", line[-1])
