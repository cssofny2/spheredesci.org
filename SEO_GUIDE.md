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
