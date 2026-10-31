// U3: title + hero select. Copy present, hostile strings inert, focus/DOM order, accessible names, keyboard, CSS scoping, size budget.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { data } from './helpers.mjs';

const R = (p) => new URL('../' + p, import.meta.url);
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    fire(t, ev = {}) { (this.listeners[t] || []).forEach((f) => f({ preventDefault() {}, stopPropagation() {}, ...ev })); },
    focus() { globalThis.document.activeElement = n; }, click() { n.fire('click'); } };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  Object.defineProperty(n, 'outerHTML', { set() { throw new Error('outerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };
const { buildTitle, buildHeroSelect, buildSpiritSelect } = await import('../src/ui/title.js');
const C = await import('../src/ui/titlecopy.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const texts = (r) => { const o = []; walk(r, (n) => { if (n._text) o.push(n._text); }); return o.join(' | '); };
const heroes = () => Object.entries(data.characters).map(([id, c]) => ({ ...C.heroView(id, c, '') }));

test('title copy: wordmark name, Begin/Continue + whispers, Skill Tree, Settings, version', () => {
  const t = buildTitle({ version: '9.9.9' });
  const s = texts(t.root);
  for (const w of ['Chapter 1', 'Spirits of the Dusk', 'Begin', 'Pick a hero and walk the Hollow', 'Skill Tree', 'Settings', 'Sound, motion, saves', 'v9.9.9']) assert.ok(s.includes(w), w);
  assert.equal(find(t.root, (n) => n.attrs.role === 'img' && n.attrs['aria-label'] === 'Wispwick').length, 1);
  assert.equal(find(t.root, (n) => n.tag === 'h1').length, 1);
  assert.ok(texts(buildTitle({ hasProgress: true }).root).includes('Continue'));
  assert.ok(!texts(buildTitle({ hasProgress: true }).root).includes('Begin'));
});

test('title: focus order = DOM order (Begin, Skill Tree, Settings); all are real buttons; callbacks fire', () => {
  const calls = [];
  const t = buildTitle({ onBegin: () => calls.push('b'), onTree: () => calls.push('t'), onSettings: () => calls.push('s') });
  const btns = find(t.root, (n) => n.tag === 'button');
  assert.deepEqual(btns.map((b) => b.textContent.slice(0, 5)), ['Begin', 'Skill', 'Setti']);
  assert.ok(btns.every((b) => !b.attrs.tabindex || b.attrs.tabindex === '0'));
  btns.forEach((b) => b.click());
  assert.deepEqual(calls, ['b', 't', 's']);
});

test('tree whisper: first run, bank amounts, hostile values stay numbers/text', () => {
  assert.equal(C.treeWhisper({ gold: 0, shards: 0 }, true), C.TITLE.tree.firstRun);
  assert.equal(C.treeWhisper({ gold: 120, shards: 1 }, false), '120 gold · 1 soul shard to spend');
  assert.equal(C.treeWhisper({ gold: '<img src=x onerror=1>', shards: NaN }, false), C.TITLE.tree.whisper);
  assert.equal(C.treeWhisper(null, false), C.TITLE.tree.whisper);
});

test('hostile hero names, lines, version and bank are inert text (no innerHTML anywhere)', () => {
  const evil = '<img src=x onerror=alert(1)>"><script>1</script>';
  const t = buildTitle({ version: evil, bank: { gold: evil, shards: evil }, firstRun: true });
  assert.ok(texts(t.root).includes('<img'));
  const hs = buildHeroSelect({ heroes: [{ id: 'x', name: evil, epithet: evil, line: evil, gift: evil, weapon: evil, weaponId: 'nope', ability: evil, pips: { health: 3, speed: 3 } }], portraits: { x: 'data:image/webp;base64,AA' } });
  assert.equal(find(hs.root, (n) => n.tag === 'script').length, 0);
  assert.ok(hs.cards[0].el.attrs['aria-label'].includes('<img'));
  const v = C.heroView('x', { name: evil + ', ' + evil, hp: 'x', speed: {}, ability: 5 }, 7);
  assert.equal(typeof v.name, 'string');
  assert.deepEqual(v.pips, { health: 4, speed: 4 }, 'junk hp/speed read as the shared body');
  assert.equal(C.splitName(42).name, 'Hero');
});

test('hero select: Wren and Elias cards, stats as pips with names, ability line, radio semantics', () => {
  const hs = buildHeroSelect({ heroes: heroes(), selected: 'wren' });
  const s = texts(hs.root);
  for (const w of ['Who carries the lantern?', 'Wren', 'the Orphan', 'Elias', 'the Priest', 'Pelt Dash', 'Sanctuary Ring', 'Walk with Wren', 'Back', 'Chosen', 'Ready', 'Darts out of trouble']) assert.ok(s.includes(w), w);
  assert.ok(!/Ghost Wolves|Holy Orbit|kindred/i.test(s), 'hero cards carry no weapon / kindred text');
  assert.equal(hs.group.attrs.role, 'radiogroup');
  assert.deepEqual(hs.cards.map((c) => c.el.attrs['aria-checked']), ['true', 'false']);
  assert.deepEqual(hs.cards.map((c) => c.el.attrs.tabindex), ['0', '-1']);
  assert.equal(hs.cards[0].el.attrs['aria-label'], 'Wren, the Orphan');
  assert.equal(find(hs.root, (n) => /^Health \d of 5$/.test(n.attrs['aria-label'] || '')).length, 2);
  assert.deepEqual(C.heroPips(data.characters.wren), { health: 4, speed: 4 }, 'v2: one shared body');
  assert.deepEqual(C.heroPips(data.characters.elias), C.heroPips(data.characters.wren));
});

test('hero select keyboard: arrows/digits move the choice, Enter starts, Esc goes back, buttons keep native Enter', () => {
  const out = [];
  const hs = buildHeroSelect({ heroes: heroes(), selected: 'wren', onStart: (id) => out.push('start:' + id), onBack: () => out.push('back') });
  const ev = (key) => ({ key, preventDefault() {} });
  globalThis.document.activeElement = hs.cards[0].el;
  hs.onKey(ev('ArrowRight'));
  assert.equal(hs.current(), 'elias');
  assert.equal(globalThis.document.activeElement, hs.cards[1].el);
  assert.deepEqual(hs.cards.map((c) => c.el.attrs.tabindex), ['-1', '0']);
  hs.onKey(ev('1'));
  assert.equal(hs.current(), 'wren');
  hs.onKey(ev('ArrowLeft'));
  assert.equal(hs.current(), 'elias'); // wraps
  hs.onKey(ev('Enter'));
  assert.deepEqual(out, ['start:elias']);
  globalThis.document.activeElement = hs.start;
  assert.equal(hs.onKey(ev('Enter')), false); // the focused button handles it natively
  hs.onKey(ev('Escape'));
  assert.equal(out.at(-1), 'back');
  hs.onKey(ev('9'));
  assert.equal(hs.current(), 'elias');
  hs.cards[0].el.click();
  assert.equal(hs.current(), 'wren'); // click selects
  hs.cards[0].el.click();
  assert.equal(out.at(-1), 'start:wren'); // second click starts
  assert.equal(hs.onKey({ key: 'Enter', ctrlKey: true, preventDefault() {} }), false);
});

test('hero select DOM order: cards, Back, Start (Tab order)', () => {
  const hs = buildHeroSelect({ heroes: heroes(), selected: 'wren' });
  const order = [];
  walk(hs.root, (n) => { if (n.attrs.role === 'radio') order.push('card'); else if (n.tag === 'button') order.push(n.textContent.slice(0, 4)); });
  assert.deepEqual(order, ['card', 'card', 'Back', 'Walk']);
});

test('CSS: every rule scoped under .overlay.u3 / .u3; no external URLs; no backdrop-filter; asset + source safety', () => {
  const css = readFileSync(R('src/ui/title.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/url\(\s*['"]?https?:/.test(css) && !/backdrop-filter/.test(css));
  const sels = [...css.matchAll(/(?:^|[};{])\s*([^{};@]+)\{/g)].map((m) => m[1].trim()).filter((x) => x && !/^\d|^from|^to/.test(x));
  for (const sel of sels) for (const part of sel.split(',')) assert.ok(/\.u3\b/.test(part), 'unscoped: ' + part.trim());
  assert.ok(statSync(R('src/assets/heroes/wren.webp')).size <= 15360 && statSync(R('src/assets/heroes/elias.webp')).size <= 15360);
  const js = (readFileSync(R('src/ui/title.js'), 'utf8') + readFileSync(R('src/ui/titlecopy.js'), 'utf8')).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML/.test(js));
});

test('title veil keeps text >= 4.5:1 over the lightest Hollow ground', () => {
  const lum = (c) => { const f = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t));
  let bg = mix([14, 20, 34], [165, 178, 200], 0.7); // veil over the lightest canvas
  bg = mix([255, 171, 58], bg, 0.16); // plus the warm lantern pool
  const ratio = (fg) => (lum(fg) + 0.05) / (lum(bg) + 0.05);
  assert.ok(ratio([245, 223, 174]) >= 4.5, 'kicker');
  assert.ok(ratio([255, 224, 160]) >= 4.5, 'tagline');
  assert.ok(ratio([255, 243, 220].map((v, i) => v * 0.88 + bg[i] * 0.12)) >= 4.5, 'dim text');
});

test('title load note: shown as plain text in a status paragraph, hostile text is inert, absent when empty', () => {
  const t = buildTitle({ note: '<img src=x onerror=alert(1)> Save was damaged' });
  const n = find(t.root, (x) => x._cls.has('u3-note'));
  assert.equal(n.length, 1); assert.equal(n[0].attrs.role, 'status');
  assert.ok(n[0].textContent.startsWith('<img'), 'kept as text');
  assert.equal(find(buildTitle({}).root, (x) => x._cls.has('u3-note')).length, 0);
});

// ---- CHARACTER SYSTEM v2 loadout: starting-spirit step + starter pick (CH4)
const spirits = () => [
  { id: 'ghost_wolves', name: 'Ghost Wolves', line: 'pack', open: false, note: 'Wake it in the Lantern Web · Complete 2 runs 0/2' },
  { id: 'raven_flock', name: 'Raven Flock', line: 'scouts', open: true },
  { id: 'spirit_bolts', name: '<img src=x onerror=alert(1)>', line: '<b>x</b>', open: false },
  { id: 'chain_lightning', name: 'Chain Lightning', line: 'storm', open: true },
];
test('spirit step: sleeping spirits are aria-disabled and never chosen (click, keys, digits); the label names hero + spirit; text only', () => {
  const out = [];
  const v = buildSpiritSelect({ spirits: spirits(), heroName: 'Elias', selected: 'ghost_wolves', onStart: (id) => out.push(id), onBack: () => out.push('back') });
  assert.equal(v.current(), null, 'a sleeping preselect gives NO preselect (never the first awake one)');
  assert.ok(texts(v.root).includes('Choose a spirit to start'));
  assert.equal(v.start.disabled, true, 'start disabled until a spirit is tapped');
  assert.equal(buildSpiritSelect({ spirits: spirits(), heroName: 'Elias', selected: 'chain_lightning' }).current(), 'chain_lightning', 'a remembered awake spirit is preselected');
  assert.ok(texts(buildSpiritSelect({ spirits: spirits(), heroName: 'Elias', selected: 'raven_flock' }).root).includes('Walk with Elias · Raven Flock'));
  v.cards[1].el.click(); assert.equal(v.current(), 'raven_flock');
  assert.ok(!v.start.disabled, 'tapping a spirit enables start');
  assert.deepEqual(v.cards.map((c) => c.el.attrs['aria-disabled'] || null), ['true', null, 'true', null]);
  assert.equal(v.group.attrs.role, 'radiogroup');
  v.cards[0].el.click(); assert.equal(v.current(), 'raven_flock');
  const key = (k) => ({ key: k, preventDefault() {} });
  globalThis.document.activeElement = v.cards[1].el;
  v.onKey(key('ArrowRight')); assert.equal(v.current(), 'chain_lightning');
  v.onKey(key('ArrowRight')); assert.equal(v.current(), 'raven_flock', 'wraps over the sleeping ones');
  assert.equal(v.onKey(key('3')), false, 'digit of a sleeping spirit does nothing');
  v.onKey(key('4')); v.onKey(key('Enter'));
  v.onKey(key('Escape'));
  assert.deepEqual(out, ['chain_lightning', 'back']);
  assert.ok(texts(v.root).includes('<img src=x'), 'hostile name stays text');
  assert.equal(find(v.root, (n) => n.tag === 'script' || n.tag === 'img').length, 0);
  const none = buildSpiritSelect({ spirits: spirits().map((s) => ({ ...s, open: false })), heroName: 'Wren' });
  assert.equal(none.current(), null); assert.equal(none.start.disabled, true);
});

test('starter copy and hero badge: copy override, Bond badge beside the name, no pips row when pips is null', () => {
  const h = { ...C.heroView('wren', data.characters.wren, 'Ghost Wolves'), weaponId: 'ghost_wolves', pips: null, badge: 'Bond 3' };
  const hs = buildHeroSelect({ heroes: [h], copy: { kicker: C.LOADOUT.starterKicker, title: C.LOADOUT.starterHeroTitle, whisper: C.LOADOUT.starterHeroWhisper }, nextLabel: 'Next' });
  const s = texts(hs.root);
  assert.ok(s.includes('Who will you walk with first?') && s.includes('Bond 3') && s.includes('Next'));
  assert.equal(find(hs.root, (n) => /^Health/.test(n.attrs['aria-label'] || '')).length, 0);
});

// ---- CH5 Characters page
const { buildCharacters } = await import('../src/ui/charsui.js');
const { charsView } = await import('../src/ui/charcopy.js');
const { treeDef } = await import('./helpers.mjs');
test('Characters page: awake hero shows Bond, skill, stats, the 5 named gifts; a sleeping hero shows its keepsake + hint progress; hostile text inert', () => {
  const save = { chars: { wren: { xp: 2000, keep: 0, woke: true }, elias: { xp: 0, keep: 2, woke: false } }, stats: { killsByEnemy: { root_crawler: 120 } } };
  const v = charsView(save, data, treeDef);
  const w = v.find((x) => x.id === 'wren'), e = v.find((x) => x.id === 'elias');
  assert.equal(w.bond.lvl, 7);
  assert.deepEqual(w.perks.map((p) => [p.lvl, p.lit]), [[5, true], [10, false], [15, false], [20, false], [25, false]]);
  assert.equal(w.perks[0].name, "Pup's Nose");
  assert.equal(e.awake, false);
  assert.equal(e.keep.line, 'Candle Stub 2/5');
  assert.ok(/Root Crawler: 120\/400/.test(e.keep.hint), e.keep.hint);
  const evil = '<img src=x onerror=alert(1)>';
  const page = buildCharacters({ view: [{ ...w, name: evil }, e], onBack: () => {} });
  assert.ok(texts(page.root).includes(evil));
  assert.equal(find(page.root, (n) => n.tag === 'script').length, 0);
  assert.ok(texts(page.root).includes('Pelt Dash'));
  page.choose(1, false);
  assert.ok(texts(page.page).includes('Candle Stub 2/5') && !texts(page.page).includes('Elias'), 'a sleeping hero stays a mystery');
  const out = []; const p2 = buildCharacters({ view: v, onBack: () => out.push('back') });
  p2.onKey({ key: 'Escape', preventDefault() {} }); assert.deepEqual(out, ['back']);
  assert.deepEqual(charsView({ chars: JSON.parse('{"__proto__":{"woke":true},"wren":{"xp":"x","woke":"yes"}}'), stats: {} }, data, treeDef).map((x) => x.awake), [false, false]);
});
