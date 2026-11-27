import assert from "node:assert/strict";
import test from "node:test";
import worker, { LAB_TARGET, isLabHostname, isSameOrigin, readLimitedText, redactAnalyticsQuery } from "./index.js";

test("isLabHostname recognizes lab subdomains case-insensitively", () => {
  assert.equal(isLabHostname("lab.spheredesci.org"), true);
  assert.equal(isLabHostname("www.lab.spheredesci.org"), true);
  assert.equal(isLabHostname("LAB.SPHEREDESCI.ORG"), true);
  assert.equal(isLabHostname("spheredesci.org"), false);
  assert.equal(isLabHostname("example.com"), false);
  assert.equal(isLabHostname(null), false);
});

test("worker.fetch redirects lab.spheredesci.org to the Control Room on Vercel", async () => {
  const req = new Request("https://lab.spheredesci.org/");
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), LAB_TARGET);
});

test("worker.fetch redirects lab.spheredesci.org deep paths to the Control Room on Vercel", async () => {
  const req = new Request("https://lab.spheredesci.org/dashboard");
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), LAB_TARGET);
});

test("worker.fetch passes non-lab requests through to env.ASSETS", async () => {
  let fetchedUrl = null;
  const mockEnv = {
    ASSETS: {
      fetch: async (request) => {
        fetchedUrl = request.url;
        return new Response("OK", { status: 200 });
      },
    },
  };
  const req = new Request("https://spheredesci.org/about/");
  const res = await worker.fetch(req, mockEnv);
  assert.equal(res.status, 200);
  assert.equal(fetchedUrl, "https://spheredesci.org/about/");
});

test("worker.fetch returns 404 for unknown api routes", async () => {
  const req = new Request("https://spheredesci.org/api/unknown-endpoint");
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 404);
});

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

test("isSameOrigin rejects malformed and null origins without throwing", () => {
  assert.equal(isSameOrigin(null, "https://spheredesci.org/api/analytics/event"), true);
  assert.equal(isSameOrigin("https://spheredesci.org", "https://spheredesci.org/api/analytics/event"), true);
  assert.equal(isSameOrigin("https://attacker.example", "https://spheredesci.org/api/analytics/event"), false);
  assert.equal(isSameOrigin("null", "https://spheredesci.org/api/analytics/event"), false);
  assert.equal(isSameOrigin("not a url", "https://spheredesci.org/api/analytics/event"), false);
});

test("analytics and vote endpoints return 403 instead of 500 on malformed Origin headers", async () => {
  for (const origin of ["null", "not-a-valid-origin"]) {
    const analyticsRes = await worker.fetch(new Request("https://spheredesci.org/api/analytics/event", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ type: "page-view", path: "/research/" }),
    }), { ANALYTICS_ENABLED: "true" });
    assert.equal(analyticsRes.status, 403);

    const voteRes = await worker.fetch(new Request("https://spheredesci.org/api/vote/logo-concepts/ballot", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ item: "lc-01", v: 1, r: 8 }),
    }), {});
    assert.equal(voteRes.status, 403);
  }
});

