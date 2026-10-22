# Deployment guide

## Build locally

Requirements: Node.js 22 or newer and npm. From the repository root:

```sh
npm ci
npm run verify
```

The build produces static HTML from MDX and updates generated publication data, RSS, and sitemap files. Preview with a local static server as described in `tools/QA.md`; do not submit the site's real forms.

## Pull requests and production

Pull requests run the publication validation workflow and Lighthouse CI. Review generated-page diffs and the Cloudflare preview before merge. Pushing to `main` runs `npm run verify`, applies pending D1 migrations, then deploys the Worker and root assets through Cloudflare.

The repository's `.assetsignore` prevents source MDX, scripts, configuration, and contributor documentation from being published as public static assets. Preserve the ignore entries when adding repository-only files.

## Analytics database

Production analytics are disabled in local and preview deployments. The production deploy workflow enables them and runs `wrangler d1 migrations apply spheredesci-vote --remote`. Migration `0003_analytics_engagement.sql` adds daily aggregated engagement totals; it stores no visitor IDs or IP addresses. Do not apply production migrations manually from an unreviewed branch.

The dashboard and API provide aggregate content activity and are public. This static deployment does not enforce authentication for `/admin/content-insights/`; use Cloudflare Access or another access-control layer before adding confidential admin functions.

## Rollback and troubleshooting

Use the prior known-good deployment through the normal Cloudflare/GitHub deployment process. Do not remove or edit already-applied D1 migrations; add a forward migration for schema changes. If `npm run verify` fails, fix the source MDX, generator, generated metadata, or links rather than hand-editing generated output. Analytics failures must remain visible in the dashboard status; local/preview analytics returning disabled is expected.

Never place deployment credentials in files, content, commits, or pull request descriptions. The production workflow reads Cloudflare credentials from GitHub Actions secrets.
