// Contextual cross-link block: whitepaper, sibling research nodes and associated properties.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function loadRelatedProperties() {
  return JSON.parse(await readFile(path.join(ROOT, "data", "related-properties.json"), "utf8"));
}

/** Picks up to `limit` research records ranked by shared tags/category, newest first on ties. */
export function relatedResearch(record, allRecords, limit = 3) {
  const tags = new Set((record.tags || []).map((t) => t.toLowerCase()));
  return allRecords
    .filter((item) => item.kind === "research" && item.url !== record.url)
    .map((item) => ({ item, score: (item.tags || []).filter((t) => tags.has(t.toLowerCase())).length + (item.category === record.category ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || (b.item.published || "").localeCompare(a.item.published || ""))
    .slice(0, limit)
    .map(({ item }) => item);
}

export function relatedLinksHtml({ research = [], config }) {
  const internal = [
    ...research.map((r) => `<li><a href="${esc(r.url)}">${esc(r.title)}</a></li>`),
    `<li><a href="${esc(config.whitepaper.url)}">${esc(config.whitepaper.title)}</a></li>`,
  ].join("");
  const external = config.properties.map((p) => `<li><a href="${esc(p.url)}" rel="noopener">${esc(p.title)}</a> <span>${esc(p.description)}</span></li>`).join("");
  return `<aside class="publication-related" aria-labelledby="explore-title"><h2 id="explore-title">Explore the project</h2><ul>${internal}</ul><h3>Associated properties</h3><ul>${external}</ul></aside>`;
}
