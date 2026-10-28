import assert from "node:assert/strict";
import test from "node:test";
import { parseRange, serveMedia } from "./media.js";

const FILE = new Uint8Array(Array.from({ length: 1000 }, (_, i) => i % 256));
const ETAG = '"abc123"';

function env(status = 200, extraHeaders = {}) {
  const seen = [];
  return {
    seen,
    ASSETS: {
      async fetch(request) {
        seen.push(request);
        if (status !== 200) return new Response("missing", { status });
        return new Response(FILE, {
          status: 200,
          headers: { "content-type": "video/mp4", "content-length": String(FILE.length), etag: ETAG, ...extraHeaders },
        });
      },
    },
  };
}

const req = (headers = {}, method = "GET") =>
  new Request("https://spheredesci.org/assets/video/clip.mp4?v=3", { method, headers });

test("parseRange handles open, closed, suffix and clamped ranges", () => {
  assert.deepEqual(parseRange("bytes=0-1", 1000), { start: 0, end: 1 });
  assert.deepEqual(parseRange("bytes=500-", 1000), { start: 500, end: 999 });
  assert.deepEqual(parseRange("bytes=-100", 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange("bytes=-5000", 1000), { start: 0, end: 999 });
  assert.deepEqual(parseRange("bytes=990-5000", 1000), { start: 990, end: 999 });
  assert.equal(parseRange("bytes=1000-", 1000), "unsatisfiable");
  assert.equal(parseRange("bytes=-0", 1000), "unsatisfiable");
  assert.equal(parseRange("bytes=5-2", 1000), null);
  assert.equal(parseRange("bytes=0-1,5-6", 1000), null);
  assert.equal(parseRange("items=0-1", 1000), null);
  assert.equal(parseRange(null, 1000), null);
});

test("Safari probe Range: bytes=0-1 gets 206 with two bytes", async () => {
  const e = env();
  const res = await serveMedia(req({ range: "bytes=0-1" }), e);
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("content-range"), "bytes 0-1/1000");
  assert.equal(res.headers.get("content-length"), "2");
  assert.equal(res.headers.get("accept-ranges"), "bytes");
  assert.equal(res.headers.get("content-type"), "video/mp4");
  assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [0, 1]);
  assert.equal(e.seen[0].headers.get("range"), null, "range is stripped before the assets binding");
});

test("mid-file range returns the right bytes", async () => {
  const res = await serveMedia(req({ range: "bytes=300-303" }), env());
  assert.equal(res.status, 206);
  assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [44, 45, 46, 47]);
});

test("no Range returns 200, full body and Accept-Ranges", async () => {
  const res = await serveMedia(req(), env());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("accept-ranges"), "bytes");
  assert.equal((await res.arrayBuffer()).byteLength, 1000);
});

test("unsatisfiable range returns 416 with the file size", async () => {
  const res = await serveMedia(req({ range: "bytes=2000-" }), env());
  assert.equal(res.status, 416);
  assert.equal(res.headers.get("content-range"), "bytes */1000");
});

test("If-Range mismatch falls back to the full file", async () => {
  const res = await serveMedia(req({ range: "bytes=0-1", "if-range": '"old"' }), env());
  assert.equal(res.status, 200);
  assert.equal((await res.arrayBuffer()).byteLength, 1000);
  const ok = await serveMedia(req({ range: "bytes=0-1", "if-range": ETAG }), env());
  assert.equal(ok.status, 206);
});

test("HEAD with Range returns 206 headers and no body", async () => {
  const res = await serveMedia(req({ range: "bytes=0-99" }, "HEAD"), env());
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("content-length"), "100");
  assert.equal(res.body, null);
});

test("missing files and other methods pass through", async () => {
  assert.equal((await serveMedia(req({ range: "bytes=0-1" }), env(404))).status, 404);
  assert.equal((await serveMedia(req({}, "POST"), env())).status, 405);
});

test("encoded responses are not sliced", async () => {
  const res = await serveMedia(req({ range: "bytes=0-1" }), env(200, { "content-encoding": "gzip" }));
  assert.equal(res.status, 200);
});
