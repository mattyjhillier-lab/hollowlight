// Evolution flow v2 (E2): every evolution vs its base weapon at the SAME ranks, for every way a player can reach the trigger.
// A weapon awakens at balance.evoTriggerRanks total ranks (default 15 of 20), in ANY distribution, so each evolution is probed with
// each stat left at 0 (the other stats maxed), and a balanced 4/4/4/3 spread; plus the all-max case. Ratio = evo DPS / base DPS.
// Usage: node scripts/evo-flow-ranks.mjs [secs=10] [seeds=1] [filter]   (read-only; exports `spreads` and `measureSpreads` for tests)
import { data, measure, SCEN } from './evo-same-ranks.mjs';

const MAX = data.balance.maxRank;
export const TRIG = data.balance.evoTriggerRanks;

// Rank spreads totalling `total`: one stat at its low end (rest maxed) per stat, and a balanced spread.
export function spreads(weaponId, total = TRIG) {
  const keys = Object.keys(data.weapons[weaponId].stats);
  const out = {};
  const deficit = keys.length * MAX - total;
  for (const k of keys) {
    const r = Object.fromEntries(keys.map((x) => [x, MAX]));
    let left = deficit;
    for (const x of [k, ...keys.filter((y) => y !== k)]) { const t = Math.min(MAX, left); r[x] = MAX - t; left -= t; }
    out[`no-${k}`] = r;
  }
  const bal = Object.fromEntries(keys.map((k) => [k, 0]));
  let left = total;
  for (let i = 0; left > 0; i = (i + 1) % keys.length) if (bal[keys[i]] < MAX) { bal[keys[i]]++; left--; }
  out.balanced = bal;
  return out;
}

export function measureSpreads({ secs = 10, seeds = [1], filter = '', total = TRIG, scens = Object.keys(SCEN) } = {}) {
  const avg = (fn) => seeds.reduce((s, sd) => s + fn(sd), 0) / seeds.length;
  const out = {};
  for (const [eid, e] of Object.entries(data.evolutions)) {
    if (filter && !eid.includes(filter)) continue;
    out[eid] = {};
    for (const [name, ranks] of Object.entries(spreads(e.weapon, total))) {
      out[eid][name] = {};
      for (const sc of scens) {
        const b = avg((sd) => measure(e.weapon, null, sc, ranks, sd, secs));
        const v = avg((sd) => measure(e.weapon, eid, sc, ranks, sd, secs));
        out[eid][name][sc] = { base: b, evo: v, ratio: b > 0 ? v / b : v > 0 ? Infinity : 1 };
      }
    }
  }
  return out;
}

if (process.argv[1]?.endsWith('evo-flow-ranks.mjs')) {
  const secs = Number(process.argv[2] || 10);
  const nSeeds = Number(process.argv[3] || 1);
  const filter = process.argv[4] || '';
  const res = measureSpreads({ secs, seeds: Array.from({ length: nSeeds }, (_, i) => i + 1), filter });
  console.log(`Evolution / base DPS at ${TRIG} total ranks, ${secs}s x ${nSeeds} seeds. cell = ratio.`);
  for (const [eid, sp] of Object.entries(res)) {
    for (const [name, sc] of Object.entries(sp)) {
      console.log(`${eid.padEnd(18)} ${name.padEnd(13)} ${Object.entries(sc).map(([s, c]) => `${s} ${Number.isFinite(c.ratio) ? c.ratio.toFixed(2) : 'INF'}`).join('  ')}`);
    }
  }
}
