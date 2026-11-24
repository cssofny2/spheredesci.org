#!/usr/bin/env python3
"""Synchronize <nav class="site-nav">...</nav> across all static HTML pages from tools/nav_spec.py.

Preserves all page metadata, scripts, main content, and footers untouched while
setting the exact active route and section indicator for each page.
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

from nav_spec import nav_key_for_relpath, render_nav  # noqa: E402

SKIP_DIRS = {"node_modules", ".git", ".github", ".wrangler", "tools", "data", "content", "worker", "migrations"}
SKIP_FILES = {"panton.html"}
NAV_RE = re.compile(r'<nav class="site-nav"[\s\S]*?</nav>')


def main() -> int:
    updated = 0
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if any(part in SKIP_DIRS for part in rel.parts) or rel.name in SKIP_FILES:
            continue
        html = path.read_text(encoding="utf-8")
        if '<nav class="site-nav"' not in html:
            continue
        key = nav_key_for_relpath(rel.as_posix())
        new_nav = render_nav(key, include_skip=False)
        new_html, count = NAV_RE.subn(lambda _: new_nav, html, count=1)
        if count and new_html != html:
            path.write_text(new_html, encoding="utf-8", newline="\n")
            updated += 1
    print(f"Synced navigation across {updated} HTML file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
