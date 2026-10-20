// Wolf leash probe: per run, wolf away-from-hero time, mean distance, share of wolf-seconds spent on each target type, damage taken by source.
// Usage: node scripts/wolf-leash-probe.mjs [hero=wren] [seeds=12] [seedFrom=1]   (FOCUS=1 as sweep)
import { Sim } from '../src/sim/Sim.js';
import { playRun } from './bot.mjs';
const hero = process.argv[2] || 'wren', n = Number(process.argv[3] || 12), s0 = Number(process.argv[4] || 1);
const acc = { runs: 0, wins: 0, wolfSec: 0, away100: 0, away150: 0, dist: 0, byType: {}, hurt: {}, time: 0 };
const spread = {}; // key 'time-bucket|wolves' -> [sumRatio, n]
const orig = Sim.prototype.step;
let cur = null;
Sim.prototype.step = function (dt, inp) {
  const r = orig.call(this, dt, inp);
  if (this.state === 'running') {
    const ws = this.units.filter((u) => u.kind === 'wolf' && !u.dead && !u.echo && !u.shade);
    const rallying = this.rally && this.buffs.rally > 0;
    if (ws.length >= 2 && !rallying) {
      const inRange = this.enemies.filter((e) => !e.dead && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 150).length;
      if (inRange >= 1) {
        const tg = new Set(ws.filter((u) => u.target && !u.target.dead).map((u) => u.target.id));
        const ratio = tg.size / Math.min(ws.length, inRange);
        const tb = this.time < 120 ? '0-2m' : this.time < 360 ? '2-6m' : this.time < 600 ? '6-10m' : '10m+';
        const k = tb + '|' + (ws.length <= 3 ? '2-3w' : ws.length <= 5 ? '4-5w' : '6-7w') + '|' + (inRange >= ws.length ? 'enough' : 'few');
        (spread[k] = spread[k] || [0, 0]); spread[k][0] += ratio; spread[k][1]++;
      }
    }
    for (const u of this.units) {
      if (u.kind !== 'wolf' || u.dead) continue;
      const d = Math.hypot(u.x - this.player.x, u.y - this.player.y);
      acc.wolfSec += dt; acc.dist += d * dt;
      if (d > 100) acc.away100 += dt;
      if (d > 150) acc.away150 += dt;
      const k = u.target && !u.target.dead ? (u.target.type || u.target.id0 || 'x') : 'none';
      acc.byType[k] = (acc.byType[k] || 0) + dt;
    }
  }
  return r;
};
for (let sd = s0; sd < s0 + n; sd++) {
  const r = playRun(hero, sd);
  acc.runs++; if (r.outcome === 'victory') acc.wins++; acc.time += r.time;
  for (const [k, v] of Object.entries(r.hurtBy)) acc.hurt[k] = (acc.hurt[k] || 0) + v;
}
const pc = (v) => (100 * v / acc.wolfSec).toFixed(1) + '%';
console.log(`${hero} ${process.env.FOCUS === '1' ? 'FOCUS' : 'random'} seeds ${s0}..${s0 + n - 1}: wins ${acc.wins}/${acc.runs}  mean time ${(acc.time / acc.runs).toFixed(0)}s`);
console.log(`  wolf mean dist ${(acc.dist / acc.wolfSec).toFixed(0)}px  >100px ${pc(acc.away100)}  >150px ${pc(acc.away150)}`);
console.log('  target share: ' + Object.entries(acc.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pc(v)}`).join(', '));
console.log('  dmg taken/run: ' + Object.entries(acc.hurt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / acc.runs).toFixed(0)}`).join(', '));
console.log('  distinct-target ratio (no Rally) time|wolves|enemies: ' + Object.entries(spread).sort().map(([k, v]) => `${k} ${(100 * v[0] / v[1]).toFixed(0)}% (n=${v[1]})`).join('  '));
const all = Object.entries(spread).filter(([k]) => k.endsWith('enough')); let a = 0, b = 0; for (const [, v] of all) { a += v[0]; b += v[1]; }
console.log(`  OVERALL enough-enemies ratio ${(100 * a / Math.max(1, b)).toFixed(1)}%`);
