"""Gemini helpers: model fallback chain, JSON + text calls.

Copied from doodle-engine/src/llm.py (same author) so this repository runs on its
own. The key comes from the GEMINI_API_KEY environment variable - a user
variable on the laptop, a repository secret on GitHub. It is never in the code.
"""
import json
import os
import time

from google import genai
from google.genai import types
from google.genai.errors import APIError, ServerError


def _strip_fences(text):
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


MODELS = {"model": "gemini-3.6-flash",
          "fallback_models": ["gemini-3.5-flash-lite", "gemini-flash-latest"]}


def config():
    return {"gemini_api_key": os.environ.get("GEMINI_API_KEY", ""), "gemini": MODELS}


def client_models(cfg):
    """Build a Gemini client + ordered model list from config."""
    if not cfg["gemini_api_key"]:
        raise RuntimeError("GEMINI_API_KEY is not set")
    client = genai.Client(api_key=cfg["gemini_api_key"])
    gem_cfg = cfg.get("gemini") or {}
    primary = gem_cfg.get("model", "gemini-2.5-flash")
    fallbacks = gem_cfg.get("fallback_models",
                            ["gemini-2.5-flash-lite", "gemini-flash-latest"])
    return client, [primary] + [m for m in fallbacks if m != primary]


def _run(client, models_to_try, prompt, config):
    last_err = None
    for model_name in models_to_try:
        for attempt in range(3):
            try:
                resp = client.models.generate_content(
                    model=model_name, contents=prompt, config=config,
                )
                return resp.text or ""
            except ServerError as e:
                last_err = e
                code = getattr(e, "code", None)
                if code in (503, 429, 500):
                    wait = 10 * (2 ** attempt)  # 10s, 20s, 40s
                    print(f"      [retry] {model_name} {code}; waiting {wait}s")
                    time.sleep(wait)
                    continue
                raise
            except APIError as e:
                last_err = e
                print(f"      [warn] {model_name} APIError: {e}; trying next model")
                break
    raise last_err if last_err else RuntimeError("Gemini generation failed")


def run_json(cfg, prompt, temperature=0.8):
    client, models = client_models(cfg)
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=temperature,
    )
    return json.loads(_strip_fences(_run(client, models, prompt, config)))


def run_text(cfg, prompt, temperature=0.9):
    client, models = client_models(cfg)
    config = types.GenerateContentConfig(temperature=temperature)
    return _run(client, models, prompt, config).strip()
