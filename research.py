"""Find what is going viral in the "extreme places" niche and queue topics for it.

    python research.py            search, pick topics, add them to the queue
    python research.py --dry      show what it would add

1. YouTube search (the channel's own login, youtube.readonly): the most viewed
   Shorts of the last six months for a rotating set of seed searches.
2. Keep the ones far above their channel's size (views / subscribers) - a big
   channel's hit says little, a small channel's hit says the TOPIC travels.
3. Gemini turns those titles into topics our scenes can draw, each tied to a
   Wikipedia article (the only fact source a video may use), skipping what is
   done or queued. Every article is fetched to confirm it exists.

The queue lives in data/state.json ("explore"), which the cloud run commits.
Each seed search costs 100 of the 10,000 daily YouTube API units (an upload
costs 1,600), so one run of six seeds is about the price of half an upload.
"""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

SEEDS = [
    "deepest place on earth", "deepest hole ever dug", "most remote place on earth",
    "coldest place on earth", "hottest place on earth", "highest place on earth",
    "loneliest place on earth", "most isolated island", "deepest cave in the world",
    "how do you get to", "most dangerous place on earth", "deepest lake in the world",
    "tallest mountain in the world", "most extreme place on earth", "point nemo",
    "strangest place on earth", "biggest hole on earth", "most unreachable place",
]
PER_RUN = 6
MIN_VIEWS = 300_000
KINDS = ["depth", "height", "cold", "hot", "remote"]


def _youtube():
    from googleapiclient.discovery import build
    import upload_geo
    return build("youtube", "v3", credentials=upload_geo._credentials(), cache_discovery=False)


def viral(seeds, days=180):
    yt = _youtube()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    ids = []
    for q in seeds:
        r = yt.search().list(part="id", q=q, type="video", videoDuration="short", order="viewCount",
                             publishedAfter=since, maxResults=25, relevanceLanguage="en").execute()
        ids += [it["id"]["videoId"] for it in r.get("items", []) if it["id"].get("videoId")]
    ids = list(dict.fromkeys(ids))
    vids = []
    for k in range(0, len(ids), 50):
        r = yt.videos().list(part="snippet,statistics", id=",".join(ids[k:k + 50])).execute()
        vids += r.get("items", [])
    chans = {}
    cids = list({v["snippet"]["channelId"] for v in vids})
    for k in range(0, len(cids), 50):
        r = yt.channels().list(part="statistics", id=",".join(cids[k:k + 50])).execute()
        for c in r.get("items", []):
            chans[c["id"]] = int(c["statistics"].get("subscriberCount") or 0)
    out = []
    for v in vids:
        views = int(v["statistics"].get("viewCount") or 0)
        if views < MIN_VIEWS:
            continue
        subs = chans.get(v["snippet"]["channelId"], 0)
        out.append({"title": v["snippet"]["title"], "views": views, "subs": subs,
                    "breakout": round(views / max(subs, 1000), 1), "id": v["id"]})
    out.sort(key=lambda x: -x["breakout"])
    return out


def pick(found, done, queued, want=6):
    import llm
    lines = "\n".join(f"- {v['title']}  ({v['views']:,} views, channel {v['subs']:,} subs)"
                      for v in found[:60])
    prompt = f"""These YouTube Shorts went viral recently (views far above their channel's size):
{lines}

Suggest up to {want} topics for our channel AtlasOnFoot, which makes "How do you get to
<an extreme real place>?" Shorts drawn on NASA satellite maps and cross-sections.

Each topic must be:
- ONE real place with its own English Wikipedia article (give the exact article title),
  that sits somewhere on the map (a trench, borehole, cave, lake, station, island,
  mountain, desert, volcano...). No people, animals, legends, events or products.
- about an extreme a cross-section or a number can show: "depth" (down: ocean, hole,
  cave, lake), "height" (up: mountain, building), "cold", "hot" or "remote".
- close to what the viral titles above are about.
- NOT one of these (done or queued): {sorted(set(done) | set(queued))}

Return ONLY JSON: {{"topics": [{{"wikipedia": "exact article title", "kind": "depth|height|cold|hot|remote",
"angle": "the hook question, e.g. How do you get to the deepest hole on Earth?",
"evidence": "the viral title(s) it comes from"}}]}}"""
    cfg = llm.config()
    out = llm.run_json(cfg, prompt, temperature=0.4)
    return out.get("topics", [])


def research(dry=False):
    import run
    import wiki
    s = run.load_state()
    ex = s.setdefault("explore", {"queue": [], "done": [], "failed": []})
    k = ex.get("seed_at", 0)
    seeds = [SEEDS[(k + i) % len(SEEDS)] for i in range(PER_RUN)]
    ex["seed_at"] = (k + PER_RUN) % len(SEEDS)
    found = viral(seeds)
    print(f"[search] {len(found)} viral Shorts from: {', '.join(seeds)}")
    for v in found[:8]:
        print(f"   {v['breakout']:>7}x  {v['views']:>11,}  {v['title'][:70]}")
    done = ex["done"] + ex["failed"]
    queued = [q["wikipedia"] for q in ex["queue"]]
    added = []
    for t in pick(found, done, queued) if found else []:
        title, kind = str(t.get("wikipedia", "")).strip(), t.get("kind")
        if not title or kind not in KINDS:
            continue
        p = wiki.page(title)
        if not p or len(p["text"]) < 1500:
            print(f"   skip {title}: no usable article")
            continue
        if p["title"] in done or p["title"] in queued or p["title"] in [a["wikipedia"] for a in added]:
            continue
        added.append({"wikipedia": p["title"], "kind": kind, "angle": str(t.get("angle", ""))[:120],
                      "evidence": str(t.get("evidence", ""))[:200],
                      "added": datetime.now().strftime("%Y-%m-%d")})
        print(f"   + {p['title']} ({kind}): {t.get('angle', '')}")
    ex["last_research"] = datetime.now().strftime("%Y-%m-%d")
    if not dry:
        ex["queue"] += added
        run.save_state(s)
    return added


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    research(dry="--dry" in sys.argv)
