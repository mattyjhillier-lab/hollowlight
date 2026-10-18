// Rough balance probe: a simple bot plays whole runs headlessly.
// Usage: node scripts/bot.mjs [characterId] [seeds]   (ABILITY=off never triggers the active ability; GATES=starter|all|preset, default starter; META=none|half|full; FOCUS=1; PREFER_W=<weapon id> takes that weapon first)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { compileTree, presetTree, aggregateMods } from '../src/meta/tree.js';
import { TIER_IDS, tierIndex } from '../src/sim/tiers.js';
import { loadTree } from '../src/meta/treefs.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
// Probe knobs (balance experiments only; default off): ENEMY_PATCH='{"stoat_piper":{"ai":{"shotDmg":0}}}' merges into enemy data (ai merged one
// level deep); NO_ENEMY=a,b drops those waves. Ids/keys are checked against the shipped data (unknown keys ignored).
if (process.env.ENEMY_PATCH) {
  const P = JSON.parse(process.env.ENEMY_PATCH);
  for (const id of Object.keys(P)) if (Object.hasOwn(data.enemies, id)) { const { ai, ...rest } = P[id]; data.enemies[id] = { ...data.enemies[id], ...rest, ...(ai ? { ai: { ...data.enemies[id].ai, ...ai } } : {}) }; }
}
if (process.env.WAVE_PATCH) { const P = JSON.parse(process.env.WAVE_PATCH); for (const ch of Object.values(data.chapters)) for (const w of ch.waves) if (Object.hasOwn(P, w.enemy)) Object.assign(w, P[w.enemy]); } // WAVE_PATCH='{"stoat_piper":{"maxAlive":4}}'
if (process.env.NO_ENEMY) { const drop = process.env.NO_ENEMY.split(','); for (const ch of Object.values(data.chapters)) ch.waves = ch.waves.filter((w) => !drop.includes(w.enemy)); }
data.tree = loadTree(data).live; // fragments in src/data/tree/ (src/meta/treedata.js)
data.tiers = load('tiers'); // difficulty tiers (src/data/tiers.json)
// TIER=normal|hard|expert (Twilight / Deep Dusk / Long Night; default normal = byte-identical to before tiers existed)
export const TIER = TIER_IDS.includes(process.env.TIER) ? process.env.TIER : 'normal';
// BLESS=off drops the Blessing pool (identical to the pre-BLESS-1 game); BLESSPICK=random|defence|offence is the bot's Blessing taste.
export const PREFER_W = /^[a-z_]{1,32}$/.test(process.env.PREFER_W || '') ? process.env.PREFER_W : null;
export const BLESS = process.env.BLESS === 'off' ? 'off' : 'on';
export const BLESSPICK = ['defence', 'offence'].includes(process.env.BLESSPICK) ? process.env.BLESSPICK : 'random';
try { if (BLESS === 'on') data.blessings = load('blessings'); } catch { /* baseline checkout: no blessings.json */ }
const BPREF = { defence: { maxHp: 1.2, pickup: 0.6, gold: 0.3, damage: 0.3, speed: 0.8 }, offence: { damage: 1.2, speed: 0.8, maxHp: 0.4, pickup: 0.4, gold: 0.3 } };

// META=none|half|full buys a preset of the skill tree (ignores unlock conditions) for balance probes.
// GATES decides the gated content (3 weapons + 9 evolutions, tree gates since G1b):
//   starter (default) = a brand-new save: only Wolves + Orbit + the 2 starter evolutions;
//   all     = every gated weapon/evolution open (the pre-G1b base game; META presets then buy non-gate nodes only);
//   preset  = the META preset also buys the 12 gate nodes (half = cheapest-first, so the cheap gates open first).
export const GATES = process.env.GATES === 'all' ? 'all' : process.env.GATES === 'preset' ? 'preset' : 'starter';
const treeDef = compileTree(data.tree, data);
export function metaTree(name = process.env.META || 'none') {
  return name === 'none' ? null : aggregateMods(presetTree(treeDef, name, GATES === 'preset'), treeDef, data, { tier: tierIndex(TIER) });
}

export function withGates(t) {
  if (GATES !== 'all') return t;
  const weapons = Object.keys(data.weapons).filter((i) => data.weapons[i].treeGate);
  const evolutions = Object.keys(data.evolutions).filter((i) => data.evolutions[i].treeGate);
  if (!weapons.length && !evolutions.length) return t;
  const base = t || aggregateMods({}, treeDef, data);
  return { ...base, unlocks: { ...base.unlocks, weapons: [...(base.unlocks?.weapons || []), ...weapons], evolutions: [...(base.unlocks?.evolutions || []), ...evolutions] } };
}

// DODGE MODEL (EN3-EN5; docs/design/enemies-v1.md section 7): the bot cannot "see" telegraphs, so without this every thorn, burst ring and
// charge lane would hit it. A simple human-like heuristic, applied only when a threat is IMMINENT (a first version that steered away from every
// lane all the time cost the bot more than the thorns did: measured, see docs/LOCKED.md EN3):
//  - thorns in flight (visible, slow): if one will pass within reach in the next 0.9 s, side-step perpendicular to its path;
//  - toad fuse ring / hart charge lane: noticed after a 0.35 s reaction delay from the tell start, then step out of the ring / out of the lane.
// While a dodge is active it takes over the steering (a short side-step); the normal flee/gem steering keeps 80% weight (DODGE_KEEP). DODGE=0 turns it
// off (results are reported ON and OFF).
export const DODGE = process.env.DODGE !== '0';
const REACT = 0.35;
const DODGE_KEEP = Number(process.env.DODGE_KEEP || 0.8); // weight the normal steering keeps while a dodge is active (0.35 measured worse: the bot ran into crowds)
const _d = [0, 0];
// adds a perpendicular push if the hero is inside the lane (origin o, unit dir d, half width, length); returns 1 if it did
function laneAway(p, ox, oy, dx, dy, half, len, out) {
  const rx = p.x - ox, ry = p.y - oy, along = rx * dx + ry * dy;
  if (along < -half || along > len) return 0;
  const px = rx - dx * along, py = ry - dy * along, pd = Math.hypot(px, py);
  if (pd >= half) return 0;
  if (pd < 0.5) { out[0] += -dy; out[1] += dx; } else { out[0] += px / pd; out[1] += py / pd; }
  return 1;
}
// returns the dodge direction in out (unit length) and 1 if a threat is imminent, else 0
export function dodgeVec(sim, out = _d) {
  out[0] = 0; out[1] = 0;
  const p = sim.player;
  let n = 0;
  for (const s of sim.eshots || []) {
    const sp = Math.hypot(s.vx, s.vy) || 1, dx = s.vx / sp, dy = s.vy / sp;
    n += laneAway(p, s.x, s.y, dx, dy, p.r + s.r + 4, sp * 0.9, out);
  }
  for (const e of sim.enemies) {
    if (!e.ai || e.dead) continue;
    const A = e.ai;
    if (A.kind === 'charger' && e.state === 'charge') { n += laneAway(p, e.x, e.y, e.dx, e.dy, p.r + e.r + 8, e.speed * A.chargeMul * e.stT + 10, out); continue; }
    if (!e.tele) continue;
    const age = (A.tell ?? A.fuse ?? 0) - e.stT;
    if (age < REACT) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (A.kind === 'fuse') { if (d < A.burstR + p.r + 4) { out[0] += dx / d; out[1] += dy / d; n++; } }
    else if (A.kind === 'charger') n += laneAway(p, e.x, e.y, e.dx, e.dy, p.r + e.r + 8, e.speed * A.chargeMul * A.charge + 10, out);
  }
  const m = Math.hypot(out[0], out[1]);
  if (!n || m < 1e-6) { out[0] = 0; out[1] = 0; return 0; }
  out[0] /= m; out[1] /= m;
  return 1;
}

function botInput(sim) {
  const p = sim.player;
  let ax = 0, ay = 0;
  for (const e of sim.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 90 * 90) {
      const d = Math.sqrt(d2) || 1;
      const w = (90 - d) / 90 * (e.boss ? 2.5 : 1);
      ax += (dx / d) * w; ay += (dy / d) * w;
    }
  }
  let best = null, bd = 200 * 200;
  for (const g of sim.gems) {
    const dx = g.x - p.x, dy = g.y - p.y, d2 = dx * dx + dy * dy;
    if (d2 < bd) { bd = d2; best = g; }
  }
  if (best) {
    const d = Math.sqrt(bd) || 1;
    ax += ((best.x - p.x) / d) * 0.6; ay += ((best.y - p.y) / d) * 0.6;
  }
  if (DODGE && dodgeVec(sim)) { const m = Math.hypot(ax, ay) || 1; ax = (ax / m) * DODGE_KEEP + _d[0]; ay = (ay / m) * DODGE_KEEP + _d[1]; }
  // drift back toward world centre when near the edge
  const c = sim.balance.worldSize / 2;
  ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay, ability: process.env.ABILITY !== 'off' && sim.ability.cdLeft <= 0 && sim.enemies.length > 25 };
}

function pick(sim, rng) {
  const offer = sim.offer;
  if (offer.gold.length) return offer.gold[0].key;
  // Rerolls: redraw a hand with no weapon card and no stat already in progress. Banish: drop fallback cards.
  if (sim.banishesLeft > 0) { const f = offer.cards.find((c) => c.kind === 'fallback' && c.fallback !== 'heal'); if (f && sim.banish(f.key)) return pick(sim, rng); }
  if (sim.rerollsLeft > 0 && !offer.cards.some((c) => c.kind === 'weapon' || (c.kind === 'stat' && c.rank >= 1)) && sim.reroll()) return pick(sim, rng);
  // prefer to finish a stat pair: weight cards toward stats already ranked
  const cards = offer.cards;
  const focus = process.env.FOCUS === '1';
  const w = cards.map((c) => (c.kind === 'blessing' ? (BPREF[BLESSPICK]?.[c.effect] ?? 0.3) : c.kind === 'stat' ? (focus ? 1 + c.rank * c.rank * 3 : 1 + c.rank * 1.5) : c.kind === 'weapon' ? (focus ? (sim.weapons.length < 2 ? 3 : 0.2) : 2) : 0.3));
  if (PREFER_W) for (let i = 0; i < cards.length; i++) if (cards[i].kind === 'weapon' && cards[i].weaponId === PREFER_W) w[i] *= 30; // PREFER_W=spirit_bolts: a weapon-first bot (default off, rng use unchanged)
  let t = w.reduce((a, b) => a + b, 0) * rng();
  for (let i = 0; i < cards.length; i++) { t -= w[i]; if (t <= 0) return cards[i].key; }
  return cards[0].key;
}

export function playRun(charId, seed, opts = {}) {
  const sim = new Sim({ data, characterId: charId, seed, meta: opts.meta || {}, tree: withGates(opts.tree !== undefined ? opts.tree : metaTree()), tier: TIER });
  let s = seed * 9301 + 49297;
  const rng = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const DT = 1 / 60;
  const marks = {};
  let levelups = 0, filler = 0, dead = 0, short = 0, blessPicks = 0, healSwaps = 0, hpLost = 0; // filler = level-ups whose first-shown offer was only fallback cards (heal/gold/xp)
  const t0 = Date.now();
  while (sim.state === 'running' || sim.state === 'levelup') {
    if (sim.state === 'levelup') {
      levelups++;
      if (!sim.offer.gold.length && sim.offer.cards.every((c) => c.kind === 'fallback')) { filler++; if (marks.filler === undefined) marks.filler = Math.round(sim.time); }
      const real = sim.offer.cards.filter((c) => c.kind === 'weapon' || c.kind === 'stat' || c.kind === 'evolution').length + sim.offer.gold.length;
      if (real === 0) { dead++; if (marks.dead === undefined) marks.dead = Math.round(sim.time); }
      if (real < 3) { short++; if (marks.short === undefined) marks.short = Math.round(sim.time); }
      if (sim.offer.cards.some((c) => c.kind === 'blessing') && marks.bless === undefined) marks.bless = Math.round(sim.time);
      if (opts.onOffer) opts.onOffer(sim);
      const key = pick(sim, rng);
      if (key.startsWith('b:')) blessPicks++;
      if (key === 'f:heal' && sim.offer?.cards.some((c) => c.key === key && c.swapped)) healSwaps++;
      sim.pickCard(key);
      continue;
    }
    const hp0 = sim.player.hp;
    sim.step(DT, botInput(sim));
    if (sim.player.hp < hp0) hpLost += hp0 - sim.player.hp;
    if (marks.bossKill === undefined && sim.bossKilled) marks.bossKill = Math.round(sim.time);
    if (marks.evo === undefined && sim.weapons.some((w) => w.evo)) marks.evo = Math.round(sim.time);
    const m = Math.floor(sim.time / 60);
    if (sim.time % 60 < DT && !marks[m]) marks[m] = { lvl: sim.level, hp: Math.round(sim.player.hp), en: sim.enemies.length };
  }
  const r = sim.result();
  const ev = (t) => sim.events.filter((e) => e.type === t).length;
  return { ...r, hurtBy: { ...sim.hurtBy }, levelups, filler, hearts: ev("heart"), magnets: ev("magnet"), hurts: ev("hurt"), dead, short, blessPicks, healSwaps, hpLost, dmg: sim.damageDealt, alive: sim.enemies.length, wall: (Date.now() - t0) / 1000, marks, evolved: sim.weapons.filter((w) => w.evo).map((w) => w.evo), weaponIds: sim.weapons.map((w) => w.id) };
}

if (process.argv[1] && process.argv[1].endsWith('bot.mjs')) {
  const char = process.argv[2] || 'wren';
  const seeds = Number(process.argv[3] || 3);
  console.error(`bot: GATES=${GATES} META=${process.env.META || 'none'}`);
  for (let sd = 1; sd <= seeds; sd++) {
    const r = playRun(char, sd);
    console.log(`${char} seed ${sd}: ${r.outcome} at ${Math.round(r.time)}s, level ${r.level}, kills ${r.kills}, gold ${r.gold}, boss killed ${r.bossKilled}, weapons ${r.weaponIds.join('+')} evolutions [${r.evolved.join(',')}] firstEvo ${r.marks.evo ?? '-'}s filler ${r.filler}/${r.levelups} first@${r.marks.filler ?? '-'}s (sim ${r.wall.toFixed(1)}s)`);
  }
}
