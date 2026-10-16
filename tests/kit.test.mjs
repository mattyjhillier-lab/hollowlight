// U2 / U2b Lantern Glass, Lit kit: helper safety (no innerHTML, hostile text stays text), aria, keyboard, contrast, tap-target tokens, no external URLs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const R = (p) => new URL('../' + p, import.meta.url);
const kitJs = readFileSync(R('src/ui/kit.js'), 'utf8');
const kitCss = readFileSync(R('src/ui/kit.css'), 'utf8');
const pageJs = readFileSync(R('src/ui/kitpage.js'), 'utf8');
const styleCss = readFileSync(R('src/style.css'), 'utf8');

// ---- tiny fake DOM ----
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, disabled: false, style: { setProperty(k, v) { this[k] = v; } },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.__focused = n; } };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text, set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }) };
const K = await import('../src/ui/kit.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (root, pred) => { const o = []; walk(root, (n) => { if (pred(n)) o.push(n); }); return o; };
const byCls = (root, c) => find(root, (n) => n._cls.has(c));
const HOSTILE = ['<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', '&lt;b&gt; ${1+1} `x`', "'; DROP TABLE saves;--", 'javascript:alert(1)'];

test('U2 source rules: no innerHTML / insertAdjacentHTML / outerHTML / eval / external URLs in kit files', () => {
  for (const [n, raw] of [['kit.js', kitJs], ['kitpage.js', pageJs]]) {
    const s = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write|eval\(|new Function|srcdoc/.test(s), n);
    assert.ok(!/https?:\/\//.test(s.replace('http://www.w3.org/2000/svg', '')), n + ' external url (only the SVG namespace id is allowed)');
  }
  const cssNoNs = kitCss.replace(/xmlns='http:\/\/www\.w3\.org\/2000\/svg'/g, '');
  assert.ok(!/https?:\/\//.test(cssNoNs), 'kit.css external url');
  const body = kitCss.replace(/\/\* ART:BEGIN[\s\S]*ART:END \*\//, '');
  assert.ok(!/@import|url\(/.test(body), 'kit.css body has no url(); art lives only in the generated ART block');
  const art = kitCss.match(/\/\* ART:BEGIN[\s\S]*ART:END \*\//)[0];
  const props = [...art.matchAll(/--lg-a-[a-z-]+:\s*([^;]*);\r?\n/g)];
  assert.ok(props.length >= 15, 'art properties present');
  for (const m of props) assert.ok(/^url\("data:image\/svg\+xml,%3Csvg xmlns='http:\/\/www\.w3\.org\/2000\/svg'/.test(m[1]) && !/<script|onload|onerror|href='http|javascript:|<image|foreignObject/i.test(decodeURIComponent(m[1])), 'art is inline svg only');
  assert.ok(!/backdrop-filter|filter: url|feDisplacementMap|feTurbulence/.test(kitCss.replace(/\/\*[\s\S]*?\*\//g, '')), 'no backdrop-filter, no live SVG filter (the wobble is baked)');
  assert.ok(!/\.(png|jpg|jpeg|gif|webp|woff2?)/i.test(kitCss), 'no raster/font assets in kit.css');
});

test('U2 kit.css stays tiny and every selector is lg- scoped (cannot touch HUD or live screens)', () => {
  assert.ok(statSync(R('src/ui/kit.css')).size < 56000, 'kit.css size budget (U2b)');
  const css = kitCss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{|@keyframes [^{]*\{[^}]*(\{[^}]*\}[^}]*)*\}/g, (m) => (m.startsWith('@keyframes') ? '' : m));
  const sel = css.split('}').map((b) => b.split('{')[0].trim()).filter((s) => s && !s.startsWith('@') && !/^(from|to)\b/.test(s));
  for (const group of sel) for (const s of group.split(',').map((x) => x.trim())) {
    if (s === ':root' || s.startsWith(':is(.lg-')) continue;
    assert.ok(/(\.lg-|\.reduced-motion \.lg-)/.test(s), 'unscoped selector: ' + s);
  }
});

test('U2 el(): hostile text stays text, bad attributes and classes are refused', () => {
  for (const h of HOSTILE) {
    const e = K.el('div', 'x', h);
    assert.equal(e.textContent, h);
    assert.equal(e.children.length, 0);
  }
  for (const bad of ['onclick', 'onerror', 'style', 'href', 'src', 'srcdoc', 'formaction']) assert.throws(() => K.el('div', null, null, { [bad]: 'x' }), /not allowed/, bad);
  assert.throws(() => K.el('div', 'a"><script>'), /bad class/);
  assert.equal(K.el('div', null, null, { 'aria-label': '<b>', 'data-x': '1', role: 'img' }).getAttribute('aria-label'), '<b>');
});

test('U2 components render hostile labels as plain text only', () => {
  const h = HOSTILE[0];
  const nodes = [
    K.panel({ kicker: h, title: h, whisper: h, body: [] }), K.button({ label: h, whisper: h, hint: h }), K.toggle({ label: h, help: h }),
    K.tabs({ label: h, items: [{ id: 'a', label: h }] }), K.slider({ label: h }), K.divider({ text: h }), K.badge({ kind: 'new', text: h }),
    K.pips({ label: h }), K.wick({ label: h }), K.tooltip({ name: h, verb: h, rank: h, flavour: h }), K.card({ kicker: h, title: h, big: h, line: h, hint: h }),
  ];
  for (const n of nodes) walk(n, (x) => { assert.ok(x.tag !== 'script' && x.tag !== 'img', 'injected element'); for (const k of Object.keys(x.attrs)) assert.ok(!/^on/.test(k) && k !== 'style', 'attr ' + k); });
  assert.equal(byCls(nodes[1], 'lg-btn__label')[0].textContent, h);
  assert.equal(byCls(nodes[10], 'lg-card__title')[0].textContent, h);
});

test('U2 button: role/type, variants validated, disabled blocks click, key hint is aria-hidden + aria-keyshortcuts', () => {
  let n = 0;
  const b = K.button({ label: 'Begin', hint: 'Enter', variant: 'primary', onClick: () => n++ });
  assert.equal(b.tag, 'button'); assert.equal(b.getAttribute('type'), 'button');
  assert.ok(b._cls.has('lg-btn--primary')); assert.equal(b.getAttribute('aria-keyshortcuts'), 'Enter');
  assert.equal(byCls(b, 'lg-btn__key')[0].getAttribute('aria-hidden'), 'true');
  assert.equal(byCls(b, 'lg-btn__flame')[0].getAttribute('aria-hidden'), 'true');
  b.fire('click'); assert.equal(n, 1);
  const d = K.button({ label: 'No', disabled: true, onClick: () => n++ }); d.fire('click'); assert.equal(n, 1);
  assert.throws(() => K.button({ label: 'x', variant: 'huge' }), /variant/);
});

test('U2 toggle: role=switch, aria-checked flips, state text shown (not colour only), help linked by aria-describedby', () => {
  const seen = [];
  const t = K.toggle({ label: 'Calm', help: 'Less movement', checked: false, onChange: (v) => seen.push(v) });
  assert.equal(t.getAttribute('role'), 'switch'); assert.equal(t.getAttribute('aria-checked'), 'false');
  const help = byCls(t, 'lg-switch__help')[0];
  assert.equal(t.getAttribute('aria-describedby'), help.getAttribute('id'));
  t.fire('click'); assert.equal(t.getAttribute('aria-checked'), 'true'); assert.equal(byCls(t, 'lg-switch__state')[0].textContent, 'On');
  t.fire('click'); assert.deepEqual(seen, [true, false]);
});

test('U2 tabs: tablist/tab roles, one tab stop (roving tabindex), arrows wrap and skip disabled, Home/End', () => {
  const picked = [];
  const l = K.tabs({ label: 'T', items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C', disabled: true }, { id: 'd', label: 'D' }], selected: 'a', onSelect: (i) => picked.push(i) });
  assert.equal(l.getAttribute('role'), 'tablist'); assert.equal(l.getAttribute('aria-label'), 'T');
  const tabs = byCls(l, 'lg-tab');
  assert.ok(tabs.every((t) => t.getAttribute('role') === 'tab'));
  const stops = () => tabs.filter((t) => t.getAttribute('tabindex') === '0').map((t) => t.getAttribute('data-id'));
  assert.deepEqual(stops(), ['a']);
  tabs[0].fire('keydown', { key: 'ArrowRight' }); assert.deepEqual(stops(), ['b']); assert.equal(globalThis.__focused, tabs[1]);
  tabs[1].fire('keydown', { key: 'ArrowRight' }); assert.deepEqual(stops(), ['d']);
  tabs[3].fire('keydown', { key: 'ArrowRight' }); assert.deepEqual(stops(), ['a']);
  tabs[0].fire('keydown', { key: 'End' }); assert.deepEqual(stops(), ['d']);
  tabs[3].fire('keydown', { key: 'Home' }); assert.deepEqual(stops(), ['a']);
  assert.equal(tabs.filter((t) => t.getAttribute('aria-selected') === 'true').length, 1);
});

test('U2 pips / wick / divider / badge: labels and validation', () => {
  const p = K.pips({ total: 5, filled: 2 });
  assert.equal(p.getAttribute('role'), 'img'); assert.equal(p.getAttribute('aria-label'), 'Rank 2 of 5');
  assert.equal(byCls(p, 'on').length, 2);
  assert.equal(K.pips({ total: 99, filled: 99 }).children.length, 12, 'clamped');
  assert.equal(K.pips({ total: 'x', filled: -3 }).children.length, 0);
  assert.equal(K.wick({ state: 'dark', label: 'Sanctuary' }).getAttribute('aria-label'), 'Sanctuary: locked');
  assert.equal(K.wick({ state: 'lit' }).getAttribute('aria-label'), 'lit');
  assert.throws(() => K.wick({ state: 'blazing' }), /state/);
  assert.equal(K.divider().getAttribute('role'), 'separator');
  assert.equal(K.badge({ kind: 'new' }).textContent, '' ); // text is in a child
  assert.equal(byCls(K.badge({ kind: 'evolve' }), 'lg-badge__text')[0].textContent, 'Evolve');
  assert.throws(() => K.badge({ kind: 'gold' }), /kind/);
});

test('U2 panel: labelled by its title; card is a button with aria-pressed; tooltip is role=tooltip linked by aria-describedby, closes on Esc, opens on focus + long-press', () => {
  const p = K.panel({ title: 'Buttons', body: [] });
  assert.equal(p.getAttribute('aria-labelledby'), byCls(p, 'lg-panel__title')[0].getAttribute('id'));
  const c = K.card({ title: 'T', selected: true });
  assert.equal(c.tag, 'button'); assert.equal(c.getAttribute('aria-pressed'), 'true');
  const target = K.button({ label: 'Hover' });
  const w = K.withTooltip(target, { name: 'N', verb: 'v' }, { longPressMs: 5, holdMs: 80 });
  const tip = w.tip;
  assert.equal(tip.getAttribute('role'), 'tooltip'); assert.equal(target.getAttribute('aria-describedby'), tip.getAttribute('id')); assert.ok(tip.hidden);
  target.fire('focus'); assert.ok(!tip.hidden);
  target.fire('keydown', { key: 'Escape' }); assert.ok(tip.hidden);
  target.fire('mouseenter'); assert.ok(!tip.hidden); target.fire('mouseleave'); assert.ok(tip.hidden);
  return new Promise((res) => { target.fire('touchstart'); setTimeout(() => { assert.ok(!tip.hidden, 'long-press opens'); setTimeout(() => { assert.ok(tip.hidden, 'auto closes'); res(); }, 150); }, 25); });
});

// ---- contrast (WCAG) on the glass, worst case = glass laid over solid white and over the plate ----
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (rgba, under) => rgba.slice(0, 3).map((c, i) => c * rgba[3] + under[i] * (1 - rgba[3]));
const tok = (name, css = styleCss) => { const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`)); assert.ok(m, name); return hex(m[1]); };
const rgba = (name) => { const m = styleCss.match(new RegExp(`${name}:\\s*rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([.\\d]+)\\)`)); assert.ok(m, name); return [+m[1], +m[2], +m[3], +m[4]]; };

test('U2 contrast >= 4.5:1 for body text on the glass (worst case: glass over white), and for brass/thread/teal/danger text', () => {
  const leak = (c) => over([255, 190, 110, .24], c); // warm lantern leak (peak) over the cool glass; worst case over solid white
  const bgs = { white: leak(over([48, 60, 86, .98], [255, 255, 255])), plate: leak(tok('--lg-glass-top', kitCss)), bottom: tok('--lg-glass-bot', kitCss) };
  const dimA = (() => { const m = kitCss.match(/--lg-dim:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/); assert.ok(m, '--lg-dim'); return [+m[1], +m[2], +m[3], +m[4]]; })();
  const cream = tok('--lg-text');
  for (const [bn, bg] of Object.entries(bgs)) {
    const checks = {
      'cream text': cream, 'dim text': over(dimA, bg), 'brass kicker': tok('--lg-brass-text', kitCss), 'thread whisper': tok('--thread'),
      'gold evolve': tok('--lg-evo'), 'danger text': tok('--lg-danger-text', kitCss),
    };
    for (const [n, fg] of Object.entries(checks)) {
      if (n === 'danger text' && bn !== 'bottom') continue; // danger labels sit on buttons, away from the cap leak (also checked on the glass top below)
      if (bn === 'white' && /gold|teal|brass|thread|danger/.test(n)) continue; // coloured text is only ever on the panel/card fills (<= 0.93 opaque dark), checked on plate
      assert.ok(ratio(fg, bg) >= 4.5, `${n} on ${bn}: ${ratio(fg, bg).toFixed(2)}`);
    }
  }
  assert.ok(ratio(cream, bgs.white) >= 5.5, 'cream on worst-case glass (peak lantern leak) reads strongly');
  // text on the primary button (amber tint .3 over plate, hover tint) and on the teal NEW flag / gold seal ink
  assert.ok(ratio(tok('--lg-seal-ink', kitCss), hex('#d97a22')) >= 4.5, 'ink on primary amber (darkest stop)');
  assert.ok(ratio(tok("--lg-seal-ink", kitCss), hex("#e0a840")) >= 4.5, "ink on gold seal label");
  const pressed = over([255, 171, 58, .24], tok('--lg-glass-top', kitCss));
  assert.ok(ratio(cream, pressed) >= 4.5, 'cream on pressed');
  assert.ok(ratio(tok('--lg-ink', kitCss), tok('--teal')) >= 4.5, 'ink on teal flag');
  assert.ok(ratio(tok('--lg-danger-text', kitCss), tok('--lg-glass-top', kitCss)) >= 4.5, 'danger text on glass');
});

test('U2 tap-target and type floors are encoded in CSS (measured in a real browser by scripts/u2-shots.mjs)', () => {
  assert.match(kitCss, /--lg-tap: 44px/);
  for (const c of ['.lg-btn', '.lg-switch', '.lg-tab', '.lg-range']) {
    const m = kitCss.match(new RegExp(`\\n\\${c} \\{[^}]*\\}`));
    assert.ok(m && /(min-)?height: (var\(--lg-tap\)|max\(\d+px, var\(--lg-tap\)\))/.test(m[0]), c + ' >= 44px');
  }
  assert.ok(!/font-size:\s*(\d|10)(\.\d+)?px/.test(kitCss), 'no sub-11px literal font sizes');
  assert.ok(!/\.lg-[a-z_-]*:hover[^{]*\{[^}]*display\s*:\s*(block|inline|flex)/.test(kitCss), 'no hover-only reveal of content');
});

test('U2 reduced motion: OS setting and the game Calm class both switch animations off; focus ring defined; touch hides key hints', () => {
  assert.match(kitCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
  assert.match(kitCss, /\.reduced-motion \.lg-kit \*/);
  assert.match(kitCss, /\.lg-btn:focus-visible[\s\S]*outline: 2px solid var\(--thread\)/);
  assert.match(kitCss, /@media \(hover: none\), \(pointer: coarse\) \{ \.lg-btn__key/);
});

test('U2 entry: ?kit=1 is a dev switch that does not import the game', () => {
  const entry = readFileSync(R('src/entry.js'), 'utf8');
  assert.match(entry, /get\('kit'\) === '1'[\s\S]*kitpage\.js/);
  assert.ok(!/main\.js/.test(pageJs) && !/sim\//.test(pageJs), 'kit page never touches the sim or the game');
  assert.ok(!/localStorage|save\//.test(pageJs + kitJs), 'no save access');
});

test('U2b wordmark: accessible name Hollowlight, svg built with createElementNS (no markup strings), inner shapes decorative', () => {
  const w = K.wordmark();
  assert.equal(w.ns, 'http://www.w3.org/2000/svg'); assert.equal(w.tag, 'svg');
  assert.equal(w.getAttribute('role'), 'img'); assert.equal(w.getAttribute('aria-label'), 'Hollowlight');
  assert.equal(w.getAttribute('class'), 'lg-wordmark');
  assert.equal(find(w, (n) => n.tag === 'g' && n.getAttribute('aria-hidden') === 'true').length, 11, 'one decorative group per letter');
  const ids = find(w, (n) => n.getAttribute('id')).map((n) => n.getAttribute('id')); assert.equal(new Set(ids).size, ids.length);
  const w2 = K.wordmark(); const ids2 = find(w2, (n) => n.getAttribute('id')).map((n) => n.getAttribute('id'));
  assert.ok(ids2.every((i) => !ids.includes(i)), 'gradient ids are unique per instance');
  walk(w, (n) => { assert.ok(n.tag !== 'script' && n.tag !== 'image' && n.tag !== 'foreignObject' && n.tag !== 'use'); for (const k of Object.keys(n.attrs)) assert.ok(!/^on|href/.test(k), k); });
  assert.equal(K.wordmark({ label: '<b>' }).getAttribute('aria-label'), '<b>');
});

test('U2b icon: allow-listed names only, decorative unless labelled', () => {
  assert.equal(K.icon('flame').getAttribute('aria-hidden'), 'true');
  assert.equal(K.icon('star', { label: 'Evolve' }).getAttribute('aria-label'), 'Evolve');
  assert.throws(() => K.icon('x"><script>'), /bad icon/);
  assert.ok(K.icon('lock')._cls.has('lg-ic--lock'));
});

test('U2b T2 accent: the leadlight border (lg-lead) appears ONLY on the evolution card and the Dawn panel', () => {
  assert.ok(K.card({ title: 'a', evolve: true })._cls.has('lg-lead'));
  assert.ok(!K.card({ title: 'a' })._cls.has('lg-lead'));
  assert.ok(K.panel({ title: 'a', variant: 'dawn' })._cls.has('lg-lead'));
  assert.ok(!K.panel({ title: 'a' })._cls.has('lg-lead'));
  assert.throws(() => K.panel({ variant: 'gold' }), /variant/);
  for (const [n, raw] of [['kit.js', kitJs]]) assert.equal((raw.match(/lg-lead/g) || []).length, 2, n + ' uses lg-lead in exactly two places');
  const uses = [...kitCss.matchAll(/var\(--lg-a-lead(arch)?\)/g)].length; assert.ok(uses >= 2);
  assert.ok(!/lg-a-lead/.test(pageJs));
  const body = kitCss.replace(/\/\* ART:BEGIN[\s\S]*ART:END \*\//, '');
  const users = [...body.matchAll(/([^{}]+)\{([^{}]*var\(--lg-a-lead[^{}]*)\}/g)].map((m) => m[1].trim());
  assert.ok(users.length >= 3, 'lead art is used');
  for (const sel of users) assert.ok(/^\.lg-card--evolve$|^\.lg-panel--dawn$/.test(sel.replace(/^.*\}\s*/, '')), 'lead art referenced outside its two variants: ' + sel);
});

test('U2b panel/card/toggle structure: lantern cap is decorative, toggle state sits in the track and stays aria-hidden', () => {
  const p = K.panel({ title: 'T' });
  assert.equal(byCls(p, 'lg-cap')[0].getAttribute('aria-hidden'), 'true');
  assert.equal(byCls(K.panel({ title: 'T', cap: false }), 'lg-cap').length, 0);
  const t = K.toggle({ label: 'x' });
  assert.equal(byCls(byCls(t, 'lg-switch__track')[0], 'lg-switch__state').length, 1);
  const c = K.card({ title: 'x', icon: 'bolt' });
  assert.equal(byCls(c, 'lg-card__medal')[0].getAttribute('aria-hidden'), 'true');
});
