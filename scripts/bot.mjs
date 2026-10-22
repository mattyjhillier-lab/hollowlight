// Rough balance probe: a simple bot plays whole runs headlessly.
// Usage: node scripts/bot.mjs [characterId] [seeds]   (ABILITY=off never triggers the active ability; GATES=starter|all|preset, default starter; META=none|half|full; FOCUS=1; PREFER_W=<weapon id> takes that weapon first)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { compileTree, presetTree, aggregateMods } from '../src/meta/tree.js';
import { TIER_IDS, tierIndex } from '../src/sim/tiers.js';
import { loadTree } from '../src/meta/treefs.mjs';
import { tellHits } from '../src/sim/boss.js';

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
if (process.env.NO_MINI === '1') for (const ch of Object.values(data.chapters)) delete ch.minis; // EN6-EN8 ablation: no Branch-Mane, no chests
if (process.env.NO_CHEST === '1') data.balance = { ...data.balance, chest: { ...data.balance.chest, reach: -1e9 } }; // EN8 ablation: the Branch-Mane comes but its chest is never opened
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
    if ((A.kind === 'charger' || A.kind === 'alpha') && e.state === 'charge') { n += laneAway(p, e.x, e.y, e.dx, e.dy, p.r + e.r + 8, e.speed * A.chargeMul * e.stT + 10, out); continue; }
    if (!e.tele) continue;
    const age = (A.tell ?? A.fuse ?? 0) - e.stT;
    if (age < REACT) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (A.kind === 'fuse') { if (d < A.burstR + p.r + 4) { out[0] += dx / d; out[1] += dy / d; n++; } }
    else if (A.kind === 'charger' || A.kind === 'alpha') n += laneAway(p, e.x, e.y, e.dx, e.dy, p.r + e.r + 8, e.speed * A.chargeMul * A.charge + 10, out);
  }
  const m = Math.hypot(out[0], out[1]);
  if (!n || m < 1e-6) { out[0] = 0; out[1] = 0; return 0; }
  out[0] /= m; out[1] /= m;
  return 1;
}

// BOSS DODGE MODEL (Elder Treant, docs/design/boss-treant-v1.md (h)): the bot reads the live boss tells (sim.fight.tells) like a player reads the
// decals: it notices a tell REACT s after it starts, then steers at full weight to the nearest safe point (12 directions x 2 distances, the first
// point outside every live harmful zone and inside the ring). Thorn fan: step out of the cone sideways; ring of thorns: slide round to the nearest gap.
// Between tells it kites at KITE_MIN-KITE_MAX from the boss (outside slam reach, a lap round the ring), picking up gems within 60 u of its path and
// shying from adds. DODGE=0 keeps the kiting but ignores every tell (the no-dodge baseline).
export const KITE_MIN = 120, KITE_MAX = 170;
const SAFE_D = [40, 80];
function bossInput(sim, F) {
  const p = sim.player, b = sim.boss, A = F.arena;
  let ax = 0, ay = 0;
  const now = sim.time;
  if (DODGE) {
    let threat = false;
    for (const t of F.tells) if (t.harm && now - t.t0 >= REACT && tellHits(t, p.x, p.y, p.r + 4)) { threat = true; break; }
    if (threat) {
      let best = null, bd = Infinity;
      for (const d of SAFE_D) for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        if (Math.hypot(x - A.cx, y - A.cy) > A.r - p.r - 6) continue;
        if (b && Math.hypot(x - b.x, y - b.y) < 34) continue;
        let safe = true;
        for (const t of F.tells) if (t.harm && tellHits(t, x, y, p.r + 6)) { safe = false; break; }
        if (!safe) continue;
        const score = d + (b ? Math.max(0, 90 - Math.hypot(x - b.x, y - b.y)) * 0.3 : 0);
        if (score < bd) { bd = score; best = [x, y]; }
      }
      if (best) { const dx = best[0] - p.x, dy = best[1] - p.y, m = Math.hypot(dx, dy) || 1; return { x: dx / m, y: dy / m }; }
    }
    for (const t of F.tells) {
      if (now - t.t0 < REACT || !b) continue;
      const dx = p.x - t.x, dy = p.y - t.y, d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
      if (t.shape === 'fan') {
        let da = ang - Math.atan2(t.ay, t.ax); while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        if (Math.abs(da) < t.arc * (t.n - 1) / 2 + Math.atan2(p.r + 8, d)) { const s = da >= 0 ? 1 : -1; return { x: -dy / d * s, y: dx / d * s }; }
      } else if (t.shape === 'nova') {
        const slots = t.n + 2 * t.gaps, step = (2 * Math.PI) / slots, per = slots / t.gaps;
        let bestA = 0, bestD = Infinity; // gap centres: slot index g*per + 0.5 (the two empty slots)
        for (let g = 0; g < t.gaps; g++) { const ga = t.rot + (Math.ceil(g * per - 1e-9) + 0.5) * step; let da = ga - ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; if (Math.abs(da) < Math.abs(bestD)) { bestD = da; bestA = ga; } }
        if (Math.abs(bestD) * d > 4) { const s = bestD >= 0 ? 1 : -1; return { x: -dy / d * s, y: dx / d * s }; }
        return { x: 0, y: 0 };
      }
    }
  }
  // kite: hold KITE_MIN..KITE_MAX from the boss, circling; stay off the wall; shy from adds; take gems near the path
  if (b && !b.dead) {
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    const rad = d < KITE_MIN ? 1 : d > KITE_MAX ? -0.8 : 0;
    const side = F.kiteSide || (F.kiteSide = 1);
    ax += (dx / d) * rad + (-dy / d) * side * 0.8; ay += (dy / d) * rad + (dx / d) * side * 0.8;
  }
  const wx = p.x - A.cx, wy = p.y - A.cy, wd = Math.hypot(wx, wy) || 1;
  if (wd > A.r - 40) { ax -= (wx / wd) * 1.2; ay -= (wy / wd) * 1.2; }
  for (const e of sim.enemies) {
    if (e.boss || e.dead) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d < 50) { ax += (dx / d) * (50 - d) / 50; ay += (dy / d) * (50 - d) / 50; }
  }
  let g0 = null, gd = 60;
  for (const g of sim.gems) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < gd) { gd = d; g0 = g; } }
  if (g0) { ax += ((g0.x - p.x) / (gd || 1)) * 0.5; ay += ((g0.y - p.y) / (gd || 1)) * 0.5; }
  if (DODGE && dodgeVec(sim)) { const m = Math.hypot(ax, ay) || 1; ax = (ax / m) * DODGE_KEEP + _d[0]; ay = (ay / m) * DODGE_KEEP + _d[1]; }
  return { x: ax, y: ay };
}

function botInput(sim) {
  const p = sim.player;
  if (sim.fight && sim.fight.stage === 'fight') { const v = bossInput(sim, sim.fight); return { x: v.x, y: v.y, ability: process.env.ABILITY !== 'off' && sim.ability.cdLeft <= 0 }; }
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
  // EN8: a dropped Lantern Reliquary within 300 u is walked to (a player goes for it once the area is calm; the bot just heads over)
  for (const k of sim.pickups) if (k.type === 'chest') { const dx = k.x - p.x, dy = k.y - p.y, d = Math.hypot(dx, dy) || 1; if (d < 300) { ax += (dx / d) * 0.8; ay += (dy / d) * 0.8; } break; }
  if (DODGE && dodgeVec(sim)) { const m = Math.hypot(ax, ay) || 1; ax = (ax / m) * DODGE_KEEP + _d[0]; ay = (ay / m) * DODGE_KEEP + _d[1]; }
  // drift back toward world centre when near the edge
  const c = sim.balance.worldSize / 2;
  ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay, ability: process.env.ABILITY !== 'off' && sim.ability.cdLeft <= 0 && sim.enemies.length > 25 };
}

function pick(sim, rng) {
  const offer = sim.offer;
  if (offer.gold.length) return offer.gold[0].key;
  if (offer.start === 'favour') return offer.cards[0].key; // T6 Favoured Spirit: the bot marks its hero's own weapon (listed first)
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
      if (sim.offer.start && sim.offer.start.startsWith('chest')) { const key = pick(sim, rng); if (key.startsWith('b:')) blessPicks++; sim.pickCard(key); continue; } // EN8 chest choices are not level-ups
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
  return { ...r, hurtBy: { ...sim.hurtBy }, levelups, filler, hearts: ev("heart"), magnets: ev("magnet"), hurts: ev("hurt"), dead, short, blessPicks, healSwaps, hpLost, dmg: sim.damageDealt, alive: sim.enemies.length, wall: (Date.now() - t0) / 1000, minis: sim.miniKills, chests: sim.chests, chestTiers: sim.chestLog.slice(), boss: sim.fight ? { dmgBoss: sim.fight.dmgBoss, dmgAdds: sim.fight.dmgAdds, by: { ...sim.bossDmgBy }, hits: { ...sim.fight.byMove }, moves: sim.fight.moves, hpAtStart: sim.fight.hp0 ?? null } : null, marks, evolved: sim.weapons.filter((w) => w.evo).map((w) => w.evo), weaponIds: sim.weapons.map((w) => w.id) };
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
