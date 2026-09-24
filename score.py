"""Synthesize an original score that actually matches the topic's tone.

MPT ships 29 tracks, and measuring them (see analyze_music.py) showed the
library cannot do what the channel needs: all 29 are in a MAJOR key, in only
three keys (D, G, A), with spectral centroids inside a 90 Hz band and tempi
clustered on 83/92/103 BPM. They are 29 variations of one cheerful acoustic
loop. Selecting between them by "tone" was cosmetic — there is no tense, urgent
or serious bed in the folder to select.

So the bed is generated here instead. That fixes three things at once:
  * mood is a parameter rather than a lucky draw,
  * the track is written to the exact narration length, so it never loops
    audibly or fades out mid-sentence,
  * it is original, so the channel carries no licensing risk from bundled
    audio of unknown provenance.

The target register is modern minimal science underscore — sub drone, filtered
pad, soft pulse, sparse arpeggio. That genre is deliberately synthetic, which is
why synthesis reads as correct here rather than as cheap.
"""
import numpy as np
from scipy import signal

SR = 44100

# Scales as semitone offsets from the root.
SCALES = {
    "minor":  [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "major":  [0, 2, 4, 5, 7, 9, 11],
    "lydian": [0, 2, 4, 6, 7, 9, 11],
}

# Per-tone musical direction. Roots are low so the bed sits under the voice.
TONES = {
    "calm": dict(
        root=55.00, scale="dorian", bpm=68, pulse=0.22, arp=0.16, arp_rate=2.0,
        cutoff=900, pad=0.60, air=0.006, riser=0.16, chord=[0, 7, 10, 14],
    ),
    "curious": dict(
        root=61.74, scale="dorian", bpm=100, pulse=0.42, arp=0.30, arp_rate=4.0,
        cutoff=1500, pad=0.52, air=0.007, riser=0.30, chord=[0, 7, 10, 15],
    ),
    "surprising": dict(
        root=58.27, scale="minor", bpm=108, pulse=0.50, arp=0.34, arp_rate=4.0,
        cutoff=1900, pad=0.50, air=0.008, riser=0.42, chord=[0, 7, 12, 15],
    ),
    "urgent": dict(
        root=51.91, scale="minor", bpm=124, pulse=0.62, arp=0.30, arp_rate=6.0,
        cutoff=1300, pad=0.54, air=0.009, riser=0.50, chord=[0, 7, 12, 14],
    ),
    "energetic": dict(
        root=65.41, scale="lydian", bpm=126, pulse=0.58, arp=0.40, arp_rate=6.0,
        cutoff=2400, pad=0.46, air=0.007, riser=0.40, chord=[0, 7, 11, 16],
    ),
}


def _lp(x, cutoff, order=4):
    b, a = signal.butter(order, min(cutoff / (SR / 2), 0.99), btype="low")
    return signal.lfilter(b, a, x)


def _hp(x, cutoff, order=2):
    b, a = signal.butter(order, min(cutoff / (SR / 2), 0.99), btype="high")
    return signal.lfilter(b, a, x)


def _adsr(n, a, d, s, r):
    """Envelope in seconds; sustain is a level. Prevents clicks."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    a, d, r = max(1, a), max(1, d), max(1, r)
    if a + d + r >= n:
        return np.hanning(n)
    env = np.empty(n)
    env[:a] = np.linspace(0, 1, a)
    env[a:a + d] = np.linspace(1, s, d)
    env[a + d:n - r] = s
    env[n - r:] = np.linspace(s, 0, r)
    return env


def _detuned(freq, n, detune=0.004, partials=(1.0, 2.0, 3.0), weights=(1, .35, .15)):
    """Two slightly-detuned stacks — a single sine reads as a test tone."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    for mult, w in zip(partials, weights):
        for d in (1 - detune, 1 + detune):
            phase = np.random.uniform(0, 2 * np.pi)
            out += w * np.sin(2 * np.pi * freq * mult * d * t + phase)
    return out / (sum(weights) * 2)


def _reverb(x, decay=1.1, mix=0.26):
    """Convolve with decaying noise. Cheap, and enough to remove the dryness."""
    n = int(SR * decay)
    ir = np.random.randn(n) * np.exp(-np.linspace(0, 6, n))
    ir[0] = 1.0
    ir = _lp(ir, 3500)
    wet = signal.fftconvolve(x, ir)[:len(x)]
    wet /= (np.abs(wet).max() or 1.0)
    return (1 - mix) * x + mix * wet


def _drone(n, root, cutoff):
    v = _detuned(root, n, detune=0.006, partials=(1.0, 2.0), weights=(1, .3))
    v += 0.5 * _detuned(root / 2, n, detune=0.003, partials=(1.0,), weights=(1,))
    return _lp(v, cutoff * 0.55)


def _pad(n, root, chord, cutoff):
    """Sustained stack with slow filter movement, so it breathes."""
    v = np.zeros(n)
    for i, semi in enumerate(chord):
        f = root * 2 ** (semi / 12)
        v += _detuned(f, n, detune=0.005) * (0.9 ** i)
    v /= len(chord)
    # slow LFO on amplitude — a static pad sounds synthetic in the bad way
    t = np.arange(n) / SR
    v *= 1 + 0.14 * np.sin(2 * np.pi * 0.09 * t)
    return _lp(v, cutoff)


def _pulse(n, bpm, amp):
    """Soft filtered kick + a body tone. Carries momentum without a drum kit."""
    out = np.zeros(n)
    period = int(SR * 60 / bpm)
    hit = int(SR * 0.26)
    t = np.arange(hit) / SR
    env = np.exp(-13 * t)
    # pitch-dropping sine reads as a kick rather than a beep
    body = np.sin(2 * np.pi * (48 + 70 * np.exp(-32 * t)) * t) * env
    click = _hp(np.random.randn(hit) * np.exp(-90 * t), 1800) * 0.10
    one = _lp(body + click, 2200)
    for k in range(0, n - hit, period):
        # accent the downbeat of each bar
        out[k:k + hit] += one * (1.0 if (k // period) % 4 == 0 else 0.62)
    return out * amp


def _arp(n, root, scale, rate, amp, cutoff):
    """Sparse plucks an octave up — the 'science' shimmer."""
    steps = SCALES[scale]
    seq = [steps[i % len(steps)] for i in (0, 4, 2, 6, 4, 2, 5, 1)]
    out = np.zeros(n)
    step_n = max(1, int(SR / rate))
    ln = min(step_n * 3, int(SR * 0.5))
    t = np.arange(ln) / SR
    env = np.exp(-7 * t) * _adsr(ln, 0.004, 0.05, 0.45, 0.12)
    for idx, k in enumerate(range(0, n - ln, step_n)):
        if idx % 4 == 3:              # leave gaps; a constant arp is fatiguing
            continue
        f = root * 4 * 2 ** (seq[idx % len(seq)] / 12)
        v = (np.sin(2 * np.pi * f * t)
             + 0.30 * np.sin(2 * np.pi * f * 2 * t)
             + 0.12 * np.sin(2 * np.pi * f * 3 * t))
        out[k:k + ln] += v * env * (0.75 if idx % 2 else 1.0)
    return _lp(out, cutoff * 2.2) * amp


def _riser(n, seconds, amp, cutoff):
    """Filtered noise sweep into the hook."""
    ln = min(n, int(SR * seconds))
    if ln < SR // 4 or amp <= 0:
        return np.zeros(n)
    noise = np.random.randn(ln)
    swept = np.zeros(ln)
    blk = 2048
    for i in range(0, ln - blk, blk):
        frac = i / ln
        swept[i:i + blk] = _lp(noise[i:i + blk], 300 + frac * cutoff * 2.4)
    env = np.linspace(0, 1, ln) ** 2.2
    out = np.zeros(n)
    out[:ln] = swept * env * amp
    return out


def _sections(n, intro=3.0, tail=3.0):
    """Automation: pulse and arp enter after the hook, everything eases out."""
    t = np.arange(n) / SR
    total = n / SR
    body = np.clip((t - intro) / 1.6, 0, 1)
    out = np.clip((total - t) / tail, 0, 1) ** 0.8
    lift = np.clip((t - total * 0.45) / 2.5, 0, 1)
    return body * out, out, lift * out


def build_score(path, seconds, tone="curious", seed=0):
    """Write a tone-matched bed of exactly `seconds` to `path` (wav)."""
    rng = np.random.RandomState(seed)
    np.random.seed(seed)
    p = dict(TONES.get(tone, TONES["curious"]))

    # small per-video variation so daily output is not one identical track
    p["bpm"] += rng.randint(-3, 4)
    p["root"] *= 2 ** (rng.randint(-2, 3) / 12)
    p["cutoff"] *= rng.uniform(0.92, 1.10)

    n = int(SR * seconds)
    body_env, out_env, lift = _sections(n)

    drone = _drone(n, p["root"], p["cutoff"]) * 0.30
    pad = _pad(n, p["root"], p["chord"], p["cutoff"]) * p["pad"]
    pulse = _pulse(n, p["bpm"], p["pulse"]) * body_env
    arp = _arp(n, p["root"], p["scale"], p["arp_rate"], p["arp"], p["cutoff"])
    arp *= (0.45 + 0.55 * lift)
    # an octave-up pad double puts real energy where a phone can play it
    mids = _pad(n, p["root"] * 2, p["chord"], p["cutoff"] * 1.6) * p["pad"] * 0.55
    air = _hp(np.random.randn(n), 7000) * p["air"] * out_env
    rise = _riser(n, 3.0, p["riser"], p["cutoff"])

    mix = (drone + pad + mids) * out_env + pulse + arp + air + rise
    mix = _hp(mix, 70)          # clear rumble that only eats headroom

    # duck the sustained layers under each pulse so the low end stays clear
    duck = 1.0 - 0.30 * _lp(np.abs(pulse), 12)
    mix *= np.clip(duck, 0.55, 1.0)

    mix = _reverb(mix, decay=1.0, mix=0.24)
    mix = _lp(mix, 11000)
    mix *= _adsr(n, 0.35, 0.4, 1.0, min(2.5, seconds * 0.12))

    # stereo: tiny delay + detune on one side for width
    d = int(SR * 0.011)
    left = mix
    right = np.concatenate([np.zeros(d), mix[:-d]]) * 0.97
    st = np.stack([left, right], axis=1)

    peak = np.abs(st).max() or 1.0
    st = st / peak * 0.85
    # sit around -24 dBFS RMS: comfortably under a -20 dB narration
    rms = np.sqrt((st ** 2).mean()) or 1.0
    st *= min(3.0, 10 ** (-24 / 20) / rms)
    st = np.clip(st, -1.0, 1.0)

    from scipy.io import wavfile
    wavfile.write(str(path), SR, (st * 32767).astype(np.int16))
    return path


if __name__ == "__main__":
    import sys
    from pathlib import Path

    out = Path(__file__).resolve().parent / "data" / "score_preview"
    out.mkdir(parents=True, exist_ok=True)
    secs = float(sys.argv[1]) if len(sys.argv) > 1 else 20.0
    for tone in TONES:
        f = out / f"{tone}.wav"
        build_score(f, secs, tone, seed=1)
        print(f"{tone:11} -> {f}")
