// DT2 Hollow marks (docs/design/difficulty-tiers-economy-v1.md 3.2 'Hollow marks'; LOCKED 'DIFFICULTY TIERS'). Pure JS, no DOM.
// One readable affix per foe on the harder nights, one verb each: Ironbark (outlast it), Swiftshade (out-turn it), Emberwake (step out of
// it), Hollowheart (kill it first, Long Night only). Rolled on a SEPARATE seeded stream (sim.markRng) so Twilight, where the tier lists no
// marks, never draws from it and stays byte-identical. Never on the boss or its adds; the miniboss only gets the tier's `mini` kinds.
import { MARK_IDS } from './tiers.js';

export const MARKS = Object.freeze({
  ironbark: Object.freeze({ name: 'Ironbark', hp: 1.8, speed: 0.85 }),
  swiftshade: Object.freeze({ name: 'Swiftshade', hp: 0.8, speed: 1.3 }),
  emberwake: Object.freeze({ name: 'Emberwake', hp: 1, speed: 1 }),
  hollowheart: Object.freeze({ name: 'Hollowheart', hp: 1, speed: 1 }),
});
// Emberwake: on death a 28-unit ring; 0.6 s red-orange telegraph (no damage), then 1.2 s live, hitting for the foe's contact damage at
// most once per second (and inside the hero's i-frames). Cap on live rings (perf + fairness; a full cap skips new rings, never moves old ones).
export const EMBER = Object.freeze({ r: 28, tell: 0.6, live: 1.2, gap: 1, cap: 12 });
// Hollowheart: foes within 60 units move +15% faster while it lives (one boost, never stacks).
export const HEART = Object.freeze({ r: 60, speed: 1.15 });
export const MARK_GOLD = 5; // marked foes drop x5 gold

// Seed for the mark stream (a fixed odd mix of the run seed; never the main stream).
export const markSeed = (seed) => (Math.imul((seed >>> 0) ^ 0x4d41524b, 2654435761) ^ 0x9e3779b9) >>> 0;

// -> mark id or null for a fresh spawn. d = enemy data. Draws from rng ONLY when the tier has marks, the time has come and the foe may carry one.
export function rollMark(tier, rng, d, time, mini) {
  const M = tier.marks;
  if (!M || !(M.share > 0) || time < M.from || d.boss || d.fixed) return null;
  let kinds = mini ? M.mini : M.kinds;
  if (!Array.isArray(kinds)) return null;
  if (!(d.dmg > 0)) kinds = kinds.filter((k) => k !== 'emberwake'); // a foe with no contact damage (Puffback Toad) never carries an empty ring
  if (!kinds.length) return null;
  if (!(rng.next() < M.share)) return null;
  const k = kinds[Math.floor(rng.next() * kinds.length)];
  return MARK_IDS.includes(k) && Object.hasOwn(MARKS, k) ? k : null;
}

// Apply a mark to a live foe (hp keeps its current fraction; speed scales the base speed). Idempotent: a foe carries at most one mark.
export function applyMark(e, k) {
  if (!e || e.hmark || !Object.hasOwn(MARKS, k)) return false;
  const m = MARKS[k];
  e.hmark = k;
  e.hp *= m.hp; e.maxHp *= m.hp;
  e.speed *= m.speed;
  e.spd0 = e.speed;
  e.gold *= MARK_GOLD;
  return true;
}

// Hollowheart aura pass (call once per frame before movement, only when a Hollowheart lives): every foe within HEART.r of ANY live
// Hollowheart (not itself, not the boss) runs at spd0 x 1.15; everyone else back at spd0. Bosses / adds are never boosted.
export function heartAura(enemies, hearts) {
  const R2 = HEART.r * HEART.r;
  for (const e of enemies) {
    if (e.dead || e.boss || e.fight || e.bossAdd) continue;
    let on = false;
    for (const h of hearts) {
      if (h === e || h.dead) continue;
      const dx = e.x - h.x, dy = e.y - h.y;
      if (dx * dx + dy * dy < R2) { on = true; break; }
    }
    if (on === !!e.hhOn) continue;
    if (e.spd0 === undefined) e.spd0 = e.speed;
    e.hhOn = on;
    e.speed = on ? e.spd0 * HEART.speed : e.spd0;
  }
}

// Ember rings: step + damage. sim.embers = [{ id, x, y, t, dmg, next, src }]. Returns nothing; damages through sim.damagePlayer.
export function updateEmbers(sim, dt) {
  const p = sim.player;
  let any = false;
  for (const z of sim.embers) {
    z.t += dt;
    if (z.t >= EMBER.tell + EMBER.live) { z.dead = true; any = true; continue; }
    if (z.t < EMBER.tell || sim.state !== 'running') continue;
    const dx = p.x - z.x, dy = p.y - z.y, R = EMBER.r + p.r * 0.5;
    if (dx * dx + dy * dy < R * R && z.t >= z.next) {
      z.next = z.t + EMBER.gap;
      if (!(p.iframes > 0)) { sim.emberHits = (sim.emberHits || 0) + 1; sim.emberDmg = (sim.emberDmg || 0) + z.dmg; sim.lastEmberT = sim.time; } // fairness probe counters only
      sim.damagePlayer(z.dmg, z.src, { kind: 'ember', id: z.id, x: z.x, y: z.y });
    }
  }
  if (any) sim.embers = sim.embers.filter((z) => !z.dead);
}
