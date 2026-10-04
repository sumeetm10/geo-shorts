"""Build one "explore" Short from a researched topic: "How do you get to <an extreme place>?"

    python make_explore.py "Kola Superdeep Borehole" depth      build it (nothing posted)
    python make_explore.py "Kola Superdeep Borehole" depth --free   with the free voice

The facts come from the topic's Wikipedia article, fetched now, and nowhere else:
  1. Gemini writes the script as a list of beats, each tied to a scene of the kit
     in Explore.tsx and to a sentence QUOTED from the article.
  2. gate() rejects the script if any number it says or shows is not in the
     article (or a fixed reference like Everest's height), if a quote is not in
     the article, or if a place cannot be put on the map.
  3. A second Gemini pass must confirm every line is supported by its quote.
Only then is anything voiced or rendered. A topic that cannot pass is skipped by
run.py, which then posts a walk for that morning instead.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import geo  # noqa: E402
import mix  # noqa: E402
import narrate  # noqa: E402
import seo  # noqa: E402
import wiki  # noqa: E402

JOBS = ROOT / "data" / "jobs"
OUT = ROOT / "data" / "out"
MEDIA = ROOT / "media"
REMOTION = ROOT / "remotion"

# things drawn to scale for comparison; heights in metres, always the same
REFERENCE = {"everest": (8849, "EVEREST 8,849 m"), "titanic": (3800, "TITANIC 3,800 m"),
             "tower": (828, "BURJ KHALIFA 828 m")}
CLOSING = "Subscribe, so next time someone asks you..."
SCENES = {"map", "column", "compare", "stat", "card"}
MODES = {"plane", "ship", "car", "walk"}
ICONS = {"thermo", "clock", "ruler", "people"}
THEMES = {"cold", "hot", "dark", "sea"}
MEDIA_KINDS = {"ocean", "rock", "ice", "air"}
VEHICLES = {"sub", "drill", "climber", "none"}
UNIT = {"km": 1000.0, "kilometre": 1000.0, "kilometer": 1000.0, "mi": 1609.34, "mile": 1609.34,
        "ft": 0.3048, "feet": 0.3048, "foot": 0.3048}


# ------------------------------------------------------------------ numbers
_NUM = re.compile(r"(?<![\w.])([-−–]?\d[\d,]*(?:\.\d+)?)\s*(km|kilomet\w*|mi\b|miles?|ft|feet|foot|m\b|met\w*|°|%)?",
                  re.IGNORECASE)


def numbers(text):
    """[(value, unit_factor or None)] for every number written in the text."""
    out = []
    for m in _NUM.finditer(text.replace(" ", " ")):
        raw = m.group(1).replace(",", "").replace("−", "-").replace("–", "-")
        try:
            v = float(raw)
        except ValueError:
            continue
        u = (m.group(2) or "").lower()
        f = next((k for key, k in UNIT.items() if u.startswith(key)), None)
        out.append((v, f, bool(u)))
    return out


def num(x):
    """A value the model wrote: 12262, "12,262", "12,262 m", "-89.2" -> float (ValueError if none)."""
    if isinstance(x, (int, float)):
        return float(x)
    m = _NUM.search(str(x))
    if not m:
        raise ValueError(f"no number in {x!r}")
    return float(m.group(1).replace(",", "").replace("−", "-").replace("–", "-"))


def supported_set(source):
    s = set()
    for v, f, _ in numbers(source):
        s.update({v, abs(v)})
        if f:
            s.add(v * f)
    return s


def is_supported(value, factor, has_unit, allowed, tol=0.08):
    cands = {value, abs(value)}
    if factor:
        cands.add(value * factor)
    if not has_unit and abs(value) <= 12 and float(value).is_integer():
        return True                                   # "two", "3 countries" - counts, not claims
    for c in cands:
        for a in allowed:
            if a == 0:
                continue
            if abs(c - a) <= max(tol * abs(a), 0.51 if abs(a) < 20 else 0):
                return True
    return False


# ------------------------------------------------------------------ quotes
def _norm(t):
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s.-]", " ", t.lower())).strip()


def quote_found(quote, source):
    q = _norm(quote)
    if len(q) < 15:
        return False
    src = _norm(source)
    if q in src:
        return True
    words = q.split()
    grams = [" ".join(words[i:i + 4]) for i in range(max(1, len(words) - 3))]
    return sum(g in src for g in grams) / len(grams) >= 0.8


# ------------------------------------------------------------------ the script
def _prompt(topic, page, feedback):
    coords = (f"The article gives its position ({page['lon']:.2f}, {page['lat']:.2f})."
              if page["lon"] is not None else
              "The article has NO map position: set \"target_quote\" to the exact sentence of the "
              "article that gives its coordinates (like 48°52.6′S 123°23.6′W).")
    fb = f"\nYOUR LAST SCRIPT WAS REJECTED: {feedback}. Fix exactly that.\n" if feedback else ""
    return f"""You write the script of a 25-35 second YouTube Short for the channel AtlasOnFoot:
"{topic['angle'] or 'How do you get to ' + page['title'] + '?'}"
Topic: {page['title']} (kind: {topic['kind']}). {coords}

THE ONLY FACT SOURCE is this Wikipedia text. Every number and claim must come from it.
<<<
{page['text'][:14000]}
>>>
{fb}
Write 5 to 7 beats. Each beat is ONE narration line (5-12 words, spoken English a
12-year-old understands, present tense, talking to "you") and ONE scene:
- "map": travel to the place. Fields: "from" (the exact Wikipedia title of a real city,
  airport or port you set off from), "to" ("TARGET" or another exact Wikipedia title),
  "mode" (plane|ship|car|walk), "label" (the destination name, 1-3 words, CAPS).
  Start with 1-2 map beats: the nearest big city or airport, then the last stretch.
  Travel lines give NO distances or times (they cannot be checked).
- "column": follow a value down (depth) or up (height). Fields: "value" (metres, a
  depth/height written in this beat's quote),
  "marker" (on-screen label, CAPS, may include the number, e.g. "THE BOTTOM · 12,262 m").
  Column beats must come one after another with values going up.
- "compare": zoom out to show a known thing to scale. Field "with": everest (8,849 m)
  | titanic (3,800 m, oceans only) | tower (Burj Khalifa, 828 m). Only if it is smaller
  than the deepest/highest column value.
- "stat": one big number. Fields: "icon" (thermo|clock|ruler|people), "value" (number),
  "unit" (e.g. "°C", " km", " m", " days", " people"), "label" (CAPS, 2-5 words),
  "theme" (cold|hot|dark|sea).
- "card": one short surprising fact on screen. Fields "text" (CAPS, max 7 words), "theme".
Every beat except "map" and "compare" also needs "quote": the exact sentence from the text
that proves it - every number in the line, marker, label or value must be IN that quote.

Also give:
- "hook": the opening question, max 12 words, ending with "?", naming the place or
  its record ("Could you actually reach the deepest hole on Earth?"). Never the answer.
- "hook_top" (max 5 words) and "hook_bottom" (max 4 words, a question): hook on screen.
- "title": the YouTube title, max 60 characters, "How Do You Get to ...?" style.
- "column": {{"medium": "ocean|rock|ice|air", "vehicle": "sub|drill|climber|none",
  "axis": "depth|height"}} if you use column beats (drill for holes, sub for oceans,
  climber for mountains).
- "facts": 3-4 short facts for the description, each with its number, all from the text.
The last beat is the most surprising fact. Do not write "subscribe" (it is added).
Write numbers as digits, exactly as the text has them (rounding like "nearly 11 km" is fine).
For an approximate number say "about" - never "over", "under", "more than" or "at least"
unless the quote itself says so. Keep each fact's date, place and subject exactly as the
quote gives them (if the quote says a record was set in July, do not move it to another month).
Use "column" beats ONLY for a depth or height topic; for cold, hot and remote topics use
"map", "stat" and "card" beats.

Return ONLY JSON: {{"hook": "", "hook_top": "", "hook_bottom": "", "title": "",
"target_quote": "", "column": {{}}, "beats": [{{"line": "", "scene": "", ...}}], "facts": []}}"""


def gate(spec, page, kind=None):
    """Like _gate, but a malformed script (wrong types from the model) is a rejection
    with a reason the next attempt can fix - on 2026-10-01 it crashed the build."""
    try:
        return _gate(spec, page, kind)
    except (TypeError, ValueError, KeyError, AttributeError) as e:
        return f"malformed script ({type(e).__name__}: {str(e)[:80]}) - follow the JSON shape exactly"


def _default_column(spec, page, kind):
    """Column settings the model forgot (2026-10-03: 'bad column settings {}')."""
    col = spec.get("column") if isinstance(spec.get("column"), dict) else {}
    if col.get("medium") in MEDIA_KINDS and col.get("vehicle") in VEHICLES and col.get("axis") in ("depth", "height"):
        return col
    if kind == "height":
        return {"medium": "air", "vehicle": "climber", "axis": "height"}
    wet = re.search(r"\b(ocean|sea|lake|trench|underwater|seabed)\b", page["text"][:3000], re.IGNORECASE)
    return {"medium": "ocean", "vehicle": "sub", "axis": "depth"} if wet else \
        {"medium": "rock", "vehicle": "drill", "axis": "depth"}


def _gate(spec, page, kind=None):
    """None if the script may be used, else the reason it may not.

    A number must be in the SENTENCE quoted for its own beat (8% for rounding,
    "nearly 11 km" for 10,935 m), not just anywhere in the article: checked
    against the whole article, an invented "15,500 metres" passed because some
    other number in the text was close to it.
    """
    src = page["text"]
    whole = supported_set(src)
    beats = spec.get("beats") or []
    if not 5 <= len(beats) <= 8:
        return f"{len(beats)} beats (need 5-8)"
    hook = str(spec.get("hook", ""))
    if not hook.endswith("?") or not 4 <= len(hook.split()) <= 12:
        return "the hook must be a question of 4-12 words"
    kinds = [b.get("scene") for b in beats]
    if kind in ("cold", "hot", "remote") and any(k in ("column", "compare") for k in kinds):
        return "a cold/hot/remote topic uses map, stat and card beats - no column or compare"
    if any(k in ("column", "compare") for k in kinds):
        spec["column"] = _default_column(spec, page, kind)
    col = spec.get("column") or {}
    if any(k not in SCENES for k in kinds):
        return f"unknown scene in {kinds}"
    if kinds[0] != "map":
        return "the first beat must be a map beat (getting there)"
    cols = [i for i, k in enumerate(kinds) if k in ("column", "compare")]
    if cols:
        if cols != list(range(cols[0], cols[-1] + 1)):
            return "column/compare beats must come one after another"
        if kinds[cols[0]] != "column":
            return "a compare beat must follow a column beat"
        if col.get("medium") not in MEDIA_KINDS or col.get("vehicle") not in VEHICLES \
                or col.get("axis") not in ("depth", "height"):
            return f"bad column settings {col}"
        try:
            vals = [num(beats[i]["value"]) for i in cols if beats[i]["scene"] == "column"]
        except (KeyError, TypeError, ValueError):
            return "every column beat needs a numeric value"
        if any(v <= 0 for v in vals) or vals != sorted(vals) or len(set(vals)) != len(vals):
            return f"column values must go up: {vals}"
    for i, b in enumerate(beats, 1):
        line = str(b.get("line", ""))
        n = len(line.split())
        if not 4 <= n <= 16:
            return f"beat {i} line has {n} words"
        if "subscribe" in line.lower():
            return "the script must not say subscribe"
        said = numbers(line + " " + " ".join(str(b.get(k, "")) for k in ("marker", "label", "text")))
        kind = b["scene"]
        if kind == "map":
            if b.get("mode") not in MODES or not b.get("from"):
                return f"beat {i}: a map beat needs 'from' and a mode"
            if any(u or abs(v) > 12 for v, f, u in said):
                return f"beat {i}: a travel line may not give distances or times (none are checked)"
            continue
        if kind == "compare":
            ref = REFERENCE.get(b.get("with"))
            mx = max(vals) if cols else 0
            if not ref or ref[0] >= mx:
                return f"compare '{b.get('with')}' is not smaller than {mx:,.0f} m"
            if b["with"] == "titanic" and col.get("medium") != "ocean":
                return "the Titanic only compares in an ocean"
            ok = {ref[0], mx - ref[0], mx, (mx - ref[0]) / 1000, mx / 1000}
            for v, f, u in said:
                if not is_supported(v, f, u, ok, tol=0.08):
                    return f"beat {i} uses {v:g}; only {ref[0]:,} and the difference are known"
            continue
        quote = str(b.get("quote", ""))
        if not quote_found(quote, src):
            return f"beat {i}'s quote is not in the article"
        near = supported_set(quote)
        for v, f, u in said:
            if not is_supported(v, f, u, near, tol=0.08):
                return f"beat {i} says {v:g}, which its quote does not"
        if kind in ("column", "stat"):
            try:
                val = num(b.get("value"))
            except (TypeError, ValueError):
                return f"beat {i} needs a numeric value"
            if not is_supported(val, None, True, near, tol=0.08):
                return f"beat {i} shows {val:g}, which its quote does not"
        if kind == "stat" and (b.get("icon") not in ICONS or b.get("theme") not in THEMES):
            return f"beat {i}: bad stat icon/theme"
    for fct in spec.get("facts") or []:
        for v, f, u in numbers(str(fct)):
            if not is_supported(v, f, u, whole, tol=0.03):
                return f"description fact '{fct}' uses {v:g}, not in the article"
    return None


def _checked_by_model(spec, llm, cfg):
    """Second opinion: is every line really said by its quote? (numbers are gated in code)"""
    pairs = [{"line": b["line"], "quote": b.get("quote", "")} for b in spec["beats"] if b.get("quote")]
    prompt = ("For each pair, is the LINE fully supported by the QUOTE (same facts, no additions, "
              "numbers may be rounded)? Return ONLY JSON {\"results\": [{\"ok\": true|false, "
              "\"why\": \"\"}]} in the same order.\n\n" + json.dumps(pairs, ensure_ascii=False))
    res = llm.run_json(cfg, prompt, temperature=0.0).get("results", [])
    bad = [f"'{p['line']}' ({r.get('why', '')})" for p, r in zip(pairs, res) if not r.get("ok")]
    return None if len(res) == len(pairs) and not bad else ("not supported: " + "; ".join(bad))[:300]


def write_spec(topic, page):
    import llm
    cfg = llm.config()
    feedback = None
    for attempt in range(4):
        try:
            spec = llm.run_json(cfg, _prompt(topic, page, feedback), temperature=0.6)
        except Exception as e:
            feedback = f"{type(e).__name__}: {str(e)[:80]}"
            continue
        if not isinstance(spec, dict):
            feedback = "return one JSON object"
            continue
        problem = gate(spec, page, topic.get("kind"))
        if not problem:
            problem = _checked_by_model(spec, llm, cfg)
        if not problem:
            return spec
        feedback = problem
        print(f"      [script] rejected: {problem}")
    raise RuntimeError(f"no script passed the fact gate ({feedback})")


# ------------------------------------------------------------------ props
def _target(spec, page):
    if page["lon"] is not None:
        return (page["lon"], page["lat"])
    q = str(spec.get("target_quote", ""))
    c = wiki.text_coords(q) if quote_found(q, page["text"]) else None
    if not c:
        raise RuntimeError("the place has no coordinates to draw")
    return c


def _crop(win, rel):
    geo.crop(win.lon0, win.lon1, win.lat0, win.lat1, MEDIA / rel)
    return rel


def _pt(win, lon, lat):
    x, y = win.px(lon, lat)
    return {"x": round(x, 1), "y": round(y, 1)}


def build_props(spec, page, target, vo, slug):
    rel = f"jobs/{slug}"
    lon, lat = target
    dlat = 40
    clat = max(-68, min(68, lat))
    wide = geo.Window(lon - dlat * geo.ASPECT / 2, lon + dlat * geo.ASPECT / 2, clat - dlat / 2, clat + dlat / 2)
    props = {"vo": vo, "hook": {"top": spec["hook_top"], "bottom": spec["hook_bottom"]},
             "wide": {"image": _crop(wide, f"{rel}/wide.jpg"), "target": _pt(wide, lon, lat)},
             "globe": {"lon": lon, "lat": lat, "texture": "globe/earth4k.jpg"},     # 3D intro
             "scenes": [], "durationInSeconds": round(vo[-1]["end"] + 0.45, 2)}
    beats = spec["beats"]
    col = spec.get("column") or {}
    last = len(vo) - 1
    i = 0
    while i < len(beats):
        b, line = beats[i], i + 1
        if b["scene"] == "map":
            a = wiki.coords(b["from"])
            if not a:
                raise RuntimeError(f"no coordinates for '{b['from']}'")
            dest = target if str(b.get("to", "TARGET")).upper() == "TARGET" else wiki.coords(b["to"])
            if not dest:
                raise RuntimeError(f"no coordinates for '{b.get('to')}'")
            pa, pb = geo.unwrap([a, dest])
            win = geo.fit_window([pa, pb], pad=0.45, min_dlat=5, max_dlat=70)
            A, B = _pt(win, *pa), _pt(win, *pb)
            props["scenes"].append({
                "type": "map", "from": line, "to": line, "image": _crop(win, f"{rel}/map-{line}.jpg"),
                "focus": B, "route": {"a": A, "b": B, "mode": b["mode"]},
                "pins": [{**A, "label": b["from"].split(",")[0].upper()[:22], "color": "#2bb673"},
                         {**B, "label": str(b.get("label") or page["title"]).upper()[:22]}]})
            i += 1
        elif b["scene"] in ("column", "compare"):
            j = i
            stops, markers, compare = [], [], None
            while j < len(beats) and beats[j]["scene"] in ("column", "compare"):
                bj = beats[j]
                if bj["scene"] == "column":
                    v = num(bj["value"])
                    stops.append({"line": j + 1, "value": v})
                    markers.append({"value": v, "label": str(bj.get("marker", ""))[:34]})
                else:
                    ref, label = REFERENCE[bj["with"]]
                    mx = max(s["value"] for s in stops)
                    spare = mx - ref
                    compare = {"line": j + 1, "kind": bj["with"], "value": ref, "label": label,
                               "spare": (f"{spare / 1000:.1f} KM TO SPARE" if spare >= 1000
                                         else f"{spare:,.0f} M TO SPARE")}
                j += 1
            sc = {"type": "column", "from": i + 1, "to": j, "axis": col["axis"], "medium": col["medium"],
                  "vehicle": col["vehicle"], "max": max(s["value"] for s in stops), "stops": stops,
                  "markers": markers}
            if compare:
                sc["compare"] = compare
            props["scenes"].append(sc)
            i = j
        elif b["scene"] == "stat":
            props["scenes"].append({"type": "stat", "from": line, "to": line, "icon": b["icon"],
                                    "value": num(b["value"]), "unit": str(b.get("unit", ""))[:8],
                                    "label": str(b.get("label", "")).upper()[:30], "theme": b["theme"]})
            i += 1
        else:
            props["scenes"].append({"type": "card", "from": line, "to": line,
                                    "text": str(b.get("text", "")).upper()[:60],
                                    "theme": b.get("theme") if b.get("theme") in THEMES else "dark"})
            i += 1
    props["scenes"][-1]["to"] = last                   # the closing line stays on the last scene
    return props


# ------------------------------------------------------------------ build
def _ensure_registry():
    reg = REMOTION / "src" / "registry.gen.tsx"
    if "Explore" not in reg.read_text(encoding="utf-8"):
        subprocess.run(["node", "scripts/gen-registry.mjs"], cwd=REMOTION, check=True)


def render(props_path, out_path):
    _ensure_registry()
    r = subprocess.run(["node", "scripts/render-geo.mjs", "Explore", str(props_path), str(out_path)],
                       cwd=REMOTION, capture_output=True, text=True)
    if r.returncode != 0 or not Path(out_path).exists():
        raise RuntimeError(f"render failed: {(r.stderr or r.stdout)[-600:]}")


def meta_for(spec, page, lines):
    name = page["title"]
    found = [q for q in seo.suggestions(name.lower()) if len(q) < 60][:5]
    facts = "\n".join(f"- {f}" for f in spec.get("facts") or [])
    desc = (f"{spec['hook']}\n\n{facts}\n\nFacts from Wikipedia: {page['url']}\n"
            f"Where should we go next? Tell me in the comments {seo.POINT}\n\n#geography #shorts #earth")
    tags = list(dict.fromkeys([name.lower(), *found, "extreme places", "geography", "maps",
                               "how do you get to", "earth facts", "shorts"]))
    title = str(spec["title"]).strip()
    return {"title": f"{title} {seo.GLOBE}"[:100], "description": desc, "tags": tags}


def make(wiki_title, kind="depth", angle="", date=None, free=False, spec_file=None):
    date = date or datetime.now().strftime("%Y-%m-%d")
    page = wiki.page(wiki_title)
    if not page:
        raise RuntimeError(f"no Wikipedia article '{wiki_title}'")
    slug = re.sub(r"[^a-z0-9]+", "-", page["title"].lower()).strip("-")[:40]
    job = JOBS / f"{date}-explore-{slug}"
    job.mkdir(parents=True, exist_ok=True)
    print(f"[topic ] {page['title']} ({kind}) - {len(page['text']):,} chars from Wikipedia")

    if spec_file:                                # a saved script: still gated, never trusted
        spec = json.loads(Path(spec_file).read_text(encoding="utf-8"))
        problem = gate(spec, page, kind)
        if problem:
            raise RuntimeError(f"{spec_file} fails the fact gate: {problem}")
    else:
        spec = write_spec({"kind": kind, "angle": angle}, page)
    target = _target(spec, page)
    (job / "spec.json").write_text(json.dumps(spec, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [spec["hook"]] + [b["line"] for b in spec["beats"]] + [CLOSING]
    for n, l in enumerate(lines):
        print(f"      {n:2d}. {l}")
    kinds = ["hook"] + ["payoff" if b is spec["beats"][-1] else
                        {"map": "walk", "column": "cold", "compare": "reveal"}.get(b["scene"], "reveal")
                        for b in spec["beats"]] + ["cta"]
    vo, voice = narrate.narrate(lines, kinds, job, style=None if free else "explore")
    props = build_props(spec, page, target, vo, f"{date}-explore-{slug}")
    props_path = job / "props.json"
    props_path.write_text(json.dumps(props), encoding="utf-8")
    print(f"[render] {props['durationInSeconds']:.1f}s, scenes: "
          + ", ".join(s["type"] for s in props["scenes"]))
    silent = job / "silent.mp4"
    render(props_path, silent)
    import score
    bed = job / "score.wav"
    score.build_score(bed, props["durationInSeconds"] + 0.5, tone="curious",
                      seed=int(hashlib.md5(slug.encode()).hexdigest(), 16) % 97)
    OUT.mkdir(parents=True, exist_ok=True)
    final = OUT / f"{date}-explore-{slug}.mp4"
    mix.mix(silent, voice, bed, final, bed_db=-9)
    meta = {"kind": "explore", "format": "explore", "file": str(final), "slug": slug, "date": date,
            "wikipedia": page["title"], **meta_for(spec, page, lines), "lines": lines}
    (job / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done  ] {final}  ({mix.duration(final):.1f}s)")
    return meta


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("title")
    ap.add_argument("kind", nargs="?", default="depth")
    ap.add_argument("--free", action="store_true", help="edge-tts voice (keeps the Gemini voice quota)")
    ap.add_argument("--spec", help="use this saved script instead of writing one (still fact-gated)")
    a = ap.parse_args()
    make(a.title, a.kind, free=a.free, spec_file=a.spec)
