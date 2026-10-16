// Server-side allowlist sanitizer for user/AI-supplied SVG fragments (the inner markup of a 120x120 mark).
// Anything not explicitly allowed is dropped. The browser sanitizes again before rendering.
const EL = Object.fromEntries(
  ["g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect", "defs", "clipPath", "linearGradient", "radialGradient", "stop"].map((n) => [n.toLowerCase(), n])
);
const LEAF = new Set(["path", "circle", "ellipse", "line", "polyline", "polygon", "rect", "stop"]);
const COLOR = /^(none|currentColor|var\(--(fg|bg|ac)\)|#[0-9a-fA-F]{3,8}|rgba?\([0-9., %]+\)|url\(#[A-Za-z0-9_-]+\))$/;
const NUM = /^-?[0-9.]+(e-?[0-9]+)?%?$/;
const LISTS = /^[0-9eE.,\s+%-]*$/;
const PATHD = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]*$/;
const XFORM = /^[a-z0-9 .,\-()eE]*$/;
const NUMATTR = new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "offset", "stop-opacity", "fx", "fy", "stroke-dashoffset"]);
const COLATTR = new Set(["fill", "stroke", "stop-color"]);
const ID = /^[A-Za-z0-9_-]{1,60}$/;

export function sanitizeSvg(input) {
  if (typeof input !== "string" || input.length > 60000) throw new Error("SVG is too large (limit 60 KB).");
  let src = input.replace(/<!--[\s\S]*?-->/g, "");
  if (/<[!?]/.test(src)) throw new Error("The SVG contains unsupported markup.");
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^<>"'])*?)(\/?)>/g;
  // Pass 1: collect local ids.
  const local = new Set();
  for (const m of src.matchAll(tagRe)) {
    const id = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(m[3]);
    if (id && ID.test(id[1] ?? id[2])) local.add(id[1] ?? id[2]);
  }
  const ref = (v) => {
    const r = /^url\(#([A-Za-z0-9_-]+)\)$/.exec(v);
    if (!r) return null;
    return local.has(r[1]) || r[1] === "cu" || r[1] === "orb" ? v : null;
  };
  let out = "", count = 0, drawable = false;
  const stack = [];
  let m;
  tagRe.lastIndex = 0;
  while ((m = tagRe.exec(src))) {
    const [, closing, rawName, rawAttrs, selfClose] = m;
    const name = EL[rawName.toLowerCase()];
    if (!name) continue; // disallowed element: dropped (its children are processed on their own merits)
    const leaf = LEAF.has(name);
    if (closing) {
      if (leaf) continue; // leaf elements are always emitted self-closed
      if (!stack.length || stack[stack.length - 1] !== name) throw new Error("The SVG has mismatched tags.");
      stack.pop();
      out += `</${name}>`;
      continue;
    }
    if (++count > 2500) throw new Error("SVG has too many elements.");
    let at = "";
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = attrRe.exec(rawAttrs))) {
      const k = a[1], v = (a[2] ?? a[3] ?? "").trim();
      if (/[<>&"']/.test(v)) continue;
      if (k === "class") {
        const cl = v.split(/\s+/).filter((x) => ["a", "af", "nf", "hb"].includes(x)).join(" ");
        if (cl) at += ` class="${cl}"`;
      } else if (k === "id") { if (local.has(v)) at += ` id="${v}"`; }
      else if (k === "d") { if (PATHD.test(v)) at += ` d="${v}"`; }
      else if (k === "points") { if (LISTS.test(v)) at += ` points="${v}"`; }
      else if (k === "transform" || k === "gradientTransform") { if (XFORM.test(v)) at += ` ${k}="${v}"`; }
      else if (COLATTR.has(k)) {
        if (COLOR.test(v)) {
          if (v.startsWith("url(")) { const r = ref(v); if (r) at += ` ${k}="${r}"`; } else at += ` ${k}="${v}"`;
        }
      } else if (k === "clip-path") { const r = ref(v); if (r) at += ` clip-path="${r}"`; }
      else if (NUMATTR.has(k)) { if (NUM.test(v)) at += ` ${k}="${v}"`; }
      else if (k === "stroke-linecap" && /^(butt|round|square)$/.test(v)) at += ` ${k}="${v}"`;
      else if (k === "stroke-linejoin" && /^(miter|round|bevel)$/.test(v)) at += ` ${k}="${v}"`;
      else if (k === "stroke-dasharray" && LISTS.test(v)) at += ` ${k}="${v}"`;
      else if ((k === "fill-rule" || k === "clip-rule") && /^(evenodd|nonzero)$/.test(v)) at += ` ${k}="${v}"`;
      else if ((k === "gradientUnits" || k === "clipPathUnits") && /^(userSpaceOnUse|objectBoundingBox)$/.test(v)) at += ` ${k}="${v}"`;
    }
    if (leaf) {
      out += `<${name}${at}/>`;
      if (name !== "stop") drawable = true;
      if (!selfClose) { // swallow an immediately following </name>
        const nxt = src.slice(tagRe.lastIndex).match(/^\s*<\/([a-zA-Z]+)\s*>/);
        if (nxt && nxt[1].toLowerCase() === name.toLowerCase()) tagRe.lastIndex += nxt[0].length;
      }
    } else if (selfClose) {
      out += `<${name}${at}/>`;
    } else {
      stack.push(name);
      out += `<${name}${at}>`;
    }
  }
  if (stack.length) throw new Error("The SVG has unclosed tags.");
  if (!drawable) throw new Error("No drawable shapes were found in the SVG.");
  return out;
}
