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
const LEGACY_SEO_TITLES = {
  "earth-motion-resonance-measurements": "Earth motion and resonance tests | Project S.P.H.E.R.E.",
  "earth-rotation-lorentz-invariance-resonator-tests": "Earth rotation and resonator tests | Project S.P.H.E.R.E.",
  "frequency-measurement-error-budget": "Frequency measurement error budget | Project S.P.H.E.R.E.",
  "record-replay-resonance": "Record-and-replay resonance | Project S.P.H.E.R.E.",
  "resonance-change-verification-protocol": "Resonance shift verification test | Project S.P.H.E.R.E.",
  "synchronous-clock-network-lessons": "Clock network timing lessons | Project S.P.H.E.R.E.",
};
const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "it", "of", "on", "or", "the", "to", "what", "when", "why", "with"]);
const e = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const xml = (value = "") => e(value);
const slugify = (value = "") => String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const words = (value = "") => String(value).replace(/<[^>]+>/g, " ").replace(/[`*_>#\[\]()]/g, " ").replace(/\s+/g, " ").trim();
const dateLabel = (value) => new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
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

function glossaryPlugin(terms, linkedTerms, currentUrl) {
  const sorted = terms.filter((item) => item.url !== currentUrl).sort((a, b) => b.term.length - a.term.length);
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
              if (linked) linkedTerms.add(linked.url);
        }
        if (node.type === "text" && !ignored.has(parent.type) && !ancestors.some((ancestor) => ignored.has(ancestor.type)) && node.value.trim()) {
          const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${sorted.map((item) => escapeRegExp(item.term)).join("|")})(?=$|[^\\p{L}\\p{N}])`, "giu");
          const pieces = [];
          let cursor = 0;
          let match;
          while ((match = pattern.exec(node.value))) {
            const term = sorted.find((item) => item.term.toLowerCase() === match[2].toLowerCase());
            if (!term || linkedTerms.has(term.url)) continue;
            const start = match.index + match[1].length;
            if (start > cursor) pieces.push({ type: "text", value: node.value.slice(cursor, start) });
            pieces.push({
              type: "link",
              url: term.url,
              data: { hProperties: {
                className: [term.kind === "article" ? "article-reference" : "glossary-link"],
                ...(term.kind === "article" ? { "data-article-reference": term.term } : { "data-glossary-term": term.term }),
              } },
              children: [{ type: "text", value: match[2] }],
            });
            linkedTerms.add(term.url);
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

async function readLinkableTerms(kinds) {
  const terms = [];
  for (const kind of kinds) {
    const dir = path.join(ROOT, "content", kind);
    let files;
    try { files = await readdir(dir); } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const file of files.filter((item) => item.endsWith(".mdx"))) {
      const source = await readFile(path.join(dir, file), "utf8");
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
      if (!frontmatter) throw new Error(`${file}: missing YAML frontmatter delimited by --- lines.`);
      const meta = parse(frontmatter[1]);
      if (meta?.draft === true || meta?.status === "draft") continue;
      const slug = meta?.slug || path.basename(file, ".mdx");
      if (meta?.title && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        terms.push({ term: String(meta.title), url: `/${kind}/${slug}/`, kind: "article" });
      }
    }
  }
  return terms;
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
  return (await Promise.all(files.filter((file) => file.endsWith(".mdx")).sort().map(async (file) => {
    const source = await readFile(path.join(dir, file), "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!frontmatter) throw new Error(`${file}: missing YAML frontmatter delimited by --- lines.`);
    const meta = parse(frontmatter[1]);
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) throw new Error(`${file}: frontmatter must be a YAML object.`);
    const slug = meta.slug || path.basename(file, ".mdx");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: slug must be lowercase words separated by hyphens.`);
    if (kind === "research" && ["archive", "authors", "category", "tag"].includes(slug)) {
      throw new Error(`${file}: slug "${slug}" is reserved for a research platform route.`);
    }
    if (meta.draft === true || meta.status === "draft") return null;
    const published = String(meta.publishedDate || meta.published || "");
    const updated = String(meta.updatedDate || meta.updated || published);
    for (const [field, value] of [["title", meta.title], ["description", meta.description], ["publishedDate", published], ["updatedDate", updated]]) {
      if (!value) throw new Error(`${file}: missing required frontmatter field "${field}".`);
    }
    if (!isIsoDate(published) || !isIsoDate(updated) || updated < published) {
      throw new Error(`${file}: publishedDate/updatedDate must be ISO dates and updatedDate cannot precede publishedDate.`);
    }
    const status = String(meta.status || "proposed");
    if (!["proposed", "planned", "in-review", "published"].includes(status)) throw new Error(`${file}: unsupported status "${status}".`);
    const url = `/${kind}/${slug}/`;
    if (meta.tags && !Array.isArray(meta.tags)) throw new Error(`${file}: tags must be a YAML list.`);
    if (meta.citations && !Array.isArray(meta.citations)) throw new Error(`${file}: citations must be a YAML list.`);
    const tags = [...new Set((meta.tags || []).map((tag) => String(tag).trim()).filter(Boolean))];
    const citations = (meta.citations || []).map((citation, index) => {
      if (!citation.id || !/^[a-z0-9][a-z0-9_-]*$/i.test(citation.id) || !citation.title || !citation.type) throw new Error(`${file}: citation ${index + 1} needs an alphanumeric id, title, and type.`);
      if (!["doi", "arxiv", "journal", "book", "conference", "website", "external"].includes(citation.type)) throw new Error(`${file}: citation "${citation.id}" has an unsupported type.`);
      if (citation.doi && !/^10\.\d{4,9}\/\S+$/i.test(citation.doi)) throw new Error(`${file}: invalid DOI "${citation.doi}".`);
      if (citation.arxiv && !/^\d{4}\.\d{4,5}(v\d+)?$/i.test(citation.arxiv)) throw new Error(`${file}: invalid arXiv id "${citation.arxiv}".`);
      if ((citation.type === "doi" && !citation.doi) || (citation.type === "arxiv" && !citation.arxiv)) throw new Error(`${file}: citation "${citation.id}" must include its ${citation.type} identifier.`);
      if (citation.url && !/^https:\/\//i.test(citation.url) && (!citation.url.startsWith("/") || citation.url.startsWith("//") || citation.url.includes(".."))) throw new Error(`${file}: citation URLs must use HTTPS or a safe site-relative path.`);
      return { ...citation, number: index + 1 };
    });
    if (new Set(citations.map((item) => item.id)).size !== citations.length || new Set(citations.map((item) => slugify(item.id))).size !== citations.length) {
      throw new Error(`${file}: citation IDs must be unique and produce unique reference anchors.`);
    }
    const canonicalUrl = meta.canonicalUrl || absolute(url);
    if (canonicalUrl !== absolute(url)) throw new Error(`${file}: canonicalUrl must match the article's official URL (${absolute(url)}).`);
    const featuredImage = String(meta.featuredImage || "");
    if (featuredImage && (!featuredImage.startsWith("/") || featuredImage.startsWith("//") || featuredImage.includes(".."))) {
      throw new Error(`${file}: featuredImage must be a site-relative path; external images are not allowed.`);
    }
    const authors = Array.isArray(meta.author) ? meta.author.map(String) : [String(meta.author || "Project S.P.H.E.R.E.")];
    if (authors.some((name) => !name.trim())) throw new Error(`${file}: author names cannot be empty.`);
    if (meta.faqs && !Array.isArray(meta.faqs)) throw new Error(`${file}: faqs must be a YAML list.`);
    if (meta.revisions && !Array.isArray(meta.revisions)) throw new Error(`${file}: revisions must be a YAML list.`);
    for (const revision of meta.revisions || []) {
      if (!isIsoDate(String(revision.date || "")) || revision.date < published || revision.date > updated) {
        throw new Error(`${file}: each revision needs an ISO date between publishedDate and updatedDate.`);
      }
    }
    for (const field of ["keywords", "seoKeywords"]) {
      if (meta[field] && !Array.isArray(meta[field])) throw new Error(`${file}: ${field} must be a YAML list.`);
    }
    const keywords = [...new Set([...(meta.keywords || []), ...(meta.seoKeywords || [])].map(String).map((item) => item.trim()).filter(Boolean))];
    const headings = [];
    const linkedTerms = new Set();
    const citationById = new Map(citations.map((citation) => [citation.id, citation]));
    let citationListRendered = false;
    const compiled = await compile(source.slice(frontmatter[0].length), {
      outputFormat: "function-body",
      remarkPlugins: [remarkGfm, glossaryPlugin(glossaryTerms, linkedTerms, url)],
      rehypePlugins: [headingPlugin(headings)],
      development: false,
    });
    const module = await run(String(compiled), { Fragment, jsx, jsxs });
    const Citation = ({ id }) => {
      const citation = citationById.get(id);
      if (!citation) throw new Error(`${file}: Citation references unknown citation id "${id}".`);
      return jsx("sup", { className: "citation-marker", children: jsx("a", { href: `#ref-${slugify(id)}`, "aria-label": `Citation ${citation.number}`, children: `[${citation.number}]` }) });
    };
    const CitationList = () => {
      citationListRendered = true;
      return citations.length ? jsx("div", { dangerouslySetInnerHTML: { __html: citationsMarkup(citations) } }) : null;
    };
    const Figure = ({ src, alt = "", caption = "", credit = "" }) => {
      if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//") || src.includes("..")) {
        throw new Error(`${file}: Figure src must be a site-relative path; external images are not allowed.`);
      }
      return jsx("figure", { className: "research-figure", children: [
        jsx("img", { src, alt, loading: "lazy", decoding: "async" }),
        caption || credit ? jsx("figcaption", { children: [caption, credit ? ` Credit: ${credit}` : ""].filter(Boolean).join(" ") }) : null,
      ] });
    };
    const callout = (className, label) => ({ title = label, children }) => jsx("aside", {
      className: `research-callout ${className}`,
      "aria-label": title,
      children: [jsx("strong", { children: title }), children ? jsx("div", { children }) : null],
    });
    const ResearchNote = callout("research-note", "Research note");
    const WarningBox = callout("warning-box", "Caution");
    const ExperimentStep = ({ number, title = "", children }) => jsx("section", {
      className: "experiment-step",
      children: [jsx("h3", { children: `Step ${number || ""}${title ? `: ${title}` : ""}` }), children],
    });
    const Equation = ({ latex = "", label = "Mathematical expression" }) => jsx("div", {
      className: "research-equation",
      role: "group",
      "aria-label": label,
      children: jsx("code", { children: latex }),
    });
    const ReferenceCard = ({ title, url = "", authors = "", year = "" }) => {
      if (url && !/^https:\/\//i.test(url) && (!url.startsWith("/") || url.startsWith("//") || url.includes(".."))) throw new Error(`${file}: ReferenceCard URLs must use HTTPS or a safe site-relative path.`);
      return jsx("aside", { className: "reference-card", children: [
        jsx("strong", { children: url ? jsx("a", { href: url, children: title }) : title }),
        [authors, year].filter(Boolean).length ? jsx("p", { children: [authors, year].filter(Boolean).join(" · ") }) : null,
      ] });
    };
    const DataPoint = ({ label, value, unit = "", note = "" }) => jsx("dl", {
      className: "research-data-point",
      children: [
        jsx("dt", { children: label }),
        jsx("dd", { children: `${value ?? ""}${unit ? ` ${unit}` : ""}` }),
        note ? jsx("dd", { className: "data-point-note", children: note }) : null,
      ],
    });
    const ProtocolBlock = ({ title = "Protocol", children }) => jsx("section", {
      className: "protocol-block",
      children: [jsx("h3", { children: title }), children],
    });
    const EquipmentSpec = ({ title = "Equipment specification", items = {} }) => jsx("section", {
      className: "equipment-spec",
      children: [jsx("h3", { children: title }), jsx("dl", {
        children: Object.entries(items).flatMap(([key, value]) => [jsx("dt", { children: key }, `term-${key}`), jsx("dd", { children: String(value) }, `value-${key}`)]),
      })],
    });
    const bodyHtml = renderToStaticMarkup(jsx(module.default, {
      components: {
        Citation,
        CitationList,
        Figure,
        ResearchNote,
        WarningBox,
        ExperimentStep,
        Equation,
        ReferenceCard,
        DataPoint,
        ProtocolBlock,
        EquipmentSpec,
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
      canonicalUrl,
      published,
      updated,
      publishedDate: published,
      updatedDate: updated,
      status,
      featured: meta.featured === true,
      featuredImage,
      featuredImageAlt: String(meta.featuredImageAlt || meta.title),
      keywords,
      tags,
      category: String(meta.category || (kind === "research" ? "Research" : kind === "knowledge" ? "Knowledge base" : "Glossary")),
      subCategory: String(meta.subCategory || ""),
      author: meta.author || "Project S.P.H.E.R.E.",
      authors,
      related: [...new Set((meta.relatedArticles || meta.related || []).map(String))],
      relatedArticles: [...new Set((meta.relatedArticles || meta.related || []).map(String))],
      knowledge: [...new Set((meta.knowledge || []).map(String))],
      citations,
      headings,
      citationListRendered,
      bodyHtml,
      plainText,
      readTime: Number.isInteger(meta.readingTime) && meta.readingTime > 0 ? meta.readingTime : readTime,
      readingTime: Number.isInteger(meta.readingTime) && meta.readingTime > 0 ? meta.readingTime : readTime,
    };
  }))).filter(Boolean);
}

let glossaryTerms = [];
let authorProfiles = [];

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
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/search/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

function schemaFor(record, breadcrumbs, faqs = []) {
  const authors = record.authors.map((name) => {
    const profile = authorProfiles.find((item) => item.name === name);
    return profile?.type === "Organization"
      ? { "@type": "Organization", "@id": `${absolute(`/research/authors/${profile.slug}/`)}#author`, name }
      : { "@type": "Person", "@id": `${absolute(`/research/authors/${profile?.slug || slugify(name)}/`)}#author`, name };
  });
  const page = {
    "@type": record.kind === "research" ? ["Article", "BlogPosting"] : record.kind === "knowledge" ? "Article" : "DefinedTerm",
    "@id": `${absolute(record.url)}#content`,
    url: record.canonicalUrl || absolute(record.url),
    headline: record.title,
    name: record.title,
    description: record.seoDescription || record.description,
    isPartOf: { "@id": `${SITE}/#website` },
    inLanguage: "en",
    datePublished: record.published,
    dateModified: record.updated,
    author: authors,
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: absolute(record.url),
    image: record.featuredImage ? `${SITE}${record.featuredImage}` : BRAND_IMAGE,
    keywords: [...record.tags, ...(record.keywords || [])].join(", "),
    articleSection: record.category,
    citation: record.citations.map((citation) => citation.url || (citation.doi ? `https://doi.org/${citation.doi}` : citation.arxiv ? `https://arxiv.org/abs/${citation.arxiv}` : citation.title)),
  };
  const authorNodes = authorProfiles.filter((profile) => record.authors.includes(profile.name)).map((profile) => ({
    "@type": profile.type === "Organization" ? "Organization" : "Person",
    "@id": `${absolute(`/research/authors/${profile.slug}/`)}#author`,
    name: profile.name,
    description: profile.bio,
    url: absolute(`/research/authors/${profile.slug}/`),
    sameAs: profile.links.map((link) => link.url).filter((url) => /^https:\/\//i.test(url)),
    knowsAbout: profile.interests,
  }));
  const graph = [...schemaBase(), ...authorNodes, {
    "@type": "WebPage",
    "@id": `${absolute(record.url)}#webpage`,
    url: absolute(record.url),
    name: record.seoTitle || record.title,
    description: record.seoDescription || record.description,
    isPartOf: { "@id": `${SITE}/#website` },
    dateModified: record.updated,
    mainEntity: { "@id": `${absolute(record.url)}#content` },
  }, page, {
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

function pageHead({ title, description, url, type = "website", schema, noindex = false, canonicalUrl, image = BRAND_IMAGE, keywords = "", authors = [], published, updated }) {
  const canonical = canonicalUrl || absolute(url);
  const robots = noindex ? "noindex,follow" : "index,follow,max-image-preview:large";
  const articleMetadata = published && updated ? `<meta name="author" content="${e(authors.join(", "))}"><meta property="article:published_time" content="${e(published)}"><meta property="article:modified_time" content="${e(updated)}">` : "";
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="robots" content="${robots}">${keywords ? `<meta name="keywords" content="${e(keywords)}">` : ""}${articleMetadata}
<meta name="theme-color" content="#05070a">
<link rel="canonical" href="${e(canonical)}"><link rel="alternate" type="application/rss+xml" title="Project S.P.H.E.R.E. Research" href="${SITE}/rss.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Project S.P.H.E.R.E.">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${e(image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}">
<meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(image)}">
<link href="/assets/site.css" rel="stylesheet"><link href="/assets/publication.css" rel="stylesheet">
<script type="application/ld+json">${toJsonLd(schema)}</script>`;
}

function pageShell({ title, description, url, content, schema, scripts = [], noindex = false, type, canonicalUrl, image, keywords, authors, published, updated }) {
  const scriptTags = [...new Set([...scripts, "/assets/analytics.js"])].map((src) => `<script src="${src}" defer></script>`).join("");
  return `<!doctype html><html lang="en"><head>${pageHead({ title, description, url, type, schema, noindex, canonicalUrl, image, keywords, authors, published, updated })}${scriptTags}</head><body><a class="skip-link" href="#main-content">Skip to content</a>${navigation}<main id="main-content" class="content-shell publication-shell">${content}</main>${footer}</body></html>\n`;
}

function articleCard(record, headingLevel = 3) {
  const labels = [...record.tags, record.category].map((label) => `<span class="publication-tag">${e(label)}</span>`).join("");
  return `<article class="publication-result" data-kind="${e(record.kind)}" data-category="${e(record.category.toLowerCase())}" data-tags="${e(record.tags.map((tag) => slugify(tag)).join("|"))}" data-authors="${e(record.authors.map((author) => author.toLowerCase()).join("|"))}" data-published="${e(record.published)}" data-featured="${record.featured === true}" data-search="${e(`${record.title} ${record.description} ${record.tags.join(" ")} ${record.authors.join(" ")}`.toLowerCase())}">
<p class="publication-card-meta">${e(record.category)} <span aria-hidden="true">/</span> <time datetime="${e(record.published)}">${dateLabel(record.published)}</time> <span aria-hidden="true">/</span> ${record.readTime ? `${record.readTime} min read` : "Concept guide"}</p>
<h${headingLevel}><a href="${e(record.url)}">${e(record.title)}</a></h${headingLevel}><p>${e(record.description)}</p><div class="publication-tags">${labels}</div></article>`;
}

function searchControls(records) {
  const categories = [...new Set(records.map((record) => record.category))].sort((a, b) => a.localeCompare(b));
  const tags = [...new Set(records.flatMap((record) => record.tags))].sort((a, b) => a.localeCompare(b));
  return `<form class="publication-search" role="search" data-publication-search>
<label>Search the library<input type="search" name="q" autocomplete="off" placeholder="Search articles, authors, and concepts" aria-label="Search articles, authors, and concepts" aria-controls="publication-results"></label>
<label>Category<select name="category"><option value="">All categories</option>${categories.map((category) => `<option value="${e(category.toLowerCase())}">${e(category)}</option>`).join("")}</select></label>
<label>Tag<select name="tag"><option value="">All tags</option>${tags.map((tag) => `<option value="${e(slugify(tag))}">${e(tag)}</option>`).join("")}</select></label>
<p class="publication-status" aria-live="polite" data-search-status>${records.length} items</p></form>`;
}

function tocMarkup(headings) {
  if (!headings.length) return "";
  return `<nav class="publication-toc" aria-label="Table of contents"><details open><summary>On this page</summary><ol>${headings.map(({ id, title, level }) => `<li class="toc-level-${level}"><a href="#${e(id)}">${e(title)}</a></li>`).join("")}</ol></details></nav>`;
}

function citationsMarkup(citations) {
  if (!citations.length) return "";
  return `<section class="publication-references" aria-labelledby="references-title"><h2 id="references-title">References</h2><ol>${citations.map((citation) => {
    const link = citation.url || (citation.doi ? `https://doi.org/${citation.doi}` : citation.arxiv ? `https://arxiv.org/abs/${citation.arxiv}` : null);
    const details = [citation.authors, citation.journal || citation.publisher || citation.booktitle, citation.year].filter(Boolean).map(e).join(". ");
    const identifier = citation.doi ? `DOI: ${e(citation.doi)}` : citation.arxiv ? `arXiv:${e(citation.arxiv)}` : null;
    return `<li id="ref-${e(slugify(citation.id))}"><span>${e(citation.title)}${details ? `. ${details}` : ""}${identifier ? `. ${identifier}` : ""}</span>${link ? ` <a href="${e(link)}" rel="noopener noreferrer" target="_blank">Open ${e(citation.type)} reference</a>` : ""}</li>`;
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
  const tags = record.tags.map((tag) => record.kind === "research"
    ? `<a class="publication-tag" href="/research/tag/${e(slugify(tag))}/">${e(tag)}</a>`
    : `<a class="publication-tag" href="/search/?tag=${encodeURIComponent(slugify(tag))}">${e(tag)}</a>`).join("");
  const categoryLink = record.kind === "research"
    ? `<a class="publication-tag" href="/research/category/${e(slugify(record.category))}/">${e(record.category)}</a>`
    : `<span class="publication-tag">${e(record.category)}</span>`;
  const authorMarkup = record.authors.map((name) => {
    const profile = authorProfiles.find((item) => item.name === name);
    return `<a href="/research/authors/${e(profile?.slug || slugify(name))}/">${e(name)}</a>`;
  }).join(", ");
  const authorPanel = record.authors.map((name) => {
    const profile = authorProfiles.find((item) => item.name === name);
    return `<section class="author-panel" aria-label="About the author"><h2>About ${e(name)}</h2><p>${e(profile?.bio || "Author biography has not been provided yet.")}</p><a href="/research/authors/${e(profile?.slug || slugify(name))}/">View author profile and articles</a></section>`;
  }).join("");
  const meta = `<p class="publication-byline">${authorMarkup} <span aria-hidden="true">·</span> Published <time datetime="${e(record.published)}">${dateLabel(record.published)}</time> <span aria-hidden="true">·</span> Updated <time datetime="${e(record.updated)}">${dateLabel(record.updated)}</time> <span aria-hidden="true">·</span> ${record.readTime} min read <span aria-hidden="true">·</span> ${record.citations.length} ${record.citations.length === 1 ? "reference" : "references"} <span aria-hidden="true">·</span> <span class="research-status">${e(record.status === "published" ? "Published" : "Proposal stage")}</span></p>`;
  const references = record.citationListRendered ? "" : citationsMarkup(record.citations);
  const relatedSection = related.length ? `<section class="publication-related" aria-labelledby="related-title"><h2 id="related-title">Related articles</h2><ul>${related.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a><p>${e(item.description)}</p></li>`).join("")}</ul></section>` : "";
  const relatedTermsSection = relatedTerms.length ? `<section class="publication-related" aria-labelledby="related-terms-title"><h2 id="related-terms-title">Related terms</h2><ul>${relatedTerms.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a><p>${e(item.description)}</p></li>`).join("")}</ul></section>` : "";
  const knowledgeSection = knowledge.length ? `<section class="publication-related" aria-labelledby="concepts-title"><h2 id="concepts-title">Related concepts</h2><ul>${knowledge.map((item) => `<li><a href="${e(item.url)}">${e(item.title)}</a></li>`).join("")}</ul></section>` : "";
  const previousNext = newer || older ? `<nav class="publication-article-nav" aria-label="Article navigation">${older ? `<a rel="prev" href="${e(older.url)}"><span>Previous article</span>${e(older.title)}</a>` : "<span></span>"}${newer ? `<a rel="next" href="${e(newer.url)}"><span>Next article</span>${e(newer.title)}</a>` : ""}</nav>` : "";
  const faqs = record.faqs || [];
  const image = record.featuredImage ? `<figure class="publication-hero"><img src="${e(record.featuredImage)}" alt="${e(record.featuredImageAlt)}" loading="lazy" decoding="async"></figure>` : "";
  const disclaimer = record.kind === "research" ? `<aside class="research-disclaimer" aria-label="Research status notice"><strong>Research status:</strong> Project S.P.H.E.R.E. is at proposal stage. This page presents a hypothesis, plan, or method—not a measurement result or scientific validation.</aside>` : "";
  const share = `<nav class="publication-share" aria-label="Share this article"><span>Share</span><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absolute(record.url))}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="mailto:?subject=${encodeURIComponent(record.title)}&body=${encodeURIComponent(absolute(record.url))}">Email</a><a href="https://bsky.app/intent/compose?text=${encodeURIComponent(`${record.title} ${absolute(record.url)}`)}" target="_blank" rel="noopener noreferrer">Bluesky</a></nav>`;
  const revisionEntries = Array.isArray(record.revisions) && record.revisions.length
    ? record.revisions
    : [{ date: record.published, note: record.updated === record.published ? "Initial publication; no separate revision note supplied." : "Initial publication." },
      ...(record.updated !== record.published ? [{ date: record.updated, note: "Last updated; details not itemized." }] : [])];
  const revisions = `<details class="revision-history"><summary>Revision history</summary><ol>${revisionEntries.map((item) => `<li><time datetime="${e(item.date)}">${e(item.date)}</time>${item.note ? ` — ${e(item.note)}` : ""}</li>`).join("")}</ol></details>`;
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / <a href="/research/">Research</a> / ${e(record.title)}</div>
<article class="publication-article"><header class="publication-header">${image}<p class="publication-category">${categoryLink}</p><h1 class="page-title">${e(record.title)}</h1><p class="page-lede">${e(record.description)}</p>${meta}<div class="publication-tags">${tags}</div>${share}</header>
${disclaimer}<div class="publication-reading-layout">${tocMarkup(record.headings)}<div class="article-body publication-body">${record.bodyHtml}${faqMarkup(faqs)}${references}${revisions}${authorPanel}${knowledgeSection}${relatedSection}${relatedTermsSection}${previousNext}</div></div></article>`;
  const schema = schemaFor(record, breadcrumbs, faqs);
  const baseTitle = record.kind === "glossary"
    ? `${record.title} | Glossary | S.P.H.E.R.E.`
    : record.kind === "knowledge"
      ? `${record.title} | Knowledge | S.P.H.E.R.E.`
      : `${record.title} | Project S.P.H.E.R.E.`;
  return pageShell({
    title: record.seoTitle || baseTitle,
    description: record.seoDescription || record.description,
    url: record.url,
    canonicalUrl: record.canonicalUrl,
    image: record.featuredImage ? `${SITE}${record.featuredImage}` : BRAND_IMAGE,
    keywords: record.keywords.join(", "),
    content,
    schema,
    scripts: ["/assets/publication-article.js"],
    type: "article",
    authors: record.authors,
    published: record.published,
    updated: record.updated,
  });
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
  const cardHeadingLevel = route === "/knowledge/" ? 2 : 3;
  const results = route === "/glossary/" ? glossaryAlphabet(records) : `<div class="publication-results" id="publication-results" data-search-results>${records.map((record) => articleCard(record, cardHeadingLevel)).join("")}</div>`;
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / ${e(title)}</div><header class="publication-header"><h1 class="page-title">${e(title)}</h1><p class="page-lede">${e(lead)}</p></header>
${searchControls(records)}${results}<p class="publication-empty" data-search-empty hidden>No items match those filters. Try a different term or clear a filter.</p>`;
  return pageShell({ title: `${title} | Project S.P.H.E.R.E.`, description, url: route, content, schema: indexSchema(title, description, route, records), scripts: ["/assets/publication-search.js"] });
}

function researchCatalog(records) {
  const categories = [...new Set(records.map((record) => record.category))].sort();
  const topics = categories.map((category) => `<a class="publication-tag" href="/research/category/${e(slugify(category))}/">${e(category)}</a>`).join("");
  const featured = records.filter((record) => record.featured);
  const recent = records.slice(0, 3);
  const discovery = `${featured.length ? `<section class="publication-discovery" aria-labelledby="featured-title"><h2 id="featured-title">Editor's picks</h2><div class="publication-results">${featured.map((record) => articleCard(record)).join("")}</div></section>` : ""}<section class="publication-discovery" aria-labelledby="recent-title"><h2 id="recent-title">Recent publications</h2><div class="publication-results">${recent.map((record) => articleCard(record)).join("")}</div></section><section class="publication-discovery" aria-labelledby="popular-title" data-popular-articles hidden><h2 id="popular-title">Popular in the last 30 days</h2><ol data-popular-results></ol></section><section class="publication-discovery" aria-labelledby="trending-title" data-trending-articles hidden><h2 id="trending-title">Trending over the last 7 days</h2><ol data-trending-results></ol></section>`;
  return `<section class="publication-catalog" aria-labelledby="journal-title"><h2 id="journal-title">Research journal</h2><p>Browse proposal-stage research and methods. Hypotheses are not findings; no project measurement results are reported here.</p>
${discovery}<nav class="publication-topics" aria-label="Research topics">${topics}</nav>${searchControls(records)}<div class="publication-results" id="publication-results" data-search-results>${records.map((record) => articleCard(record)).join("")}</div><p class="publication-empty" data-search-empty hidden>No articles match those filters. Try a different term or clear a filter.</p><p class="publication-more"><a href="/research/archive/">Browse the archive</a> <span aria-hidden="true">·</span> <a href="/research/authors/">Authors</a> <span aria-hidden="true">·</span> <a href="/search/">Search the full library</a> <span aria-hidden="true">·</span> <a href="/knowledge/">Knowledge base</a> <span aria-hidden="true">·</span> <a href="/glossary/">Glossary</a> <span aria-hidden="true">·</span> <a href="/analytics/">Aggregate analytics</a></p></section>`;
}

function authorDirectory(profiles) {
  const entries = profiles.map((profile) => `<article class="publication-result"><h2><a href="/research/authors/${e(profile.slug)}/">${e(profile.name)}</a></h2><p>${e(profile.bio)}</p><p>${profile.articles.length} ${profile.articles.length === 1 ? "article" : "articles"}</p></article>`).join("");
  const route = "/research/authors/";
  const title = "Research authors";
  const description = "Author profiles, research interests, and publications from Project S.P.H.E.R.E.";
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / <a href="/research/">Research</a> / Authors</div><header class="publication-header"><h1 class="page-title">${title}</h1><p class="page-lede">${description}</p></header><div class="publication-results">${entries || "<p>Author profiles will appear here when research is published.</p>"}</div>`;
  return pageShell({ title: `${title} | Project S.P.H.E.R.E.`, description, url: route, content, schema: indexSchema(title, description, route, []) });
}

function authorPage(profile) {
  const route = `/research/authors/${profile.slug}/`;
  const title = `${profile.name} | Research author`;
  const articleList = profile.articles.map((record) => `<li><a href="${e(record.url)}">${e(record.title)}</a><p>${e(record.description)}</p></li>`).join("");
  const interests = profile.interests.length ? profile.interests.map((item) => `<span class="publication-tag">${e(item)}</span>`).join("") : "<p>No research interests have been listed.</p>";
  const links = profile.links.length ? `<ul>${profile.links.map((item) => `<li><a href="${e(item.url)}" rel="noopener noreferrer"${item.url.startsWith("https://") ? ' target="_blank"' : ""}>${e(item.label)}</a></li>`).join("")}</ul>` : "<p>No external links have been provided.</p>";
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / <a href="/research/">Research</a> / <a href="/research/authors/">Authors</a> / ${e(profile.name)}</div><header class="publication-header"><h1 class="page-title">${e(profile.name)}</h1><p class="page-lede">${e(profile.bio)}</p><p class="publication-byline">${profile.articles.length} ${profile.articles.length === 1 ? "publication" : "publications"}</p></header><section class="author-interests"><h2>Research interests</h2><div class="publication-tags">${interests}</div></section><section class="author-links"><h2>Links</h2>${links}</section><section class="publication-related"><h2>Articles</h2>${articleList ? `<ul>${articleList}</ul>` : "<p>No articles have been published under this profile.</p>"}</section>`;
  const schema = { "@context": "https://schema.org", "@graph": [
    ...schemaBase(),
    { "@type": profile.type === "Organization" ? "Organization" : "Person", "@id": `${absolute(route)}#author`, name: profile.name, description: profile.bio, url: absolute(route), knowsAbout: profile.interests, sameAs: profile.links.map((item) => item.url).filter((url) => url.startsWith("https://")) },
    { "@type": "ProfilePage", "@id": `${absolute(route)}#webpage`, url: absolute(route), name: title, mainEntity: { "@id": `${absolute(route)}#author` }, isPartOf: { "@id": `${SITE}/#website` } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Research authors", item: absolute("/research/authors/") },
      { "@type": "ListItem", position: 3, name: profile.name, item: absolute(route) },
    ] },
  ] };
  return pageShell({ title: `${profile.name} | Research author`, description: profile.bio, url: route, content, schema });
}

function taxonomyPage({ title, route, records, description }) {
  const content = `<div class="breadcrumbs"><a href="/">Home</a> / <a href="/research/">Research</a> / ${e(title)}</div><header class="publication-header"><h1 class="page-title">${e(title)}</h1><p class="page-lede">${e(description)}</p></header><div class="publication-results" id="publication-results" data-search-results>${records.map((record) => articleCard(record, 2)).join("")}</div>`;
  const seoTitle = title.startsWith("Research tagged ")
    ? `${title.slice("Research tagged ".length).replace(/[“”"]/g, "")} | Research | Project S.P.H.E.R.E.`
    : `${title} | Research | Project S.P.H.E.R.E.`;
  return pageShell({ title: seoTitle, description, url: route, content, schema: indexSchema(title, description, route, records) });
}

async function makeAuthorProfiles(records) {
  let configured = [];
  try {
    configured = JSON.parse(await readFile(path.join(ROOT, "content", "authors.json"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!Array.isArray(configured)) throw new Error("content/authors.json must contain an array of author profiles.");
  const profiles = configured.map((profile, index) => {
    if (!profile.name || typeof profile.name !== "string") throw new Error(`content/authors.json profile ${index + 1} needs a name.`);
    const slug = profile.slug || slugify(profile.name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Author "${profile.name}" has an invalid slug.`);
    const links = (profile.links || []).map((link) => {
      if (!link.label || !link.url || (!/^https:\/\//i.test(link.url) && (!link.url.startsWith("/") || link.url.startsWith("//") || link.url.includes("..")))) {
        throw new Error(`Author "${profile.name}" links need a label and an HTTPS or site-relative URL.`);
      }
      return { label: String(link.label), url: String(link.url) };
    });
    return {
      name: profile.name,
      slug,
      type: profile.type === "Organization" ? "Organization" : "Person",
      bio: String(profile.bio || "No biography has been provided for this author yet."),
      interests: (profile.interests || []).map(String),
      links,
      articles: [],
    };
  });
  if (new Set(profiles.map((profile) => profile.name)).size !== profiles.length || new Set(profiles.map((profile) => profile.slug)).size !== profiles.length) {
    throw new Error("Author profiles must have unique names and slugs.");
  }
  const byName = new Map(profiles.map((profile) => [profile.name, profile]));
  for (const record of records.filter((item) => item.kind === "research")) {
    for (const name of record.authors) {
      if (!byName.has(name)) {
        const profile = { name, slug: slugify(name), type: "Person", bio: "No biography has been provided for this author yet.", interests: [], links: [], articles: [] };
        profiles.push(profile);
        byName.set(name, profile);
      }
      byName.get(name).articles.push(record);
    }
  }
  if (profiles.some((profile) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.slug))) {
    throw new Error("Author names must resolve to valid profile slugs; set explicit slugs in content/authors.json.");
  }
  if (new Set(profiles.map((profile) => profile.slug)).size !== profiles.length) {
    throw new Error("Author names must resolve to unique profile slugs; set explicit slugs in content/authors.json.");
  }
  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

function glossaryAlphabet(records) {
  const letters = [...new Set(records.map((record) => record.title.trim()[0].toUpperCase()))].sort();
  const groups = letters.map((letter) => {
    const items = records.filter((record) => record.title.trim()[0].toUpperCase() === letter);
    return `<section class="glossary-group" id="letter-${e(letter)}" aria-labelledby="heading-${e(letter)}"><h2 id="heading-${e(letter)}">${e(letter)}</h2><div>${items.map((record) => articleCard(record)).join("")}</div></section>`;
  }).join("");
  return `<nav class="glossary-alphabet" aria-label="Glossary letters">${letters.map((letter) => `<a href="#letter-${e(letter)}">${e(letter)}</a>`).join("")}</nav><div class="publication-results" id="publication-results" data-search-results>${groups}</div>`;
}

async function readLegacyResearch(generatedSlugs) {
  const dir = path.join(ROOT, "research");
  const entries = await readdir(dir, { withFileTypes: true });
  const pages = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    if (["archive", "authors", "category", "tag"].includes(entry.name)) continue;
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
      canonicalUrl: absolute(`/research/${entry.name}/`), status: "proposed", keywords: [], featured: false, featuredImage: "",
      seoTitle: LEGACY_SEO_TITLES[entry.name],
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
  const title = record.seoTitle || `${record.title} | Project S.P.H.E.R.E.`;
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
    const profile = authorProfiles.find((item) => item.name === record.authors[0]);
    const authorLink = `<a href="/research/authors/${e(profile?.slug || slugify(record.authors[0]))}/">${e(record.authors[0])}</a>`;
    const byline = `<p class="page-meta">${authorLink} <span aria-hidden="true">·</span> Published <time datetime="${e(record.published)}">${dateLabel(record.published)}</time> <span aria-hidden="true">·</span> Updated <time datetime="${e(record.updated)}">${dateLabel(record.updated)}</time> <span aria-hidden="true">·</span> ${record.readTime} min read <span aria-hidden="true">·</span> Proposal stage <span aria-hidden="true">·</span> <a class="publication-tag" href="/research/category/${e(slugify(record.category))}/">${e(record.category)}</a></p>`;
    if (/<p class="page-meta">[\s\S]*?<\/p>/i.test(html)) html = html.replace(/<p class="page-meta">[\s\S]*?<\/p>/i, byline);
    else html = html.replace(/<\/h1>/i, `</h1>${byline}`);
    if (!html.includes('class="research-disclaimer"')) {
      html = html.replace(/(<p class="page-meta">[\s\S]*?<\/p>)/i, '$1<aside class="research-disclaimer" aria-label="Research status notice"><strong>Research status:</strong> Project S.P.H.E.R.E. is at proposal stage. This page presents a hypothesis, plan, or method—not a measurement result or scientific validation.</aside>');
    }
    if (!html.includes('class="publication-share"')) {
      const url = absolute(record.url);
      const share = `<nav class="publication-share" aria-label="Share this article"><span>Share</span><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="mailto:?subject=${encodeURIComponent(record.title)}&body=${encodeURIComponent(url)}">Email</a><a href="https://bsky.app/intent/compose?text=${encodeURIComponent(`${record.title} ${url}`)}" target="_blank" rel="noopener noreferrer">Bluesky</a></nav>`;
      html = html.replace(/(<p class="page-meta">[\s\S]*?<\/p>)/i, `$1${share}`);
    }
    if (!html.includes('class="author-panel"')) {
      const bio = e(profile?.bio || "Author biography has not been provided yet.");
      const panel = `<section class="author-panel" aria-label="About the author"><h2>About Project S.P.H.E.R.E.</h2><p>${bio}</p><a href="/research/authors/${e(profile?.slug || "project-sphere")}/">View author profile and articles</a></section>`;
      html = html.replace("</article>", `${panel}</article>`);
    }
    const block = legacyArticleNavigation(record, records);
    if (/<!-- PUBLICATION_NAV_START -->[\s\S]*?<!-- PUBLICATION_NAV_END -->/.test(html)) {
      html = html.replace(/<!-- PUBLICATION_NAV_START -->[\s\S]*?<!-- PUBLICATION_NAV_END -->/, block);
    } else {
      html = html.replace("</article>", `${block}</article>`);
    }
    const toc = record.headings.length ? `<nav class="article-aside publication-toc" aria-label="Table of contents"><details open><summary>On this page</summary><ol>${record.headings.map((heading) => `<li class="toc-level-${heading.level}"><a href="#${e(heading.id)}">${e(heading.title)}</a></li>`).join("")}</ol></details></nav>` : "";
    const oldToc = /<aside class="[^"]*\barticle-aside\b[^"]*\bpublication-toc\b"[\s\S]*?<\/aside>/i;
    if (oldToc.test(html)) html = html.replace(oldToc, toc);
    if (!html.includes('src="/assets/analytics.js"')) html = html.replace("</head>", '<script src="/assets/analytics.js" defer></script></head>');
    if (!html.includes('src="/assets/publication-article.js"')) html = html.replace("</head>", '<script src="/assets/publication-article.js" defer></script></head>');
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
glossaryTerms = [
  ...glossaryContent.map((term) => ({ term: term.title, url: term.url, kind: "glossary" })),
  ...await readLinkableTerms(["research", "knowledge"]),
];
const researchContent = await readContent("research");
const knowledgeContent = await readContent("knowledge");
const legacy = await readLegacyResearch(new Set(researchContent.map((record) => record.slug)));
const records = [...researchContent, ...knowledgeContent, ...glossaryContent, ...legacy];
const researchRecords = [...researchContent, ...legacy].sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
const knowledgeRecords = knowledgeContent.sort((a, b) => a.title.localeCompare(b.title));
const glossaryRecords = glossaryContent.sort((a, b) => a.title.localeCompare(b.title));
const allSearchRecords = [...researchRecords, ...knowledgeRecords, ...glossaryRecords];
authorProfiles = await makeAuthorProfiles(allSearchRecords);

const duplicate = new Set();
for (const record of records) {
  const key = `${record.kind}:${record.slug}`;
  if (duplicate.has(key)) throw new Error(`Duplicate ${record.kind} slug: ${record.slug}`);
  duplicate.add(key);
  for (const reference of record.related) {
    if (!records.some((candidate) => candidate.slug === reference || candidate.url === reference)) {
      throw new Error(`${record.url}: related article "${reference}" does not exist.`);
    }
  }
  for (const reference of record.knowledge) {
    if (!records.some((candidate) => candidate.kind === "knowledge" && candidate.slug === reference)) {
      throw new Error(`${record.url}: related knowledge page "${reference}" does not exist.`);
    }
  }
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
const searchContent = `<div class="breadcrumbs"><a href="/">Home</a> / Search</div><header class="publication-header"><h1 class="page-title">Search the research library</h1><p class="page-lede">Search research articles, authors, tags, categories, knowledge guides, and glossary terms. Search terms are counted only as daily aggregates; see the <a href="/privacy/">privacy notice</a>.</p></header>${searchControls(allSearchRecords)}<h2 class="sr-only">Search results</h2><div class="publication-results" id="publication-results" data-search-results>${allSearchRecords.map((record) => articleCard(record)).join("")}</div><p class="publication-empty" data-search-empty hidden>No results. Try a different term or filter.</p>`;
const searchSchema = { "@context": "https://schema.org", "@graph": [...schemaBase(), { "@type": "SearchResultsPage", "@id": `${SITE}/search/#webpage`, url: `${SITE}/search/`, name: "Search the research library", isPartOf: { "@id": `${SITE}/#website` } }] };
await mkdir(path.join(ROOT, "search"), { recursive: true });
await writeFile(path.join(ROOT, "search", "index.html"), pageShell({
  title: "Search the research library | Project S.P.H.E.R.E.",
  description: "Search research articles, knowledge guides, and glossary terms from Project S.P.H.E.R.E.",
  url: "/search/", content: searchContent, schema: searchSchema, scripts: ["/assets/publication-search.js"],
}));

const dashboardContent = `<div class="breadcrumbs"><a href="/">Home</a> / Content insights</div><header class="publication-header"><h1 class="page-title">Research library content insights</h1><p class="page-lede">Aggregate activity for the last 30 days. This dashboard is public and contains no individual visitor profiles. See the <a href="/privacy/#analytics">analytics privacy notice</a>.</p></header><div class="analytics-toolbar"><label>Reporting window<select id="analytics-days"><option value="30">Last 30 days</option><option value="7">Last 7 days</option><option value="90">Last 90 days</option></select></label><button type="button" id="analytics-refresh">Refresh</button></div><p id="analytics-status" class="publication-status" aria-live="polite">Loading aggregate metrics…</p><p class="analytics-method">Trending compares page views from the most recent seven days with the preceding seven days.</p><h2 class="sr-only">Content activity</h2><div id="analytics-dashboard" class="analytics-grid"></div><noscript>Enable JavaScript to load aggregate analytics.</noscript>`;
const dashboardSchema = { "@context": "https://schema.org", "@graph": [...schemaBase(), { "@type": "WebPage", "@id": `${SITE}/analytics/#webpage`, url: `${SITE}/analytics/`, name: "Research library analytics", isPartOf: { "@id": `${SITE}/#website` } }] };
await mkdir(path.join(ROOT, "analytics"), { recursive: true });
await writeFile(path.join(ROOT, "analytics", "index.html"), pageShell({
  title: "Research library content insights | Project S.P.H.E.R.E.",
  description: "Aggregate readership, popular research pages, search queries, and referring sites for the Project S.P.H.E.R.E. research library.",
  url: "/analytics/", content: dashboardContent, schema: dashboardSchema, scripts: ["/assets/analytics-dashboard.js"], noindex: true,
}));
const adminRoute = "/admin/content-insights/";
const adminSchema = { "@context": "https://schema.org", "@graph": [...schemaBase(), { "@type": "WebPage", "@id": `${absolute(adminRoute)}#webpage`, url: absolute(adminRoute), name: "Research library content insights", isPartOf: { "@id": `${SITE}/#website` } }] };
await mkdir(path.join(ROOT, "admin", "content-insights"), { recursive: true });
await writeFile(path.join(ROOT, "admin", "content-insights", "index.html"), pageShell({
  title: "Content insights | Project S.P.H.E.R.E.",
  description: "Public, privacy-preserving aggregate readership and search statistics for the research library.",
  url: adminRoute, content: dashboardContent, schema: adminSchema, scripts: ["/assets/analytics-dashboard.js"], noindex: true,
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
if (!researchIndex.includes('src="/assets/content-discovery.js"')) researchIndex = researchIndex.replace("</head>", '<script src="/assets/content-discovery.js" defer></script></head>');
if (!researchIndex.includes('type="application/rss+xml"')) researchIndex = researchIndex.replace("</head>", `<link rel="alternate" type="application/rss+xml" title="Project S.P.H.E.R.E. Research" href="${SITE}/rss.xml"></head>`);
await writeFile(researchFile, researchIndex.replace(/\r\n|\n/g, "\r\n"));

const categoryRoutes = new Map();
for (const record of researchRecords) {
  const slug = slugify(record.category);
  if (categoryRoutes.has(slug) && categoryRoutes.get(slug).category !== record.category) {
    throw new Error(`Research categories "${categoryRoutes.get(slug).category}" and "${record.category}" resolve to the same route.`);
  }
  if (!categoryRoutes.has(slug)) categoryRoutes.set(slug, { category: record.category, records: [] });
  categoryRoutes.get(slug).records.push(record);
}
for (const [slug, group] of categoryRoutes) {
  const route = `/research/category/${slug}/`;
  const file = path.join(ROOT, route.slice(1), "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, taxonomyPage({
    title: group.category,
    route,
    records: group.records,
    description: `Research tagged ${group.category} is at the proposal stage. It describes hypotheses and methods, not findings or measurements.`,
  }));
}
const tagRoutes = new Map();
for (const record of researchRecords) {
  for (const tag of record.tags) {
    const slug = slugify(tag);
    if (tagRoutes.has(slug) && tagRoutes.get(slug).tag !== tag) {
      throw new Error(`Research tags "${tagRoutes.get(slug).tag}" and "${tag}" resolve to the same route.`);
    }
    if (!tagRoutes.has(slug)) tagRoutes.set(slug, { tag, records: [] });
    tagRoutes.get(slug).records.push(record);
  }
}
for (const [slug, group] of tagRoutes) {
  const route = `/research/tag/${slug}/`;
  const file = path.join(ROOT, route.slice(1), "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, taxonomyPage({
    title: `Research tagged “${group.tag}”`,
    route,
    records: group.records,
    description: `Research articles and methods related to ${group.tag}. Project S.P.H.E.R.E. content remains proposal-stage and does not report measurement results.`,
  }));
}
const archiveRoute = "/research/archive/";
const archiveFile = path.join(ROOT, archiveRoute.slice(1), "index.html");
await mkdir(path.dirname(archiveFile), { recursive: true });
await writeFile(archiveFile, taxonomyPage({
  title: "Research archive",
  route: archiveRoute,
  records: researchRecords,
  description: "Chronological archive of research proposals, methods, and technical articles.",
}));
await mkdir(path.join(ROOT, "research", "authors"), { recursive: true });
await writeFile(path.join(ROOT, "research", "authors", "index.html"), authorDirectory(authorProfiles));
for (const profile of authorProfiles) {
  const file = path.join(ROOT, "research", "authors", profile.slug, "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, authorPage(profile));
}

await writeFile(path.join(ROOT, "assets", "publication-search.json"), safeJson(allSearchRecords.map((record) => ({
  title: record.title, description: record.description, url: record.url, kind: record.kind,
  category: record.category, tags: record.tags, authors: record.authors, keywords: record.keywords || [],
  published: record.published, text: record.plainText, featured: record.featured === true,
}))));
await writeFile(path.join(ROOT, "rss.xml"), rssFeed(researchRecords));
await updateLegacyPages(legacy, allSearchRecords);
await updateSitemap([
  "/", "/updates/", "/privacy/",
  "/research/",
  ...researchContent.map((record) => record.url),
  ...legacy.map((record) => record.url),
  archiveRoute,
  ...[...categoryRoutes.keys()].map((slug) => `/research/category/${slug}/`),
  ...[...tagRoutes.keys()].map((slug) => `/research/tag/${slug}/`),
  "/research/authors/",
  ...authorProfiles.map((profile) => `/research/authors/${profile.slug}/`),
  ...knowledgeContent.map((record) => record.url),
  ...glossaryRecords.map((record) => record.url),
  "/knowledge/", "/glossary/",
]);

console.log(`Built publication: ${researchRecords.length} research pages, ${knowledgeRecords.length} knowledge pages, ${glossaryRecords.length} glossary terms, ${categoryRoutes.size} categories, ${tagRoutes.size} tags, ${authorProfiles.length} authors.`);
