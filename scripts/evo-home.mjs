// Second review (read-only analysis): every evolution vs its base weapon against MORTAL enemies (real hp at minute 8 / boss at 10),
// multi-seed, in four scenarios: single (immortal dummy at 30 px), swarm (stand still in 60 refilled foes), kite (bot-style
// kiting through 60 foes), stream40 (40 immortal walkers, raw output, no kill saturation), boss (Elder Treant walking in; DPS on the boss only, first 40 s).
// Rank modes: pick = recipe pair at 5, every other stat at PICK (default 2; evolved weapons are final, so this is the rest of
// the run for a player who evolves at once); max = all 5.
// Columns: cap@pick = evo@pick / base@pick (locked 3x cap at pick time), home@max = evo@max / base@max (locked 1.8-2.3x home
// band), worth = evo@pick / base@max (is evolving now better than skipping the card and ranking the base weapon to max?).
// Usage: node scripts/evo-home.mjs [seeds=3] [pickRank=2] [filter]   (optional TUNE env, see below)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
const data = {
  ...base,
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 },
    walker: { name: 'Walker', hp: 1e9, speed: 40, dmg: 0, r: 7, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
// Optional in-memory tune override for what-if checks (data only, never written): TUNE='{"judgement_wheel":{"dmg":1.3}}'
if (process.env.TUNE) for (const [id, t] of Object.entries(JSON.parse(process.env.TUNE))) {
  if (!Object.hasOwn(data.evolutions, id)) throw new Error(`unknown evolution ${id}`);
  data.evolutions = { ...data.evolutions, [id]: { ...data.evolutions[id], tune: { ...data.evolutions[id].tune, ...t } } };
}
const DT = 1 / 60;
const MAX = base.balance.maxRank;
const SEEDS = Number(process.argv[2] || 3);
const PICK = Number(process.argv[3] ?? 2);
const FILTER = process.argv[4] || '';
// TEAM=1 (+ MATE=rank, default 3 at pick, 5 at max): teammates Ghost Wolves, Holy Orbit, Spirit Bolts; the number is then TEAM damage (Talon Mark yardstick).
const TEAM = process.env.TEAM === '1';
const MATE = Number(process.env.MATE ?? 3);

const ring = (sim, type, n, r0, r1) => {
  const p = sim.player;
  for (let i = 0; i < n; i++) {
    const a = sim.rng.range(0, 6.2832);
    const d = r0 + sim.rng.next() * (r1 - r0);
    sim.spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
  }
};
const refill = (sim) => { const k = 60 - sim.enemies.filter((e) => !e.dead).length; if (k > 0) ring(sim, sim.rng.chance(0.5) ? 'wolf' : 'crow', k, 160, 220); };
function kite(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { const w = (90 - d) / 90 * (e.boss ? 2.5 : 1); ax += dx / d * w; ay += dy / d * w; } }
  const c = sim.balance.worldSize / 2; ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay };
}
const SCEN = {
  single: { secs: 15, setup: (s) => ring(s, 'dummy', 1, 30, 30) },
  swarm: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill },
  kite: { secs: 20, setup: (s) => { s.time = 480; refill(s); }, tick: refill, input: kite },
  // stream40: 40 IMMORTAL walkers (as evo-same-ranks), never saturates on kills: raw output, best for the cap check.
  stream40: { secs: 20, setup: (s) => ring(s, 'walker', 40, 25, 170), tick: (s) => { const p = s.player; for (const e of s.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 14) { const a = s.rng.range(0, 6.2832); e.x = p.x + Math.cos(a) * 170; e.y = p.y + Math.sin(a) * 170; } } },
  boss: { secs: 40, setup: (s) => { s.time = 600; s.bossE = s.spawnEnemy('elder_treant', s.player.x + 70, s.player.y); }, bossOnly: true },
};

function run(wid, ranks, evo, scen, seed) {
  const sc = SCEN[scen];
  const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
  sim.weapons.length = 0;
  sim.patches = [];
  sim.ability.cdLeft = 1e9;
  sim.rollDrops = () => {};
  sim.debugGrant(wid, ranks, evo);
  if (TEAM) for (const m of ['ghost_wolves', 'holy_orbit', 'spirit_bolts']) sim.debugGrant(m, Object.fromEntries(Object.keys(data.weapons[m].stats).map((k) => [k, Object.values(ranks).every((v) => v === MAX) ? MAX : MATE])), null);
  sc.setup(sim);
  let eff = 0;
  const orig = sim.hurt.bind(sim);
  // counts the damage AFTER temporary amps (Mark, srcAmps), capped at the foe's remaining hp; TEAM=1 adds teammates (wolves, orbit, bolts) = team damage
  sim.hurt = (e, a, o = {}) => { const hp0 = e.hp, was = e.dead; const r = orig(e, a, o); if (!was && r > 0 && (!sc.bossOnly || e === sim.bossE)) eff += Math.min(r, Math.max(0, hp0)); return r; };
  const n = Math.round(sc.secs / DT);
  let f = 0;
  for (; f < n; f++) {
    if (sc.tick) sc.tick(sim);
    sim.step(DT, sc.input ? sc.input(sim) : {});
    if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    if (sc.bossOnly && sim.bossE.dead) { f++; break; }
  }
  return eff / (f * DT);
}
const ranksOf = (wid, pair, mode) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, mode === 'max' || pair.includes(k) ? MAX : PICK]));
const stats = (fn) => { const v = Array.from({ length: SEEDS }, (_, i) => fn(i + 1)); const m = v.reduce((a, b) => a + b, 0) / v.length; return { m, lo: Math.min(...v), hi: Math.max(...v) }; };

const r2 = (a, b) => (b.m > 0.5 ? (a.m / b.m).toFixed(2) + 'x' : a.m > 0.5 ? ' INF ' : '  -  ');
console.log(`Mortal-enemy probe, ${SEEDS} seeds, pick = pair 5 + others ${PICK}. cell: cap@pick | home@max | worth (evo@pick/base@max); dps evo@max [seed min-max]`);
const baseCache = new Map();
const baseDps = (wid, ranks, sc) => { const k = `${wid}|${JSON.stringify(ranks)}|${sc}`; if (!baseCache.has(k)) baseCache.set(k, stats((sd) => run(wid, ranks, null, sc, sd))); return baseCache.get(k); };
for (const [eid, e] of Object.entries(data.evolutions)) {
  if (FILTER && !eid.includes(FILTER)) continue;
  const rp = ranksOf(e.weapon, e.pair, 'pick');
  const rm = ranksOf(e.weapon, e.pair, 'max');
  const cells = [];
  for (const sc of Object.keys(SCEN)) {
    const bp = baseDps(e.weapon, rp, sc), bm = baseDps(e.weapon, rm, sc);
    const ep = stats((sd) => run(e.weapon, rp, eid, sc, sd)), em = stats((sd) => run(e.weapon, rm, eid, sc, sd));
    cells.push(`${sc} ${r2(ep, bp)} | ${r2(em, bm)} | ${r2(ep, bm)}  ${em.m.toFixed(0)} [${em.lo.toFixed(0)}-${em.hi.toFixed(0)}] base ${bm.m.toFixed(0)}`);
  }
  console.log(`${eid}\n   ${cells.join('\n   ')}`);
}
