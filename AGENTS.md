# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, Cursor, Copilot, Gemini CLI and
similar) working in this repository. Humans are welcome to read it too; the
[README](README.md) is the general project overview.

## What this repository is

The public website of **Project S.P.H.E.R.E.** (Spatial Positioning Harmonic
Empirical Resonance Experiment), served at https://spheredesci.org.

- Static HTML: one `index.html` per route (`/about/` → `about/index.html`).
  Publication pages are generated from MDX at build time; the dynamic parts are
  the voting and aggregate analytics APIs (`worker/`, Cloudflare Worker + D1).
- Served by Cloudflare (Workers static assets, `wrangler.jsonc`) straight from the
  repository root: **every file not listed in `.assetsignore` is published**.
- Pushing to `main` deploys to production automatically. Every pull request gets a
  preview URL (`.github/workflows/`).

## Golden rules

1. **Never commit directly to `main`.** Work on a branch and open a pull request;
   check the Cloudflare preview link the workflow posts before merging.
2. **Do not hand-edit generated pages.** Change the data or the generator, then
   rebuild (see the table below).
3. **Keep repository-only files private.** When you add a file that is not part of
   the website (docs, scripts, data, configs), add it to `.assetsignore`.
4. **Never submit the site's forms**, in tests or otherwise. They send real email
   through FormSubmit to the project mailbox. Intercept the request instead.
5. **No secrets.** Deployment credentials live in GitHub Actions secrets
   (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). Never write tokens, keys or
   personal data into files, commits or PR descriptions.

## Research-integrity rules for content

This is a pre-launch research project. Copy must stay honest about that.

- Frame claims as **hypotheses, proposals or plans**, never as results. Do not
  describe any measurement, dataset, preregistration, review or funding total as
  existing unless a real record exists.
- The published LOC-1 preregistration is at
  [OSF](https://osf.io/5b6mj/overview); the project whitepaper is archived at
  [Zenodo DOI 10.5281/zenodo.23583932](https://doi.org/10.5281/zenodo.23583932).
- No token, DAO, coin or "on-chain" claims, and no placeholder funding figures.
- SPHEREVL / the Control Room is an **educational simulation, not measurements or
  scientific validation**. Keep that notice wherever the lab is mentioned.
- Career pages are **proposal stage, not job offers**. Keep that wording.
- Directory entries publish only with `"consent": true`; links publish only with a URL.
- Do not hotlink or add third-party product images until rights are cleared.
- Keep the "Draft" / "Proposed" labels on the protocol and research pages. The
  synchronized-measurement pages do not amend the LOC-1 draft protocol.

## Names and addresses

- Organization: **Project S.P.H.E.R.E.** (with the dots). Full name: Spatial
  Positioning Harmonic Empirical Resonance Experiment.
- Lab product brand: **SPHEREVL**.
- Use only the official addresses from
  [`SPHERE-ADDRESS-STANDARD.md`](SPHERE-ADDRESS-STANDARD.md):
  `https://spheredesci.org`, `https://spheredesci.org/vl`, `https://lab.spheredesci.org`.
- Contact address used by the forms: `contact@spheredesci.org`.
- Palette: Deep Space `#05070a`, Copper `#c86b3c` / `#e49b73`, Signal Cyan
  `#22d3ee`, Frost `#e2e8f0`. Brand files are in `assets/brand/`.

## Where things come from

| Pages | Source of truth | Rebuild with |
| --- | --- | --- |
| `/links/`, `/directory/`, `/calendar/`, `/newsletter/` (and issues), `/careers/apply/` | `data/links.json`, `data/directory.json`, `data/events.json`, `data/newsletters.json`, `data/newsletters/*.html` | `python3 tools/build-directory.py` |
| `/vl/` | `data/vl-repo.json` (snapshot of the control-room repo) | `python3 tools/build-vl.py` (refresh snapshot: `--snapshot /path/to/sphere-control-room-v2`) |
| `assets/vl/` link art | generated | `python3 tools/make-vl-art.py` |
| `/whitepaper/` | `content/whitepaper.mdx` (uses `protocol/index.html` as its template) | `npm i --no-save katex@0.16.11 marked@12 && node tools/build-whitepaper.mjs` |
| `/research/`, `/knowledge/`, `/glossary/`, `/search/`, `/analytics/`, `rss.xml`, and publication search data | `content/{research,knowledge,glossary}/*.mdx` | `npm ci && npm run build` |
| `assets/tailwind.css` | `styles.input.css`, `tailwind.config.cjs` | `npx --yes tailwindcss@3.4.17 -c tailwind.config.cjs -i styles.input.css -o assets/tailwind.css --minify` |
| `/vote/`, `/vote/<project>/`, `worker/projects.js`, sitemap vote entries | `data/vote/projects.json`, `data/vote/<items>.json` | `python3 tools/make-vote-logos.py && python3 tools/build-vote.py` |
| `assets/vote/logo-concepts/*.svg` | `data/vote/logo-concepts-source.json` (marks) and `data/vote/logo-concepts-type.json` (outlined wordmark/tagline layout) | `python3 tools/make-vote-logos.py` |
| Everything else (`index.html`, `/about/`, `/protocol/`, `/research/…`, etc.) | the HTML file itself | edit directly |

Notes:

- `tools/build-content.py` was a one-time content migration. **Do not rerun it**
  over the current site; it would overwrite later edits.
- The Tailwind config only scans `./index.html` and `./*/index.html`. Pages nested
  two levels deep (e.g. `research/<slug>/index.html`) are not scanned, so use
  existing classes or the hand-written styles in `assets/site.css` there.
- `schema.json` and `content/` are source files, not published (see `.assetsignore`).
- Publication MDX frontmatter is validated by `tools/build-publication.mjs`; do not edit generated article HTML.
- Aggregate analytics are production-only. The D1 migration is applied by the production workflow; local and preview builds keep the API disabled.
- Python tools need Python 3.9+. On Windows, `zoneinfo` may also need `pip install tzdata`.

## Common tasks

**Edit wording on a page.** Find the file (route → `<route>/index.html`), check the
table above, then edit the data/generator or the HTML.

**Add a new page.**
1. Copy the structure of a sibling page (head metadata, header, footer).
2. Give it exactly one `<h1>`, a unique `<title>` and meta description, a
   `<link rel="canonical" href="https://spheredesci.org/<route>/">`, Open Graph
   tags and parseable JSON-LD (with `datePublished`/`dateModified` for articles).
3. Add the URL to `sitemap.xml` with a valid `<lastmod>` (one per `<url>`).
4. Navigation is duplicated in every page. To add a nav item, update all HTML
   pages **and** the `nav()` / `NAV_MORE` definitions in `tools/build-directory.py`
   (which `tools/build-vl.py` reuses), then rebuild the generated pages.
5. Add a line to the update log (`/updates/`) when the change is public-facing.

**Add an event, newsletter issue, directory entry or link.** Edit the relevant
file in `data/` and run `python3 tools/build-directory.py`. For a newsletter issue,
add a fragment under `data/newsletters/` and list it in `data/newsletters.json`.

**Publish research, knowledge, or glossary content.** Add an `.mdx` file under
`content/research/`, `content/knowledge/`, or `content/glossary/`. The filename
becomes the route slug unless frontmatter sets `slug`. Required fields are
`title`, `description`, `publishedDate`, and `updatedDate` (the older
`published` and `updated` names remain supported); use ISO dates and keep the
updated date on or after the publication date. Optional fields include
`category`, `subCategory`, `tags`, `author`, `featured`, `relatedArticles`,
`knowledge`, `citations`, and `faqs`. Use `<Citation id="..."/>` to reference a
matching citation ID. See [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) for the
researcher workflow and available MDX components, and [`AUTHOR_GUIDE.md`](AUTHOR_GUIDE.md)
for profiles. Run `npm run verify`; CI builds and validates the static pages,
search index, RSS feed, and sitemap before deployment. Never hand-edit
generated publication HTML.

## Checking your work

Run locally from the repository root:

```sh
npx --yes serve . -l 3000 --no-clipboard
```

Then follow the inventory in [`tools/QA.md`](tools/QA.md). At minimum:

- Every changed page loads, has one H1, a unique title/description, a canonical URL
  and JSON-LD that parses.
- No horizontal scrolling at 390 px wide; check 1440 px desktop too.
- Internal links and local assets resolve; the 404 page still links back.
- `sitemap.xml` is well-formed and lists every public page; `robots.txt` points to it.
- No `noindex` or crawl-blocking directives were introduced.
- Reduced-motion users and users without JavaScript can still read the content.
- If you add a check or a page family, update `tools/QA.md`.

## Pull requests

- Use short, descriptive commit messages in the imperative ("Add …", "Fix …").
  Recent history uses that style, with the PR number appended on merge.
- The PR template is a repository-settings checklist; for ordinary content PRs,
  fill in "Repository files changed", "Deployment impact" and "Validation", and
  mark the rest not applicable.
- State what you verified and what you could not (for example, form delivery is
  intentionally never tested).
