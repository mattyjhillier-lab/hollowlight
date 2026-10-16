// Four-evolution NUMBERS prototype (READ-ONLY analysis; nothing in src/ or src/data is changed, nothing is written to disk).
// Prototypes Light Trails (wolves), Talon Mark + Vanguard (ravens) and Vesper Tide (Holy Orbit) IN MEMORY (wrapped weapon behaviours,
// in-memory evolution entries, run-level hooks for Rend / mark amp / Burn) with the same method as scripts/third-evo-probe.mjs and
// scripts/evo-home.mjs: MORTAL single/hug/swarm/kite/boss, IMMORTAL stream40; cell = cap@pick | home@max.
// Stand-in bases (the real W-chunks are not built; each is stated in docs/design/four-evolutions-numbers.md):
//   _rend  = Ghost Wolves + locked Rend (15% + 4%/rank of the bite per s, 4 s, strongest wins) + locked +4%/rank bite-rate from Wolf speed.
//   _w8a   = ravens swoop nearest unclaimed within Watch, peck 1x, return (Watch 90..150, Wingbeat rest 1.6..0.85 s).
//   _w8b   = _w8a + raven mark (+10% damage taken, 3 s, refresh only).
//   _w4b   = Holy Orbit + W4 guard contraction + locked Burn (20% of the triggering hit per s, 2 s) + locked +4%/rank hit-rate from Orbit speed.
// Usage: node scripts/four-evo-probe.mjs [seeds=3] [pickRank=1] [filter] [mateRank]   PT='{"light_trails":{"tk":0.5}}' what-ifs (in-memory)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { WEAPON_BEHAVIOURS } from '../src/sim/weapons.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));

// Prototype tunables (design numbers; PT env overrides; JSON.parse, known ids/keys only, finite numbers only, in-memory).
const T = {
  light_trails: { speedMul: 1.1, space: 7, ttl0: 1.2, ttlPer: 0.22, hw0: 5, hwPer: 0.8, tk: 0.24, gate: 0.4, cap: 360, rend0: 0.15, rendPer: 0.04 },
  talon_mark: { dive: 4, amp: 0.15, markT: 3, fly: 300, w8bAmp: 0.1 },
  vanguard: { lead: 40, leadK: 0.6, spread: 12, spreadK: 0.06, sweepAmp: 22, sweepK: 1.0, cr: 5, dmg: 0.3, gate: 0.8, moveMin: 25, mode: 'dense', extraK: 0.5, maxExtra: 4 },
  vesper_tide: { rmin: 14, rmax: 1.7, phase: 1.0, swell: 2.0, draw: 1.0 },
};
if (process.env.PT) for (const [id, t] of Object.entries(JSON.parse(process.env.PT))) {
  if (!Object.hasOwn(T, id)) throw new Error(`unknown prototype ${id}`);
  for (const [k, v] of Object.entries(t)) { if (!Object.hasOwn(T[id], k) || (typeof v !== 'string' && !Number.isFinite(v)) || (typeof v === 'string' && !['move','dense'].includes(v))) throw new Error(`bad key ${id}.${k}`); T[id][k] = v; }
}
const PROTO = {
  light_trails: { weapon: 'ghost_wolves', pair: ['speed', 'power'], baseEvo: '_rend', kind: 'wolf' },
  talon_mark: { weapon: 'raven_flock', pair: ['speed', 'power'], baseEvo: '_w8b', kind: 'team' },
  vanguard: { weapon: 'raven_flock', pair: ['range', 'speed'], baseEvo: '_w8a', kind: 'raven' },
  vesper_tide: { weapon: 'holy_orbit', pair: ['radius', 'speed'], baseEvo: '_w4b', kind: 'orbit' },
};
const STAND = { _rend: 'ghost_wolves', _w8a: 'raven_flock', _w8b: 'raven_flock', _w4b: 'holy_orbit' };
const data = {
  ...base,
  evolutions: { ...base.evolutions,
    ...Object.fromEntries(Object.entries(PROTO).map(([id, p]) => [id, { weapon: p.weapon, pair: p.pair, name: id, treeGate: true }])),
    ...Object.fromEntries(Object.entries(STAND).map(([id, wp]) => [id, { weapon: wp, pair: ['count', 'power'], name: id, treeGate: true }])) },
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 },
    walker: { name: 'Walker', hp: 1e9, speed: 40, dmg: 0, r: 7, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
const TAU = Math.PI * 2;
const BLEED_RATE = 0.35; // today's constant in cards.js (what the unmodified wolf code uses)
const units = (sim, w, n, kind) => {
  const L = w.rt.units || (w.rt.units = []);
  while (L.length > n) L.pop().dead = true;
  while (L.length < n) { const u = sim.makeUnit(w, kind, { st: 'orbit', rest: 0.3 + L.length * 0.2, target: null, links: 0 }); L.push(u); sim.units.push(u); }
  return L;
};
const toward = (u, x, y, v, dt) => { const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy); if (d > 0.001) { const s = Math.min(d, v * dt); u.x += dx / d * s; u.y += dy / d * s; } return d; };
const PERF = { trailPts: 0, trailMs: 0, tideMax: 0 };

// ---------------------------------------------------------------- Wolves: _rend base and Light Trails
const WOLF_ORIG = WEAPON_BEHAVIOURS.ghost_wolves.update;
function wolves(sim, w, dt, trails) {
  const t = T.light_trails; const { s, rt } = w;
  const rend = t.rend0 + t.rendPer * w.ranks.duration;
  const ob = sim.bleed;
  sim.bleed = function (e, dps, dur) { return ob.call(this, e, dps / BLEED_RATE * rend, 4); };
  const s0 = w.s; if (trails) w.s = { ...s0, speed: s0.speed * t.speedMul };
  const saveEvo = w.evo; w.evo = trails ? 'light_trails' : saveEvo; // unknown to the original behaviour = base bite/bleed code
  WOLF_ORIG(sim, w, dt);
  w.evo = saveEvo; w.s = s0; sim.bleed = ob;
  const rate = 0.04 * w.ranks.speed; // locked: Wolf speed gives +4%/rank bite rate (applies to base and evolution alike)
  const wolvesNow = sim.units.filter((u) => u.owner === 'ghost_wolves' && !u.dead);
  for (const u of wolvesNow) u.atkCd -= dt * rate;
  if (!trails) return;
  const t0 = process.hrtime.bigint();
  const L = rt.trail || (rt.trail = []);
  const ttl = t.ttl0 + t.ttlPer * w.ranks.speed; const hw = t.hw0 + t.hwPer * w.ranks.speed;
  for (const u of wolvesNow) {
    if (u.lx === undefined) { u.lx = u.x; u.ly = u.y; }
    if (Math.hypot(u.x - u.lx, u.y - u.ly) >= t.space) { L.push({ x: u.x, y: u.y, t: ttl, hw }); u.lx = u.x; u.ly = u.y; }
  }
  for (const q of L) q.t -= dt;
  rt.trail = L.filter((q) => q.t > 0);
  while (rt.trail.length > t.cap) rt.trail.shift();
  PERF.trailPts = Math.max(PERF.trailPts, rt.trail.length);
  const dmg = s0.power * sim.dmgMult(w);
  if (rt.trail.length) {
    const grid = new Map(); const C = 24;
    for (const q of rt.trail) { const k = Math.floor(q.x / C) * 10007 + Math.floor(q.y / C); (grid.get(k) || grid.set(k, []).get(k)).push(q); }
    for (const e of sim.enemies) {
      if (e.dead) continue;
      let hit = false;
      const cx = Math.floor(e.x / C), cy = Math.floor(e.y / C);
      for (let ix = cx - 1; ix <= cx + 1 && !hit; ix++) for (let iy = cy - 1; iy <= cy + 1 && !hit; iy++) {
        const cell = grid.get(ix * 10007 + iy); if (!cell) continue;
        for (const q of cell) { const rr = e.r + q.hw; if ((e.x - q.x) ** 2 + (e.y - q.y) ** 2 < rr * rr) { hit = true; break; } }
      }
      if (hit && sim.canHit(e, 'trail', t.gate)) { sim.hurt(e, dmg * t.tk); sim.bleed(e, dmg * rend, 4); }
    }
  }
  PERF.trailMs += Number(process.hrtime.bigint() - t0) / 1e6;
}

// ---------------------------------------------------------------- Ravens: _w8a / _w8b base, Talon Mark, Vanguard
function ravens(sim, w, dt, mode) {
  const { s, rt } = w; const p = sim.player; const tt = T.talon_mark;
  const watch = 90 + (s.range - 40) / 7 * 12;
  const rest = 1.6 - (s.speed - 2.2) / 0.4 * 0.15;
  const dmg = s.power * sim.dmgMult(w);
  const L = units(sim, w, s.count, 'raven');
  rt.ang = (rt.ang || 0) + 2.2 * dt;
  const claimed = new Set(L.filter((o) => o.st === 'swoop' && o.target && !o.target.dead).map((o) => o.target.id));
  const pick = (from) => {
    if (mode === 'talon') return sim.toughestEnemy(p.x, p.y, watch, (e) => !claimed.has(e.id)) || sim.toughestEnemy(p.x, p.y, watch);
    return sim.nearestEnemy(from.x, from.y, watch, (e) => !claimed.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) < watch) || sim.nearestEnemy(p.x, p.y, watch);
  };
  const fly = tt.fly;
  L.forEach((u, i) => {
    const a = rt.ang + i * TAU / L.length; const ox = p.x + Math.cos(a) * 30, oy = p.y + Math.sin(a) * 30;
    if (u.st === 'swoop') {
      const e = u.target;
      if (!e || e.dead) { u.st = 'return'; return; }
      if (toward(u, e.x, e.y, fly, dt) < e.r + 4) {
        sim.hurt(e, dmg * (mode === 'talon' ? tt.dive : 1));
        if (mode === 'talon' || mode === 'w8b') {
          const amp = mode === 'talon' ? tt.amp : tt.w8bAmp;
          e.pmAmp = e.pmT > 0 ? Math.max(e.pmAmp, amp) : amp; e.pmT = tt.markT; // strongest wins, refresh only, never stacks
        }
        u.st = 'return';
      }
      return;
    }
    if (u.st === 'return') { if (toward(u, ox, oy, fly, dt) < 6) { u.st = 'orbit'; u.rest = rest; } return; }
    u.x = ox; u.y = oy; u.rest -= dt;
    if (u.rest <= 0) { const e = pick(u); if (e) { u.st = 'swoop'; u.target = e; claimed.add(e.id); } else u.rest = 0.2; }
  });
}

// Vanguard = the BASE flock (unchanged scouting, so never below base) PLUS ceil(count x extraK) vanguard ravens that fly a wedge and clear a lane by contact.
// mode 'move': wedge points where you walk (only while walking); mode 'dense': wedge points at the thickest crowd near you (walking or not).
function vanguard(sim, w, dt) {
  const { s, rt } = w; const p = sim.player; const t = T.vanguard;
  ravens(sim, w, dt, 'w8a'); // the unchanged flock
  if (rt.px === undefined) { rt.px = p.x; rt.py = p.y; rt.hx = 1; rt.hy = 0; rt.sp = 0; rt.ph = 0; rt.wu = []; }
  const vx = (p.x - rt.px) / dt, vy = (p.y - rt.py) / dt; rt.px = p.x; rt.py = p.y;
  const sp = Math.hypot(vx, vy); rt.sp += (sp - rt.sp) * Math.min(1, dt * 8);
  if (sp > 5) { const k = Math.min(1, dt * 6); rt.hx += (vx / sp - rt.hx) * k; rt.hy += (vy / sp - rt.hy) * k; const n = Math.hypot(rt.hx, rt.hy) || 1; rt.hx /= n; rt.hy /= n; }
  const moving = rt.sp > t.moveMin; const dense = t.mode === 'dense';
  const watch = 90 + (s.range - 40) / 7 * 12;
  const dmg = s.power * sim.dmgMult(w);
  let hx = rt.hx, hy = rt.hy, crowd = false;
  if (dense) {
    const near = sim.nearestEnemies(p.x, p.y, watch + 60, 10);
    if (near.length >= 3) { let cx = 0, cy = 0; for (const e of near) { cx += e.x; cy += e.y; } cx = cx / near.length - p.x; cy = cy / near.length - p.y; const d = Math.hypot(cx, cy); if (d > 12) { hx = cx / d; hy = cy / d; crowd = true; } }
  }
  const active = dense ? (crowd || moving) : moving;
  const n = Math.min(t.maxExtra, Math.ceil(s.count * t.extraK));
  while (rt.wu.length > n) rt.wu.pop().dead = true;
  while (rt.wu.length < n) { const u = sim.makeUnit(w, 'raven', { st: 'wedge' }); rt.wu.push(u); sim.units.push(u); }
  const D = t.lead + t.leadK * watch; const spread = t.spread + t.spreadK * watch;
  rt.ph += s.speed * t.sweepK * dt;
  const nx = -hy, ny = hx; const sweep = Math.sin(rt.ph) * t.sweepAmp;
  rt.wu.forEach((u, i) => {
    const row = Math.ceil(i / 2); const side = i === 0 ? 0 : (i % 2 ? 1 : -1);
    const a = rt.ang + i * TAU / Math.max(1, n); // parked: ride the hero ring a little outside the base flock
    const sx = active ? p.x + hx * (D - row * spread * 0.8) + nx * (side * row * spread + sweep) : p.x + Math.cos(a) * 44;
    const sy = active ? p.y + hy * (D - row * spread * 0.8) + ny * (side * row * spread + sweep) : p.y + Math.sin(a) * 44;
    toward(u, sx, sy, active ? 360 : 300, dt);
    if (!active) return;
    for (const e of sim.enemies) { // lane contact: the wedge clears what it flies through
      if (e.dead) continue;
      const rr = e.r + t.cr;
      if ((e.x - u.x) ** 2 + (e.y - u.y) ** 2 < rr * rr && sim.canHit(e, 'vg' + i, t.gate)) sim.hurt(e, dmg * t.dmg);
    }
  });
}

// ---------------------------------------------------------------- Holy Orbit: _w4b base and Vesper Tide
const ORBIT_ORIG = WEAPON_BEHAVIOURS.holy_orbit.update;
function orbit(sim, w, dt, tide) {
  const p = sim.player; const rt = w.rt; const t = T.vesper_tide;
  const near = sim.enemies.some((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) - e.r - p.r < 8);
  rt.touch = near ? (rt.touch || 0) + dt : 0;
  if (rt.touch >= 0.2) rt.hold = 0.8; else rt.hold = Math.max(0, (rt.hold || 0) - dt);
  const s0 = w.s; let radius = s0.radius;
  if (tide) {
    rt.ph = (rt.ph || 0) + s0.speed * t.phase * dt;
    const k = 0.5 - 0.5 * Math.cos(rt.ph);
    radius = t.rmin + (s0.radius * t.rmax - t.rmin) * k; PERF.tideMax = Math.max(PERF.tideMax, radius);
  }
  if (rt.hold > 0) radius = 14; // guard contraction wins
  w.s = { ...s0, radius };
  const oc = sim.canHit; const rate = 1 + 0.04 * w.ranks.speed; // locked +4%/rank hit-rate from Orbit speed, base and evolution alike
  sim.canHit = function (e, key, iv) { return oc.call(this, e, key, key.startsWith('orb') ? iv / rate : iv); };
  const wasEvo = w.evo; w.evo = null; // original code sees the plain ring
  const oh = sim.hurt;
  if (tide && (t.swell !== 1 || t.draw !== 1)) { const m = Math.sin(rt.ph) > 0 ? t.swell : t.draw; sim.hurt = function (e, a, o) { return oh.call(this, e, a * m, o); }; } // swell = ring pushing out, draw = ring drawing in
  ORBIT_ORIG(sim, w, dt);
  sim.hurt = oh;
  w.evo = wasEvo; w.s = s0; sim.canHit = oc;
}

const IMPL = {
  _rend: (s, w, dt) => wolves(s, w, dt, false), light_trails: (s, w, dt) => wolves(s, w, dt, true),
  _w8a: (s, w, dt) => ravens(s, w, dt, 'w8a'), _w8b: (s, w, dt) => ravens(s, w, dt, 'w8b'), talon_mark: (s, w, dt) => ravens(s, w, dt, 'talon'),
  vanguard, _w4b: (s, w, dt) => orbit(s, w, dt, false), vesper_tide: (s, w, dt) => orbit(s, w, dt, true),
};
for (const wid of ['ghost_wolves', 'raven_flock', 'holy_orbit']) {
  const orig = WEAPON_BEHAVIOURS[wid].update;
  WEAPON_BEHAVIOURS[wid] = { update(sim, w, dt) { return IMPL[w.evo] ? IMPL[w.evo](sim, w, dt) : orig(sim, w, dt); } };
}

// ---------------------------------------------------------------- Harness (same scenarios as evo-home / third-evo-probe, + team and hooks)
const DT = 1 / 60; const MAX = base.balance.maxRank;
const SEEDS = Number(process.argv[2] || 3); const PICK = Number(process.argv[3] ?? 1); const FILTER = process.argv[4] || ''; const MATE = Number(process.argv[5] ?? 3);
const ring = (sim, type, n, r0, r1) => { const p = sim.player; for (let i = 0; i < n; i++) { const a = sim.rng.range(0, TAU); const d = r0 + sim.rng.next() * (r1 - r0); sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); } };
const refill = (sim) => { const k = 60 - sim.enemies.filter((e) => !e.dead).length; if (k > 0) ring(sim, sim.rng.chance(0.5) ? 'wolf' : 'crow', k, 160, 220); };
function kite(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { const k = (90 - d) / 90 * (e.boss ? 2.5 : 1); ax += dx / d * k; ay += dy / d * k; } }
  const c = sim.balance.worldSize / 2; ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004; return { x: ax, y: ay };
}
// plough: walk INTO the crowd (centroid of the 8 nearest foes within 220 px; keeps heading when already inside it). Upper bound for directional verbs.
function plough(sim) {
  const p = sim.player; const near = sim.nearestEnemies(p.x, p.y, 220, 8); const o = sim._pl || (sim._pl = { x: 1, y: 0 });
  if (near.length) { let cx = 0, cy = 0; for (const e of near) { cx += e.x; cy += e.y; } cx = cx / near.length - p.x; cy = cy / near.length - p.y; const d = Math.hypot(cx, cy); if (d > 40) { o.x = cx / d; o.y = cy / d; } }
  return { x: o.x, y: o.y };
}
const SCEN = {
  single: { secs: 15, setup: (s) => ring(s, 'dummy', 1, 30, 30) },
  hug: { secs: 15, setup: (s) => ring(s, 'dummy', 1, 15, 15) },
  swarm: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill },
  kite: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill, input: kite },
  stream40: { secs: 20, setup: (s) => ring(s, 'walker', 40, 25, 170), tick: (s) => { const p = s.player; for (const e of s.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = s.rng.range(0, TAU); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; } } },
  plough: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill, input: plough },
  loop: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill, input: (s) => ({ x: Math.cos(s.time * 0.6), y: Math.sin(s.time * 0.6) }) },
  boss: { secs: 40, setup: (s) => { s.time = 600; s.bossE = s.spawnEnemy('elder_treant', s.player.x + 70, s.player.y); }, bossOnly: true },
};
// cfg: { team: [{wid, ranks, evo}], scen, seed, burn }
function run(cfg) {
  const sc = SCEN[cfg.scen];
  const sim = new Sim({ data, characterId: 'wren', seed: cfg.seed, godMode: true });
  sim.weapons.length = 0; sim.patches = []; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
  for (const m of cfg.team) sim.debugGrant(m.wid, m.ranks, m.evo);
  sc.setup(sim);
  let eff = 0, burnDot = 0, markedF = 0, frames = 0;
  const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => {
    if (e.dead || a <= 0) return 0;
    if (e.pmT > 0) a *= 1 + e.pmAmp; // mark: +X% damage taken from ALL sources (hits and DoT ticks), applied once
    if (cfg.burn && sim._src === 'holy_orbit' && !o.silent) { const bd = 0.2 * a; e.bnDps = e.bnT > 0 ? Math.max(e.bnDps, bd) : bd; e.bnT = 2; }
    if (!sc.bossOnly || e === sim.bossE) eff += Math.min(a, Math.max(0, e.hp));
    return orig(e, a, o);
  };
  const n = Math.round(sc.secs / DT); let f = 0;
  for (; f < n; f++) {
    if (sc.tick) sc.tick(sim);
    for (const e of sim.enemies) {
      if (e.dead) continue;
      if (e.pmT > 0) { e.pmT -= DT; if (sc.bossOnly === undefined || e === sim.bossE) { /* uptime below */ } }
      if (e.bnT > 0) { e.bnT -= DT; sim._src = 'holy_orbit'; burnDot += sim.hurt(e, e.bnDps * DT, { silent: true }); sim._src = null; if (e.bnT <= 0) e.bnDps = 0; }
    }
    if (sim.bossE && !sim.bossE.dead) { frames++; if (sim.bossE.pmT > 0) markedF++; }
    sim.step(DT, sc.input ? sc.input(sim) : {});
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    if (sc.bossOnly && sim.bossE.dead) { f++; break; }
  }
  const secs = f * DT;
  const by = {}; for (const [k, v] of Object.entries(sim.dmgBy)) by[k] = v / secs;
  const bleed = (sim.dotBy.ghost_wolves || 0) / secs; const burn = burnDot / secs;
  return { dps: eff / secs, by, bleed, burn, uptime: frames ? markedF / frames : 0 };
}
const ranksOf = (wid, pair, mode, rest = PICK) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, mode === 'max' || pair.includes(k) ? MAX : rest]));
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const r = (a, b) => (b > 0.5 ? (a / b).toFixed(2) : a > 0.5 ? 'INF' : '-');
const MATES = [['ghost_wolves'], ['holy_orbit'], ['spirit_bolts']];

function cells(id, pr, baseEvo, mode) {
  const out = []; const res = {};
  for (const sc of Object.keys(SCEN)) {
    const mk = (m, evo) => {
      const team = [{ wid: pr.weapon, ranks: ranksOf(pr.weapon, pr.pair, m), evo }];
      if (pr.kind === 'team') for (const [wid] of MATES) team.push({ wid, ranks: Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, m === 'max' ? MAX : MATE])), evo: null });
      return team;
    };
    const burn = pr.kind === 'orbit';
    const go = (m, evo) => { const rs = []; for (let sd = 1; sd <= SEEDS; sd++) rs.push(run({ team: mk(m, evo), scen: sc, seed: sd, burn })); return rs; };
    const bp = go('pick', baseEvo), bm = go('max', baseEvo), ep = go('pick', id), em = go('max', id);
    const M = (rs) => mean(rs.map((x) => x.dps));
    const share = (rs, key) => { const t = mean(rs.map((x) => x.dps)); return t > 0 ? mean(rs.map((x) => x[key])) / t : 0; };
    res[sc] = { capPick: M(ep) / Math.max(1e-9, M(bp)), home: M(em) / Math.max(1e-9, M(bm)), em: M(em), bm: M(bm), bleedS: share(em, 'bleed'), burnS: share(em, 'burn'), bleedBase: share(bm, 'bleed'), burnBase: share(bm, 'burn'),
      ravenEvo: mean(em.map((x) => x.by.raven_flock || 0)), ravenBase: mean(bm.map((x) => x.by.raven_flock || 0)), up: mean(em.map((x) => x.uptime)),
      ravenEvoP: mean(ep.map((x) => x.by.raven_flock || 0)), ravenBaseP: mean(bp.map((x) => x.by.raven_flock || 0)) };
    out.push(`${sc.padEnd(8)} ${r(M(ep), M(bp)).padStart(5)} | ${r(M(em), M(bm)).padStart(5)}   (${M(em).toFixed(0)} / ${M(bm).toFixed(0)})  dot%@max evo ${(100 * (res[sc].bleedS + res[sc].burnS)).toFixed(0)} base ${(100 * (res[sc].bleedBase + res[sc].burnBase)).toFixed(0)}` +
      (pr.kind === 'team' ? `  ravens-only evo ${res[sc].ravenEvo.toFixed(0)} base ${res[sc].ravenBase.toFixed(0)}${sc === 'boss' ? ` markUptime ${(100 * res[sc].up).toFixed(0)}%` : ''}` : ''));
  }
  return { out, res };
}

console.log(`Four-evolution prototypes, ${SEEDS} seeds, pick = pair 5 + others ${PICK} (team mates rank ${MATE} at pick, 5 at max). cell = cap@pick | home@max  (evo dps @max / base dps @max)`);
console.log('T =', JSON.stringify(T));
for (const [id, pr] of Object.entries(PROTO)) {
  if (FILTER && !id.includes(FILTER)) continue;
  const bases = pr.kind === 'wolf' ? [pr.baseEvo, null] : pr.kind === 'team' ? [pr.baseEvo, '_w8a'] : [pr.baseEvo];
  for (const b of bases) {
    PERF.trailPts = 0; PERF.trailMs = 0; PERF.tideMax = 0;
    const { out } = cells(id, pr, b, 'x');
    console.log(`${id} vs ${b || 'today (unmodified base)'}\n   ${out.join('\n   ')}`);
    if (id === 'light_trails') console.log(`   perf: max live trail points ${PERF.trailPts}, trail cost ${PERF.trailMs.toFixed(0)} ms total over the run set`);
    if (id === 'vesper_tide') console.log(`   perf: max ring radius ${PERF.tideMax.toFixed(0)} px`);
  }
}
