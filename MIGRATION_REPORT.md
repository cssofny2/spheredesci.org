# Research platform migration report

## Existing architecture

- Plain HTML route directories are served directly from the repository root as Cloudflare Workers static assets. `wrangler.jsonc` points the asset binding at `.` and routes `/api/*` through `worker/index.js`.
- Node 22 scripts use `@mdx-js/mdx`, React server rendering, `remark-gfm`, and YAML frontmatter to build static research, knowledge, and glossary pages. `content/` and `tools/` are source-only and excluded by `.assetsignore`.
- `npm run build` generates pages, a browser search index, RSS, and sitemap entries. `npm run check` validates local links, metadata, schema, sitemap, and feeds. `npm test` exercises the publication pipeline and Worker analytics.
- The Cloudflare Worker stores only daily aggregate page views, search terms, and referrers in D1. Analytics are enabled only for production; the privacy page documents the collection.
- GitHub Actions run publication checks, Lighthouse CI, preview deployment, and production deployment. Production applies D1 migrations before deploy.

## Risks and constraints found

- A framework replacement would add deployment and routing risk without solving a missing need; existing pages are already pre-rendered and crawlable.
- Static assets cannot authenticate `/admin/content-insights/`. The route is therefore a noindex alias for the same public aggregate dashboard, not a private admin console.
- Proposal-stage research rules preclude claiming results, preregistration, reviews, or funding records that do not exist. DAO/token/on-chain wording is prohibited; governance taxonomy uses “Open-Science Governance.”
- Static article references and author metadata must remain local and deterministic. Remote featured images would introduce rights and availability risks and are rejected.
- Lighthouse targets are tested in CI but cannot be guaranteed for every device, network, or production configuration.

## Required changes

- Extend frontmatter to accept publication-date aliases, status, featured flags and images, SEO fields, taxonomy, author, citations, and revisions while excluding drafts.
- Generate category/tag/archive/author routes and article details without changing existing article URLs.
- Add reusable scientific MDX components, reading navigation, citations, author attribution, structured metadata, and research-status notices.
- Upgrade browser search to include author and taxonomy fields, ranked/fuzzy matching, exact-match highlighting, and keyboard navigation.
- Extend privacy-preserving analytics with duration, coarse scroll-depth, and week-over-week popularity aggregates; retain 90-day deletion.
- Verify generated accessibility and SEO outputs and document researcher publishing.

## New files created

- `assets/publication-article.js`, `assets/content-discovery.js`
- `content/authors.json`
- `migrations/0003_analytics_engagement.sql`
- `RESEARCH_PLATFORM.md`, `CONTENT_GUIDE.md`, `AUTHOR_GUIDE.md`, `SEO_GUIDE.md`, `DEPLOYMENT_GUIDE.md`, `MIGRATION_REPORT.md`
- Generated static category, tag, archive, author, and admin-alias pages, plus updated search/feed/sitemap artifacts.

## Existing files modified

- `tools/build-publication.mjs`, `tools/check-publication.mjs`, `tools/publication/publication.test.mjs`
- `assets/publication.css`, `assets/publication-search.js`, `assets/analytics.js`, `assets/analytics-dashboard.js`
- `worker/index.js`, `.assetsignore`, `.lighthouserc.json`, `updates/index.html`

## Architectural decisions

- Preserve static pre-rendering and the existing MDX toolchain; no new runtime framework or dependencies are needed.
- Keep aliases `published`/`updated` for existing content while supporting `publishedDate`/`updatedDate`.
- Generate taxonomy routes only for categories and tags in actual content, avoiding empty archive pages.
- Use author profiles in a source JSON file, with generated minimal profiles when new article authors lack profile metadata.
- Render math expressions accessibly as source text rather than adding a math-rendering dependency or suggesting unverified output.
- Keep the content-insights route public and aggregate-only; private administration requires a Cloudflare access policy outside static HTML.

## Performance and SEO implications

Static metadata and pages are generated at build time, reducing client work and supporting crawlers without JavaScript. Search uses one generated index, deferred scripts, and lazy-loaded images. New public routes are included in the sitemap, while analytics pages remain noindex. Lighthouse CI thresholds continue to cover performance, accessibility, best practices, and SEO.

## Future expansion recommendations

- Add editorial review states and authorship consent checks if external contributors join.
- Add explicit revision notes for each meaningful content update.
- Add a properly authenticated editor workflow before creating private dashboards or draft previews.
- Consider server-side search only if the static index becomes too large for efficient download.
- Collect real performance baselines from CI and production before adopting stronger optimization targets.
