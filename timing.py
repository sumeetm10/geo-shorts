"""Word timings from a voice take - copied from story-shorts/edit.py so this
repository runs on its own (same author). Voiced regions are found in the audio
and words are spread over voiced time only (~0.1 s against hand-marked onsets).
"""
import re
import subprocess

import numpy as np


def _pcm(path, rate=16000):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(rate),
         "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32), rate


def speech_islands(path, hop=0.01):
    """Stretches of a take where the voice is sounding, in seconds.

    Voiced speech carries energy in 80-1000 Hz; a breath or gasp is broadband
    noise with little there. Unvoiced consonants (s, sh, f) are kept when they
    sit right against voiced sound, so "chest" and "hands" keep their ends.
    """
    x, sr = _pcm(path)
    win, step = int(sr * 0.025), int(sr * hop)
    if len(x) < win:
        return []
    frames = np.lib.stride_tricks.sliding_window_view(x, win)[::step]
    spec = np.abs(np.fft.rfft(frames * np.hanning(win), axis=1)) ** 2
    freqs = np.fft.rfftfreq(win, 1 / sr)
    eps = 1e-12
    low = 10 * np.log10(spec[:, (freqs >= 80) & (freqs < 1000)].sum(1) + eps)
    high = 10 * np.log10(spec[:, (freqs >= 3000) & (freqs < 7500)].sum(1) + eps)
    rms = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + eps)

    voiced = (low > np.percentile(low, 95) - 24) & (rms > -42)
    fric = (high > np.percentile(high, 95) - 22) & (rms > -48)

    # extend voiced runs into adjacent consonant noise, at most 0.2s each side
    keep = voiced.copy()
    reach = int(0.2 / hop)
    idx = np.flatnonzero(voiced)
    for direction in (1, -1):
        for i in idx:
            for k in range(1, reach + 1):
                j = i + direction * k
                if j < 0 or j >= len(keep) or voiced[j] or not fric[j]:
                    break
                keep[j] = True

    islands, start = [], None
    for i, v in enumerate(keep):
        if v and start is None:
            start = i
        elif not v and start is not None:
            islands.append([start, i])
            start = None
    if start is not None:
        islands.append([start, len(keep)])
    merged = []
    for a, b in islands:                 # bridge tiny gaps inside words
        if merged and a - merged[-1][1] < int(0.08 / hop):
            merged[-1][1] = b
        else:
            merged.append([a, b])
    offset = win / 2 / sr
    return [(a * hop + offset, b * hop + offset) for a, b in merged
            if (b - a) * hop >= 0.05]


_FUNCTION_WORDS = {"the", "a", "an", "and", "of", "to", "in", "my", "i", "at",
                   "on", "that", "with", "me", "up", "it", "is", "his", "her",
                   "he", "she", "we", "you", "for", "but", "or", "as", "by"}


def _weight(word):
    """Share of voiced time a word gets.

    Scored against word onsets measured by hand on the episode 1 takes: plain
    letter count put short words like "and" and "with" 0.2-0.36s late, because
    they are said far faster than their length suggests. Halving function
    words took the mean error from 0.20s to 0.11s.
    """
    n = len(re.sub(r"[^A-Za-z0-9]", "", word)) + 1
    return n * (0.5 if re.sub(r"[^a-z']", "", word.lower()) in _FUNCTION_WORDS else 1)


def _voiced_clock(islands):
    """Map 'seconds of voice so far' to real time, skipping every pause."""
    spans = [(a, b) for a, b in islands]
    total = sum(b - a for a, b in spans)

    def at(v, prefer_next):
        # a word that starts exactly where a pause begins really starts after
        # the pause; a word that ends there ends before it
        acc = 0.0
        for k, (a, b) in enumerate(spans):
            d = b - a
            if v < acc + d - 1e-9:
                return a + (v - acc)
            if abs(v - (acc + d)) <= 1e-9:
                if prefer_next and k + 1 < len(spans):
                    return spans[k + 1][0]
                return b
            acc += d
        return spans[-1][1]
    return total, at


def time_words(sentence, take, offset=0.0, line=0):
    """Word timings (ms) for one sentence spoken in one take.

    Phrases split at commas or dashes are pinned to the longest pauses in the
    take when there are enough of them, then words are spread by length over
    voiced time only, so a gasp or stammer never eats a word's slot.
    """
    words = sentence.split()
    islands = speech_islands(take)
    if not words:
        return []
    if not islands:
        dur = _pcm_duration(take)
        islands = [(0.0, dur)]

    # phrases: break after a word ending in , ; : or a dash
    phrases, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[,;:\u2014\u2013]$|-$|\.\.\.$", w):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)

    gaps = [(islands[k + 1][0] - islands[k][1], k) for k in range(len(islands) - 1)]
    big = sorted(k for g, k in sorted(gaps, reverse=True)[:len(phrases) - 1]
                 if g >= 0.15)
    if len(phrases) > 1 and len(big) == len(phrases) - 1:
        groups, lo = [], 0
        for k in big + [len(islands) - 1]:
            groups.append(islands[lo:k + 1])
            lo = k + 1
    else:
        phrases, groups = [words], [islands]

    out = []
    for phrase, isl in zip(phrases, groups):
        total_v, at = _voiced_clock(isl)
        weights = [_weight(w) for w in phrase]
        wsum = sum(weights)
        acc = 0
        for w, wt in zip(phrase, weights):
            a = at(total_v * acc / wsum, prefer_next=True)
            acc += wt
            b = at(total_v * acc / wsum, prefer_next=False)
            out.append({"word": w, "start": int((offset + a) * 1000),
                        "end": int((offset + max(b, a + 0.09)) * 1000),
                        "line": line})
    return out


def _pcm_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0
