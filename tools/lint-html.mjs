// Build-time SEO and accessibility lint for published HTML pages.
// Usage: node tools/lint-html.mjs   (exits non-zero on any error)
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", ".wrangler", "tools", "data", "content", "worker", "migrations"]);
const SKIP_FILES = new Set(["panton.html"]);
const NOINDEX_OK = new Set(["404.html", "admin/content-insights/index.html", "analytics/index.html", "projects/panton/index.html"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name)); }
    else if (entry.name.endsWith(".html") && !SKIP_FILES.has(entry.name)) yield path.join(dir, entry.name);
  }
}

const stripNonContent = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
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
  if (/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html) && !NOINDEX_OK.has(rel)) errors.push(`${rel}: unexpected noindex directive`);
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
  for (const [, json] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
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
