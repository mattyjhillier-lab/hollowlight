// R2: code-made medallions of the Lantern Web (src/gfx/medallions.js): allow-listed art ids, hostile ids fall back, a lazy atlas that never re-bakes per frame,
// veiled seals, no markup/paths built from tree strings. Render-only: ids, prices, positions untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { buildTreeView } from '../src/meta/treeview.js';
import { MANIFEST, MEDALLION_IDS, VARIANTS, COIN_PX, resolveMedallion, emblemFor, safeTint, mix, drawCoinFace, MedallionAtlas } from '../src/gfx/medallions.js';

const fakeCtx = (log = []) => new Proxy({}, { get: (o, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : (...a) => { log.push(k); }), set: () => true });
const fakeMake = () => { const made = []; const make = (w, h) => { const calls = []; const cv = { width: w, height: h, calls, getContext: () => fakeCtx(calls) }; made.push(cv); return cv; }; return { made, make }; };
const view = buildTreeView(composeTree(readTreeFiles(), data).info, def, data);

test('every manifest picture draws (all states) without throwing, and draws something', () => {
  assert.ok(MEDALLION_IDS.length >= 20);
  for (const id of MEDALLION_IDS) for (const v of VARIANTS) {
    const log = []; drawCoinFace(fakeCtx(log), id, '#9fd8ff', v);
    assert.ok(log.length > 8, `${id}/${v} drew ${log.length} calls`);
  }
  assert.equal(COIN_PX, 160);
});

test('hostile / unknown art ids fall back to the tier emblem; nothing is built from them', () => {
  const bad = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', '../../etc/passwd', 'https://evil.example/x.png', '<img src=x onerror=alert(1)>', 'javascript:alert(1)', 'wolf ', 'WOLF', '', 'a'.repeat(5000), 12, null, undefined, {}, [], ['wolf'], true];
  for (const b of bad) {
    assert.equal(resolveMedallion(b), 'key', String(b).slice(0, 30));
    assert.equal(resolveMedallion(b, 'evolution'), 'evolution');
    assert.equal(emblemFor({ kind: 'heart' }, false, b), 'key', 'a heart with a hostile art id wears the tier emblem');
  }
  assert.equal(resolveMedallion('wolf'), 'wolf');
  assert.equal(resolveMedallion('nope', '__proto__'), 'key', 'a hostile fallback is itself replaced');
  for (const t of ['red', '#12', '#gggggg', 'url(x)', '#ffffff; background:url(x)', 7, null, {}]) assert.equal(safeTint(t), '#ffd9a0', String(t));
  assert.equal(safeTint('#9FD8FF'), '#9fd8ff');
  assert.match(mix('#000000', '#ffffff', 0.5), /^#[0-9a-f]{6}$/);
  const hostileDraw = fakeCtx(); drawCoinFace(hostileDraw, '__proto__', 'url(x)', 'evil'); // unknown id draws the fallback picture, never throws
  const src = readFileSync(new URL('../src/gfx/medallions.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|document\.|new Image|\.src\s*=|fetch\(|eval\(|new Function|import\(/, 'no markup, no image loading, no network in the medallion code');
});

test('which picture a node wears: hearts their spirit, veiled seals a question mark only, gates a moon, keys a gem, fog a dim moon', () => {
  const m = new Map(def.list.map((id) => [id, def.nodes[id]]));
  for (const id of def.list) {
    const n = m.get(id);
    if (n.kind === 'socket') { assert.equal(emblemFor(n, true, 'wolf'), 'veil', id); assert.equal(emblemFor(n, false, 'wolf'), 'evolution', id); }
    if (n.kind === 'gate') { const t = n.effects.find((e) => e.unlock === 'tier').tier; assert.equal(emblemFor(n, false, 'x'), t === 'hard' ? 'moon_deep' : t === 'expert' ? 'moon_long' : 'moon_dusk', id); }
    if (n.kind === 'key') assert.equal(emblemFor(n, false, 'hub'), 'key', id);
    if (n.kind === 'teaser') assert.equal(emblemFor(n, true, null), 'fog', id);
  }
  const clusters = view.regions.filter((r) => r.kind === 'cluster');
  assert.ok(clusters.length >= 5);
  for (const r of clusters) { assert.ok(Object.hasOwn(MANIFEST, r.art), `${r.key} art ${r.art}`); assert.equal(emblemFor(def.nodes[r.heart], false, r.art), r.art); }
  assert.equal(new Set(clusters.map((r) => r.art)).size, clusters.length, 'every spirit has its own picture');
  for (const r of view.regions.filter((q) => q.kind === 'tool')) assert.ok(Object.hasOwn(MANIFEST, r.art), `${r.key} art ${r.art}`);
});

test('atlas: each picture is baked once; at most 4 bakes per frame; bounded; never re-baked per frame', () => {
  const f = fakeMake();
  const at = new MedallionAtlas(f.make);
  const keys = [['wolf', '#9fd8ff', 'lit'], ['raven', '#b79cff', 'lit'], ['bolt', '#7ff0ff', 'open'], ['chain', '#b8f2ff', 'dim'], ['orbit', '#e8e0ff', 'lit'], ['hub', '#ffd27a', 'lit'], ['key', '#ffd9a0', 'dim']];
  at.beginFrame();
  const got = keys.map((k) => at.get(...k));
  assert.equal(got.filter(Boolean).length, 4, 'the 5th and later wait for the next frame');
  assert.equal(at.pending, true);
  assert.equal(at.bakes, 4);
  at.beginFrame();
  keys.map((k) => at.get(...k));
  assert.equal(at.bakes, 7);
  at.beginFrame();
  const baked = f.made.map((m) => m.calls.length);
  for (let i = 0; i < 300; i++) { at.beginFrame(); for (const k of keys) assert.ok(at.get(...k)); assert.equal(at.pending, false); } // 300 frames of the same picture set: no new canvas, no new bake
  assert.equal(at.bakes, 7);
  assert.equal(f.made.length, 7);
  assert.deepEqual(f.made.map((m) => m.calls.length), baked, 'the baked canvases were not drawn on again');
  // hostile keys share the fallback entry instead of growing the atlas; the cap holds
  const small = new MedallionAtlas(f.make, 99, 5);
  for (let i = 0; i < 200; i++) small.get(`junk${i}`, `#${(i % 4096).toString(16).padStart(6, '0')}`, 'lit');
  assert.ok(small.size <= 5);
  const a2 = new MedallionAtlas(f.make, 99, 160);
  for (const h of ['__proto__', 'x', 12, null]) a2.get(h, 'bad', 'worse');
  assert.equal(a2.size, 1, 'every hostile id + tint + state maps to one fallback sprite');
});

test('screen: medallions are drawn through the atlas (no per-frame bake), veiled seals get no label, no art path from tree strings', () => {
  const js = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  assert.match(js, /this\.atlas\.beginFrame\(\)/);
  assert.match(js, /new MedallionAtlas\(/);
  assert.match(js, /if \(ce\.d\.masked \|\| L\.s === 'fog'\) return;/, 'veiled seals and fog carry no name, cost or recipe');
  assert.match(js, /if \(d\.masked\) return \{ line: '', pill: '' \};/);
  assert.doesNotMatch(js.replace(/\/\/.*$/gm, ''), /new Image|\.src =|innerHTML/);
  // the first-open camera is the overview: every medallion round the hearth is on screen
  assert.match(js, /\(y1 - y0\) \/ 2500/);
});
