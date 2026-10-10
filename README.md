# Project S.P.H.E.R.E.

**Spatial Positioning Harmonic Empirical Resonance Experiment**

Project S.P.H.E.R.E. is an open, documented experimental research initiative
exploring spatial positioning, harmonic resonance, empirical and controlled measurement,
and reproducible research practices.

## Website

https://spheredesci.org

## Project status

Pre-launch / public-foundation phase.

Current work focuses on:

- Publishing a research thesis and methodological framework
- Documenting experimental design and instrumentation
- Establishing transparent data, protocol, and versioning practices
- Building a public landing page and collaboration pathway
- Preparing materials for future independent review and replication

## Brand assets

Official logo files live in [`assets/brand/`](assets/brand/). All lockups are
vector SVG with text converted to outlines (typeface: Saira), plus 4x PNG exports.

| File | Use |
| --- | --- |
| `sphere-lockup-horizontal.svg` | Primary horizontal wordmark (dark backgrounds) |
| `sphere-lockup-horizontal-mono.svg` | Single-colour white version |
| `sphere-lockup-stacked.svg` | Stacked lockup for narrow / mobile layouts |
| `sphere-lockup-compact.svg` | Icon + wordmark for navigation bars |
| `sphere-icon.svg` / `sphere-icon-mono.svg` | Standalone mark, avatars, favicons |
| `og-image.png` | 1200x630 social share image |

Palette: Deep Space `#05070a`, Copper `#c86b3c` / `#e49b73`, Signal Cyan `#22d3ee`,
Frost `#e2e8f0`.

## Research integrity

This repository distinguishes between:

- Hypotheses
- Experimental protocols
- Observations and measurements
- Data analysis
- Interpretations
- Future research objectives

Project S.P.H.E.R.E. does not treat hypotheses or preliminary concepts as
validated scientific conclusions.

## Repository purpose

This repository contains the public website and openly shareable project
documentation. It is deployed through Cloudflare Pages from the `main` branch.

## Contributing

Contribution guidance will be published as the public research and collaboration
process is established.

## Security

Do not report security vulnerabilities through public issues. See
[SECURITY.md](SECURITY.md) when available.

## License

Website code is licensed under the MIT License unless otherwise stated.
Research documents, datasets, graphics, and third-party materials may have
separate licensing terms.

## Public research pages

The site includes the draft LOC-1 protocol, budget and transparency page,
research resource library, FAQ, collaboration guidance, update log, privacy
notice, About page, and research charter. Documents are explicitly labeled as
drafts or plans where appropriate. No data, funding total, or preregistration
is represented as existing unless a real record is available.

Since 2026-10-09 the site also carries proposal-stage synchronized-measurement research (hub at `/research/`): a proposed four-object protocol amendment, an error-budget article, related-research commentary, a hardware guide and a community design-review page. These do not amend the LOC-1 draft. Third-party product images are intentionally not used until rights are cleared.

## Building and checking

The site is static HTML. Tailwind is compiled into a local CSS asset; its runtime
CDN is no longer required to display content.

```sh
npx --yes tailwindcss@3.4.17 -c tailwind.config.cjs -i styles.input.css -o assets/tailwind.css --minify
serve . -l 3000 --no-clipboard
```

`tools/build-content.py` contains the authored content and shared-page templates.
It was used for the initial expansion. Existing-page augmentation steps are
one-time migrations: do not rerun that script blindly over an already-expanded
homepage. Edit the generated HTML directly or adapt the generator before a
later content rebuild. Development files are excluded by `.assetsignore`.

The QA inventory is in `tools/QA.md`. Sitemap and canonical URLs target the
production domain at https://spheredesci.org/.
