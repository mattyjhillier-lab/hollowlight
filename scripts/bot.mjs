// Rough balance probe: a simple bot plays whole runs headlessly.
// Usage: node scripts/bot.mjs [characterId] [seeds]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));

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
  // drift back toward world centre when near the edge
  const c = sim.balance.worldSize / 2;
  ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay, ability: sim.ability.cdLeft <= 0 && sim.enemies.length > 25 };
}

function pick(sim, rng) {
  const offer = sim.offer;
  if (offer.gold.length) return offer.gold[0].key;
  // prefer to finish a stat pair: weight cards toward stats already ranked
  const cards = offer.cards;
  const focus = process.env.FOCUS === '1';
  const w = cards.map((c) => (c.kind === 'stat' ? (focus ? 1 + c.rank * c.rank * 3 : 1 + c.rank * 1.5) : c.kind === 'weapon' ? (focus ? (sim.weapons.length < 2 ? 3 : 0.2) : 2) : 0.3));
  let t = w.reduce((a, b) => a + b, 0) * rng();
  for (let i = 0; i < cards.length; i++) { t -= w[i]; if (t <= 0) return cards[i].key; }
  return cards[0].key;
}

export function playRun(charId, seed, opts = {}) {
  const sim = new Sim({ data, characterId: charId, seed, meta: opts.meta || {} });
  let s = seed * 9301 + 49297;
  const rng = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const DT = 1 / 60;
  const marks = {};
  const t0 = Date.now();
  while (sim.state === 'running' || sim.state === 'levelup') {
    if (sim.state === 'levelup') { sim.pickCard(pick(sim, rng)); continue; }
    sim.step(DT, botInput(sim));
    if (marks.evo === undefined && sim.weapons.some((w) => w.evo)) marks.evo = Math.round(sim.time);
    const m = Math.floor(sim.time / 60);
    if (sim.time % 60 < DT && !marks[m]) marks[m] = { lvl: sim.level, hp: Math.round(sim.player.hp), en: sim.enemies.length };
  }
  const r = sim.result();
  return { ...r, wall: (Date.now() - t0) / 1000, marks, evolved: sim.weapons.filter((w) => w.evo).map((w) => w.evo), weaponIds: sim.weapons.map((w) => w.id) };
}

if (process.argv[1] && process.argv[1].endsWith('bot.mjs')) {
  const char = process.argv[2] || 'wren';
  const seeds = Number(process.argv[3] || 3);
  for (let sd = 1; sd <= seeds; sd++) {
    const r = playRun(char, sd);
    console.log(`${char} seed ${sd}: ${r.outcome} at ${Math.round(r.time)}s, level ${r.level}, kills ${r.kills}, gold ${r.gold}, boss killed ${r.bossKilled}, weapons ${r.weaponIds.join('+')} evolutions [${r.evolved.join(',')}] firstEvo ${r.marks.evo ?? '-'}s (sim ${r.wall.toFixed(1)}s)`);
  }
}
