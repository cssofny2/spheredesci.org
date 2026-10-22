# SEO guide

Publication SEO is generated from MDX frontmatter and verified during `npm run verify`.

## Per-article output

The build emits a unique title, description, canonical URL, robots directive, Open Graph and Twitter metadata, article dates and authors, publication image, keywords, and JSON-LD. Research articles include Article and BlogPosting types, WebPage, BreadcrumbList, Organization, WebSite/SearchAction, author identity, and FAQPage only when FAQ content is present.

Set `seoTitle`, `seoDescription`, and `seoKeywords` when a focused search snippet is useful. Keep descriptions accurate, readable, and consistent with the page. The canonical URL must equal the page's official URL; alternate canonical destinations are rejected to avoid accidental duplicate or off-site canonicals. Use local images so the build remains deterministic and rights can be reviewed.

## Discovery feeds

`npm run build` updates `sitemap.xml` with articles and generated category, tag, archive, and author pages. It generates `rss.xml` from research articles and writes `assets/publication-search.json` for browser search. Do not edit these generated outputs directly.

`robots.txt` points to the sitemap. The analytics and content-insights dashboards are `noindex,follow`; they are public aggregate reports, not private administration pages.

## Validation

`npm run check` verifies generated canonical/meta tags, exactly one H1, social tags, JSON-LD, local links and fragments, automatic-link uniqueness, sitemap membership, and RSS membership. `npm test` exercises publication generation assumptions and Worker analytics. Lighthouse CI runs against representative article, archive, author, search, glossary, and home routes with performance, accessibility, best-practices, and SEO thresholds.

Search-engine scores and Core Web Vitals depend on the deployed environment and real content. CI thresholds are regression checks, not a promise of a particular ranking or Lighthouse result.

## Shared schema and metadata

After running the page generators, run `python3 tools/seo-schema.py` to ensure every page's JSON-LD graph has the shared `Organization` and `WebSite` (publisher + `SearchAction`) nodes and that Twitter Card tags mirror Open Graph. It is idempotent; `--check` reports pages that need updating. `sameAs` lists only profiles that exist (currently the GitHub repository); add social URLs to `ORG` in the script once they are published.

## GEO blocks, FAQ schema and social tags

- `data/geo.json` + `python3 tools/build-geo.py` inject the key-facts summary (`.geo-summary`) and the reusable FAQ section (`faq_section()` emits visible `<details>` plus a matching `FAQPage` node). `faqs_from_page` derives the schema from a page's existing `faq-item` blocks. Keep every bullet hypothesis/proposal framed.
- `python3 tools/social-meta.py` fills any missing Open Graph / Twitter Card tags and falls back to `assets/brand/og-image.png`; existing values are never overwritten. `social_tags()` can be imported by other generators.
- `npm run build` runs all three in order. Run them after `build-directory.py`, `build-vl.py` and `build-whitepaper.mjs`, which regenerate pages.
- Interaction analytics (whitepaper, GitHub, SPHEREVL, outbound links, FAQ opens) are aggregate daily counts in `analytics_events` (migration 0004); add `data-track=\"event-name\"` to a link to override its classification.

## Lighthouse budgets

`.lighthouserc.json` fails CI on LCP above 4 s (Google's poor threshold), CLS above 0.1, TBT above 200 ms and category scores below 0.9. Target LCP is 2.5 s. The SEO score tops out at 0.92 because Lighthouse reports the Cloudflare `Content-Signal` line in robots.txt as an unknown directive; that line is intentional.
