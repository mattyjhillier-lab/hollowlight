// Behaviour probe for every weapon + evolution in controlled scenarios (god mode, no waves).
// Usage: node scripts/probe-summons.mjs [filter]   e.g. node scripts/probe-summons.mjs raven
// Read-only: loads the real data/Sim, adds a few test-only enemy types in memory.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
const data = {
  ...base,
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
const DT = 1 / 60;
const MAX = base.balance.maxRank;
const FILTER = process.argv[2] || '';

// Scenarios: setup(sim) once, tick(sim, t) every frame (refills / input), secs.
const ring = (sim, type, n, r0, r1) => {
  const p = sim.player;
  for (let i = 0; i < n; i++) {
    const a = sim.rng.range(0, 6.2832);
    const d = r0 + sim.rng.next() * (r1 - r0);
    sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
  }
};
const refill = (sim, n) => { const k = n - sim.enemies.length; if (k > 0) ring(sim, sim.rng.chance(0.5) ? 'wolf' : 'crow', k, 160, 220); };
const circleInput = (t) => ({ x: Math.cos(t * 0.3), y: Math.sin(t * 0.3) });
function kite(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { const w = (90 - d) / 90 * (e.boss ? 2.5 : 1); ax += dx / d * w; ay += dy / d * w; } }
  const c = sim.balance.worldSize / 2; ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay };
}
const SCEN = {
  idle: { secs: 10, setup() {}, input: () => ({}) },
  idleRun: { secs: 10, setup() {}, input: circleInput },
  single: { secs: 20, setup: (s) => ring(s, 'dummy', 1, 30, 30), input: () => ({}) },
  far: { secs: 15, setup: (s) => ring(s, 'dummy', 1, 190, 190), input: () => ({}) },
  swarm: { secs: 30, setup: (s) => { s.time = 480; refill(s, 60); }, tick: (s) => refill(s, 60), input: () => ({}) },
  swarmRun: { secs: 30, setup: (s) => { s.time = 480; refill(s, 60); }, tick: (s) => refill(s, 60), input: circleInput },
  kite: { secs: 30, setup: (s) => { s.time = 480; refill(s, 60); }, tick: (s) => refill(s, 60), input: (t, s) => kite(s) },
  boss: { secs: 120, setup: (s) => { s.time = 600; s.boss = s.spawnEnemy('elder_treant', s.player.x + 70, s.player.y); }, input: () => ({}), stop: (s) => s.boss.dead },
};

function unitState(u, sim) {
  if (u.kind === 'wolf') {
    if (u.leap) return 'leap';
    if (u.maul > 0) return 'maul';
    if (!u.target || u.target.dead) return 'idle';
    return Math.hypot(u.target.x - u.x, u.target.y - u.y) <= u.target.r + u.r + 0.5 ? 'bite' : 'chase';
  }
  if (u.kind === 'raven') return u.st;
  if (u.kind === 'orb') return u.hidden ? 'rest' : 'active';
  return '?';
}

function run(wid, ranks, evo, scenName) {
  const sc = SCEN[scenName];
  const sim = new Sim({ data, characterId: 'wren', seed: 3, godMode: true });
  sim.weapons.length = 0;
  sim.patches = [];
  sim.ability.cdLeft = 1e9; // no Pack Howl unless forced
  sim.debugGrant(wid, ranks, evo);
  sc.setup(sim);
  sim.player.hp = 1; // god mode: any rise is healing from the weapon
  sim.rollDrops = () => {}; // no hearts/magnets: keeps heal numbers weapon-only
  let contacts = 0; const dp = sim.damagePlayer.bind(sim); sim.damagePlayer = (a) => { if (sim.player.iframes <= 0) contacts++; return dp(a); };
  const m = { eff: 0, raw: 0, hits: 0, kills: 0, frames: 0, unitFrames: 0, distSum: 0, maxDist: 0, off: 0, states: {}, fired: 0, wasted: 0,
    bossFear: 0, bossHeld: 0, bossFrames: 0, dives: 0, maxReturn: 0, sameTarget: 0, diveStarts: 0, targetsDistinct: 0, wolfFrames: 0, longestChase: 0, ttk: null };
  const orig = sim.hurt.bind(sim);
  sim.hurt = (e, a, o = {}) => {
    if (!e.dead && a > 0) {
      m.raw += a; m.eff += Math.min(a, Math.max(0, e.hp));
      if (!o.silent) m.hits++;
      if (e.hp - a <= 0) m.kills++;
    }
    return orig(e, a, o);
  };
  const seenBolts = new Map();
  const ret = new Map(); const chase = new Map();
  const n = Math.round(sc.secs / DT);
  let t = 0;
  for (let i = 0; i < n; i++) {
    t = i * DT;
    if (sc.tick) sc.tick(sim);
    sim.step(DT, sc.input(t, sim));
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    m.frames++;
    const p = sim.player;
    const live = sim.units.filter((u) => !u.dead);
    const tg = new Set();
    for (const u of live) {
      const d = Math.hypot(u.x - p.x, u.y - p.y);
      m.unitFrames++; m.distSum += d; m.maxDist = Math.max(m.maxDist, d);
      if (Math.abs(u.x - p.x) > 320 || Math.abs(u.y - p.y) > 180) m.off++;
      const st = unitState(u, sim);
      m.states[st] = (m.states[st] || 0) + 1;
      if (u.kind === 'raven') {
        if (st === 'return') { ret.set(u.id, (ret.get(u.id) || 0) + DT); m.maxReturn = Math.max(m.maxReturn, ret.get(u.id)); } else ret.set(u.id, 0);
        if (st === 'dive' && !u._seen) { u._seen = true; m.diveStarts++; if (live.some((o) => o !== u && o.st === 'dive' && o.target === u.target)) m.sameTarget++; }
        if (st !== 'dive') u._seen = false;
      }
      if (u.kind === 'wolf') {
        if (u.target && !u.target.dead) tg.add(u.target.id);
        if (st === 'chase') { chase.set(u.id, (chase.get(u.id) || 0) + DT); m.longestChase = Math.max(m.longestChase, chase.get(u.id)); } else chase.set(u.id, 0);
      }
    }
    if (live.length && live[0].kind === 'wolf') { m.targetsDistinct += tg.size; m.wolfFrames++; }
    for (const b of sim.projectiles) if (!seenBolts.has(b.id)) { seenBolts.set(b.id, b); m.fired++; }
    if (sim.boss && !sim.boss.dead) { m.bossFrames++; if (sim.boss.fearT > 0) m.bossFear++; if (sim.boss.heldT > 0) m.bossHeld++; }
    if (sc.stop && sc.stop(sim)) { m.ttk = t; break; }
  }
  for (const b of seenBolts.values()) if (b.hit.size === 0) m.wasted++;
  const secs = m.frames * DT;
  return {
    contacts: contacts / secs,
    dps: m.eff / secs, overkill: m.raw ? 1 - m.eff / m.raw : 0, hps: m.hits / secs, kps: m.kills / secs,
    units: m.unitFrames / m.frames, avgDist: m.unitFrames ? m.distSum / m.unitFrames : 0, maxDist: m.maxDist,
    off: m.unitFrames ? m.off / m.unitFrames : 0,
    states: Object.fromEntries(Object.entries(m.states).map(([k, v]) => [k, Math.round((100 * v) / m.unitFrames)])),
    fired: m.fired, wastedPct: m.fired ? m.wasted / m.fired : 0, heal: sim.player.hp - 1,
    bossFear: m.bossFrames ? m.bossFear / m.bossFrames : 0, bossHeld: m.bossFrames ? m.bossHeld / m.bossFrames : 0, ttk: m.ttk,
    diveStarts: m.diveStarts, sameTarget: m.sameTarget, maxReturn: m.maxReturn,
    spread: m.wolfFrames ? m.targetsDistinct / m.wolfFrames : null, longestChase: m.longestChase,
  };
}

const maxed = (wid) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, MAX]));
const zero = (wid) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, 0]));
const configs = [];
for (const wid of Object.keys(data.weapons)) {
  configs.push({ id: `${wid} r0`, wid, ranks: zero(wid), evo: null });
  configs.push({ id: `${wid} max`, wid, ranks: maxed(wid), evo: null });
  for (const [eid, e] of Object.entries(data.evolutions)) if (e.weapon === wid) {
    configs.push({ id: `  ${eid}`, wid, ranks: maxed(wid), evo: eid });
    const pairOnly = { ...zero(wid) }; for (const k of e.pair) pairOnly[k] = MAX;
    configs.push({ id: `  ${eid} (pair only)`, wid, ranks: pairOnly, evo: eid, only: ['swarm', 'single'] });
  }
}

const f0 = (v) => (v == null ? '-' : v.toFixed(0));
const pc = (v) => `${Math.round(v * 100)}%`;
for (const c of configs) {
  if (FILTER && !c.id.includes(FILTER)) continue;
  console.log(`\n== ${c.id}`);
  for (const s of Object.keys(SCEN)) {
    if (c.only && !c.only.includes(s)) continue;
    const r = run(c.wid, c.ranks, c.evo, s);
    const extra = [];
    if (r.fired) extra.push(`fired ${r.fired} wasted ${pc(r.wastedPct)}`);
    if (r.heal > 0.5) extra.push(`heal ${r.heal.toFixed(0)}hp`);
    if (s === 'boss') extra.push(`ttk ${r.ttk == null ? '>120' : r.ttk.toFixed(0)}s fear ${pc(r.bossFear)} held ${pc(r.bossHeld)}`);
    if (r.diveStarts) extra.push(`dives ${r.diveStarts} sameTgt ${r.sameTarget} maxReturn ${r.maxReturn.toFixed(2)}s`);
    if (r.spread != null && s.startsWith('swarm')) extra.push(`targets ${r.spread.toFixed(1)} longestChase ${r.longestChase.toFixed(1)}s`);
    console.log(`${s.padEnd(9)} hitsTaken/s ${r.contacts.toFixed(2)} dps ${f0(r.dps).padStart(5)} ovk ${pc(r.overkill).padStart(4)} hit/s ${r.hps.toFixed(1).padStart(5)} kill/s ${r.kps.toFixed(2)} units ${r.units.toFixed(1)} dist ${f0(r.avgDist)}/${f0(r.maxDist)} off ${pc(r.off)} st ${JSON.stringify(r.states)} ${extra.join(' | ')}`);
  }
}
