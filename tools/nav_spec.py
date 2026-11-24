#!/usr/bin/env python3
"""Single source of truth for Project S.P.H.E.R.E.'s organized, illustrated navigation & footer.

Used by tools/build-directory.py (and indirectly build-vl.py, build-vote.py)
as well as tools/sync-nav.py to keep all hand-written HTML pages and templates in sync.
"""
from __future__ import annotations

ICON_SPRITE = "/assets/nav-icons.svg"

# Four meaningful top-level pillars with bespoke hand-drawn icons
NAV_SECTIONS = [
    {
        "id": "experiment",
        "title": "Experiment",
        "icon": "ni-sec-experiment",
        "tone": "copper",
        "blurb": "Hypotheses, registered LOC-1 method & precision apparatus",
        "items": [
            {
                "key": "protocol",
                "href": "/protocol/",
                "label": "Protocol LOC-1",
                "desc": "Registered dual-sphere test plan (OSF)",
                "icon": "ni-protocol",
            },
            {
                "key": "whitepaper",
                "href": "/whitepaper/",
                "label": "Whitepaper",
                "desc": "Archived technical paper (Zenodo DOI)",
                "icon": "ni-whitepaper",
            },
            {
                "key": "resources",
                "href": "/resources/",
                "label": "Resources & hardware",
                "desc": "Copper sphere specs, laser & clock guides",
                "icon": "ni-resources",
            },
            {
                "key": "vl",
                "href": "/vl/",
                "label": "Visual Lab",
                "desc": "SPHEREVL 3D simulator (educational)",
                "icon": "ni-vl",
                "highlight": True,
            },
        ],
    },
    {
        "id": "library",
        "title": "Library",
        "icon": "ni-sec-library",
        "tone": "cyan",
        "blurb": "Research notes, core metrology concepts & plain-language guides",
        "items": [
            {
                "key": "research",
                "href": "/research/",
                "label": "Research journal",
                "desc": "Technical analyses, error budgets & notes",
                "icon": "ni-research",
            },
            {
                "key": "knowledge",
                "href": "/knowledge/",
                "label": "Knowledge base",
                "desc": "Structured physics & metrology concepts",
                "icon": "ni-knowledge",
            },
            {
                "key": "learn",
                "href": "/learn/",
                "label": "Learn",
                "desc": "Plain-language resonance & DeSci explainers",
                "icon": "ni-learn",
            },
            {
                "key": "glossary",
                "href": "/glossary/",
                "label": "Glossary",
                "desc": "Key terms in acoustic & RF metrology",
                "icon": "ni-glossary",
            },
            {
                "key": "search",
                "href": "/search/",
                "label": "Search archive",
                "desc": "Find articles, concepts & glossary terms",
                "icon": "ni-search",
            },
        ],
    },
    {
        "id": "governance",
        "title": "Governance",
        "icon": "ni-sec-governance",
        "tone": "copper",
        "blurb": "Mission, honest status, funding phases & scientific standards",
        "items": [
            {
                "key": "about",
                "href": "/about/",
                "label": "About S.P.H.E.R.E.",
                "desc": "The question, pre-launch status & founder",
                "icon": "ni-about",
            },
            {
                "key": "transparency",
                "href": "/transparency/",
                "label": "Budget & transparency",
                "desc": "Three-phase funding plan & controls",
                "icon": "ni-transparency",
            },
            {
                "key": "charter",
                "href": "/charter/",
                "label": "Research charter",
                "desc": "Scientific standards & stage gates",
                "icon": "ni-charter",
            },
            {
                "key": "updates",
                "href": "/updates/",
                "label": "Project updates",
                "desc": "Roadmap milestones & field notes",
                "icon": "ni-updates",
            },
            {
                "key": "changelog",
                "href": "/changelog/",
                "label": "Site changelog",
                "desc": "Version number & chronological release log",
                "icon": "ni-changelog",
            },
            {
                "key": "faq",
                "href": "/faq/",
                "label": "FAQ",
                "desc": "Honest answers on scope, claims & null results",
                "icon": "ni-faq",
            },
        ],
    },
    {
        "id": "community",
        "title": "Community",
        "icon": "ni-sec-community",
        "tone": "cyan",
        "blurb": "Independent review, dispatches, events & open participation",
        "items": [
            {
                "key": "collaborate",
                "href": "/collaborate/",
                "label": "Collaborate",
                "desc": "Peer review, lab access & engineering",
                "icon": "ni-collaborate",
            },
            {
                "key": "vote",
                "href": "/vote/",
                "label": "Community votes",
                "desc": "Informal design & identity polls",
                "icon": "ni-vote",
            },
            {
                "key": "calendar",
                "href": "/calendar/",
                "label": "Calendar",
                "desc": "Project & open-science events",
                "icon": "ni-calendar",
            },
            {
                "key": "newsletter",
                "href": "/newsletter/",
                "label": "Newsletter",
                "desc": "Periodic dispatches & issue archive",
                "icon": "ni-newsletter",
            },
            {
                "key": "directory",
                "href": "/directory/",
                "label": "Directory",
                "desc": "Opt-in contributors & advisors",
                "icon": "ni-directory",
            },
            {
                "key": "careers",
                "href": "/careers/",
                "label": "Careers",
                "desc": "Proposal-stage role outlines",
                "icon": "ni-careers",
            },
            {
                "key": "links",
                "href": "/links/",
                "label": "Links & profiles",
                "desc": "Verified official channels & repos",
                "icon": "ni-links",
            },
            {
                "key": "privacy",
                "href": "/privacy/",
                "label": "Privacy notice",
                "desc": "How forms & site data are handled",
                "icon": "ni-privacy",
            },
        ],
    },
]

# Legacy list preserved for backwards compatibility if anything imports NAV_MORE
NAV_MORE = [
    (it["href"], it["label"], it["key"])
    for sec in NAV_SECTIONS
    for it in sec["items"]
]


def _ico(icon_id: str, size: int = 24, cls: str = "ni") -> str:
    return (
        f'<svg class="{cls}" width="{size}" height="{size}" '
        f'viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
        f'<use href="{ICON_SPRITE}#{icon_id}"/></svg>'
    )


def _chev() -> str:
    return (
        '<svg class="nav-chev" width="12" height="12" viewBox="0 0 12 12" '
        'fill="none" aria-hidden="true" focusable="false">'
        '<path d="M2.5 4.25L6 7.75L9.5 4.25" stroke="currentColor" '
        'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )


def nav_key_for_relpath(relpath: str) -> str | None:
    """Resolve a page's active nav key from its repository-relative HTML path."""
    norm = relpath.replace("\\", "/").lstrip("./")
    if norm == "index.html":
        return "home"
    top = norm.split("/", 1)[0]
    if top == "community":
        return "collaborate"
    valid = {it["key"] for sec in NAV_SECTIONS for it in sec["items"]}
    return top if top in valid else None


def render_nav(current: str | None = None, include_skip: bool = True) -> str:
    """Render the complete desktop + mobile illustrated, sectioned navigation bar."""
    desktop_groups = []
    mobile_sections = []

    for idx, sec in enumerate(NAV_SECTIONS):
        sec_active = any(it["key"] == current for it in sec["items"])
        active_attr = ' data-active="true"' if sec_active else ""
        align_cls = " nav-panel-right" if idx >= 2 else ""

        cards = []
        mob_items = []
        for it in sec["items"]:
            is_cur = bool(current and it["key"] == current)
            cur_attr = ' aria-current="page"' if is_cur else ""
            hl_cls = " nav-card-vl" if it.get("highlight") else ""
            cards.append(
                f'<a class="nav-card{hl_cls}" href="{it["href"]}"{cur_attr}>'
                f'<span class="nav-card-ico">{_ico(it["icon"], 28, "ni")}</span>'
                f'<span class="nav-card-body">'
                f'<span class="nav-card-title">{it["label"]}</span>'
                f'<span class="nav-card-desc">{it["desc"]}</span>'
                f'</span></a>'
            )
            mob_items.append(
                f'<a class="mob-link{hl_cls}" href="{it["href"]}"{cur_attr}>'
                f'<span class="mob-link-ico">{_ico(it["icon"], 26, "ni")}</span>'
                f'<span class="mob-link-body">'
                f'<span class="mob-link-title">{it["label"]}</span>'
                f'<span class="mob-link-desc">{it["desc"]}</span>'
                f'</span></a>'
            )

        desktop_groups.append(
            f'<details class="site-menu nav-group" data-section="{sec["id"]}" data-tone="{sec["tone"]}"{active_attr}>'
            f'<summary class="nav-trigger">'
            f'{_ico(sec["icon"], 20, "ni nav-trigger-ico")}'
            f'<span>{sec["title"]}</span>{_chev()}'
            f'</summary>'
            f'<div class="menu-panel nav-mega{align_cls}" role="region" aria-label="{sec["title"]} pages">'
            f'<div class="nav-mega-head">'
            f'<span class="nav-mega-emblem">{_ico(sec["icon"], 30, "ni")}</span>'
            f'<div><div class="nav-mega-title">{sec["title"]}</div>'
            f'<div class="nav-mega-blurb">{sec["blurb"]}</div></div>'
            f'</div>'
            f'<div class="nav-mega-grid">{"".join(cards)}</div>'
            f'</div></details>'
        )

        mobile_sections.append(
            f'<section class="mob-section" data-tone="{sec["tone"]}" aria-label="{sec["title"]}">'
            f'<div class="mob-section-head">'
            f'<span class="mob-section-ico">{_ico(sec["icon"], 24, "ni")}</span>'
            f'<div><span class="mob-section-title">{sec["title"]}</span>'
            f'<span class="mob-section-blurb">{sec["blurb"]}</span></div>'
            f'</div>'
            f'<div class="mob-section-list">{"".join(mob_items)}</div>'
            f'</section>'
        )

    vl_cur = ' aria-current="page"' if current == "vl" else ""
    search_cur = ' aria-current="page"' if current == "search" else ""
    home_cur = ' aria-current="page"' if current == "home" else ""

    nav_html = (
        '<nav class="site-nav" aria-label="Main navigation">\n'
        '<div class="site-nav-inner">\n'
        '<a class="nav-brand" href="/" aria-label="Project S.P.H.E.R.E. home">'
        '<img class="nav-logo" src="/assets/brand/sphere-lockup-compact.svg" alt="S.P.H.E.R.E." width="435" height="136"></a>\n'
        f'<div class="nav-links">{"".join(desktop_groups)}'
        f'<a class="nav-vl" href="/vl/"{vl_cur}>{_ico("ni-vl", 20, "ni nav-vl-ico")}<span>Visual Lab</span></a>'
        '</div>\n'
        '<div class="nav-actions">'
        f'<a class="nav-icon-btn" href="/search/" aria-label="Search site" title="Search"{search_cur}>{_ico("ni-search", 20, "ni")}</a>'
        f'<a class="nav-join" href="/#join">{_ico("ni-join", 18, "ni nav-join-ico")}<span>Get involved</span></a>'
        '</div>\n'
        '<div class="mobile-actions mobile-only">'
        f'<a class="nav-icon-btn" href="/search/" aria-label="Search site"{search_cur}>{_ico("ni-search", 20, "ni")}</a>'
        '<details class="site-menu mob-menu">'
        f'<summary class="mob-trigger" aria-label="Open navigation menu">{_ico("ni-menu", 20, "ni")}<span>Menu</span></summary>'
        '<div class="menu-panel mob-drawer">'
        '<div class="mob-quick">'
        f'<a class="mob-quick-home" href="/"{home_cur}>{_ico("ni-home", 22, "ni")}<span>Home</span></a>'
        f'<a class="mob-quick-vl" href="/vl/"{vl_cur}>'
        f'<span class="mob-quick-vl-ico">{_ico("ni-vl", 26, "ni")}</span>'
        '<span class="mob-quick-vl-copy"><strong>Visual Lab (SPHEREVL)</strong>'
        '<span>Interactive 3D simulator &middot; educational</span></span></a>'
        '</div>'
        f'<div class="mob-sections">{"".join(mobile_sections)}</div>'
        '<div class="mob-footer-cta">'
        f'<a class="mob-join-btn" href="/#join">{_ico("ni-join", 20, "ni")}<span>Get involved &mdash; Register interest</span></a>'
        '</div>'
        '</div></details>'
        '</div>\n'
        '</div>\n'
        '</nav>'
    )
    if include_skip:
        return '<a class="skip-link" href="#main-content">Skip to content</a>\n' + nav_html
    return nav_html


FOOTER_HTML = '''<footer class="site-footer"><div class="footer-inner"><div class="footer-grid">
<div><p class="footer-name">Project S.P.H.E.R.E.</p><p>Spatial Positioning Harmonic Empirical Resonance Experiment</p>
<p>Independent, open experimental research.<br>Proposal stage. No measurement results yet.</p><p>Founded by <a href="https://michaelpgoodman.com/">Michael P. Goodman</a></p></div>
<div><h3>Experiment &amp; Library</h3><a href="/protocol/">Protocol LOC-1</a><a href="/whitepaper/">Whitepaper</a><a href="/resources/">Resources &amp; hardware</a><a href="/vl/">Visual Lab (SPHEREVL)</a><a href="/research/">Research journal</a><a href="/knowledge/">Knowledge base</a><a href="/learn/">Learn</a><a href="/glossary/">Glossary</a></div>
<div><h3>Governance</h3><a href="/about/">About S.P.H.E.R.E.</a><a href="/transparency/">Budget &amp; transparency</a><a href="/charter/">Research charter</a><a href="/updates/">Project updates</a><a href="/changelog/">Site changelog</a><a href="/faq/">Questions &amp; answers</a><a href="/privacy/">Privacy notice</a><a href="https://github.com/cssofny2/spheredesci.org">GitHub repository</a></div>
<div><h3>Community</h3><a href="/collaborate/">Collaborate</a><a href="/vote/">Community votes</a><a href="/calendar/">Calendar</a><a href="/newsletter/">Newsletter</a><a href="/directory/">Directory</a><a href="/careers/">Careers</a><a href="/links/">Links &amp; profiles</a><a href="/search/">Search archive</a></div>
</div><p>Hypotheses are not findings. Contributions do not purchase equity, tokens, royalties, or a financial return.</p>
<p>Research records: <a href="https://osf.io/5b6mj/overview">Protocol LOC-1 preregistration (OSF)</a> &middot; <a href="https://doi.org/10.5281/zenodo.23583932">Whitepaper (Zenodo DOI 10.5281/zenodo.23583932)</a>.</p>
<p>&copy; 2026 Project S.P.H.E.R.E. Research-page text is offered under CC BY 4.0; third-party materials retain their own terms.</p></div></footer>'''
