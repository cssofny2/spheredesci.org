// Merges the reciprocal entity graph (#organization, #person, #website) into the
// JSON-LD of every published page and ensures footer attribution to michaelpgoodman.com.
// Idempotent; runs after all generators (see package.json "build").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', '.github', '.impeccable', '.wrangler', 'node_modules', 'tools', 'data', 'content', 'worker', 'migrations', 'docs', 'panton.html']);

const meta = JSON.parse(fs.readFileSync(path.join(root, 'data', 'program-metadata.json'), 'utf8'));
const profiles = JSON.parse(fs.readFileSync(path.join(root, 'data', 'entity-profiles.json'), 'utf8'));
const ORG_SAME_AS = [...new Set([
  ...(profiles.github || []),
  ...(profiles.orcid || []),
  ...(profiles.registries || []),
  ...(profiles.social || []),
].filter((u) => typeof u === 'string' && /^https:\/\//i.test(u)))];

const ORG = 'https://spheredesci.org/#organization';
const PERSON = 'https://michaelpgoodman.com/#person';
const SITE = 'https://spheredesci.org/#website';

const NODES = [
  {
    '@type': ['Organization', 'ResearchOrganization'],
    '@id': ORG,
    name: meta.programName,
    alternateName: meta.fullName,
    legalName: meta.legalEntity.name,
    url: 'https://spheredesci.org/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://spheredesci.org/assets/brand/sphere-icon-512.png',
      width: 512,
      height: 512,
    },
    email: meta.contactEmail,
    description: meta.positioning.program,
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: meta.legalEntity.location.locality,
        addressRegion: meta.legalEntity.location.region,
        addressCountry: meta.legalEntity.location.country,
      },
    },
    founder: { '@id': PERSON },
    sameAs: ORG_SAME_AS,
  },
  {
    '@type': 'Person',
    '@id': PERSON,
    name: meta.legalEntity.principal.name,
    jobTitle: `${meta.legalEntity.principal.role}, ${meta.legalEntity.name}`,
    url: meta.legalEntity.principal.personalSite,
    identifier: meta.legalEntity.principal.orcid,
    sameAs: [
      meta.legalEntity.principal.orcid,
      meta.legalEntity.principal.personalSite,
      meta.legalEntity.principal.github,
    ],
  },
  {
    '@type': 'WebSite',
    '@id': SITE,
    url: 'https://spheredesci.org/',
    name: meta.programName,
    alternateName: meta.fullName,
    publisher: { '@id': ORG },
    creator: { '@id': PERSON },
    inLanguage: 'en',
  }
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) && dir === root) continue;
    const p = path.join(dir, e.name);
    const rel = path.relative(root, p).split(path.sep).join('/');
    if (rel === 'projects/panton' || rel.startsWith('projects/panton/')) continue;
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const serializeLd = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

function mergeGraph(doc) {
  const ctx = doc['@context'] || 'https://schema.org';
  let graph = Array.isArray(doc['@graph']) ? doc['@graph'] : null;
  if (!graph) {
    const { ['@context']: _c, ...node } = doc;
    graph = [node];
  }
  for (const node of NODES) {
    const i = graph.findIndex((n) => n && n['@id'] === node['@id']);
    if (i >= 0) {
      const merged = { ...graph[i], ...node };
      if (node['@id'] === PERSON) {
        delete merged.worksFor;
        delete merged.hasCredential;
        delete merged.mainEntityOfPage;
        delete merged.alternateName;
      }
      if (node['@id'] === ORG) {
        merged.sameAs = ORG_SAME_AS;
      }
      if (node['@id'] === SITE) {
        delete merged.sameAs;
      }
      graph[i] = merged;
    } else {
      graph.push(node);
    }
  }
  return { '@context': ctx, '@graph': graph };
}

function injectLd(html) {
  let done = false;
  html = html.replace(LD, (m, body) => {
    if (done) return m;
    let doc;
    try { doc = JSON.parse(body); } catch { return m; }
    done = true;
    return `<script type="application/ld+json">${serializeLd(mergeGraph(doc))}</script>`;
  });
  if (!done) {
    const block = `<script type="application/ld+json">${serializeLd(mergeGraph({}))}</script>`;
    html = html.replace('</head>', `${block}</head>`);
  }
  return html;
}

const ATTRIBUTION = `<div class="footer-entity-attribution"><p>Operated by <strong>SPHERE Research, LLC</strong> (Rochester, NY; Founder &amp; Sole Managing Member: <a href="https://orcid.org/0009-0008-3796-5857" rel="noopener" title="Michael P. Goodman ORCID record"><strong>Michael P. Goodman</strong>, ORCID 0009-0008-3796-5857</a>). <a href="https://michaelpgoodman.com/" rel="noopener" title="Michael P. Goodman personal site (separate commercial and portfolio entity)">michaelpgoodman.com</a> and unrelated hosted pages are separate from Project S.P.H.E.R.E. (<a href="/about/#entity-separation">Entity separation &amp; COI</a>). SPHEREVL is a Level 0 educational simulation, not physical measurements or scientific validation. Corrections: <a href="mailto:contact@spheredesci.org">contact@spheredesci.org</a>.</p></div>`;
const ATTRIBUTION_WITH_LINK_CUES = ATTRIBUTION.replaceAll('<a ', '<a style="text-decoration:underline;text-underline-offset:2px" ');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatIsoDate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return escapeHtml(iso);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
};

const changelogPath = path.join(root, 'data', 'changelog.json');
let SITE_VERSION_BAR = '';
if (fs.existsSync(changelogPath)) {
  const cl = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
  const ver = escapeHtml(String(cl.current_version || '').replace(/^v/i, ''));
  const rel = escapeHtml(String(cl.released || ''));
  if (ver && rel) {
    SITE_VERSION_BAR = `<div class="footer-version" aria-label="Website version"><div class="footer-version-meta"><span class="footer-version-pill">SITE v${ver}</span><span>Updated <time datetime="${rel}">${formatIsoDate(rel)}</time> &middot; Website release version (independent of Protocol LOC-1)</span></div><a class="footer-version-link" href="/changelog/">View chronological changelog &rarr;</a></div>`;
  }
}

const RECORDS = `<div class="footer-records" aria-label="Permanent Protocol LOC-1 records"><p class="footer-records-label">Permanent research records</p><ul><li><a class="record-badge" href="https://osf.io/5b6mj/overview" rel="noopener" title="Official, live Protocol LOC-1 preregistration on the Open Science Framework"><span class="record-badge-key">OSF · LIVE</span><span class="record-badge-val">Official Protocol LOC-1 preregistration</span></a></li><li><a class="record-badge" href="https://doi.org/10.5281/zenodo.23583932" rel="noopener" title="Archived technical whitepaper v1.0 at Zenodo (superseded by v2.0 on spheredesci.org)"><span class="record-badge-key">DOI</span><span class="record-badge-val">10.5281/zenodo.23583932 · Archived whitepaper</span></a></li></ul></div>`;

function injectFooter(html) {
  return html.replace(/<footer\b[\s\S]*?<\/footer>/, (footer) => {
    const f = footer
      .replace(/<div class="footer-version"[\s\S]*?<\/a><\/div>/, '')
      .replace(/<div class="footer-records"[\s\S]*?<\/ul><\/div>/, '')
      .replace(/<p>Research records:[\s\S]*?<\/p>\s*/, '')
      .replace(/(<div class="footer-entity-attribution">|<\/footer>)/, `${SITE_VERSION_BAR}${RECORDS}$1`);
    if (f.includes('footer-entity-attribution')) {
      return f.replace(/<div class="footer-entity-attribution">[\s\S]*?<\/div>/, ATTRIBUTION_WITH_LINK_CUES);
    }
    return f.replace('</footer>', `${ATTRIBUTION_WITH_LINK_CUES}</footer>`);
  });
}

let changed = 0;
const RECORDS_CSS = '<link rel="stylesheet" href="/assets/footer-records.css">';
function injectRecordsCss(html) {
  return html.includes('footer-records.css') ? html : html.replace('</head>', `${RECORDS_CSS}</head>`);
}
for (const file of walk(root)) {
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes('</head>')) continue;
  const after = injectRecordsCss(injectFooter(injectLd(before)));
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
  }
}
console.log(`Entity graph injected; ${changed} file(s) updated.`);
