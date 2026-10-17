import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PushField, pushBudget, springStep, HERO_R, SPRING_MAX, AMP_TUFT, AMP_BODY, AMP_CROWN, ENEMY_CORE, SPRING_K, SPRING_C } from '../src/gfx/pushfield.js';
import { SwayField, AMP, WOBBLE } from '../src/gfx/swayfield.js';
import { PropField, START_CLEAR } from '../src/gfx/propfield.js';
import { KINDS } from '../src/gfx/propatlas.js';
import { CAPS } from '../src/gfx/quality.js';
import { zoneB } from '../src/world/zones.js';
import { REDUCED_SCALE } from '../src/gfx/wind.js';

const W = 4000;
const zone = (x, y) => zoneB(x, y, W);
const alive = { sample: () => 1, sampleClean: () => 1 };
const dead = { sample: () => 0, sampleClean: () => 0 };
const VIEW = { x0: 1000, y0: 500, x1: 1620, y1: 850 };
const view = { x0: 1000, y0: 500, x1: 1640, y1: 860 };
const SV = { x0: 1000, y0: 1000, x1: 1700, y1: 1360 };

// a hero moving right at v units/s; feeds the push field at 20 Hz
function walker(budget, v = 96, enemies = [], reduced = false) {
  const pf = new PushField(); pf.setBudget(budget);
  const hero = { x: 1100, y: 700 };
  const tick = (n = 1) => { for (let i = 0; i < n; i++) { hero.x += v * 0.05; pf.update(0.05, hero, enemies, enemies.length, view, reduced); } };
  return { pf, hero, tick };
}

test('spring: bounded, settles in ~0.5 s with one small overshoot, no NaN, stable for any dt', () => {
  const st = { pa: 0, pv: 0 };
  let peak = 0;
  for (let i = 0; i < 100; i++) { springStep(st, 0.3, 0.02); peak = Math.max(peak, st.pa); }
  assert.ok(peak > 0.3 && peak < 0.3 * 1.25, 'small overshoot: ' + peak);
  assert.ok(Math.abs(st.pa - 0.3) < 1e-3, 'settles');
  let cross = 0; let prev = st.pa;
  for (let i = 0; i < 200; i++) { springStep(st, 0, 0.02); if (prev > 0.002 && st.pa < -0.002) cross++; prev = st.pa; }
  assert.ok(cross <= 1, 'one wobble at most');
  assert.equal(st.pa, 0); assert.equal(st.pv, 0);
  const rel = { pa: 0.3, pv: 0 }; let t = 0;
  while (Math.abs(rel.pa) > 0.3 * 0.05 && t < 3) { springStep(rel, 0, 0.02); t += 0.02; }
  assert.ok(t > 0.12 && t < 0.7, 'visible spring-back time: ' + t);
  for (const dt of [0, -1, NaN, 1e9, 0.5, 5]) { const s = { pa: 0.2, pv: 1 }; springStep(s, 99, dt); assert.ok(Number.isFinite(s.pa) && Math.abs(s.pa) <= SPRING_MAX && Number.isFinite(s.pv), 'dt ' + dt); }
  const s2 = { pa: NaN, pv: NaN }; springStep(s2, NaN, 0.05); assert.ok(Number.isFinite(s2.pa) && Number.isFinite(s2.pv));
  assert.ok(Math.sqrt(SPRING_K) * 0.08 < 2 && SPRING_C > 0, 'stable step');
});

test('hero: a passing hero leans foliage away along x, a standing hero pushes nothing, strength scales with speed', () => {
  const run = (v) => { const w = walker(1, v); w.tick(12); return w; };
  const still = run(0);
  assert.equal(still.pf.targetAt(still.hero.x + 100, still.hero.y), 0, 'standing still pushes nothing');
  const slow = run(30); const fast = run(96);
  const probe = (w, dx) => w.pf.targetAt(w.hero.x + dx, w.hero.y + 10);
  assert.ok(probe(fast, 100) > 0 && probe(fast, -100) < 0, 'away from the hero on both sides');
  assert.ok(probe(fast, 100) > probe(slow, 100) && probe(slow, 100) > 0, 'faster = stronger');
  assert.equal(probe(fast, HERO_R + 5), 0, 'nothing beyond the reach');
  assert.ok(probe(fast, 100) >= probe(fast, 125), 'falls off with distance');
  assert.ok(Math.abs(probe(fast, 100)) > 0.4, 'the clear-zone fade ring still bends: ' + probe(fast, 100));
  assert.ok(HERO_R > 112, 'reach exceeds the fade ring');
  const w = walker(1, 0); w.tick(2); w.hero.x += 900; w.pf.update(0.05, w.hero, [], 0, view); w.pf.update(0.05, w.hero, [], 0, view);
  assert.ok(w.pf.spd < 40, 'teleport ignored: ' + w.pf.spd);
});

test('enemies: capped per tier and phone, spread (stable hash pick), strength grows with size and speed, never the hero core', () => {
  const en = [];
  for (let i = 0; i < 350; i++) en.push({ id: i + 1, x: 1020 + (i * 53) % 600, y: 520 + (i * 31) % 330, r: 6, speed: 46 });
  for (const tier of ['high', 'med', 'low']) {
    for (const phone of [false, true]) for (const reduced of [false, true]) {
      const b = pushBudget(CAPS[tier].ambient.push, { phone, reduced });
      const w = walker(b, 96, en, reduced); w.tick(6);
      assert.ok(w.pf.n <= b, `${tier} phone=${phone} reduced=${reduced}: ${w.pf.n} <= ${b}`);
      if (tier === 'low') assert.equal(w.pf.n, 0);
      else if (reduced) assert.equal(w.pf.n, 1, 'reduced = hero only');
      else assert.equal(w.pf.n, b, 'fills the cap with a swarm in view');
    }
  }
  assert.equal(CAPS.high.ambient.push, 9); assert.equal(CAPS.med.ambient.push, 5); assert.equal(CAPS.low.ambient.push, 0);
  assert.ok(pushBudget(9, { phone: true }) < 9 && pushBudget(9, { phone: true }) >= 1);
  assert.equal(pushBudget(0), 0); assert.equal(pushBudget(NaN), 0);
  const w = walker(9, 0, en); w.tick(2);
  const a = [...w.pf.px.slice(1, w.pf.n)].join(); w.tick(1);
  assert.equal([...w.pf.px.slice(1, w.pf.n)].join(), a, 'stable pick, no flicker');
  for (let i = 1; i < w.pf.n; i++) assert.ok(Math.hypot(w.pf.px[i] - w.hero.x, w.pf.py[i] - w.hero.y) >= ENEMY_CORE, 'outside the hero core');
  const far = [{ id: 1, x: 3000, y: 3000, r: 6, speed: 46 }, { id: 2, x: 1110, y: 700, r: 6, speed: 46 }];
  const w2 = walker(9, 0, far); w2.tick(3); assert.equal(w2.pf.n, 1, 'off-view and core enemies are skipped');
  const one = (r, speed) => { const e = [{ id: 5, x: 1300, y: 700, r, speed }]; const x = walker(9, 0, e); x.tick(3); return x.pf; };
  const small = one(4, 26); const big = one(26, 62);
  assert.ok(big.S[1] > small.S[1] && big.R[1] > small.R[1], 'boss > crawler');
  assert.ok(one(6, 62).S[1] > one(6, 20).S[1], 'faster pushes more');
  const p = one(6, 46); assert.ok(p.targetAt(1320, 700) > 0 && p.targetAt(1280, 700) < 0);
});

test('sway tufts: lean away + spring back, bounded with the wind, Hollow has no sprites, push null = AL-1 unchanged, reduced calmer', () => {
  const mk = (life = alive) => { const f = new SwayField({ seed: 7, zone }); f.setBudget(64); f.refresh(SV, { x: 1350, y: 1180 }, life); return f; };
  const run = (reduced, life = alive, stand = false) => {
    const f = mk(life); const w = new PushField(); w.setBudget(9);
    const hero = { x: 1000, y: 1180 }; let mx = 0;
    for (let i = 0; i < 160; i++) {
      hero.x += stand ? 0 : 5; w.update(0.05, hero, [], 0, SV, reduced);
      f.step(0.05, 2 + i * 0.05, hero, life, reduced, w);
      for (const s of f.slots.values()) { assert.ok(Number.isFinite(s.ang)); mx = Math.max(mx, Math.abs(s.pst ? s.pst.pa : 0)); }
    }
    return { f, mx };
  };
  const r = run(false);
  assert.ok(r.mx > 0.12 && r.mx <= SPRING_MAX, 'visible push: ' + r.mx);
  assert.ok(r.mx <= AMP_TUFT * 1.3, 'push bounded by amp + overshoot: ' + r.mx);
  for (const s of r.f.slots.values()) assert.ok(Math.abs(s.ang) <= AMP + WOBBLE + SPRING_MAX + 1e-9, 'total lean bounded');
  const red = run(true);
  assert.ok(red.mx < r.mx * (REDUCED_SCALE + 0.1), 'reduced motion calms it: ' + red.mx + ' vs ' + r.mx);
  const f = r.f; const w = new PushField(); w.setBudget(9);
  for (let i = 0; i < 80; i++) { w.update(0.05, { x: 3900, y: 3900 }, [], 0, VIEW, false); f.step(0.05, 20 + i * 0.05, { x: 3900, y: 3900 }, alive, false, w); }
  for (const s of f.slots.values()) assert.ok(!s.pst || (s.pst.pa === 0 && s.pst.pv === 0), 'springs back to rest');
  assert.equal(mk(dead).count, 0, 'the Hollow has no sprites to push');
  const h = run(false, dead); assert.equal(h.f.count, 0); assert.equal(h.mx, 0);
  const a = mk(); const b = mk();
  for (let i = 0; i < 40; i++) { a.step(0.05, i * 0.05, null, alive, false); b.step(0.05, i * 0.05, null, alive, false, null); }
  for (const [id, s] of a.slots) assert.equal(s.ang, b.slots.get(id).ang);
  assert.equal(run(false, alive, true).mx, 0, 'a standing hero bends nothing');
});

test('props: bush/fern/bramble bodies and oak/snag crowns lean; others, the Hollow and Low stay still', () => {
  const clear = [{ x: 2000, y: 2000, tall: START_CLEAR.tall, low: START_CLEAR.low }];
  const mk = (life, sway = true) => { const f = new PropField({ seed: 7, zone, clear }); f.setBudget(120, 1, false, sway); f.refresh(VIEW, life); return f; };
  const drive = (f, life, reduced = false) => {
    const pf = new PushField(); pf.setBudget(9);
    const hero = { x: 900, y: 700 }; const mx = {};
    for (let i = 0; i < 200; i++) {
      hero.x += 4; pf.update(0.05, hero, [], 0, VIEW, reduced);
      f.step(0.05, i * 0.05, life, reduced, null, 0, hero, pf);
      for (const s of f.slots.values()) { const a = s.pst ? Math.abs(s.pst.pa) : 0; assert.ok(Number.isFinite(s.ang) && Number.isFinite(a)); mx[s.prop.kind] = Math.max(mx[s.prop.kind] || 0, a); }
    }
    return mx;
  };
  const m = drive(mk(alive), alive);
  for (const k of Object.keys(m)) {
    if (k === 'oak' || k === 'snag') assert.ok(m[k] <= AMP_CROWN * 1.3 + 1e-9, k);
    else if (k === 'bush' || k === 'fern' || k === 'bramble') assert.ok(m[k] <= AMP_BODY * 1.3 + 1e-9, k);
    else assert.equal(m[k], 0, k + ' never bends');
  }
  assert.ok(Math.max(...['bush', 'fern', 'bramble', 'oak', 'snag'].map((k) => m[k] || 0)) > 0.02, 'a reactive prop visibly bends: ' + JSON.stringify(m));
  const hollow = drive(mk(dead), dead); for (const k of Object.keys(hollow)) assert.equal(hollow[k], 0, 'Hollow ' + k + ' is still');
  const low = drive(mk(alive, false), alive); for (const k of Object.keys(low)) assert.equal(low[k], 0, 'Low ' + k + ' is static');
  const red = drive(mk(alive), alive, true); for (const k of Object.keys(red)) assert.ok(red[k] <= (m[k] || 0) + 1e-9);
  const f = mk(alive); drive(f, alive);
  for (const s of f.slots.values()) if (KINDS[s.prop.kind].layers.crown) assert.ok(Math.abs(s.ang) <= 0.04 + 0.01 + AMP_CROWN * 1.3);
});

test('no NaN / garbage: odd creatures, positions, budgets and views never break the field', () => {
  const pf = new PushField(); pf.setBudget(9);
  const bad = [{ id: NaN, x: NaN, y: 1, r: NaN, speed: NaN }, { id: 3, x: Infinity, y: 1 }, null, { id: 4, x: 1200, y: 600, r: -5, speed: -9 }, { id: 5, x: 1300, y: 600 }];
  for (const h of [{ x: NaN, y: 0 }, { x: 1100, y: 700 }, null, { x: 1e9, y: -1e9 }, { x: 1100, y: 700 }]) pf.update(0.05, h, bad, bad.length, view);
  pf.update(NaN, { x: 1, y: 1 }, bad, bad.length, null); pf.update(-3, { x: 1, y: 1 }, null, 5, view);
  for (let i = 0; i < pf.n; i++) assert.ok(Number.isFinite(pf.px[i]) && Number.isFinite(pf.S[i]) && Number.isFinite(pf.R[i]));
  assert.ok(Number.isFinite(pf.targetAt(NaN, NaN)) && Number.isFinite(pf.targetAt(1200, 650)));
  pf.setBudget(NaN); pf.setBudget(-4); pf.setBudget(999); assert.ok(pf.budget <= pf.max);
  const f = new SwayField({ seed: 7, zone }); f.setBudget(64); f.refresh(SV, { x: 1350, y: 1180 }, alive);
  const bp = { n: 1, targetAt: () => NaN };
  for (const dt of [0, NaN, -1, 1e9, 0.05]) f.step(dt, 3, { x: 1350, y: 1180 }, alive, false, bp);
  for (const s of f.slots.values()) assert.ok(Number.isFinite(s.ang));
});

test('visual only: no sim import, no Math.random, creatures only read; wired with its own cap, reduced motion and dev switch', () => {
  const src = readFileSync(new URL('../src/gfx/pushfield.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.ok(!/sim\/|rng\.js|Math\.random|Sim\b/.test(src), 'pushfield is visual only');
  assert.ok(!/\be\.(hp|x|y|r|speed)\s*[-+*/]?=[^=]/.test(src), 'creatures are only read');
  const scene = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/pushBudget\(caps\.ambient\.push/.test(scene) && /push: pb > 0 \? this\.push : null/.test(scene) && /push: this\.push/.test(scene));
  assert.ok(/params\.push/.test(scene));
  const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.ok(/FLAGS_ON = \[[^\]]*'push'/.test(readFileSync(new URL('../src/params.js', import.meta.url), 'utf8')) && app.includes('parseParams('));
});
