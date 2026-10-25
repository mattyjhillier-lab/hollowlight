// FINAL RETUNE: summarise scripts/rt-matrix.mjs output into markdown tables + an out-of-band ranking.
// Usage: node scripts/rt-summary.mjs rt.jsonl [--csv]
import { readFileSync } from 'node:fs';

const file = process.argv[2] || 'rt-matrix.jsonl';
const cells = new Map(), seen = new Set(); // runs are deterministic: a duplicate key#seed line (resumed/overlapping sweeps) is skipped
for (const l of readFileSync(file, 'utf8').split('\n')) if (l) { let o; try { o = JSON.parse(l); } catch { continue; } const id = `${o.key}#${o.seed}`; if (seen.has(id)) continue; seen.add(id); if (!cells.has(o.key)) cells.set(o.key, []); cells.get(o.key).push(o); }

const BOSS_AT = 840;
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const pct = (a, p) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : null);
const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const P = (x) => Math.round(100 * x);

export function stat(rs) {
  const n = rs.length, w = rs.filter((r) => r.win).length, [lo, hi] = wilson(w, n);
  const deaths = rs.filter((r) => !r.win).map((r) => r.t);
  const reach = rs.filter((r) => r.win || r.t >= BOSS_AT).length;
  const fight = rs.filter((r) => r.win && r.bossKill).map((r) => r.bossKill - BOSS_AT);
  const evo = rs.map((r) => r.evo).filter((v) => v != null);
  const b = [0, 0, 0, 0, 0]; for (const t of deaths) b[t < 300 ? 0 : t < 420 ? 1 : t < 600 ? 2 : t < BOSS_AT ? 3 : 4]++;
  return { n, win: w / n, lo, hi, early: b[0] / n, buckets: b, deaths: deaths.length, dMed: med(deaths), dP10: pct(deaths, 0.1), dP90: pct(deaths, 0.9), reach: reach / n, winGivenReach: reach ? w / reach : null, bossShare: deaths.length ? b[4] / deaths.length : null, fightMed: med(fight), fightP90: pct(fight, 0.9), evoMed: med(evo), evoN: evo.length / n, lvl: med(rs.map((r) => r.lvl)), gold: Math.round(rs.reduce((a, r) => a + r.gold, 0) / n) };
}

const rows = [...cells.entries()].map(([k, rs]) => { const [hero, weapon, tree, tier, bond, bot] = k.split('|'); return { k, hero, weapon, tree, tier, bond, bot, ...stat(rs) }; });
const W = { ghost_wolves: 'Wolves', raven_flock: 'Ravens', spirit_bolts: 'Bolts', chain_lightning: 'Chain', holy_orbit: 'Orbit' };
const T = { normal: 'Twilight', hard: 'Deep Dusk', expert: 'Long Night' };
const order = (a, b) => ['none', 'half', 'full'].indexOf(a.tree) - ['none', 'half', 'full'].indexOf(b.tree) || ['normal', 'hard', 'expert'].indexOf(a.tier) - ['normal', 'hard', 'expert'].indexOf(b.tier) || a.bond.localeCompare(b.bond) || a.bot.localeCompare(b.bot) || a.hero.localeCompare(b.hero) || a.weapon.localeCompare(b.weapon);
rows.sort(order);

if (process.argv.includes('--csv')) {
  console.log('hero,weapon,tree,tier,bond,bot,n,win,lo,hi,early,d5_7,d7_10,d10_14,dboss,reach,winGivenReach,bossShare,fightMed,evoMed,lvl,gold');
  for (const r of rows) console.log([r.hero, r.weapon, r.tree, r.tier, r.bond, r.bot, r.n, P(r.win), P(r.lo), P(r.hi), P(r.early), ...r.buckets.slice(1).map((x) => P(x / r.n)), P(r.reach), r.winGivenReach == null ? '' : P(r.winGivenReach), r.bossShare == null ? '' : P(r.bossShare), r.fightMed ?? '', r.evoMed ?? '', r.lvl, r.gold].join(','));
  process.exit(0);
}

console.log('| hero | start | tree | tier | Bond | bot | n | win % (95% CI) | dead <5:00 | deaths 5-7 / 7-10 / 10-14 / boss (% of runs) | death median (p10-p90) | reach boss | win given reach | boss share of deaths | fight median (p90) | first evo (evolved) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.hero} | ${W[r.weapon]} | ${r.tree} | ${T[r.tier]} | ${r.bond.slice(1)} | ${r.bot} | ${r.n} | **${P(r.win)}** (${P(r.lo)}-${P(r.hi)}) | ${P(r.early)} | ${r.buckets.slice(1).map((x) => P(x / r.n)).join(' / ')} | ${fmt(r.dMed)} (${fmt(r.dP10)}-${fmt(r.dP90)}) | ${P(r.reach)} | ${r.winGivenReach == null ? '-' : P(r.winGivenReach)} | ${r.bossShare == null ? '-' : P(r.bossShare)} | ${r.fightMed == null ? '-' : r.fightMed + ' s'} (${r.fightP90 ?? '-'}) | ${fmt(r.evoMed)} (${P(r.evoN)}%) |`);

// ---- out-of-band ranking against the locked/working targets (random bot unless the target says FOCUS)
// LOCKED 'FINAL RETUNE TARGETS' (2026-10-25): fresh / mid / maxed Twilight + Long Night maxed. Deep Dusk rows = WORKING bands from
// difficulty-tiers-economy-v1.md 9.1 (mid 15-30, full tree incl. tier nodes 35-55), not re-locked; marked 'w' in the ranking.
const BAND = { 'none|normal|b0': [15, 30], 'half|normal|b0': [30, 55], 'full|normal|b25': [65, 90], 'full|expert|b25': [10, 20], 'half|hard|b0': [15, 30, 'w'], 'full|hard|b25': [35, 55, 'w'] };
const out = [];
for (const r of rows) {
  if (r.bot !== 'random') continue;
  const band = BAND[`${r.tree}|${r.tier}|${r.bond}`] || null;
  const w = 100 * r.win, lo = 100 * r.lo, hi = 100 * r.hi;
  if (band) { const miss = w < band[0] ? band[0] - w : w > band[1] ? w - band[1] : 0; const sure = hi < band[0] || lo > band[1]; if (miss > 0) out.push({ r, what: `win ${P(r.win)}% vs ${band[0]}-${band[1]}${band[2] ? ' (working band)' : ''}`, miss, sure }); }
  if (r.tier === 'normal' && r.bond === 'b0' && r.early > 0.05) out.push({ r, what: `dead before 5:00 ${P(r.early)}% vs <=5%`, miss: 100 * r.early - 5, sure: r.early > 0.1 });
  if (r.tier === 'normal' && r.reach >= 0.25 && r.winGivenReach != null && (r.winGivenReach > 0.75 || r.winGivenReach < 0.6)) out.push({ r, what: `boss win|reach ${P(r.winGivenReach)}% vs 60-75`, miss: Math.abs(100 * r.winGivenReach - (r.winGivenReach > 0.75 ? 75 : 60)) / 2, sure: false });
  if (r.tier === 'normal' && r.fightMed != null && (r.fightMed < 75 || r.fightMed > 100) && r.win >= 0.15) out.push({ r, what: `fight ${r.fightMed} s vs 75-100`, miss: Math.abs(r.fightMed - (r.fightMed < 75 ? 75 : 100)) / 3, sure: false });
}
out.sort((a, b) => b.sure - a.sure || b.miss - a.miss);
console.log('\nOUT OF BAND (random bot, Bond 0; sure = 95% CI entirely outside the band)');
for (const o of out) console.log(`${o.sure ? 'SURE ' : 'maybe'} ${o.miss.toFixed(0).padStart(3)}  ${o.r.hero} ${W[o.r.weapon]} ${o.r.tree} ${T[o.r.tier]} ${o.r.bond} n=${o.r.n}: ${o.what}`);

// ---- Bond effect and hero gap
console.log('\nBOND 25 - BOND 0 (win points, random)');
for (const r of rows) if (r.bond === 'b25' && r.bot === 'random') { const z = rows.find((x) => x.k === r.k.replace('|b25|', '|b0|')); if (z) console.log(`${r.hero} ${W[r.weapon]} ${r.tree} ${T[r.tier]}: ${P(z.win)} -> ${P(r.win)} (${P(r.win - z.win) >= 0 ? '+' : ''}${P(r.win - z.win)})`); }
console.log('\nHERO GAP Wren - Elias (win points, random, Bond 0)');
for (const r of rows) if (r.hero === 'wren' && r.bond === 'b0' && r.bot === 'random') { const z = rows.find((x) => x.k === r.k.replace('wren|', 'elias|')); if (z) console.log(`${W[r.weapon]} ${r.tree} ${T[r.tier]}: ${P(r.win)} vs ${P(z.win)} (${P(r.win - z.win)})`); }
