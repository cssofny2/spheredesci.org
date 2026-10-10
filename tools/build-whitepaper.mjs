// Builds /whitepaper/index.html from content/whitepaper.mdx.
// Usage: npm i --no-save katex@0.16.11 marked@12 && node tools/build-whitepaper.mjs
import fs from 'node:fs';
import katex from 'katex';
import {marked} from 'marked';

const SRC = 'content/whitepaper.mdx', OUT = 'whitepaper/index.html', TPL = 'protocol/index.html';
const URL = 'https://spheredesci.org/whitepaper/';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const math = (t, display) => katex.renderToString(t, {displayMode: display, throwOnError: true, trust: false, output: 'htmlAndMathml'});
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&amp;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Source holds a placeholder front matter block, then the real one; keep the document body only.
let src = fs.readFileSync(SRC, 'utf8');
const body = src.slice(src.indexOf('# Project S.P.H.E.R.E.'));
const fm = {};
for (const m of src.matchAll(/^(title|description|version|date|status|subtitle): "(.*)"$/gm)) fm[m[1]] = m[2];

// Bare numeric citation tokens like [2][3] have no reference list in the source; drop them.
// Citations to the private founding packet are expiring presigned S3 URLs (pplxfilegitgateway...); they cannot work publicly.
const noPrivate = body.replace(/[ \t]*\[pplxfilegitgateway[^\]]*\]\(https:\/\/pplxfilegitgateway[^)]*\)/g, '');
const cleaned = noPrivate.replace(/[ \t]*(\[\d+\])+(?=[\s.,;:)<|]|$)/gm, "");

const renderer = new marked.Renderer();
renderer.code = (code, lang) => lang === 'math'
  ? `<div class="math-display">${math(code, true)}</div>`
  : `<pre class="vl-code"><code>${esc(code)}</code></pre>`;
renderer.codespan = code => {
  const t = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return /[\\^_=]/.test(t) && !/^[\w./-]+$/.test(t) ? math(t, false) : `<code class="inline-code">${code}</code>`;
};
const toc = [];
renderer.heading = (text, level) => {
  const id = slug(text);
  if (level === 2) toc.push([id, text]);
  return `<h${level} id="${id}">${text}</h${level}>`;
};
renderer.table = (h, b) => `<div class="table-wrap"><table><thead>${h}</thead><tbody>${b}</tbody></table></div>`;
marked.setOptions({renderer, gfm: true});

// Split the title block (h1 + metadata paragraphs) from the numbered sections.
const firstH2 = cleaned.indexOf('\n## ');
const intro = cleaned.slice(0, firstH2);
const main = marked.parse(cleaned.slice(firstH2));
const meta = marked.parse(intro.replace(/^# .*\n/, '')).replace(/<p>/, '<p class="page-lede">');

let tpl = fs.readFileSync(TPL, 'utf8');
const pre = tpl.slice(0, tpl.indexOf('<main'));
const post = tpl.slice(tpl.lastIndexOf('</main>') + '</main>'.length);
const title = 'DeSci Whitepaper: Open Resonance Metrology | S.P.H.E.R.E.';
const desc = fm.description || 'S.P.H.E.R.E. DeSci whitepaper.';
let head = pre
  .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
  .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(desc)}"`)
  .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${URL}"`)
  .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
  .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(desc)}"`)
  .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${URL}"`)
  .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${title}"`)
  .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(desc)}"`)
  .replace(/<script type="application\/ld\+json">.*?<\/script>/s, '')
  .replace(/ aria-current="page"/g, '')
  .replace('<a href="/protocol/">Protocol</a>', '<a href="/protocol/">Protocol</a>')
  .replace('<link href="/assets/site.css" rel="stylesheet">', '<link href="/assets/vendor/katex/katex.min.css" rel="stylesheet"><link href="/assets/site.css" rel="stylesheet">');

const aside = `<aside class="article-aside" aria-label="On this page"><h2>On this page</h2>${toc.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</aside>`;
const page = `${head}<main id="main-content" class="content-shell">
<div class="breadcrumbs"><a href="/">Home</a> / Whitepaper</div>
<div class="eyebrow">Research / Whitepaper</div><h1 class="page-title">Open resonance metrology, accountable funding.</h1>
<div class="whitepaper-meta">${meta}</div>
<div class="article-layout"><article class="article-body">${main}</article>${aside}</div>
</main>${post}`;
fs.writeFileSync(OUT, page);
console.log('wrote', OUT, page.length, 'bytes;', toc.length, 'sections');
