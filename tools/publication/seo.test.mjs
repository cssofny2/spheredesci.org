import assert from "node:assert/strict";
import test from "node:test";
import { breadcrumbs } from "../lib/breadcrumbs.mjs";
import { relatedLinksHtml, relatedResearch } from "../lib/related-links.mjs";
import { lintPage } from "../lint-html.mjs";
import { applyHreflang } from "../inject-site-metadata.mjs";

const page = (body, head = "") => `<!doctype html><html lang="en"><head><title>T</title><meta name="description" content="d"><link rel="canonical" href="https://spheredesci.org/x/"><link rel="alternate" hreflang="en" href="https://spheredesci.org/x/"><link rel="alternate" hreflang="x-default" href="https://spheredesci.org/x/">${head}</head><body>${body}</body></html>`;

test("breadcrumbs render a trail and matching BreadcrumbList", () => {
  const { html, schema } = breadcrumbs([["Home", "/"], ["Research", "/research/"], ["Page", "/research/page/"]]);
  assert.match(html, /aria-current="page">Page</);
  assert.equal(schema.itemListElement.length, 3);
  assert.equal(schema.itemListElement[2].position, 3);
  assert.equal(schema.itemListElement[1].item, "https://spheredesci.org/research/");
});

test("related links include whitepaper and associated properties", () => {
  const config = { whitepaper: { title: "WP", url: "/whitepaper/" }, properties: [{ title: "michaelpgoodman.com", url: "https://michaelpgoodman.com/", description: "d" }] };
  const records = [{ kind: "research", url: "/a/", title: "A", tags: ["x"], category: "c" }, { kind: "research", url: "/b/", title: "B", tags: ["x"], category: "c" }];
  const picked = relatedResearch(records[0], records);
  assert.deepEqual(picked.map((r) => r.url), ["/b/"]);
  const html = relatedLinksHtml({ research: picked, config });
  assert.match(html, /href="\/whitepaper\/"/);
  assert.match(html, /michaelpgoodman\.com/);
});

test("lint accepts a valid page", () => {
  assert.deepEqual(lintPage(page("<h1>Hi</h1><img src=a alt=''>"), "x/index.html"), []);
});

test("lint flags duplicate H1, missing alt, missing description and bad schema", () => {
  const bad = `<html lang="en"><head><title>T</title><link rel="canonical" href="x"><script type="application/ld+json">{bad</script></head><body><h1>a</h1><h1>b</h1><img src="a.png"></body></html>`;
  const text = lintPage(bad, "x/index.html").join("\n");
  assert.match(text, /exactly one <h1>/);
  assert.match(text, /without alt/);
  assert.match(text, /meta description/);
  assert.match(text, /invalid JSON-LD/);
});

const bare = (head = "") => `<!doctype html><html lang="en"><head><title>T</title><meta name="description" content="d"><link rel="canonical" href="https://spheredesci.org/x/">${head}</head><body><h1>Hi</h1></body></html>`;

test("hreflang injection adds self-referencing en and x-default links after the canonical", () => {
  const out = applyHreflang(bare());
  assert.match(out, /<link rel="canonical" href="https:\/\/spheredesci\.org\/x\/"><link rel="alternate" hreflang="en" href="https:\/\/spheredesci\.org\/x\/"><link rel="alternate" hreflang="x-default" href="https:\/\/spheredesci\.org\/x\/">/);
  assert.deepEqual(lintPage(out, "x/index.html"), []);
});

test("hreflang injection is idempotent and replaces stale annotations", () => {
  const once = applyHreflang(bare());
  assert.equal(applyHreflang(once), once);
  const stale = applyHreflang(bare('<link rel="alternate" hreflang="en-us" href="https://spheredesci.org/old/">'));
  assert.doesNotMatch(stale, /en-us|\/old\//);
  assert.equal((stale.match(/hreflang=/g) || []).length, 2);
});

test("hreflang injection skips noindex pages and off-site canonicals", () => {
  assert.doesNotMatch(applyHreflang(bare('<meta name="robots" content="noindex,follow">')), /hreflang/);
  const offsite = bare().replace("https://spheredesci.org/x/", "https://example.org/x/");
  assert.doesNotMatch(applyHreflang(offsite), /hreflang/);
});

test("lint flags missing or mismatched hreflang on indexable pages", () => {
  assert.match(lintPage(bare(), "x/index.html").join("\n"), /missing hreflang="en"/);
  const wrong = bare('<link rel="alternate" hreflang="en" href="https://spheredesci.org/y/"><link rel="alternate" hreflang="x-default" href="https://spheredesci.org/x/">');
  assert.match(lintPage(wrong, "x/index.html").join("\n"), /hreflang="en" href must match/);
  assert.deepEqual(lintPage(bare('<meta name="robots" content="noindex">'), "404.html"), []);
});
