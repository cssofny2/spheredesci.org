# Content guide

Researchers can publish an article by adding one `.mdx` file, filling in its frontmatter, and committing it. The build renders it automatically; do not edit the generated HTML.

## Where to save content

- Research articles: `content/research/<slug>.mdx`
- Educational explainers: `content/knowledge/<slug>.mdx`
- Glossary entries: `content/glossary/<slug>.mdx`

The filename becomes the URL slug. Use lowercase words separated by hyphens. Research slugs `archive`, `category`, `tag`, and `authors` are reserved for platform routes.

## Frontmatter

```yaml
---
title: "A clear, descriptive title"
description: "A concise summary of what this proposal or explainer covers."
publishedDate: 2026-10-21
updatedDate: 2026-10-21
author: Project S.P.H.E.R.E.
category: Measurement methods
subCategory: Uncertainty
tags:
  - metrology
  - resonance
keywords:
  - measurement uncertainty
canonicalUrl: https://spheredesci.org/research/example-article/
featured: false
featuredImage: /assets/research/example-figure.webp
featuredImageAlt: "Caption describing the figure"
status: proposed
seoTitle: "Optional search title"
seoDescription: "Optional search description"
seoKeywords:
  - uncertainty budget
readingTime: 8
relatedArticles:
  - uncertainty-budget-for-resonance
revisions:
  - date: 2026-10-21
    note: "Clarified the proposed measurement scope."
citations:
  - id: gum
    type: book
    title: "Evaluation of measurement data — Guide to the expression of uncertainty in measurement"
    authors: Joint Committee for Guides in Metrology
    year: 2008
    url: https://www.bipm.org/en/committees/jc/jcgm/publications
faqs:
  - question: "Does a proposed measurement establish a result?"
    answer: "No. A proposal is not a measurement result."
---
```

Required fields are `title`, `description`, `publishedDate` (or the legacy `published` alias), and `updatedDate` (or `updated`). Dates use ISO `YYYY-MM-DD`; the update date cannot precede publication. `status` may be `proposed`, `planned`, `in-review`, or `published`; a `draft: true` or `status: draft` document is excluded from the public build.

`author` can be one name or a list of names. Add bios, interests, and optional links in `content/authors.json`; see `AUTHOR_GUIDE.md`. Categories and tags create archives automatically. Set `featured: true` only for a deliberate editor's pick. The canonical URL must be the article's own standard site URL. Featured images must use a local site path; external hotlinked images are rejected. `readingTime` is optional and otherwise estimated from the rendered body. `revisions` is an optional list of dated change notes; dates must fall between publication and last update. Use `relatedArticles` for recommendations (the older `related` field remains supported).

Suggested categories: Research Updates, Experimental Protocols, Metrology, Physics, Instrumentation, Resonance Analysis, Data Transparency, DeSci, Theoretical Physics, Equipment Reviews, Educational Content, and Open-Science Governance. Only create content for topics with a real, appropriately sourced article. Do not add unsupported DAO, token, coin, or on-chain claims.

## Writing and research integrity

Describe pre-launch work as a hypothesis, proposal, plan, or educational explainer. Do not report measurements, datasets, preregistrations, reviews, or funding totals unless the corresponding record exists. The published LOC-1 preregistration is at [OSF](https://osf.io/5b6mj/overview); its existence does not imply measurements or results. Keep protocol and research pages labeled Draft or Proposed where appropriate. SPHEREVL is an educational simulation and must not be described as measurements or scientific validation.

Use original prose and cite sources next to the claims they support. Never fabricate citations, authors, instrument specifications, results, or quotations. Link only to HTTPS or site-relative citation URLs. Do not submit production forms as part of testing.

## MDX components

```mdx
The measurement guide supports a citation marker <Citation id="gum" />.

<Figure
  src="/assets/research/example-figure.webp"
  alt="The instrument layout viewed from above"
  caption="Proposed apparatus layout."
/>

<ResearchNote title="Scope">
This is a proposal-stage explanation, not a measurement report.
</ResearchNote>

<WarningBox title="Interpretation">
A change in the readout alone does not establish its cause.
</WarningBox>

<ExperimentStep number="1" title="Record baseline">
Document the conditions and calibration state before acquisition.
</ExperimentStep>

<Equation latex="u_c = \sqrt{\sum_i u_i^2}" label="Combined standard uncertainty" />

<DataPoint label="Example quantity" value="0" unit="Hz" note="Illustrative placeholder; replace with a sourced value or omit." />

<ProtocolBlock title="Proposed sequence">
Describe the protocol steps and decision rules.
</ProtocolBlock>

<EquipmentSpec title="Instrument details" items={{ bandwidth: "Specify from a real instrument record" }} />
```

`CitationList` renders the bibliography generated from frontmatter citations. `ReferenceCard` accepts `title`, optional `url`, `authors`, and `year`. `Equation` preserves the supplied expression as accessible text; it does not typeset TeX. `Figure` and `featuredImage` require local assets and accurate alt text. Keep examples explicitly labeled as illustrative if readers could mistake them for real measurements.

## Build and verify

Run from the repository root:

```sh
npm ci
npm run verify
```

The build reports the source file for invalid frontmatter, citation references, component usage, or generated output. Verify local links and visible copy in the preview; never submit site forms in tests.
