#!/usr/bin/env python3
"""Build the standalone SVG files and item list for the logo-concepts vote project.

Source:  data/vote/logo-concepts-source.json  (marks exported from the six logo rounds)
Output:  assets/vote/logo-concepts/<slug>.svg  and  data/vote/logo-concepts.json
Run from the repository root:  python3 tools/make-vote-logos.py
Then run:                      python3 tools/build-vote.py
"""
import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data/vote/logo-concepts-source.json"
OUT = ROOT / "assets/vote/logo-concepts"
THEMES = {
    "L": ("#f3f4f5", "#10151b", "#b8651f", "light"),
    "D": ("#10151b", "#f3f4f5", "#e8944a", "dark"),
    "C": ("#b8651f", "#10151b", "#f8e6d2", "copper"),
    "N": ("#0e2a3a", "#e9f1f4", "#f0a25a", "navy"),
}
GRADIENTS = {
    "cu": '<linearGradient id="cu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2b27c"/><stop offset=".5" stop-color="#b8651f"/><stop offset="1" stop-color="#6a3512"/></linearGradient>',
    "orb": '<radialGradient id="orb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd9b0"/><stop offset=".35" stop-color="#d2812f"/><stop offset=".75" stop-color="#8a4413"/><stop offset="1" stop-color="#4a230a"/></radialGradient>',
}
# Geometric stroke letters (12 x 20 boxes) for the type-only Pulse Wordmark, which has no icon mark.
LETTERS = {
    "S": "M10 5C10 0 2 0 2 5C2 10.5 10 9.5 10 15C10 20.5 2 20.5 2 15",
    "P": "M2 20V2H7C11.5 2 11.5 11 7 11H2",
    "H": "M2 2V20M10 2V20M2 11H10",
    "E": "M10 2H2V20H10M2 11H8",
    "R": "M2 20V2H7C11.5 2 11.5 11 7 11H2M7 11L10 20",
}

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def svg_file(item, inner, theme):
    bg, fg, ac, _ = THEMES[theme]
    defs = "".join(g for k, g in GRADIENTS.items() if f"url(#{k})" in inner)
    css = (f"svg{{--bg:{bg};--fg:{fg};--ac:{ac}}}.bg{{fill:{bg}}}"
           f".ic{{fill:none;stroke:{fg};stroke-width:3;stroke-linecap:round;stroke-linejoin:round;color:{fg}}}"
           f".a{{stroke:{ac}}}.af{{fill:{ac};stroke:none}}.nf{{fill:{fg};stroke:none}}.hb{{fill:{bg};stroke:none}}")
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 160 160" width="320" height="320" role="img">'
            f'<title>{esc(item["name"])} logo concept</title><desc>{esc(item["note"])}</desc>'
            f'<style>{css}</style>{"<defs>" + defs + "</defs>" if defs else ""}'
            f'<rect class="bg" x="-20" y="-20" width="160" height="160"/><g id="mark" class="ic">{inner}</g></svg>\n')

def pulse_svg(item, sig_d):
    bg, fg, ac, _ = THEMES[item["th"]]
    x = 0
    parts = []
    for ch in "SPHERE":
        parts.append(f'<path transform="translate({x} 34)" d="{LETTERS[ch]}"/>')
        parts.append(f'<circle class="af" cx="{x + 15}" cy="52" r="1.8"/>')
        x += 20
    css = (f".bg{{fill:{bg}}}.t{{fill:none;stroke:{fg};stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}}"
           f".af{{fill:{ac};stroke:none}}.sig{{fill:none;stroke:{ac};stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}}")
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 160 160" width="320" height="320" role="img">'
            f'<title>{esc(item["name"])} logo concept</title><desc>{esc(item["note"])}</desc><style>{css}</style>'
            '<rect class="bg" x="-20" y="-20" width="160" height="160"/>'
            f'<g class="t">{"".join(parts)}</g>'
            f'<path class="sig" transform="translate(0 66) scale(.316 .8)" d="{sig_d}"/></svg>\n')

def main():
    src = json.loads(SRC.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    items, seen = [], set()
    for s in src:
        slug = slugify(s["name"])
        assert slug not in seen, slug
        seen.add(slug)
        m = re.search(r'<svg class="ic"[^>]*>([\s\S]*?)</svg>', s["html"])
        if m:
            svg = svg_file(s, m.group(1), s["th"])
        else:
            sig = re.search(r'<path d="(M0 22[^"]+)"', s["html"]).group(1)
            svg = pulse_svg(s, sig)
        (OUT / f"{slug}.svg").write_text(svg)
        items.append({
            "id": s["id"], "slug": slug, "name": s["name"], "set": s["set"], "group": s["group"],
            "note": s["note"].strip(), "theme": THEMES[s["th"]][3], "remix": bool(m),
        })
    (ROOT / "data/vote/logo-concepts.json").write_text(json.dumps(items, indent=1, ensure_ascii=False) + "\n")
    print(len(items), "logos")

if __name__ == "__main__":
    main()
