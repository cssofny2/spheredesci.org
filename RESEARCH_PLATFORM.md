# Research publishing platform

The publishing system turns reviewed MDX source into static, crawlable HTML. It is an extension of the existing Cloudflare Workers static-assets site; it does not introduce a client-side framework or change the URL of existing articles.

## Publishing flow

1. An editor adds an `.mdx` file under `content/research/`, `content/knowledge/`, or `content/glossary/`.
2. `tools/build-publication.mjs` validates YAML frontmatter, compiles MDX, generates article markup and metadata, and builds taxonomy, author, search, RSS, and sitemap artifacts.
3. `npm run verify` builds the site, checks generated HTML and links, and runs the publication tests.
4. Pull requests run the publication checks and Lighthouse CI. Merging to `main` applies pending D1 migrations and deploys the static site and Worker through GitHub Actions.

Generated HTML is output, not the source of truth. Do not hand-edit generated publication pages, the search index, `rss.xml`, or generated sitemap entries.

## Routes

| Route | Purpose |
| --- | --- |
| `/research/` | Research journal, featured and recent work, category links, and search |
| `/research/[slug]/` | Static article page |
| `/research/category/[category]/` | Generated category archive |
| `/research/tag/[tag]/` | Generated tag archive |
| `/research/archive/` | Chronological article archive |
| `/research/authors/` and `/research/authors/[author]/` | Author directory and profiles |
| `/knowledge/`, `/knowledge/[slug]/` | Educational explainers |
| `/glossary/`, `/glossary/[slug]/` | Glossary and term definitions |
| `/search/` | Client-side search across generated publication data |
| `/analytics/` | Public, noindex dashboard of aggregate analytics |
| `/admin/content-insights/` | Noindex alias for the same public aggregate dashboard |

The `/admin/content-insights/` route is **not authenticated**. The static-assets deployment has no access-control layer, and the dashboard/API expose only daily aggregates without visitor identities. Do not put confidential information in this dashboard. Protect it at the Cloudflare access layer before treating it as private administration.

## Article page features

Article output includes canonical and social metadata, author links, dates, estimated reading time, research-status notice, heading-based TOC, share links, references, related reading, author panel, article navigation, and JSON-LD. The Table of Contents is available as a collapsible mobile control and a sticky desktop navigation. All content remains readable without JavaScript.

The LOC-1 protocol's published preregistration is available at [OSF](https://osf.io/5b6mj/overview). The project whitepaper is archived at [Zenodo DOI 10.5281/zenodo.23583932](https://doi.org/10.5281/zenodo.23583932); the protocol and whitepaper JSON-LD cross-reference these persistent records.

Research MDX can use `Citation`, `CitationList`, `Figure`, `ResearchNote`, `WarningBox`, `ExperimentStep`, `Equation`, `ReferenceCard`, `DataPoint`, `ProtocolBlock`, and `EquipmentSpec`. See `CONTENT_GUIDE.md`.

## Discovery and SEO

The build creates searchable index data from article titles, descriptions, full text, authors, categories, tags, and keywords. Browser search ranks title and metadata matches above full-text matches, supports one-character fuzzy corrections for longer words, highlights exact matches, and supports keyboard result navigation. Search queries are sent to aggregate analytics only on the production hostname and only when Do Not Track is not enabled.

Categories, tags, author routes, and individual articles are statically generated and added to `sitemap.xml`. Research articles are included in `rss.xml`. JSON-LD includes Organization, WebSite with SearchAction, WebPage, Article/BlogPosting, author, BreadcrumbList, and FAQPage when FAQs exist.

## Analytics and privacy

Production analytics are opt-in at deployment, disabled for previews, and honor Do Not Track. The Worker stores daily aggregate page views, search terms (with email and URL redaction), referring domains or same-site paths, and per-page engagement totals. It does not store raw IP addresses, browser identifiers, or individual events. Engagement records retain only aggregate visit counts, capped duration totals, and scroll-depth buckets; data older than 90 days is deleted. The privacy notice is the user-facing source for collection details.

`content-discovery.js` uses those public aggregates to show the most viewed articles in the last 30 days and articles with increased views versus the preceding week. It does not label a short-window view count as a scientific or editorial ranking.

## Performance and accessibility

Pages are rendered ahead of time, browser scripts are deferred, search-index data is generated once, images are lazy-loaded, and the layout adapts for mobile. Lighthouse CI checks performance, accessibility, best practices, and SEO on representative routes; target scores are CI thresholds, not a guarantee for every browser or deployment. Keep headings semantic, provide meaningful image alt text, preserve keyboard access, and respect reduced-motion preferences.

## Governance constraints

This is a pre-launch research project. Content must distinguish proposals, hypotheses, methods, and actual results. Never infer that a measurement, dataset, preregistration, review, or funding total exists without a record. The LOC-1 OSF registration is a published preregistration, not a measurement result. The site does not make token, DAO, coin, or on-chain claims. The supported governance taxonomy is therefore **Open-Science Governance**. SPHEREVL remains an educational simulation, not measurement or scientific validation.
