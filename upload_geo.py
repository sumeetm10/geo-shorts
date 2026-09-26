"""Upload to the geo channel — and only that channel.

The token lives here as token_geo.json, separate from every other channel's.
That separation is deliberate: a video was once uploaded to the wrong channel
because a single cached token was reused, and the scope we hold can upload but
cannot delete. Every upload checks the channel name first.

    python upload_geo.py --login     sign in once, pick the geo channel
    python upload_geo.py --whoami    which channel this token posts to

On GitHub the token comes from the YT_TOKEN_JSON secret instead of the file: the
contents of token_geo.json after --login. It never goes in the repository.
"""
import argparse
import json
import os
import pickle
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

ROOT = Path(__file__).resolve().parent
DOODLE = ROOT.parent / "doodle-engine"
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]
CLIENT_SECRET = ROOT / "client_secret.json"
TOKEN = ROOT / "token_geo.json"

# Set this to the channel's exact name once it exists. Until then nothing uploads.
EXPECTED = "AtlasOnFoot"       # renamed from DidUknow (@DidUknow100) on 2026-09-24


def _load_token():
    """The saved login: the YT_TOKEN_JSON secret on GitHub, else token_geo.json."""
    env = os.environ.get("YT_TOKEN_JSON", "").strip()
    if env:
        return Credentials.from_authorized_user_info(json.loads(env), SCOPES), False
    if not TOKEN.exists():
        return None, True
    raw = TOKEN.read_bytes()
    if raw[:1] == b"{":
        return Credentials.from_authorized_user_info(json.loads(raw), SCOPES), True
    return pickle.loads(raw), True            # older pickled token, rewritten as JSON below


def _credentials():
    creds, local = _load_token()
    if creds and creds.valid:
        return creds
    if creds and creds.refresh_token:
        creds.refresh(Request())
    else:
        if not local:
            raise RuntimeError("YT_TOKEN_JSON cannot be refreshed - run --login again")
        if not CLIENT_SECRET.exists():
            src = DOODLE / "client_secret.json"
            if not src.exists():
                sys.exit(f"client_secret.json not found at {CLIENT_SECRET}")
            CLIENT_SECRET.write_bytes(src.read_bytes())
            print(f"[auth] copied OAuth client from {src}")
        flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
        creds = flow.run_local_server(port=0, access_type="offline",
                                      prompt="select_account consent")
    if local:
        TOKEN.write_text(creds.to_json(), encoding="utf-8")
    return creds


def whoami():
    yt = build("youtube", "v3", credentials=_credentials())
    items = yt.channels().list(part="snippet,statistics", mine=True).execute().get("items") or []
    if not items:
        return None
    c = items[0]
    return {"title": c["snippet"]["title"], "id": c["id"],
            "handle": c["snippet"].get("customUrl", "(no handle)"),
            "videos": c["statistics"].get("videoCount", "?"),
            "subs": c["statistics"].get("subscriberCount", "?")}


def _norm(name):
    """'Atlas On Foot' and 'AtlasOnFoot' are the same channel; case and spaces are not."""
    return "".join(ch for ch in name.lower() if ch.isalnum())


def ready():
    """Posting switches itself on once the channel exists and is signed in."""
    has_token = TOKEN.exists() or bool(os.environ.get("YT_TOKEN_JSON", "").strip())
    return has_token and EXPECTED.strip().lower() != "change me"


def assert_correct_channel():
    who = whoami()
    if not who:
        raise RuntimeError("token resolves to no channel")
    if _norm(EXPECTED) not in _norm(who["title"]):
        raise RuntimeError(f"token points at '{who['title']}' ({who['handle']}), expected "
                           f"'{EXPECTED}'. Re-run: python upload_geo.py --login")
    return who


def _clamp_tags(tags, budget=460):
    out, used = [], 0
    for t in tags or []:
        t = str(t).strip()
        if not t:
            continue
        cost = len(t) + (2 if " " in t else 0) + 1
        if used + cost > budget:
            break
        out.append(t)
        used += cost
    return out


def _clean(text):
    """YouTube rejects a title or description containing < or > (HTTP 400,
    'invalid video description') - a route line 'India > China' cost a day."""
    return str(text).replace("<", "").replace(">", "→")


def upload(path, meta, privacy="public", publish_at=None):
    """publish_at (aware UTC datetime): upload now as private and let YouTube
    make it public at exactly that minute. GitHub's timer ran 4.5 hours late
    on 2026-09-26; YouTube's does not."""
    meta = dict(meta, title=_clean(meta["title"]), description=_clean(meta["description"]))
    who = assert_correct_channel()
    print(f"[upload] target channel: {who['title']} ({who['handle']})")
    yt = build("youtube", "v3", credentials=_credentials())
    body = {
        "snippet": {
            "title": meta["title"][:100],
            "description": meta["description"][:5000],
            "tags": _clamp_tags(meta.get("tags")),
            "categoryId": "27",           # Education
            "defaultLanguage": "en",
            "defaultAudioLanguage": "en",
        },
        "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
    }
    if publish_at is not None:
        import datetime as _dt
        if publish_at > _dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(minutes=5):
            body["status"].update(privacyStatus="private",
                                  publishAt=publish_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"))
            print(f"[upload] scheduled for {publish_at:%Y-%m-%d %H:%M} UTC")
    req = yt.videos().insert(part="snippet,status", body=body,
                             media_body=MediaFileUpload(str(path), chunksize=-1, resumable=True,
                                                        mimetype="video/mp4"))
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    print(f"[upload] {meta['title']} -> https://youtu.be/{resp['id']}")
    return resp["id"]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--login", action="store_true")
    ap.add_argument("--whoami", action="store_true")
    a = ap.parse_args()
    if a.whoami:
        w = whoami()
        if not w:
            sys.exit("token resolves to no channel")
        print(f"  channel : {w['title']}\n  handle  : {w['handle']}\n  videos  : {w['videos']}")
        print(f"  {'MATCH' if _norm(EXPECTED) in _norm(w['title']) else 'WRONG CHANNEL'}"
              f" (expected '{EXPECTED}')")
    elif a.login:
        if TOKEN.exists():
            TOKEN.unlink()
        _credentials()
        print(f"[auth] token written to {TOKEN}. Make sure you picked the GEO channel.")
        w = whoami()
        print(f"[auth] this token posts to: {w['title'] if w else '(no channel)'}")
        print("[auth] next: python push_secrets.py   (copies it to GitHub for the daily runs)")
    else:
        ap.print_help()
