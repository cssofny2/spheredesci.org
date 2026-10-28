// Byte-range support for video files served from the static assets binding.
// Workers static assets answer every GET with the whole file (200). iOS Safari requires
// 206 Partial Content for <video>, so /assets/video/* is routed through the Worker
// (wrangler.jsonc: assets.run_worker_first) and sliced here.

export const MEDIA_PREFIX = "/assets/video/";
const MAX_BUFFERED_BYTES = 64 * 1024 * 1024; // larger files pass through untouched

// Parses a single "bytes=" range against a file of `size` bytes.
// Returns { start, end } (inclusive), "unsatisfiable", or null (ignore the header).
export function parseRange(header, size) {
  if (!header) return null;
  const m = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(header);
  if (!m) return null; // other units, multiple ranges or bad syntax: send the whole file
  const [, a, b] = m;
  if (a === "" && b === "") return null;
  if (a === "") {
    const n = Number(b);
    if (!Number.isSafeInteger(n)) return null;
    if (n === 0 || size === 0) return "unsatisfiable";
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(a);
  const end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
  if (b !== "" && Number(b) < start) return null; // inverted range: ignore, per RFC 9110
  if (start >= size) return "unsatisfiable";
  return { start, end };
}

// If-Range holding an ETag must match strongly; a date must equal Last-Modified.
function ifRangeMatches(ifRange, headers) {
  if (!ifRange) return true;
  const v = ifRange.trim();
  if (v.startsWith('"') || v.startsWith("W/")) {
    const etag = headers.get("etag");
    return Boolean(etag) && !v.startsWith("W/") && !etag.startsWith("W/") && v === etag;
  }
  const lm = headers.get("last-modified");
  return Boolean(lm) && Date.parse(v) === Date.parse(lm);
}

export async function serveMedia(req, env) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed.", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  // Ask the assets binding for the full representation; the slicing happens below.
  const assetHeaders = new Headers(req.headers);
  assetHeaders.delete("range");
  assetHeaders.delete("if-range");
  const asset = await env.ASSETS.fetch(new Request(req.url, { method: "GET", headers: assetHeaders }));

  const headers = new Headers(asset.headers);
  if (asset.status !== 200) {
    return new Response(req.method === "HEAD" ? null : asset.body, { status: asset.status, statusText: asset.statusText, headers });
  }
  headers.set("accept-ranges", "bytes");

  const encoded = headers.get("content-encoding");
  const declared = Number(headers.get("content-length"));
  const tooBig = Number.isFinite(declared) && declared > MAX_BUFFERED_BYTES;
  const rangeHeader = req.headers.get("range");
  if (!rangeHeader || (encoded && encoded !== "identity") || tooBig || !ifRangeMatches(req.headers.get("if-range"), headers)) {
    return new Response(req.method === "HEAD" ? null : asset.body, { status: 200, headers });
  }

  const body = await asset.arrayBuffer();
  const size = body.byteLength;
  const range = parseRange(rangeHeader, size);
  if (range === "unsatisfiable") {
    headers.set("content-range", `bytes */${size}`);
    headers.set("content-length", "0");
    return new Response(null, { status: 416, headers });
  }
  if (!range) {
    headers.set("content-length", String(size));
    return new Response(req.method === "HEAD" ? null : body, { status: 200, headers });
  }
  const length = range.end - range.start + 1;
  headers.set("content-range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("content-length", String(length));
  return new Response(req.method === "HEAD" ? null : body.slice(range.start, range.end + 1), { status: 206, headers });
}
