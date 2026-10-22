import { compile, run } from "@mdx-js/mdx";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { parse } from "yaml";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://spheredesci.org";
const BRAND_IMAGE = `${SITE}/assets/brand/og-image.png?v=2`;
const TODAY = new Date().toISOString().slice(0, 10);
const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "it", "of", "on", "or", "the", "to", "what", "when", "why", "with"]);
const e = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const xml = (value = "") => e(value);
const slugify = (value = "") => String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const words = (value = "") => String(value).replace(/<[^>]+>/g, " ").replace(/[`*_>#\[\]()]/g, " ").replace(/\s+/g, " ").trim();
const dateLabel = (value) => new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const absolute = (route) => `${SITE}${route.endsWith("/") ? route : `${route}/`}`;
const toJsonLd = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const decodeHtml = (value = "") => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const template = await readFile(path.join(ROOT, "research", "index.html"), "utf8");
const navMatch = template.match(/<nav class="site-nav"[\s\S]*?<\/nav>/);
const footerMatch = template.match(/<footer class="site-footer">[\s\S]*?<\/footer>/);
if (!navMatch || !footerMatch) throw new Error("The research page is missing its shared navigation or footer.");

const nav = navMatch[0]
  .replace(/\s+aria-current="page"/g, "")
  .replaceAll('<a href="/research/">Measurement research</a>', '<a href="/research/">Research journal</a>');
const navigation = nav.includes('href="/knowledge/"')
  ? nav
  : nav.replaceAll('<a href="/learn/">Learn</a>', '<a href="/learn/">Learn</a><a href="/knowledge/">Knowledge base</a><a href="/glossary/">Glossary</a>');
const footer = footerMatch[0]
  .replaceAll('<a href="/research/">Measurement research</a>', '<a href="/research/">Research journal</a><a href="/knowledge/">Knowledge base</a><a href="/glossary/">Glossary</a>');

function glossaryPlugin(terms, linkedTerms) {
  const sorted = [...terms].sort((a, b) => b.term.length - a.term.length);
  const ignored = new Set(["a", "code", "inlineCode", "math", "inlineMath", "link", "linkReference", "heading", "html", "image", "mdxJsxTextElement", "mdxJsxFlowElement"]);
  return () => (tree) => {
    if (!sorted.length) return;
    const transform = (parent, ancestors) => {
      if (!parent.children) return;
      for (let index = 0; index < parent.children.length; index += 1) {
        const node = parent.children[index];
        if (node.type === "link" || node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") {
          const href = node.url || node.attributes?.find((attribute) => attribute.name === "href")?.value;
          const linked = sorted.find((item) => href === item.url || href === absolute(item.url));
          if (linked) linkedTerms.add(linked.term);
        }
        if (node.type === "text" && !ignored.has(parent.type) && !ancestors.some((ancestor) => ignored.has(ancestor.type)) && node.value.trim()) {
          const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${sorted.map((item) => escapeRegExp(item.term)).join("|")})(?=$|[^\\p{L}\\p{N}])`, "giu");
          const pieces = [];
          let cursor = 0;
          let match;
          while ((match = pattern.exec(node.value))) {
            const term = sorted.find((item) => item.term.toLowerCase() === match[2].toLowerCase());
            if (!term || linkedTerms.has(term.term)) continue;
            const start = match.index + match[1].length;
            if (start > cursor) pieces.push({ type: "text", value: node.value.slice(cursor, start) });
            pieces.push({
              type: "link",
              url: term.url,
              data: { hProperties: { className: ["glossary-link"], "data-glossary-term": term.term } },
              children: [{ type: "text", value: match[2] }],
            });
            linkedTerms.add(term.term);
            cursor = start + match[2].length;
          }
          if (pieces.length) {
            if (cursor < node.value.length) pieces.push({ type: "text", value: node.value.slice(cursor) });
            parent.children.splice(index, 1, ...pieces);
            index += pieces.length - 1;
            continue;
          }
        }
        transform(node, [...ancestors, parent]);
      }
    };
    transform(tree, []);
  };
}

function headingPlugin(headings) {
  return () => (tree) => {
    visit(tree, "element", (node) => {
      if (!/^h[2-4]$/.test(node.tagName)) return;
      const textOf = (child) => child.value || child.children?.map(textOf).join("") || "";
      const text = node.children.map(textOf).join("").trim();
      if (!text) return;
      const base = slugify(text) || "section";
      const count = headings.filter((item) => item.id === base || item.id.startsWith(`${base}-`)).length;
      const id = count ? `${base}-${count + 1}` : base;
      node.properties.id = id;
      headings.push({ id, title: text, level: Number(node.tagName[1]) });
    });
  };
}

async function readContent(kind) {
  const dir = path.join(ROOT, "content", kind);
  let files;
  try {
    files = await readdir(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return Promise.all(files.filter((file) => file.endsWith(".mdx")).sort().map(async (file) => {
    const source = await readFile(path.join(dir, file), "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!frontmatter) throw new Error(`${file}: missing YAML frontmatter delimited by --- lines.`);
    const meta = parse(frontmatter[1]);
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) throw new Error(`${file}: frontmatter must be a YAML object.`);
    const slug = meta.slug || path.basename(file, ".mdx");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: slug must be lowercase words separated by hyphens.`);
    for (const required of ["title", "description", "published", "updated"]) {
      if (!meta[required]) throw new Error(`${file}: missing required frontmatter field "${required}".`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.published) || !/^\d{4}-\d{2}-\d{2}$/.test(meta.updated) || meta.updated < meta.published) {
      throw new Error(`${file}: published/updated must be ISO dates and updated cannot precede published.`);
    }
    const url = `/${kind}/${slug}/`;
    const tags = [...new Set((meta.tags || []).map((tag) => String(tag).trim()).filter(Boolean))];
    const citations = (meta.citations || []).map((citation, index) => {
      if (!citation.id || !citation.title || !citation.type) throw new Error(`${file}: citation ${index + 1} needs id, title, and type.`);
      if (!["doi", "arxiv", "journal", "external"].includes(citation.type)) throw new Error(`${file}: citation "${citation.id}" has an unsupported type.`);
      if (citation.doi && !/^10\.\d{4,9}\/\S+$/i.test(citation.doi)) throw new Error(`${file}: invalid DOI "${citation.doi}".`);
      if (citation.arxiv && !/^\d{4}\.\d{4,5}(v\d+)?$/i.test(citation.arxiv)) throw new Error(`${file}: invalid arXiv id "${citation.arxiv}".`);
      if (citation.url && !/^https:\/\//i.test(citation.url) && !citation.url.startsWith("/")) throw new Error(`${file}: citation URLs must use HTTPS or be site-relative.`);
      return { ...citation, number: index + 1 };
    });
    const headings = [];
    const linkedTerms = new Set();
    const compiled = await compile(source.slice(frontmatter[0].length), {
      outputFormat: "function-body",
      remarkPlugins: [remarkGfm, glossaryPlugin(glossaryTerms, linkedTerms)],
      rehypePlugins: [headingPlugin(headings)],
      development: false,
    });
    const module = await run(String(compiled), { Fragment, jsx, jsxs });
    const citationById = new Map(citations.map((citation) => [citation.id, citation]));
    const Citation = ({ id }) => {
      const citation = citationById.get(id);
      if (!citation) throw new Error(`${file}: Citation references unknown citation id "${id}".`);
      return jsx("sup", { className: "citation-marker", children: jsx("a", { href: `#ref-${slugify(id)}`, "aria-label": `Citation ${citation.number}`, children: `[${citation.number}]` }) });
    };
    const bodyHtml = renderToStaticMarkup(jsx(module.default, {
      components: {
        Citation,
        img: (properties) => jsx("img", {
          ...properties,
          loading: properties.loading || "lazy",
          decoding: properties.decoding || "async",
        }),
      },
    }));
    const plainText = words(bodyHtml);
    const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));
    return {
      ...meta,
      kind,
      slug,
      url,
      tags,
      category: String(meta.category || (kind === "research" ? "Research" : kind === "knowledge" ? "Knowledge base" : "Glossary")),
      author: meta.author || "Project S.P.H.E.R.E.",
      authors: Array.isArray(meta.author) ? meta.author : [meta.author || "Project S.P.H.E.R.E."],
      related: [...new Set((meta.related || []).map(String))],
      knowledge: [...new Set((meta.knowledge || []).map(String))],
      citations,
      headings,
      bodyHtml,
      plainText,
      readTime,
    };
  }));
}

let glossaryTerms = [];

function schemaBase() {
  return [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Project S.P.H.E.R.E.",
      url: `${SITE}/`,
      logo: BRAND_IMAGE,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: "Project S.P.H.E.R.E.",
      publisher: { "@id": `${SITE}/#organization` },
      inLanguage: "en",
    },
  ];
}

function schemaFor(record, breadcrumbs, faqs = []) {
  const page = {
    "@type": record.kind === "research" ? "Article" : record.kind === "knowledge" ? "Article" : "DefinedTerm",
    "@id": `${absolute(record.url)}#content`,
    url: absolute(record.url),
    headline: record.title,
    name: record.title,
    description: record.description,
    isPartOf: { "@id": `${SITE}/#website` },
    inLanguage: "en",
    datePublished: record.published,
    dateModified: record.updated,
    author: record.authors.map((name) => name === "Project S.P.H.E.R.E."
      ? { "@type": "Organization", "@id": `${SITE}/#organization` }
      : { "@type": "Person", name }),
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: absolute(record.url),
    image: BRAND_IMAGE,
    keywords: record.tags.join(", "),
  };
  const graph = [...schemaBase(), page, {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map(([name, url], index) => ({ "@type": "ListItem", position: index + 1, name, item: url })),
  }];
  if (faqs.length) graph.push({
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  });
  return { "@context": "https://schema.org", "@graph": graph };
}

function pageHead({ title, description, url, type = "website", schema, noindex = false }) {
  const canonical = absolute(url);
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title><meta name="description" content="${e(description)}">
<meta name="theme-color" content="#05070a">${noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<link rel="canonical" href="${e(canonical)}"><link rel="alternate" type="application/rss+xml" title="Project S.P.H.E.R.E. Research" href="${SITE}/rss.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Project S.P.H.E.R.E.">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${BRAND_IMAGE}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${BRAND_IMAGE}">
<link href="/assets/site.css" rel="stylesheet"><link href="/assets/publication.css" rel="stylesheet">
<script type="application/ld+json">${toJsonLd(schema)}</script>`;
}

function pageShell({ title, description, url, content, schema, scripts = [], noindex = false, type }) {
  const scriptTags = [...new Set([...scripts, "/assets/analytics.js"])].map((src) => `<script src="${src}" defer></script>`).join("");
  return `<!doctype html><html lang="en"><head>${pageHead({ title, description, url, type, schema, noindex })}${scriptTags}</head><body><a class="skip-link" href="#main-content">Skip to content</a>${navigation}<main id="main-content" class="content-shell publication-shell">${content}</main>${footer}</body></html>\n`;
}

function articleCard(record) {
  const labels = [...record.tags, record.category].map((label) => `<span class="publication-tag">${e(label)}</span>`).join("");
  return `<article class="publication-result" data-kind="${e(record.kind)}" data-category="${e(record.category.toLowerCase())}" data-tags="${e(record.tags.map((tag) => tag.toLowerCase()).join("|"))}" data-search="${e(`${record.title} ${record.description} ${record.tags.join(" ")}`.toLowerCase())}">
<p class="publication-card-meta">${e(record.category)} <span aria-hidden="true">/</span> <time datetime="${e(record.published)}">${dateLabel(record.published)}</time> <span aria-hidden="true">/</span> ${record.readTime ? `${record.readTime} min read` : "Concept guide"}</p>
<h3><a href="${e(record.url)}">${e(record.title)}</a></h3><p>${e(record.description)}</p><div class="publication-tags">${labels}</div></article>`;
}

function searchControls(records) {
  const categories = [...new Set(records.map((record) => record.category))].sort((a, b) => a.localeCompare(b));
  const tags = [...new Set(records.flatMap((record) => record.tags))].sort((a, b) => a.localeCompare(b));
  return `<form class="publication-search" role="search" data-publication-search>
<label>Search the library<input type="search" name="q" autocomplete="off" placeholder="Search articles and concepts" aria-label="Search articles and concepts"></label>
<label>Category<select name="category"><option value="">All categories</option>${categories.map((category) => `<option value="${e(category.toLowerCase())}">${e(category)}</option>`).join("")}</select></label>
<label>Tag<select name="tag"><option value="">All tags</option>${tags.map((tag) => `<option value="${e(tag.toLowerCase())}">${e(tag)}</option>`).join("")}</select></label>
<p class="publication-status" aria-live="polite" data-search-status>${records.length} items</p></form>`;
}

function tocMarkup(headings) {
  if (!headings.length) return "";
  return `<nav class="publication-toc" aria-label="Table of contents"><h2>On this page</h2><ol>${headings.map(({ id, title, level }) => `<li class="toc-level-${level}"><a href="#${e(id)}">${e(title)}</a></li>`).join("")}</ol></nav>`;
}

function citationsMarkup(citations) {
  if (!citations.length) return "";
  return `<section class="publication-references" aria-labelledby="references-title"><h2 id="references-title">References</h2><ol>${citations.map((citation) => {
    const link = citation.url || (citation.doi ? `https://doi.org/${citation.doi}` : citation.arxiv ? `https://arxiv.org/abs/${citation.arxiv}` : null);
    const details = [citation.authors, citation.journal, citation.year].filter(Boolean).map(e).join(". ");
    const identifier = citation.doi ? `DOI: ${e(citation.doi)}` : citation.arxiv ? `arXiv:${e(citation.arxiv)}` : null;
    return `<li id="ref-${e(slugify(citation.id))}"><span>${e(citation.title)}${details ? `. ${details}` : ""}${identifier ? `. ${identifier}` : ""}</span>${link ? ` <a href="${e(link)}" rel="noopener noreferrer" target="_blank">External reference</a>` : ""}</li>`;
  }).join("")}</ol></section>`;
}

function resolveRelated(record, records) {
  const explicit = record.related.map((key) => records.find((candidate) => (candidate.kind === "research" || record.kind !== "glossary") && (candidate.slug === key || candidate.url === key))).filter(Boolean);
  const candidates = records.filter((candidate) => candidate.kind === "research" && candidate.url !== record.url);
  const scored = candidates.map((candidate) => {
    const overlap = candidate.tags.filter((tag) => record.tags.some((item) => item.toLowerCase() === tag.toLowerCase())).length;
    const category = candidate.category === record.category ? 2 : 0;
    const titleTokens = new Set(words(`${candidate.title} ${candidate.category}`).toLowerCase().split(/\W+/).filter((token) => token.length > 3 && !STOP_WORDS.has(token)));
    const shared = [...titleTokens].filter((token) => `${record.title} ${record.description}`.toLowerCase().includes(token)).length;
    return { candidate, score: overlap * 3 + category + shared };
  }).sort((a, b) => b.score - a.score || b.candidate.published.localeCompare(a.candidate.published));
  return [...new Map([...explicit, ...scored.filter((item) => item.score > 0).map((item) => item.candidate)].map((item) => [item.url, item])).values()].slice(0, 3);
}

function resolveRelatedTerms(record, records) {
  const explicit = record.related
    .map((key) => records.find((candidate) => candidate.kind === "glossary" && candidate.url !== record.url && (candidate.slug === key || candidate.url === key)))
    .filter(Boolean);
  const candidates = records.filter((candidate) => candidate.kind === "glossary" && candidate.url !== record.url);
  const tokens = `${record.title} ${record.description}`.toLowerCase();
  const scored = candidates.map((candidate) => {
    const shared = words(candidate.title).toLowerCase().split(/\W+/)
      .filter((token) => token.length > 3 && !STOP_WORDS.has(token) && tokens.includes(token)).length;
    const tagOverlap = candidate.tags.filter((tag) => record.tags.some((item) => item.toLowerCase() === tag.toLowerCase())).length;
    return { candidate, score: shared + tagOverlap * 3 };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title));
  return [...new Map([...explicit, ...scored.map((item) => item.candidate)].map((item) => [item.url, item])).values()].slice(0, 3);
}

function resolveKnowledge(record, records) {
  const explicit = record.knowledge
    .map((slug) => records.find((item) => item.kind === "knowledge" && item.slug === slug))
    .filter(Boolean);
  const searchable = words(`${record.title} ${record.description} ${record.plainText}`).toLowerCase();
  const candidates = records.filter((item) => item.kind === "knowledge" && !explicit.some((known) => known.url === item.url));
  const scored = candidates.map((candidate) => {
    const phrase = words(candidate.title).toLowerCase().split(/\s+/).map(escapeRegExp).join("\\s+");
    const mentionsConcept = new RegExp(`\\b${escapeRegExp(phrase)}s?\\b`, "i").test(searchable);
    const tagOverlap = candidate.tags.filter((tag) => record.tags.some((item) => item.toLowerCase() === tag.toLowerCase())).length;
    return { candidate, score: (mentionsConcept ? 3 : 0) + tagOverlap * 2 };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title));
  return [...new Map([...explicit, ...scored.map((item) => item.candidate)].map((item) => [item.url, item])).values()].slice(0, 3);
}

function faqMarkup(faqs) {
  if (!faqs.length) return "";
  return `<section class="publication-faq" aria-labelledby="faq-title"><h2 id="faq-title">Frequently asked questions</h2>${faqs.map(({ question, answer }, index) => `<details><summary>${e(question)}</summary><p>${e(answer)}</p></details>`).join("")}</section>`;
}

function renderedArticle(record, allRecords) {
  const breadcrumbs = [["Home", `${SITE}/`], [record.kind === "research" ? "Research" : record.kind === "knowledge" ? "Knowledge base" : "Glossary", absolute(`/${record.kind}`)], [record.title, absolute(record.url)]];
  const related = resolveRelated(record, allRecords);
  const relatedTerms = record.kind === "glossary" ? resolveRelatedTerms(record, allRecords) : [];
  const knowledge = resolveKnowledge(record, allRecords);
  const cohort = allRecords.filter((item) => item.kind === "research").sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
  const position = cohort.findIndex((item) => item.url === record.url);
  const newer = position > 0 ? cohort[position - 1] : null;
  const older = position >= 0 && position + 1 < cohort.length ? cohort[position + 1] : null;
  const tags = record.tags.map((tag) => `<a class="publication-tag" href="/search/?tag=${encodeURIComponent(tag.toLowerCase())}">${e(tag)}</a>`).join("");
  const meta = `<p class="publication-byline">${record.authors.map(e).join(", ")} <span aria-hidden="true">·</span> Published <time datetime="${e(record.published)}">${dateLabel(record.published)}</time> <span aria-hidden="true">·</span> Updated <time datetime="${e(record.updated)}">${dateLabel(record.updated)}</time> <span aria-hidden="true">·</span> ${record.readTime} min read</p>`;
  const references = citationsMarkup(record.citations);
  const relatedSection = related.length ? `<section class="publication-related" aria-labelledby="related-title"><h2 id="related-title">Related articles</h2><ul>${related.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a><p>${e(item.description)}</p></li>`).join("")}</ul></section>` : "";
  const relatedTermsSection = relatedTerms.length ? `<section class="publication-related" aria-labelledby="related-terms-title"><h2 id="related-terms-title">Related terms</h2><ul>${relatedTerms.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a><p>${e(item.description)}</p></li>`).join("")}</ul></section>` : "";
  const knowledgeSection = knowledge.length ? `<section class="publication-related" aria-labelledby="concepts-title"><h2 id="concepts-title">Related concepts</h2><ul>${knowledge.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a></li>`).join("")}</ul></section>` : "";
  const previousNext = newer || older ? `<nav class="publication-article-nav" aria-label="Article navigation">${older ? `<a rel="prev" href="${e(older.url)}"><span>Previous article</span>${e(older.title)}</a>` : "<span></span>"}${newer ? `<a rel="next" href="${e(newer.url)}"><span>Next article</span>${e(newer.title)}</a>` : ""}</nav>` : "";
  const faqs = record.faqs || [];
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / <a href="/${e(record.kind)}/">${e(breadcrumbs[1][0])}</a> / ${e(record.title)}</div>
<article class="publication-article"><header class="publication-header"><h1 class="page-title">${e(record.title)}</h1><p class="page-lede">${e(record.description)}</p>${meta}<div class="publication-tags">${tags}</div></header>
<div class="publication-reading-layout">${tocMarkup(record.headings)}<div class="article-body publication-body">${record.bodyHtml}${faqMarkup(faqs)}${references}${knowledgeSection}${relatedSection}${relatedTermsSection}${previousNext}</div></div></article>`;
  const schema = schemaFor(record, breadcrumbs, faqs);
  const seoTitle = record.kind === "glossary"
    ? `${record.title} term definition | Glossary | Project S.P.H.E.R.E.`
    : record.kind === "knowledge"
      ? `${record.title} | Knowledge base | Project S.P.H.E.R.E.`
      : record.title;
  return pageShell({ title: seoTitle, description: record.description, url: record.url, content, schema, scripts: ["/assets/analytics.js"], type: "article" });
}

function indexSchema(title, description, route, records) {
  const graph = [...schemaBase(), {
    "@type": "CollectionPage",
    "@id": `${absolute(route)}#webpage`,
    url: absolute(route),
    name: title,
    description,
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntity: { "@type": "ItemList", itemListElement: records.map((record, index) => ({ "@type": "ListItem", position: index + 1, url: absolute(record.url), name: record.title })) },
  }, {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: title, item: absolute(route) },
    ],
  }];
  return { "@context": "https://schema.org", "@graph": graph };
}

function indexPage({ title, description, route, records, lead }) {
  const results = route === "/glossary/" ? glossaryAlphabet(records) : `<div class="publication-results" data-search-results>${records.map(articleCard).join("")}</div>`;
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / ${e(title)}</div><header class="publication-header"><h1 class="page-title">${e(title)}</h1><p class="page-lede">${e(lead)}</p></header>
${searchControls(records)}${results}<p class="publication-empty" data-search-empty hidden>No items match those filters. Try a different term or clear a filter.</p>`;
  return pageShell({ title: `${title} | Project S.P.H.E.R.E.`, description, url: route, content, schema: indexSchema(title, description, route, records), scripts: ["/assets/publication-search.js"] });
}

function researchCatalog(records) {
  return `<section class="publication-catalog" aria-labelledby="journal-title"><h2 id="journal-title">Research journal</h2><p>Browse proposal-stage research and methods. Hypotheses are not findings; no project measurement results are reported here.</p>
${searchControls(records)}<div class="publication-results" data-search-results>${records.map(articleCard).join("")}</div><p class="publication-empty" data-search-empty hidden>No articles match those filters. Try a different term or clear a filter.</p><p class="publication-more"><a href="/search/">Search the full library</a> <span aria-hidden="true">·</span> <a href="/knowledge/">Knowledge base</a> <span aria-hidden="true">·</span> <a href="/glossary/">Glossary</a> <span aria-hidden="true">·</span> <a href="/analytics/">Aggregate analytics</a></p></section>`;
}

function glossaryAlphabet(records) {
  const letters = [...new Set(records.map((record) => record.title.trim()[0].toUpperCase()))].sort();
  const groups = letters.map((letter) => {
    const items = records.filter((record) => record.title.trim()[0].toUpperCase() === letter);
    return `<section class="glossary-group" id="letter-${e(letter)}" aria-labelledby="heading-${e(letter)}"><h2 id="heading-${e(letter)}">${e(letter)}</h2><div>${items.map(articleCard).join("")}</div></section>`;
  }).join("");
  return `<nav class="glossary-alphabet" aria-label="Glossary letters">${letters.map((letter) => `<a href="#letter-${e(letter)}">${e(letter)}</a>`).join("")}</nav><div class="publication-results" data-search-results>${groups}</div>`;
}

async function readLegacyResearch(generatedSlugs) {
  const dir = path.join(ROOT, "research");
  const entries = await readdir(dir, { withFileTypes: true });
  const pages = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    if (generatedSlugs.has(entry.name)) continue;
    const file = path.join(dir, entry.name, "index.html");
    let html;
    try { html = await readFile(file, "utf8"); } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const title = decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || entry.name);
    const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || title);
    const published = html.match(/<meta property="article:published_time" content="(\d{4}-\d{2}-\d{2})"/i)?.[1] || TODAY;
    const updated = html.match(/<meta property="article:modified_time" content="(\d{4}-\d{2}-\d{2})"/i)?.[1] || published;
    const eyebrow = decodeHtml(html.match(/<div class="eyebrow">([\s\S]*?)<\/div>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "Research");
    const category = eyebrow.split("/").at(-1).trim();
    const article = (html.match(/<article class="article-body">([\s\S]*?)<\/article>/i)?.[1] || html)
      .replace(/<!-- PUBLICATION_NAV_START -->[\s\S]*?<!-- PUBLICATION_NAV_END -->/g, "");
    const plainText = words(decodeHtml(article.replace(/<[^>]+>/g, " ")));
    const readTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));
    const explicitRelated = [...article.matchAll(/<a href="\/research\/([a-z0-9-]+)\/">/gi)].map((match) => match[1]).filter((slug) => slug !== entry.name);
    const headings = [...article.matchAll(/<h([2-4])[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({ level: Number(match[1]), id: match[2], title: decodeHtml(match[3].replace(/<[^>]+>/g, "").trim()) }));
    pages.push({
      kind: "research", slug: entry.name, url: `/research/${entry.name}/`, title, description,
      published, updated, category, tags: [], author: "Project S.P.H.E.R.E.", authors: ["Project S.P.H.E.R.E."],
      related: [...new Set(explicitRelated)], knowledge: [], citations: [], headings, plainText, readTime, legacy: true, html, file,
    });
  }
  return pages;
}

function legacyArticleNavigation(record, records) {
  const related = resolveRelated(record, records).slice(0, 3);
  const knowledge = resolveKnowledge(record, records);
  const research = records.filter((item) => item.kind === "research").sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
  const position = research.findIndex((item) => item.url === record.url);
  const newer = position > 0 ? research[position - 1] : null;
  const older = position >= 0 && position + 1 < research.length ? research[position + 1] : null;
  const links = related.length ? `<section class="publication-related" aria-labelledby="related-articles"><h2 id="related-articles">Related articles</h2><ul>${related.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a><p>${e(item.description)}</p></li>`).join("")}</ul></section>` : "";
  const concepts = knowledge.length ? `<section class="publication-related" aria-labelledby="related-concepts"><h2 id="related-concepts">Related concepts</h2><ul>${knowledge.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a></li>`).join("")}</ul></section>` : "";
  const navBlock = newer || older ? `<nav class="publication-article-nav" aria-label="Article navigation">${older ? `<a rel="prev" href="${e(older.url)}"><span>Previous article</span>${e(older.title)}</a>` : "<span></span>"}${newer ? `<a rel="next" href="${e(newer.url)}"><span>Next article</span>${e(newer.title)}</a>` : ""}</nav>` : "";
  return `<!-- PUBLICATION_NAV_START -->${concepts}${links}${navBlock}<!-- PUBLICATION_NAV_END -->`;
}

function updateLegacyHead(html, record) {
  const title = `${record.title} | Project S.P.H.E.R.E.`;
  const schema = schemaFor(record, [
    ["Home", `${SITE}/`],
    ["Research", absolute("/research/")],
    [record.title, absolute(record.url)],
  ]);
  const set = (pattern, markup) => pattern.test(html)
    ? html.replace(pattern, markup)
    : html.replace("</head>", `${markup}</head>`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${e(title)}</title>`);
  html = set(/<meta name="description"[^>]*>/i, `<meta name="description" content="${e(record.description)}">`);
  html = set(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${e(absolute(record.url))}">`);
  html = set(/<meta property="og:type"[^>]*>/i, '<meta property="og:type" content="article">');
  html = set(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${e(title)}">`);
  html = set(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${e(record.description)}">`);
  html = set(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${e(absolute(record.url))}">`);
  html = set(/<meta property="og:site_name"[^>]*>/i, '<meta property="og:site_name" content="Project S.P.H.E.R.E.">');
  html = set(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${BRAND_IMAGE}">`);
  html = set(/<meta name="twitter:card"[^>]*>/i, '<meta name="twitter:card" content="summary_large_image">');
  html = set(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${e(title)}">`);
  html = set(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${e(record.description)}">`);
  html = set(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${BRAND_IMAGE}">`);
  html = set(/<meta name="author"[^>]*>/i, `<meta name="author" content="${e(record.authors.join(", "))}">`);
  html = set(/<meta property="article:published_time"[^>]*>/i, `<meta property="article:published_time" content="${e(record.published)}">`);
  html = set(/<meta property="article:modified_time"[^>]*>/i, `<meta property="article:modified_time" content="${e(record.updated)}">`);
  html = set(/<link rel="alternate" type="application\/rss\+xml"[^>]*>/i, `<link rel="alternate" type="application/rss+xml" title="Project S.P.H.E.R.E. Research" href="${SITE}/rss.xml">`);
  const jsonLd = `<script type="application/ld+json">${toJsonLd(schema)}</script>`;
  html = set(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, jsonLd);
  return html;
}

async function updateLegacyPages(legacy, records) {
  for (const record of legacy) {
    let html = updateLegacyHead(record.html, record);
    const byline = `<p class="page-meta">${record.authors.map(e).join(", ")} <span aria-hidden="true">·</span> Published <time datetime="${e(record.published)}">${dateLabel(record.published)}</time> <span aria-hidden="true">·</span> Updated <time datetime="${e(record.updated)}">${dateLabel(record.updated)}</time> <span aria-hidden="true">·</span> ${record.readTime} min read <span aria-hidden="true">·</span> Proposal stage</p>`;
    if (/<p class="page-meta">[\s\S]*?<\/p>/i.test(html)) html = html.replace(/<p class="page-meta">[\s\S]*?<\/p>/i, byline);
    else html = html.replace(/<\/h1>/i, `</h1>${byline}`);
    const block = legacyArticleNavigation(record, records);
    if (/<!-- PUBLICATION_NAV_START -->[\s\S]*?<!-- PUBLICATION_NAV_END -->/.test(html)) {
      html = html.replace(/<!-- PUBLICATION_NAV_START -->[\s\S]*?<!-- PUBLICATION_NAV_END -->/, block);
    } else {
      html = html.replace("</article>", `${block}</article>`);
    }
    const toc = record.headings.length ? `<aside class="article-aside publication-toc" aria-label="On this page"><h2>On this page</h2>${record.headings.map((heading) => `<a href="#${e(heading.id)}">${e(heading.title)}</a>`).join("")}</aside>` : "";
    if (/<aside class="article-aside"[\s\S]*?<\/aside>/i.test(html)) html = html.replace(/<aside class="article-aside"[\s\S]*?<\/aside>/i, toc);
    if (!html.includes('src="/assets/analytics.js"')) html = html.replace("</head>", '<script src="/assets/analytics.js" defer></script></head>');
    await mkdir(path.dirname(record.file), { recursive: true });
    await writeFile(record.file, html);
  }
}

function rssFeed(records) {
  const items = records.filter((record) => record.kind === "research").sort((a, b) => b.updated.localeCompare(a.updated)).map((record) => `<item><title>${xml(record.title)}</title><link>${xml(absolute(record.url))}</link><guid isPermaLink="true">${xml(absolute(record.url))}</guid><description>${xml(record.description)}</description><pubDate>${new Date(`${record.updated}T00:00:00Z`).toUTCString()}</pubDate><category>${xml(record.category)}</category></item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Project S.P.H.E.R.E. Research</title><link>${SITE}/research/</link><description>Proposal-stage research and methods from Project S.P.H.E.R.E. Hypotheses are not findings.</description><language>en</language><lastBuildDate>${new Date(`${TODAY}T00:00:00Z`).toUTCString()}</lastBuildDate>${items}</channel></rss>\n`;
}

function updateSitemap(urls) {
  return readFile(path.join(ROOT, "sitemap.xml"), "utf8").then(async (current) => {
    const allowed = new Set(urls.map((url) => absolute(url)));
    const prefixes = ["/research/", "/knowledge/", "/glossary/"];
    const entries = [...current.matchAll(/<url>[\s\S]*?<\/url>/g)].map((match) => {
      let entry = match[0];
      const loc = decodeHtml(entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1] || "");
      if (prefixes.some((prefix) => loc.startsWith(`${SITE}${prefix}`)) && !allowed.has(loc)) return null;
      if (allowed.has(loc)) {
        entry = /<lastmod>[\s\S]*?<\/lastmod>/.test(entry)
          ? entry.replace(/<lastmod>[\s\S]*?<\/lastmod>/, `<lastmod>${TODAY}</lastmod>`)
          : entry.replace("</url>", `<lastmod>${TODAY}</lastmod></url>`);
      }
      return entry;
    }).filter(Boolean);
    const known = new Set(entries.map((entry) => decodeHtml(entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1] || "")));
    const additions = urls.filter((url) => !known.has(absolute(url))).map((url) => `<url><loc>${xml(absolute(url))}</loc><lastmod>${TODAY}</lastmod></url>`);
    const closing = current.lastIndexOf("</urlset>");
    if (closing < 0) throw new Error("sitemap.xml does not contain a closing </urlset>.");
    await writeFile(path.join(ROOT, "sitemap.xml"), `${current.slice(0, closing)}${additions.join("\n")}${current.slice(closing)}`);
  });
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

const glossaryContent = await readContent("glossary");
glossaryTerms = glossaryContent.map((term) => ({ term: term.title, url: term.url }));
const researchContent = await readContent("research");
const knowledgeContent = await readContent("knowledge");
const legacy = await readLegacyResearch(new Set(researchContent.map((record) => record.slug)));
const records = [...researchContent, ...knowledgeContent, ...glossaryContent, ...legacy];
const researchRecords = [...researchContent, ...legacy].sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
const knowledgeRecords = knowledgeContent.sort((a, b) => a.title.localeCompare(b.title));
const glossaryRecords = glossaryContent.sort((a, b) => a.title.localeCompare(b.title));
const allSearchRecords = [...researchRecords, ...knowledgeRecords, ...glossaryRecords];

const duplicate = new Set();
for (const record of records) {
  const key = `${record.kind}:${record.slug}`;
  if (duplicate.has(key)) throw new Error(`Duplicate ${record.kind} slug: ${record.slug}`);
  duplicate.add(key);
}

for (const record of [...researchContent, ...knowledgeContent, ...glossaryRecords]) {
  const file = path.join(ROOT, record.url.slice(1), "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, renderedArticle(record, allSearchRecords));
}

const knowledgeDescription = "A reference library for scientific and research concepts relevant to measurement, resonance, instruments, and open science.";
const glossaryDescription = "A searchable glossary of scientific and research terms, with related concepts and links to Project S.P.H.E.R.E. articles.";
await writeFile(path.join(ROOT, "knowledge", "index.html"), indexPage({
  title: "Knowledge base", description: knowledgeDescription, route: "/knowledge/",
  lead: "Scientific concepts and measurement methods in context. These explainers are educational material, not experimental results.",
  records: knowledgeRecords,
}));
await writeFile(path.join(ROOT, "glossary", "index.html"), indexPage({
  title: "Glossary", description: glossaryDescription, route: "/glossary/",
  lead: "Find a term, browse alphabetically, and follow the links into related research.",
  records: glossaryRecords,
}));
const searchContent = `<div class="breadcrumbs"><a href="/">Home</a> / Search</div><header class="publication-header"><h1 class="page-title">Search the research library</h1><p class="page-lede">Search research articles, knowledge guides, and glossary terms. Search terms are counted only as daily aggregates; see the <a href="/privacy/">privacy notice</a>.</p></header>${searchControls(allSearchRecords)}<div class="publication-results" data-search-results>${allSearchRecords.map(articleCard).join("")}</div><p class="publication-empty" data-search-empty hidden>No results. Try a different term or filter.</p>`;
const searchSchema = { "@context": "https://schema.org", "@graph": [...schemaBase(), { "@type": "SearchResultsPage", "@id": `${SITE}/search/#webpage`, url: `${SITE}/search/`, name: "Search the research library", isPartOf: { "@id": `${SITE}/#website` } }] };
await mkdir(path.join(ROOT, "search"), { recursive: true });
await writeFile(path.join(ROOT, "search", "index.html"), pageShell({
  title: "Search the research library | Project S.P.H.E.R.E.",
  description: "Search research articles, knowledge guides, and glossary terms from Project S.P.H.E.R.E.",
  url: "/search/", content: searchContent, schema: searchSchema, scripts: ["/assets/publication-search.js"],
}));

const dashboardContent = `<div class="breadcrumbs"><a href="/">Home</a> / Analytics</div><header class="publication-header"><h1 class="page-title">Research library analytics</h1><p class="page-lede">Aggregate activity for the last 30 days. No individual visitor profiles are collected. See the <a href="/privacy/#analytics">analytics privacy notice</a>.</p></header><div class="analytics-toolbar"><label>Reporting window<select id="analytics-days"><option value="30">Last 30 days</option><option value="7">Last 7 days</option><option value="90">Last 90 days</option></select></label><button type="button" id="analytics-refresh">Refresh</button></div><p id="analytics-status" class="publication-status" aria-live="polite">Loading aggregate metrics…</p><div id="analytics-dashboard" class="analytics-grid"></div><noscript>Enable JavaScript to load aggregate analytics.</noscript>`;
const dashboardSchema = { "@context": "https://schema.org", "@graph": [...schemaBase(), { "@type": "WebPage", "@id": `${SITE}/analytics/#webpage`, url: `${SITE}/analytics/`, name: "Research library analytics", isPartOf: { "@id": `${SITE}/#website` } }] };
await mkdir(path.join(ROOT, "analytics"), { recursive: true });
await writeFile(path.join(ROOT, "analytics", "index.html"), pageShell({
  title: "Research library analytics | Project S.P.H.E.R.E.",
  description: "Aggregate readership, popular research pages, search queries, and referring sites for the Project S.P.H.E.R.E. research library.",
  url: "/analytics/", content: dashboardContent, schema: dashboardSchema, scripts: ["/assets/analytics-dashboard.js"], noindex: true,
}));

const catalog = researchCatalog(researchRecords);
const researchFile = path.join(ROOT, "research", "index.html");
let researchIndex = await readFile(researchFile, "utf8");
const markerStart = "<!-- PUBLICATION_CATALOG_START -->";
const markerEnd = "<!-- PUBLICATION_CATALOG_END -->";
if (!researchIndex.includes(markerStart)) {
  researchIndex = researchIndex.replace(/(<p class="page-meta">[\s\S]*?<\/p>)/i, `$1\n${markerStart}${markerEnd}`);
}
researchIndex = researchIndex.replace(/<!-- PUBLICATION_CATALOG_START -->[\s\S]*?<!-- PUBLICATION_CATALOG_END -->/, `${markerStart}${catalog}${markerEnd}`);
researchIndex = researchIndex.replace(/<meta property="article:modified_time"[^>]*>/i, `<meta property="article:modified_time" content="${TODAY}">`);
researchIndex = researchIndex.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, (_, content) => {
  const schema = JSON.parse(content);
  const webpage = schema["@graph"]?.find((item) => item["@type"] === "WebPage");
  if (webpage) webpage.dateModified = TODAY;
  return `<script type="application/ld+json">${toJsonLd(schema)}</script>`;
});
const updatedDate = dateLabel(TODAY);
if (/Updated <time datetime="[^"]+">[\s\S]*?<\/time>/.test(researchIndex)) {
  researchIndex = researchIndex.replace(/Updated <time datetime="[^"]+">[\s\S]*?<\/time>/, `Updated <time datetime="${TODAY}">${updatedDate}</time>`);
} else {
  researchIndex = researchIndex.replace(/(<p class="page-meta">[\s\S]*?<\/p>)/i, (meta) => meta.replace("</p>", ` · Updated <time datetime="${TODAY}">${updatedDate}</time></p>`));
}
if (!researchIndex.includes('src="/assets/publication-search.js"')) researchIndex = researchIndex.replace("</head>", '<script src="/assets/publication-search.js" defer></script><script src="/assets/analytics.js" defer></script></head>');
if (!researchIndex.includes('type="application/rss+xml"')) researchIndex = researchIndex.replace("</head>", `<link rel="alternate" type="application/rss+xml" title="Project S.P.H.E.R.E. Research" href="${SITE}/rss.xml"></head>`);
await writeFile(researchFile, researchIndex.replace(/\r\n|\n/g, "\r\n"));

await writeFile(path.join(ROOT, "assets", "publication-search.json"), safeJson(allSearchRecords.map((record) => ({
  title: record.title, description: record.description, url: record.url, kind: record.kind,
  category: record.category, tags: record.tags, published: record.published, text: record.plainText,
}))));
await writeFile(path.join(ROOT, "rss.xml"), rssFeed(researchRecords));
await updateLegacyPages(legacy, allSearchRecords);
await updateSitemap([
  "/", "/updates/", "/privacy/",
  "/research/",
  ...researchContent.map((record) => record.url),
  ...legacy.map((record) => record.url),
  ...knowledgeContent.map((record) => record.url),
  ...glossaryRecords.map((record) => record.url),
  "/knowledge/", "/glossary/",
]);

console.log(`Built publication: ${researchRecords.length} research pages, ${knowledgeRecords.length} knowledge pages, ${glossaryRecords.length} glossary terms.`);
