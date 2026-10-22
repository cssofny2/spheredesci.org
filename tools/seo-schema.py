#!/usr/bin/env python3
"""Idempotent SEO post-processor for the static pages (build-time only, zero runtime cost).

For every public HTML page it:
  * guarantees a shared Organization node and a WebSite node (publisher + SearchAction)
    in the page's JSON-LD graph;
  * fills in missing twitter:title / twitter:description / twitter:image from the Open Graph tags.

Run it after the page generators:  python3 tools/seo-schema.py   (use --check to only report)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://spheredesci.org"
SKIP_DIRS = {"node_modules", "data", "worker", "tools", "content", "migrations", "admin"}

ORG = {
    "@type": "Organization",
    "@id": SITE + "/#organization",
    "name": "Project S.P.H.E.R.E.",
    "alternateName": "Spatial Positioning Harmonic Empirical Resonance Experiment",
    "url": SITE + "/",
    "logo": {"@type": "ImageObject", "url": SITE + "/assets/brand/sphere-icon-512.png", "width": 512, "height": 512},
    "email": "contact@spheredesci.org",
    "sameAs": ["https://github.com/cssofny2/spheredesci.org", "https://michaelpgoodman.com/", "https://fieldsofgreenrochester.com/"],
}
SEARCH = {
    "@type": "SearchAction",
    "target": {"@type": "EntryPoint", "urlTemplate": SITE + "/search/?q={search_term_string}"},
    "query-input": "required name=search_term_string",
}
LD_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)


def patch_graph(data):
    graph = data.get("@graph") if isinstance(data, dict) else None
    if graph is None:
        return False
    site = next((n for n in graph if n.get("@id") == SITE + "/#website"), None)
    if site is None:
        return False
    before = json.dumps(data, sort_keys=True)
    org = next((n for n in graph if n.get("@id") == ORG["@id"]), None)
    if org is None:
        graph.insert(graph.index(site), dict(ORG))
    else:
        for key, value in ORG.items():
            org[key] = value
    site["publisher"] = {"@id": ORG["@id"]}
    site["inLanguage"] = "en"
    site["potentialAction"] = SEARCH
    return json.dumps(data, sort_keys=True) != before


def meta_content(html, attr, name):
    m = re.search(r'<meta\s+%s="%s"\s+content="([^"]*)"' % (attr, re.escape(name)), html)
    return m.group(1) if m else None


def add_twitter(html):
    missing = []
    for tw, og in (("twitter:title", "og:title"), ("twitter:description", "og:description"), ("twitter:image", "og:image")):
        if meta_content(html, "name", tw) is None:
            value = meta_content(html, "property", og)
            if value:
                missing.append('<meta name="%s" content="%s">' % (tw, value))
    if not missing:
        return html
    anchor = re.search(r'<meta\s+name="twitter:card"[^>]*>', html)
    if not anchor:
        return html
    return html[: anchor.end()] + "".join(missing) + html[anchor.end():]


def process(path):
    html = path.read_text(encoding="utf-8")
    original = html

    def repl(m):
        try:
            data = json.loads(m.group(2))
        except ValueError:
            return m.group(0)
        if not patch_graph(data):
            return m.group(0)
        return m.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + m.group(3)

    html = LD_RE.sub(repl, html)
    html = add_twitter(html)
    if html != original:
        if "--check" not in sys.argv:
            path.write_text(html, encoding="utf-8", newline="")
        return True
    return False


def main():
    changed = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if rel.parts[0].startswith(".") or rel.parts[0] in SKIP_DIRS or rel.name == "panton.html":
            continue
        if process(path):
            changed.append(str(rel))
    print(("Would update" if "--check" in sys.argv else "Updated"), len(changed), "pages")
    if "--check" in sys.argv and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
