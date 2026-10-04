"""Daily run: an "explore" video in the morning, a question in the evening.

    python run.py explore       build and post the next researched topic ("How do you
                                get to <an extreme place>?", make_explore.py)
    python run.py walk          the older morning format, now the fallback
    python run.py question      the next "your country" question
    python run.py research      look for viral topics and queue them (research.py)
    python run.py status        what has been made, what is next
    python run.py nightly       build BOTH of the coming Nepal day's videos and
                                schedule them on YouTube for 11:00 and 19:00
    python run.py explore --test   build the next one, post nothing, move nothing on

The morning slot tries an explore video first; if there is no topic, or the
topic's script cannot pass the fact gate, it posts a walk instead, so the slot
is never empty. Research runs by itself when the queue runs low.

Exit codes are real, not decorative: a run that exits 0 but made nothing is how
another channel lost four days unnoticed. 0 = made and posted, 2 = held
(channel not set up yet: nothing built, the topic waits for day one),
3 = failed. Task Scheduler shows the difference.

A topic that fails twice in a row is skipped, so one bad route cannot stall the
channel; the failure stays in the history.
"""
import json
import shutil
import subprocess
import sys
import time
import traceback
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "data" / "state.json"
UPLOAD_CFG = ROOT / "data" / "upload.json"
LOG = ROOT / "data" / "daily.log"

sys.path.insert(0, str(ROOT))
import topics  # noqa: E402


def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"walk_next": 0, "question_next": 0, "history": []}


def save_state(s):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(s, indent=2, ensure_ascii=False), encoding="utf-8")


def privacy():
    try:
        return json.loads(UPLOAD_CFG.read_text(encoding="utf-8")).get("privacy", "public")
    except Exception:
        return "public"


def verify(path):
    """Does the file look like a finished Short? Checked before anything posts."""
    p = Path(path)
    if not p.exists() or p.stat().st_size < 500_000:
        return "file missing or too small"
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_type:format=duration", "-of", "json", str(p)],
                       capture_output=True, text=True)
    try:
        info = json.loads(r.stdout)
    except Exception:
        return "ffprobe could not read it"
    kinds = {s.get("codec_type") for s in info.get("streams", [])}
    if "video" not in kinds or "audio" not in kinds:
        return f"streams present: {sorted(kinds)}"
    secs = float(info.get("format", {}).get("duration", 0))
    if not 10 <= secs <= 75:
        return f"duration {secs:.1f}s outside 10-75s"
    return None


def cleanup(days=3):
    """Per-video crops pile up in media/ (bundled on every render) and each job in
    data/jobs keeps a silent render and audio stems. Finished videos in data/out stay."""
    cutoff = time.time() - days * 86400
    for base in (ROOT / "media" / "jobs", ROOT / "data" / "jobs"):
        for d in base.glob("*"):
            if d.is_dir() and d.stat().st_mtime < cutoff:
                shutil.rmtree(d, ignore_errors=True)


NEPAL = timedelta(hours=5, minutes=45)
PUBLISH = {"morning": (11, 0), "evening": (19, 0)}        # Nepal time, exact
SLOT = {"explore": "morning", "walk": "morning", "question": "evening"}
NOTHING = 4                                                # exit code: no topic to make


def explore_state(s):
    return s.setdefault("explore", {"queue": [], "done": [], "failed": []})


def build(kind, s):
    """Build the next video of this kind; (meta, fail_key) or raise."""
    if kind == "explore":
        t = explore_state(s)["queue"][0]
        import make_explore
        return make_explore.make(t["wikipedia"], t["kind"], t.get("angle", "")), f"explore:{t['wikipedia']}"
    pool = topics.WALKS if kind == "walk" else topics.QUESTIONS
    i = s["walk_next" if kind == "walk" else "question_next"]      # never wraps: see used_up()
    if kind == "walk":
        import make_walk
        return make_walk.make(*pool[i]), f"walk:{i}"
    import make_question
    return make_question.make(pool[i]["id"]), f"question:{i}"


def used_up(kind, s):
    """Every walk / question has been posted once. Repeats are not an option:
    the first repeat on 2026-10-03 got 11 views where the original had 1,500 -
    YouTube buries reused uploads. New topics go in topics.py."""
    if kind not in ("walk", "question"):
        return False
    pool = topics.WALKS if kind == "walk" else topics.QUESTIONS
    return s.get("walk_next" if kind == "walk" else "question_next", 0) >= len(pool)


def advance(kind, s, gave_up=False):
    """Move this kind's queue on: after a post, or after a topic failed twice."""
    if kind == "explore":
        ex = explore_state(s)
        t = ex["queue"].pop(0)
        (ex["failed"] if gave_up else ex["done"]).append(t["wikipedia"])
    else:
        key = "walk_next" if kind == "walk" else "question_next"
        s[key] = s[key] + 1


def run(kind, test=False, publish_at=None, day=None):
    import upload_geo
    if test:
        s = load_state()
        if kind == "explore" and not explore_state(s)["queue"]:
            print("[test  ] the explore queue is empty - run: python run.py research")
            return NOTHING
        if used_up(kind, s):
            print(f"[test  ] every {kind} topic has been used - add new ones to topics.py")
            return NOTHING
        meta, _ = build(kind, s)
        problem = verify(meta["file"])
        print(f"[test  ] {meta['title']} -> {meta['file']}: {problem or 'looks fine'}")
        return 3 if problem else 0
    if not upload_geo.ready():
        # building now would spend the best topics on videos nobody ever sees
        print("[hold  ] channel not set up yet - nothing built, topic kept for day one "
              "(set EXPECTED in upload_geo.py and run: python upload_geo.py --login)")
        return 2

    s = load_state()
    # GitHub's timer is best-effort, so each slot has backup triggers; the first
    # one that runs posts, the rest find it done and stop here.
    today = datetime.now().strftime("%Y-%m-%d")
    same_slot = [k for k, v in SLOT.items() if v == SLOT[kind]]
    if any(h.get("kind") in same_slot and h.get("youtube_id") and
           (h.get("for_day") == day if day else h.get("date", "").startswith(today))
           for h in s["history"]):
        print(f"[skip  ] the {SLOT[kind]} video for {day or today} is already up or scheduled")
        return 0
    if kind == "explore" and not explore_state(s)["queue"]:
        print("[none  ] no explore topic queued")
        return NOTHING
    if used_up(kind, s):
        print(f"::warning::every {kind} topic has been posted once - nothing posted rather than a repeat; "
              f"add new ones to topics.py")
        return NOTHING
    fails = s.setdefault("fails", {})
    if kind == "explore":
        fkey = f"explore:{explore_state(s)['queue'][0]['wikipedia']}"
    else:
        pool = topics.WALKS if kind == "walk" else topics.QUESTIONS
        fkey = f"{kind}:{s['walk_next' if kind == 'walk' else 'question_next']}"
    entry = {"date": datetime.now().strftime("%Y-%m-%d %H:%M"), "kind": kind, "title": fkey}
    if day:
        entry["for_day"] = day

    def failed(why):
        """Keep the topic for the next run, unless it has now failed twice."""
        fails[fkey] = fails.get(fkey, 0) + 1
        entry["error"] = why
        s["history"].append(entry)
        if fails[fkey] >= 2:
            advance(kind, s, gave_up=True)
            print(f"[skip  ] {fkey} failed twice - moving on")
        save_state(s)
        print(f"[FAIL  ] {why}")
        return 3

    try:
        meta, _ = build(kind, s)
    except (Exception, SystemExit) as e:
        traceback.print_exc()
        return failed(f"build: {type(e).__name__}: {str(e)[:160]}")

    entry.update(title=meta["title"], file=meta["file"])
    if meta.get("format"):
        entry["format"] = meta["format"]          # which version, for the retention test
    problem = verify(meta["file"])
    if problem:
        return failed(f"check: {problem} - nothing posted")
    try:
        entry["youtube_id"] = upload_geo.upload(meta["file"], meta, privacy(), publish_at=publish_at)
        entry["privacy"] = privacy()
        if publish_at:
            entry["publish_at"] = publish_at.strftime("%Y-%m-%d %H:%M UTC")
    except Exception as e:
        return failed(f"upload: {type(e).__name__}: {str(e)[:160]}")

    fails.pop(fkey, None)
    advance(kind, s)
    s["history"].append(entry)
    save_state(s)
    cleanup()
    return 0


def maybe_research():
    """Top the explore queue up when it runs low, or once a week."""
    ex = explore_state(load_state())
    last = ex.get("last_research", "2000-01-01")
    stale = (datetime.now() - datetime.strptime(last, "%Y-%m-%d")).days >= 7
    if len(ex["queue"]) >= 3 and not stale:
        return
    try:
        import research
        research.research()
    except Exception as e:                        # research must never cost a post
        traceback.print_exc()
        print(f"[warn  ] research failed: {type(e).__name__}: {str(e)[:120]}")


def nightly():
    """Both videos for the Nepal day now starting, scheduled to the minute."""
    now = datetime.now(timezone.utc)
    day = (now + NEPAL).date()
    worst = 0
    for slot, kinds in (("morning", ("explore", "walk")), ("evening", ("question",))):
        h, m = PUBLISH[slot]
        at = datetime(day.year, day.month, day.day, h, m, tzinfo=timezone.utc) - NEPAL
        if slot == "morning":
            maybe_research()
        rc = 0
        for kind in kinds:                        # the first that works fills the slot
            print(f"=== {slot}: {kind} for {day} at {h:02d}:{m:02d} Nepal")
            rc = run(kind, publish_at=at, day=day.isoformat())
            if rc in (0, 2):
                break
        worst = max(worst, 0 if rc == NOTHING else rc)      # an empty slot is not a crash
    return worst


def status():
    s = load_state()
    w = topics.WALKS[s["walk_next"]] if s["walk_next"] < len(topics.WALKS) else None
    q = topics.QUESTIONS[s["question_next"]] if s["question_next"] < len(topics.QUESTIONS) else None
    print(f"next walk     : {f'{w[0]} -> {w[1]}' if w else 'ALL USED - add walks to topics.py'}")
    print(f"next question : {q['title'] if q else 'ALL USED - add questions to topics.py'}")
    ex = explore_state(s)
    print(f"explore queue : {', '.join(t['wikipedia'] for t in ex['queue']) or '(empty)'}")
    print(f"explore done  : {', '.join(ex['done']) or '-'}")
    print(f"made so far   : {len(s['history'])}")
    for h in s["history"][-6:]:
        tag = h.get("youtube_id") or ("HELD" if h.get("uploaded") is False else h.get("error", "?"))
        print(f"  {h['date']}  {h['kind']:8}  {tag:14}  {h['title']}")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # titles carry emoji
    what = sys.argv[1] if len(sys.argv) > 1 else "status"
    if what == "status":
        status()
        sys.exit(0)
    if what == "nightly":
        sys.exit(nightly())
    if what == "research":
        import research
        research.research(dry="--dry" in sys.argv or "--test" in sys.argv)
        sys.exit(0)
    if what not in ("explore", "walk", "question"):
        sys.exit("usage: python run.py explore|walk|question|research|nightly|status [--test]")
    sys.exit(run(what, test="--test" in sys.argv))
