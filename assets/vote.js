/* Voting UI for /vote/<project>/ pages. Progressive enhancement: the gallery is plain HTML; this adds ballots, results and the remix lab. */
(function () {
  'use strict';
  var app = document.getElementById('vote-app');
  if (!app) return;
  var P = app.dataset.project, REMIX = app.dataset.remix === '1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MIN_N = 3;
  var TAG = 'Spatial Positioning Harmonic<br>Empirical Resonance Experiment';
  var S = { stats: {}, comments: [], remixes: [], mine: {}, remixLeft: 0, remixEnabled: false, ready: false, error: '',
    tab: 'ballot', filter: 'all', sort: 'rating', rf: 'all', open: {}, drafts: {}, errs: {},
    rx: { src: '', base: null, cur: null, prompt: '', name: '', th: 'L', lay: 'stack', busy: false, msg: '', refine: true } };

  var figs = Array.prototype.slice.call(document.querySelectorAll('.vote-item'));
  var seeds = figs.map(function (f) {
    return { id: f.dataset.item, name: f.dataset.name, img: f.dataset.img, remix: f.dataset.remix === '1', kind: 'seed', fig: f,
      set: f.closest('.vote-set').querySelector('h2').firstChild.textContent.trim() };
  });
  var seedBy = {}; seeds.forEach(function (s) { seedBy[s.id] = s; });
  var bar = $('#vote-bar'), panel = $('#vote-panel'), gallery = $('#vote-gallery');

  /* ---------- API ---------- */
  function api(path, opts) {
    return fetch('/api/vote/' + P + path, Object.assign({ credentials: 'same-origin' }, opts || {})).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) {
        if (!r.ok) { var e = new Error((d && d.error) || 'Request failed (' + r.status + ').'); e.status = r.status; throw e; }
        return d;
      });
    });
  }
  function post(path, body) { return api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }

  /* ---------- SVG sanitizer (stored and AI-supplied markup is untrusted) ---------- */
  var OKEL = { g: 1, path: 1, circle: 1, ellipse: 1, line: 1, polyline: 1, polygon: 1, rect: 1, defs: 1, clipPath: 1, linearGradient: 1, radialGradient: 1, stop: 1 };
  var COLOR = /^(none|currentColor|var\(--(fg|bg|ac)\)|#[0-9a-fA-F]{3,8}|rgba?\([0-9., %]+\)|url\(#[A-Za-z0-9_-]+\))$/;
  var NUM = /^-?[0-9.]+(e-?[0-9]+)?%?$/, LISTS = /^[0-9eE.,\s+%-]*$/, PATHD = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]*$/, XFORM = /^[a-z0-9 .,\-()eE]*$/;
  var NUMATTR = 'cx cy r rx ry x y x1 y1 x2 y2 width height stroke-width opacity fill-opacity stroke-opacity offset stop-opacity fx fy stroke-dashoffset'.split(' ');
  function sanitize(inner, prefix) {
    if (typeof inner !== 'string' || inner.length > 60000) throw new Error('SVG is too large.');
    var doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>', 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('The SVG could not be parsed.');
    var local = {}; doc.querySelectorAll('[id]').forEach(function (e) { var v = e.getAttribute('id'); if (/^[A-Za-z0-9_-]{1,60}$/.test(v)) local[v] = 1; });
    var count = 0;
    function ref(v) { var m = /^url\(#([A-Za-z0-9_-]+)\)$/.exec(v); if (!m) return null; if (local[m[1]]) return 'url(#' + prefix + m[1] + ')'; if (m[1] === 'cu' || m[1] === 'orb') return v; return null; }
    function walk(n) {
      var out = '';
      Array.prototype.forEach.call(n.childNodes, function (c) {
        if (c.nodeType !== 1 || !OKEL[c.localName]) return;
        if (++count > 2500) throw new Error('SVG has too many elements.');
        var at = '';
        Array.prototype.forEach.call(c.attributes, function (a) {
          var k = a.name, v = a.value.trim();
          if (k.indexOf('xmlns') === 0 || k.indexOf(':') > -1) return;
          if (k === 'class') { var cl = v.split(/\s+/).filter(function (x) { return ['a', 'af', 'nf', 'hb'].indexOf(x) > -1; }).join(' '); if (cl) at += ' class="' + cl + '"'; }
          else if (k === 'id') { if (local[v]) at += ' id="' + prefix + v + '"'; }
          else if (k === 'd') { if (PATHD.test(v)) at += ' d="' + v + '"'; }
          else if (k === 'points') { if (LISTS.test(v)) at += ' points="' + v + '"'; }
          else if (k === 'transform' || k === 'gradientTransform') { if (XFORM.test(v)) at += ' ' + k + '="' + v + '"'; }
          else if (k === 'fill' || k === 'stroke' || k === 'stop-color') { if (COLOR.test(v)) { if (v.indexOf('url(') === 0) { var r = ref(v); if (r) at += ' ' + k + '="' + r + '"'; } else at += ' ' + k + '="' + v + '"'; } }
          else if (k === 'clip-path') { var r2 = ref(v); if (r2) at += ' clip-path="' + r2 + '"'; }
          else if (NUMATTR.indexOf(k) > -1) { if (NUM.test(v)) at += ' ' + k + '="' + v + '"'; }
          else if (k === 'stroke-linecap' && /^(butt|round|square)$/.test(v)) at += ' ' + k + '="' + v + '"';
          else if (k === 'stroke-linejoin' && /^(miter|round|bevel)$/.test(v)) at += ' ' + k + '="' + v + '"';
          else if (k === 'stroke-dasharray' && LISTS.test(v)) at += ' ' + k + '="' + v + '"';
          else if ((k === 'fill-rule' || k === 'clip-rule') && /^(evenodd|nonzero)$/.test(v)) at += ' ' + k + '="' + v + '"';
          else if ((k === 'gradientUnits' || k === 'clipPathUnits') && /^(userSpaceOnUse|objectBoundingBox)$/.test(v)) at += ' ' + k + '="' + v + '"';
        });
        out += '<' + c.localName + at + '>' + walk(c) + '</' + c.localName + '>';
      });
      return out;
    }
    var res = walk(doc.documentElement);
    if (!res) throw new Error('No drawable shapes were found in the SVG.');
    return res;
  }
  var rid = 0;
  function safe(s) { try { return sanitize(s, 'x' + (++rid) + '_'); } catch (e) { return ''; } }

  /* ---------- items ---------- */
  var TH = { light: 'L', dark: 'D', copper: 'C', navy: 'N' };
  function remixItems() {
    return S.remixes.map(function (r) { return { id: r.id, name: r.name, kind: 'remix', own: r.own, svg: r.svg, th: TH[r.theme] || 'L', lay: r.layout, set: 'Remix', parent: r.parent, prompt: r.prompt, t: r.t }; });
  }
  function allItems() { return seeds.concat(remixItems()); }
  function lockup(it) {
    var ic = '<svg viewBox="0 0 120 120" aria-hidden="true">' + safe(it.svg) + '</svg>';
    var wm = '<div class="wm">S.P.H.E.R.E.</div>';
    var inner = it.lay === 'stack' ? ic + wm + '<div class="tg">' + TAG + '</div>' : it.lay === 'hz' ? ic + '<div>' + wm + '<div class="tg">' + TAG + '</div></div>' : ic;
    return '<div class="vt vt-' + it.th + ' ' + it.lay + '" role="img" aria-label="' + esc(it.name) + ' remix">' + inner + '</div>';
  }
  function thumb(it) { return it.kind === 'seed' ? '<img src="' + esc(it.img) + '" alt="" loading="lazy" width="132" height="88">' : lockup(it); }

  /* ---------- ballot ---------- */
  function canVote() { return S.ready && !S.error; }
  function ctlHTML(it) {
    var m = S.mine[it.id], d = S.drafts[it.id] || {};
    if (it.kind === 'remix' && it.own) return '<p class="vown">Your submission. You cannot vote on your own remix.</p>';
    if (m) return '<div class="vlocked"><span>Ballot locked</span><span><b>' + (m.v === 1 ? 'KEEP' : 'DROP') + '</b> &middot; rating <b>' + m.r + '/10</b></span>' + (m.c ? '<span>&ldquo;' + esc(m.c) + '&rdquo;</span>' : '') + '</div>'
      + (it.remix && REMIX && S.remixEnabled ? '<div class="vrow"><button class="vbtn" data-act="remix">Remix this</button></div>' : '');
    var on = canVote() ? '' : ' disabled';
    var sc = ''; for (var n = 1; n <= 10; n++) sc += '<button type="button" data-act="r" data-r="' + n + '" aria-pressed="' + (d.r === n) + '" aria-label="Rate ' + n + ' out of 10"' + on + '>' + n + '</button>';
    return '<div class="vote-ctl"><div class="vrow" role="group" aria-label="Keep or drop">'
      + '<button type="button" class="vbtn vote yes" data-act="v" data-v="1" aria-pressed="' + (d.v === 1) + '"' + on + '>Keep</button>'
      + '<button type="button" class="vbtn vote no" data-act="v" data-v="-1" aria-pressed="' + (d.v === -1) + '"' + on + '>Drop</button></div>'
      + '<div><div class="vlab">Rating 1&ndash;10</div><div class="vscale" role="group" aria-label="Rating">' + sc + '</div></div>'
      + '<label class="vlab" for="c-' + esc(it.id) + '">Comment (optional)</label>'
      + '<textarea id="c-' + esc(it.id) + '" data-act="c" maxlength="400" placeholder="Suggestion, critique or comment"' + on + '>' + esc(d.c || '') + '</textarea>'
      + '<div class="vrow"><button type="button" class="vbtn pri" data-act="submit"' + on + '>Lock in ballot</button>'
      + (it.remix && REMIX && S.remixEnabled && canVote() ? '<button type="button" class="vbtn" data-act="remix">Remix this</button>' : '') + '</div>'
      + '<div class="verr" role="alert">' + esc(S.errs[it.id] || '') + '</div></div>';
  }
  function renderFig(it) {
    var fig = it.fig; if (!fig) return;
    var c = fig.querySelector('.vote-ctl-wrap');
    if (!c) { c = document.createElement('div'); c.className = 'vote-ctl-wrap'; fig.appendChild(c); }
    c.innerHTML = ctlHTML(it);
    fig.classList.toggle('done', !!S.mine[it.id]);
  }
  function ensureRemixSection() {
    var sec = $('#community-remixes');
    if (!sec) {
      sec = document.createElement('section'); sec.className = 'vote-set'; sec.id = 'community-remixes'; sec.setAttribute('aria-labelledby', 'community-remixes-h');
      sec.innerHTML = '<h2 id="community-remixes-h">Community remixes <span class="vote-count"></span></h2><p class="vote-set-note">Marks that voters edited with a text prompt and added to the pool.</p><div class="vote-grid"></div>';
      gallery.appendChild(sec);
    }
    return sec;
  }
  function renderRemixFigs() {
    var items = remixItems(), sec = $('#community-remixes');
    if (!items.length) { if (sec) sec.remove(); return; }
    sec = ensureRemixSection();
    sec.querySelector('.vote-count').textContent = items.length + (items.length === 1 ? ' remix' : ' remixes');
    var grid = sec.querySelector('.vote-grid'); grid.innerHTML = '';
    items.forEach(function (it) {
      var f = document.createElement('figure'); f.className = 'vote-item'; f.id = it.id; f.dataset.item = it.id;
      f.innerHTML = lockup(it) + '<figcaption><h3>' + esc(it.name) + '</h3><p>Remix of ' + esc((seedBy[it.parent] || {}).name || 'a logo') + '. Prompt: &ldquo;' + esc(it.prompt) + '&rdquo;</p></figcaption>';
      grid.appendChild(f); it.fig = f; renderFig(it);
    });
  }
  function applyFilter() {
    figs.forEach(function (f) { var id = f.dataset.item; f.hidden = S.filter === 'todo' ? !!S.mine[id] : S.filter === 'remix' ? true : false; });
    document.querySelectorAll('.vote-set').forEach(function (s) {
      var vis = s.querySelectorAll('.vote-item:not([hidden])').length;
      s.hidden = vis === 0;
    });
  }
  function renderBallot() {
    seeds.forEach(renderFig); renderRemixFigs(); applyFilter();
  }
  gallery.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var fig = b.closest('.vote-item'); if (!fig) return;
    var id = fig.dataset.item, d = S.drafts[id] || (S.drafts[id] = {}), act = b.dataset.act;
    if (act === 'v' || act === 'r') {
      if (act === 'v') d.v = +b.dataset.v; else d.r = +b.dataset.r;
      fig.querySelectorAll('[data-act=' + act + ']').forEach(function (x) { x.setAttribute('aria-pressed', String(act === 'v' ? +x.dataset.v === d.v : +x.dataset.r === d.r)); });
    } else if (act === 'remix') {
      startRemix(id);
    } else if (act === 'submit') {
      var ta = fig.querySelector('textarea'); d.c = ta ? ta.value : '';
      var er = fig.querySelector('.verr'); S.errs[id] = ''; if (er) er.textContent = '';
      if (d.v !== 1 && d.v !== -1) { S.errs[id] = 'Choose Keep or Drop.'; if (er) er.textContent = S.errs[id]; return; }
      if (!d.r) { S.errs[id] = 'Choose a rating from 1 to 10.'; if (er) er.textContent = S.errs[id]; return; }
      b.disabled = true;
      post('/ballot', { item: id, v: d.v, r: d.r, c: d.c || '' }).then(function (res) {
        S.mine[id] = res.ballot; delete S.drafts[id];
        var it = allItems().filter(function (x) { return x.id === id; })[0]; if (it) renderFig(it);
        renderBar(); applyFilter();
      }).catch(function (err) {
        S.errs[id] = err.message; if (err.status === 409) { S.mine[id] = { v: d.v, r: d.r, c: d.c || '' }; load(); return; }
        b.disabled = false; if (er) er.textContent = err.message;
      });
    }
  });
  gallery.addEventListener('input', function (e) { if (e.target.dataset && e.target.dataset.act === 'c') { var id = e.target.closest('.vote-item').dataset.item; (S.drafts[id] || (S.drafts[id] = {})).c = e.target.value; } });

  /* ---------- results ---------- */
  function agg(it) {
    var g = S.stats[it.id] || { n: 0, sum: 0, yes: 0, dist: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    return { it: it, g: g, mean: g.n ? g.sum / g.n : 0, appr: g.n ? g.yes / g.n : 0 };
  }
  function renderResults() {
    var rows = allItems().filter(function (i) { return S.rf === 'all' || (S.rf === 'seed' ? i.kind === 'seed' : i.kind === 'remix'); }).map(agg);
    var s = S.sort;
    rows.sort(function (x, y) {
      if (s === 'votes') return y.g.n - x.g.n || y.mean - x.mean;
      if (s === 'appr') return (y.g.n > 0) - (x.g.n > 0) || y.appr - x.appr || y.mean - x.mean;
      if (s === 'new') return (y.it.t || 0) - (x.it.t || 0);
      var px = x.g.n >= MIN_N ? 1 : 0, py = y.g.n >= MIN_N ? 1 : 0;
      return py - px || (y.g.n > 0) - (x.g.n > 0) || y.mean - x.mean || y.appr - x.appr || y.g.n - x.g.n;
    });
    var cmBy = {}; S.comments.forEach(function (c) { (cmBy[c.item] = cmBy[c.item] || []).push(c); });
    var html = '<p class="vote-set-note">Ranked by mean rating. Logos with fewer than ' + MIN_N + ' ballots are marked provisional and sort below the rest. Keep % is the share of ballots that chose Keep.</p>'
      + '<div class="vote-tools"><button class="vchip" data-rf="all" aria-pressed="' + (S.rf === 'all') + '">All</button><button class="vchip" data-rf="seed" aria-pressed="' + (S.rf === 'seed') + '">Original concepts</button><button class="vchip" data-rf="remix" aria-pressed="' + (S.rf === 'remix') + '">Remixes</button>'
      + '<label class="vlab" for="vsort" style="margin-left:auto">Sort</label><select class="vsel" id="vsort"><option value="rating">Mean rating</option><option value="appr">Keep %</option><option value="votes">Most ballots</option><option value="new">Newest</option></select></div>';
    if (!rows.length) html += '<div class="vempty">No entries match this filter yet.</div>';
    else {
      html += '<div class="vrows">' + rows.map(function (r, i) {
        var it = r.it, g = r.g, mx = Math.max.apply(null, [1].concat(g.dist)), cms = cmBy[it.id] || [], open = S.open[it.id];
        return '<div class="vres"><div class="vrank">' + (s === 'new' ? '' : i + 1) + '</div><div class="vthumb">' + thumb(it) + '</div>'
          + '<div style="min-width:0"><h3>' + esc(it.name) + '</h3><div class="vlab">' + esc(it.set) + (g.n && g.n < MIN_N ? ' &middot; <span class="vprov">provisional</span>' : '') + '</div>'
          + '<div class="vdist" role="img" aria-label="Rating distribution, 1 to 10">' + g.dist.map(function (n, k) { return '<span title="' + (k + 1) + ': ' + n + '" style="height:' + Math.round(n / mx * 100) + '%"></span>'; }).join('') + '</div></div>'
          + '<div class="vscore"><big>' + (g.n ? r.mean.toFixed(1) : '&ndash;') + '</big><small>' + (g.n ? Math.round(r.appr * 100) + '% keep &middot; ' + g.n + ' ballot' + (g.n > 1 ? 's' : '') : 'no ballots') + '</small></div>'
          + (cms.length ? '<button class="vbtn vcm-toggle" data-cm="' + esc(it.id) + '" aria-expanded="' + !!open + '">' + (open ? 'Hide' : 'Show') + ' ' + cms.length + ' comment' + (cms.length > 1 ? 's' : '') + '</button>' : '')
          + (open && cms.length ? '<div class="vcms">' + cms.map(function (c) { return '<div class="vcm"><span>' + (c.v === 1 ? 'KEEP' : 'DROP') + ' &middot; ' + c.r + '/10</span>' + esc(c.c) + '</div>'; }).join('') + '</div>' : '')
          + '</div>';
      }).join('') + '</div>';
    }
    panel.innerHTML = html; var sel = $('#vsort'); if (sel) sel.value = S.sort;
  }
  panel.addEventListener('click', function (e) {
    var rf = e.target.closest('[data-rf]'); if (rf) { S.rf = rf.dataset.rf; renderResults(); return; }
    var cm = e.target.closest('[data-cm]'); if (cm) { S.open[cm.dataset.cm] = !S.open[cm.dataset.cm]; renderResults(); return; }
    var q = e.target.closest('[data-q]'); if (q) { S.rx.prompt = q.dataset.q; renderRemix(true); return; }
    var th = e.target.closest('[data-th]'); if (th) { S.rx.th = th.dataset.th; renderRemix(true); return; }
    var ly = e.target.closest('[data-lay]'); if (ly) { S.rx.lay = ly.dataset.lay; renderRemix(true); return; }
    if (e.target.id === 'rx-reset') { S.rx.cur = null; S.rx.msg = 'Reset to the original.'; renderRemix(true); return; }
    if (e.target.id === 'rx-go') return generate();
    if (e.target.id === 'rx-submit') return submitRemix();
  });
  panel.addEventListener('change', function (e) {
    if (e.target.id === 'vsort') { S.sort = e.target.value; renderResults(); }
    if (e.target.id === 'rx-src') pickSource(e.target.value);
    if (e.target.id === 'rx-refine') S.rx.refine = e.target.checked;
  });
  panel.addEventListener('input', function (e) {
    if (e.target.id === 'rx-prompt') S.rx.prompt = e.target.value;
    if (e.target.id === 'rx-name') S.rx.name = e.target.value;
  });

  /* ---------- remix lab ---------- */
  var baseCache = {};
  function fetchBase(id) {
    var s = seedBy[id]; if (!s) return Promise.reject(new Error('Unknown logo.'));
    if (baseCache[id]) return Promise.resolve(baseCache[id]);
    return fetch(s.img).then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/<g id="mark"[^>]*>([\s\S]*?)<\/g><g id="type">/); if (!m) throw new Error('This concept cannot be remixed.');
      return (baseCache[id] = m[1]);
    });
  }
  function pickSource(id) {
    S.rx.src = id; S.rx.cur = null; S.rx.msg = 'Loading…'; S.rx.base = null; renderRemix(true);
    fetchBase(id).then(function (b) { S.rx.base = b; S.rx.msg = ''; renderRemix(true); }).catch(function (e) { S.rx.msg = e.message; renderRemix(true); });
  }
  function startRemix(id) { setTab('remix'); pickSource(id); }
  function renderRemix(force) {
    var rx = S.rx;
    if (!force && panel.contains(document.activeElement) && /TEXTAREA|INPUT/.test(document.activeElement.tagName)) return;
    if (!rx.src) { var first = seeds.filter(function (s) { return s.remix; })[0]; rx.src = first.id; }
    var opts = seeds.filter(function (s) { return s.remix; }).map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === rx.src ? ' selected' : '') + '>' + esc(s.set) + ' &middot; ' + esc(s.name) + '</option>'; }).join('');
    var shown = rx.cur || rx.base || '', can = canVote() && S.remixEnabled;
    var prev = function (th) { return '<div class="vt vt-' + th + ' icon" role="img" aria-label="Preview on ' + (th === 'L' ? 'light' : 'dark') + '"><svg viewBox="0 0 120 120">' + (shown ? safe(shown) : '') + '</svg></div>'; };
    var quick = ['Thicker strokes for small sizes', 'Remove detail so it reads at 16 px', 'Make it more symmetrical', 'Add a dashed vertical axis through the center', 'Rotate the whole mark 15 degrees', 'Reduce to the fewest shapes that keep the idea'];
    var left = S.remixLeft;
    panel.innerHTML = '<p class="vote-set-note">Pick a logo, describe a change in plain words and review the result. If you like it, submit it. It joins the voting pool as a new entry. The AI helper has daily limits, and its drawings are filtered to simple shapes before they are shown.</p>'
      + (S.remixEnabled ? '' : '<div class="note">The remix lab is not available right now.</div>')
      + '<div class="vlab-grid"><div class="vpanel"><h2>1 &middot; Describe the change</h2>'
      + '<label class="vlab" for="rx-src">Starting logo</label><select class="vsel" id="rx-src" style="width:100%">' + opts + '</select>'
      + '<label class="vlab" for="rx-prompt">What should change</label><textarea id="rx-prompt" maxlength="300" placeholder="e.g. Make the rings thicker and drop the center dot">' + esc(rx.prompt) + '</textarea>'
      + '<div class="vrow">' + quick.map(function (q) { return '<button class="vchip" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>'
      + '<label class="vrow" style="gap:.5rem;font-size:.9rem"><input type="checkbox" id="rx-refine"' + (rx.refine ? ' checked' : '') + (rx.cur ? '' : ' disabled') + '> Build on the current result instead of the original</label>'
      + '<div class="vrow"><button class="vbtn pri" id="rx-go"' + (can && !rx.busy && rx.base ? '' : ' disabled') + '>' + (rx.busy ? 'Working…' : 'Generate') + '</button><button class="vbtn" id="rx-reset"' + (rx.cur ? '' : ' disabled') + '>Reset to original</button></div>'
      + '<div class="vstatus" role="status">' + esc(rx.msg) + '</div></div>'
      + '<div class="vpanel"><h2>2 &middot; Review and submit</h2><div class="vpair">' + prev('L') + prev('D') + '</div>'
      + '<div class="vrow">' + [['L', 'Light'], ['D', 'Dark'], ['C', 'Copper'], ['N', 'Navy']].map(function (t) { return '<button class="vchip" data-th="' + t[0] + '" aria-pressed="' + (rx.th === t[0]) + '">' + t[1] + '</button>'; }).join('')
      + [['stack', 'Stacked'], ['hz', 'Side by side'], ['icon', 'Icon only']].map(function (t) { return '<button class="vchip" data-lay="' + t[0] + '" aria-pressed="' + (rx.lay === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>'
      + lockup({ name: 'Your remix', svg: shown, th: rx.th, lay: rx.lay })
      + '<label class="vlab" for="rx-name">Name for your remix</label><input type="text" id="rx-name" maxlength="40" value="' + esc(rx.name) + '" placeholder="e.g. Thick Ring Orbit">'
      + '<div class="vrow"><button class="vbtn pri" id="rx-submit"' + (can && rx.cur && left > 0 ? '' : ' disabled') + '>Submit to voting pool</button><span class="vstatus">' + (canVote() ? left + ' submission' + (left === 1 ? '' : 's') + ' left' : '') + '</span></div>'
      + '<div class="verr" id="rx-err" role="alert"></div></div></div>'
      + '<div class="vpanel" style="margin-top:1.2rem"><h2>Your submissions</h2>' + (function () {
        var mine = remixItems().filter(function (i) { return i.own; });
        return mine.length ? '<div class="vmine">' + mine.map(function (i) { return '<div>' + lockup(i) + '<div class="vlab" style="margin-top:.3rem">' + esc(i.name) + '</div></div>'; }).join('') + '</div>' : '<div class="vempty">Nothing submitted yet.</div>';
      })() + '</div>';
  }
  function generate() {
    var rx = S.rx;
    if (rx.prompt.trim().length < 3) { rx.msg = 'Describe the change first.'; renderRemix(true); return; }
    var base = (rx.refine && rx.cur) || rx.base;
    rx.busy = true; rx.msg = 'Working on it. This can take up to a minute.'; renderRemix(true);
    post('/remix/generate', { prompt: rx.prompt, svg: base }).then(function (res) {
      rx.cur = sanitize(res.svg, ''); rx.msg = 'Done. Review the previews, then submit or refine.';
    }).catch(function (err) { rx.msg = err.message; }).then(function () { rx.busy = false; renderRemix(true); });
  }
  function submitRemix() {
    var rx = S.rx, er = $('#rx-err'), name = ($('#rx-name').value || '').trim();
    if (name.length < 2) { er.textContent = 'Give your remix a name.'; return; }
    if (!rx.cur) { er.textContent = 'Generate a result first.'; return; }
    $('#rx-submit').disabled = true; er.textContent = '';
    post('/remix/submit', { name: name, svg: sanitize(rx.cur, ''), theme: { L: 'light', D: 'dark', C: 'copper', N: 'navy' }[rx.th], layout: rx.lay, parent: rx.src, prompt: rx.prompt }).then(function (res) {
      S.remixes.push(res.remix); S.remixLeft = Math.max(0, S.remixLeft - 1);
      rx.cur = null; rx.name = ''; rx.prompt = ''; rx.msg = 'Submitted. Your remix is now in the voting pool.';
      renderBar(); renderRemix(true);
    }).catch(function (err) { er.textContent = err.message; $('#rx-submit').disabled = false; });
  }

  /* ---------- shell ---------- */
  function renderBar() {
    var items = allItems(), mine = Object.keys(S.mine).length, totalBallots = 0;
    Object.keys(S.stats).forEach(function (k) { totalBallots += S.stats[k].n; });
    bar.hidden = false;
    bar.innerHTML = '<div class="vote-tabs" role="tablist">' + [['ballot', 'Ballot'], ['results', 'Results']].concat(REMIX && S.remixEnabled ? [['remix', 'Remix lab']] : []).map(function (t) {
      return '<button class="vote-tab" role="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>'
      + '<div class="vote-stats"><span><b>' + items.length + '</b> entries</span><span><b>' + totalBallots + '</b> ballots</span>' + (S.ready ? '<span>you: <b>' + mine + '</b> of ' + items.length + '</span>' : '') + '</div>'
      + (S.tab === 'ballot' ? '<div class="vote-tools" style="width:100%;margin:0"><button class="vchip" data-filter="all" aria-pressed="' + (S.filter === 'all') + '">All</button><button class="vchip" data-filter="todo" aria-pressed="' + (S.filter === 'todo') + '">Not voted yet</button></div>' : '');
  }
  bar.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) { setTab(t.dataset.tab); return; }
    var f = e.target.closest('[data-filter]'); if (f) { S.filter = f.dataset.filter; renderBar(); applyFilter(); }
  });
  function setTab(t) {
    S.tab = t;
    gallery.hidden = t !== 'ballot'; panel.hidden = t === 'ballot';
    if (t === 'results') { renderResults(); } else if (t === 'remix') { renderRemix(true); if (!S.rx.base) pickSource(S.rx.src || seeds.filter(function (s) { return s.remix; })[0].id); }
    renderBar();
    if (t !== 'ballot') { load(true); }
    var top = app.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo(0, Math.max(0, top));
  }
  function load(quiet) {
    return api('/state').then(function (d) {
      S.stats = d.stats || {}; S.comments = d.comments || []; S.remixes = d.remixes || []; S.mine = d.mine || {}; S.remixLeft = d.remixLeft; S.remixEnabled = !!d.remixEnabled; S.ready = true; S.error = '';
    }).catch(function (e) { S.error = e.message; }).then(function () {
      renderBar();
      if (S.tab === 'ballot') renderBallot(); else if (S.tab === 'results') renderResults(); else if (!quiet) renderRemix(true);
      var n = $('#vote-notice');
      if (S.error) { if (!n) { n = document.createElement('div'); n.id = 'vote-notice'; n.className = 'note'; app.insertBefore(n, app.firstChild); } n.textContent = 'Voting is unavailable right now (' + S.error + '). You can still browse the concepts.'; }
      else if (n) n.remove();
    });
  }
  /* First paint: controls disabled until state arrives. */
  renderBar(); seeds.forEach(renderFig);
  load();
})();
