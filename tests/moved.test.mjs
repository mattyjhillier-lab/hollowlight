// Q5b 'what moved' (src/meta/moved.js + src/ui/nextlights.js): results fixtures (win, loss, no change), Calm motion, read-only pause, hostile run records.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { defaultSave } from '../src/save/schema.js';

function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', listeners: {}, hidden: false, style: { setProperty() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); }, replaceChildren(...cs) { this.children = cs; this._text = ''; },
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); } };
  n.classList = { add: (...c) => c.forEach((x) => n._cls.add(x)), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text + n.children.map((c) => c.textContent).join(''), set: (v) => { n._text = String(v); n.children = []; } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => Object.assign(mkNode(t), { ns }), activeElement: null };

const { snapshot, whatMoved, nearestOf, cleanMoved, movedIds, MAX_TILES, MAX_BARS, MAX_NEAR } = await import('../src/meta/moved.js');
const { buildNextLights } = await import('../src/ui/nextlights.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const byCls = (r, c) => find(r, (n) => n._cls.has(c));
const R = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const save = (o = {}) => ({ ...defaultSave(), gold: 0, shards: 0, tree: {}, creep: {}, seen: {}, ...o, stats: { ...defaultSave().stats, runs: 3, ...(o.stats || {}) } });
const run = (o = {}) => ({ outcome: 'defeat', kills: 140, gold: 420, ...o });

test('fixture win: gold lifts lanterns to affordable, kills move a bar, the run chips read the record', () => {
  const b = save({ gold: 0, stats: { killsByEnemy: { crow: 10 } } });
  const a = save({ gold: 6000, stats: { killsByEnemy: { crow: 47 }, kills: 140 } });
  const m = whatMoved(snapshot(b), snapshot(a), a, run({ outcome: 'victory' }), def, data);
  assert.ok(m.tiles.length >= 1 && m.tiles.length <= MAX_TILES, 'something became affordable');
  assert.ok(m.tiles.every((t) => ['lit', 'unlocked', 'afford'].includes(t.kind) && def.nodes[t.id] && t.name));
  assert.ok(m.bars.length >= 1 && m.bars.length <= MAX_BARS);
  const bar = m.bars[0];
  assert.ok(bar.frac1 > bar.frac0 && bar.frac1 <= 1 && /\(\+\d+\)/.test(bar.text), bar.text);
  assert.deepEqual(m.chips.map((c) => c.t), ['140 slain', '+420 gold', 'Dawn reached']);
  assert.ok(m.nearest.length <= MAX_NEAR && m.nearest.every((n) => !m.bars.some((x) => x.id === n.id)), 'the nearest list skips what the bars already show');
});

test('fixture loss: kills still move bars, nothing affordable without gold; fixture no change: only the nearest list', () => {
  const b = save({ stats: { killsByEnemy: { crow: 5 } } });
  const a = save({ stats: { killsByEnemy: { crow: 25 } } });
  const m = whatMoved(snapshot(b), snapshot(a), a, run(), def, data);
  assert.equal(m.tiles.length, 0); assert.ok(m.bars.length >= 1); assert.ok(!m.chips.some((c) => c.t === 'Dawn reached'));
  const none = whatMoved(snapshot(a), snapshot(a), a, run({ kills: 0, gold: 0 }), def, data);
  assert.deepEqual([none.tiles, none.bars, none.chips], [[], [], []]);
  assert.ok(none.nearest.length <= MAX_NEAR);
  const ui = buildNextLights({ moved: none });
  assert.ok(byCls(ui.root, 'nl__none').length === 1 || byCls(ui.root, 'nl__near').length === 1, 'a calm line or the nearest list, never an empty box');
  assert.equal(ui.count, 0);
});

test('component: tiles pulse and bars sweep; Calm: no pulse class, bars at the final width, play() does nothing', () => {
  const m = { chips: [{ t: '9 slain' }], tiles: [{ id: 'a', name: 'Alpha', kind: 'afford', cost: 100 }], bars: [{ id: 'b', name: 'Bite', text: 'x', frac0: 0.2, frac1: 0.6 }], nearest: [{ id: 'c', name: 'Near', text: 't', frac: 0.3 }] };
  const live = buildNextLights({ moved: m });
  assert.equal(byCls(live.root, 'is-pulse').length, 1);
  assert.equal(find(live.root, (n) => n.tag === 'i' && n.style && n.style.width === '20%').length, 1, 'bar starts at the before width');
  assert.deepEqual(live.ids, ['a', 'b']);
  const calm = buildNextLights({ moved: m, calm: true });
  assert.equal(byCls(calm.root, 'is-pulse').length, 0);
  assert.equal(find(calm.root, (n) => n.tag === 'i' && n.style && n.style.width === '60%').length, 1);
  calm.play();
  assert.ok(R('src/ui/nextlights.css').includes('.nl.is-calm .nl__track > i { transition: none; }'));
});

test('pause: read-only (nearest only, no tiles / bars / chips, nothing clickable)', () => {
  const m = { chips: [{ t: 'x' }], tiles: [{ id: 'a', name: 'A', kind: 'afford' }], bars: [{ id: 'b', name: 'B', text: 't', frac0: 0, frac1: 1 }], nearest: [{ id: 'c', name: 'Near', text: 't', frac: 0.5 }] };
  const ui = buildNextLights({ moved: m, readOnly: true });
  assert.equal(byCls(ui.root, 'nl__tiles').length + byCls(ui.root, 'nl__bars').length + byCls(ui.root, 'nl__chips').length, 0);
  assert.equal(byCls(ui.root, 'nl__near').length, 1);
  assert.equal(find(ui.root, (n) => n.tag === 'button' || n.tag === 'a').length, 0);
  const near = nearestOf(save(), def, data);
  assert.ok(near.length <= MAX_NEAR && near.every((n) => def.nodes[n.id]));
});

test('hostile inputs: run records, bank.moved and strings never become markup or break the lists', () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const a = save({ gold: 9999 });
  for (const bad of [null, undefined, 5, 'x', [], { kills: -4, gold: NaN }, { kills: 1e30, gold: Infinity }, { kills: '9', gold: {} }, { outcome: evil, kills: 2 ** 60 }]) {
    const m = whatMoved(snapshot(save()), snapshot(a), a, bad, def, data);
    assert.ok(m.chips.every((c) => /^[0-9,]+ slain$|^\+[0-9,]+ gold$|^Dawn reached$/.test(c.t)), JSON.stringify(m.chips));
  }
  assert.deepEqual(whatMoved(null, null, null, null, def, data), { chips: [], tiles: [], bars: [], nearest: [] });
  const c = cleanMoved({ chips: [{ t: evil.repeat(5) }, { t: 5 }, null], tiles: [{ id: '__proto__', name: 'x' }, { id: 'ok_id', name: evil, kind: 'nope', cost: -5 }, { id: 'A B', name: 'x' }], bars: [{ id: 'b1', name: 'n', text: 't', frac0: 7, frac1: -1 }, 'junk'], nearest: Array(20).fill({ id: 'n1', name: 'x', text: 'y', frac: 2 }), extra: { admin: true } });
  assert.equal(c.chips.length, 1); assert.ok(c.chips[0].t.length <= 40);
  assert.deepEqual(c.tiles.map((t) => [t.id, t.kind, t.cost]), [['ok_id', 'afford', 0]]);
  assert.deepEqual(c.bars[0], { id: 'b1', name: 'n', text: 't', frac0: 1, frac1: 1 });
  assert.equal(c.nearest.length, MAX_NEAR); assert.ok(!('extra' in c));
  for (const junk of [null, 5, 'x', [], { tiles: 'x', bars: 3 }]) assert.deepEqual(cleanMoved(junk), { chips: [], tiles: [], bars: [], nearest: [] });
  const ui = buildNextLights({ moved: { tiles: [{ id: 'ok', name: evil, kind: 'lit' }], bars: [{ id: 'b', name: evil, text: evil, frac0: 0, frac1: 1 }], nearest: [{ id: 'n', name: evil, text: evil, frac: 1 }] } });
  assert.equal(find(ui.root, (n) => ['script', 'img', 'iframe', 'style', 'a'].includes(n.tag)).length, 0);
  assert.ok(ui.root.textContent.includes('<img'), 'shown as plain text');
  assert.equal(movedIds(null).length, 0);
  const sources = ['src/meta/moved.js', 'src/ui/nextlights.js'].map(R).join(String.fromCharCode(10)).replace(/\/\/.*$/gm, '');
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write|eval\(|new Function/.test(sources));
});

test('wiring: one goal list, snapshot before the bank, Continue passes the pulse ids, the tree pulses once and respects Calm', () => {
  const app = R('src/app.js'), ui = R('src/ui/ui.js'), rc = R('src/ui/resultscopy.js'), tree = R('src/ui/treescreen.js');
  assert.ok(app.indexOf('const beforeRun = snapshot(this.save.data)') < app.indexOf('const b = this.save.bankRun('), 'the snapshot is taken before the run is banked');
  assert.ok(app.includes('b.moved = whatMoved(beforeRun'));
  const endAt = ui.indexOf('this.endView = buildResults('); assert.ok(ui.slice(endAt, endAt + 700).includes('h.openTree(null, null, { pulse: movedIds(cleanMoved(view.moved)) })'), 'the results Tree button, not the title one');
  assert.ok(!rc.includes("kind: 'closest'") && !rc.includes("kind: 'new'"), 'the separate goal strip is gone');
  assert.ok(tree.includes('pulseStart(api.pulseIds)') && tree.includes('k = this.reduced ? 0.5'), 'Calm: a steady ring');
  assert.ok(app.includes("api.pulseIds = opts.pulse.filter((id) => typeof id === 'string' && Object.hasOwn(treeDef.nodes, id)).slice(0, 12)"));
  assert.ok(ui.includes('buildNextLights({ moved: m, readOnly: true })'), 'pause uses the same component, read-only');
});
