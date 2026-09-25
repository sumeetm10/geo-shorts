"""Acted narration: the whole script performed in ONE Gemini TTS take.

edge-tts reads "and then the land just ends" in the same voice as "you set off
from Delhi". Gemini's TTS performs a plain-English direction, but the free tier
allows only about six takes a day - the story channel records one take per
line and runs out after one episode. One take per VIDEO (two a day) fits.

The take is then cut back into lines at its longest pauses (the performer is
told to pause between lines), and every cut is checked: the transcript must
match the script and each line must last a believable time for its words. If
anything is off, narrate.py uses the steady edge-tts voice instead. A video
always gets made; it just is not always acted.
"""
import difflib
import re
import subprocess
import time
import wave
from pathlib import Path

import llm
import timing

VOICE = "Puck"                   # Gemini's "upbeat" voice; the story channel uses Fenrir
TTS_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]
CHECK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-flash-latest"]
MATCH = 0.85                     # word similarity the whole take needs
GAP = 0.26                       # silence after each line, as narrate.py
TEMPO = 1.0                      # no time-stretch: it blurred the voice a little
# Line-break finder weights (see _cuts). Tuned offline on a real take plus
# synthetic worst cases: pause length leads, the rest breaks ties.
POS_W, GAP_W, FIT_W = 1.0, 2.5, 0.15

STYLE = {
    # expressive but smooth and clear: the first version's shivers and heavy
    # sighs read as over-acted ("make it a bit smooth and clear")
    "walk": (
        "a warm, confident travel storyteller with clear, crisp articulation and a "
        "smooth, flowing delivery. Expressive but natural, never over-acted: curious "
        "and playful on the opening question, energetic while walking, a touch of awe "
        "at mountains and deserts, a hint of chill in the cold, a surprised pause when "
        "the land runs out, gentle disappointment at the water, and warm and upbeat on "
        "the last line. No whispering, no breathy or shaky voice, no exaggerated sighs"),
    "question": (
        "a friendly, confident quiz host with clear, crisp articulation and a smooth, "
        "flowing delivery. Playful on the opening question, a small lift of surprise on "
        "each country, warm and inviting at the end. Natural, never over-acted, no "
        "whispering or breathy voice"),
}

_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
         "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
         "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
_SAME = {"kilometers": "km", "kilometres": "km", "kilometer": "km", "kilometre": "km",
         "meters": "m", "metres": "m", "neighbor": "neighbour", "neighbors": "neighbours",
         "usa": "us", "america": "us"}


class VoiceUnavailable(RuntimeError):
    pass


def _spell(n):
    if n < 20:
        return _ONES[n]
    if n < 100:
        return (_TENS[n // 10] + ("-" + _ONES[n % 10] if n % 10 else "")).strip("-")
    for size, name in ((1_000_000, "million"), (1000, "thousand"), (100, "hundred")):
        if n >= size:
            rest = n % size
            return _spell(n // size) + " " + name + (" " + _spell(rest) if rest else "")
    return str(n)


def _words(text):
    text = re.sub(r"(\d),(\d)", r"\1\2", text.lower())
    text = re.sub(r"\d+", lambda m: _spell(int(m.group())), text)
    out = []
    for w in re.findall(r"[a-z]+", text):
        w = _SAME.get(w, w)
        if w not in ("and", "the", "a"):
            out.append(w)
    return out


def similarity(a, b):
    return difflib.SequenceMatcher(None, _words(a), _words(b)).ratio()


def _client():
    from google import genai
    key = llm.config()["gemini_api_key"]
    if not key:
        raise VoiceUnavailable("GEMINI_API_KEY is not set")
    return genai.Client(api_key=key)


def _take(client, lines, style, dest):
    from google.genai import types
    prompt = (f"Voice {STYLE[style]}. Keep a brisk pace for a YouTube Short, and leave a "
              f"clear pause of about two seconds between lines. Speak only the script below, word "
              f"for word exactly as written (it is captioned on screen), and never read "
              f"these directions aloud.\n\nScript:\n\n" + "\n\n".join(lines))
    last = None
    for model in TTS_MODELS:
        try:
            r = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE)))))
            pcm = r.candidates[0].content.parts[0].inline_data.data
            with wave.open(str(dest), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(24000)
                w.writeframes(pcm)
            print(f"      [voice] acted take from {model}")
            return dest
        except Exception as e:           # 429 = this model's free takes are gone today
            last = e
    raise VoiceUnavailable(f"TTS: {type(last).__name__}: {str(last)[:120]}")


def _heard(client, wav):
    """The take, transcribed. Retried: a busy model (503) once cost a good take."""
    from google.genai import types
    last = None
    for model in CHECK_MODELS:
        for attempt in range(3):
            try:
                r = client.models.generate_content(model=model, contents=[
                    types.Part.from_bytes(data=Path(wav).read_bytes(), mime_type="audio/wav"),
                    "Transcribe exactly the words spoken. Output only the words."])
                if (r.text or "").strip():
                    return r.text.strip()
            except Exception as e:
                last = e
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    break                     # this model is done for today
            time.sleep(8 * (attempt + 1))
    raise VoiceUnavailable(f"could not transcribe the take ({str(last)[:80]})")


def _syllables(line):
    """Spoken length of a line: syllables of its words, numbers spelled out."""
    count = 0
    for w in _words(line):
        count += max(1, len(re.findall(r"[aeiouy]+", w)))
    return count


def _inner_pauses(line):
    """Pauses a performer takes INSIDE a line: at its commas, full stops, dashes."""
    return len(re.findall(r"[,.;:?!\u2014\u2013](?=\s)", line.strip()))


def _cuts(islands, lines):
    """Where one line ends and the next begins.

    Taking the longest pauses failed on the first real script: "You leave
    India, climb the Himalayas, cross the Tibetan Plateau, enter China..."
    breathes at every comma, longer than between some lines, and line 1 came
    out 12 seconds long. Two things the script tells us decide instead:
      * where each break should fall - the syllables so far, in voiced time
        (which ignores how long the pauses are);
      * how many pauses belong inside each line - one per comma or full stop.
    A longer pause is still slightly preferred.
    """
    n = len(lines)
    if n == 1:
        return [(islands[0][0], islands[-1][1])]
    gaps = [(k, islands[k + 1][0] - islands[k][1]) for k in range(len(islands) - 1)]
    cand = [(k, g) for k, g in gaps if g >= 0.15]
    m = len(cand)
    if m < n - 1:
        raise VoiceUnavailable(f"only {m + 1} pauses for {n} lines")
    voiced, acc = [], 0.0
    for a, b in islands:
        acc += b - a
        voiced.append(acc)                      # voiced seconds up to the end of island k
    weight = [_syllables(line) + 1 for line in lines]
    expected = [acc * sum(weight[:j + 1]) / sum(weight) for j in range(n - 1)]
    inner = [_inner_pauses(line) for line in lines]

    def here(j, c):                             # break j placed at candidate pause c
        k, g = cand[c]
        return POS_W * abs(voiced[k] - expected[j]) - GAP_W * min(g, 2.5)

    def fits(j, between):                       # line j holding this many pauses inside
        return FIT_W * abs(between - inner[j])

    inf = float("inf")
    best = [[inf] * m for _ in range(n - 1)]
    back = [[-1] * m for _ in range(n - 1)]
    for c in range(m):
        best[0][c] = here(0, c) + fits(0, c)
    for j in range(1, n - 1):
        for c in range(j, m):
            for c0 in range(j - 1, c):
                if best[j - 1][c0] == inf:
                    continue
                v = best[j - 1][c0] + here(j, c) + fits(j, c - c0 - 1)
                if v < best[j][c]:
                    best[j][c], back[j][c] = v, c0
    total = [best[n - 2][c] + fits(n - 1, m - 1 - c) for c in range(m)]
    c = min(range(m), key=lambda i: total[i])
    if total[c] == inf:
        raise VoiceUnavailable("no way to place the line breaks")
    chosen = []
    for j in range(n - 2, -1, -1):
        chosen.append(cand[c][0])
        c = back[j][c]
    chosen.reverse()
    bounds, start = [], islands[0][0]
    for k in chosen:
        bounds.append((start, islands[k][1]))
        start = islands[k + 1][0]
    bounds.append((start, islands[-1][1]))
    return bounds


def _duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def perform(lines, style, out_dir):
    """(vo, voice_mp3) like narrate.narrate, from one acted take; or VoiceUnavailable."""
    from narrate import VOICE_POLISH             # imported here: narrate imports us lazily
    out_dir = Path(out_dir)
    takes = out_dir / "acted"
    takes.mkdir(parents=True, exist_ok=True)
    client = _client()
    raw = _take(client, lines, style, takes / "raw.wav")

    heard = _heard(client, raw)
    score = similarity(" ".join(lines), heard)
    if score < MATCH:
        raise VoiceUnavailable(f"take does not match the script ({score:.2f})")

    bounds = _cuts(timing.speech_islands(raw), lines)
    wavs, vo, t = [], [], 0.0
    for i, ((a, b), text) in enumerate(zip(bounds, lines), 1):
        wav = takes / f"{i:02d}.wav"
        # keep the natural tail of each line and fade the cut edges: hard cuts
        # at the island edges clicked and clipped breaths between lines
        tempo = f"atempo={TEMPO}," if TEMPO != 1.0 else ""
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af",
                        f"atrim={max(0.0, a - 0.06):.3f}:{b + 0.12:.3f},asetpts=PTS-STARTPTS,"
                        f"afade=t=in:d=0.015,areverse,afade=t=in:d=0.06,areverse,"
                        f"{tempo}apad=pad_dur={GAP}", "-ar", "24000", "-ac", "1",
                        str(wav)], check=True)
        d = _duration(wav)
        per_word = (d - GAP) / max(1, len(text.split()))
        if not 0.14 <= per_word <= 0.75:
            raise VoiceUnavailable(f"line {i} is {d:.1f}s for {len(text.split())} words - "
                                   f"the cut is in the wrong place")
        words = timing.time_words(text, wav, offset=t, line=i - 1)
        vo.append({"text": text, "start": round(t, 3), "end": round(t + d, 3),
                   "words": [{"w": w["word"], "start": round(w["start"] / 1000, 3),
                              "end": round(w["end"] / 1000, 3)} for w in words]})
        wavs.append(wav)
        t += d
    lst = out_dir / "acted_concat.txt"
    lst.write_text("".join(f"file '{w.resolve().as_posix()}'\n" for w in wavs), encoding="utf-8")
    voice = out_dir / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-af", VOICE_POLISH, "-ar", "48000", "-b:a", "192k", str(voice)], check=True)
    print(f"      [voice] acted: {len(lines)} lines, {t:.1f}s, matches script {score:.2f}")
    return vo, voice
