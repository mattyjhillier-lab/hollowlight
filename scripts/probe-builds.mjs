// Build probe. Part A: card-system Monte Carlo (no combat). Part B: full runs with fixed weapon sets.
// Usage: node scripts/probe-builds.mjs [cardsRuns=4000] [seedsPerBuild=12]
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';
import { createRng } from '../src/sim/rng.js';
import { generateOffer, applyCard, newWeapon } from '../src/sim/cards.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const data = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
const DT = 1 / 60;

function botInput(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 8100) { const d = Math.sqrt(d2) || 1; const w = (90 - d) / 90 * (e.boss ? 2.5 : 1); ax += dx / d * w; ay += dy / d * w; } }
  let best = null, bd = 40000;
  for (const g of sim.gems) { const dx = g.x - p.x, dy = g.y - p.y, d2 = dx * dx + dy * dy; if (d2 < bd) { bd = d2; best = g; } }
  if (best) { const d = Math.sqrt(bd) || 1; ax += (best.x - p.x) / d * 0.6; ay += (best.y - p.y) / d * 0.6; }
  const c = sim.balance.worldSize / 2; ax += (c - p.x) * 0.0004; ay += (c - p.y) * 0.0004;
  return { x: ax, y: ay, ability: sim.ability.cdLeft <= 0 && sim.enemies.length > 25 };
}

// Full run with a fixed weapon set: never takes new weapons; picks gold first, else highest-rank stat (focused).
function fixedRun(set, seed) {
  // weaponSlots = set size so no new-weapon cards are ever offered
  const d2 = { ...data, balance: { ...data.balance, weaponSlots: set.length } };
  const sim = new Sim({ data: d2, characterId: 'wren', seed });
  sim.weapons.length = 0;
  for (const id of set) sim.weapons.push(newWeapon(id, data.weapons[id]));
  let firstEvo = null;
  while (sim.state === 'running' || sim.state === 'levelup') {
    if (sim.state === 'levelup') {
      const o = sim.offer;
      let c = o.gold[0];
      if (!c) { const st = o.cards.filter((x) => x.kind === 'stat').sort((a, b) => b.rank - a.rank); c = st[0] || o.cards.find((x) => x.kind === 'fallback') || o.cards[0]; }
      sim.pickCard(c.key); continue;
    }
    sim.step(DT, botInput(sim));
    if (firstEvo == null && sim.weapons.some((w) => w.evo)) firstEvo = sim.time;
  }
  return { win: sim.state === 'victory', time: sim.time, firstEvo, boss: sim.bossKilled, evos: sim.weapons.filter((w) => w.evo).map((w) => w.evo) };
}

if (!isMainThread) {
  parentPort.postMessage(workerData.jobs.map(([set, seed]) => ({ key: set.join('+'), ...fixedRun(set, seed) })));
} else {
  const RUNS = Number(process.argv[2] || 4000);
  const SEEDS = Number(process.argv[3] || 12);
  // ---------------- Part A: cards only
  const pairsOf = (wid) => Object.entries(data.evolutions).filter(([, e]) => e.weapon === wid);
  for (const style of ['random', 'focused']) {
    const firstLvl = [], evoCount = {}, dual = { n: 0 }, deadRanks = [], fallbackOnly = [], evosPerRun = [];
    for (let r = 0; r < RUNS; r++) {
      const rng = createRng(1000 + r);
      const weapons = [newWeapon('ghost_wolves', data.weapons.ghost_wolves)];
      const ctx = { weapons, data, banished: new Set() };
      let first = null, fb = null, evos = 0;
      for (let lvl = 2; lvl <= 48; lvl++) {
        const o = generateOffer(ctx, rng);
        if (o.gold.length > 1) dual.n++;
        let c;
        if (o.gold.length) c = o.gold[0];
        else if (style === 'random') c = o.cards[rng.int(o.cards.length)];
        else c = o.cards.slice().sort((a, b) => (b.kind === 'stat' ? 10 + b.rank : b.kind === 'weapon' ? (weapons.length < 2 ? 50 : 1) : 0) - (a.kind === 'stat' ? 10 + a.rank : a.kind === 'weapon' ? (weapons.length < 2 ? 50 : 1) : 0))[0];
        if (fb == null && o.cards.every((x) => x.kind === 'fallback') && !o.gold.length) fb = lvl;
        if (c.kind === 'evolution') {
          evos++; if (first == null) first = lvl;
          evoCount[c.evoId] = (evoCount[c.evoId] || 0) + 1;
          const w = weapons.find((x) => x.id === c.weaponId);
          const pair = data.evolutions[c.evoId].pair;
          deadRanks.push(Object.entries(w.ranks).filter(([k]) => !pair.includes(k)).reduce((s, [, v]) => s + v, 0));
        }
        if (c.kind !== 'fallback') applyCard(ctx, c);
      }
      firstLvl.push(first ?? 99); fallbackOnly.push(fb ?? 99); evosPerRun.push(evos);
    }
    const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
    console.log(`A) cards-only ${style} picker, ${RUNS} runs to level 48 (Wren start):`);
    console.log(`   first evolution offered+taken at level p10/median/p90 ${q(firstLvl, 0.1)}/${q(firstLvl, 0.5)}/${q(firstLvl, 0.9)}; evos per run median ${q(evosPerRun, 0.5)} (p90 ${q(evosPerRun, 0.9)})`);
    console.log(`   offers with 2+ evolution choices for one pick: ${dual.n} total (${(dual.n / RUNS).toFixed(2)}/run); non-pair ranks already spent at evolve: mean ${(deadRanks.reduce((a, b) => a + b, 0) / deadRanks.length).toFixed(1)}`);
    console.log(`   first fallback-only offer at level median ${q(fallbackOnly, 0.5)} (99 = never by 48)`);
    console.log(`   evolution share: ${Object.entries(evoCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }
  // ---------------- Part B: fixed weapon sets, full runs
  if (SEEDS > 0) {
    const ids = Object.keys(data.weapons);
    const sets = [];
    for (let i = 0; i < ids.length; i++) { sets.push([ids[i]]); for (let j = i + 1; j < ids.length; j++) sets.push([ids[i], ids[j]]); }
    const jobs = []; for (const s of sets) for (let sd = 1; sd <= SEEDS; sd++) jobs.push([s, sd]);
    const W = 6; const chunks = Array.from({ length: W }, (_, k) => jobs.filter((_, i) => i % W === k));
    const res = (await Promise.all(chunks.map((c) => new Promise((ok, no) => { const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: c } }); w.on('message', ok); w.on('error', no); })))).flat();
    console.log(`B) fixed weapon sets, Wren body (60hp), focused stat picks, no extra weapons, ${SEEDS} seeds each`);
    const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
    const mmss = (t) => (t == null ? '-' : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`);
    for (const s of sets) {
      const rs = res.filter((r) => r.key === s.join('+'));
      const evoFreq = {}; for (const r of rs) for (const e of r.evos) evoFreq[e] = (evoFreq[e] || 0) + 1;
      console.log(`   ${s.join('+').padEnd(34)} win ${String(Math.round((100 * rs.filter((r) => r.win).length) / rs.length)).padStart(3)}%  boss ${String(Math.round((100 * rs.filter((r) => r.boss).length) / rs.length)).padStart(3)}%  medianEnd ${mmss(med(rs.map((r) => r.time)))}  firstEvo ${mmss(med(rs.map((r) => r.firstEvo)))}  evos ${JSON.stringify(evoFreq)}`);
    }
  }
}
