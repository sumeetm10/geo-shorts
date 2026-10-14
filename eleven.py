"""ElevenLabs narration (narrate(..., style="eleven")).

Needs two user environment variables, set by the owner on their own machine
(never in chat, never committed):
    ELEVENLABS_API_KEY    the API key
    ELEVENLABS_VOICE_ID   the voice to use

Credits are scarce (free tier: 10,000 characters a month), so:
- each line is cached by its exact text in <job>/eleven/ - a re-render never pays twice;
- before anything is generated, the account's remaining characters are checked and
  the job stops if the new lines would not fit;
- there is no silent fallback to another voice: a long video must not mix voices.

Note: ElevenLabs' free plan is for non-commercial use with attribution; a monetized
channel needs a paid plan (Starter or above) for commercial rights.
"""
import hashlib
import json
import os
import subprocess
import urllib.request
from pathlib import Path

API = "https://api.elevenlabs.io/v1"
MODEL = "eleven_multilingual_v2"
SETTINGS = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True}


def _key():
    k, v = os.environ.get("ELEVENLABS_API_KEY"), os.environ.get("ELEVENLABS_VOICE_ID")
    if not k or not v:
        raise RuntimeError("set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (user environment variables)")
    return k, v


def _req(path, key, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"xi-api-key": key, "Content-Type": "application/json",
                                          "Accept": "audio/mpeg" if body is not None else "application/json"},
                                 method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def remaining():
    key, _ = _key()
    sub = json.loads(_req("/user/subscription", key))
    return sub["character_limit"] - sub["character_count"], sub


def perform(lines, out_dir):
    from narrate import GAP, _duration, finish
    import timing
    key, voice = _key()
    out_dir = Path(out_dir)
    takes = out_dir / "eleven"
    takes.mkdir(parents=True, exist_ok=True)

    def cached(i, text):
        tag = hashlib.sha1(f"{voice}|{MODEL}|{text}".encode()).hexdigest()[:12]
        return takes / f"{i:02d}-{tag}.mp3"

    todo = [(i, t) for i, t in enumerate(lines, 1) if not cached(i, t).exists()]
    need = sum(len(t) for _, t in todo)
    if need:
        left, _ = remaining()
        print(f"      [voice] ElevenLabs: {need} characters to generate, {left} left this month")
        if need > left:
            raise RuntimeError(f"not enough ElevenLabs credits: need {need}, have {left}")
    for i, text in todo:
        body = {"text": text, "model_id": MODEL, "voice_settings": SETTINGS,
                "previous_text": lines[i - 2] if i > 1 else None,
                "next_text": lines[i] if i < len(lines) else None}
        cached(i, text).write_bytes(_req(f"/text-to-speech/{voice}?output_format=mp3_44100_128", key, body))
    wavs, vo, t = [], [], 0.0
    for i, text in enumerate(lines, 1):
        wav = takes / f"{i:02d}.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(cached(i, text)), "-af",
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
    print(f"      [voice] ElevenLabs: {len(lines)} lines, {t:.1f}s")
    return vo, finish(lst, out_dir / "voice.mp3")


if __name__ == "__main__":
    left, sub = remaining()
    print(f"ElevenLabs plan: {sub.get('tier')} | characters left this month: {left} of {sub['character_limit']}")
