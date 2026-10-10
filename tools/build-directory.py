#!/usr/bin/env python3
"""Generate the Links, Directory, Calendar, Newsletter and Career-application pages.

Data lives in data/*.json and data/newsletters/*.html. Re-run after editing data:

    python3 tools/build-directory.py

Entries without a URL (links) or without consent (directory) are skipped, never published as placeholders.
The output is static HTML; the calendar splits upcoming/past events in the browser so it never goes stale.
"""
import html, json, re, sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://spheredesci.org"
TZ = ZoneInfo("America/New_York")
MAIL = "contact@spheredesci.org"
PUBLISHED = "2026-10-09"
OG = f"{SITE}/assets/brand/og-image.png?v=2"


def esc(s): return html.escape(str(s), quote=True)
def human(iso):
    d = datetime.strptime(iso[:10], "%Y-%m-%d")
    return f"{d.strftime('%B')} {d.day}, {d.year}"
def load(name): return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))
def tag(label, iso): return f'<span class="new-tag">{label} &middot; {human(iso)}</span>'


NAV_MORE = [("/research/", "Measurement research", "research"), ("/calendar/", "Calendar", "calendar"),
            ("/newsletter/", "Newsletter", "newsletter"), ("/directory/", "Directory", "directory"),
            ("/links/", "Links &amp; profiles", "links"), ("/careers/", "Careers", "careers"),
            ("/charter/", "Research charter", None), ("/collaborate/", "Collaborate", "collaborate"),
            ("/updates/", "Project updates", None), ("/privacy/", "Privacy notice", None)]


def nav(current):
    def a(href, text, key=None):
        cur = ' aria-current="page"' if key and key == current else ""
        return f'<a href="{href}"{cur}>{text}</a>'
    top = "".join([a("/about/", "About"), a("/protocol/", "Protocol"), a("/transparency/", "Transparency"),
                   a("/resources/", "Resources"), a("/faq/", "FAQ")])
    more = "".join(a(h, t, k) for h, t, k in NAV_MORE)
    mob = a("/", "Home") + top + more + a("/#join", "Register interest")
    return f'''<a class="skip-link" href="#main-content">Skip to content</a>
<nav class="site-nav" aria-label="Main navigation">
<a href="/" aria-label="Project S.P.H.E.R.E. home"><img class="nav-logo" src="/assets/brand/sphere-lockup-compact.svg" alt="S.P.H.E.R.E." width="435" height="136"></a>
<div class="nav-links">{top}
<details class="site-menu"><summary>More</summary><div class="menu-panel">{more}</div></details>
<a class="nav-join" href="/#join">Get involved</a></div>
<details class="site-menu mobile-only"><summary>Menu</summary><div class="menu-panel">{mob}</div></details>
</nav>'''


FOOTER = '''<footer class="site-footer"><div class="footer-inner"><div class="footer-grid">
<div><p class="footer-name">Project S.P.H.E.R.E.</p><p>Spatial Positioning Harmonic Empirical Resonance Experiment</p>
<p>Independent, open experimental research.<br>Proposal stage. No measurement results yet.</p></div>
<div><h3>Research</h3><a href="/protocol/">First experiment</a><a href="/research/">Measurement research</a><a href="/charter/">Research charter</a><a href="/resources/">Research resources</a><a href="/faq/">Questions &amp; answers</a></div>
<div><h3>Project</h3><a href="/transparency/">Budget &amp; transparency</a><a href="/collaborate/">Collaborate</a><a href="/updates/">Updates</a><a href="/privacy/">Privacy notice</a><a href="https://github.com/cssofny2/spheredesci.org">GitHub repository</a></div>
<div><h3>Connect</h3><a href="/calendar/">Calendar</a><a href="/newsletter/">Newsletter</a><a href="/directory/">Directory</a><a href="/links/">Links &amp; profiles</a><a href="/careers/apply/">Apply</a></div>
</div><p>Hypotheses are not findings. Contributions do not purchase equity, tokens, royalties, or a financial return.</p>
<p>&copy; 2026 Project S.P.H.E.R.E. Research-page text is offered under CC BY 4.0; third-party materials retain their own terms.</p></div></footer>'''


def page(path, title, desc, h1, lede, body, toc, *, eyebrow, parent, navkey, updated=None, extra_ld=None, extra_script="", og_type="website", crumb=None):
    url = SITE + path
    t = title if len(title) + 16 > 70 else f"{title} | S.P.H.E.R.E."
    crumbs, items = '<a href="/">Home</a>', [("Home", SITE + "/")]
    for name, href in parent:
        crumbs += f' / <a href="{href}">{esc(name)}</a>'
        items.append((re.sub("<[^>]+>|&amp;", lambda m: "&" if m.group(0) == "&amp;" else "", name), SITE + href))
    crumbs += f" / {esc(crumb or h1)}"
    items.append((title, url))
    modified = updated or PUBLISHED
    ld_page = {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": title, "description": desc,
               "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en", "datePublished": PUBLISHED, "dateModified": modified}
    if extra_ld: ld_page.update(extra_ld)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Project S.P.H.E.R.E.",
         "description": "Spatial Positioning Harmonic Empirical Resonance Experiment"}, ld_page,
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u}
                                                         for i, (n, u) in enumerate(items)]}]}
    meta = f'Added <time datetime="{PUBLISHED}">{human(PUBLISHED)}</time>'
    if modified != PUBLISHED: meta += f' &middot; Updated <time datetime="{modified}">{human(modified)}</time>'
    meta += " &middot; Proposal stage"
    aside = "".join(f'<a href="#{i}">{n}</a>' for i, n in toc)
    return f'''<!DOCTYPE html><html lang="en" class="scroll-smooth"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(t)}</title><meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#05070a"><link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="Project S.P.H.E.R.E.">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{OG}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}"><meta name="twitter:image" content="{OG}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<link href="/assets/tailwind.css" rel="stylesheet"><link href="/assets/site.css" rel="stylesheet">
<script src="/assets/site.js" defer></script><script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head><body>{nav(navkey)}<main id="main-content" class="content-shell">
<div class="breadcrumbs">{crumbs}</div>
<div class="eyebrow">{esc(eyebrow)}</div><h1 class="page-title">{esc(h1)}</h1>
<p class="page-lede">{lede}</p><p class="page-meta">{meta}</p>
<div class="article-layout"><article class="article-body">{body}</article>
<aside class="article-aside" aria-label="On this page"><h2>On this page</h2>{aside}</aside></div></main>{FOOTER}{extra_script}</body></html>
'''


def write(path, content):
    out = ROOT / path.strip("/") / "index.html" if not path.endswith((".ics", ".xml")) else ROOT / path.strip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    print("wrote", out.relative_to(ROOT))


# ---------------------------------------------------------------- Links & profiles
LABEL = {"project": "Project", "social": "Social", "related": "Related", "documents": "Document"}

def build_links():
    d = load("links.json")
    secs, toc, skipped = "", [], []
    for g in d["groups"]:
        cards = ""
        for it in g["items"]:
            if not it.get("url"):
                skipped.append(it["name"]); continue
            ext = not it.get("internal") and not it["url"].startswith("mailto:") and not it["url"].startswith("/")
            attrs = ' target="_blank" rel="noopener me"' if ext else ""
            shown = it.get("label") or it["url"].replace("https://", "").replace("http://", "").rstrip("/")
            arrow = ' <span class="ext" aria-hidden="true">&nearr;</span>' if ext else ""
            cards += (f'<a href="{esc(it["url"])}"{attrs}><span class="label">{LABEL.get(g["id"], "Link")}</span>'
                      f'<h3>{esc(it["name"])}{arrow}</h3><p>{esc(it.get("desc") or "")}</p>'
                      f'<span class="link-url">{esc(shown)}</span></a>')
        if not cards: continue
        secs += (f'<h2 id="{g["id"]}">{esc(g["title"])}</h2><p>{esc(g["intro"])}</p>'
                 f'<div class="home-resource-grid link-grid">{cards}</div>')
        toc.append((g["id"], esc(g["title"])))
    secs += ('<h2 id="events">Events and webinars</h2><p>Project events and external events of interest are listed on the '
             '<a href="/calendar/">calendar</a>. External events are not hosted by or affiliated with S.P.H.E.R.E. unless stated.</p>')
    toc.append(("events", "Events and webinars"))
    secs += ('<div class="note"><strong>Check before you trust a profile.</strong> Official channels are only those listed on this page. '
             'S.P.H.E.R.E. does not sell tokens, ask for wallet seed phrases or send private-message investment offers. '
             'Social posts are not research findings.</div>')
    body = secs
    if skipped:
        print("links skipped (no URL yet):", ", ".join(skipped))
    write("/links/", page("/links/", "Links, social profiles and related pages",
        "Official S.P.H.E.R.E. channels: website, GitHub, social media profiles, related business pages and documents in one place.",
        "Every official channel in one place.",
        "Project links, social media profiles, related business pages and documents. Only channels listed here are official.",
        body, toc, eyebrow="Connect / Links", parent=[], navkey="links", updated=d["updated"], crumb="Links & profiles"))


# ---------------------------------------------------------------- Directory
def build_directory():
    d = load("directory.json")
    cards = ""
    for e in d["entries"]:
        if not e.get("consent"):
            print("directory skipped (no consent):", e.get("name")); continue
        prof = "".join(f"<li>{esc(x)}</li>" for x in e.get("professional", []))
        contact = ""
        for c in e.get("contact", []):
            ext = "" if c["url"].startswith("mailto:") else ' target="_blank" rel="noopener"'
            contact += f'<li><strong>{esc(c["label"])}:</strong> <a href="{esc(c["url"])}"{ext}>{esc(c["value"])}</a></li>'
        prof_html = f"<h4>Professional background</h4><ul>{prof}</ul>" if prof else ""
        contact_html = f'<h4>Contact</h4><ul class="plain">{contact}</ul>' if contact else ""
        loc_html = f'<p class="dir-loc">{esc(e["location"])}</p>' if e.get("location") else ""
        cards += (f'<section class="dir-card" aria-labelledby="{esc(e["id"])}"><div class="dir-head"><div><h3 id="{esc(e["id"])}">{esc(e["name"])}</h3>'
                  f'<p class="dir-role">{esc(e["role"])} &middot; {esc(e["organization"])}</p></div><span class="status-pill">{esc(e["status"])}</span></div>'
                  f'<p>{esc(e["summary"])}</p>{prof_html}{contact_html}{loc_html}</section>')
    if not cards:
        cards = "<p>No parties are listed yet.</p>"
    body = ('<div class="note"><strong>Listed with permission.</strong> This directory lists active parties who have agreed to be published. '
            'It does not include advisors, reviewers, contractors or partners who have not consented, and no endorsement or institutional '
            'partnership is implied. Hypotheses are not findings.</div>'
            '<h2 id="active">Active parties</h2>' + cards +
            '<h2 id="roles">Open and planned roles</h2><p>Roles the project hopes to fill if funded, with budgeted pay, are on the '
            '<a href="/careers/">careers page</a>. To be considered, <a href="/careers/apply/">submit a candidate application</a>.</p>'
            '<h2 id="listing">Being listed, corrected or removed</h2><p>Names, affiliations and contact details are published only with the listed person\'s written permission. '
            f'To request a listing, a correction or removal, email <a href="mailto:{MAIL}">{MAIL}</a> from the address you want associated with the entry. '
            'Personal phone numbers and home addresses are not published. See the <a href="/privacy/">privacy notice</a>.</p>')
    toc = [("active", "Active parties"), ("roles", "Open and planned roles"), ("listing", "Listing and removal")]
    write("/directory/", page("/directory/", "Company directory: active parties and professional information",
        "Directory of active S.P.H.E.R.E. parties with role, professional background and contact route, listed with permission.",
        "Who is involved, and how to reach them.",
        "Active parties, their roles, professional background and contact route. Listed only with permission.",
        body, toc, eyebrow="Connect / Directory", parent=[], navkey="directory", updated=d["updated"], crumb="Directory"))


# ---------------------------------------------------------------- Calendar
def _ics_escape(s): return str(s).replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")

def build_calendar():
    d = load("events.json")
    events = sorted(d["events"], key=lambda e: e["start"])
    items, ics = "", ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Project S.P.H.E.R.E.//Calendar//EN", "CALSCALE:GREGORIAN",
                      "X-WR-CALNAME:Project S.P.H.E.R.E. calendar", "X-WR-TIMEZONE:America/New_York"]
    ld_events = []
    for i, e in enumerate(events):
        start = datetime.fromisoformat(e["start"]).replace(tzinfo=TZ)
        end = datetime.fromisoformat(e["end"]).replace(tzinfo=TZ) if e.get("end") else start
        allday = e.get("all_day", False)
        kind = "Project event" if e.get("type", "project") == "project" else "External event of interest"
        when = human(e["start"]) if allday else f'{human(e["start"])}, {start.strftime("%-I:%M %p %Z")}'
        if e.get("end") and e["end"][:10] != e["start"][:10]: when += f' to {human(e["end"])}'
        link = f' <a href="{esc(e["url"])}" target="_blank" rel="noopener">Event page</a>' if e.get("url") else ""
        items += (f'<li class="event" data-end="{end.astimezone(timezone.utc).isoformat()}"><div class="event-date"><strong>{start.strftime("%b").upper()}</strong>'
                  f'<span>{start.day}</span></div><div><h3>{esc(e["title"])}</h3><p class="event-meta">{esc(when)} &middot; {kind}'
                  f'{" &middot; " + esc(e["location"]) if e.get("location") else ""}</p>'
                  f'<p>{esc(e.get("description", ""))}{link}</p></div></li>')
        uid = f"{e['start'].replace('-', '').replace(':', '')}-{i}@spheredesci.org"
        ics += ["BEGIN:VEVENT", f"UID:{uid}", f"DTSTAMP:{datetime(2026, 10, 9, tzinfo=timezone.utc).strftime('%Y%m%dT%H%M%SZ')}", f"SUMMARY:{_ics_escape(e['title'])}"]
        if allday: ics += [f"DTSTART;VALUE=DATE:{start.strftime('%Y%m%d')}"]
        else: ics += [f"DTSTART:{start.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}", f"DTEND:{end.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"]
        if e.get("location"): ics.append(f"LOCATION:{_ics_escape(e['location'])}")
        if e.get("url"): ics.append(f"URL:{e['url']}")
        if e.get("description"): ics.append(f"DESCRIPTION:{_ics_escape(e['description'])}")
        ics.append("END:VEVENT")
        ld_events.append({"@type": "Event", "name": e["title"], "startDate": e["start"] + ":00-04:00" if len(e["start"]) == 16 else e["start"],
                          **({"url": e["url"]} if e.get("url") else {}), **({"description": e["description"]} if e.get("description") else {}),
                          **({"location": {"@type": "Place", "name": e["location"]}} if e.get("location") else {})})
    ics.append("END:VCALENDAR")
    empty = "" if events else ('<div class="note" id="cal-empty"><strong>No events are scheduled yet.</strong> The project has not announced a webinar, '
                               'community call or public event, and no date is promised for the first LOC-1 run. When an event is announced it will appear here '
                               'with its date, time zone and link.</div>')
    body = (empty +
        '<div id="cal-upcoming-wrap"' + ('' if events else ' hidden') + '><h2 id="upcoming">Upcoming events</h2><ul class="event-list" id="cal-upcoming">' + items + '</ul>'
        '<p id="cal-none-upcoming" hidden>No upcoming events are scheduled right now.</p></div>'
        '<div id="cal-past-wrap" hidden><h2 id="past">Past events</h2><ul class="event-list" id="cal-past"></ul></div>'
        '<h2 id="subscribe">Add to your calendar</h2><p>Download the <a href="/calendar.ics">calendar file (.ics)</a> for Apple Calendar, Google Calendar or Outlook. '
        'Times are Eastern (America/New_York). Re-download it to pick up new events; the file is not a live subscription feed.</p>'
        '<h2 id="milestones">Research milestones (no dates yet)</h2><p>The research roadmap has no committed dates. Milestones are tracked on the '
        '<a href="/updates/">project updates</a> page and will be dated only when they are scheduled. External events (conferences, webinars) are '
        'listed only when the organizer has published the date, and are not hosted by or affiliated with S.P.H.E.R.E. unless stated.</p>'
        '<h2 id="suggest">Suggest an event</h2><p>Know of a relevant webinar or conference? Email '
        f'<a href="mailto:{MAIL}">{MAIL}</a> with the organizer\'s link and date.</p>')
    toc = [("upcoming", "Upcoming events"), ("past", "Past events"), ("subscribe", "Add to your calendar"),
           ("milestones", "Research milestones"), ("suggest", "Suggest an event")]
    script = ('<script>(function(){var up=document.getElementById("cal-upcoming"),past=document.getElementById("cal-past");if(!up)return;'
              'var now=Date.now(),items=Array.prototype.slice.call(up.children),pastN=0;'
              'items.forEach(function(li){if(Date.parse(li.getAttribute("data-end"))<now){past.insertBefore(li,past.firstChild);pastN++;}});'
              'if(pastN){document.getElementById("cal-past-wrap").hidden=false;}'
              'if(items.length&&!up.children.length){document.getElementById("cal-none-upcoming").hidden=false;}'
              '})();</script>')
    write("/calendar/", page("/calendar/", "Company calendar: upcoming events and dates",
        "Upcoming S.P.H.E.R.E. events, webinars and dates, with a downloadable calendar file. Updated whenever an event is announced.",
        "Upcoming events and dates.",
        "Project events and external events of interest, with dates and times. Nothing is listed until it has been announced.",
        body, toc, eyebrow="Connect / Calendar", parent=[], navkey="calendar", updated=d["updated"], extra_script=script, crumb="Calendar",
        extra_ld=({"mainEntity": ld_events} if ld_events else None)))
    write("/calendar.ics", "\r\n".join(ics) + "\r\n")


# ---------------------------------------------------------------- Newsletter
def _form_attrs(subject, nxt, autoresp):
    return (f'<input type="hidden" name="_subject" value="{esc(subject)}"><input type="hidden" name="_template" value="table">'
            f'<input type="hidden" name="_autoresponse" value="{esc(autoresp)}"><input type="hidden" name="_next" value="{SITE}{nxt}">'
            '<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">')

def build_newsletter():
    d = load("newsletters.json")
    issues = sorted(d["issues"], key=lambda i: i["date"], reverse=True)
    latest = issues[0]
    frag = lambda i: (ROOT / "data" / "newsletters" / f"{i['slug']}.html").read_text(encoding="utf-8")
    archive = "".join(f'<li><a href="/newsletter/{i["slug"]}/"><strong>Issue {i["number"]}: {esc(i["title"].split(": ", 1)[-1])}</strong></a>'
                      f'<span class="issue-date"><time datetime="{i["date"]}">{human(i["date"])}</time></span><p>{esc(i["summary"])}</p></li>' for i in issues)
    sub = (f'<form class="review-form" id="subForm" action="https://formsubmit.co/{MAIL}" method="POST" aria-labelledby="sub-h">'
           + _form_attrs("Newsletter SUBSCRIBE request", "/newsletter/?subscribed=1#subscribe",
                         "Thanks. We received your request to subscribe to the Project S.P.H.E.R.E. newsletter. A copy of your request is below. You can opt out at any time at https://spheredesci.org/newsletter/#opt-out") +
           '<label>Email address<input type="email" name="email" autocomplete="email" required maxlength="200"></label>'
           '<label>Name (optional)<input type="text" name="name" autocomplete="name" maxlength="120"></label>'
           '<fieldset><legend>Topics (optional)</legend><label class="check"><input type="checkbox" name="topics" value="Research updates"> Research updates</label>'
           '<label class="check"><input type="checkbox" name="topics" value="Events and webinars"> Events and webinars</label>'
           '<label class="check"><input type="checkbox" name="topics" value="Funding and transparency"> Funding and transparency</label></fieldset>'
           '<label class="check"><input type="checkbox" name="consent" value="yes" required> I agree to receive the S.P.H.E.R.E. newsletter by email and understand I can opt out at any time.</label>'
           '<button class="review-btn" type="submit">Subscribe</button></form>')
    unsub = (f'<form class="review-form" id="optForm" action="https://formsubmit.co/{MAIL}" method="POST" aria-labelledby="opt-h">'
             + _form_attrs("Newsletter OPT-OUT request", "/newsletter/?optout=1#opt-out",
                           "We received your request to stop receiving the Project S.P.H.E.R.E. newsletter. A copy of your request is below. If you did not make this request, reply to this message.") +
             '<label>Email address to remove<input type="email" name="email" autocomplete="email" required maxlength="200"></label>'
             '<label>Reason (optional)<input type="text" name="reason" maxlength="300"></label>'
             '<button class="review-btn" type="submit">Opt out</button></form>')
    body = ('<div id="nl-status" class="note" role="status" aria-live="polite" hidden></div>'
            f'<h2 id="latest">Latest issue {tag("New", latest["date"])}</h2>'
            f'<div class="issue-card"><p class="issue-meta">Issue {latest["number"]} &middot; <time datetime="{latest["date"]}">{human(latest["date"])}</time></p>'
            f'<h3><a href="/newsletter/{latest["slug"]}/">{esc(latest["title"])}</a></h3>{frag(latest)}</div>'
            '<h2 id="archive">Archive</h2><p>Every issue stays on this site as a permanent reference. Newer issues appear first.</p>'
            f'<ul class="issue-list">{archive}</ul>'
            '<h2 id="subscribe">Subscribe</h2><p id="sub-h" class="sr-only">Subscribe form</p>'
            '<p>Updates on research documents, events and transparency reports. No payment is requested and subscribing does not confer membership, ownership or a financial return.</p>'
            + sub +
            '<h2 id="opt-out">Opt out</h2><p id="opt-h" class="sr-only">Opt-out form</p>'
            f'<p>Enter the address you want removed. You can also email <a href="mailto:{MAIL}?subject=Newsletter%20opt-out">{MAIL}</a> with the subject &ldquo;Newsletter opt-out&rdquo;.</p>'
            + unsub +
            '<div class="note"><strong>How requests are handled today.</strong> The newsletter does not yet use an email-marketing platform. '
            f'Subscribe and opt-out forms send an email to <a href="mailto:{MAIL}">{MAIL}</a> through FormSubmit, and a person processes them. '
            'There is no instant automatic unsubscribe link yet. Read the <a href="/privacy/#newsletter">privacy notice</a>.</div>')
    toc = [("latest", "Latest issue"), ("archive", "Archive"), ("subscribe", "Subscribe"), ("opt-out", "Opt out")]
    script = ('<script>(function(){var p=new URLSearchParams(location.search),m={subscribed:"Thanks. Your subscription request was sent. A copy was emailed to you.",'
              'optout:"Your opt-out request was sent. A copy was emailed to you."},s=document.getElementById("nl-status");'
              'for(var k in m){if(p.get(k)==="1"){s.textContent=m[k];s.hidden=false;}}})();</script>')
    write("/newsletter/", page("/newsletter/", "Newsletter: subscribe, opt out and read every issue",
        "Subscribe to or opt out of the S.P.H.E.R.E. newsletter, read the latest issue and browse the full archive.",
        "The newsletter, with every issue kept.",
        "Read the latest issue, browse the archive, subscribe, or opt out at any time.",
        body, toc, eyebrow="Connect / Newsletter", parent=[], navkey="newsletter", updated=d["updated"], extra_script=script, crumb="Newsletter"))
    # Individual issues, with previous/next navigation
    for n, i in enumerate(issues):
        newer = issues[n - 1] if n > 0 else None
        older = issues[n + 1] if n + 1 < len(issues) else None
        pn = ('<nav class="issue-nav" aria-label="Newsletter issues">' +
              (f'<a href="/newsletter/{older["slug"]}/">&larr; Issue {older["number"]}</a>' if older else "<span></span>") +
              '<a href="/newsletter/">All issues</a>' +
              (f'<a href="/newsletter/{newer["slug"]}/">Issue {newer["number"]} &rarr;</a>' if newer else "<span></span>") + '</nav>')
        ibody = (f'<p class="issue-meta">Issue {i["number"]} &middot; <time datetime="{i["date"]}">{human(i["date"])}</time></p>' + frag(i) + pn +
                 '<div class="note">Want future issues by email? <a href="/newsletter/#subscribe">Subscribe</a> or <a href="/newsletter/#opt-out">opt out</a>.</div>')
        toc_i = [(re.sub("[^a-z0-9]+", "-", h.lower()).strip("-"), h) for h in re.findall(r"<h2>(.*?)</h2>", frag(i))]
        ibody = re.sub(r"<h2>(.*?)</h2>", lambda m: f'<h2 id="{re.sub("[^a-z0-9]+", "-", m.group(1).lower()).strip("-")}">{m.group(1)}</h2>', ibody)
        write(f"/newsletter/{i['slug']}/", page(f"/newsletter/{i['slug']}/", i["title"], i["summary"], i["title"], esc(i["summary"]),
              ibody, toc_i or [("top", "Issue")], eyebrow=f"Newsletter / Issue {i['number']}", parent=[("Newsletter", "/newsletter/")],
              navkey="newsletter", updated=i["date"], og_type="article", crumb=f"Issue {i['number']}"))


# ---------------------------------------------------------------- Candidate application
ROLES = ["Scientific Director / Principal Investigator", "Metrology & Instrumentation Engineer",
         "Laboratory & Research Operations Coordinator", "DeSci Community & Grants Lead",
         "Independent Statistician / Methods Reviewer", "Bookkeeper & Compliance Administrator",
         "Reviewer or advisor (unpaid)", "Not listed: describe in the summary"]

def _ref(n):
    return (f'<fieldset class="ref"><legend>Reference {n}{" (required)" if n < 3 else " (optional)"}</legend>'
            f'<div class="form-grid"><label>Name<input name="ref{n}_name" maxlength="150"{" required" if n < 3 else ""}></label>'
            f'<label>Relationship (manager, client, collaborator&hellip;)<input name="ref{n}_relationship" maxlength="150"{" required" if n < 3 else ""}></label>'
            f'<label>Organization and title<input name="ref{n}_org" maxlength="200"></label>'
            f'<label>Email<input type="email" name="ref{n}_email" maxlength="200"{" required" if n < 3 else ""}></label>'
            f'<label>Phone (optional)<input type="tel" name="ref{n}_phone" maxlength="40"></label>'
            f'<label>How long and in what capacity you worked together<input name="ref{n}_duration" maxlength="200"></label></div></fieldset>')

def build_apply():
    roles = "".join(f"<option>{esc(r)}</option>" for r in ROLES)
    acc = "".join(f'<label>Accomplishment {n}{" (required)" if n == 1 else ""}<textarea name="accomplishment{n}" rows="3" maxlength="1200"{" required" if n == 1 else ""} '
                  'placeholder="What you did, your role, and a measurable result"></textarea></label>' for n in (1, 2, 3))
    form = (f'<form id="applyForm" class="review-form apply-form" action="https://formsubmit.co/{MAIL}" method="POST" enctype="multipart/form-data">'
            + _form_attrs("New S.P.H.E.R.E. candidate application", "/careers/apply/?submitted=1",
                          "Thank you for applying to Project S.P.H.E.R.E. We received your application; a copy of your answers is below. This is not a job offer, and engagements begin only after funding and board approval.") +
            '<fieldset><legend>1. About you</legend><div class="form-grid">'
            '<label>Full name<input name="name" autocomplete="name" required maxlength="150"></label>'
            '<label>Email<input type="email" name="email" autocomplete="email" required maxlength="200"></label>'
            '<label>Phone (optional)<input type="tel" name="phone" autocomplete="tel" maxlength="40"></label>'
            '<label>City, region and time zone<input name="location" maxlength="150" required></label>'
            '<label>LinkedIn or portfolio URL<input type="url" name="profile_url" maxlength="300"></label>'
            f'<label>Role of interest<select name="role" required><option value="" disabled selected>Select a role&hellip;</option>{roles}</select></label>'
            '<label>Availability and engagement type (hours per week, contractor or employee)<input name="availability" required maxlength="200"></label>'
            '<label>Work authorization or contractor status, if relevant (optional)<input name="work_status" maxlength="200"></label></div></fieldset>'
            '<fieldset><legend>2. Professional summary</legend>'
            '<label>Summary of relevant experience<textarea name="summary" rows="6" required maxlength="3000"></textarea></label>'
            '<label>Skills, instruments, software and credentials (certifications with issuer and year)<textarea name="skills" rows="4" maxlength="2000"></textarea></label>'
            '<label>Current or most recent role, employer and dates<input name="current_role" required maxlength="250"></label>'
            '<label>Education and training (optional)<textarea name="education" rows="3" maxlength="1500"></textarea></label></fieldset>'
            '<fieldset><legend>3. Accomplishments</legend><p class="field-hint">Up to three. Prefer measurable results and your own contribution.</p>' + acc +
            '<label>Publications, patents, open-source work or talks (links, optional)<textarea name="publications" rows="3" maxlength="1500"></textarea></label></fieldset>'
            '<fieldset><legend>4. Professional references</legend><p class="field-hint">Provide at least two people who can speak to your work. Do not list anyone who has not agreed to be contacted.</p>'
            + _ref(1) + _ref(2) + _ref(3) + '</fieldset>'
            '<fieldset><legend>5. Résumé and conflicts</legend>'
            '<label>Résumé or CV (PDF, DOC or DOCX, up to 5 MB)<input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></label>'
            '<p id="resume-msg" class="field-hint" role="alert"></p>'
            '<label>Financial or intellectual conflicts of interest to declare (write &ldquo;none&rdquo; if none)<textarea name="conflicts" rows="3" required maxlength="1500"></textarea></label>'
            '<label>Anything else we should know (optional)<textarea name="notes" rows="3" maxlength="1500"></textarea></label></fieldset>'
            '<fieldset><legend>6. Confirmations</legend>'
            '<label class="check"><input type="checkbox" name="confirm_accurate" value="yes" required> The information I provided is accurate to the best of my knowledge.</label>'
            '<label class="check"><input type="checkbox" name="confirm_references" value="yes" required> Each reference has agreed that I may share their contact details for this purpose.</label>'
            '<label class="check"><input type="checkbox" name="confirm_privacy" value="yes" required> I have read the <a href="/privacy/#applications">privacy notice</a> and understand this is an application for consideration, not a job offer or promise of payment.</label>'
            '<label class="check"><input type="checkbox" name="confirm_no_sensitive" value="yes" required> I did not include government ID numbers, bank details, date of birth, health information or confidential information belonging to an employer or client.</label></fieldset>'
            '<button class="review-btn" type="submit" id="applyBtn">Submit application</button><p id="apply-status" class="field-hint" role="status" aria-live="polite"></p></form>')
    body = ('<div id="apply-done" class="note" role="status" hidden><strong>Application sent.</strong> A copy of your answers was emailed to the address you provided. '
            'You will hear from the project if there is a fit; engagements begin only after funding and board approval.</div>'
            '<div class="note"><strong>Before you apply.</strong> S.P.H.E.R.E. is at proposal stage. Roles are contingent on funding, and nothing here is a job offer or a promise of payment. '
            'See the <a href="/careers/">roles and budgeted pay</a>. Applicants must declare conflicts of interest.</div>'
            '<h2 id="how">How this works</h2><ul><li>Your answers and résumé are emailed to the project mailbox through FormSubmit. They are not published.</li>'
            '<li>References are not contacted without a further message to you.</li>'
            '<li>Do not include government ID numbers, bank details, date of birth, health information, or confidential information from an employer or client.</li>'
            '<li>If you cannot use the form, email <a href="mailto:' + MAIL + '">' + MAIL + '</a> with the same information.</li></ul>'
            '<h2 id="form">Candidate application</h2>' + form +
            '<h2 id="after">After you submit</h2><p>You will be shown a confirmation and sent a copy of your answers. To correct or withdraw an application, email '
            f'<a href="mailto:{MAIL}">{MAIL}</a>. See <a href="/privacy/#applications">how application data is handled</a>.</p>')
    toc = [("how", "How this works"), ("form", "Candidate application"), ("after", "After you submit")]
    script = ('<script>(function(){var f=document.getElementById("applyForm"),r=document.getElementById("resume"),m=document.getElementById("resume-msg"),b=document.getElementById("applyBtn");'
              'var ok=/\\.(pdf|doc|docx)$/i;function check(){m.textContent="";r.setCustomValidity("");var x=r.files&&r.files[0];if(!x)return true;'
              'if(!ok.test(x.name)){r.setCustomValidity("Use a PDF, DOC or DOCX file.");m.textContent="Use a PDF, DOC or DOCX file.";return false;}'
              'if(x.size>5*1024*1024){r.setCustomValidity("File is larger than 5 MB.");m.textContent="That file is larger than 5 MB. Please compress it.";return false;}return true;}'
              'r.addEventListener("change",check);f.addEventListener("submit",function(e){if(!check()||!f.checkValidity())return;setTimeout(function(){b.disabled=true;b.textContent="Submitting\\u2026";},0);});'
              'if(new URLSearchParams(location.search).get("submitted")==="1"){document.getElementById("apply-done").hidden=false;f.hidden=true;}})();</script>')
    write("/careers/apply/", page("/careers/apply/", "Candidate application: professional details, references and résumé",
        "Apply to Project S.P.H.E.R.E.: submit professional background, accomplishments, references and a résumé. Proposal stage; not a job offer.",
        "Tell us what you have built.",
        "Share your professional background, accomplishments, references and résumé. Roles are contingent on funding and nothing here is a job offer.",
        body, toc, eyebrow="Project / Careers / Apply", parent=[("Careers", "/careers/")], navkey="careers", extra_script=script, crumb="Apply"))


if __name__ == "__main__":
    build_links(); build_directory(); build_calendar(); build_newsletter(); build_apply()
