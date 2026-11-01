// Boss build determinism gate (docs/design/boss-treant-v1.md (h), review finding 1): plays the bot on a checkout and prints a state hash every
// 60 s up to T. Run it on two checkouts and diff: B0 vs the pre-boss build must match to t=599 (the old boss spawned at 600 and drew RNG);
// every later boss chunk vs B0 must match to t=839 (the arrival).
// Usage: node scripts/boss-det.mjs <repo root> [seeds=6] [T=839]   (BLESS on, GATES starter, both heroes; deterministic, Sim only)
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.argv[2] || '.';
const N = Number(process.argv[3] || 6);
const T = Number(process.argv[4] || 839);
const { playRun } = await import(pathToFileURL(join(root, 'scripts', 'bot.mjs')).href);
const Sim = (await import(pathToFileURL(join(root, 'src', 'sim', 'Sim.js')).href)).Sim;

// wrap Sim.step: hash the state at every 60 s mark and stop the run at T (throw a sentinel caught below)
const STOP = Symbol('stop');
let marks = [];
const step0 = Sim.prototype.step;
Sim.prototype.step = function (dt, input) {
  step0.call(this, dt, input);
  const m = Math.floor(this.time / 60);
  if (this._detM !== m || this.time >= T) {
    this._detM = m;
    const s = JSON.stringify([this.time.toFixed(6), this.player.x, this.player.y, this.player.hp, this.level, this.xp, this.kills, this.nextId, this.enemies.length,
      this.enemies.reduce((a, e) => a + e.x * 3 + e.y * 7 + e.hp, 0), this.gems.length, this.weapons.map((w) => [w.id, w.evo, w.ranks]), this.rng.next ? null : 0]);
    marks.push(`${Math.round(this.time)}:${createHash('sha1').update(s).digest('hex').slice(0, 10)}`);
  }
  if (this.time >= T) throw STOP;
};
for (const hero of ['wren', 'elias']) for (let sd = 1; sd <= N; sd++) {
  marks = [];
  try { playRun(hero, sd); } catch (e) { if (e !== STOP) throw e; }
  console.log(`${hero} ${sd} ${marks.join(' ')}`);
}
