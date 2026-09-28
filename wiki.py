"""Wikipedia as the fact source for the explore videos.

Every number an explore video says or shows must be found in its topic's
article text (make_explore.gate). The article is fetched fresh at build time,
so the check is against what Wikipedia says today, not what a model remembers.

    python wiki.py "Kola Superdeep Borehole"     title, coordinates, text size
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

API = "https://en.wikipedia.org/w/api.php"
# Wikipedia asks bots to identify themselves
UA = {"User-Agent": "AtlasOnFoot-shorts/1.0 (https://github.com/sumeetm10/geo-shorts)"}


def _get(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last = e
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"wikipedia: {last}")


def page(title):
    """{'title', 'text', 'lon', 'lat', 'url'} or None when there is no such article."""
    d = _get({"action": "query", "prop": "extracts|coordinates|info", "explaintext": 1,
              "exsectionformat": "plain", "redirects": 1, "titles": title, "inprop": "url"})
    pages = d.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing") or pages[0].get("invalid"):
        return None
    p = pages[0]
    c = (p.get("coordinates") or [{}])[0]
    text = p.get("extract", "")
    # drop the reference-list tail: its numbers are page counts and years
    text = re.split(r"\n(See also|References|Notes|Further reading|External links)\n", text)[0]
    # no guessing from the text when the article has no coordinates: "Point Nemo"
    # redirects to an article whose first position is the ARCTIC pole. The script
    # writer then has to quote the right sentence (make_explore, text_coords).
    return {"title": p["title"], "text": text, "lon": c.get("lon"), "lat": c.get("lat"),
            "url": p.get("fullurl")}


_DMS = re.compile(r"(\d{1,2})°\s*(\d{1,2}(?:\.\d+)?)?[′']?\s*(?:\d{1,2}(?:\.\d+)?[″\"])?\s*([NS])[,\s]+"
                  r"(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)?[′']?\s*(?:\d{1,2}(?:\.\d+)?[″\"])?\s*([EW])")


def text_coords(text):
    """First 'DD°MM′S DDD°MM′W' in the text, as (lon, lat)."""
    m = _DMS.search(text)
    if not m:
        return None
    lat = float(m.group(1)) + float(m.group(2) or 0) / 60
    lon = float(m.group(4)) + float(m.group(5) or 0) / 60
    return (-lon if m.group(6) == "W" else lon, -lat if m.group(3) == "S" else lat)


def coords(title):
    """(lon, lat) of a place's article, or None."""
    d = _get({"action": "query", "prop": "coordinates", "redirects": 1, "titles": title})
    pages = d.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing"):
        return None
    c = (pages[0].get("coordinates") or [None])[0]
    return (c["lon"], c["lat"]) if c else None


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = page(" ".join(sys.argv[1:]) or "Kola Superdeep Borehole")
    if not p:
        sys.exit("no such article")
    print(p["title"], p["lon"], p["lat"], len(p["text"]), "chars")
    print(p["text"][:600])
