#!/usr/bin/env python3
"""Render the Site Version & Chronological Release Log from data/releases.json.

Injects the rendered blocks between <!--site-releases:start--> and
<!--site-releases:end--> in index.html (featured latest + collapsible earlier
releases) and updates/index.html (full expanded release history).

Usage:
    python3 tools/build-releases.py
"""
from __future__ import annotations

import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "releases.json"
MARKER_RE = re.compile(r"<!--site-releases:start-->[\s\S]*?<!--site-releases:end-->")
FOOTER_VER_RE = re.compile(r"<!--site-version:start-->[\s\S]*?<!--site-version:end-->")


def esc(text: str) -> str:
    return html.escape(str(text), quote=True)


def render_entry(rel: dict, is_latest: bool = False) -> str:
    ver = esc(rel["version"])
    iso = esc(rel["date"])
    dlabel = esc(rel["dateLabel"])
    cat = esc(rel["category"])
    tone = esc(rel.get("tone", "copper"))
    title = esc(rel["title"])
    latest_cls = " is-latest" if is_latest else ""
    latest_badge = '<span class="rel-badge-latest">Latest</span>' if is_latest else ""
    items = "".join(f"<li>{esc(ch)}</li>" for ch in rel["changes"])
    return (
        f'<li class="rel-entry{latest_cls}" data-tone="{tone}" id="release-v{ver.replace(".", "-")}">'
        f'<div class="rel-node" aria-hidden="true"></div>'
        f'<article class="rel-card">'
        f'<div class="rel-meta">'
        f'<span class="rel-ver">v{ver}</span>'
        f'{latest_badge}'
        f'<time class="rel-date" datetime="{iso}">{dlabel}</time>'
        f'<span class="rel-cat">{cat}</span>'
        f'</div>'
        f'<h3 class="rel-title">{title}</h3>'
        f'<ul class="rel-list">{items}</ul>'
        f'</article>'
        f'</li>'
    )


def render_telemetry(data: dict, show_updates_link: bool) -> str:
    cur = esc(data["currentVersion"])
    iso = esc(data["releaseDate"])
    dlabel = esc(data["releaseDateLabel"])
    count = len(data["releases"])
    note = esc(data["scopeNote"])
    action = (
        '<a class="rel-action" href="/updates/#releases">Full release history &rarr;</a>'
        if show_updates_link
        else '<a class="rel-action" href="https://github.com/cssofny2/spheredesci.org/commits/main" rel="noopener">View commit history on GitHub &nearr;</a>'
    )
    return (
        '<div class="rel-telemetry">'
        '<div class="rel-telemetry-main">'
        '<span class="rel-version-chip">'
        '<span class="rel-version-label">Site Version</span>'
        f'<strong class="rel-version-num">v{cur}</strong>'
        '</span>'
        '<div class="rel-telemetry-meta">'
        f'<span>Released <time datetime="{iso}">{dlabel}</time></span>'
        '<span class="rel-dot" aria-hidden="true">&middot;</span>'
        f'<span>{count} documented releases</span>'
        '<span class="rel-dot" aria-hidden="true">&middot;</span>'
        '<span>Newest first</span>'
        '</div>'
        '</div>'
        f'<div class="rel-telemetry-side">{action}</div>'
        f'<p class="rel-scope-note">{note}</p>'
        '</div>'
    )


def render_home_block(data: dict) -> str:
    releases = data["releases"]
    recent = releases[:3]
    older = releases[3:]
    recent_html = "".join(render_entry(r, is_latest=(i == 0)) for i, r in enumerate(recent))
    archive_html = ""
    if older:
        older_items = "".join(render_entry(r, is_latest=False) for r in older)
        oldest_v = esc(older[-1]["version"])
        newest_old_v = esc(older[0]["version"])
        archive_html = (
            '<details class="rel-archive">'
            f'<summary>Show {len(older)} earlier releases '
            f'<span class="rel-archive-range">v{newest_old_v} &ndash; v{oldest_v}</span></summary>'
            f'<ol class="rel-timeline rel-timeline-older">{older_items}</ol>'
            '</details>'
        )
    return (
        "<!--site-releases:start-->\n"
        + render_telemetry(data, show_updates_link=True)
        + f'\n<ol class="rel-timeline" aria-label="Latest site releases (newest first)">{recent_html}</ol>\n'
        + archive_html
        + "\n<!--site-releases:end-->"
    )


def render_updates_block(data: dict) -> str:
    all_html = "".join(render_entry(r, is_latest=(i == 0)) for i, r in enumerate(data["releases"]))
    return (
        "<!--site-releases:start-->\n"
        '<section id="releases" class="updates-releases" aria-labelledby="releases-heading">'
        '<h2 id="releases-heading">Site version &amp; chronological release log</h2>\n'
        + render_telemetry(data, show_updates_link=False)
        + f'\n<ol class="rel-timeline" aria-label="All site releases (newest first)">{all_html}</ol>\n'
        '</section>\n'
        "<!--site-releases:end-->"
    )


def render_footer_pill(data: dict) -> str:
    cur = esc(data["currentVersion"])
    iso = esc(data["releaseDate"])
    return (
        "<!--site-version:start-->"
        f'<span class="footer-version-pill"><a href="/updates/#releases" title="View site release log and latest changes">'
        f'<span>Site v{cur}</span><span aria-hidden="true">&middot;</span><time datetime="{iso}">{esc(data["releaseDateLabel"])}</time>'
        f'</a></span>'
        "<!--site-version:end-->"
    )


def inject(path: pathlib.Path, replacement: str, pattern: re.Pattern[str]) -> bool:
    src = path.read_text(encoding="utf-8")
    if not pattern.search(src):
        return False
    out = pattern.sub(lambda _: replacement, src, count=1)
    if out != src:
        path.write_text(out, encoding="utf-8", newline="\n")
        return True
    return False


def main() -> int:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    home = ROOT / "index.html"
    updates = ROOT / "updates" / "index.html"

    changed = []
    if inject(home, render_home_block(data), MARKER_RE):
        changed.append("index.html (#releases)")
    if inject(home, render_footer_pill(data), FOOTER_VER_RE):
        changed.append("index.html (footer version)")
    if inject(updates, render_updates_block(data), MARKER_RE):
        changed.append("updates/index.html (#releases)")

    print(f"Release log v{data['currentVersion']} synced: {', '.join(changed) if changed else 'already up to date'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
