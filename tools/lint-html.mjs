// Build-time SEO and accessibility lint for published HTML pages.
// Usage: node tools/lint-html.mjs   (exits non-zero on any error)
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", ".wrangler", "tools", "data", "content", "worker", "migrations", "docs"]);
const SKIP_FILES = new Set(["panton.html"]);
const NOINDEX_OK = new Set(["404.html", "admin/content-insights/index.html", "analytics/index.html", "projects/index.html", "projects/panton/index.html"]);
const NOINDEX_PREFIXES = ["research/archive/", "research/category/", "research/tag/", "research/authors/"];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name)); }
    else if (entry.name.endsWith(".html") && !SKIP_FILES.has(entry.name)) yield path.join(dir, entry.name);
  }
}

const tagNameAt = (html, index, name, closing = false) => {
  let cursor = index + 1;
  if (closing) {
    if (html[cursor] !== "/") return false;
    cursor += 1;
  } else if (html[cursor] === "/") return false;
  for (const character of name) {
    if (html[cursor]?.toLowerCase() !== character) return false;
    cursor += 1;
  }
  return [">", "/", " ", "\t", "\n", "\r", "\f"].includes(html[cursor]);
};

const tagEnd = (html, start) => {
  let quote = "";
  for (let cursor = start; cursor < html.length; cursor += 1) {
    const character = html[cursor];
    if (quote) {
      if (character === quote) quote = "";
    } else if (character === '"' || character === "'") quote = character;
    else if (character === ">") return cursor;
  }
  return -1;
};

const stripNonContent = (html) => {
  const content = [];
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf("<", cursor);
    if (start < 0) {
      content.push(html.slice(cursor));
      break;
    }
    content.push(html.slice(cursor, start));
    if (html.startsWith("<!--", start)) {
      const end = html.indexOf("-->", start + 4);
      content.push(" ");
      cursor = end < 0 ? html.length : end + 3;
      continue;
    }
    const name = ["script", "style"].find((candidate) => tagNameAt(html, start, candidate));
    if (name) {
      const openingEnd = tagEnd(html, start);
      if (openingEnd < 0) {
        content.push(" ");
        break;
      }
      let closingStart = html.indexOf("</", openingEnd + 1);
      while (closingStart >= 0 && !tagNameAt(html, closingStart, name, true)) {
        closingStart = html.indexOf("</", closingStart + 2);
      }
      const closingEnd = closingStart < 0 ? -1 : tagEnd(html, closingStart);
      content.push(" ");
      cursor = closingEnd < 0 ? html.length : closingEnd + 1;
      continue;
    }
    content.push("<");
    cursor = start + 1;
  }
  return content.join("");
};
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"))?.slice(1).find((v) => v !== undefined);

function lintSchema(node, where, errors) {
  if (Array.isArray(node)) return node.forEach((n) => lintSchema(n, where, errors));
  if (!node || typeof node !== "object") return;
  if (node["@type"] === "BreadcrumbList") {
    const items = node.itemListElement;
    if (!Array.isArray(items) || items.length < 2) errors.push(`${where}: BreadcrumbList needs at least two itemListElement entries`);
    else items.forEach((item, i) => {
      if (item.position !== i + 1) errors.push(`${where}: BreadcrumbList position ${item.position} should be ${i + 1}`);
      if (!item.name) errors.push(`${where}: BreadcrumbList item ${i + 1} has no name`);
      if (!/^https:\/\//.test(item.item || "")) errors.push(`${where}: BreadcrumbList item ${i + 1} needs an absolute https item URL`);
    });
  }
  for (const value of Object.values(node)) if (value && typeof value === "object") lintSchema(value, where, errors);
}

export function lintPage(html, rel) {
  const errors = [];
  const body = stripNonContent(html);
  const h1s = (body.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) errors.push(`${rel}: expected exactly one <h1>, found ${h1s}`);
  if (!/<html\b[^>]*\slang=/i.test(html)) errors.push(`${rel}: <html> is missing a lang attribute`);
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(html)) errors.push(`${rel}: missing or empty <title>`);
  const desc = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0];
  if (!desc || !(attr(desc, "content") || "").trim()) errors.push(`${rel}: missing or empty meta description`);
  if (!/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) errors.push(`${rel}: missing canonical link`);
  if (/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html) && !NOINDEX_OK.has(rel) && !NOINDEX_PREFIXES.some((prefix) => rel.startsWith(prefix))) errors.push(`${rel}: unexpected noindex directive`);
  const noindex = /<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html);
  const canonical = attr(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || "", "href");
  const hreflang = new Map();
  for (const tag of html.match(/<link\b[^>]*\bhreflang=[^>]*>/gi) || []) {
    const lang = (attr(tag, "hreflang") || "").toLowerCase();
    if (attr(tag, "rel") !== "alternate") errors.push(`${rel}: hreflang link must use rel="alternate"`);
    if (hreflang.has(lang)) errors.push(`${rel}: duplicate hreflang="${lang}"`);
    hreflang.set(lang, attr(tag, "href"));
  }
  if (!noindex && canonical) {
    for (const lang of ["en", "x-default"]) {
      if (!hreflang.has(lang)) errors.push(`${rel}: missing hreflang="${lang}" alternate`);
      else if (hreflang.get(lang) !== canonical) errors.push(`${rel}: hreflang="${lang}" href must match the canonical URL`);
    }
  }
  for (const tag of body.match(/<img\b[^>]*>/gi) || []) {
    if (attr(tag, "alt") === undefined) errors.push(`${rel}: <img> without alt attribute (${attr(tag, "src") || "no src"})`);
  }
  for (const [, json] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\b[^>]*>/gi)) {
    let data;
    try { data = JSON.parse(json); } catch (error) { errors.push(`${rel}: invalid JSON-LD (${error.message})`); continue; }
    if (!data["@context"]) errors.push(`${rel}: JSON-LD block has no @context`);
    lintSchema(data, rel, errors);
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = [];
  let pages = 0;
  for await (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    errors.push(...lintPage(await readFile(file, "utf8"), rel));
    pages++;
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    console.error(`\nHTML lint failed: ${errors.length} problem(s) across ${pages} page(s).`);
    process.exit(1);
  }
  console.log(`HTML lint passed for ${pages} page(s).`);
}
