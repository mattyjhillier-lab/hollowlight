// E9: the evolution pick moment. Plate text is safe and bounded, every evolution has a codex line + reserved cue, the recipe shows only on the
// first take, Calm motion is static, and the real pick path restarts the weapon's timers so the new verb fires at once (no sim change needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Sim } from '../src/sim/Sim.js';
import { data, ranksFor } from '../scripts/evo-same-ranks.mjs';

const R = (p) => new URL('../' + p, import.meta.url);

// ---- fake DOM ----
function mkNode(tag) {
  const n = { tag, children: [], attrs: {}, _cls: new Set(), _text: '', hidden: false, style: {},
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); }, addEventListener() {} };
  n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c), toggle: (c, on) => (on ? n._cls.add(c) : n._cls.delete(c)) };
  Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  Object.defineProperty(n, 'textContent', { get: () => n._text, set: (v) => { n._text = String(v); } });
  Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
  return n;
}
globalThis.document = { createElement: mkNode, createElementNS: (ns, t) => mkNode(t) };
const { plateModel, EvoPlate, PLATE_CLAMP, KICKER } = await import('../src/ui/evoplate.js');

const IDS = Object.keys(data.evolutions);

test('every evolution in evolutions.json has a codex line and a reserved sound cue', () => {
  assert.ok(IDS.length >= 14, 'at least the 14 committed evolutions (15 once Vesper Tide lands)');
  const cues = new Set();
  for (const id of IDS) {
    const e = data.evolutions[id];
    assert.ok(typeof e.codex === 'string' && e.codex.length >= 12 && e.codex.length <= PLATE_CLAMP.codex, `${id} codex length`);
    assert.ok(/[.!?]$/.test(e.codex), `${id} codex ends as a sentence`);
    assert.equal(e.cue, `evo_${id}`);
    cues.add(e.cue);
  }
  assert.equal(cues.size, IDS.length, 'cue names are unique');
  assert.equal(new Set(IDS.map((id) => data.evolutions[id].codex)).size, IDS.length, 'codex lines are unique');
});

test('locked codex lines are used verbatim', () => {
  const E = data.evolutions;
  assert.equal(E.howling_legion.codex, 'Nothing the pack takes stays fallen.');
  assert.equal(E.dire_alpha.codex, 'Seven hungers became one.');
  assert.equal(E.static_storm.codex, 'The air itself takes your side.');
  assert.equal(E.sanctum_halo.codex, 'Where the candles walk, the Hollow cannot stand.');
  assert.equal(E.thunder_judgment.codex, 'The sky keeps its own count.');
});

test('plate model: name + codex, recipe only on the first take, never for an unknown or hostile id', () => {
  for (const id of IDS) {
    const m = plateModel(id, data, false);
    assert.equal(m.name, data.evolutions[id].name);
    assert.equal(m.codex, data.evolutions[id].codex);
    assert.equal(m.recipe, '');
    assert.equal(m.cue, `evo_${id}`);
    const f = plateModel(id, data, true);
    assert.ok(/^Recipe: .+ \+ .+$/.test(f.recipe), `${id}: ${f.recipe}`);
  }
  for (const bad of ['', '__proto__', 'constructor', 'toString', null, undefined, 5, {}, '<img src=x>']) assert.equal(plateModel(bad, data, true), null);
});

test('plate model clamps long and hostile strings (text only, control chars dropped)', () => {
  const evil = { evolutions: { x: { name: '<img src=x onerror=alert(1)>'.repeat(5) + '\u0007\n', codex: 'a'.repeat(500), weapon: 'w', pair: ['a', 'b'], cue: 'evo_x; drop' } },
    weapons: { w: { stats: { a: { name: 'A'.repeat(100) }, b: { name: 'B'.repeat(100) } } } } };
  const m = plateModel('x', evil, true);
  assert.ok(m.name.length <= PLATE_CLAMP.name && !/[\u0000-\u001f]/.test(m.name));
  assert.ok(m.codex.length <= PLATE_CLAMP.codex);
  assert.ok(m.recipe.length <= PLATE_CLAMP.recipe);
  assert.equal(m.cue, '', 'a malformed cue is dropped');
  const root = mkNode('div');
  const p = new EvoPlate(root);
  p.show(m, false); // textContent only: the fake innerHTML throws
  assert.equal(p.title.textContent, m.name);
  clearTimeout(p.timer);
});

test('plate DOM: polite live region, pooled (one element), Calm motion class, hides + clears text', () => {
  const realST = globalThis.setTimeout, realCT = globalThis.clearTimeout;
  const queue = [];
  globalThis.setTimeout = (f, ms) => { queue.push({ f, ms }); return queue.length; };
  globalThis.clearTimeout = () => {};
  try {
    const host = mkNode('div');
    const p = new EvoPlate(host);
    assert.equal(host.children.length, 1);
    assert.equal(p.root.getAttribute('role'), 'status');
    assert.equal(p.root.getAttribute('aria-live'), 'polite');
    assert.equal(p.root.getAttribute('aria-atomic'), 'true');
    p.show(plateModel('howling_legion', data, true), false);
    p.show(plateModel('dire_alpha', data, false), true);
    assert.equal(host.children.length, 1, 'no new nodes per show');
    assert.equal(p.kicker.textContent, KICKER);
    assert.equal(p.title.textContent, 'The Alpha');
    assert.equal(p.whisper.textContent, 'Seven hungers became one.');
    assert.equal(p.recipe.hidden, true);
    assert.ok(p.root.classList.contains('on') && p.root.classList.contains('lg-calm'));
    p.show(plateModel('howling_legion', data, false), false);
    assert.ok(!p.root.classList.contains('lg-calm'));
    while (queue.length) queue.shift().f(); // run the hide timers
    assert.ok(!p.root.classList.contains('on'));
    assert.equal(p.title.textContent, '');
  } finally { globalThis.setTimeout = realST; globalThis.clearTimeout = realCT; }
});

test('plate CSS: Calm motion and OS reduced motion are static fades; no pointer events; no animation or blur', () => {
  const css = readFileSync(R('src/ui/evoplate.css'), 'utf8');
  assert.ok(/pointer-events:\s*none/.test(css));
  assert.ok(/\.u9-plate\.lg-calm\s*\{[^}]*transform:\s*translateX\(-50%\)/.test(css));
  assert.ok(/prefers-reduced-motion: reduce\)\s*\{[^}]*u9-plate/.test(css));
  assert.ok(/\.reduced-motion \.hud \.u9-plate/.test(css));
  assert.ok(!/animation|@keyframes|backdrop-filter|blur\(/.test(css));
});

test('scene beat: render-only, role colour from the weapon, Calm = no ring/flash/rim, rim on the weapon units only', () => {
  const src = readFileSync(R('src/scenes/RunScene.js'), 'utf8');
  const fn = src.slice(src.indexOf('  evolveMoment(evoId) {'), src.indexOf('  bossIntro() {'));
  assert.ok(/reducedMotion\(\)\) \{ this\.evoBeat = null; return; \}/.test(fn), 'Calm motion returns before any effect');
  assert.ok(fn.includes('wdef.color'));
  const i = src.indexOf('const eb = this.evoBeat');
  const rim = src.slice(i, i + 800);
  assert.ok(rim.includes('u.owner !== eb.w') && !rim.includes('sim.enemies'), 'rim is drawn on the weapon units only');
  assert.ok(!rim.includes('new ') && !rim.includes('.map(') && !rim.includes('.filter('), 'no per-frame allocation in the rim loop');
});

// ---- sim: the pick path restarts the evolved weapon so the verb fires at once ----
function pickEvolution(evoId, seed = 5) {
  const wid = data.evolutions[evoId].weapon;
  const sim = new Sim({ data, characterId: wid === 'holy_orbit' ? 'elias' : 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  const w = sim.debugGrant(wid, ranksFor(wid, evoId, 'pair'), null);
  for (let i = 0; i < 60 * 2; i++) sim.step(1 / 60); // let the base weapon run, so its timers are mid-cycle
  const p = sim.player;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 6.2832;
    sim.spawnEnemy('wolf', p.x + Math.cos(a) * (50 + (i % 3) * 25), p.y + Math.sin(a) * (50 + (i % 3) * 25));
  }
  const key = `e:${evoId}`;
  sim.offer = { cards: [], gold: [{ key, kind: 'evolution', weaponId: wid, evoId, title: 'x', desc: 'x' }] };
  sim.pending = 1; sim.state = 'levelup';
  assert.ok(sim.pickCard(key));
  return { sim, w };
}

test('picking an evolution restarts that weapon (rt cleared) and the new verb acts within ~0.8 s (measured 0.0-0.75 s), deterministically', () => {
  const hp = (sim) => sim.enemies.reduce((s, e) => s + e.hp, 0);
  for (const evoId of IDS) {
    const run = () => {
      const { sim, w } = pickEvolution(evoId);
      assert.equal(w.evo, evoId);
      assert.deepEqual(Object.keys(w.rt), [], `${evoId}: rt restarted`);
      const before = hp(sim), kills0 = sim.kills;
      let first = -1;
      for (let i = 0; i < 60; i++) { sim.step(1 / 60); if (first < 0 && (hp(sim) < before || sim.kills > kills0)) first = i; }
      return first;
    };
    const a = run(), b = run();
    assert.equal(a, b, `${evoId}: deterministic`);
    assert.ok(a >= 0 && a <= 50, `${evoId}: verb acted within ~0.8 s (Talon Mark has a 0.4 s tell; frame ${a})`);
  }
});
