// Third-evolution design probe (READ-ONLY analysis; nothing in src/ or src/data is changed).
// Prototypes the recommended (A) third evolution of Raven Flock, Spirit Bolts, Chain Lightning and Holy Orbit IN MEMORY
// (wrapped weapon behaviours + in-memory evolution entries) and measures them against TODAY's base weapon with the
// evo-home harness: MORTAL single/swarm/kite/boss, IMMORTAL stream40, plus hug (a dummy pressed against the hero).
// Ravens: today's base ravens are broken (W8a pending), so ravens are also measured against a W8a-like proxy base
// ('_w8a', swoop nearest unclaimed + return, same stats mapping) - the ratio that matters.
// Ranks: pick = recipe pair 5 + others PICK (default 1, measurement standard 2.3); max = all 5.
// Usage: node scripts/third-evo-probe.mjs [seeds=3] [pickRank=1] [filter]   optional PT='{"storm_tether":{"k":0.3}}' what-ifs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { WEAPON_BEHAVIOURS } from '../src/sim/weapons.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));

// Prototype tunables (design numbers; PT env overrides, JSON.parse, known ids/keys only, in-memory).
const T = {
  mercy_wings: { peck: 1.4, low: 0.35, lowMult: 2, chain: 3, fly: 300 },
  returning_pages: { dmg: 1.6, cd: 1.1, turn: 3, out0: 130, outK: 0.7, hr: 9, keep: 1 },
  storm_tether: { k: 0.3, tick: 0.25, fork: 0.5 },
  censer_swing: { base: 1.5, perLight: 0.25, gate: 0.35, arc: 1.6, len: 1.8, hr: 12, splash: 0.3, ring: 1, tough: 0 },
};
if (process.env.PT) for (const [id, t] of Object.entries(JSON.parse(process.env.PT))) {
  if (!Object.hasOwn(T, id)) throw new Error(`unknown prototype ${id}`);
  for (const [k, v] of Object.entries(t)) { if (!Object.hasOwn(T[id], k) || !Number.isFinite(v)) throw new Error(`bad key ${id}.${k}`); T[id][k] = v; }
}
const PROTO = {
  mercy_wings: { weapon: 'raven_flock', pair: ['range', 'speed'] },
  _w8a: { weapon: 'raven_flock', pair: ['range', 'speed'] }, // proxy base (not an evolution)
  returning_pages: { weapon: 'spirit_bolts', pair: ['speed', 'pierce'] },
  storm_tether: { weapon: 'chain_lightning', pair: ['chains', 'area'] },
  censer_swing: { weapon: 'holy_orbit', pair: ['radius', 'speed'] },
  _w4: { weapon: 'holy_orbit', pair: ['radius', 'speed'] }, // proxy base: W4 guard contraction (edge < 8 px for 0.2 s -> ring 14 px, hold 0.8 s)
};
const data = {
  ...base,
  evolutions: { ...base.evolutions, ...Object.fromEntries(Object.entries(PROTO).map(([id, p]) => [id, { ...p, name: id, treeGate: true }])) },
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 },
    walker: { name: 'Walker', hp: 1e9, speed: 40, dmg: 0, r: 7, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
const TAU = Math.PI * 2;
const units = (sim, w, n, kind) => {
  const L = w.rt.units || (w.rt.units = []);
  while (L.length > n) L.pop().dead = true;
  while (L.length < n) { const u = sim.makeUnit(w, kind, { st: 'orbit', rest: 0.3 + L.length * 0.2, target: null, links: 0 }); L.push(u); sim.units.push(u); }
  return L;
};
const toward = (u, x, y, v, dt) => { const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy); if (d > 0.001) { const s = Math.min(d, v * dt); u.x += dx / d * s; u.y += dy / d * s; } return d; };

// --- Ravens (W8a-like mapping of today's stats): Watch 90..150, Wingbeat rest 1.6..0.85 s.
function ravens(sim, w, dt, mercy) {
  const { s, rt } = w; const p = sim.player; const t = T.mercy_wings;
  const watch = 90 + (s.range - 40) / 7 * 12;
  const rest = 1.6 - (s.speed - 2.2) / 0.4 * 0.15;
  const dmg = s.power * sim.dmgMult(w);
  const L = units(sim, w, s.count, 'raven');
  rt.ang = (rt.ang || 0) + 2.2 * dt;
  const claimed = new Set(L.filter((o) => o.st === 'swoop' && o.target && !o.target.dead).map((o) => o.target.id));
  const pick = (from) => {
    if (mercy) { // most-faded first (lowest hp fraction); wounded non-boss only, else nearest (fallback keeps boss/single >= base)
      let best = null, bf = 0.999;
      for (const e of sim.enemies) { if (e.dead || claimed.has(e.id) || e.boss) continue; if (Math.hypot(e.x - p.x, e.y - p.y) > watch) continue; const f = e.hp / e.maxHp; if (f < bf) { bf = f; best = e; } }
      if (best) return best;
    }
    return sim.nearestEnemy(from.x, from.y, watch, (e) => !claimed.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) < watch) || sim.nearestEnemy(p.x, p.y, watch);
  };
  L.forEach((u, i) => {
    const a = rt.ang + i * TAU / L.length; const ox = p.x + Math.cos(a) * 30, oy = p.y + Math.sin(a) * 30;
    if (u.st === 'swoop') {
      const e = u.target;
      if (!e || e.dead) { u.st = 'return'; return; }
      if (toward(u, e.x, e.y, t.fly, dt) < e.r + 4) {
        let d = dmg * (mercy ? t.peck : 1);
        if (mercy && !e.boss && e.hp / e.maxHp < t.low) d *= t.lowMult;
        sim.hurt(e, d);
        if (mercy && e.dead && u.links < t.chain) { u.links++; const n = pick(u); if (n) { u.target = n; claimed.add(n.id); return; } }
        u.st = 'return';
      }
      return;
    }
    if (u.st === 'return') { if (toward(u, ox, oy, t.fly, dt) < 6) { u.st = 'orbit'; u.rest = rest; u.links = 0; } return; }
    u.x = ox; u.y = oy; u.rest -= dt;
    if (u.rest <= 0) { const e = pick(u); if (e) { u.st = 'swoop'; u.target = e; claimed.add(e.id); } else u.rest = 0.2; }
  });
}

// --- Returning Pages: glyphs fly straight out, pierce (1 + Pierce) foes per leg, turn at the end of the out leg, fly back to the hero.
function pages(sim, w, dt) {
  const { s, rt } = w; const p = sim.player; const t = T.returning_pages;
  const dmg = s.power * sim.dmgMult(w) * t.dmg;
  const v = s.speed * 1.3; const out = t.out0 + (s.speed - 150) * t.outK; const per = 1 + s.pierce;
  const P = rt.pages || (rt.pages = []);
  rt.cd = (rt.cd ?? 0.3) - dt;
  if (rt.cd <= 0) {
    const tg = sim.nearestEnemies(p.x, p.y, 210, s.count);
    if (!tg.length) rt.cd = 0.15;
    else {
      for (let i = 0; i < s.count; i++) {
        const e = tg[i % tg.length]; let ang = Math.atan2(e.y - p.y, e.x - p.x);
        if (i >= tg.length) ang += (i - tg.length + 1) * 0.2 * (i % 2 ? 1 : -1);
        P.push({ x: p.x, y: p.y, ang, tgt: e, go: 0, back: false, hit: new Set(), left: per, life: 4 });
      }
      rt.cd = t.cd * sim.mods.cooldown;
    }
  }
  for (const b of P) {
    b.life -= dt;
    if (b.back) { const d = toward(b, p.x, p.y, v, dt); if (d < 8) b.dead = true; }
    else { if (b.tgt && !b.tgt.dead && !b.hit.size) { let df = Math.atan2(b.tgt.y - b.y, b.tgt.x - b.x) - b.ang; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU; b.ang += Math.max(-t.turn * dt, Math.min(t.turn * dt, df)); } b.x += Math.cos(b.ang) * v * dt; b.y += Math.sin(b.ang) * v * dt; b.go += v * dt; if (b.go >= out || b.left <= 0) { b.back = true; if (!t.keep) b.hit = new Set(); b.left = per; } }
    for (const e of sim.enemies) {
      if (e.dead || b.hit.has(e.id) || b.left <= 0) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + t.hr) { sim.hurt(e, dmg); b.hit.add(e.id); b.left--; }
    }
    if (b.life <= 0) b.dead = true;
  }
  rt.pages = P.filter((b) => !b.dead);
}

// --- Storm Tether: ceil(chains/2) live arcs (max 4) to the nearest foes within 120 + 0.6 x Jump range; no doubling on a lone foe (cap);
// each arc ticks every tick x (cooldown/1.6) for k x power and forks once (fork x power) to a foe within Jump range of its target.
function tether(sim, w, dt) {
  const { s, rt } = w; const p = sim.player; const t = T.storm_tether;
  const dmg = s.power * sim.dmgMult(w); const area = s.area * sim.mods.area;
  rt.cd = (rt.cd ?? 0.2) - dt;
  if (rt.cd > 0) return;
  rt.cd = t.tick * (s.cooldown / 1.6) * sim.mods.cooldown;
  const n = Math.min(4, Math.ceil(s.chains / 2));
  const tg = sim.nearestEnemies(p.x, p.y, 120 + 0.6 * area, n);
  if (!tg.length) return;
  for (let i = 0; i < tg.length; i++) {
    const e = tg[i];
    if (e.dead) continue;
    sim.hurt(e, dmg * t.k);
    const f = sim.nearestEnemy(e.x, e.y, area, (o) => o !== e && !tg.includes(o));
    if (f) sim.hurt(f, dmg * t.k * t.fork);
  }
}

// --- Censer Swing: all lights go into one censer on a chain; it swings a wide arc centred on the nearest foe,
// far (chain = Orbit size x len) mid-swing, close (16 px) at the ends; heavy hit per pass (base + perLight x Orb count), per-enemy gate.
function censer(sim, w, dt) {
  if (T.censer_swing.ring) w4(sim, w, dt);
  const { s, rt } = w; const p = sim.player; const t = T.censer_swing;
  const dmg = s.power * sim.dmgMult(w) * (t.base + t.perLight * s.count);
  const len = s.radius * sim.mods.area * t.len;
  rt.ph = (rt.ph || 0) + s.speed * dt;
  const sw = Math.sin(rt.ph);
  if (rt.aim === undefined || Math.cos(rt.ph) > 0.98) { const e = (t.tough ? sim.toughestEnemy(p.x, p.y, len + 40) : null) || sim.nearestEnemy(p.x, p.y, len + 60); if (e) { rt.aim = Math.atan2(e.y - p.y, e.x - p.x); rt.aimE = e; } else rt.aim = rt.aim ?? 0; }
  const a = rt.aim + t.arc / 2 * sw; const d = 16 + (len - 16) * (0.5 - 0.5 * Math.cos(rt.ph));
  const cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d;
  if (!rt.cu) { rt.cu = sim.makeUnit(w, 'censer', {}); sim.units.push(rt.cu); } rt.cu.x = cx; rt.cu.y = cy;
  for (const e of sim.enemies) { if (e.dead) continue; if (Math.hypot(e.x - cx, e.y - cy) < e.r + t.hr && sim.canHit(e, 'censer', t.gate)) sim.hurt(e, e === rt.aimE ? dmg : dmg * t.splash); }
}

let ORBIT_ORIG = null;
function w4(sim, w, dt) {
  const p = sim.player; const rt = w.rt;
  const near = sim.enemies.some((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) - e.r - p.r < 8);
  rt.touch = near ? (rt.touch || 0) + dt : 0;
  if (rt.touch >= 0.2) rt.hold = 0.8; else rt.hold = Math.max(0, (rt.hold || 0) - dt);
  const s0 = w.s; w.s = { ...s0, radius: rt.hold > 0 ? 14 : s0.radius };
  ORBIT_ORIG(sim, w, dt); w.s = s0;
}
const IMPL = { mercy_wings: (s, w, dt) => ravens(s, w, dt, true), _w8a: (s, w, dt) => ravens(s, w, dt, false), returning_pages: pages, storm_tether: tether, censer_swing: censer, _w4: w4 };
for (const wid of new Set(Object.values(PROTO).map((p) => p.weapon))) {
  const orig = WEAPON_BEHAVIOURS[wid].update;
  if (wid === 'holy_orbit') ORBIT_ORIG = orig;
  WEAPON_BEHAVIOURS[wid] = { update(sim, w, dt) { return IMPL[w.evo] ? IMPL[w.evo](sim, w, dt) : orig(sim, w, dt); } };
}

const DT = 1 / 60; const MAX = base.balance.maxRank;
const SEEDS = Number(process.argv[2] || 3); const PICK = Number(process.argv[3] ?? 1); const FILTER = process.argv[4] || '';
const ring = (sim, type, n, r0, r1) => { const p = sim.player; for (let i = 0; i < n; i++) { const a = sim.rng.range(0, TAU); const d = r0 + sim.rng.next() * (r1 - r0); sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); } };
const refill = (sim) => { const k = 60 - sim.enemies.filter((e) => !e.dead).length; if (k > 0) ring(sim, sim.rng.chance(0.5) ? 'wolf' : 'crow', k, 160, 220); };
function kite(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { const k = (90 - d) / 90 * (e.boss ? 2.5 : 1); ax += dx / d * k; ay += dy / d * k; } }
  const c = sim.balance.worldSize / 2; ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004; return { x: ax, y: ay };
}
const SCEN = {
  single: { secs: 15, setup: (s) => ring(s, 'dummy', 1, 30, 30) },
  hug: { secs: 15, setup: (s) => ring(s, 'dummy', 1, 15, 15) },
  swarm: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill },
  kite: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill, input: kite },
  stream40: { secs: 20, setup: (s) => ring(s, 'walker', 40, 25, 170), tick: (s) => { const p = s.player; for (const e of s.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = s.rng.range(0, TAU); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; } } },
  boss: { secs: 40, setup: (s) => { s.time = 600; s.bossE = s.spawnEnemy('elder_treant', s.player.x + 70, s.player.y); }, bossOnly: true },
};
function run(wid, ranks, evo, scen, seed) {
  const sc = SCEN[scen];
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0; sim.patches = []; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  sim.debugGrant(wid, ranks, evo); sc.setup(sim);
  let eff = 0; const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => { if (!e.dead && a > 0 && (!sc.bossOnly || e === sim.bossE)) eff += Math.min(a, Math.max(0, e.hp)); return orig(e, a, o); };
  const n = Math.round(sc.secs / DT); let f = 0;
  for (; f < n; f++) {
    if (sc.tick) sc.tick(sim);
    sim.step(DT, sc.input ? sc.input(sim) : {});
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    if (sc.bossOnly && sim.bossE.dead) { f++; break; }
  }
  return eff / (f * DT);
}
const ranksOf = (wid, pair, mode) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, mode === 'max' || pair.includes(k) ? MAX : PICK]));
const mean = (fn) => { let t = 0; for (let i = 1; i <= SEEDS; i++) t += fn(i); return t / SEEDS; };
const r = (a, b) => (b > 0.5 ? (a / b).toFixed(2) : a > 0.5 ? 'INF' : '-');
console.log(`Third-evolution prototypes vs base, ${SEEDS} seeds, pick = pair 5 + others ${PICK}. cell = cap@pick | home@max  (evo dps @max / base dps @max)`);
for (const [id, pr] of Object.entries(PROTO)) {
  if (FILTER && !id.includes(FILTER)) continue;
  const bases = id === 'mercy_wings' ? [[null, 'today'], ['_w8a', 'w8a-proxy']] : id === 'censer_swing' ? [[null, 'today'], ['_w4', 'w4-proxy']] : [[null, 'today']];
  for (const [bevo, bname] of bases) {
    if (id.startsWith('_') && bevo) continue;
    const rp = ranksOf(pr.weapon, pr.pair, 'pick'); const rm = ranksOf(pr.weapon, pr.pair, 'max');
    const cells = [];
    for (const sc of Object.keys(SCEN)) {
      const bp = mean((sd) => run(pr.weapon, rp, bevo, sc, sd)); const bm = mean((sd) => run(pr.weapon, rm, bevo, sc, sd));
      const ep = mean((sd) => run(pr.weapon, rp, id, sc, sd)); const em = mean((sd) => run(pr.weapon, rm, id, sc, sd));
      cells.push(`${sc.padEnd(8)} ${r(ep, bp).padStart(5)} | ${r(em, bm).padStart(5)}   (${em.toFixed(0)} / ${bm.toFixed(0)})`);
    }
    console.log(`${id} vs ${bname} base\n   ${cells.join('\n   ')}`);
  }
}
