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
const { buildTitle, buildHeroSelect } = await import('../src/ui/title.js');
const C = await import('../src/ui/titlecopy.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const texts = (r) => { const o = []; walk(r, (n) => { if (n._text) o.push(n._text); }); return o.join(' | '); };
const heroes = () => Object.entries(data.characters).map(([id, c]) => ({ ...C.heroView(id, c, data.weapons[c.weapon].name), weaponId: c.weapon }));

test('title copy: wordmark name, Begin/Continue + whispers, Skill Tree, Settings, version', () => {
  const t = buildTitle({ version: '9.9.9' });
  const s = texts(t.root);
  for (const w of ['Chapter 1', 'Spirits of the Dusk', 'Begin', 'Pick a hero and walk the Hollow', 'Skill Tree', 'Settings', 'Sound, motion, saves', 'v9.9.9']) assert.ok(s.includes(w), w);
  assert.equal(find(t.root, (n) => n.attrs.role === 'img' && n.attrs['aria-label'] === 'Hollowlight').length, 1);
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
  assert.deepEqual(v.pips, { health: 1, speed: 1 });
  assert.equal(C.splitName(42).name, 'Hero');
});

test('hero select: Wren and Elias cards, stats as pips with names, ability line, radio semantics', () => {
  const hs = buildHeroSelect({ heroes: heroes(), selected: 'wren' });
  const s = texts(hs.root);
  for (const w of ['Who carries the lantern?', 'Wren', 'the Orphan', 'Elias', 'the Priest', 'Ghost Wolves', 'Holy Orbit', 'Rally the Pack', 'Candle Wheel', 'Walk with Wren', 'Back', 'Chosen', 'Ready', 'Light-footed']) assert.ok(s.includes(w), w);
  assert.equal(hs.group.attrs.role, 'radiogroup');
  assert.deepEqual(hs.cards.map((c) => c.el.attrs['aria-checked']), ['true', 'false']);
  assert.deepEqual(hs.cards.map((c) => c.el.attrs.tabindex), ['0', '-1']);
  assert.equal(hs.cards[0].el.attrs['aria-label'], 'Wren, the Orphan');
  assert.equal(find(hs.root, (n) => /^Health \d of 5$/.test(n.attrs['aria-label'] || '')).length, 2);
  assert.deepEqual(C.heroPips(data.characters.wren), { health: 2, speed: 5 });
  assert.deepEqual(C.heroPips(data.characters.elias), { health: 5, speed: 2 });
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
