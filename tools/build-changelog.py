#!/usr/bin/env python3
"""Generate /changelog/ and sync the homepage Site Version & Release Log section.

Source of truth: data/changelog.json

Usage:
    python3 tools/build-changelog.py          # build changelog/index.html and sync index.html
    python3 tools/build-changelog.py --check  # exit non-zero if generated output is stale
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "changelog.json"
INDEX_HTML = ROOT / "index.html"
OUT_HTML = ROOT / "changelog" / "index.html"

HOME_RELEASES_LIMIT = 4
TYPE_LABELS = {
    "added": "Added",
    "changed": "Changed",
    "content": "Content",
    "fixed": "Fixed",
    "security": "Security",
}

_spec = importlib.util.spec_from_file_location("bd", ROOT / "tools" / "build-directory.py")
bd = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bd)
esc, human = bd.esc, bd.human

MARKER_START = "<!--site-changelog:start-->"
MARKER_END = "<!--site-changelog:end-->"
MARKER_RE = re.compile(re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END), re.S)


def version_anchor(version: str) -> str:
    return "v" + re.sub(r"[^a-zA-Z0-9]+", "-", version.strip().lstrip("v")).strip("-").lower()


def load_data() -> dict:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    releases = data.get("releases")
    if not isinstance(releases, list) or not releases:
        raise ValueError("data/changelog.json must contain a non-empty 'releases' array")
    if not data.get("current_version"):
        raise ValueError("data/changelog.json must define 'current_version'")
    return data


def render_change_item(change: dict) -> str:
    ctype = str(change.get("type", "changed")).lower()
    if ctype not in TYPE_LABELS:
        ctype = "changed"
    label = TYPE_LABELS[ctype]
    text = esc(change["text"])
    href = change.get("href")
    link_label = change.get("link_label")
    link_html = ""
    if href and link_label:
        link_html = f' <a class="cl-item-link" href="{esc(href)}">{esc(link_label)} &rarr;</a>'
    return (
        f'<li class="cl-item" data-change-type="{ctype}">'
        f'<span class="cl-type cl-type-{ctype}">{label}</span>'
        f'<span class="cl-item-text">{text}{link_html}</span>'
        f'</li>'
    )


def render_release_item(release: dict, *, is_latest: bool, heading_tag: str, include_id: bool) -> str:
    ver = release["version"].lstrip("v")
    anchor = version_anchor(ver)
    iso_date = release["date"]
    types = sorted({str(c.get("type", "changed")).lower() for c in release["changes"]})
    types_attr = " ".join(types)
    latest_cls = " is-latest" if is_latest else ""
    id_attr = f' id="{anchor}"' if include_id else ""
    latest_badge = '<span class="cl-latest-badge">Latest</span>' if is_latest else ""
    scope_badge = (
        f'<span class="cl-scope-badge">{esc(release["scope"])}</span>'
        if release.get("scope")
        else ""
    )
    items_html = "".join(render_change_item(c) for c in release["changes"])
    summary_html = (
        f'<p class="cl-release-summary">{esc(release["summary"])}</p>'
        if release.get("summary")
        else ""
    )
    return (
        f'<li class="cl-release{latest_cls}"{id_attr} data-version="{esc(ver)}" '
        f'data-date="{esc(iso_date)}" data-types="{esc(types_attr)}">'
        f'<div class="cl-card">'
        f'<div class="cl-card-head">'
        f'<div class="cl-card-tags">'
        f'<span class="cl-ver-pill">v{esc(ver)}</span>'
        f'{latest_badge}{scope_badge}'
        f'</div>'
        f'<time class="cl-date" datetime="{esc(iso_date)}">{human(iso_date)}</time>'
        f'</div>'
        f'<{heading_tag} class="cl-release-title">{esc(release["title"])}</{heading_tag}>'
        f'{summary_html}'
        f'<ul class="cl-items">{items_html}</ul>'
        f'</div></li>'
    )


def build_changelog_page(data: dict) -> str:
    cur_ver = data["current_version"].lstrip("v")
    released = data["released"]
    releases = data["releases"]
    oldest_date = releases[-1]["date"]
    scheme = data.get("scheme", {})
    repo_url = data.get(
        "repository_commits_url",
        "https://github.com/cssofny2/spheredesci.org/commits/main/",
    )

    total_changes = sum(len(r["changes"]) for r in releases)
    rel_dt = bd.datetime.strptime(released[:10], "%Y-%m-%d")
    short_released = f"{rel_dt.strftime('%b')} {rel_dt.day}, {rel_dt.year}"
    summary_grid = (
        '<div class="cl-summary-grid" role="region" aria-label="Current site version summary">'
        f'<div class="cl-stat-card"><span class="cl-stat-label">Current site version</span>'
        f'<span class="cl-stat-val">v{esc(cur_ver)}</span>'
        f'<span class="cl-stat-sub">Semantic website release ({esc(data.get("site", "spheredesci.org"))})</span></div>'
        f'<div class="cl-stat-card"><span class="cl-stat-label">Latest release date</span>'
        f'<span class="cl-stat-val"><time datetime="{esc(released)}">{short_released}</time></span>'
        f'<span class="cl-stat-sub">Latest documented site change</span></div>'
        f'<div class="cl-stat-card"><span class="cl-stat-label">Release history</span>'
        f'<span class="cl-stat-val">{len(releases)} releases</span>'
        f'<span class="cl-stat-sub">{total_changes} itemized changes since <time datetime="{esc(oldest_date)}">{human(oldest_date)}</time></span></div>'
        '</div>'
    )

    integrity_callout = (
        '<div class="vl-callout">'
        f'<strong>Website version notice:</strong> {esc(scheme.get("integrity_note", ""))}'
        '</div>'
    )

    filter_buttons = ['<button type="button" class="cl-btn" data-cl-filter="all" aria-pressed="true">All</button>']
    for key, label in TYPE_LABELS.items():
        filter_buttons.append(
            f'<button type="button" class="cl-btn" data-cl-filter="{key}" aria-pressed="false">{label}</button>'
        )

    controls = (
        '<div class="cl-controls" id="cl-controls" role="region" aria-label="Changelog display controls">'
        '<div class="cl-ctrl-group" role="group" aria-label="Chronological order">'
        '<span class="cl-ctrl-label">Order</span>'
        '<button type="button" class="cl-btn" data-cl-order="desc" aria-pressed="true">Newest first</button>'
        '<button type="button" class="cl-btn" data-cl-order="asc" aria-pressed="false">Oldest first</button>'
        '</div>'
        '<div class="cl-ctrl-group" role="group" aria-label="Filter by change type">'
        '<span class="cl-ctrl-label">Filter</span>'
        + "".join(filter_buttons)
        + '</div>'
        f'<span class="cl-count" id="cl-count" aria-live="polite">Showing {len(releases)} of {len(releases)} releases</span>'
        '</div>'
    )

    release_items = "".join(
        render_release_item(r, is_latest=(i == 0), heading_tag="h2", include_id=True)
        for i, r in enumerate(releases)
    )

    timeline_section = (
        '<section aria-labelledby="release-history">'
        '<h2 id="release-history">Chronological release history</h2>'
        f'{controls}'
        f'<ol class="cl-list" id="changelog-list">{release_items}</ol>'
        '<p class="cl-empty" id="cl-empty" hidden>No releases match the selected filter.</p>'
        '</section>'
    )

    policy_section = (
        '<section aria-labelledby="versioning-policy">'
        '<h2 id="versioning-policy">Versioning policy &amp; source record</h2>'
        f'<p>{esc(scheme.get("summary", ""))}</p>'
        '<ul>'
        '<li><strong>MAJOR</strong> &mdash; landmark public milestones for the website platform (for example, v1.0.0 marked the MDX research publication platform launch alongside live Protocol LOC-1 registration).</li>'
        '<li><strong>MINOR</strong> &mdash; new site sections, major navigation or visual upgrades, new research/Learn clusters, or security architecture additions.</li>'
        '<li><strong>PATCH</strong> &mdash; targeted wording corrections, bug fixes, metadata updates, or maintenance releases.</li>'
        '</ul>'
        f'<p>For commit-level diffs, see the <a href="{esc(repo_url)}" rel="noopener">GitHub commit history</a>. '
        'For research milestones and the experimental roadmap, see <a href="/updates/">Project updates</a>.</p>'
        '</section>'
    )

    body = summary_grid + integrity_callout + timeline_section + policy_section

    toc = [("release-history", "Release history")] + [
        (version_anchor(r["version"]), f'v{r["version"].lstrip("v")} &middot; {r["date"]}')
        for r in releases
    ] + [("versioning-policy", "Versioning policy")]

    extra_script = """<script>
(() => {
  const list = document.getElementById('changelog-list');
  const countEl = document.getElementById('cl-count');
  const emptyEl = document.getElementById('cl-empty');
  if (!list) return;
  const items = Array.from(list.querySelectorAll(':scope > li.cl-release'));
  const total = items.length;
  let order = 'desc';
  let filter = 'all';

  const apply = () => {
    const ordered = order === 'desc' ? items : [...items].reverse();
    let shown = 0;
    ordered.forEach((li) => {
      const types = (li.dataset.types || '').split(/\\s+/).filter(Boolean);
      const match = filter === 'all' || types.includes(filter);
      li.hidden = !match;
      if (match) {
        shown += 1;
        li.querySelectorAll('li.cl-item').forEach((row) => {
          row.hidden = filter !== 'all' && row.dataset.changeType !== filter;
        });
      }
      list.appendChild(li);
    });
    if (countEl) countEl.textContent = `Showing ${shown} of ${total} releases`;
    if (emptyEl) emptyEl.hidden = shown > 0;
  };

  document.querySelectorAll('[data-cl-order]').forEach((btn) => {
    btn.addEventListener('click', () => {
      order = btn.dataset.clOrder === 'asc' ? 'asc' : 'desc';
      document.querySelectorAll('[data-cl-order]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      apply();
    });
  });

  document.querySelectorAll('[data-cl-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.clFilter || 'all';
      document.querySelectorAll('[data-cl-filter]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      apply();
    });
  });
})();
</script>"""

    return bd.page(
        "/changelog/",
        f"Site Version v{cur_ver} & Release Changelog",
        f"Current website version v{cur_ver} and chronological release history for spheredesci.org, documenting UI, research library, and security updates.",
        f"Site Version v{cur_ver} & Release Changelog",
        "Every public release of spheredesci.org in chronological order, showing the current site version number and what changed in each update.",
        body,
        toc,
        eyebrow="Governance / Site releases",
        parent=[("Project updates", "/updates/")],
        navkey="changelog",
        added=released,
        updated=released,
        crumb="Site changelog",
        extra_ld={"version": f"v{cur_ver}"},
        extra_script=extra_script,
    )


def build_homepage_section(data: dict) -> str:
    cur_ver = data["current_version"].lstrip("v")
    released = data["released"]
    releases = data["releases"]
    latest = releases[0]
    recent = releases[:HOME_RELEASES_LIMIT]
    repo_url = data.get(
        "repository_commits_url",
        "https://github.com/cssofny2/spheredesci.org/commits/main/",
    )

    recent_html = "".join(
        render_release_item(r, is_latest=(i == 0), heading_tag="h3", include_id=False)
        for i, r in enumerate(recent)
    )

    return (
        f'{MARKER_START}\n'
        '    <!-- Chapter 08: Site Version & Chronological Release Log -->\n'
        '    <section id="changelog" class="home-band band-deep">\n'
        '        <div class="band-inner">\n'
        '            <header class="chapter-head" data-tone="cyan">\n'
        '                <div class="chapter-emblem"><svg class="ni" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="/assets/nav-icons.svg#ni-changelog"/></svg></div>\n'
        '                <div class="chapter-copy">\n'
        '                    <p class="chapter-kicker">08 &middot; Site Version &amp; Release Log</p>\n'
        '                    <h2 class="chapter-title">Latest changes to spheredesci.org</h2>\n'
        '                    <p class="chapter-lead">Every public website release is versioned and logged chronologically so visitors can see exactly what changed. Website versions track site releases only&mdash;not experimental measurements or protocol amendments.</p>\n'
        '                </div>\n'
        '            </header>\n'
        '\n'
        '            <div class="cl-banner" role="region" aria-label="Current website version">\n'
        '                <div class="cl-banner-ver">\n'
        '                    <div class="cl-ver-stamp">\n'
        '                        <span class="cl-ver-stamp-label">Site Version</span>\n'
        f'                        <span class="cl-ver-stamp-num">v{esc(cur_ver)}</span>\n'
        '                    </div>\n'
        '                    <div class="cl-banner-copy">\n'
        f'                        <p class="cl-banner-title">{esc(latest["title"])}</p>\n'
        f'                        <p class="cl-banner-meta">Released <time datetime="{esc(released)}">{human(released)}</time> &middot; {len(releases)} documented releases in chronological order</p>\n'
        '                    </div>\n'
        '                </div>\n'
        '                <div class="cl-banner-actions">\n'
        '                    <a class="hero-btn hero-btn-ghost" href="/changelog/">Full release history <span aria-hidden="true">&rarr;</span></a>\n'
        '                </div>\n'
        '            </div>\n'
        '\n'
        f'            <ol class="cl-list" aria-label="Latest website changes in chronological order">{recent_html}</ol>\n'
        '\n'
        '            <div class="cl-foot-bar">\n'
        f'                <span>Showing the latest {len(recent)} of {len(releases)} website releases (newest first).</span>\n'
        f'                <span><a href="/changelog/">Browse all {len(releases)} releases</a> &middot; <a href="/updates/">Project roadmap</a> &middot; <a href="{esc(repo_url)}" rel="noopener">GitHub commits</a></span>\n'
        '            </div>\n'
        '        </div>\n'
        '    </section>\n'
        f'    {MARKER_END}'
    )


def main() -> int:
    check = "--check" in sys.argv
    data = load_data()
    changed = 0

    changelog_html = build_changelog_page(data)
    existing_cl = OUT_HTML.read_text(encoding="utf-8") if OUT_HTML.exists() else ""
    if existing_cl != changelog_html:
        changed += 1
        if not check:
            OUT_HTML.parent.mkdir(parents=True, exist_ok=True)
            OUT_HTML.write_text(changelog_html, encoding="utf-8", newline="\n")
            print("wrote", OUT_HTML.relative_to(ROOT))

    index_before = INDEX_HTML.read_text(encoding="utf-8")
    if MARKER_START not in index_before or MARKER_END not in index_before:
        raise RuntimeError(
            f"index.html is missing {MARKER_START} ... {MARKER_END} markers for the changelog section"
        )
    home_section = build_homepage_section(data)
    index_after = MARKER_RE.sub(lambda _: home_section, index_before, count=1)
    if index_after != index_before:
        changed += 1
        if not check:
            INDEX_HTML.write_text(index_after, encoding="utf-8", newline="\n")
            print("updated", INDEX_HTML.relative_to(ROOT))

    if check and changed:
        print(f"Changelog output is stale ({changed} file(s) out of date).", file=sys.stderr)
        return 1
    if not changed:
        print("Changelog pages already up to date.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
