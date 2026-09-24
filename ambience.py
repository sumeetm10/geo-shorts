"""Place sound, synthesised rather than sampled.

The upstream repo ships an SFX library, but those clips were generated on the
author's ElevenLabs account and the licence follows that account. Wind, dry
desert air and sea are filtered noise with slow movement on top: cheap to make,
and nothing to license.

build_track() takes one segment per leg and cross-fades them into one bed that
sits under the voice (the mix ducks it further while anyone is speaking).
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
XFADE = 1.1


def _noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def _band(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def _lp(x, cut, order=2):
    b, a = butter(order, cut / (SR / 2), btype="low")
    return lfilter(b, a, x)


def _env(n, seed, rate, depth=0.7, floor=0.3):
    """Slow random swell — gusts, swells, breathing."""
    rng = np.random.default_rng(seed)
    steps = max(2, int(n / SR * rate))
    knots = rng.random(steps + 1)
    return floor + depth * np.interp(np.linspace(0, steps, n), np.arange(steps + 1), knots)


def wind(seconds, seed=1, cold=True):
    """Open wind with gusts. Cold wind is thinner and higher."""
    n = int(seconds * SR)
    lo, hi = (260, 2200) if cold else (140, 1100)
    body = _band(_noise(n, seed), lo, hi) * _env(n, seed + 1, 0.55, 0.85, 0.25)
    gust = _band(_noise(n, seed + 2), 500, 3400) * _env(n, seed + 3, 0.22, 1.0, 0.05) ** 2
    return body * 0.8 + gust * 0.45


def desert(seconds, seed=7):
    """Hot, dry air: lower, drier, with grit blowing across it."""
    n = int(seconds * SR)
    base = _band(_noise(n, seed), 90, 700) * _env(n, seed + 1, 0.35, 0.7, 0.35)
    grit = _band(_noise(n, seed + 2), 1800, 6000) * _env(n, seed + 3, 1.1, 1.0, 0.0) ** 3
    shimmer = np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * _env(n, seed + 4, 0.8, 0.02, 0.0)
    return base * 0.9 + grit * 0.22 + shimmer


def sea(seconds, seed=11, ice=True):
    """Open water: swell underneath and spray; with ice, it groans and cracks."""
    n = int(seconds * SR)
    swell = _lp(_noise(n, seed), 240) * _env(n, seed + 1, 0.3, 0.9, 0.3)
    spray = _band(_noise(n, seed + 2), 900, 5200) * _env(n, seed + 3, 0.5, 0.6, 0.1)
    out = swell * 1.3 + spray * 0.25
    if not ice:
        return out
    rng = np.random.default_rng(seed + 5)
    for _ in range(max(1, int(seconds / 5))):
        at = int(rng.uniform(0.1, 0.85) * n)
        dur = int(SR * rng.uniform(0.7, 1.4))
        if at + dur >= n:
            continue
        t = np.arange(dur) / SR
        f0 = rng.uniform(70, 130)
        groan = np.sin(2 * np.pi * (f0 * (1 - 0.35 * t / t[-1])) * t) * np.exp(-2.4 * t / t[-1]) * 0.5
        out[at:at + dur] += groan
        crack = _band(_noise(dur // 6, seed + 9), 1200, 7000) * np.exp(
            -12 * np.linspace(0, 1, dur // 6)) * 0.35
        out[at:at + len(crack)] += crack
    return out


MAKERS = {
    "wind_cold": lambda d, s: wind(d, s, cold=True),
    "wind_warm": lambda d, s: wind(d, s, cold=False) * 0.55,
    "desert": lambda d, s: desert(d, s),
    "sea_ice": lambda d, s: sea(d, s, ice=True),
    "sea": lambda d, s: sea(d, s, ice=False),
}


def build_track(segments, total, out):
    """segments: [(start_seconds, kind)] in order. Writes a stereo WAV."""
    n = int(total * SR)
    track = np.zeros(n)
    for i, (start, kind) in enumerate(segments):
        end = segments[i + 1][0] if i + 1 < len(segments) else total
        d = max(0.5, end - start + XFADE)
        seg = MAKERS.get(kind, MAKERS["wind_warm"])(d, 17 + i * 10)[:int(d * SR)]
        f = int(XFADE * SR)
        if len(seg) > 2 * f:
            seg[:f] *= np.linspace(0, 1, f)
            seg[-f:] *= np.linspace(1, 0, f)
        a = int(start * SR)
        b = min(n, a + len(seg))
        if b > a:
            track[a:b] += seg[:b - a]
    peak = np.abs(track).max()
    if peak > 0:
        track = track / peak * 0.5
    stereo = np.stack([track, np.roll(track, 240)], axis=1)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(stereo, -1, 1) * 32767).astype("<i2").tobytes())
    return out
