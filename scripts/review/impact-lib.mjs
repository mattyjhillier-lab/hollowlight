// Shared by tree-impact.mjs / impact-groups.mjs: parallel bot runs over "full tree minus some nodes" variants.
// Runs are deterministic per (char, seed, focus, removed ids). GATES=all (every gated weapon/evolution open, as in the T3 sweeps), Blessings on.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

export const SELF = fileURLToPath(import.meta.url);

if (!isMainThread && workerData && workerData.impactWorker) {
  process.env.GATES = workerData.gates || 'all';
  const { playRun } = await import('./../bot.mjs');
  const { data } = await import('../../tests/helpers.mjs');
  const { loadTree } = await import('../../src/meta/treefs.mjs');
  const { compileTree, presetTree, aggregateMods } = await import('../../src/meta/tree.js');
  const K = Number(process.env.TREE_K || 1), KC = Number(process.env.TREE_KC || K), KF = Number(process.env.TREE_KF || K); // what-if: scale every combat pct face AND every category cap by K (ceiling-raise experiment, never shipped)
  const def = compileTree(loadTree(data).live, data);
  if (KC !== 1 || KF !== 1) {
    for (const id of def.list) for (const e of def.nodes[id].effects) { if (e.pct !== undefined && (e.weapon !== undefined || ['damage', 'cooldown', 'area'].includes(e.mod) || ['maxHp', 'levelHeal'].includes(e.player) || e.status !== undefined)) e.pct *= KF; }
    for (const c of Object.values(def.rule.categories)) c.cap *= KC;
    def.rule.perWeapon.cap *= KC;
  }
  const full = presetTree(def, 'full', true), fullNoGates = presetTree(def, 'full', false), half = presetTree(def, 'half', true);
  parentPort.on('message', (job) => {
    if (job === 'quit') { process.exit(0); }
    const t = { ...(job.base === 'half' ? half : job.base === 'nogate' ? fullNoGates : full) };
    if (job.base === 'none') for (const k of Object.keys(t)) delete t[k];
    for (const id of job.remove) delete t[id];
    if (job.only) { const isSus = (n) => n.effects.some((e) => e.player !== undefined || e.drop !== undefined || e.unlock === 'rerolls' || e.unlock === 'banishes'); for (const id of Object.keys(t)) { const s = isSus(def.nodes[id]); if (job.only === 'sus' ? !s : s) delete t[id]; } }
    if (job.rank) for (const [id, r] of Object.entries(job.rank)) { if (r > 0) t[id] = r; else delete t[id]; }
    process.env.FOCUS = job.focus ? '1' : '0';
    const tree = job.base === 'none' && !Object.keys(t).length ? null : aggregateMods(t, def, data);
    const r = playRun(job.char, job.seed, { tree });
    parentPort.postMessage({ id: job.id, win: r.outcome === 'victory' ? 1 : 0, time: r.time, level: r.level, kills: r.kills, dmg: r.dmg, hpLost: r.hpLost, hurts: r.hurts });
  });
}

// jobs: [{char, seed, focus, remove:[ids], base?, rank?, tag}] -> results array aligned with jobs
export async function runJobs(jobs, { threads = Number(process.env.THREADS || 8), onProgress, gates = 'all' } = {}) {
  const out = new Array(jobs.length);
  let next = 0, done = 0;
  await new Promise((resolve, reject) => {
    const workers = [];
    const feed = (w) => {
      if (next >= jobs.length) { w.postMessage('quit'); return; }
      const i = next++;
      w._cur = i;
      w.postMessage({ ...jobs[i], id: i });
    };
    for (let k = 0; k < Math.min(threads, jobs.length); k++) {
      const w = new Worker(SELF, { workerData: { impactWorker: true, gates } });
      w.on('message', (m) => { out[m.id] = m; done++; if (onProgress && done % 50 === 0) onProgress(done, jobs.length); if (done === jobs.length) { resolve(); workers.forEach((x) => x.terminate()); } else feed(w); });
      w.on('error', reject);
      w.once('online', () => feed(w));
      workers.push(w);
    }
  });
  return out;
}

export function agg(rows) {
  const n = rows.length;
  const mean = (f) => rows.reduce((a, r) => a + f(r), 0) / n;
  return { n, win: mean((r) => r.win) * 100, time: mean((r) => r.time), dmg: mean((r) => r.dmg), hpLost: mean((r) => r.hpLost), level: mean((r) => r.level) };
}
// paired delta of a metric between two aligned arrays of rows (same seeds): mean and standard error
export function paired(a, b, f) {
  const d = a.map((r, i) => f(r) - f(b[i]));
  const m = d.reduce((x, y) => x + y, 0) / d.length;
  const sd = Math.sqrt(d.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, d.length - 1));
  return { mean: m, se: sd / Math.sqrt(d.length) };
}
