// CHARACTER SYSTEM v2 (LOCKED 2026-10-24; docs/design/characters-v2.md): Bond levels + keepsakes. Pure JS, no DOM, no Phaser.
// Bond XP is earned in a run but banked ONLY at results (bankRun); the level is read once at Sim construction (stats fixed all run).
// Every number lives in balance.json `bond` / `keepsake`; anything missing or malformed fails closed to "no bonus".
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const own = (o, k) => isObj(o) && Object.hasOwn(o, k);
export const BOND_STATS = ['hp', 'ward', 'speed'];
const HARD_CAP = 99;

// balance.bond -> a clean definition (or null = Bond off).
export function bondDef(balance) {
  const b = balance && balance.bond;
  if (!isObj(b)) return null;
  const cap = Number.isInteger(b.cap) && b.cap >= 1 && b.cap <= HARD_CAP ? b.cap : 0;
  const cycle = Array.isArray(b.cycle) ? b.cycle.filter((s) => BOND_STATS.includes(s)).slice(0, 8) : [];
  if (!cap || !cycle.length || !isObj(b.cost) || !fin(b.cost.base) || b.cost.base <= 0 || !fin(b.cost.step) || b.cost.step < 0) return null;
  const total = {};
  for (const s of BOND_STATS) total[s] = own(b.total, s) && fin(b.total[s]) ? Math.min(10, Math.max(0, b.total[s])) : 0; // % at cap; hard 10% ceiling
  const earn = {};
  for (const k of ['kills', 'chest', 'boss', 'minute', 'dawn']) earn[k] = own(b.earn, k) && fin(b.earn[k]) ? Math.max(0, b.earn[k]) : 0;
  const runCap = fin(b.runCap) ? Math.max(0, Math.min(10000, b.runCap)) : 0;
  const seedPerRun = fin(b.seedPerRun) ? Math.max(0, Math.min(1000, b.seedPerRun)) : 0;
  const seedCap = Number.isInteger(b.seedCap) ? Math.max(0, Math.min(cap, b.seedCap)) : 0;
  return { cap, cycle, cost: { base: b.cost.base, step: b.cost.step }, total, earn, runCap, seedPerRun, seedCap };
}

// XP needed to go from level L-1 to L (L >= 1).
export const levelCost = (D, L) => Math.round(D.cost.base + D.cost.step * (L - 1));
// Total XP to reach level L from 0.
export function xpToLevel(D, L) { let t = 0; for (let k = 1; k <= Math.min(L, D.cap); k++) t += levelCost(D, k); return t; }
export const maxXp = (D) => xpToLevel(D, D.cap);
export function levelOf(D, xp) {
  if (!D || !fin(xp) || xp <= 0) return 0;
  let L = 0, need = 0;
  while (L < D.cap && xp >= need + levelCost(D, L + 1)) { need += levelCost(D, L + 1); L++; }
  return L;
}

// The stat step a level gives (cycle order), and the full bonus at a level: { hpMul, ward (fraction of damage taken removed), speedMul }.
export const levelStat = (D, L) => D.cycle[(L - 1) % D.cycle.length];
function stepsAt(D, L) {
  const n = {};
  for (const s of BOND_STATS) n[s] = 0;
  for (let k = 1; k <= L; k++) n[levelStat(D, k)]++;
  return n;
}
export function stepPct(D, stat) {
  const atCap = stepsAt(D, D.cap)[stat];
  return atCap ? D.total[stat] / atCap : 0;
}
export function bondBonus(D, level) {
  const out = { hpMul: 1, ward: 0, speedMul: 1, level: 0 };
  if (!D || !Number.isInteger(level) || level <= 0) return out;
  const L = Math.min(D.cap, level);
  const n = stepsAt(D, L);
  out.level = L;
  out.hpMul = 1 + (n.hp * stepPct(D, 'hp')) / 100;
  out.ward = (n.ward * stepPct(D, 'ward')) / 100;
  out.speedMul = 1 + (n.speed * stepPct(D, 'speed')) / 100;
  return out;
}

// Bond XP a finished run earns (untrusted result: every field clamped). Debug runs never reach this (app.bankRun).
export function runBondXp(D, r) {
  if (!D || !isObj(r)) return 0;
  const pos = (v, max = 1e6) => (fin(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
  const E = D.earn;
  let xp = 0;
  if (E.kills > 0) xp += Math.floor(pos(r.kills) / E.kills);
  xp += pos(r.chests, 50) * E.chest;
  if (r.bossKilled === true) xp += E.boss;
  xp += Math.floor((fin(r.time) ? Math.max(0, Math.min(3600, r.time)) : 0) / 60) * E.minute;
  if (r.outcome === 'victory') xp += E.dawn;
  return Math.floor(Math.min(D.runCap, xp));
}

// Keepsakes (balance.keepsake): { need, chest, boss } -> clean, or null (no drops).
export function keepsakeDef(balance) {
  const k = balance && balance.keepsake;
  if (!isObj(k) || !Number.isInteger(k.need) || k.need < 1 || k.need > 20) return null;
  const p = (v) => (fin(v) ? Math.max(0, Math.min(1, v)) : 0);
  return { need: k.need, chest: p(k.chest), boss: p(k.boss) };
}
