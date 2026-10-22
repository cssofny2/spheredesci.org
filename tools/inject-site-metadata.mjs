// Post-build step: adds the global RSS discovery link and Organization/WebSite
// sameAs entity links to every published HTML page. Idempotent.
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://spheredesci.org";
const FEED_LINK = '<link rel="alternate" type="application/rss+xml" title="Project S.P.H.E.R.E. RSS Feed" href="/rss.xml" />';
const SKIP = new Set(["node_modules", ".git", ".github", "tools", "data", "content", "worker", "migrations", "admin"]);

export async function loadSameAs() {
  const profiles = JSON.parse(await readFile(path.join(ROOT, "data", "entity-profiles.json"), "utf8"));
  const urls = [...profiles.github, ...profiles.orcid, ...profiles.registries, ...profiles.social];
  return [...new Set(urls.filter((u) => typeof u === "string" && /^https:\/\//i.test(u)))];
}

export function applyFeedLink(html) {
  const re = /<link\b[^>]*type=["']application\/rss\+xml["'][^>]*>/gi;
  if (!re.test(html)) return html.replace(/<\/head>/i, `${FEED_LINK}</head>`);
  re.lastIndex = 0;
  let seen = false;
  return html.replace(re, () => (seen ? "" : ((seen = true), FEED_LINK)));
}

function enrichNode(node, sameAs) {
  if (Array.isArray(node)) return node.forEach((n) => enrichNode(n, sameAs));
  if (!node || typeof node !== "object") return;
  const types = [].concat(node["@type"] || []);
  if (types.includes("Organization") || types.includes("WebSite")) {
    const id = String(node["@id"] || "");
    if (id === `${SITE}/#organization` || id === `${SITE}/#website`) {
      node.sameAs = [...new Set([...(node.sameAs || []), ...sameAs])];
    }
  }
  if (Array.isArray(node["@graph"])) {
    const graph = node["@graph"];
    const hasOrg = graph.some((n) => n && n["@id"] === `${SITE}/#organization`);
    const site = graph.find((n) => n && n["@id"] === `${SITE}/#website`);
    if (site && !hasOrg) {
      graph.push({ "@type": "Organization", "@id": `${SITE}/#organization`, name: "Project S.P.H.E.R.E.", url: `${SITE}/` });
      site.publisher = site.publisher || { "@id": `${SITE}/#organization` };
    }
    enrichNode(graph, sameAs);
  }
}

export function applySameAs(html, sameAs) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, open, body, close) => {
    let data;
    try { data = JSON.parse(body); } catch { return m; }
    enrichNode(data, sameAs);
    return `${open}${JSON.stringify(data)}${close}`;
  });
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!SKIP.has(entry.name)) yield* walk(path.join(dir, entry.name)); }
    else if (entry.name.endsWith(".html")) yield path.join(dir, entry.name);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sameAs = await loadSameAs();
  let changed = 0;
  for await (const file of walk(ROOT)) {
    const before = await readFile(file, "utf8");
    if (!/<\/head>/i.test(before)) continue;
    const after = applySameAs(applyFeedLink(before), sameAs);
    if (after !== before) { await writeFile(file, after); changed++; }
  }
  console.log(`Site metadata applied; ${changed} page(s) updated.`);
}
