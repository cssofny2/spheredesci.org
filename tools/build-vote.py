#!/usr/bin/env python3
"""Generate the /vote/ hub, each vote project page, worker/projects.js and the vote sitemap entries.

Sources:  data/vote/projects.json and the item list each project names (data/vote/<items>).
Run from the repository root after editing data (logo SVGs come from tools/make-vote-logos.py):

    python3 tools/make-vote-logos.py && python3 tools/build-vote.py

Vote data (ballots, comments, remixes) lives in the Cloudflare D1 database behind /api/vote/*, never in these files.
"""
import importlib.util, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("bd", ROOT / "tools/build-directory.py")
bd = importlib.util.module_from_spec(spec); spec.loader.exec_module(bd)
esc, SITE, page, write = bd.esc, bd.SITE, bd.page, bd.write
ORG = {"@type": "Organization", "@id": SITE + "/#organization", "name": "Project S.P.H.E.R.E.", "url": SITE + "/"}


def wide(html, project_assets=True):
    """Swap the article+aside layout for a full-width one and attach the vote assets."""
    html = re.sub(r'<div class="article-layout"><article class="article-body">(.*?)</article>\s*<aside.*?</aside></div>',
                  lambda m: '<div class="vote-wide article-body">' + m.group(1) + "</div>", html, flags=re.S)
    html = html.replace("</head>", '<link href="/assets/vote.css" rel="stylesheet"></head>', 1)
    return html.replace("</body>", '<script src="/assets/vote.js" defer></script></body>', 1)


def project_page(p, items):
    slug, base = p["slug"], f"/vote/{p['slug']}/"
    url = SITE + base
    sets = {s[0]: s for s in p["sets"]}
    body = ('<div class="note"><strong>This is an informal community poll.</strong> It collects design preferences for the project identity. '
            'It is not research, a measurement or a scientific result, and the outcome does not endorse any claim about the experiment.</div>'
            '<div id="vote-app" data-project="%s" data-remix="%s">' % (slug, "1" if p.get("remix") else "0"))
    body += ('<noscript><p class="note">Voting and results need JavaScript. The logo concepts below are readable without it.</p></noscript>'
             '<div id="vote-bar" class="vote-bar" hidden></div><div id="vote-panel" hidden></div><div id="vote-gallery">')
    toc, ld_items, sm_images = [], [], []
    pos = 0
    for sname, sid, label, blurb in p["sets"]:
        group = [i for i in items if i["set"] == sname]
        if not group: continue
        toc.append((sid, label))
        body += (f'<section class="vote-set" aria-labelledby="{sid}"><h2 id="{sid}">{esc(label)} <span class="vote-count">{len(group)} logos</span></h2>'
                 f'<p class="vote-set-note">{esc(blurb)}</p><div class="vote-grid">')
        for it in group:
            pos += 1
            img = f"/assets/vote/{slug}/{it['slug']}.svg"
            alt = f"{it['name']} logo concept for Project S.P.H.E.R.E.: {it['note'].rstrip('.')}."
            body += (f'<figure class="vote-item" id="{it["slug"]}" data-item="{it["id"]}" data-name="{esc(it["name"])}" data-img="{img}" data-remix="{1 if it["remix"] else 0}">'
                     f'<a class="vote-img" href="{img}" aria-label="Open {esc(it["name"])} as an SVG file">'
                     f'<img src="{img}" alt="{esc(alt)}" width="480" height="320" loading="{"eager" if pos <= 4 else "lazy"}" decoding="async"></a>'
                     f'<figcaption><h3><a href="{base}#{it["slug"]}">{esc(it["name"])}</a></h3><p>{esc(it["note"])}</p></figcaption></figure>')
            ld_items.append({"@type": "ListItem", "position": pos, "item": {
                "@type": "ImageObject", "@id": f"{url}#{it['slug']}-image", "name": f"{it['name']} logo concept",
                "description": alt, "url": f"{url}#{it['slug']}", "contentUrl": SITE + img, "thumbnailUrl": SITE + img,
                "encodingFormat": "image/svg+xml", "width": 480, "height": 320, "creator": {"@id": ORG["@id"]},
                "isPartOf": {"@id": url + "#webpage"}}})
            sm_images.append((SITE + img, f"{it['name']} logo concept", alt))
        body += "</div></section>"
    body += "</div></div>"
    body += ('<h2 id="how">How voting works</h2><ul>'
             '<li><strong>Keep or Drop</strong> and a <strong>rating from 1 to 10</strong> are required. A comment is optional, public, and shown only on the Results tab.</li>'
             '<li>You get <strong>one ballot per logo</strong>. A ballot is locked when you submit it.</li>'
             '<li>The ranking uses the mean rating. Logos with fewer than three ballots are marked provisional.</li>'
             '<li>In the <strong>Remix lab</strong>, you describe a change to a mark, review the result, and submit it. It joins the pool as a new entry; you cannot vote on your own remix.</li></ul>'
             '<h2 id="fairness">What the poll can and cannot show</h2>'
             '<p>Each browser gets a random anonymous voter ID stored in a cookie, so one browser casts one ballot per logo. Anyone who clears cookies or uses another device could vote again, so treat the results as a popularity signal, not an audited count. '
             'Daily limits per network and per voter reduce abuse. Comments and remix names that contain links are rejected.</p>'
             '<h2 id="privacy">Privacy</h2>'
             '<p>The site stores your ballots, comments and remixes with a random voter ID. It stores a salted hash of your network address for daily abuse limits, not the address itself. '
             'It does not ask for your name or email. See the <a href="/privacy/#votes">privacy notice</a>.</p>'
             '<h2 id="about">About these concepts</h2>'
             f'<p>The {len(items)} marks come from six design rounds for the project identity. They are drawn in SVG, so each one can be opened and reused at any size. '
             'They are design proposals only. Nothing about a logo changes the research protocol or any claim on this site.</p>')
    toc += [("how", "How voting works"), ("fairness", "What the poll can show"), ("privacy", "Privacy"), ("about", "About these concepts")]
    ld = {"@type": ["WebPage", "CollectionPage"], "isAccessibleForFree": True, "about": {"@type": "Thing", "name": "Project S.P.H.E.R.E. logo"},
          "primaryImageOfPage": {"@id": f"{url}#{items[0]['slug']}-image"},
          "mainEntity": {"@type": "ItemList", "@id": url + "#items", "name": p["title"], "numberOfItems": len(ld_items), "itemListElement": ld_items}}
    html = page(base, p["title"], p["description"], p["title"] + ".",
                "Keep or drop each concept, rate it from 1 to 10, leave a note, or remix a mark with a text prompt. The marks are design proposals for the project identity.",
                body, toc, eyebrow="Community votes / Brand", parent=[("Community votes", "/vote/")], navkey="vote",
                extra_ld=ld, added=p["added"], crumb=p["short"], image=SITE + p["image"])
    write(base, wide(html))
    return sm_images


def hub_page(projects, counts):
    cards = "".join(
        f'<a href="/vote/{p["slug"]}/"><img class="vote-card-img" src="{p["image"]}" alt="Preview of the {esc(p["short"]).lower()} vote" width="1200" height="630" loading="lazy">'
        f'<span class="label">{esc(p["label"])} &middot; {counts[p["slug"]]} items</span><h3>{esc(p["short"])}</h3><p>{esc(p["hub_blurb"])}</p>'
        f'<span class="link-url">/vote/{p["slug"]}</span></a>' for p in projects)
    body = ('<div class="note"><strong>Informal polls.</strong> Votes here collect community preferences about the project\'s identity and public materials. '
            'They are not research and do not measure or validate anything about the experiment.</div>'
            '<h2 id="projects">Open votes</h2><p>Each vote is its own project with its own items, ballots and results.</p>'
            f'<div class="home-resource-grid link-grid vote-hub">{cards}</div>'
            '<h2 id="how">How votes work</h2><ul><li>Rate each item from 1 to 10 and choose Keep or Drop. Comments are optional.</li>'
            '<li>You get one ballot per item. A ballot is locked once submitted.</li>'
            '<li>Results show the mean rating, the share of Keep votes and the number of ballots.</li>'
            '<li>Some projects let you remix an item with a text prompt and add it to the pool.</li></ul>'
            '<h2 id="propose">Propose a vote</h2><p>To suggest a topic or a set of images for a future vote, use the <a href="/collaborate/">collaborate page</a>.</p>')
    ld = {"@type": ["WebPage", "CollectionPage"], "isAccessibleForFree": True,
          "mainEntity": {"@type": "ItemList", "name": "Community votes", "numberOfItems": len(projects), "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "url": f'{SITE}/vote/{p["slug"]}/', "name": p["title"]} for i, p in enumerate(projects)]}}
    html = page("/vote/", "Community votes on Project S.P.H.E.R.E.", "Vote, rate and comment on logo concepts and other public materials for Project S.P.H.E.R.E. Each vote is a separate project with its own results.",
                "Community votes.", "Help choose the project's public identity. Each vote is a separate project with its own items and results.",
                body, [("projects", "Open votes"), ("how", "How votes work"), ("propose", "Propose a vote")],
                eyebrow="Project / Community votes", parent=[], navkey="vote", extra_ld=ld, added=projects[0]["added"], crumb="Community votes",
                image=SITE + projects[0]["image"])
    write("/vote/", wide(html))


def worker_projects(projects, items_by):
    out = {p["slug"]: {"items": [i["id"] for i in items_by[p["slug"]]], "remix": bool(p.get("remix"))} for p in projects}
    (ROOT / "worker/projects.js").write_text("// Generated by tools/build-vote.py. Do not edit.\nexport const PROJECTS = " + json.dumps(out, indent=1) + ";\n")
    print("wrote worker/projects.js")


def sitemap(projects, images_by, counts):
    p = ROOT / "sitemap.xml"
    x = p.read_text(encoding="utf-8")
    if "xmlns:image=" not in x:
        x = x.replace('<urlset ', '<urlset xmlns:image="http://www.google.com/schemas/image/1.1" ', 1)
    x = re.sub(r"<url><loc>https://spheredesci\.org/vote/.*?</url>\n?", "", x, flags=re.S)
    entries = f'<url><loc>{SITE}/vote/</loc><lastmod>{projects[0]["added"]}</lastmod></url>\n'
    for pr in projects:
        imgs = "".join(f"<image:image><image:loc>{esc(u)}</image:loc><image:title>{esc(t)}</image:title><image:caption>{esc(c)}</image:caption></image:image>" for u, t, c in images_by[pr["slug"]])
        entries += f'<url><loc>{SITE}/vote/{pr["slug"]}/</loc><lastmod>{pr["added"]}</lastmod>{imgs}</url>\n'
    x = x.replace("</urlset>", entries + "</urlset>")
    p.write_text(x, encoding="utf-8")
    print("updated sitemap.xml")


def main():
    projects = json.loads((ROOT / "data/vote/projects.json").read_text(encoding="utf-8"))
    items_by = {p["slug"]: json.loads((ROOT / "data/vote" / p["items"]).read_text(encoding="utf-8")) for p in projects}
    images_by = {p["slug"]: project_page(p, items_by[p["slug"]]) for p in projects}
    counts = {k: len(v) for k, v in items_by.items()}
    hub_page(projects, counts)
    worker_projects(projects, items_by)
    sitemap(projects, images_by, counts)


if __name__ == "__main__":
    main()
