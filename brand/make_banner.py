"""Channel banner: the world map from the videos, the name, and the walker.

    python brand/make_banner.py      -> brand/banner.jpg (2560x1440) + brand/banner_preview.png

YouTube shows 2560x1440 on TVs, a 2560x423 middle strip on desktop and only the
middle 1546x423 on phones, so everything that matters sits in that last box.
Map = NASA Blue Marble, borders = Natural Earth: public domain, like the videos.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_avatar import GOLD, walker  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "brand"
W, H = 2560, 1440
SAFE = (507, 508, 2053, 931)                 # the phone-visible box
# The walk on the banner is a real one, over land only: along the Sahel from
# Dakar to the Ethiopian highlands. (The first draft ran from Brazil across the
# Atlantic - on a channel whose answer is "you cannot walk on water".) The map
# is placed so that walk runs along the bottom of the phone box, under the words.
TRAIL = [(-17.4, 14.7), (-8.0, 12.6), (2.1, 13.5), (15.0, 12.1), (30.2, 13.2), (39.5, 13.5)]
FEET = (1790, 890)                            # where the trail ends, in banner pixels
PPD = (FEET[0] - 540) / (TRAIL[-1][0] - TRAIL[0][0])   # Dakar lands at x = 540
LON0 = TRAIL[-1][0] - FEET[0] / PPD
LON1 = LON0 + W / PPD
LAT0 = TRAIL[-1][1] + FEET[1] / PPD
LAT1 = LAT0 - H / PPD
FONTS = Path(r"C:\Windows\Fonts")
NAME = "Atlas On Foot"


def px(lon, lat, s=1):
    return ((lon - LON0) / (LON1 - LON0) * W * s, (LAT0 - lat) / (LAT0 - LAT1) * H * s)


def map_layer():
    Image.MAX_IMAGE_PIXELS = None          # our own 21600x10800 NASA file
    im = Image.open(ROOT / "assets" / "bluemarble.jpg")
    im.draft("RGB", (10800, 5400))         # half scale, 30 px/degree: sharper than the banner needs
    ppd = im.width / 360
    box = (int((LON0 + 180) * ppd), int((90 - LAT0) * ppd),
           int((LON1 + 180) * ppd), int((90 - LAT1) * ppd))
    img = im.crop(box).resize((W, H), Image.LANCZOS).convert("RGBA")
    # darker behind the words (left), lighter toward the walker, and a vignette
    xs = np.linspace(0, 1, W)[None, :]
    ys = np.abs(np.linspace(-1, 1, H))[:, None]
    a = 0.74 - 0.30 * xs + 0.22 * ys ** 2
    shade = np.zeros((H, W, 4), np.uint8)
    shade[..., :3] = (5, 10, 20)
    shade[..., 3] = (a.clip(0, 0.92) * 255).astype(np.uint8)
    img.alpha_composite(Image.fromarray(shade, "RGBA"))
    return img


def borders(layer, s):
    d = ImageDraw.Draw(layer)
    gj = json.loads((ROOT / "assets" / "ne10m.geojson").read_text(encoding="utf-8"))
    for f in gj["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in polys:
            ring = poly[0]
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            if max(xs) < LON0 or min(xs) > LON1 or max(ys) < LAT1 or min(ys) > LAT0:
                continue
            pts = [px(x, y, s) for x, y in ring[::2]]
            if len(pts) > 2:
                d.line(pts + [pts[0]], fill=(255, 255, 255, 70), width=2 * s // 2 or 1)


def route(d, s):
    """The dashed gold walk through TRAIL (Catmull-Rom), ending at the walker's feet."""
    ctrl = [px(lon, lat, s) for lon, lat in TRAIL]
    ctrl = [ctrl[0]] + ctrl + [ctrl[-1]]
    pts = []
    for k in range(1, len(ctrl) - 2):
        p0, p1, p2, p3 = ctrl[k - 1], ctrl[k], ctrl[k + 1], ctrl[k + 2]
        for i in range(40):
            t = i / 40
            pts.append(tuple(0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t
                                    + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3)
                             for j in range(2)))
    pts.append(ctrl[-2])
    for i in range(0, len(pts) - 6, 9):
        seg = pts[i:i + 5]
        d.line(seg, fill=(20, 16, 4, 255), width=20 * s, joint="curve")
    for i in range(0, len(pts) - 6, 9):
        seg = pts[i:i + 5]
        d.line(seg, fill=GOLD + (255,), width=12 * s, joint="curve")
    # where the walk started
    x, y = pts[0]
    d.ellipse([x - 16 * s, y - 16 * s, x + 16 * s, y + 16 * s], fill=GOLD + (255,),
              outline=(20, 16, 4, 255), width=5 * s)


def words(d, s):
    """Just the name, centred in the phone box beside the walker."""
    x0 = SAFE[0] + 60
    room = (1680 - x0) * s                    # stop well short of the walker
    size = 220
    while True:
        title = ImageFont.truetype(str(FONTS / "seguibl.ttf"), size * s)
        if d.textlength(NAME, font=title) <= room or size <= 90:
            break
        size -= 4
    # centre the ink (not the font box) on the walker's middle
    top, bottom = d.textbbox((0, 0), NAME, font=title)[1::2]
    y = (FEET[1] - 175) * s - (top + bottom) / 2
    # "Atlas On Foot": the walking half in gold
    x = x0 * s
    for part, col in (("Atlas ", (255, 255, 255)), ("On Foot", GOLD)):
        d.text((x + 6 * s, y + 8 * s), part, font=title, fill=(0, 0, 0, 150))
        d.text((x, y), part, font=title, fill=col + (255,))
        x += d.textlength(part, font=title)
    return [d.textbbox((x0 * s, y), NAME, font=title)]


def main():
    s = 2                                     # vector layer drawn at 2x, then halved
    base = map_layer()
    over = Image.new("RGBA", (W * s, H * s), (0, 0, 0, 0))
    borders(over, s)
    d = ImageDraw.Draw(over)
    route(d, s)
    boxes = words(d, s)
    walker(d, FEET[0] * s, FEET[1] * s, h=350 * s)
    base.alpha_composite(over.resize((W, H), Image.LANCZOS))

    for b in boxes:                           # fail loudly if anything left the phone box
        x0, y0, x1, y1 = (v / s for v in b)
        assert SAFE[0] <= x0 and x1 <= SAFE[2] and SAFE[1] <= y0 and y1 <= SAFE[3], (b, SAFE)

    OUT.mkdir(exist_ok=True)
    final = base.convert("RGB")
    final.save(OUT / "banner.jpg", quality=92, optimize=True)

    # preview: TV (whole), desktop strip, phone strip
    tv = final.resize((1280, 720), Image.LANCZOS)
    desk = final.crop((0, SAFE[1], W, SAFE[3])).resize((1280, 212), Image.LANCZOS)
    phone = final.crop((SAFE[0], SAFE[1], SAFE[2], SAFE[3])).resize((773, 212), Image.LANCZOS)
    sheet = Image.new("RGB", (1280, 720 + 20 + 212 + 20 + 212), (255, 255, 255))
    sheet.paste(tv, (0, 0))
    sheet.paste(desk, (0, 740))
    sheet.paste(phone, (0, 972))
    sheet.save(OUT / "banner_preview.png")
    kb = (OUT / "banner.jpg").stat().st_size // 1024
    print(f"[banner] {OUT / 'banner.jpg'}  ({kb} KB)")


if __name__ == "__main__":
    main()
