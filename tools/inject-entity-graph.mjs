// Merges the reciprocal entity graph (#organization, #person, #website) into the
// JSON-LD of every published page and ensures footer attribution to michaelpgoodman.com.
// Idempotent; runs after all generators (see package.json "build").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', '.github', '.impeccable', '.wrangler', 'node_modules', 'tools', 'data', 'content', 'worker', 'migrations', 'panton.html']);

const ORG = 'https://spheredesci.org/#organization';
const PERSON = 'https://michaelpgoodman.com/#person';
const SITE = 'https://spheredesci.org/#website';

const NODES = [
  {
    '@type': ['Organization', 'ResearchOrganization'],
    '@id': ORG,
    name: 'Project S.P.H.E.R.E.',
    alternateName: 'Project SPHERE DeSci Metrology Initiative',
    url: 'https://spheredesci.org/',
    description: 'Open-research Decentralized Science (DeSci) metrology initiative investigating acoustic and electromagnetic resonance, precision instrumentation, and the locational variable hypothesis.',
    location: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Rochester', addressRegion: 'NY', addressCountry: 'US' } },
    founder: { '@id': PERSON },
  },
  {
    '@type': 'Person',
    '@id': PERSON,
    name: 'Michael P. Goodman',
    alternateName: 'Michael Goodman',
    jobTitle: 'Principal Architect, IT Infrastructure, Sovereign AI & Managed Services Consultant',
    url: 'https://michaelpgoodman.com/',
    mainEntityOfPage: 'https://michaelpgoodman.com/about/',
    worksFor: {
      '@type': 'ProfessionalService',
      '@id': 'https://michaelpgoodman.com/#service',
      name: 'Michael P. Goodman — IT Infrastructure, Sovereign AI & Managed Services',
      url: 'https://michaelpgoodman.com/services/'
    },
    hasCredential: [
      'Microsoft Certified Systems Engineer + Internet (MCSE+I)',
      'ITIL Foundation Certification',
      'CompTIA Network+',
      'CompTIA A+',
      'Certified Commercial Investment Member (CCIM)'
    ].map((name) => ({ '@type': 'EducationalOccupationalCredential', credentialCategory: 'Certification', name })),
    sameAs: [
      'https://michaelpgoodman.com/',
      'https://michaelpgoodman.com/biography/',
      'https://github.com/cssofny2'
    ]
  },
  {
    '@type': 'WebSite',
    '@id': SITE,
    url: 'https://spheredesci.org/',
    name: 'Project S.P.H.E.R.E. | Decentralized Science & Precision Metrology',
    publisher: { '@id': ORG },
    creator: { '@id': PERSON },
    inLanguage: 'en-US'
  }
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) && dir === root) continue;
    const p = path.join(dir, e.name);
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
    if (i >= 0) graph[i] = { ...graph[i], ...node };
    else graph.push(node);
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

const ATTRIBUTION = `<div class="footer-entity-attribution"><p>Project S.P.H.E.R.E. infrastructure and sovereign local AI pipelines architected by <a href="https://michaelpgoodman.com/" rel="author me" title="Michael P. Goodman — IT Infrastructure, Sovereign AI &amp; Managed Services"><strong>Michael P. Goodman</strong></a> — <a href="https://michaelpgoodman.com/services/" title="IT Infrastructure, Sovereign AI &amp; Managed IT Services Consulting">IT Infrastructure, Sovereign AI &amp; Managed Services Architect</a> (<a href="https://michaelpgoodman.com/projects/sphere-desci-ai-infrastructure" title="Project S.P.H.E.R.E. Sovereign Local AI Case Study">AI Infrastructure Case Study</a> · <a href="https://michaelpgoodman.com/biography/" rel="me" title="Michael P. Goodman Biography">Biography</a> · <a href="https://github.com/cssofny2" rel="me" title="Michael P. Goodman GitHub (@cssofny2)">GitHub @cssofny2</a>). SPHEREVL is an educational simulation, not measurements or scientific validation.</p></div>`;
const ATTRIBUTION_WITH_LINK_CUES = ATTRIBUTION.replaceAll('<a ', '<a style="text-decoration:underline;text-underline-offset:2px" ');

const RECORDS = `<div class="footer-records" aria-label="Permanent Protocol LOC-1 records"><p class="footer-records-label">Permanent research records</p><ul><li><a class="record-badge" href="https://osf.io/5b6mj/overview" rel="noopener" title="Official, live Protocol LOC-1 preregistration on the Open Science Framework"><span class="record-badge-key">OSF · LIVE</span><span class="record-badge-val">Official Protocol LOC-1 preregistration</span></a></li><li><a class="record-badge" href="https://doi.org/10.5281/zenodo.23583932" rel="noopener" title="Archived technical whitepaper at Zenodo"><span class="record-badge-key">DOI</span><span class="record-badge-val">10.5281/zenodo.23583932 · Archived whitepaper</span></a></li></ul></div>`;

function injectFooter(html) {
  return html.replace(/<footer\b[\s\S]*?<\/footer>/, (footer) => {
    const f = footer
      .replace(/<div class="footer-records"[\s\S]*?<\/ul><\/div>/, '')
      .replace(/<p>Research records:[\s\S]*?<\/p>\s*/, '')
      .replace(/(<div class="footer-entity-attribution">|<\/footer>)/, `${RECORDS}$1`);
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
