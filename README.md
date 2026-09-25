# Atlas On Foot

The code behind the **Atlas On Foot** YouTube channel: "Can you walk from X to Y?"
journeys and map questions, drawn from real borders on NASA satellite imagery.

**All rights reserved.** This repository is public so it can be seen, not used.
See [LICENSE](LICENSE). To ask for permission, open an issue titled
"Permission request".

## How it runs

GitHub Actions ([post.yml](.github/workflows/post.yml)) builds and posts two
Shorts a day: a walk around 05:23 UTC and a map question around 13:23 UTC,
each with two backup triggers in case GitHub skips one. It needs two
repository secrets:

- `GEMINI_API_KEY` - writes the walk narration (checked against computed facts)
- `YT_TOKEN_JSON` - the YouTube login, made once with `python upload_geo.py --login`

Until `YT_TOKEN_JSON` exists, scheduled runs build nothing and wait.
