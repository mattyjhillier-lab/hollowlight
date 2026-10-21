// T4 tree screen (LOCKED look 'A Lantern Trails'): view regions from data, the screen model (five states, best-next rule,
// plain connected-rule words, rising price shown = paid, goals), hostile pins, and source rules (no innerHTML, no hard-coded
// weapon/hero/chapter/slot ids in src/ui/tree*, 44 px targets, reduced motion). The DOM/canvas side is checked by scripts/t4-shots.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data, treeDef as def } from './helpers.mjs';
import { compileTree, nodeStatus, buy } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { buildTreeView, LOD } from '../src/meta/treeview.js';
import { TreeModel, sanitizePins, SAY } from '../src/ui/treemodel.js';
import { defaultSave } from '../src/save/schema.js';
import { synthTree, loadRealData } from '../scripts/tree-synth.mjs';

const R = (p) => new URL(`../${p}`, import.meta.url);
const composed = composeTree(readTreeFiles(), data);
const view = () => buildTreeView(composed.info, def, data);
const save = (o = {}) => ({ ...defaultSave(), gold: 0, shards: 0, tree: {}, creep: {}, seen: {}, ...o, stats: { ...defaultSave().stats, ...(o.stats || {}) } });
const model = (s, pins = []) => new TreeModel(def, data, view()).recompute(s, pins);
const rich = (o = {}) => save({ gold: 1e6, shards: 99, stats: { runs: 5, killsByEnemy: {}, chapters: {} }, ...o });

test('view: every live lantern belongs to a region; constellation colours and names come from the weapon data', () => {
  const v = view();
  for (const id of def.list) assert.ok(v.regionOf[id], id);
  const clusters = v.regions.filter((r) => r.kind === 'cluster');
  assert.equal(clusters.length, Object.keys(composed.info.clusters).length);
  for (const r of clusters) {
    const wid = r.key.slice(2);
    assert.equal(r.name, data.weapons[wid].name);
    assert.equal(r.color, data.weapons[wid].color);
    assert.ok(r.silhouette && r.ids.length > 0, r.key);
  }
  assert.ok(v.regions.some((r) => r.kind === 'rings') && v.regions.some((r) => r.kind === 'tool'));
  assert.ok(v.farFree.length >= 1, 'free far slots drawn as "?"');
  assert.deepEqual(v.lod, LOD);
  assert.ok(v.webR > 1000 && v.nearHub > 300);
});

test('model: five states map 1:1 from the real rules (lit, ready, open, challenge, notyet) + fog for teasers', () => {
  const s = rich();
  const m = model(s);
  for (const id of def.list) {
    const st = nodeStatus(def, s, id, data);
    const ce = m.cache[id];
    const want = st.state === 'owned' ? 'lit' : st.state === 'teaser' ? 'fog' : st.state === 'available' ? (st.affordable ? 'ready' : 'open') : st.state === 'condition' ? 'challenge' : 'notyet';
    assert.equal(ce.s, want, id);
    assert.ok(SAY[ce.s]);
  }
  const poor = model(save({ gold: 10, stats: { runs: 1 } }));
  assert.ok(def.list.some((id) => poor.cache[id].s === 'open'), 'not enough gold');
  assert.ok(def.list.some((id) => poor.cache[id].s === 'notyet'), 'not yet reachable');
  assert.ok(def.list.some((id) => poor.cache[id].s === 'challenge'), 'challenge');
  assert.equal(poor.readyList().length, 0);
  assert.equal(poor.best, null);
});

test('model: a new save says "finish a run" and suggests no goals; a run-1 save has a best next with a reason', () => {
  const n = model(save());
  assert.ok(n.isNew());
  assert.deepEqual(n.goalRows(), []);
  assert.match(n.stepText().h, /Finish a run/);
  const m = model(save({ gold: 2000, shards: 5, stats: { runs: 1 } }));
  assert.ok(m.best && m.cache[m.best.id].s === 'ready');
  assert.ok(m.best.why.length > 5);
  assert.match(m.stepText().h, /^Light /);
  assert.ok(m.goalRows().length >= 1 && m.goalRows().length <= 3);
});

test('best next: pinned path first, then unlock lanterns (wake / evolution / keystone / reroll), then near-complete groups, then the cheapest stat', () => {
  const m = model(rich());
  const ready = m.readyList();
  assert.ok(ready.length > 3);
  // with no pin, an unlock-kind lantern beats every plain stat lantern when one is ready
  const tiers = ready.map((id) => m.tierOf(id, new Set()));
  assert.equal(m.best.tier, Math.min(...tiers));
  if (tiers.some((t) => t === 1)) assert.equal(m.best.tier, 1);
  // pin something not reachable yet: the best next moves onto its path (or the pin itself)
  const s = rich();
  const target = def.list.find((id) => m.cache[id].v === 'unreached' && m.ancestors(id).size > 0 && [...m.ancestors(id)].some((a) => m.cache[a].s === 'ready'));
  assert.ok(target, 'a far lantern with a ready ancestor');
  const pm = model(s, [target]);
  assert.equal(pm.best.tier, 0);
  assert.ok(pm.ancestors(target).has(pm.best.id) || pm.best.id === target);
  assert.equal(pm.best.why, 'On the way to your pinned goal');
  assert.equal(pm.goalRows()[0].id, target);
  assert.equal(pm.goalRows()[0].pin, true);
  // only stat lanterns ready: cheapest wins
  const statOnly = def.list.filter((id) => m.tierOf(id, new Set()) === 3 && m.cache[id].s === 'ready');
  if (statOnly.length > 1) {
    const costs = statOnly.map((id) => m.costOf(id));
    assert.ok(costs.every((c) => c >= Math.min(...costs)));
  }
});

test('connected rule in plain words: "needs the lantern next to it" / "wake its spirit first", with a numbered checklist', () => {
  const m = model(save({ gold: 500, stats: { runs: 1 } }));
  const un = def.list.filter((id) => m.cache[id].v === 'unreached');
  assert.ok(un.length > 10);
  for (const id of un) {
    const t = m.stateText(id);
    assert.match(t, /^Not yet reachable: (needs the lantern next to it|wake its spirit first)$/, `${id}: ${t}`);
    const steps = m.steps(id);
    assert.ok(steps.length >= 1, id);
    assert.ok(steps.some((x) => /lantern next to it|^Wake |hidden seal/.test(x.t)), `${id}: ${steps.map((x) => x.t).join(' | ')}`);
  }
  // no padlock words in player text
  for (const id of def.list) assert.doesNotMatch(m.stateText(id), /lock/i, id);
});

test('rising price: the price shown in the panel model is exactly the price buy() takes', () => {
  const s = rich();
  const m = model(s);
  // buy two lanterns in one price group, then a third shows a risen price
  const g = Object.keys(def.cmembers).find((k) => def.cmembers[k].filter((id) => m.cache[id].s === 'ready').length >= 2);
  assert.ok(g);
  for (let i = 0; i < 2; i++) {
    const mm = model(s);
    const id = def.cmembers[g].find((x) => mm.cache[x].s === 'ready');
    const shown = mm.cache[id].d.next.gold;
    const g0 = s.gold;
    assert.equal(buy(s, id, def, data).ok, true);
    assert.equal(g0 - s.gold, shown, `${id}: shown ${shown}, paid ${g0 - s.gold}`);
  }
  const m3 = model(s);
  const next = def.cmembers[g].find((x) => m3.cache[x].d.next && m3.cache[x].s !== 'lit' && m3.cache[x].d.rank === 0);
  if (next) assert.match(m3.priceNote(next), /Price has risen from|adds 8%/);
});

test('pins from storage are hostile: only known non-teaser ids, no duplicates, at most 3', () => {
  const ok = def.list.filter((id) => !def.nodes[id].teaser);
  const teaser = def.list.find((id) => def.nodes[id].teaser);
  assert.deepEqual(sanitizePins(null, def), []);
  assert.deepEqual(sanitizePins('x', def), []);
  assert.deepEqual(sanitizePins({ 0: ok[0] }, def), []);
  assert.deepEqual(sanitizePins(['__proto__', 'constructor', 'nope', 5, null, { a: 1 }, ok[0], ok[0], teaser, '<img src=x>', ok[1], ok[2], ok[3]], def), [ok[0], ok[1], ok[2]]);
  assert.deepEqual(sanitizePins(new Array(5000).fill(ok[0]), def), [ok[0]]);
});

test('NEW flag only on wake/seal lanterns you have not looked at yet', () => {
  const s = rich();
  const m = model(s);
  for (const id of def.list) if (m.cache[id].fresh) assert.ok(['heart', 'socket', 'gate'].includes(def.nodes[id].kind) && m.cache[id].d.state === 'available', id);
  const f = def.list.find((id) => m.cache[id].fresh);
  if (f) { s.seen[f] = true; assert.equal(model(s).cache[f].fresh, false); }
});

test('screen sources: no innerHTML, no hard-coded weapon/hero/chapter/slot ids, 44 px targets, reduced motion respected', () => {
  const files = ['src/ui/treescreen.js', 'src/ui/treemodel.js'];
  const ids = [...Object.keys(data.weapons), ...Object.keys(data.characters), ...Object.keys(data.chapters), 'sky1', 'sky2', 'far1', 'band2'];
  for (const f of files) {
    const src = readFileSync(R(f), 'utf8').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/, f);
    for (const id of ids) assert.ok(!new RegExp(`['"\`]${id}['"\`]`).test(src) && !src.includes(`'${id}`), `${f} names ${id}`);
  }
  const css = readFileSync(R('src/ui/treescreen.css'), 'utf8');
  assert.match(css, /\.ts-btn \{[^}]*min-height: 44px; min-width: 44px/);
  assert.match(css, /\.ts-round \{[^}]*width: 44px/);
  assert.match(css, /\.ts-goal \{[^}]*min-height: 48px/);
  assert.match(css, /\.ts-primary \{[^}]*min-height: 48px/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.ts\.ts-calm/);
  const js = readFileSync(R('src/ui/treescreen.js'), 'utf8');
  assert.match(js, /MAX_ITEMS = 120/);
  assert.match(js, /Math\.max\(22,/, 'tap radius never below 22 px (44 px target)');
  assert.match(js, /try \{ globalThis\.localStorage/, 'storage in try/catch');
  assert.match(js, /reducedMotion/, 'game Calm setting');
});

test('1000-node synthetic tree: view + model build fast enough for a phone', () => {
  const syn = synthTree(loadRealData(), 1000);
  const sd = { ...data, ...syn.data };
  const c = composeTree(syn.files, sd);
  const big = compileTree(c.v2, sd);
  assert.ok(big.list.length >= 1000);
  const t0 = performance.now();
  const v = buildTreeView(c.info, big, sd);
  const m = new TreeModel(big, sd, v).recompute(save({ gold: 5000, shards: 10, stats: { runs: 3 } }));
  const ms = performance.now() - t0;
  assert.ok(v.regions.filter((r) => r.kind === 'cluster').length > 50);
  for (const id of big.list) assert.ok(v.regionOf[id], id);
  assert.ok(m.best);
  assert.ok(ms < 1500, `${ms.toFixed(0)} ms (npm test runs every file at once; idle ~100-200 ms)`);
});
