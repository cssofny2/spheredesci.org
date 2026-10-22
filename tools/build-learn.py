#!/usr/bin/env python3
"""Build /learn/ (hub + explainer pages) from tools/learn_pages.py.

Nav and footer are copied from an existing article page so they stay in sync.
Run from the repository root: python3 tools/build-learn.py
"""
import html, json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
from learn_pages import HANDWRITTEN_HUB_PAGES, HUB, PAGES  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATE = "2026-10-14"
DATE_LONG = "October 14, 2026"
SITE = "https://spheredesci.org"
TEMPLATE = os.path.join(ROOT, "research", "frequency-measurement-error-budget", "index.html")

tpl = open(TEMPLATE, encoding="utf-8").read()
NAV = re.search(r'<nav class="site-nav".*?</nav>', tpl, re.S).group(0)
NAV = NAV.replace(' aria-current="page"', "")
NAV = NAV.replace('<a href="/learn/">Learn</a>', '<a href="/learn/" aria-current="page">Learn</a>')
FOOT = re.search(r'<footer class="site-footer">.*?</footer>', tpl, re.S).group(0)
by_slug = {p["slug"]: p for p in PAGES}
e = html.escape


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def head(title, desc, url, kind, crumbs):
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Project S.P.H.E.R.E."},
        {"@type": "Article" if kind == "article" else "CollectionPage", "@id": url + "#webpage", "url": url,
         "headline": title if kind == "article" else None, "name": title, "description": desc,
         "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en",
         "author": {"@type": "Organization", "name": "Project S.P.H.E.R.E."},
         "publisher": {"@type": "Organization", "name": "Project S.P.H.E.R.E.", "url": SITE + "/"},
         "image": SITE + "/assets/brand/og-image.png?v=2",
         "datePublished": DATE, "dateModified": DATE},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]},
    ]}
    ld["@graph"][1] = {k: v for k, v in ld["@graph"][1].items() if v is not None}
    t, d = e(title, quote=True), e(desc, quote=True)
    return f'''<!DOCTYPE html><html lang="en" class="scroll-smooth"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title><meta name="description" content="{d}">
<meta name="robots" content="index, follow, max-image-preview:large"><meta name="theme-color" content="#05070a"><link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="{'article' if kind == 'article' else 'website'}"><meta property="og:site_name" content="Project S.P.H.E.R.E.">
<meta property="og:title" content="{t}"><meta property="og:description" content="{d}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/assets/brand/og-image.png?v=2">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="article:published_time" content="{DATE}"><meta property="article:modified_time" content="{DATE}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}"><meta name="twitter:image" content="{SITE}/assets/brand/og-image.png?v=2">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<link href="/assets/tailwind.css" rel="stylesheet"><link href="/assets/site.css" rel="stylesheet">
<script src="/assets/site.js" defer></script><script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head><body><a class="skip-link" href="#main-content">Skip to content</a>
{NAV}<main id="main-content" class="content-shell">
'''


NOTE = ('<div class="note"><strong>Status: educational explainer.</strong> This page reports no experiment results. '
        'Project S.P.H.E.R.E. is at the proposal stage, hypotheses are not findings, and nothing here amends the draft '
        '<a href="/protocol/">LOC-1 protocol</a>.</div>')


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8", newline="\n").write(content)


def build_article(p):
    url = f"{SITE}/learn/{p['slug']}/"
    crumbs = [("Home", SITE + "/"), ("Learn", SITE + "/learn/"), (p["h1"], url)]
    toc = "".join(f'<a href="#{slugify(h)}">{e(h)}</a>' for h, _ in p["sections"])
    body = "".join(f'<h2 id="{slugify(h)}">{e(h)}</h2>{b}' for h, b in p["sections"])
    rel = "".join(f'<li><a href="/learn/{s}/">{e(by_slug[s]["h1"])}</a></li>' for s in p["related"])
    out = head(p["title"], p["desc"], url, "article", crumbs)
    out += (f'<div class="breadcrumbs"><a href="/">Home</a> / <a href="/learn/">Learn</a> / {e(p["h1"])}</div>\n'
            f'<div class="eyebrow">{e(p["eyebrow"])}</div><h1 class="page-title">{e(p["h1"])}</h1>\n'
            f'<p class="page-lede">{e(p["lede"])}</p><p class="page-meta">Added <time datetime="{DATE}">{DATE_LONG}</time> &middot; Educational explainer</p>\n'
            f'<div class="article-layout"><article class="article-body">{NOTE}\n{body}\n'
            f'<h2 id="keep-learning">Keep learning</h2><ul>{rel}<li><a href="/learn/">All learning guides</a></li>'
            f'<li><a href="/protocol/">Current draft LOC-1 protocol</a></li><li><a href="/faq/">Frequently asked questions</a></li></ul></article>\n'
            f'<aside class="article-aside" aria-label="On this page"><h2>On this page</h2>{toc}<a href="#keep-learning">Keep learning</a></aside></div></main>{FOOT}</body></html>\n')
    write(os.path.join(ROOT, "learn", p["slug"], "index.html"), out)


def build_hub():
    url = SITE + "/learn/"
    crumbs = [("Home", SITE + "/"), ("Learn", url)]
    hub_pages = [*PAGES, *HANDWRITTEN_HUB_PAGES]
    cards = "".join(
        f'<li><a href="/learn/{p["slug"]}/"><strong>{e(p["h1"])}</strong></a><br>{e(p["lede"])}</li>' for p in hub_pages)
    out = head(HUB["title"], HUB["desc"], url, "hub", crumbs)
    out += (f'<div class="breadcrumbs"><a href="/">Home</a> / Learn</div>\n'
            f'<div class="eyebrow">Learn</div><h1 class="page-title">{e(HUB["h1"])}</h1>\n'
            f'<p class="page-lede">{e(HUB["lede"])}</p><p class="page-meta">Updated <time datetime="{DATE}">{DATE_LONG}</time></p>\n'
            f'<div class="article-layout"><article class="article-body">{NOTE}\n'
            f'<h2 id="guides">Guides</h2><ul>{cards}</ul>\n'
            f'<h2 id="about-the-project">About the project behind the guides</h2><p>Project S.P.H.E.R.E. '
            f'(Spatial Positioning Harmonic Empirical Resonance Experiment) is an open, independent research proposal testing whether '
            f'location alone changes the measured resonance of a controlled copper sphere. Start with the <a href="/about/">about page</a>, '
            f'the <a href="/protocol/">draft protocol</a> or the <a href="/whitepaper/">whitepaper</a>.</p></article>\n'
            f'<aside class="article-aside" aria-label="On this page"><h2>On this page</h2><a href="#guides">Guides</a>'
            f'<a href="#about-the-project">About the project</a></aside></div></main>{FOOT}</body></html>\n')
    write(os.path.join(ROOT, "learn", "index.html"), out)


build_hub()
for p in PAGES:
    build_article(p)
print("built", len(PAGES) + 1, "pages")
