import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://spheredesci.org";
const fail = (message) => {
  throw new Error(message);
};
const htmlText = (value) => value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

const index = JSON.parse(await readFile(path.join(ROOT, "assets", "publication-search.json"), "utf8"));
if (!Array.isArray(index) || !index.length) fail("Publication search index is missing or empty.");
const sitemap = await readFile(path.join(ROOT, "sitemap.xml"), "utf8");
const rss = await readFile(path.join(ROOT, "rss.xml"), "utf8");
const robots = await readFile(path.join(ROOT, "robots.txt"), "utf8");
if (!sitemap.includes("<urlset") || !sitemap.includes("</urlset>")) fail("Sitemap does not have a complete urlset.");
if (!rss.includes("<rss version=\"2.0\">") || !rss.includes("</rss>")) fail("RSS feed is incomplete.");
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail("robots.txt does not reference the sitemap.");
const sitemapUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => htmlText(match[1]));
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("Sitemap contains duplicate locations.");
const sitemapSet = new Set(sitemapUrls);

const entries = new Map();
const titles = new Set();
for (const record of index) {
  if (entries.has(record.url)) fail(`Duplicate search-index URL: ${record.url}`);
  entries.set(record.url, record);
}

for (const record of index) {
  const file = path.join(ROOT, record.url.slice(1), "index.html");
  let html;
  try {
    html = await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") fail(`Search index points to missing page: ${record.url}`);
    throw error;
  }
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (!title || !description || canonical !== `${SITE}${record.url}`) fail(`${record.url}: missing or invalid title, description, or canonical URL.`);
  const normalizedTitle = htmlText(title).toLowerCase();
  if (titles.has(normalizedTitle)) fail(`${record.url}: duplicate page title.`);
  titles.add(normalizedTitle);
  if (html.match(/<h1\b/gi)?.length !== 1) fail(`${record.url}: expected exactly one H1.`);
  if (!html.includes('property="og:title"') || !html.includes('property="og:image"') || !html.includes('name="twitter:card"')) fail(`${record.url}: missing social metadata.`);
  if (!html.includes('type="application/rss+xml"')) fail(`${record.url}: missing RSS feed discovery link.`);
  if (record.kind !== "glossary" && !sitemapSet.has(`${SITE}${record.url}`)) fail(`${record.url}: missing sitemap entry.`);
  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html)) fail(`${record.url}: image is missing an alt attribute.`);
  if (record.kind === "research" && (!html.includes('class="research-disclaimer"') || !/class="[^"]*\bpublication-toc\b/.test(html) || !html.includes('class="author-panel"'))) {
    fail(`${record.url}: research article is missing its disclaimer, table of contents, or author panel.`);
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let schema;
    try { schema = JSON.parse(match[1]); } catch { fail(`${record.url}: invalid JSON-LD.`); }
    const types = schema["@graph"]?.flatMap((item) => Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]]) || [];
    for (const requiredType of ["Organization", "WebSite", "BreadcrumbList"]) {
      if (!types.includes(requiredType)) fail(`${record.url}: JSON-LD is missing ${requiredType}.`);
    }
    if (record.kind === "research" || record.kind === "knowledge") {
      if (!types.includes("Article")) fail(`${record.url}: JSON-LD is missing Article.`);
      const article = schema["@graph"].find((item) => item["@type"] === "Article" || item["@type"]?.includes?.("Article"));
      if (!article.datePublished || !article.dateModified || !article.author?.length) fail(`${record.url}: Article schema is missing publication dates or author.`);
      if (record.kind === "research" && !types.includes("BlogPosting")) fail(`${record.url}: JSON-LD is missing BlogPosting.`);
    }
    if (record.kind === "glossary" && !types.includes("DefinedTerm")) fail(`${record.url}: JSON-LD is missing DefinedTerm.`);
  }
  if (!html.includes('type="application/ld+json"')) fail(`${record.url}: no structured data found.`);
  if (/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/i.test(html)) fail(`${record.url}: nested anchors detected.`);

  const termLinks = [...html.matchAll(/data-glossary-term="([^"]+)"/g)].map((match) => match[1].toLowerCase());
  if (new Set(termLinks).size !== termLinks.length) fail(`${record.url}: an automatic glossary term was linked more than once.`);
  const articleLinks = [...html.matchAll(/data-article-reference="([^"]+)"/g)].map((match) => match[1].toLowerCase());
  if (new Set(articleLinks).size !== articleLinks.length) fail(`${record.url}: an automatic article reference was linked more than once.`);

  for (const link of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
    const value = link[1].replaceAll("&amp;", "&");
    let pathname;
    try {
      const url = new URL(value, `${SITE}${record.url}`);
      if (url.origin !== SITE) continue;
      pathname = decodeURIComponent(url.pathname);
    } catch {
      fail(`${record.url}: invalid local URL "${value}".`);
    }
    if (pathname.startsWith("/api/")) continue;
    const target = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    let targetHtml;
    try {
      const targetPath = path.join(ROOT, target.slice(1));
      await access(targetPath);
      if (value.includes("#")) targetHtml = await readFile(targetPath, "utf8");
    } catch {
      fail(`${record.url}: local link or asset does not exist: ${pathname}`);
    }
    if (value.includes("#")) {
      const fragment = decodeURIComponent(value.slice(value.indexOf("#") + 1));
      if (fragment && targetHtml && !new RegExp(`\\bid="${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(targetHtml)) {
        fail(`${record.url}: missing fragment target #${fragment}.`);
      }
    }
  }
}

for (const route of [
  "/research/archive/",
  "/research/category/measurement-methods/",
  "/research/tag/metrology/",
  "/research/authors/",
  "/research/authors/project-sphere/",
]) {
  if (!sitemapSet.has(`${SITE}${route}`)) fail(`${route}: generated discovery page is missing from the sitemap.`);
  const html = await readFile(path.join(ROOT, route.slice(1), "index.html"), "utf8");
  if (html.match(/<h1\b/gi)?.length !== 1) fail(`${route}: expected exactly one H1.`);
  if (!html.includes(`<link rel="canonical" href="${SITE}${route}">`)) fail(`${route}: missing canonical metadata.`);
  if (!html.includes('type="application/ld+json"')) fail(`${route}: missing structured data.`);
}
const analyticsAlias = await readFile(path.join(ROOT, "admin", "content-insights", "index.html"), "utf8");
if (!analyticsAlias.includes('<meta name="robots" content="noindex,follow">')) fail("/admin/content-insights/: expected noindex.");

for (const record of index.filter((item) => item.kind === "research")) {
  if (!rss.includes(`<guid isPermaLink="true">${SITE}${record.url}</guid>`)) fail(`${record.url}: missing RSS feed item.`);
}

console.log(`Publication checks passed: ${index.length} indexed pages, ${sitemapUrls.length} sitemap URLs, and ${index.filter((item) => item.kind === "research").length} RSS entries.`);
