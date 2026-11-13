// Q8 hostile-save sweep over everything added since S1: the restart notice, tour bits, loadout / starter notes, what-moved data, hint / intro bits,
// reaching the screens that read them. Nothing may throw, show markup, or trust a shape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data } from './helpers.mjs';
import { defaultSave, parseSave, serializeSave } from '../src/save/schema.js';
import { cleanHints } from '../src/ui/whispers.js';

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

const { TreeScreen } = await import('../src/ui/treescreen.js');
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (r, p) => { const o = []; walk(r, (n) => { if (p(n)) o.push(n); }); return o; };
const EVIL = '<img src=x onerror=alert(1)><script>alert(2)</script>';

const notice = (raw) => {
  const t = new TreeScreen({}, () => null);
  let cleared = 0;
  t.noticeEl = mkNode('div');
  t.api = { save: () => ({ notes: { treeResetNotice: raw } }), clearResetNotice: () => { cleared++; } };
  t.resetNotice();
  return { t, cleared, text: t.noticeEl.textContent, open: t.noticeEl._cls.has('open') };
};

test('restart notice: hostile numbers and shapes are clamped or ignored, never markup', () => {
  const ok = notice({ gold: 1234, shards: 5, glass: 2, nodes: 41 });
  assert.ok(ok.open && /41 of your lit lanterns/.test(ok.text) && /1,234 gold/.test(ok.text) && /5 shards/.test(ok.text) && /2 Dawnglass/.test(ok.text));
  for (const bad of [null, undefined, 5, 'x', [], EVIL, { nodes: 0 }, { nodes: -9, gold: 5 }, { nodes: 'x' }, { nodes: NaN }, { nodes: Infinity }]) {
    const r = notice(bad);
    assert.ok(!r.open, `no notice for ${JSON.stringify(bad)}`);
  }
  const huge = notice({ nodes: 1e30, gold: 1e30, shards: '9', glass: EVIL });
  assert.ok(huge.open && /1,000,000,000/.test(huge.text) && !/Dawnglass/.test(huge.text) && !huge.text.includes('<'), huge.text);
  assert.equal(find(huge.t.noticeEl, (n) => ['script', 'img', 'iframe', 'a'].includes(n.tag)).length, 0);
  const junk = notice({ nodes: 3, gold: { a: 1 }, __proto__: { nodes: 99 } });
  assert.ok(junk.open && /paid back in full: 0 gold/.test(junk.text));
  assert.equal(notice({ nodes: 0 }).cleared, 1, 'an empty notice is cleared from the save, not left behind');
});

test('hostile whole save: notes (starter, loadout, treeResetNotice), hints, intros and chars load without throwing and come out clean', () => {
  const base = JSON.parse(JSON.stringify(serializeSave(defaultSave())));
  const hostile = { ...base, hints: 2 ** 40 + (1 << 13), intros: -3, notes: { starter: { hero: '__proto__', weapon: EVIL }, loadout: { hero: 'wren', weapon: ['x'] }, treeResetNotice: { gold: EVIL, nodes: -1, shards: 1e99, glass: {} }, regrowth: EVIL, extra: { admin: true } }, chars: { __proto__: { woke: true }, wren: { woke: 'yes', xp: -1, keep: 99 }, '<b>': { woke: true } } };
  const r = parseSave(JSON.stringify(hostile));
  assert.ok(r.ok, 'a hostile save is cleaned, not rejected or thrown');
  const s = r.save;
  assert.equal(s.hints, cleanHints(hostile.hints));
  assert.ok(Number.isInteger(s.intros) && s.intros >= 0);
  assert.ok(!s.notes.starter || (Object.hasOwn(data.characters, s.notes.starter.hero) && Object.hasOwn(data.weapons, s.notes.starter.weapon)));
  assert.ok(!s.notes.loadout || (Object.hasOwn(data.characters, s.notes.loadout.hero) && Object.hasOwn(data.weapons, s.notes.loadout.weapon)));
  const n = s.notes.treeResetNotice;
  assert.ok(!n || (Number.isInteger(n.gold) && n.gold >= 0 && Number.isInteger(n.nodes) && n.nodes >= 0 && n.nodes <= 1e4 && n.shards <= 1e12));
  assert.ok(!('extra' in s.notes) && !('admin' in s.notes));
  assert.ok(!Object.keys(s.chars).some((k) => !Object.hasOwn(data.characters, k)));
  const again = parseSave(JSON.stringify(serializeSave(s)));
  assert.ok(again.ok); assert.equal(again.save.hints, s.hints);
});
