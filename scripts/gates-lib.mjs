// Progression-gates probe library. READ-ONLY w.r.t. src/: all gating is done by passing modified data
// into the unmodified Sim (weapon treeGate flag + tree.unlocks.weapons, filtered data.evolutions).
// Design: docs/design/progression-gates-v1.md
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { compileTree, presetTree, aggregateMods, conditionProgress } from '../src/meta/tree.js';
import { loadTree } from '../src/meta/treefs.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
export const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
base.tree = loadTree(base).live; // fragments in src/data/tree/
export const treeDef = compileTree(base.tree, base);

// ---- proposed starter kits (pool at run 1). The signature weapon is always owned at start.
export const KITS = {
  wren: ['ghost_wolves', 'holy_orbit'],
  elias: ['holy_orbit', 'ghost_wolves'],
}; // global starter pool = both signature weapons (measured: Spirit Bolts as a starter is the easy mode, Ravens the weak one)
export const STARTER_EVOS = ['howling_legion', 'sanctum_halo'];

// ---- proposed gates, in learning-curve order. cond = existing tree.js condition types only.
export const GATES = [
  { id: 'phantom_stampede', kind: 'evo', cond: { t: 'evolveWeapon', id: 'ghost_wolves', n: 1 } },
  { id: 'judgement_wheel', kind: 'evo', cond: { t: 'evolveWeapon', id: 'holy_orbit', n: 1 } },
  { id: 'raven_flock', kind: 'weapon', cond: { t: 'killEnemy', id: 'crow', n: 4500 } },
  { id: 'dive_bombers', kind: 'evo', cond: { t: 'evolveWeapon', id: 'any', n: 4 } },
  { id: 'spirit_bolts', kind: 'weapon', cond: { t: 'killEnemy', id: 'root_crawler', n: 1500 } },
  { id: 'dire_alpha', kind: 'evo', cond: { t: 'all', of: [{ t: 'evolveWeapon', id: 'ghost_wolves', n: 3 }, { t: 'killEnemy', id: 'wolf', n: 10000 }] } },
  { id: 'spirit_tempest', kind: 'evo', cond: { t: 'all', of: [{ t: 'bossKill', id: 'elder_treant', n: 1 }, { t: 'evolveWeapon', id: 'any', n: 6 }] } },
  { id: 'murder_storm', kind: 'evo', cond: { t: 'all', of: [{ t: 'evolveWeapon', id: 'raven_flock', n: 1 }, { t: 'killEnemy', id: 'crow', n: 12000 }] } },
  { id: 'chain_lightning', kind: 'weapon', cond: { t: 'all', of: [{ t: 'bossKill', id: 'elder_treant', n: 2 }, { t: 'killEnemy', id: 'root_crawler', n: 2500 }] } },
  { id: 'soul_lance', kind: 'evo', cond: { t: 'all', of: [{ t: 'bossKill', id: 'elder_treant', n: 2 }, { t: 'evolveWeapon', id: 'spirit_bolts', n: 1 }] } },
  { id: 'static_storm', kind: 'evo', cond: { t: 'evolveWeapon', id: 'any', n: 12 } },
  { id: 'thunder_judgment', kind: 'evo', cond: { t: 'all', of: [{ t: 'clearChapter', id: 'cursed_forest', n: 3 }, { t: 'evolveWeapon', id: 'chain_lightning', n: 1 }] } },
  { id: 'spearhead', kind: 'evo', cond: { t: 'all', of: [{ t: 'evolveWeapon', id: 'raven_flock', n: 3 }, { t: 'killEnemy', id: 'crow', n: 20000 }] } }, // W9: late gate 13 (counts estimated)
  { id: 'returning_pages', kind: 'evo', cond: { t: 'all', of: [{ t: 'evolveWeapon', id: 'spirit_bolts', n: 2 }, { t: 'clearChapter', id: 'cursed_forest', n: 2 }] } }, // W10d: late gate (counts per third-evolutions.md section 7, estimated)
  { id: 'storm_tether', kind: 'evo', cond: { t: 'all', of: [{ t: 'evolveWeapon', id: 'chain_lightning', n: 2 }, { t: 'bossKill', id: 'elder_treant', n: 5 }] } }, // W11d: late gate 15 (counts estimated)
  { id: 'vesper_tide', kind: 'evo', cond: { t: 'all', of: [{ t: 'evolveWeapon', id: 'holy_orbit', n: 3 }, { t: 'useCharacter', id: 'elias', n: 8 }] } }, // W12: late gate 16 (counts estimated)
];

export function unlockedAfter(stats) {
  const weapons = new Set(), evos = new Set(), done = [];
  for (const g of GATES) {
    if (conditionProgress(g.cond, stats, treeDef, base).done) { (g.kind === 'weapon' ? weapons : evos).add(g.id); done.push(g.id); }
  }
  return { weapons, evos, done };
}

// Data copy where every weapon is tree-gated; the caller passes the allowed weapons via tree.unlocks.weapons.
export function gatedData(allowedEvos) {
  const weapons = Object.fromEntries(Object.entries(base.weapons).map(([k, w]) => [k, { ...w, treeGate: true }]));
  // shipped evolutions carry treeGate since G1b; the probe gates them by filtering, so strip the flag (else tree.unlocks.evolutions would be needed too)
  const evolutions = Object.fromEntries(Object.entries(base.evolutions).filter(([k]) => allowedEvos.has(k)).map(([k, e]) => { const { treeGate, ...rest } = e; return [k, rest]; }));
  return { ...base, weapons, evolutions };
}

// ---- soft cap (applied to aggregateMods output): total = cap * (1 - exp(-sum/cap)); negatives pass through.
export const SOFT = {
  // percent caps per stat category (the asymptote of the positive total)
  mod_damage: 20, mod_area: 20, mod_cooldown: 15, mod_speed: 10, mod_pickup: 40, mod_xp: 25, mod_gold: 40, mod_abilityCd: 40,
  maxHp: 20, levelHeal: 6, heart: 100, magnet: 100, heartHeal: 60, abilityDur: 40,
  w_power: 25, w_other: 20,
};
const sc = (s, cap) => (s <= 0 ? s : cap * (1 - Math.exp(-s / cap)));
export function softCap(agg, caps = SOFT, scale = 1) {
  if (!agg) return agg;
  const o = JSON.parse(JSON.stringify(agg));
  const P = (v, cap) => 1 + sc((v - 1) * 100, cap * scale) / 100;
  for (const k of ['damage', 'area', 'speed', 'pickup', 'xp', 'gold']) o.mods[k] = P(agg.mods[k], caps[`mod_${k}`]);
  for (const k of ['cooldown', 'abilityCd']) { const red = (1 - agg.mods[k]) * 100; o.mods[k] = 1 - sc(red, caps[`mod_${k}`] * scale) / 100; }
  o.player.maxHp = P(agg.player.maxHp, caps.maxHp);
  o.player.levelHeal = sc(agg.player.levelHeal, caps.levelHeal * scale);
  for (const k of ['heart', 'magnet', 'heartHeal']) o.drops[k] = P(agg.drops[k], caps[k]);
  o.ability.dur = P(agg.ability.dur, caps.abilityDur);
  for (const w of Object.values(o.weaponBonus)) for (const [stat, b] of Object.entries(w)) b.pct = sc(b.pct, (stat === 'power' ? caps.w_power : caps.w_other) * scale);
  return o;
}

// spec: { preset:'none'|'half'|'full'|number, soft?:bool, caps?, scale?, noVerbs?:bool }
export function buildTree(spec) {
  if (!spec || spec.preset === 'none') return null;
  let agg = aggregateMods(presetTree(treeDef, spec.preset), treeDef, base);
  if (spec.soft) agg = softCap(agg, spec.caps || SOFT, spec.scale || 1);
  for (const g of spec.strip || []) {
    if (g === 'rerolls') { agg.meta.rerolls = 0; agg.meta.banishes = 0; }
    if (g === 'revive') agg.player.revive = 0;
    if (g === 'perks') { agg.rush = null; agg.evoLuck = 1; }
    if (g === 'auto') agg.ability.autoHp = 0;
    if (g === 'heal') { agg.player.levelHeal = 0; agg.drops = { heart: 1, magnet: 1, heartHeal: 1 }; }
    if (g === 'flat') for (const w of Object.values(agg.weaponBonus)) for (const b of Object.values(w)) b.add = 0;
    if (g === 'ability') { agg.mods.abilityCd = 1; agg.ability.dur = 1; }
  }
  return agg;
}

// ---- bot (same logic as scripts/bot.mjs, parameterised by data/focus so it needs no env or src edits)
function botInput(sim) {
  const p = sim.player;
  let ax = 0, ay = 0;
  for (const e of sim.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy;
    if (d2 < 90 * 90) { const d = Math.sqrt(d2) || 1; const w = (90 - d) / 90 * (e.boss ? 2.5 : 1); ax += (dx / d) * w; ay += (dy / d) * w; }
  }
  let best = null, bd = 200 * 200;
  for (const g of sim.gems) { const dx = g.x - p.x, dy = g.y - p.y, d2 = dx * dx + dy * dy; if (d2 < bd) { bd = d2; best = g; } }
  if (best) { const d = Math.sqrt(bd) || 1; ax += ((best.x - p.x) / d) * 0.6; ay += ((best.y - p.y) / d) * 0.6; }
  const c = sim.balance.worldSize / 2;
  ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay, ability: sim.ability.cdLeft <= 0 && sim.enemies.length > 25 };
}
function pick(sim, rng, focus) {
  const offer = sim.offer;
  if (offer.gold.length) return offer.gold[0].key;
  if (offer.start === 'favour') return offer.cards[0].key; // T6 Favoured Spirit: the bot marks its hero's own weapon (listed first)
  if (sim.banishesLeft > 0) { const f = offer.cards.find((c) => c.kind === 'fallback'); if (f && sim.banish(f.key)) return pick(sim, rng, focus); }
  if (sim.rerollsLeft > 0 && !offer.cards.some((c) => c.kind === 'weapon' || (c.kind === 'stat' && c.rank >= 1)) && sim.reroll()) return pick(sim, rng, focus);
  const cards = offer.cards;
  const w = cards.map((c) => (c.kind === 'stat' ? (focus ? 1 + c.rank * c.rank * 3 : 1 + c.rank * 1.5) : c.kind === 'weapon' ? (focus ? (sim.weapons.length < 2 ? 3 : 0.2) : 2) : 0.3));
  let t = w.reduce((a, b) => a + b, 0) * rng();
  for (let i = 0; i < cards.length; i++) { t -= w[i]; if (t <= 0) return cards[i].key; }
  return cards[0].key;
}

// cfg: { hero, seed, focus, weapons:[unlocked gate weapons; the hero kit is added], evos:[unlocked evolutions], tree:aggregate|null }
export function playGated(cfg) {
  const evos = new Set(cfg.evos);
  const data = gatedData(evos);
  const allowed = new Set([...(cfg.kit || KITS[cfg.hero]), ...cfg.weapons]);
  const tree = cfg.tree ? JSON.parse(JSON.stringify(cfg.tree)) : {};
  tree.unlocks = { weapons: [...allowed], heroes: [], abilityUpgrades: [], modifiers: [] };
  const sim = new Sim({ data, characterId: cfg.hero, seed: cfg.seed, meta: {}, tree, startWeapon: cfg.startWeapon || null });
  let s = cfg.seed * 9301 + 49297;
  const rng = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const DT = 1 / 60;
  let firstEvo = null;
  while (sim.state === 'running' || sim.state === 'levelup') {
    if (sim.state === 'levelup') { sim.pickCard(pick(sim, rng, cfg.focus)); continue; }
    sim.step(DT, botInput(sim));
    if (firstEvo === null && sim.weapons.some((w) => w.evo)) firstEvo = Math.round(sim.time);
  }
  return { ...sim.result(), firstEvo };
}

export const fmtT = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
export const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
export const pctl = (a, p) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : null);

// ---- worker pool: jobs = [{key, cfg}] -> Map key -> [res]
import { Worker } from 'node:worker_threads';
export async function runJobs(jobs, concurrency = 11, chunk = 6) {
  const chunks = [];
  for (let i = 0; i < jobs.length; i += chunk) chunks.push(jobs.slice(i, i + chunk));
  const out = new Map();
  let next = 0;
  const workerUrl = new URL('./gates-worker.mjs', import.meta.url);
  const lane = async () => {
    while (next < chunks.length) {
      const jobsChunk = chunks[next++];
      const res = await new Promise((resolve, reject) => {
        const w = new Worker(workerUrl, { workerData: { jobs: jobsChunk } });
        w.on('message', resolve); w.on('error', reject);
      });
      for (const r of res) { if (!out.has(r.key)) out.set(r.key, []); out.get(r.key).push(r.res); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, lane));
  return out;
}

export function summarise(runs) {
  const n = runs.length;
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const evo = runs.map((r) => r.firstEvo).filter((v) => v != null);
  return { n, win: Math.round((wins / n) * 100), lvl: med(runs.map((r) => r.level)), evo: fmtT(med(evo)), evoN: evo.length, evos: (runs.reduce((a, r) => a + r.evos, 0) / n).toFixed(1), time: fmtT(med(runs.map((r) => r.time))) };
}

// Standard grid: heroes x bots, SEEDS seeds each. rows = [{name, weapons, evos, treeSpec}]
export async function runGrid(rows, seeds = 48, heroes = ['wren', 'elias'], concurrency = 11) {
  const jobs = [];
  for (const row of rows) for (const hero of heroes) for (const focus of [false, true]) for (let seed = 1; seed <= seeds; seed++) {
    jobs.push({ key: `${row.name}|${hero}|${focus ? 'focus' : 'random'}`, cfg: { hero, seed, focus, weapons: row.weapons, evos: row.evos, treeSpec: row.treeSpec } });
  }
  return runJobs(jobs, concurrency);
}
export function printGrid(rows, res, heroes = ['wren', 'elias']) {
  const cols = heroes.flatMap((h) => ['random', 'focus'].map((b) => `${h}/${b}`));
  console.log(`${'row'.padEnd(34)} ${cols.map((c) => c.padStart(14)).join(' ')}   (win% | median level | first evo)`);
  for (const row of rows) {
    const cells = [];
    for (const h of heroes) for (const b of ['random', 'focus']) {
      const s = summarise(res.get(`${row.name}|${h}|${b}`));
      cells.push(`${String(s.win).padStart(3)}% L${s.lvl} ${s.evo}`.padStart(14));
    }
    console.log(`${row.name.padEnd(34)} ${cells.join(' ')}`);
  }
}
