"""Daily run: one walk video in the morning, one question in the evening.

    python run.py walk          build (and post, once the channel exists) the next route
    python run.py question      same, for the next "your country" question
    python run.py status        what has been made, what is next
    python run.py walk --test   build the next one, post nothing, move nothing on

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
from datetime import datetime
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


def run(kind, test=False):
    import upload_geo
    if test:
        s = load_state()
        pool = topics.WALKS if kind == "walk" else topics.QUESTIONS
        i = s["walk_next" if kind == "walk" else "question_next"] % len(pool)
        if kind == "walk":
            import make_walk
            meta = make_walk.make(*pool[i])
        else:
            import make_question
            meta = make_question.make(pool[i]["id"])
        problem = verify(meta["file"])
        print(f"[test  ] {meta['title']} -> {meta['file']}: {problem or 'looks fine'}")
        return 3 if problem else 0
    if not upload_geo.ready():
        # building now would spend the best topics on videos nobody ever sees
        print("[hold  ] channel not set up yet - nothing built, topic kept for day one "
              "(set EXPECTED in upload_geo.py and run: python upload_geo.py --login)")
        return 2

    s = load_state()
    fails = s.setdefault("fails", {})
    key_next = "walk_next" if kind == "walk" else "question_next"
    pool = topics.WALKS if kind == "walk" else topics.QUESTIONS
    i = s[key_next] % len(pool)
    fkey = f"{kind}:{i}"
    entry = {"date": datetime.now().strftime("%Y-%m-%d %H:%M"), "kind": kind, "title": str(pool[i])}

    def failed(why):
        """Keep the topic for the next run, unless it has now failed twice."""
        fails[fkey] = fails.get(fkey, 0) + 1
        entry["error"] = why
        s["history"].append(entry)
        if fails[fkey] >= 2:
            s[key_next] = i + 1
            print(f"[skip  ] {kind} topic {i} failed twice - moving on")
        save_state(s)
        print(f"[FAIL  ] {why}")
        return 3

    try:
        if kind == "walk":
            import make_walk
            meta = make_walk.make(*pool[i])
        else:
            import make_question
            meta = make_question.make(pool[i]["id"])
    except (Exception, SystemExit) as e:
        traceback.print_exc()
        return failed(f"build: {type(e).__name__}: {str(e)[:160]}")

    entry.update(title=meta["title"], file=meta["file"])
    problem = verify(meta["file"])
    if problem:
        return failed(f"check: {problem} - nothing posted")
    try:
        entry["youtube_id"] = upload_geo.upload(meta["file"], meta, privacy())
        entry["privacy"] = privacy()
    except Exception as e:
        return failed(f"upload: {type(e).__name__}: {str(e)[:160]}")

    fails.pop(fkey, None)
    s[key_next] = i + 1
    s["history"].append(entry)
    save_state(s)
    cleanup()
    return 0


def status():
    s = load_state()
    w = topics.WALKS[s["walk_next"] % len(topics.WALKS)]
    q = topics.QUESTIONS[s["question_next"] % len(topics.QUESTIONS)]
    print(f"next walk     : {w[0]} -> {w[1]}")
    print(f"next question : {q['title']}")
    print(f"made so far   : {len(s['history'])}")
    for h in s["history"][-6:]:
        tag = h.get("youtube_id") or ("HELD" if h.get("uploaded") is False else h.get("error", "?"))
        print(f"  {h['date']}  {h['kind']:8}  {tag:14}  {h['title']}")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "status"
    if what == "status":
        status()
        sys.exit(0)
    if what not in ("walk", "question"):
        sys.exit("usage: python run.py walk|question|status [--test]")
    sys.exit(run(what, test="--test" in sys.argv))
