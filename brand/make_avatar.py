"""Channel profile picture: the walker from the videos, striding over a NASA globe.

    python brand/make_avatar.py        -> brand/profile.png (800x800) + small previews

Everything in it is ours or public domain (NASA Blue Marble), same rule as the videos.
Drawn at 2x and scaled down for clean edges. YouTube shows it as a circle, so all
of the figure sits inside the centre circle.
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "brand"
S = 1600                      # working size, halved at the end
GOLD = (255, 200, 61)
NAVY_IN, NAVY_OUT = (20, 44, 74), (4, 8, 16)


def texture():
    Image.MAX_IMAGE_PIXELS = None          # our own 21600x10800 NASA file, not a bomb
    im = Image.open(ROOT / "assets" / "bluemarble.jpg")
    im.draft("RGB", (5400, 2700))          # JPEG loads at 1/4 scale: fast, little RAM
    return np.asarray(im.convert("RGB"), dtype=np.float32)


def globe(tex, size, lon0, lat0):
    """Orthographic view of the equirectangular texture, with limb shading."""
    h, w, _ = tex.shape
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float32)
    x = (xs + 0.5) / size * 2 - 1
    y = 1 - (ys + 0.5) / size * 2
    rho = np.sqrt(x * x + y * y)
    inside = rho <= 1
    rho_c = np.clip(rho, 1e-6, 1)
    c = np.arcsin(rho_c)
    p0, l0 = math.radians(lat0), math.radians(lon0)
    lat = np.arcsin(np.clip(np.cos(c) * math.sin(p0) + y * np.sin(c) * math.cos(p0) / rho_c, -1, 1))
    lon = l0 + np.arctan2(x * np.sin(c), rho_c * np.cos(c) * math.cos(p0) - y * np.sin(c) * math.sin(p0))
    u = ((np.degrees(lon) + 180) % 360) / 360 * (w - 1)
    v = (90 - np.degrees(lat)) / 180 * (h - 1)
    rgb = tex[v.astype(int).clip(0, h - 1), u.astype(int).clip(0, w - 1)]
    z = np.sqrt(np.clip(1 - rho * rho, 0, 1))[..., None]
    rgb = rgb * (0.35 + 0.65 * z ** 0.6) * 1.12            # darker toward the edge, a bit brighter
    alpha = (np.clip((1 - rho) * size * 0.5, 0, 1) * inside) * 255
    out = np.dstack([rgb.clip(0, 255), alpha]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def background():
    ys, xs = np.mgrid[0:S, 0:S].astype(np.float32)
    d = np.sqrt((xs - S / 2) ** 2 + (ys - S * 0.42) ** 2) / (S * 0.75)
    t = np.clip(d, 0, 1)[..., None]
    rgb = np.array(NAVY_IN) * (1 - t) + np.array(NAVY_OUT) * t
    im = Image.fromarray(rgb.astype(np.uint8), "RGB").convert("RGBA")
    rng = np.random.default_rng(7)
    dr = ImageDraw.Draw(im)
    for _ in range(70):
        sx, sy = rng.uniform(0, S), rng.uniform(0, S * 0.55)
        r = rng.uniform(1.5, 4.5)
        a = int(rng.uniform(90, 230))
        dr.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 255, 255, a))
    return im


def glow(size, radius, color, strength):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse([size / 2 - radius, size / 2 - radius, size / 2 + radius,
                                size / 2 + radius], fill=color + (strength,))
    return im.filter(ImageFilter.GaussianBlur(radius * 0.09))


def route(draw, cx, cy, r, tilt=0.30):
    """Dashed great circle from his feet down over land: Russia, the Middle East, East Africa.
    (An arc over the Atlantic looked like walking on water - the one thing we say you cannot.)"""
    pts = []
    for k in range(0, 181):
        t = math.radians(k)
        x3, y3 = math.sin(t) * math.sin(tilt), math.cos(t)
        pts.append((cx + x3 * r, cy - y3 * r))
    dash, gapn = 7, 5
    for i in range(10, len(pts) - 25, dash + gapn):     # leave the top clear under his feet
        seg = pts[i:i + dash]
        if len(seg) > 1:
            draw.line(seg, fill=(20, 16, 4, 255), width=34, joint="curve")
    for i in range(10, len(pts) - 25, dash + gapn):
        seg = pts[i:i + dash]
        if len(seg) > 1:
            draw.line(seg, fill=GOLD + (255,), width=20, joint="curve")
    return pts


def walker(draw, fx, fy, h):
    """The stick walker mid-stride, facing right. fx, fy = point between the feet."""
    k = h / 230.0
    hip = (fx, fy - 92 * k)
    neck = (fx + 6 * k, fy - 160 * k)
    head = (fx + 12 * k, fy - 200 * k)
    hr = 38 * k
    feet = [(fx - 52 * k, fy), (fx + 56 * k, fy - 2 * k)]
    knees = [(fx - 22 * k, fy - 46 * k), (fx + 36 * k, fy - 50 * k)]
    shoulder = (fx + 5 * k, fy - 146 * k)
    hands = [(fx - 44 * k, fy - 96 * k), (fx + 60 * k, fy - 112 * k)]
    elbows = [(fx - 22 * k, fy - 122 * k), (fx + 40 * k, fy - 134 * k)]

    limbs = [[hip, knees[0], feet[0]], [hip, knees[1], feet[1]], [hip, neck],
             [shoulder, elbows[0], hands[0]], [shoulder, elbows[1], hands[1]]]
    for w, col in ((int(40 * k), (10, 12, 18, 255)), (int(24 * k), (255, 255, 255, 255))):
        for pl in limbs:
            draw.line(pl, fill=col, width=w, joint="curve")
            for p in (pl[0], pl[-1]):
                draw.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=col)
    # head
    o = 8 * k
    draw.ellipse([head[0] - hr - o, head[1] - hr - o, head[0] + hr + o, head[1] + hr + o],
                 fill=(10, 12, 18, 255))
    draw.ellipse([head[0] - hr, head[1] - hr, head[0] + hr, head[1] + hr], fill=(255, 255, 255, 255))
    # face, looking where he walks
    for ex in (head[0] + 4 * k, head[0] + 22 * k):
        draw.ellipse([ex - 5.5 * k, head[1] - 12 * k, ex + 5.5 * k, head[1] + 1 * k],
                     fill=(10, 12, 18, 255))
    draw.arc([head[0] - 4 * k, head[1] - 6 * k, head[0] + 30 * k, head[1] + 20 * k],
             start=20, end=150, fill=(10, 12, 18, 255), width=int(6 * k))


def main():
    tex = texture()
    canvas = background()

    R = int(S * 0.40)
    cx, cy = S // 2, int(S * 0.765)
    halo = glow(2 * R + 160, R + 30, (110, 180, 255), 120)
    canvas.alpha_composite(halo, (cx - halo.width // 2, cy - halo.height // 2))
    g = globe(tex, 2 * R, lon0=18, lat0=18)
    canvas.alpha_composite(g, (cx - R, cy - R))

    draw = ImageDraw.Draw(canvas)
    route(draw, cx, cy, R)
    walker(draw, cx - 4, cy - R + 6, h=int(S * 0.30))

    final = canvas.convert("RGB").resize((800, 800), Image.LANCZOS)
    OUT.mkdir(exist_ok=True)
    final.save(OUT / "profile.png")

    # what it looks like where people actually see it: a small circle
    mask = Image.new("L", (800, 800), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, 799, 799], fill=255)
    circ = Image.new("RGB", (800, 800), (255, 255, 255))
    circ.paste(final, (0, 0), mask)
    sheet = Image.new("RGB", (800 + 20 + 176 + 20 + 88 + 20 + 48, 800), (255, 255, 255))
    sheet.paste(circ, (0, 0))
    x = 820
    for s in (176, 88, 48):
        sheet.paste(circ.resize((s, s), Image.LANCZOS), (x, 20))
        x += s + 20
    sheet.save(OUT / "profile_preview.png")
    print(f"[avatar] {OUT / 'profile.png'}")


if __name__ == "__main__":
    main()
