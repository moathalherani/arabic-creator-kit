#!/usr/bin/env python3
"""Turn a reel design (JSON) into a Motion Studio link that opens with the scenes ready.

Usage:
  python3 make_link.py design.json
  echo '{"scenes":[...]}' | python3 make_link.py

The design looks like:
  {"scenes": [{"template": "hook", "text": "...", "keyword": "..."}, {"template": "follow"}],
   "style": {"format": "vertical", "background": "grid-dark", "accent": "#C6F432", "fontAr": "Cairo"}}
"""
import base64
import json
import sys

STUDIO = "https://moathalherani.github.io/arabic-creator-kit/motion/"
# template id -> its text fields (kept in sync by scripts/build-site.js)
# templates:start
TEMPLATES = {
    "audio": ["label", "caption"],
    "beforeafter": ["beforeLabel", "afterLabel"],
    "chart": ["title", "bars"],
    "chat": ["name", "question", "answer"],
    "compare": ["a", "b", "rows"],
    "editor": ["title", "sfx", "caption"],
    "follow": ["name", "handle", "cta"],
    "hook": ["text", "keyword"],
    "notification": ["title", "items"],
    "number": ["label", "number", "suffix"],
    "phone": ["caption", "badge"],
    "price": ["label", "price", "currency", "old"],
    "quote": ["quote", "author"],
    "ranking": ["title", "items"],
    "steps": ["title", "steps"],
    "title": ["kicker", "title", "sub"],
    "versus": ["problem", "solution"],
    "window": ["title", "caption"],
}
# templates:end
STYLE_KEYS = {"format", "background", "fontAr", "fontEn", "accent", "ink", "bg", "card", "danger", "capStyle"}


def build(design):
    scenes = design["scenes"] if isinstance(design, dict) else design
    out, problems = [], []
    for i, scene in enumerate(scenes[:12]):
        tid = str(scene.get("template", "")).strip().lower()
        if tid not in TEMPLATES:
            problems.append(f"scene {i + 1}: unknown template '{tid}' (use one of: {', '.join(TEMPLATES)})")
            continue
        props = {}
        for key in TEMPLATES[tid]:
            value = scene.get(key)
            if isinstance(value, list):
                value = "\n".join(" | ".join(map(str, v)) if isinstance(v, list) else str(v) for v in value)
            if isinstance(value, (int, float)):
                value = str(value)
            if isinstance(value, str):
                props[key] = value[:600]
        entry = {"id": tid, "st": float(scene.get("start", 0) or 0), "p": props}
        out.append(entry)
    if not out:
        raise SystemExit("No usable scenes. " + " ".join(problems))
    style = {k: str(v) for k, v in (design.get("style") or {}).items() if k in STYLE_KEYS} if isinstance(design, dict) else {}
    data = json.dumps({"v": 1, "s": style, "sc": out}, ensure_ascii=False, separators=(",", ":"))
    code = base64.urlsafe_b64encode(data.encode("utf-8")).decode("ascii").rstrip("=")
    return f"{STUDIO}#d={code}", problems


def main():
    raw = open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1 else sys.stdin.read()
    url, problems = build(json.loads(raw))
    for p in problems:
        print("warning:", p, file=sys.stderr)
    print(url)


if __name__ == "__main__":
    main()
