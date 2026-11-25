# Domain Hygiene, Redirect & Migration Map

- **Date**: 2026-11-24
- **Policy Basis**: Whitepaper v2.0 §26 & Appendix E; Section 21 (Organizational and Domain Hygiene).
- **Non-Destructive Preservation Rule**: No unrelated commercial page or user asset is deleted without a preserved migration record and explicit owner confirmation of the destination domain.

---

## 1. Unrelated Commercial Content Audit & Migration Plan

| Item | Current Location in Repo / Live Site | Nature of Content | Action Completed in This PR | Required Next Manual Step |
|---|---|---|---|---|
| **Panton Bros, LLC webpage** | `projects/panton/index.html` (`https://spheredesci.org/projects/panton/`) + images `assets/projects/panton/panton-01.webp`..`06.webp` | Unrelated local lawn care & landscaping business in Rochester / Monroe County, NY. | 1) Preserved intact (not deleted). 2) Cleaned out all contaminated Project S.P.H.E.R.E. JSON-LD (`#organization`, `#website`, OSF/Zenodo citations, `#person`), RSS discovery link, `/assets/analytics.js`, and S.P.H.E.R.E. footer badges/version bar. 3) Updated all 5 build post-processors (`inject-entity-graph.mjs`, `inject-site-metadata.mjs`, `build-geo.py`, `social-meta.py`, `seo-schema.py`) to permanently skip `projects/panton/`. 4) Retained `<meta name="robots" content="noindex, nofollow">` and added a non-intrusive migration notice. | Deploy `projects/panton/index.html` + `assets/projects/panton/*` to a dedicated Panton Bros domain, configure a 301 redirect in `worker/index.js` or Cloudflare Redirect Rules from `/projects/panton/*` → `https://<panton-domain>/`, and then remove the files from `spheredesci.org`. |
| **Root duplicate `panton.html`** | `panton.html` (2.54 MB; already excluded from public assets by `.assetsignore`) | Unbundled duplicate with embedded base64 images; previously mutated by `inject-site-metadata.mjs` to include S.P.H.E.R.E. RSS link. | Removed injected S.P.H.E.R.E. RSS `<link>` and updated `inject-site-metadata.mjs` to skip `panton.html`. | Archive offline with Panton Bros migration bundle and remove from repo once migrated. |
| **Projects index page** | `projects/index.html` (`https://spheredesci.org/projects/`) | Listed only Panton Bros, LLC as a hosted non-research business. | 1) Added `<meta name="robots" content="noindex, follow">` (registered in `tools/lint-html.mjs` `NOINDEX_OK`). 2) Removed `https://spheredesci.org/projects/` from `sitemap.xml` and removed `Allow: /projects/` from `robots.txt`. 3) Added explicit domain-separation and off-domain migration status notice. | Once Panton Bros migrates off-domain, retire `/projects/` or redirect to `/about/#entity-separation` (HTTP 301). |
| **Fields of Green Rochester link** | Previously in `data/related-properties.json:5` (`https://fieldsofgreenrochester.com/`) | Unrelated commercial property previously injected into the "Associated properties" block of every MDX research, knowledge, and glossary page. | Removed `https://fieldsofgreenrochester.com/` from `data/related-properties.json` and rebuilt all generated publication pages. Retained exclusion in `tools/seo-schema.py` `NOT_SAME_AS`. | Complete — no further site action needed. |
| **Founder consulting ads in global JSON-LD & footer** | Previously hardcoded in `tools/inject-entity-graph.mjs` (every HTML page) and `data/links.json` | Promoted Michael P. Goodman's commercial IT Infrastructure / Sovereign AI / Managed Services practice (`ProfessionalService`, MCSE+I/ITIL/CompTIA/CCIM credentials, "AI Infrastructure Case Study") on every scientific page. | Replaced with neutral, scientifically accurate attribution to **SPHERE Research, LLC** and **Michael P. Goodman (ORCID `0009-0008-3796-5857`)**, explicitly stating that `michaelpgoodman.com` and consulting services are operated separately and do not constitute scientific evidence or endorsement. | Update corresponding case-study pages on `michaelpgoodman.com` per `docs/EXTERNAL-UPDATE-PACKET.md`. |
| **Commercial lab rental pitches** | Previously in `resources/equipment/index.html` (`"Income opportunities"` & `"revenue plan"` on every hardware card) | Pitched commercial testing/rental revenue alongside scientific equipment planning. | Removed commercial income pitches; reframed page strictly around uncertainty-driven phased scientific qualification and procurement. | Complete. |

---

## 2. Route & Redirect Map (Preserving Existing Search Equity)

All canonical research and informational URLs were **preserved without breaking slugs** so existing citations, inbound links, and search equity remain intact:

| Route / Slug | Status | Canonical URL | Notes / Redirect Policy |
|---|---|---|---|
| `/` | Preserved | `https://spheredesci.org/` | Section anchor `#dao` renamed to `#stewardship`; preserved invisible `<span id="dao" aria-hidden="true"></span>` anchor so any external `/#dao` fragment links still land on Chapter 04 cleanly. |
| `/whitepaper/` | Preserved | `https://spheredesci.org/whitepaper/` | Upgraded in-place to **SPHERE-WP-001 Version 2.0**; no duplicate indexed whitepaper routes created. Downloadable Markdown served at `/assets/whitepaper/SPHERE-WP-001-v2.0.md`. |
| `/whitepaper` (no trailing slash) | Preserved | Redirects to `https://spheredesci.org/whitepaper/` | Handled automatically by Cloudflare Workers static assets directory routing. |
| `/research/acoustic-resonators-above-100ghz-nist-2026/` | Preserved (slug kept for search equity) | `https://spheredesci.org/research/acoustic-resonators-above-100ghz-nist-2026/` | Retained slug to avoid breaking indexed links; corrected citation/text year to **2025** (`Applied Physics Letters 127, 012204`, `10.1063/5.0275691`) with transparent correction note. |
| `/projects/` | De-indexed (`noindex, follow`) | `https://spheredesci.org/projects/` | Removed from `sitemap.xml` and `robots.txt` AI allowlist; queued for retirement/301 redirect after Panton Bros domain migration. |
| `/projects/panton/` | De-indexed (`noindex, nofollow`) | `https://spheredesci.org/projects/panton/` | Stripped of all S.P.H.E.R.E. schema/footer/analytics; queued for 301 redirect to external Panton Bros domain once provisioned. |
| `/glossary/<new-terms>/` | 14 New Glossary Routes Added | `https://spheredesci.org/glossary/<slug>/` | Added canonical glossary definitions for `loc-1`, `ant-b-01`, `vna`, `ldv`, `emat`, `frf`, `mac`, `gum`, `tost-equivalence-testing`, `estimand`, `qualification-confirmation-replication`, `digital-twin`, `fair-principles`, and `preregistration`. |
| `https://lab.spheredesci.org/*` | Preserved (Worker 302 redirect) | `https://sphere-control-room-v2.vercel.app/#/dashboard` | Unchanged in `worker/index.js`; verified by unit tests. |
