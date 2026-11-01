// DT2 Hollow marks probe: TIER=hard|expert bot runs -> marks made / slain per run, by kind, Dawnglass marked share (capped), Emberwake
// ring hits and the fairness probe (defeats within 3 s of an Emberwake hit). Usage: TIER=hard node scripts/marks-probe.mjs wren 24
import { playRun, TIER } from './bot.mjs';
import { Sim } from '../src/sim/Sim.js';
const hero = /^[a-z]{1,16}$/.test(process.argv[2] || '') ? process.argv[2] : 'wren';
const N = Math.max(1, Math.min(500, Number(process.argv[3]) || 24));
const orig = Sim.prototype.result;
let last = null;
Sim.prototype.result = function () { const r = orig.call(this); r._p = { made: this.marksMade, ember: this.emberHits || 0, emberDmg: this.emberDmg || 0, lastEmber: this.lastEmberT ?? -99, hurt: Object.values(this.hurtBy).reduce((a, b) => a + b, 0) }; last = r; return r; };
let wins = 0, made = 0, slain = 0, near = 0, emberDeaths = 0, ember = 0, emberDmg = 0, hurt = 0, glass = 0; const by = {};
for (let s = 1; s <= N; s++) {
  const r = playRun(hero, s); const p = r._p;
  if (r.outcome === 'victory') wins++;
  made += p.made; slain += r.marked; ember += p.ember; emberDmg += p.emberDmg; hurt += p.hurt;
  for (const [k, v] of Object.entries(r.markedBy)) by[k] = (by[k] || 0) + v;
  if (r.outcome !== 'victory') { if (r.time - p.lastEmber < 3) near++; if (r.hurt.last && r.hurt.last.kind === 'ember') emberDeaths++; }
  glass += Math.min(r.marked, TIER === 'expert' ? 3 : TIER === 'hard' ? 2 : 0);
}
const f = (v) => (v / N).toFixed(1);
console.log(`marks-probe ${hero} TIER=${TIER} seeds=${N}: wins ${wins}/${N}; marks made/run ${f(made)}, slain/run ${f(slain)} (${Object.entries(by).map(([k, v]) => `${k} ${f(v)}`).join(', ')}); marked Dawnglass/run ${f(glass)}`);
console.log(`  Emberwake: hits/run ${f(ember)}, share of damage taken ${(100 * emberDmg / Math.max(1, hurt)).toFixed(1)}%; defeats within 3 s of an ember hit ${near}, struck down by a ring ${emberDeaths}`);
void last;
