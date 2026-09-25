"""Titles, descriptions, tags and the closing call to action.

Search wording comes from YouTube's own suggestions, the phrases people really
type: on 2026-09-25 "can you walk from india to AMERICA" was the top suggestion,
not "usa", so a title says what gets searched. A suggestion lookup that fails
costs nothing: the fixed wording is used.

The call to action is one short line at the very end, read by the narrator and
shown as a Subscribe card. It says "subscribe", not "follow": on YouTube that
is the button's name.
"""
import hashlib
import json
import re
import urllib.parse
import urllib.request

import geo

GLOBE, WALKER, POINT = "\U0001F30D", "\U0001F6B6", "\U0001F447"

CTA = {
    "walk_no": ["Subscribe if you'd still try it.",
                "Subscribe for more impossible walks.",
                "Which walk should I try next? Subscribe and tell me."],
    "walk_yes": ["Subscribe if you'd take this walk.",
                 "Subscribe for more walks like this.",
                 "Would you do it? Subscribe for the next walk."],
    "question": ["Subscribe for more map facts.",
                 "Tell me your country, and subscribe for more.",
                 "Subscribe for more strange borders."],
}
# How a destination is SEARCHED, when that differs from its short name
SEARCHED = {"United States of America": ["america", "usa", "us"],
            "United Kingdom": ["uk", "england", "london"]}
BASE_TAGS = ["geography", "maps", "map animation", "geography facts", "shorts"]


def cta(kind, key):
    """A fixed pick per video, so a rebuild says the same line."""
    options = CTA[kind]
    return options[int(hashlib.md5(key.encode()).hexdigest(), 16) % len(options)]


def suggestions(query):
    url = ("https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q="
           + urllib.parse.quote(query))
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            data = json.loads(r.read().decode("utf-8", "replace"))
        return [s for s in data[1] if isinstance(s, str)]
    except Exception:
        return []


def _hashtag(name):
    return "#" + re.sub(r"[^A-Za-z0-9]", "", name).lower()


def _the(short):
    return f"the {short}" if short in ("UK", "USA", "UAE", "DR Congo", "Netherlands",
                                       "Philippines", "Central African Republic") else short


def walk_meta(route, lines):
    origin, dest = route["origin"], route["dest"]
    o, d = geo.short(origin), geo.short(dest)
    said = geo.short(dest)
    found = suggestions(f"can you walk from {o.lower()} to")
    for alias in SEARCHED.get(dest, []):
        if any(f"{o.lower()} to {alias}" in s for s in found):
            said = alias.title() if len(alias) > 3 else alias.upper()
            break
    title = f"Can You Walk from {o} to {_the(said) if said in ('UK', 'USA') else said}? {GLOBE}{WALKER}"

    countries = route["countries1"] + route["countries2"]
    path = " > ".join(dict.fromkeys(geo.short(c) for c in countries))
    km = int(route["km1"] // 100 * 100) if route["km1"] < 10000 else int(route["km1"] // 1000 * 1000)
    if route["walkable"]:
        fact = (f"Yes: at least {km:,} km on foot, through {len(route['countries1'])} countries. "
                f"Route: {path}.")
    else:
        gap = route["gap"]
        water = gap["water"] or "the sea"
        fact = (f"You can walk at least {km:,} km, but {gap['said']:,} km of water "
                f"({water}) stops you on the coast of {geo.short(gap['from'])}. Route: {path}.")
    description = (
        f"Can you really walk from {o} to {_the(d)}? We traced the whole route on real "
        f"borders and NASA satellite maps.\n\n{fact}\n\n"
        f"Which two countries should I walk next? Tell me in the comments {POINT}\n\n"
        f"#geography #maps #shorts {_hashtag(o)} {_hashtag(d)}")

    tags = [f"can you walk from {o} to {d}".lower(), f"{o} to {d} by walk".lower(),
            f"walking from {o} to {d}".lower(), f"{o} to {d} on foot".lower()]
    names = [d.lower()] + SEARCHED.get(dest, [])
    tags += [s for s in found if o.lower() in s and any(
        re.search(rf"\b{re.escape(n)}\b", s) for n in names)][:4]      # "us" not in "australia"
    tags += ["can you walk", *BASE_TAGS, *(geo.short(c) for c in dict.fromkeys(countries))]
    if route["gap"] and route["gap"]["water"]:
        tags.append(route["gap"]["water"].lower())
    return {"title": title, "description": description, "tags": list(dict.fromkeys(tags))}


def question_meta(topic, lines):
    items = "\n".join(f"- {it['line']}" for it in topic["items"])
    description = (f"{topic['hook']}\n\n{items}\n\n{topic['payoff']} Tell me in the comments "
                   f"{POINT}\n\n#geography #maps #shorts #countries #borders")
    tags = list(dict.fromkeys(topic.get("tags", []) + BASE_TAGS
                              + [geo.short(it["country"]) for it in topic["items"]]))
    title = topic.get("seo_title") or f"{topic['title']} {GLOBE}"
    return {"title": title[:100], "description": description, "tags": tags}
