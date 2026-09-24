"""Narration with the free, unmetered voice, and word times for the captions.

edge-tts has no daily cap (Gemini's acted voice manages about six lines a day,
too few for a 10-line script twice a day). It reads everything in one register,
so each line carries its own pace and pitch. edge-tts no longer reports word
boundaries at all, so the word times are measured from the takes by the story
channel's time_words (timing.py) (~0.1 s against hand-marked onsets).
"""
import asyncio
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
import timing  # noqa: E402

VOICE = "en-US-AndrewMultilingualNeural"
GAP = 0.26

# delivery per kind of line: (rate, pitch)
DELIVERY = {
    "hook": ("+4%", "+4Hz"),
    "walk": ("+5%", "+1Hz"),
    "hot": ("+8%", "+3Hz"),
    "cold": ("-2%", "-6Hz"),
    "stop": ("-10%", "-4Hz"),
    "tired": ("-3%", "-5Hz"),
    "cheer": ("+6%", "+5Hz"),
    "payoff": ("-6%", "-6Hz"),
    "question": ("+3%", "+5Hz"),
    "reveal": ("-4%", "-3Hz"),
    "list": ("+6%", "+2Hz"),
}


def _duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


async def _speak(text, kind, mp3):
    rate, pitch = DELIVERY.get(kind, DELIVERY["walk"])
    for attempt in range(3):
        try:
            await edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch).save(str(mp3))
            return
        except Exception:
            if attempt == 2:
                raise
            await asyncio.sleep(4 * (attempt + 1))


def narrate(lines, kinds, out_dir):
    """lines/kinds -> (vo list for Remotion, path to the joined voice mp3)."""
    out_dir = Path(out_dir)
    takes = out_dir / "takes"
    takes.mkdir(parents=True, exist_ok=True)
    wavs, vo, t = [], [], 0.0
    for i, (text, kind) in enumerate(zip(lines, kinds), 1):
        mp3, wav = takes / f"{i:02d}.mp3", takes / f"{i:02d}.wav"
        asyncio.run(_speak(text, kind, mp3))
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-af",
             "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
             "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
             f"apad=pad_dur={GAP}", "-ar", "24000", "-ac", "1", str(wav)], check=True)
        d = _duration(wav)
        words = timing.time_words(text, wav, offset=t, line=i - 1)
        vo.append({"text": text, "start": round(t, 3), "end": round(t + d, 3),
                   "words": [{"w": w["word"], "start": round(w["start"] / 1000, 3),
                              "end": round(w["end"] / 1000, 3)} for w in words]})
        wavs.append(wav)
        t += d
    lst = out_dir / "concat.txt"
    lst.write_text("".join(f"file '{w.resolve().as_posix()}'\n" for w in wavs), encoding="utf-8")
    voice = out_dir / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-af", "loudnorm=I=-16", "-ar", "48000", "-b:a", "192k", str(voice)], check=True)
    return vo, voice
