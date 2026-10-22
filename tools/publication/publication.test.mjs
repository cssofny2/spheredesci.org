import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import worker from "../../worker/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = "https://spheredesci.org";

class Database {
  statements = [];

  prepare(sql) {
    const statement = {
      sql,
      values: [],
      bind: (...values) => {
        statement.values = values;
        return statement;
      },
      first: async () => ({ total: 3 }),
      all: async () => ({ results: [] }),
    };
    this.statements.push(statement);
    return statement;
  }

  async batch(statements) {
    this.statements.push(...statements);
    return statements.map(() => ({ success: true }));
  }
}

function eventRequest(body, origin = SITE) {
  return new Request(`${SITE}/api/analytics/event`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("MDX build emits metadata, table of contents, citations, and FAQ schema", async () => {
  const article = await readFile(path.join(ROOT, "research", "uncertainty-budget-for-resonance", "index.html"), "utf8");
  assert.match(article, /rel="canonical" href="https:\/\/spheredesci\.org\/research\/uncertainty-budget-for-resonance\/"/);
  assert.match(article, /id="references-title"/);
  assert.match(article, /href="#ref-gum"/);
  assert.match(article, /aria-label="Table of contents"/);
  assert.match(article, /class="research-disclaimer"/);
  assert.match(article, /class="publication-share"/);
  assert.match(article, /class="author-panel"/);
  assert.match(article, /"@type":\["Article","BlogPosting"\]/);
  assert.match(article, /"@type":"FAQPage"/);
  assert.doesNotMatch(article, /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/i);
});

test("knowledge and glossary routes are indexed and discoverable", async () => {
  const index = JSON.parse(await readFile(path.join(ROOT, "assets", "publication-search.json"), "utf8"));
  const routes = new Set(index.map((item) => item.url));
  for (const route of ["/knowledge/metrology/", "/knowledge/quantum-field-theory/", "/glossary/metrology/", "/glossary/resonance/"]) {
    assert.ok(routes.has(route), `${route} should be in search index`);
  }
  const glossary = await readFile(path.join(ROOT, "glossary", "index.html"), "utf8");
  assert.match(glossary, /aria-label="Glossary letters"/);
  assert.match(glossary, /id="letter-M"/);
  const term = await readFile(path.join(ROOT, "glossary", "metrology", "index.html"), "utf8");
  assert.match(term, /Related terms/);
  assert.doesNotMatch(term, /href="\/glossary\/metrology\/"/);
  const legacyArticle = await readFile(path.join(ROOT, "research", "record-replay-resonance", "index.html"), "utf8");
  assert.match(legacyArticle, /Related concepts/);
  assert.match(legacyArticle, /href="\/knowledge\/resonance\/"/);
  assert.ok(index.find((item) => item.url === "/research/uncertainty-budget-for-resonance/").authors.includes("Project S.P.H.E.R.E."));
  for (const route of ["/research/archive/", "/research/category/measurement-methods/", "/research/tag/metrology/", "/research/authors/project-sphere/"]) {
    assert.ok((await readFile(path.join(ROOT, route.slice(1), "index.html"), "utf8")).includes("<h1"));
  }
});

test("analytics event collection aggregates without storing IP addresses", async () => {
  const db = new Database();
  const response = await worker.fetch(eventRequest({
    type: "page-view",
    path: "/research/uncertainty-budget-for-resonance/",
    referrer: "https://spheredesci.org/research/?campaign=private",
  }), { ANALYTICS_ENABLED: "true", DB: db });
  assert.equal(response.status, 202);
  assert.ok(db.statements.some((statement) => statement.sql.includes("analytics_page_views")));
  const referrer = db.statements.find((statement) => statement.sql.includes("analytics_referrers"));
  assert.deepEqual(referrer.values, [new Date().toISOString().slice(0, 10), "/research/"]);
  assert.ok(db.statements.every((statement) => !statement.sql.toLowerCase().includes("ip")));
});

test("analytics rejects cross-origin requests and is disabled by default", async () => {
  const db = new Database();
  const crossOrigin = await worker.fetch(eventRequest({ type: "page-view", path: "/research/" }, "https://attacker.example"), {
    ANALYTICS_ENABLED: "true", DB: db,
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal(db.statements.length, 0);
  const disabled = await worker.fetch(eventRequest({ type: "page-view", path: "/research/" }), { DB: db });
  assert.equal(disabled.status, 404);
});

test("analytics redacts email and URL values from stored search aggregates", async () => {
  const db = new Database();
  const response = await worker.fetch(eventRequest({
    type: "search",
    path: "/search/",
    query: "Calibration example@example.com https://example.test/private",
  }), { ANALYTICS_ENABLED: "true", DB: db });
  assert.equal(response.status, 202);
  const search = db.statements.find((statement) => statement.sql.includes("analytics_searches"));
  assert.deepEqual(search.values.slice(1), ["calibration [email] [url]"]);
});

test("analytics stores only daily duration and coarse scroll aggregates", async () => {
  const db = new Database();
  const response = await worker.fetch(eventRequest({
    type: "engagement",
    path: "/research/category/metrology/",
    seconds: 42,
    scrollDepth: 63,
  }), { ANALYTICS_ENABLED: "true", DB: db });
  assert.equal(response.status, 202);
  const engagement = db.statements.find((statement) => statement.sql.includes("analytics_engagement"));
  assert.deepEqual(engagement.values, [new Date().toISOString().slice(0, 10), "/research/category/metrology/", 42, 75]);
  assert.doesNotMatch(engagement.sql.toLowerCase(), /visitor|ip|identifier/);
});
