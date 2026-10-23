// Builds /whitepaper/index.html from content/whitepaper.mdx.
// Usage: npm i --no-save katex@0.16.11 marked@12 && node tools/build-whitepaper.mjs
import fs from 'node:fs';
import katex from 'katex';
import {marked} from 'marked';

const SRC = 'content/whitepaper.mdx', OUT = 'whitepaper/index.html', TPL = 'protocol/index.html';
const URL = 'https://spheredesci.org/whitepaper/';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const citationMeta = [
  '<meta name="citation_title" content="Project S.P.H.E.R.E. &amp; Protocol LOC-1: Open-Source Acoustic Metrology for Testing the Locational Variable Hypothesis in a 230 kHz Hollow Copper Sphere">',
  '<meta name="citation_author" content="Goodman, Michael P.">',
  '<meta name="citation_author_institution" content="SPHERE Research, LLC">',
  '<meta name="citation_publication_date" content="2026/10/22">',
  '<meta name="citation_fulltext_html_url" content="https://spheredesci.org/whitepaper/">',
  '<meta name="citation_keywords" content="Decentralized Science (DeSci); Precision Metrology; Acoustic Resonance; Laser Doppler Vibrometry; Equivalence Testing; LOC-1">'
].join('\n');
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
const meta = marked.parse(intro.replace(/^# [^\r\n]*\r?\n/, '')).replace(/<p>/, '<p class="page-lede">');

let tpl = fs.readFileSync(TPL, 'utf8');
const pre = tpl.slice(0, tpl.indexOf('<main'));
const post = tpl.slice(tpl.lastIndexOf('</main>') + '</main>'.length);
const title = 'DeSci Whitepaper: Open Resonance Metrology | S.P.H.E.R.E.';
const desc = fm.description || 'S.P.H.E.R.E. DeSci whitepaper.';
const academicByline = '<div class="academic-byline" style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 1rem;"><p style="margin: 0; font-size: 1.1rem;"><strong>Michael P. Goodman</strong><br><em>SPHERE Research, LLC, Rochester, NY</em><br><a href="https://orcid.org/0009-0008-3796-5857" target="_blank" rel="noopener noreferrer">ORCID: 0009-0008-3796-5857</a> | <a href="https://spheredesci.org">spheredesci.org</a></p></div>';
const publicationActions = '<div class="whitepaper-actions no-print"><button id="download-pdf-btn" type="button" onclick="window.print()"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Download Publication PDF</button><span>Formatted for Zenodo &amp; Academic Archive Deposit</span></div>';
const printStyles = `<style>
@page { margin: 1in; }
.whitepaper-actions { display: flex; gap: 1rem; align-items: center; margin: 1.5rem 0 2.5rem; }
.whitepaper-actions button { display: inline-flex; align-items: center; gap: .5rem; border: 0; border-radius: 6px; padding: .6rem 1.2rem; background: #1e293b; color: #fff; font-weight: 600; cursor: pointer; transition: background .2s; }
.whitepaper-actions button:hover { background: #334155; }
.whitepaper-actions button:focus-visible { outline: 3px solid #22d3ee; outline-offset: 3px; }
.whitepaper-actions span { color: var(--muted); font-size: .9rem; }
.article-body .table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.article-body table { width: 100%; border-collapse: collapse; }
.article-body th, .article-body td { padding: .65rem .75rem; overflow-wrap: anywhere; vertical-align: top; }
@media print {
  body { background: #ffffff !important; color: #000000 !important; font-family: serif; font-size: 11pt; line-height: 1.6; }
  header, footer, nav, .site-nav, .no-print, button, .whitepaper-actions, .skip-link, .breadcrumbs, .eyebrow, .article-aside { display: none !important; }
  main, article, .whitepaper-container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
  a[href^="http"]:after { content: " (" attr(href) ")"; color: #444; font-size: 85%; overflow-wrap: anywhere; }
  h1, h2, h3 { break-after: avoid-page; page-break-after: avoid; color: #000000 !important; }
  .table-wrap { overflow: visible !important; border: 0; break-inside: auto; }
  table { width: 100% !important; table-layout: fixed; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th, td { overflow-wrap: anywhere; }
}
</style>`;
const ld = {'@context': 'https://schema.org', '@graph': [
  {'@type': 'WebSite', '@id': 'https://spheredesci.org/#website', url: 'https://spheredesci.org/', name: 'Project S.P.H.E.R.E.'},
  {'@type': 'WebPage', '@id': URL + '#webpage', url: URL, name: title, description: desc, isPartOf: {'@id': 'https://spheredesci.org/#website'}, inLanguage: 'en', dateModified: fm.date || '2026-10-10'},
  {'@type': 'ScholarlyArticle', '@id': URL + '#article', headline: 'Project S.P.H.E.R.E. & Protocol LOC-1: Open-Source Acoustic Metrology Whitepaper', description: desc, url: URL, mainEntityOfPage: {'@id': URL + '#webpage'}, inLanguage: 'en', version: fm.version, datePublished: '2026-10-22', dateModified: fm.date || '2026-10-10', identifier: '10.5281/zenodo.23583932', sameAs: ['https://doi.org/10.5281/zenodo.23583932'], citation: ['https://osf.io/5b6mj/overview'], author: {'@type': 'Person', '@id': 'https://michaelpgoodman.com/#person', name: 'Michael P. Goodman', url: 'https://michaelpgoodman.com/', sameAs: 'https://orcid.org/0009-0008-3796-5857', affiliation: {'@id': 'https://spheredesci.org/#organization'}}, publisher: {'@type': 'Organization', '@id': 'https://spheredesci.org/#organization', name: 'Project S.P.H.E.R.E.', url: 'https://spheredesci.org/'}, isAccessibleForFree: true, license: 'https://creativecommons.org/licenses/by/4.0/'},
  {'@type': 'BreadcrumbList', itemListElement: [{'@type': 'ListItem', position: 1, name: 'Home', item: 'https://spheredesci.org/'}, {'@type': 'ListItem', position: 2, name: 'Whitepaper', item: URL}]},
  {'@type': 'Person', '@id': 'https://michaelpgoodman.com/#person', name: 'Michael P. Goodman', url: 'https://michaelpgoodman.com/', sameAs: ['https://orcid.org/0009-0008-3796-5857', 'https://github.com/cssofny2', 'https://michaelpgoodman.com/', 'https://michaelpgoodman.com/biography/']} ]};
let head = pre
  .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
  .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(desc)}"`)
  .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${URL}"`)
  .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
  .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(desc)}"`)
  .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${URL}"`)
  .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${title}"`)
  .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(desc)}"`)
  .replace(/<script type="application\/ld\+json">.*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
  .replace(/ aria-current="page"/g, '')
  .replace('<a href="/protocol/">Protocol</a>', '<a href="/protocol/">Protocol</a>')
  .replace('<link href="/assets/site.css" rel="stylesheet">', '<link href="/assets/vendor/katex/katex.min.css" rel="stylesheet"><link href="/assets/site.css" rel="stylesheet">')
  .replace('</head>', `${citationMeta}\n${printStyles}\n</head>`);

const aside = `<aside class="article-aside" aria-label="On this page"><h2>On this page</h2>${toc.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</aside>`;
const page = `${head}<main id="main-content" class="content-shell">
<div class="breadcrumbs"><a href="/">Home</a> / Whitepaper</div>
<div class="eyebrow">Research / Whitepaper</div><h1 class="page-title">Open resonance metrology, accountable funding.</h1>${academicByline}${publicationActions}
<div class="whitepaper-meta">${meta}</div>
<div class="article-layout"><article class="article-body">${main}</article>${aside}</div>
</main>${post}`;
fs.writeFileSync(OUT, page);
console.log('wrote', OUT, page.length, 'bytes;', toc.length, 'sections');
