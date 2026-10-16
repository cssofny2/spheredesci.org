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
# Canvas for every standalone logo file: 3:2, so stacked, side-by-side and icon-only lockups all fit.
CW, CH, PAD, MAX_SCALE = 480, 320, 28, 1.25
TYPE = ROOT / "data/vote/logo-concepts-type.json"

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def lockup_svg(item, inner, theme, lk, sig_d=None):
    """One standalone lockup: mark + wordmark + tagline, laid out as measured in the source logo rounds.

    lk (from logo-concepts-type.json): w/h of the lockup box, ic = [x, y, size] of the mark inside it,
    runs = outlined text paths (Space Grotesk, Chakra Petch, Sora or IBM Plex Mono, all SIL OFL),
    dots = [cx, cy, r] accent dots, sig = [x, y, w, h] of the signal line. Text is outlined so it renders
    identically inside <img> tags, where web fonts cannot load.
    """
    bg, fg, ac, _ = THEMES[theme]
    inner = inner or ""
    defs = "".join(g for k, g in GRADIENTS.items() if f"url(#{k})" in inner)
    s = min(MAX_SCALE, (CW - 2 * PAD) / lk["w"], (CH - 2 * PAD) / lk["h"])
    tx, ty = (CW - lk["w"] * s) / 2, (CH - lk["h"] * s) / 2
    css = (f"svg{{--bg:{bg};--fg:{fg};--ac:{ac}}}.bg{{fill:{bg}}}"
           f".ic{{fill:none;stroke:{fg};stroke-width:3;stroke-linecap:round;stroke-linejoin:round;color:{fg}}}"
           f".a{{stroke:{ac}}}.af{{fill:{ac};stroke:none}}.nf{{fill:{fg};stroke:none}}.hb{{fill:{bg};stroke:none}}"
           f".wm{{fill:{fg}}}.tg{{fill:{fg};fill-opacity:.9}}"
           f".sig{{fill:none;stroke:{ac};stroke-width:2;stroke-linecap:round}}")
    g = ""
    if "ic" in lk:
        x, y, w = lk["ic"]
        g += f'<g id="mark" class="ic" transform="translate({x:g} {y:g}) scale({w / 120:.5f})">{inner}</g>'
    g += '<g id="type">'
    for r in lk["runs"]:
        g += f'<path class="{r["k"]}" d="{r["d"]}"/>'
    for cx, cy, rr in lk["dots"]:
        g += f'<circle class="af" cx="{cx:g}" cy="{cy:g}" r="{rr:g}"/>'
    if "sig" in lk:
        x, y, w, h = lk["sig"]
        g += f'<path class="sig" transform="translate({x:g} {y:g}) scale({w / 380:.5f} {h / 44:.5f})" d="{sig_d}"/>'
    g += "</g>"
    words = "S.P.H.E.R.E. wordmark" if lk["runs"] else "icon only"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CW} {CH}" width="{CW}" height="{CH}" role="img">'
            f'<title>{esc(item["name"])} logo concept</title><desc>{esc(item["note"])} Lockup: {words}.</desc>'
            f'<style>{css}</style>{"<defs>" + defs + "</defs>" if defs else ""}'
            f'<rect class="bg" width="{CW}" height="{CH}"/>'
            f'<g transform="translate({tx:.2f} {ty:.2f}) scale({s:.4f})">{g}</g></svg>\n')

def main():
    src = json.loads(SRC.read_text())
    type_data = json.loads(TYPE.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.svg"):
        old.unlink()
    items, seen = [], set()
    for s in src:
        slug = slugify(s["name"])
        assert slug not in seen, slug
        seen.add(slug)
        m = re.search(r'<svg class="ic"[^>]*>([\s\S]*?)</svg>', s["html"])
        sig = re.search(r'<path d="(M0 22[^"]+)"', s["html"]) if not m else None
        svg = lockup_svg(s, m.group(1) if m else "", s["th"], type_data[s["id"]], sig.group(1) if sig else None)
        (OUT / f"{slug}.svg").write_text(svg)
        items.append({
            "id": s["id"], "slug": slug, "name": s["name"], "set": s["set"], "group": s["group"],
            "note": s["note"].strip(), "theme": THEMES[s["th"]][3], "remix": bool(m),
        })
    (ROOT / "data/vote/logo-concepts.json").write_text(json.dumps(items, indent=1, ensure_ascii=False) + "\n")
    print(len(items), "logos")

if __name__ == "__main__":
    main()
