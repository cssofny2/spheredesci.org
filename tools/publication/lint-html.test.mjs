import assert from "node:assert/strict";
import test from "node:test";
import { lintPage } from "../lint-html.mjs";

test("HTML lint ignores headings inside comments and raw-text elements", () => {
  const url = "https://spheredesci.org/test/";
  const html = `<!doctype html><html lang="en"><head><title>Test</title>
<meta name="description" content="Test page">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
</head><body><h1>Visible</h1><!--<h1>Comment</h1>-->
<script><h1>Script</h1></script ><style><h1>Style</h1></style ></body></html>`;

  assert.ok(lintPage(html, "test/index.html").every((error) => !error.includes("expected exactly one <h1>")));
});

test("HTML lint does not hide markup exposed by malformed comments", () => {
  const url = "https://spheredesci.org/test/";
  const html = `<!doctype html><html lang="en"><head><title>Test</title>
<meta name="description" content="Test page">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
</head><body><h1>Visible</h1><<!--comment-->!--<h1>Also visible</h1>--></body></html>`;

  assert.ok(lintPage(html, "test/index.html").some((error) => error.includes("expected exactly one <h1>, found 2")));
});
