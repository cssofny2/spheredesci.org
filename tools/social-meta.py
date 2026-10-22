#!/usr/bin/env python3
"""Social sharing meta generator. Idempotent and build-time only.

For every public page it guarantees og:type, og:site_name, og:title, og:description, og:url,
og:image (+ size and alt) and the Twitter Card tags. Existing values are never overwritten;
missing ones are derived from <title>, the meta description and the canonical URL, and the
brand image is the fallback so every route has a share preview.

Library use:  from social_meta import social_tags
Command line: python3 tools/social-meta.py [--check]
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://spheredesci.org"
DEFAULT_IMAGE = SITE + "/assets/brand/og-image.png?v=2"
DEFAULT_ALT = "Project S.P.H.E.R.E. copper sphere resonance research"
SKIP_DIRS = {"node_modules", "data", "worker", "tools", "content", "migrations", "admin", "analytics"}


def social_tags(title, description, url, image=DEFAULT_IMAGE, og_type="website", alt=DEFAULT_ALT):
    """Return {meta key: (attribute, content)} for a full Open Graph + Twitter Card set."""
    e = lambda s: html.escape(html.unescape(s), quote=True)
    tags = {
        "og:type": ("property", og_type),
        "og:site_name": ("property", "Project S.P.H.E.R.E."),
        "og:title": ("property", e(title)),
        "og:description": ("property", e(description)),
        "og:url": ("property", url),
        "og:image": ("property", image),
        "og:image:width": ("property", "1200"),
        "og:image:height": ("property", "630"),
        "og:image:alt": ("property", e(alt)),
        "twitter:card": ("name", "summary_large_image"),
        "twitter:title": ("name", e(title)),
        "twitter:description": ("name", e(description)),
        "twitter:image": ("name", image),
        "twitter:image:alt": ("name", e(alt)),
    }
    return tags


def has_meta(page, key):
    return re.search(r'<meta\s+(?:property|name)="%s"' % re.escape(key), page) is not None


def get_meta(page, key):
    m = re.search(r'<meta\s+(?:property|name)="%s"\s+content="([^"]*)"' % re.escape(key), page)
    return m.group(1) if m else None


def process(path):
    page = path.read_text(encoding="utf-8")
    original = page
    title = re.search(r"<title>(.*?)</title>", page, re.S)
    desc = get_meta(page, "description")
    canonical = re.search(r'<link rel="canonical" href="([^"]+)"', page)
    if not (title and desc and canonical):
        return False
    og_title = get_meta(page, "og:title") or title.group(1).strip()
    og_desc = get_meta(page, "og:description") or desc
    og_image = get_meta(page, "og:image") or DEFAULT_IMAGE
    og_alt = get_meta(page, "og:image:alt") or DEFAULT_ALT
    og_type = get_meta(page, "og:type") or "website"
    tags = social_tags(og_title, og_desc, canonical.group(1), og_image, og_type, og_alt)
    # twitter tags should mirror the page's own og values, not the generic fallbacks
    missing = "".join(
        '<meta %s="%s" content="%s">' % (attr, key, value)
        for key, (attr, value) in tags.items() if not has_meta(page, key)
    )
    if missing:
        page = page.replace("</head>", missing + "</head>", 1)
    if page != original:
        if "--check" not in sys.argv:
            path.write_text(page, encoding="utf-8", newline="")
        return True
    return False


def main():
    changed = 0
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if rel.parts[0].startswith(".") or rel.parts[0] in SKIP_DIRS or rel.name == "panton.html":
            continue
        changed += process(path)
    print(("Would update" if "--check" in sys.argv else "Updated"), changed, "pages")
    if "--check" in sys.argv and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
