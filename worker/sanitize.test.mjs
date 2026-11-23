import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeSvg } from "./sanitize.js";

test("sanitizeSvg removes reconstituted comments before parsing markup", () => {
  const nestedComment = '<<!--comment-->!--<path d="M0 0"/>-->';
  assert.throws(() => sanitizeSvg(nestedComment), /No drawable shapes were found/);
});

test("sanitizeSvg still removes ordinary comments", () => {
  assert.equal(sanitizeSvg('<!-- note --><path d="M0 0"/>'), '<path d="M0 0"/>');
});
