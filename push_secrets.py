"""Copy the two secrets the cloud needs from this laptop to GitHub, without
printing them.

    python push_secrets.py

Needs token_geo.json (made by `python upload_geo.py --login`), the
GEMINI_API_KEY environment variable, and the GitHub CLI signed in as the
repository owner. Values go straight from here into GitHub's encrypted secrets.
"""
import os
import subprocess
import sys
from pathlib import Path

REPO = "sumeetm10/geo-shorts"
TOKEN = Path(__file__).resolve().parent / "token_geo.json"


def put(name, value):
    r = subprocess.run(["gh", "secret", "set", name, "-R", REPO], input=value,
                       text=True, capture_output=True)
    print(f"[secret] {name}: " + ("saved" if r.returncode == 0
                                  else "FAILED " + (r.stderr or "").strip()[:200]))
    return r.returncode == 0


def main():
    if not TOKEN.exists():
        sys.exit("token_geo.json not found - first run: python upload_geo.py --login")
    raw = TOKEN.read_text(encoding="utf-8", errors="ignore").strip()
    if not raw.startswith("{"):
        sys.exit("token_geo.json is in the old format - run: python upload_geo.py --login")
    ok = put("YT_TOKEN_JSON", raw)
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key:
        ok = put("GEMINI_API_KEY", key) and ok
    else:
        print("[secret] GEMINI_API_KEY: not set on this computer - skipped")
        ok = False
    print("done - the next scheduled run will post" if ok else "some secrets are missing")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
