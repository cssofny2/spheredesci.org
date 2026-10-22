#!/usr/bin/env python3
"""GEO (generative engine optimization) build step. Idempotent and build-time only.

Reads data/geo.json and, for each listed page:
  * summary - injects a short "key facts" list near the top (the AI-crawler summary block);
  * faqs    - injects a visible FAQ section (the reusable FAQSection) and a matching FAQPage node
              in the page's JSON-LD graph;
  * faqs_from_page - builds the FAQPage node from the page's existing <details class="faq-item">
              blocks, so schema always matches visible text.
It also makes sure every page loads the first-party aggregate analytics script.

Usage: python3 tools/build-geo.py [--check]
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://spheredesci.org"
LD_RE = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
SUMMARY_RE = re.compile(r"<!--geo-summary:start-->.*?<!--geo-summary:end-->", re.S)
FAQ_RE = re.compile(r"<!--geo-faq:start-->.*?<!--geo-faq:end-->", re.S)
ANALYTICS_TAG = '<script src="/assets/analytics.js" defer></script>'


def esc(text):
    return html.escape(text, quote=True)


def plain(fragment):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", fragment))).strip()


def summary_block(title, bullets):
    items = "".join("<li>%s</li>" % b for b in bullets)
    return ('<!--geo-summary:start--><aside class="geo-summary" aria-label="%s"><h2>%s</h2><ul>%s</ul></aside><!--geo-summary:end-->'
            % (esc(title), esc(title), items))


def faq_section(items, heading="Frequently asked questions", section_id="page-faq"):
    """Reusable FAQSection: returns (visible HTML, FAQPage JSON-LD node) for [{question, answer}, ...]."""
    body = "".join(
        '<details class="faq-item"><summary>%s</summary><p>%s</p></details>' % (esc(i["question"]), i["answer"])
        for i in items
    )
    markup = ('<!--geo-faq:start--><section class="geo-faq" aria-labelledby="%s"><h2 id="%s">%s</h2>%s</section><!--geo-faq:end-->'
              % (section_id, section_id, esc(heading), body))
    return markup, faq_node(items)


def faq_node(items):
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": plain(i["question"]),
             "acceptedAnswer": {"@type": "Answer", "text": plain(i["answer"])}}
            for i in items
        ],
    }


def page_faqs(page_html):
    return [
        {"question": plain(m.group(1)), "answer": m.group(2)}
        for m in re.finditer(r'<details class="faq-item"><summary>(.*?)</summary><p>(.*?)</p></details>', page_html, re.S)
    ]


def set_faq_schema(page_html, node, url):
    def repl(m):
        try:
            data = json.loads(m.group(2))
        except ValueError:
            return m.group(0)
        graph = data.get("@graph")
        if graph is None:
            return m.group(0)
        graph[:] = [n for n in graph if n.get("@type") != "FAQPage"]
        node_out = dict(node)
        node_out["@id"] = url + "#faq"
        graph.append(node_out)
        return m.group(1) + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + m.group(3)

    return LD_RE.sub(repl, page_html, count=1)


def insert_after(page_html, anchor, block):
    h1_end = page_html.find("</h1>")
    if h1_end < 0:
        raise ValueError("no <h1>")
    if anchor == "after_h1":
        pos = h1_end + len("</h1>")
    else:
        p_end = page_html.find("</p>", h1_end)
        if p_end < 0:
            raise ValueError("no paragraph after <h1>")
        pos = p_end + len("</p>")
    return page_html[:pos] + block + page_html[pos:]


def process(route, cfg, check):
    path = ROOT / route.strip("/") / "index.html" if route != "/" else ROOT / "index.html"
    page = path.read_text(encoding="utf-8")
    original = page
    url = SITE + route

    page = SUMMARY_RE.sub("", page)
    page = FAQ_RE.sub("", page)
    if cfg.get("summary"):
        page = insert_after(page, cfg.get("anchor", "after_p"), summary_block(cfg.get("summary_title", "Key facts"), cfg["summary"]))

    if cfg.get("faqs"):
        markup, node = faq_section(cfg["faqs"], cfg.get("faq_title", "Frequently asked questions"))
        marker = "</main>" if "</main>" in page else None
        if marker is None:
            raise ValueError(route + ": no </main> to place the FAQ section before")
        page = page.replace(marker, markup + marker, 1)
        page = set_faq_schema(page, node, url)
    elif cfg.get("faqs_from_page"):
        items = page_faqs(page)
        if items:
            page = set_faq_schema(page, faq_node(items), url)

    if page != original and not check:
        path.write_text(page, encoding="utf-8", newline="")
    return page != original


def ensure_analytics(check):
    changed = 0
    skip = {"node_modules", "data", "worker", "tools", "content", "migrations", "admin", "analytics"}
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if rel.parts[0].startswith(".") or rel.parts[0] in skip or rel.name == "panton.html":
            continue
        page = path.read_text(encoding="utf-8")
        if "/assets/analytics.js" in page or "</head>" not in page:
            continue
        changed += 1
        if not check:
            path.write_text(page.replace("</head>", ANALYTICS_TAG + "</head>", 1), encoding="utf-8", newline="")
    return changed


def main():
    check = "--check" in sys.argv
    config = json.loads((ROOT / "data" / "geo.json").read_text(encoding="utf-8"))
    changed = [r for r, cfg in config["pages"].items() if process(r, cfg, check)]
    analytics = ensure_analytics(check)
    print(("Would update" if check else "Updated"), len(changed), "GEO pages and", analytics, "analytics tags")
    if check and (changed or analytics):
        sys.exit(1)


if __name__ == "__main__":
    main()
