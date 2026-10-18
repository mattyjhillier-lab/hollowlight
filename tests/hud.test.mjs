// HUD-1: pure helpers (clamping, NaN/Infinity safety, fade state machine) + a DOM-shaped test of the Hud class on a tiny fake document.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  clamp01, hpFrac, flameScale, isEmber, frostAmount, xpFrac, litNotches, rankPips, ringFrac, moonT, arcGeom, moonPoint,
  newFade, fadeWake, fadeLevel, fadeOpacity, FADE_AFTER, FADE_LOW, FLAME_LOW,
} from '../src/ui/hudmath.js';
import { Hud } from '../src/ui/hud.js';

const BAD = [NaN, Infinity, -Infinity, undefined, null, 'x'];

test('HUD-1 hpFrac/flame: clamped 0..1, flame never zero, ember under 35%', () => {
  assert.equal(hpFrac(50, 100), 0.5);
  assert.equal(hpFrac(-5, 100), 0);
  assert.equal(hpFrac(500, 100), 1);
  assert.equal(hpFrac(10, 0), 0);
  for (const b of BAD) { assert.equal(hpFrac(b, 100), 0); assert.equal(hpFrac(10, b), 0); assert.ok(flameScale(b) > 0); }
  assert.ok(Math.abs(flameScale(1) - 0.7) < 1e-9);
  assert.ok(flameScale(0) > 0.29 && flameScale(0) < 0.3);
  assert.ok(flameScale(0.2) < flameScale(0.6) && flameScale(0.6) < flameScale(1));
  assert.equal(isEmber(FLAME_LOW - 0.01), true);
  assert.equal(isEmber(FLAME_LOW), false);
});

test('HUD-1 frostAmount: none at/above 30% HP, smooth ramp, full by 10%, NaN safe', () => {
  assert.equal(frostAmount(1), 0);
  assert.equal(frostAmount(0.3), 0);
  assert.ok(frostAmount(0.29) > 0 && frostAmount(0.29) < 0.1);
  assert.ok(Math.abs(frostAmount(0.18) - 0.6) < 1e-9);
  assert.ok(Math.abs(frostAmount(0.1) - 1) < 1e-9);
  assert.equal(frostAmount(0), 1);
  for (const b of BAD) { const f = frostAmount(b); assert.ok(f >= 0 && f <= 1); }
});

test('HUD-1 XP thread + knots: fraction clamped, lit notches 0..10', () => {
  assert.equal(xpFrac(5, 10), 0.5);
  assert.equal(xpFrac(50, 10), 1);
  assert.equal(xpFrac(1, 0), 0);
  for (const b of BAD) assert.equal(xpFrac(b, 10), 0);
  assert.equal(litNotches(0), 0);
  assert.equal(litNotches(0.099), 0);
  assert.equal(litNotches(0.1), 1);
  assert.equal(litNotches(0.55), 5);
  assert.equal(litNotches(1), 10);
  assert.equal(litNotches(7), 10);
  assert.equal(litNotches(NaN), 0);
});

test('HUD-1 rank pips + cooldown ring', () => {
  assert.equal(rankPips(0, 20), 1); // an owned weapon always shows one pip
  assert.equal(rankPips(4, 20), 1);
  assert.equal(rankPips(5, 20), 2);
  assert.equal(rankPips(20, 20), 5);
  assert.equal(rankPips(99, 20), 5);
  assert.equal(rankPips(3, 20, 5, true), 5); // evolved: all lit
  assert.equal(rankPips(NaN, 20), 1);
  assert.equal(ringFrac(0.5, 1), 0.5);
  assert.equal(ringFrac(2, 1), 1);
  assert.equal(ringFrac(-1, 1), 0);
  assert.equal(ringFrac(1, 0), 0);
  assert.equal(ringFrac(Infinity, 1), 0);
});

test('HUD-1 moon position: ends at the arc ends, apex in the middle, clamped, finite', () => {
  assert.equal(moonT(0, 900), 0);
  assert.equal(moonT(450, 900), 0.5);
  assert.equal(moonT(5000, 900), 1);
  assert.equal(moonT(-3, 900), 0);
  assert.equal(moonT(10, 0), 0);
  assert.equal(moonT(NaN, 900), 0);
  const g = arcGeom(190, 26);
  const a = moonPoint(0, g), m = moonPoint(0.5, g), z = moonPoint(1, g);
  assert.ok(Math.abs(a.x + 95) < 1e-6 && Math.abs(a.y) < 1e-6);
  assert.ok(Math.abs(z.x - 95) < 1e-6 && Math.abs(z.y) < 1e-6);
  assert.ok(Math.abs(m.x) < 1e-6 && Math.abs(m.y + 26) < 1e-6);
  for (const b of BAD) { const p = moonPoint(b, g); assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); }
  assert.ok(moonPoint(0.25, g).x < moonPoint(0.75, g).x);
});

test('HUD-1 fade state machine: full for 8s, low after, wake restores, clock reset safe, NaN safe', () => {
  const st = newFade();
  fadeWake(st, 100);
  assert.equal(fadeLevel(st, 100), 'full');
  assert.equal(fadeLevel(st, 100 + FADE_AFTER - 0.01), 'full');
  assert.equal(fadeLevel(st, 100 + FADE_AFTER), 'low');
  assert.equal(fadeOpacity(st, 200), FADE_LOW);
  assert.equal(fadeOpacity(st, 100), 1);
  fadeWake(st, 200); // level-up / weapon gain / ability / tap
  assert.equal(fadeLevel(st, 201), 'full');
  assert.equal(fadeLevel(st, 5), 'full'); // new run: the clock went backwards
  for (const b of BAD) { assert.equal(fadeLevel(st, b), fadeLevel(st, 0)); fadeWake(st, b); assert.ok(Number.isFinite(st.last)); }
  assert.equal(FADE_AFTER, 8);
});

// ---- tiny fake DOM (createElement / createElementNS only) ----
function fakeDoc() {
  const mkNode = (tag) => {
    const n = {
      tag, children: [], attrs: {}, style: {}, _cls: new Set(), _text: '', listeners: {},
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
      replaceChildren(...cs) { this.children = cs; },
      addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
      getBoundingClientRect() { return { left: 0, right: 100, top: 0, bottom: 50 }; },
      classList: null, offsetWidth: 0,
    };
    n.classList = {
      add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c),
      toggle: (c, on) => { if (on === undefined ? !n._cls.has(c) : on) n._cls.add(c); else n._cls.delete(c); },
    };
    Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
    Object.defineProperty(n, 'textContent', { get: () => n._text, set: (v) => { n._text = String(v); n.children = []; } });
    return n;
  };
  return { createElement: (t) => { const n = mkNode(t); if (t === 'canvas') n.getContext = () => null; return n; }, createElementNS: (_ns, t) => mkNode(t) };
}
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const find = (root, cls) => { let hit = null; walk(root, (n) => { if (!hit && n._cls && n._cls.has(cls)) hit = n; }); return hit; };

const DATA = { weapons: { ghost_wolves: { name: 'Ghost Wolves' }, spirit_bolts: { name: 'Spirit Bolts' } }, evolutions: { pouncing: { name: 'Lightfoot Pack' } }, enemies: { elder_treant: { name: 'Elder Treant' } } };
const mkSim = (o = {}) => ({
  time: 100, xp: 5, xpNeeded: 10, level: 3, gold: 12.9, boss: null,
  player: { hp: 60, maxHp: 120 },
  balance: { runSeconds: 900, weaponSlots: 4, maxRank: 5 },
  weapons: [{ id: 'ghost_wolves', evo: null, ranks: { count: 2, power: 1 }, rt: {} }, { id: 'spirit_bolts', evo: null, ranks: { count: 1 }, rt: { cd: 0.5 } }],
  ability: { id: 'rally_pack', name: 'Rally the Pack', cdLeft: 30 }, abilityCooldown: 60,
  ...o,
});

test('HUD-1 Hud DOM: builds, paints values, textContent only, survives bad input', () => {
  const doc = fakeDoc(), host = doc.createElement('div');
  const hud = new Hud(doc, host, { bossName: (t) => DATA.enemies[t].name });
  hud.update(mkSim(), DATA);
  assert.equal(find(host, 'h-hpnum').textContent, '60');
  assert.equal(find(host, 'h-hpmax').textContent, '/ 120');
  assert.equal(find(host, 'h-knotnum').textContent, '3');
  assert.equal(find(host, 'h-timetxt').textContent, '13:20');
  assert.equal(find(host, 'h-goldnum').textContent, '12');
  assert.equal(find(host, 'h-tfill').style.width, '50.0%');
  assert.equal(find(host, 'h-strip').children.length, 4); // 2 weapons + 2 empty slots
  assert.ok(find(host, 'h-strip').children[2]._cls.has('empty'));
  assert.equal(find(host, 'h-absec').textContent, '30s');
  assert.ok(!find(host, 'h-ability')._cls.has('ready'));
  assert.equal(find(host, 'h-frost').style.opacity, '0.00');
  // boss bar toggles with the boss
  assert.ok(!find(host, 'h-boss')._cls.has('on'));
  hud.update(mkSim({ boss: { type: 'elder_treant', hp: 50, maxHp: 100, dead: false } }), DATA);
  assert.ok(find(host, 'h-boss')._cls.has('on'));
  assert.equal(find(host, 'h-bossname').textContent, 'Elder Treant');
  assert.equal(find(host, 'h-bfill').style.width, '50.0%');
  hud.update(mkSim({ boss: { type: 'elder_treant', hp: 0, maxHp: 100, dead: true } }), DATA);
  assert.ok(!find(host, 'h-boss')._cls.has('on'));
  // low HP: ember + frost
  hud.update(mkSim({ player: { hp: 10, maxHp: 120 } }), DATA);
  assert.ok(find(host, 'h-lantern')._cls.has('low'));
  assert.ok(Number(find(host, 'h-frost').style.opacity) > 0.9);
  // garbage numbers never throw or leak NaN into the DOM
  hud.update(mkSim({ player: { hp: NaN, maxHp: 0 }, xp: Infinity, xpNeeded: NaN, gold: NaN, time: NaN }), DATA);
  let leak = false;
  walk(host, (n) => { if (/NaN|Infinity/.test(n._text || '') || Object.values(n.style || {}).some((v) => /NaN|Infinity/.test(String(v))) || Object.values(n.attrs || {}).some((v) => /NaN|Infinity/.test(v))) leak = true; });
  assert.equal(leak, false);
});

test('HUD-1 Hud fade: fades after 8s idle game time; level-up, weapon gain, ability use and tap wake it', () => {
  const doc = fakeDoc(), hud = new Hud(doc, doc.createElement('div'), {});
  const strip = hud.strip;
  hud.update(mkSim({ time: 100 }), DATA);
  assert.ok(!strip._cls.has('low'));
  hud.update(mkSim({ time: 107.9 }), DATA);
  assert.ok(!strip._cls.has('low'));
  hud.update(mkSim({ time: 108.5 }), DATA);
  assert.ok(strip._cls.has('low'));
  hud.update(mkSim({ time: 109, level: 4 }), DATA); // level-up
  assert.ok(!strip._cls.has('low'));
  hud.update(mkSim({ time: 118, level: 4 }), DATA);
  assert.ok(strip._cls.has('low'));
  const W3 = mkSim().weapons.concat([{ id: 'spirit_bolts', evo: null, ranks: { a: 1 }, rt: {} }]);
  hud.update(mkSim({ time: 119, level: 4, weapons: W3 }), DATA); // weapon gain
  assert.ok(!strip._cls.has('low'));
  hud.update(mkSim({ time: 130, level: 4, weapons: W3, ability: { id: 'rally_pack', name: 'Rally the Pack', cdLeft: 5 } }), DATA);
  assert.ok(strip._cls.has('low'));
  hud.update(mkSim({ time: 131, level: 4, weapons: W3, ability: { id: 'rally_pack', name: 'Rally the Pack', cdLeft: 60 } }), DATA); // ability used
  assert.ok(!strip._cls.has('low'));
  hud.update(mkSim({ time: 145, level: 4, weapons: W3, ability: { id: 'rally_pack', name: 'Rally the Pack', cdLeft: 40 } }), DATA);
  assert.ok(strip._cls.has('low'));
  hud.tapAt(50, 20); // inside the (fake) strip box
  assert.ok(!strip._cls.has('low'));
  hud.update(mkSim({ time: 160, level: 4, weapons: W3, ability: { id: 'rally_pack', name: 'Rally the Pack', cdLeft: 30 } }), DATA);
  assert.ok(strip._cls.has('low'));
  hud.strip.listeners.pointerenter[0](); // hover
  assert.ok(!strip._cls.has('low'));
  hud.reset(); // new run: clock restarts, strip starts full
  hud.update(mkSim({ time: 2 }), DATA);
  assert.ok(!strip._cls.has('low'));
});

test('HUD-1 source: no innerHTML / outerHTML / insertAdjacentHTML in the HUD modules; palette tokens exist', () => {
  for (const f of ['hud.js', 'hudsvg.js', 'hudmath.js']) {
    const src = readFileSync(new URL(`../src/ui/${f}`, import.meta.url), 'utf8');
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src.replace(/\/\/.*$/gm, '')), f);
  }
  const css = readFileSync(new URL('../src/hud.css', import.meta.url), 'utf8');
  assert.ok(!/backdrop-filter/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'no backdrop-filter in the HUD');
  assert.ok(/env\(safe-area-inset-left/.test(css) && /env\(safe-area-inset-bottom/.test(css) && /env\(safe-area-inset-top/.test(css) && /env\(safe-area-inset-right/.test(css));
});
