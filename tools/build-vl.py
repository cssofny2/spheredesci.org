#!/usr/bin/env python3
"""Builds /vl/ (SPHEREVL visual lab) from a repository snapshot.

    python3 tools/build-vl.py --snapshot /path/to/sphere-control-room-v2   # refresh data/vl-repo.json from git
    python3 tools/build-vl.py                                              # regenerate vl/index.html

The snapshot records only facts readable from a git checkout (commits, file sizes, package.json,
workflow files). Stars, forks, open issues and pull-request counts are NOT in a checkout and are
deliberately not displayed: link to the live repository instead of publishing stale numbers.
"""
import importlib.util, json, re, subprocess, sys
from collections import OrderedDict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "vl-repo.json"
REPO_URL = "https://github.com/cssofny2/sphere-control-room-v2"
LAB_URL = "https://lab.spheredesci.org"
UPDATED = "2026-10-09"

_spec = importlib.util.spec_from_file_location("bd", ROOT / "tools" / "build-directory.py")
bd = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bd)
esc, human, tag = bd.esc, bd.human, bd.tag


# --------------------------------------------------------------------------- snapshot
def git(repo, *args):
    return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True, text=True).stdout


def lines(path):
    return len(path.read_text(encoding="utf-8", errors="replace").splitlines())


def snapshot(repo):
    repo = Path(repo)
    commits = []
    for row in git(repo, "log", "--no-merges", "--format=%H\x1f%ad\x1f%an\x1f%s", "--date=format:%Y-%m-%d %H:%M").splitlines():
        sha, when, author, subject = row.split("\x1f")
        commits.append({"sha": sha, "date": when[:10], "time": when[11:], "author": author, "subject": subject})
    merges = [r for r in git(repo, "log", "--merges", "--format=%h|%s").splitlines()]
    prs = sorted({int(m) for m in re.findall(r"#(\d+)", git(repo, "log", "--format=%s"))}
                 | {int(m) for m in re.findall(r"pull request #(\d+)", git(repo, "log", "--merges", "--format=%s"))})
    files = [f for f in git(repo, "ls-files").splitlines() if f != "package-lock.json"]
    def loc(pred): return sum(lines(repo / f) for f in files if pred(f) and (repo / f).is_file())
    pkg = json.loads((repo / "package.json").read_text())
    co = sum(1 for b in git(repo, "log", "--format=%b%x00").split("\0") if re.search(r"Co-Authored-By: Claude", b, re.I))
    authors = OrderedDict()
    for a in git(repo, "log", "--format=%an").splitlines(): authors[a] = authors.get(a, 0) + 1
    readme = (repo / "README.md").read_text(encoding="utf-8")
    snap = {
        "repo": "cssofny2/sphere-control-room-v2", "branch": "main", "head": git(repo, "rev-parse", "HEAD").strip(),
        "head_short": git(repo, "rev-parse", "--short", "HEAD").strip(), "head_date": git(repo, "log", "-1", "--format=%ad", "--date=short").strip(),
        "commit_total": int(git(repo, "rev-list", "--count", "HEAD").strip()), "merge_commits": len(merges),
        "first_commit": commits[-1]["date"], "last_commit": git(repo, "log", "-1", "--format=%ad", "--date=short").strip(),
        "pr_numbers": prs, "authors": authors, "claude_coauthored": co,
        "tracked_files": len(files),
        "loc": {"app_v3": loc(lambda f: f == "src/MetrologyLabV3.tsx"), "app_legacy": loc(lambda f: f == "src/MetrologyLab.tsx"),
                "src_other": loc(lambda f: f.startswith("src/") and f not in ("src/MetrologyLabV3.tsx", "src/MetrologyLab.tsx") and f.endswith((".ts", ".tsx"))),
                "css": loc(lambda f: f.endswith(".css")), "tests": loc(lambda f: f.startswith("scripts/") and ".test." in f or f == "scripts/simulator-regression.mjs"),
                "workflows": loc(lambda f: f.startswith(".github/workflows/")), "all": loc(lambda f: True)},
        "node": (repo / ".nvmrc").read_text().strip(), "scripts": pkg["scripts"],
        "dependencies": pkg["dependencies"], "devDependencies": pkg["devDependencies"],
        "workflows": sorted(Path(f).name for f in files if f.startswith(".github/workflows/")),
        "license_file": any(Path(f).name.upper().startswith(("LICENSE", "COPYING")) for f in files),
        "has_vercel_json": "vercel.json" in files, "has_wrangler": "wrangler.jsonc" in files,
        "readme_limits": "CR-101 does not deliver" in readme,
        "commits": commits,
    }
    DATA.parent.mkdir(exist_ok=True)
    DATA.write_text(json.dumps(snap, indent=1, ensure_ascii=False), encoding="utf-8")
    print("snapshot", snap["head_short"], snap["commit_total"], "commits")


# --------------------------------------------------------------------------- page copy
FEATURES = OrderedDict([
    ("Operations", [
        ("Lab Overview", "A living diagram of the whole bench: every instrument, its operating state and the clock, laser, RF, data, vacuum and fault routes between them."),
        ("Operator Console", "At-a-glance facility status, resonance telemetry and quick actions, with a startup wizard and a recommended next action."),
        ("3D Chamber &amp; Stage", "Interactive 3D thermal-vacuum chamber and motorised XYZ stage: camera presets, cutaway, exploded and measurement-chain views, vacuum lifecycle and commanded-versus-actual stage motion."),
        ("AI Copilot", "A local, rule-based assistant. It is not a hosted AI model and not a significance test."),
    ]),
    ("Instruments", [
        ("Spatial Field Explorer", "Volumetric workspace for simulated records: resonance shifts, uncertainty and spatial coverage across X, Y and Z."),
        ("VNA Analysis", "Vector-network-analyzer panel with S11 trace, sweep controls, reference capture, calibration wizard and a Lorentzian fit readout."),
        ("LDV Scanner", "Scanning laser-Doppler-vibrometer panel with a displacement spectrum, shutter and scan configuration."),
        ("Oscilloscope", "Time-domain panel with timebase and channel scaling."),
        ("Frequency Reference", "Rubidium reference panel with warm-up and lock behaviour that other instruments depend on."),
    ]),
    ("Research", [
        ("Experiment Runs", "Validated scan plans and a ledger of simulated runs, driven by the CR-101 plan contract and CR-102 cancellable runner."),
        ("Lab Notebook", "Tagged notes with instrument snapshots and Markdown export. Notes survive breaker cycles but not a page reload."),
    ]),
    ("Learning", [
        ("Training &amp; Checklist", "A guided, automated 5&times;5 serpentine scan with stage settling, quality gates, bounded adaptive retries, pause, resume and abort, plus quality CSV and JSON exports."),
        ("Challenge Mode", "Troubleshooting scenarios built on the fault model."),
        ("Fault Injector", "Individual equipment faults and blind troubleshooting drills, for example Rubidium clock drift."),
    ]),
])

SHOTS = [
    ("vl-lab-overview", "Lab Overview", "The Living Lab Overview: every instrument is a node, and coloured routes show clock, laser, RF, data, vacuum and fault paths.", 1280, 645),
    ("vl-lab-chamber", "3D Chamber &amp; Stage", "The thermal-vacuum chamber's measurement-chain view, with the sample stage, optical window and instrument rack drawn as a conceptual model.", 1280, 691),
    ("vl-lab-vna", "VNA Analysis", "A modeled S11 resonance dip near 230.275&nbsp;kHz with a Lorentzian fit readout. The values are simulation output, not a measurement.", 1280, 845),
    ("vl-lab-ldv", "LDV Scanner", "The laser-vibrometer panel's modeled displacement spectrum peaking near 230.5&nbsp;kHz, with shutter and scan configuration.", 1280, 506),
]

FAQ = [
    ("What is SPHEREVL?", "The visual lab product brand of Project S.P.H.E.R.E. It builds interactive simulations and visual tools; the Control Room is its first featured experience."),
    ("Is this a real laboratory?", "No. The Control Room is an educational simulation. Its modeled outputs are not measurements from physical instruments, and the instrument panels are conceptual models rather than replicas of any manufacturer's product."),
    ("Does it prove the SPHERE hypothesis?", "No. Simulated outputs do not establish scientific validation or independent experimental replication. The hypothesis is tested only by the preregistered physical protocol."),
    ("What can I explore?", "Fourteen workspaces across operations, instruments, research and learning, listed above: instrument panels, a 3D chamber, scan planning and automation, simulated faults, a notebook and an experiment-run ledger."),
    ("Who is it for?", "People who want to understand how a resonance metrology experiment is run: students, prospective contributors and anyone reviewing the protocol. It is not a validated research instrument."),
    ("Is it finished?", "No. It is in active development; the history below shows 26 commits in six days and the limitations section lists what is not yet delivered."),
    ("Where do I open the application?", f'<a href="{LAB_URL}">lab.spheredesci.org</a>. This page, <a href="/vl/">spheredesci.org/vl</a>, is the public overview.'),
    ("Can I review the source?", f'Yes. The <a href="{REPO_URL}">public repository</a> holds the source, tests, workflows and commit history. No licence file is present in the repository as of this snapshot, so being public does not by itself grant permission to reuse the code.'),
    ("Does it connect to physical equipment?", "No. Nothing in the application drives, reads or is connected to physical hardware."),
    ("Does the application use analytics?", 'The repository includes Vercel Web Analytics (committed October 5, 2026). Whether collection is enabled in production is configured outside the repository, so this page does not assert it either way. See the <a href="/privacy/">privacy notice</a>.'),
    ("Do I need an account or a token?", "The reviewed application describes neither. This page is not an investment or token offering, and contributions buy no equity, token, royalty or financial return."),
    ("Is my work saved?", "Session data lives in your browser. Exports (CSV, JSON, Markdown) are generated locally. Notebook entries are lost on reload, so export what you need."),
    ("How can I contribute?", f'Submit reproducible bug reports, usability feedback, documentation corrections and feature suggestions through the <a href="{REPO_URL}/issues">issue tracker</a>. Do not include passwords, keys or personal information.'),
]


def commit_note(subject):
    """Plain-language explanation for a commit subject (only what the commit and README support)."""
    s = subject.lower()
    table = [
        ("initial commit", "Repository created."),
        ("add files via upload", "Application files added through the GitHub web uploader; the message does not describe individual features."),
        ("configure reproducible vercel", "Vercel build configuration and repository ignores."),
        ("sphere control room v3.0", "Updated simulator with TypeScript build fixes and portable asset paths."),
        ("web analytics", "Vercel Web Analytics added to the code. This records the integration, not that tracking is enabled."),
        ("scan automation", "Updated simulator with scan automation, equipment faults and a lab notebook."),
        ("compact workspace", "Resizable operations journal, instrument focus mode and tablet navigation drawer."),
        ("standardize sphere", "Official addresses documented; lab robots.txt and sitemap added."),
        ("cr-101", "Validated scan plans and a typed run contract: branded IDs, unit-aware settings, plan limits and rejection of invalid ranges."),
        ("cr 102", "A cancellable run engine with timer ownership, stale-run guards and cancellation cleanup."),
        ("stop tracking build output", "Build output (dist/) removed from version control."),
        ("run foundation validation", "Regression and build validation now run on pushes to main."),
        ("remove unreferenced legacy", "Unreferenced legacy source and a zip bundle removed."),
        ("tailwind css 4", "Upgraded to Tailwind CSS 4; cleared the reported npm audit advisories."),
        ("pin 'latest'", "Floating &lsquo;latest&rsquo; dependency specifiers replaced with caret ranges of the locked versions."),
        ("vendor chunks", "React and chart libraries split into separate bundles, clearing the 500&nbsp;kB build warning."),
    ]
    for key, text in table:
        if key in s: return text
    return ""


def timeline(snap):
    by_day = OrderedDict()
    for c in snap["commits"]:
        by_day.setdefault(c["date"], []).append(c)
    out = ""
    for day, cs in by_day.items():
        out += f'<li><time datetime="{day}">{human(day)}</time><ul class="vl-commits">'
        for c in cs:
            subj = re.sub(r"\s*\(#(\d+)\)$", "", c["subject"])
            pr = re.search(r"\(#(\d+)\)$", c["subject"])
            note = commit_note(c["subject"])
            prl = f' <a class="vl-pr" href="{REPO_URL}/pull/{pr.group(1)}">PR&nbsp;#{pr.group(1)}</a>' if pr else ""
            who = "" if c["author"] == "Michael P Goodman" else f' <span class="vl-by">by {esc(c["author"])}</span>'
            out += (f'<li><a href="{REPO_URL}/commit/{c["sha"]}"><code>{c["sha"][:7]}</code></a> <strong>{esc(subj)}</strong>{prl}{who}'
                    + (f'<br><span class="vl-note">{note}</span>' if note else "") + "</li>")
        out += "</ul></li>"
    return f'<ol class="vl-days">{out}</ol>'


def stat(value, label): return f'<div class="vl-stat"><strong>{value}</strong><span>{label}</span></div>'


def build():
    snap = json.loads(DATA.read_text(encoding="utf-8"))
    loc, deps, dev = snap["loc"], snap["dependencies"], snap["devDependencies"]
    ver = lambda v: v.lstrip("^~")
    prs = snap["pr_numbers"]
    n_prs = len(prs)
    first, last = snap["first_commit"], snap["last_commit"]
    src_total = loc["app_v3"] + loc["app_legacy"] + loc["src_other"]

    stats = "".join([
        stat(snap["commit_total"], f"commits on <code>main</code>, {human(first)} to {human(last)}"),
        stat(n_prs, f"pull requests referenced in history (#{prs[0]}&ndash;#{prs[-1]})"),
        stat(f'{src_total:,}', "lines of TypeScript and TSX source"),
        stat("14", "simulator workspaces"),
        stat("4 + 1", "regression suites plus a 24-case mounted lifecycle suite"),
        stat(snap["node"] + ".x", "Node.js target"),
    ])

    shots = ""
    for i, (name, title, cap, w, h) in enumerate(SHOTS):
        shots += (f'<figure class="vl-shot"><a href="/assets/vl/{name}.webp"><img src="/assets/vl/{name}.webp" width="{w}" height="{h}" '
                  f'alt="Screenshot of the simulator&rsquo;s {title} workspace" loading="{"eager" if i == 0 else "lazy"}" decoding="async"></a>'
                  f'<figcaption><strong>{title}.</strong> {cap}</figcaption></figure>')

    feats = ""
    for group, items in FEATURES.items():
        feats += f'<h3>{group}</h3><div class="vl-feats">' + "".join(f'<div class="vl-feat"><h4>{t}</h4><p>{d}</p></div>' for t, d in items) + "</div>"

    stack_rows = [
        ("Build tooling", f'Vite {ver(dev["vite"])}, TypeScript {ver(dev["typescript"])}'),
        ("UI", f'React {ver(deps["react"])}, Tailwind CSS {ver(deps["tailwindcss"])}, lucide-react {ver(deps["lucide-react"])}'),
        ("Charts", f'Recharts {ver(deps["recharts"])}'),
        ("Analytics", f'@vercel/analytics {ver(deps["@vercel/analytics"])} (integration committed; production configuration not asserted)'),
        ("Runtime target", f'Node.js {snap["node"]}.x (<code>.nvmrc</code>, <code>package.json</code> engines)'),
        ("Hosting", "Vercel build configuration (<code>vercel.json</code>) with Cloudflare Worker configuration also present; the production lab address is lab.spheredesci.org"),
        ("CI", "GitHub Actions: foundation validation on pushes to main and pull requests (locked install, regression suites, mounted lifecycle tests, type-check and production build, whitespace check) plus a restricted PR&nbsp;#6 sweep-publisher workflow"),
        ("Licence file", "None in the repository at this snapshot" if not snap["license_file"] else "Present"),
    ]
    stack = "".join(f"<tr><th scope=row>{a}</th><td>{b}</td></tr>" for a, b in stack_rows)

    authors = ", ".join(f'{esc(a)} ({n})' for a, n in snap["authors"].items())

    body = f'''
<div class="vl-hero"><img src="/assets/vl/vl-banner.svg" width="1200" height="360" alt="Illustration of a cutaway hollow copper sphere on a scan grid inside a wireframe vacuum chamber, with a laser beam and a modeled resonance dip" decoding="async">
<div class="vl-hero-copy"><p>SPHEREVL is the visual lab brand of Project S.P.H.E.R.E. Its first experience, the <strong>S.P.H.E.R.E. Control Room</strong>, is a browser-based metrology laboratory simulator: a thermal-vacuum chamber, a Rubidium frequency reference, a vector network analyzer, a laser Doppler vibrometer and a scan planner you can operate, break and troubleshoot.</p>
<p><a class="vl-btn" href="{LAB_URL}">Launch the Control Room</a> <a class="vl-btn alt" href="#gallery">See it first</a> <a class="vl-btn alt" href="{REPO_URL}">View source on GitHub</a></p></div></div>
<aside class="vl-callout"><strong>Educational simulation, not physical measurements.</strong> Modeled results are not scientific validation and are not evidence for or against the locational-variable hypothesis. No physical equipment is connected.</aside>

<section id="snapshot"><h2>Repository at a glance</h2>
<p>Facts below are read from the public repository <a href="{REPO_URL}">{snap["repo"]}</a> at <code>main</code> commit <a href="{REPO_URL}/commit/{snap["head"]}"><code>{snap["head_short"]}</code></a> ({human(snap["head_date"])}). Live figures such as stars, forks and open issues change continuously and are therefore shown on GitHub rather than copied here.</p>
<div class="vl-stats">{stats}</div>
<table class="vl-table"><caption class="sr-only">Technology and delivery facts</caption><tbody>{stack}
<tr><th scope=row>Commit authors</th><td>{authors}. {snap["claude_coauthored"]} of {snap["commit_total"]} commits (maintenance work on October 8) carry a Claude co-author trailer.</td></tr>
<tr><th scope=row>Tracked files</th><td>{snap["tracked_files"]} files excluding the lockfile; about {loc["all"]:,} lines in total, of which the active v3 simulator is {loc["app_v3"]:,}, the retained earlier simulator {loc["app_legacy"]:,} (not imported by the entry point), domain and simulation modules {loc["src_other"]:,}, and test scripts {loc["tests"]:,}.</td></tr></tbody></table>
<p class="vl-stamp">Data snapshot: {human(snap["head_date"])} head, reviewed <time datetime="{UPDATED}">{human(UPDATED)}</time>.</p></section>

<section id="gallery"><h2>Inside the virtual lab</h2>
<p>These images are screenshots of the real application, built from the repository at <code>{snap["head_short"]}</code> and captured on {human(UPDATED)}. Click an image for the full-size version. Instrument names on some panels are descriptive labels for simulated front panels; no manufacturer sponsors, endorses or is affiliated with SPHEREVL.</p>
<div class="vl-gallery">{shots}</div></section>

<section id="workspaces"><h2>Fourteen workspaces</h2>
<p>The Control Room groups its tools into four areas. Descriptions come from the repository README and the application interface.</p>{feats}</section>

<section id="engineering"><h2>Engineering and quality</h2>
<ul>
<li><strong>Typed run contract (CR-101).</strong> Branded run, plan, point and event IDs, model and schema versions, units, and copied capture settings. Plans are validated <em>before</em> arrays are allocated: ranges must be finite with positive steps, repeats are limited to 1&ndash;100 and planned acquisitions to 1,000, and travel is bounded to &plusmn;35&nbsp;mm.</li>
<li><strong>Seeded randomisation.</strong> Fisher&ndash;Yates ordering uses the supplied seed, with coordinate order and execution order shown separately.</li>
<li><strong>Cancellable runner (CR-102).</strong> Abortable delays, timer ownership, injected schedulers and stale-run guards, so stopping a sweep cleans up after itself.</li>
<li><strong>Reducer-boundary guards.</strong> Accepted plans are locked while active; duplicate starts, wrong-run records and repeated capture IDs are rejected.</li>
<li><strong>Regression tests.</strong> <code>npm test</code> runs four suites over the simulator&rsquo;s real helper functions (high vacuum, stage settling, fault effects, adaptive retry limits, interlocks, notebook retention, plan validation, cancellation and sweep races). A separate mounted lifecycle suite runs 24 cases across Strict Mode on/off and normal/reduced-motion timing. All suites passed in a local run on {human(UPDATED)} (Node 22 in the review environment; the repository targets Node {snap["node"]}).</li>
<li><strong>Strict domain typing.</strong> Domain modules and negative type fixtures are checked by a strict TypeScript build; the legacy UI has not been migrated to strict types.</li>
<li><strong>Performance and hygiene.</strong> React and charts are split into separate vendor chunks; dependencies are pinned to locked versions; Tailwind&nbsp;4 cleared the reported npm audit advisories.</li></ul></section>

<section id="history"><h2>Development history</h2>
<p>Every non-merge commit on <code>main</code> from {human(first)} through {human(last)} ({len(snap["commits"])} commits; {snap["merge_commits"]} further merge commits omitted). Dates are America/New_York local dates. Generic upload messages are not treated as documented feature releases.</p>
{timeline(snap)}
<p><a href="{REPO_URL}/commits/main/">See all commits on GitHub</a></p></section>

<section id="limits"><h2>Limitations and what is not delivered</h2>
<ul><li>Simulator output is illustrative and is not experimental evidence; uncertainty and repeat-summary values are still fixed placeholders pending later analysis work.</li>
<li>CR-101 does not deliver autosave, archival retention, validated import, computed uncertainty, per-position statistical summaries or complete deterministic execution replay.</li>
<li>The in-memory experiment ledger keeps only 200 records; larger accepted plans show a warning.</li>
<li>The all-record spread is not a repeatability estimate.</li>
<li>The tutorial-video panel needs internet access to load embedded videos.</li>
<li>The mounted lifecycle tests do not mount the full control room or prove scan-sequencer, movement, background-tab or full-run ownership correctness.</li>
<li>The 3D chamber is a conceptual model: dimensions are plausible approximations, and only the &plusmn;35&nbsp;mm stage travel is taken from the simulator.</li></ul></section>

<section id="run"><h2>Run it yourself</h2>
<p>You need Node.js {snap["node"]}.x and npm.</p>
<pre class="vl-code"><code>git clone {REPO_URL}.git
cd sphere-control-room-v2
npm ci
npm run dev      # http://localhost:5173
npm test         # regression suites
npm run build    # type-check and production build</code></pre>
<p>Report problems with the steps taken, expected behaviour, actual behaviour and browser details through the <a href="{REPO_URL}/issues">issue tracker</a>. Do not include passwords, keys or personal information.</p></section>

<section id="faq"><h2>Questions and answers</h2>{"".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in FAQ)}</section>

<section id="related"><h2>Related pages</h2>
<p><a href="/">Project S.P.H.E.R.E. home</a> &middot; <a href="/protocol/">Protocol</a> &middot; <a href="/resources/equipment/">Equipment guide</a> &middot; <a href="/transparency/">Transparency</a> &middot; <a href="/updates/">Project updates</a> &middot; <a href="/privacy/">Privacy notice</a></p></section>
'''
    toc = [("snapshot", "Repository at a glance"), ("gallery", "Inside the virtual lab"), ("workspaces", "Fourteen workspaces"),
           ("engineering", "Engineering and quality"), ("history", "Development history"), ("limits", "Limitations"),
           ("run", "Run it yourself"), ("faq", "Questions and answers")]
    ld = {"@type": "WebPage", "about": {"@type": "SoftwareSourceCode", "name": "S.P.H.E.R.E. Control Room", "codeRepository": REPO_URL,
          "programmingLanguage": ["TypeScript", "TSX"], "runtimePlatform": "Web browser"}}
    html = bd.page("/vl/", "SPHEREVL: the S.P.H.E.R.E. visual lab and Control Room simulator",
                   "SPHEREVL is Project S.P.H.E.R.E.'s visual lab: a browser-based metrology simulator with screenshots, repository facts, full development history and limitations. Educational simulation, not measurements.",
                   "SPHEREVL, the visual lab",
                   "An interactive, educational simulator of the S.P.H.E.R.E. measurement laboratory, with the repository facts and development history behind it.",
                   body, toc, eyebrow="Visual lab", parent=[], navkey="vl", added="2026-10-07", updated=UPDATED,
                   extra_ld=ld, image="https://spheredesci.org/assets/vl/vl-og.png", crumb="Visual Lab")
    bd.write("/vl/", html)


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--snapshot": snapshot(sys.argv[2])
    else: build()
