import assert from "node:assert/strict";
import test from "node:test";
import { readLimitedText, redactAnalyticsQuery } from "./index.js";

test("redactAnalyticsQuery removes quoted and international email addresses", () => {
  assert.equal(
    redactAnalyticsQuery('Contact "Jane Doe"@例え.テスト or user@example.com'),
    "contact [email] or [email]",
  );
});

test("readLimitedText rejects oversized request streams before buffering them", async () => {
  const request = new Request("https://spheredesci.org/api/analytics/event", {
    method: "POST",
    body: "x".repeat(2049),
  });
  await assert.rejects(readLimitedText(request, 2048), /Request is too large/);
});
