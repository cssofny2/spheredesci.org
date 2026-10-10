#!/usr/bin/env python3
"""Generates the original SPHEREVL link art (assets/vl/vl-banner.svg, vl-og.svg).

Original illustration: a cutaway hollow copper sphere on a scan grid inside a wireframe
chamber, a laser-vibrometer beam and a modeled resonance dip. No third-party artwork, no
photographs, no manufacturer marks. Run: python3 tools/make-vl-art.py
"""
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "vl"


def dip_path(x0, x1, y_base, depth, cx, width, n=160):
    pts = []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        lor = 1 / (1 + ((x - cx) / width) ** 2)
        ripple = math.sin(i * 1.7) * 1.4 + math.sin(i * 0.63) * 1.1
        pts.append(f"{x:.1f},{y_base + depth * lor + ripple:.1f}")
    return "M" + " L".join(pts)


def iso(x, y, z, ox, oy, s):
    """Simple isometric projection (x right-down, y left-down, z up)."""
    return (ox + (x - y) * s * 0.866, oy + (x + y) * s * 0.5 - z * s)


def art(w, h, text=False, *, ox=None, oy=None, s=None, chart=(0.60, 0.96, 0.60)):
    ox, oy, s = ox or w * 0.36, oy or h * 0.50, s or h * 0.19
    # chamber box corners (wireframe)
    c = lambda x, y, z: iso(x, y, z, ox, oy, s)
    B = [(-1.5, -1.5, 0), (1.5, -1.5, 0), (1.5, 1.5, 0), (-1.5, 1.5, 0)]
    T = [(-1.5, -1.5, 2.6), (1.5, -1.5, 2.6), (1.5, 1.5, 2.6), (-1.5, 1.5, 2.6)]
    poly = lambda pts: " ".join(f"{c(*p)[0]:.1f},{c(*p)[1]:.1f}" for p in pts)
    edges = "".join(f'<line x1="{c(*b)[0]:.1f}" y1="{c(*b)[1]:.1f}" x2="{c(*t)[0]:.1f}" y2="{c(*t)[1]:.1f}"/>' for b, t in zip(B, T))
    # scan grid on the floor (5x5 points)
    dots = ""
    for i in range(5):
        for j in range(5):
            x, y = -1.0 + i * 0.5, -1.0 + j * 0.5
            px, py = c(x, y, 0.02)
            hot = (i, j) == (2, 2)
            dots += f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{3.6 if hot else 2.1}" fill="{"#22d3ee" if hot else "#22d3ee"}" opacity="{1 if hot else .55}"/>'
    gridlines = ""
    for k in range(7):
        v = -1.5 + k * 0.5
        a, b = c(v, -1.5, 0.01), c(v, 1.5, 0.01)
        d, e = c(-1.5, v, 0.01), c(1.5, v, 0.01)
        gridlines += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/><line x1="{d[0]:.1f}" y1="{d[1]:.1f}" x2="{e[0]:.1f}" y2="{e[1]:.1f}"/>'
    sx, sy = c(0, 0, 1.0)  # sphere centre
    r = s * 0.78
    # beam source (top right) to sphere surface
    bx, by = w * (0.74 if not text else 0.80), h * 0.06
    # dip chart region
    cx0, cx1 = w * chart[0], w * chart[1]
    cy_base = h * chart[2]
    dip = dip_path(cx0, cx1, cy_base, h * 0.20, (cx0 + cx1) / 2, (cx1 - cx0) * 0.045)
    ticks = "".join(f'<line x1="{cx0 + (cx1-cx0)*i/6:.1f}" y1="{cy_base + h*0.255:.1f}" x2="{cx0 + (cx1-cx0)*i/6:.1f}" y2="{cy_base + h*0.27:.1f}"/>' for i in range(7))
    mid = (cx0 + cx1) / 2
    label = ""
    if text:
        label = f'''<g font-family="Inter,Arial,sans-serif" fill="#e2e8f0">
<text x="{w*0.06:.0f}" y="{h*0.80:.0f}" font-size="{h*0.115:.0f}" font-weight="800" letter-spacing="2">SPHERE<tspan fill="#22d3ee">VL</tspan></text>
<text x="{w*0.06:.0f}" y="{h*0.88:.0f}" font-size="{h*0.044:.0f}" fill="#a6b1c1" letter-spacing="3">VISUAL LAB · EDUCATIONAL SIMULATION</text></g>'''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Illustration of a cutaway hollow copper sphere on a scan grid inside a wireframe vacuum chamber, a laser beam, and a modeled resonance dip.">
<title>SPHEREVL visual lab illustration</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05070a"/><stop offset=".55" stop-color="#0a1220"/><stop offset="1" stop-color="#0d1c2c"/></linearGradient>
<radialGradient id="cu" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#f7d2b8"/><stop offset=".3" stop-color="#e49b73"/><stop offset=".72" stop-color="#a35025"/><stop offset="1" stop-color="#4a210c"/></radialGradient>
<radialGradient id="cuin" cx="60%" cy="60%" r="70%"><stop offset="0" stop-color="#2b1408"/><stop offset="1" stop-color="#080403"/></radialGradient>
<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e49b73" stop-opacity=".38"/><stop offset="1" stop-color="#e49b73" stop-opacity="0"/></radialGradient>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#facc15" stop-opacity="0"/><stop offset="1" stop-color="#fde68a"/></linearGradient>
<filter id="gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#22d3ee" opacity=".12"/></pattern>
<clipPath id="wedge"><path d="M{sx:.1f},{sy:.1f} L{sx + r*1.4:.1f},{sy - r*0.1:.1f} L{sx + r*1.4:.1f},{sy + r*1.4:.1f} L{sx + r*0.1:.1f},{sy + r*1.4:.1f} Z"/></clipPath>
</defs>
<rect width="{w}" height="{h}" fill="url(#bg)"/><rect width="{w}" height="{h}" fill="url(#dots)"/>
<g aria-hidden="true">
<g stroke="#22d3ee" stroke-opacity=".16" stroke-width="1">{gridlines}</g>
<polygon points="{poly(B)}" fill="#0b1626" fill-opacity=".55" stroke="#22d3ee" stroke-opacity=".5" stroke-width="1.4"/>
<g stroke="#22d3ee" stroke-opacity=".3" stroke-width="1.2">{edges}</g>
<polygon points="{poly(T)}" fill="none" stroke="#22d3ee" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="6 5"/>
{dots}
<circle cx="{sx:.1f}" cy="{sy:.1f}" r="{r*1.7:.1f}" fill="url(#halo)"/>
<line x1="{sx:.1f}" y1="{sy + r:.1f}" x2="{sx:.1f}" y2="{c(0,0,0)[1]:.1f}" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
<circle cx="{sx:.1f}" cy="{sy:.1f}" r="{r:.1f}" fill="url(#cu)"/>
<g clip-path="url(#wedge)"><circle cx="{sx:.1f}" cy="{sy:.1f}" r="{r:.1f}" fill="url(#cuin)"/>
<circle cx="{sx:.1f}" cy="{sy:.1f}" r="{r*0.86:.1f}" fill="none" stroke="#e49b73" stroke-opacity=".5" stroke-width="2"/></g>
<path d="M{sx:.1f},{sy:.1f} L{sx + r:.1f},{sy:.1f} M{sx:.1f},{sy:.1f} L{sx:.1f},{sy + r:.1f}" stroke="#f5c7a9" stroke-opacity=".7" stroke-width="1.6" fill="none"/>
<circle cx="{sx:.1f}" cy="{sy:.1f}" r="{r:.1f}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2"/>
<line x1="{bx:.1f}" y1="{by:.1f}" x2="{sx + r*0.55:.1f}" y2="{sy - r*0.62:.1f}" stroke="url(#beam)" stroke-width="5" filter="url(#gl)" opacity=".8"/>
<line x1="{bx:.1f}" y1="{by:.1f}" x2="{sx + r*0.55:.1f}" y2="{sy - r*0.62:.1f}" stroke="#fde68a" stroke-width="1.6"/>
<circle cx="{sx + r*0.55:.1f}" cy="{sy - r*0.62:.1f}" r="5" fill="#fde68a"/>
<g stroke="#22d3ee" stroke-opacity=".45" stroke-width="1"><line x1="{cx0:.1f}" y1="{cy_base - h*0.1:.1f}" x2="{cx0:.1f}" y2="{cy_base + h*0.255:.1f}"/><line x1="{cx0:.1f}" y1="{cy_base + h*0.255:.1f}" x2="{cx1:.1f}" y2="{cy_base + h*0.255:.1f}"/>{ticks}
<line x1="{mid:.1f}" y1="{cy_base - h*0.1:.1f}" x2="{mid:.1f}" y2="{cy_base + h*0.255:.1f}" stroke-dasharray="3 5" stroke-opacity=".3"/></g>
<path d="{dip}" fill="none" stroke="#22d3ee" stroke-width="5" opacity=".35" filter="url(#gl)"/>
<path d="{dip}" fill="none" stroke="#67e8f9" stroke-width="2.2" stroke-linejoin="round"/>
<circle cx="{mid:.1f}" cy="{cy_base + h*0.20 + 0:.1f}" r="5" fill="#e49b73" stroke="#fff" stroke-width="1.2"/>
<g stroke="#e49b73" stroke-opacity=".9" stroke-width="2" fill="none"><path d="M16 38 V16 H38"/><path d="M{w-16} 38 V16 H{w-38}"/><path d="M16 {h-38} V{h-16} H38"/><path d="M{w-16} {h-38} V{h-16} H{w-38}"/></g>
{label}
</g></svg>'''


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "vl-banner.svg").write_text(art(1200, 360, ox=1200 * 0.60, oy=360 * 0.667, s=360 * 0.15, chart=(0.77, 0.97, 0.36)), encoding="utf-8")
    (OUT / "vl-og.svg").write_text(art(1200, 630, text=True, ox=1200 * 0.40, oy=630 * 0.45, s=630 * 0.15, chart=(0.62, 0.95, 0.46)), encoding="utf-8")
    print("wrote vl-banner.svg, vl-og.svg")
