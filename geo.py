"""Shared geometry for the channel: imagery crops, projection, borders, flags.

Everything that places something on a map lives here, so the walk videos and
the "your country" videos draw with the same rules:

  * NASA Blue Marble is the ground (public domain, equirectangular — one pixel is
    the same number of degrees everywhere, so a leg window is a plain rectangle);
  * Natural Earth 10m is the borders (public domain);
  * flags come from flagcdn (national flags are public domain).

Longitudes are handled "continuously": a route that crosses the date line keeps
counting past 180 rather than wrapping to -180, and every point is folded to
within half a world of the window it is drawn in. The Bering Strait sits exactly
on that seam, and it is the payoff of the channel's biggest format.
"""
import json
import math
import urllib.request
from pathlib import Path

from PIL import Image

import routes

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
MEDIA = ROOT / "media"
FLAGS = MEDIA / "flags"
W, H = 1080, 1920
ASPECT = W / H

Image.MAX_IMAGE_PIXELS = None
_BM = None
_ISO = None

# Everyday names for titles and labels. Natural Earth's NAME is precise but not
# how anyone says it out loud.
SHORT = {
    "United States of America": "USA", "United Kingdom": "UK",
    "Dem. Rep. Congo": "DR Congo", "Central African Rep.": "Central African Republic",
    "Bosnia and Herz.": "Bosnia", "Dominican Rep.": "Dominican Republic",
    "S. Sudan": "South Sudan", "Eq. Guinea": "Equatorial Guinea",
    "Czechia": "Czechia", "Macedonia": "North Macedonia", "N. Macedonia": "North Macedonia",
    "Côte d'Ivoire": "Ivory Coast", "eSwatini": "Eswatini", "W. Sahara": "Western Sahara",
    "Solomon Is.": "Solomon Islands", "Falkland Is.": "Falklands",
}


def short(name):
    return SHORT.get(name, name)


# ------------------------------------------------------------------ imagery

def bluemarble():
    global _BM
    if _BM is None:
        _BM = Image.open(ASSETS / "bluemarble.jpg")
        _BM.load()
    return _BM


def crop(lon0, lon1, lat0, lat1, out):
    """Cut a window out of the mosaic and save it at 1080x1920.

    The mosaic's left edge is 180 WEST. Windows may run past either edge (the
    Pacific legs do), so they are cut in pieces and stitched.
    """
    im = bluemarble()
    sw, sh = im.size
    ppd = sw / 360.0
    x0 = (lon0 + 180.0) * ppd
    box_w = max(1, int(round((lon1 - lon0) * ppd)))
    y0 = int(round((90 - lat1) * ppd))
    box_h = max(1, int(round((lat1 - lat0) * ppd)))
    y0 = max(0, min(sh - box_h, y0))
    canvas = Image.new("RGB", (box_w, box_h))
    start = int(round(x0)) % sw
    first = min(box_w, sw - start)
    canvas.paste(im.crop((start, y0, start + first, y0 + box_h)), (0, 0))
    filled = first
    while filled < box_w:
        take = min(sw, box_w - filled)
        canvas.paste(im.crop((0, y0, take, y0 + box_h)), (filled, 0))
        filled += take
    canvas = canvas.resize((W, H), Image.LANCZOS)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, quality=88)
    return canvas


def is_water(img, x, y):
    """Blue Marble's sea is deep blue; land, desert, forest and ice are not."""
    if not (0 <= x < img.width and 0 <= y < img.height):
        return True
    r, g, b = img.getpixel((int(x), int(y)))[:3]
    return b > r + 28 and b >= g - 6 and (r + g + b) < 480


# ------------------------------------------------------------------ windows

class Window:
    """A 9:16 lon/lat rectangle, with continuous longitudes."""

    def __init__(self, lon0, lon1, lat0, lat1):
        self.lon0, self.lon1, self.lat0, self.lat1 = lon0, lon1, lat0, lat1

    @property
    def clon(self):
        return (self.lon0 + self.lon1) / 2

    def fold(self, lon):
        """The copy of this longitude nearest the window."""
        return lon + 360 * round((self.clon - lon) / 360)

    def px(self, lon, lat):
        lon = self.fold(lon)
        return ((lon - self.lon0) / (self.lon1 - self.lon0) * W,
                (self.lat1 - lat) / (self.lat1 - self.lat0) * H)

    def contains(self, lon, lat, margin=0.0):
        lon = self.fold(lon)
        dl = (self.lon1 - self.lon0) * margin
        dh = (self.lat1 - self.lat0) * margin
        return (self.lon0 - dl <= lon <= self.lon1 + dl
                and self.lat0 - dh <= lat <= self.lat1 + dh)

    def as_dict(self):
        return {"lon0": self.lon0, "lon1": self.lon1, "lat0": self.lat0, "lat1": self.lat1}


def fit_window(points, pad=0.3, min_dlat=14.0, max_dlat=80.0):
    """The 9:16 window that holds these (continuous-lon) points with room."""
    lons = [p[0] for p in points]
    lats = [p[1] for p in points]
    cx, cy = (min(lons) + max(lons)) / 2, (min(lats) + max(lats)) / 2
    dlon = (max(lons) - min(lons)) * (1 + pad)
    dlat = (max(lats) - min(lats)) * (1 + pad)
    dlat = max(dlat, dlon / ASPECT, min_dlat)
    dlat = min(dlat, max_dlat)
    dlon = dlat * ASPECT
    lat0, lat1 = cy - dlat / 2, cy + dlat / 2
    if lat1 > 84:
        lat0, lat1 = lat0 - (lat1 - 84), 84
    if lat0 < -84:
        lat0, lat1 = -84, lat1 + (-84 - lat0)
    return Window(cx - dlon / 2, cx + dlon / 2, lat0, lat1)


def unwrap(points):
    """Make a lon/lat polyline continuous across the date line."""
    out = []
    for lon, lat in points:
        if out:
            prev = out[-1][0]
            lon = lon + 360 * round((prev - lon) / 360)
        out.append((lon, lat))
    return out


# ------------------------------------------------------------------ outlines

def svg_path(rings, win, min_step=1.6, margin=0.35):
    """Pixel path for a country in a window: only rings that show, thinned to
    what a 1080-wide frame can actually draw."""
    parts = []
    for ring in rings:
        if not any(win.contains(lon, lat, margin) for lon, lat in ring[::max(1, len(ring) // 400)]):
            continue
        pts, last = [], None
        # fold the whole ring by its first point, so a ring that straddles the
        # date line is not torn in half
        ref = win.fold(ring[0][0])
        shift = ref - ring[0][0]
        for lon, lat in ring:
            x = (lon + shift - win.lon0) / (win.lon1 - win.lon0) * W
            y = (win.lat1 - lat) / (win.lat1 - win.lat0) * H
            if last is None or abs(x - last[0]) + abs(y - last[1]) >= min_step:
                pts.append((x, y))
                last = (x, y)
        if len(pts) >= 3:
            parts.append("M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z")
    return " ".join(parts)


def country_points_in(rings, win, step=6):
    """Visible sample points of a country, for placing its label."""
    pts = []
    for ring in rings:
        for lon, lat in ring[::step]:
            if win.contains(lon, lat, -0.08):
                pts.append(win.px(lon, lat))
    return pts


# ------------------------------------------------------------------ flags

def _iso_table():
    global _ISO
    if _ISO is None:
        _ISO = {}
        data = json.loads((ASSETS / "ne10m.geojson").read_text(encoding="utf-8"))
        for f in data["features"]:
            p = f["properties"]
            for key in ("ISO_A2_EH", "ISO_A2", "WB_A2"):
                code = str(p.get(key) or "")
                if len(code) == 2 and code.isalpha():
                    _ISO[p.get("NAME")] = code.lower()
                    break
    return _ISO


def flag(country):
    """Path (under media/) of this country's flag, downloading it once."""
    code = _iso_table().get(country)
    if not code:
        return None
    FLAGS.mkdir(parents=True, exist_ok=True)
    dest = FLAGS / f"{code}.png"
    if not dest.exists():
        try:
            with urllib.request.urlopen(f"https://flagcdn.com/w640/{code}.png", timeout=30) as r:
                dest.write_bytes(r.read())
        except Exception:
            return None
    return f"flags/{code}.png"


# ------------------------------------------------------------------ borders

def _cells(ring, cell=0.05):
    ncols = int(round(360 / cell))
    out = set()
    for i in range(len(ring) - 1):
        (x0, y0), (x1, y1) = ring[i], ring[i + 1]
        steps = min(4000, max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / cell)))
        for k in range(steps):
            t = k / steps
            out.add((round((x0 + (x1 - x0) * t) / cell) % ncols,
                     round((y0 + (y1 - y0) * t) / cell)))
    return out


_CELL_CACHE = {}


def crossing(graph, pa, pb, prev, target, cell=0.05):
    """Where a walker crosses from landmass pa into pb: the point on their shared
    border that keeps them heading for the target."""
    for pid in (pa, pb):
        if pid not in _CELL_CACHE:
            _CELL_CACHE[pid] = _cells(graph["parts"][pid][1], cell)
    shared = _CELL_CACHE[pa] & _CELL_CACHE[pb]
    if not shared:
        a = graph["parts"][pa][1]
        b = graph["parts"][pb][1]
        return ((a[0][0] + b[0][0]) / 2, (a[0][1] + b[0][1]) / 2)
    ncols = int(round(360 / cell))
    best, cost = None, float("inf")
    for cx, cy in shared:
        lon = cx * cell
        if lon > 180:
            lon -= ncols * cell
        pt = (lon, cy * cell)
        c = routes.haversine(prev, pt) + routes.haversine(pt, target)
        if c < cost:
            best, cost = pt, c
    return best


def main_part(graph, country):
    return routes._main_part(graph, country)


def part_at(graph, parts, pt):
    """Which of these landmasses is nearest the point."""
    best, dist = None, float("inf")
    for pid in parts:
        ring = graph["parts"][pid][1]
        for q in ring[::max(1, len(ring) // 300)]:
            d = routes.haversine(pt, q)
            if d < dist:
                best, dist = pid, d
    return best


def capital(graph, country):
    cap = graph["capitals"].get(country)
    if cap:
        return tuple(cap)
    ring = graph["parts"][main_part(graph, country)][1]
    return (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))
