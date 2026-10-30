// Parallel runner for probes on the LIVE bot (bot.mjs playRun: dodge, Blessings, Bond, map events), used by gates-kits / gates-softcap / gates-ablate.
// runLive(jobs, workers) -> Map key -> [result]. job = { key, hero, weapon, seed, tier='normal', bond=0, focus=false, ability=true,
//   tree:'none'|'half'|'full', spec:{ extra, open, soft, scale, strip } (see live-tree.mjs treeFor), sites? }.
// The tree comes from the shared liveTreeFactory (same code as rt-matrix.mjs). Worker env: GATES=starter, BLESS=on, META=none.
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';

if (!isMainThread && workerData && workerData.liveProbe) {
  const { playRun } = await import('./bot.mjs');
  const { liveTreeFactory } = await import('./live-tree.mjs');
  const { treeFor } = await liveTreeFactory();
  for (const j of workerData.jobs) {
    process.env.FOCUS = j.focus ? '1' : '0'; // the bot reads these on every pick / input frame
    process.env.ABILITY = j.ability === false ? 'off' : 'on';
    const r = playRun(j.hero, j.seed, { weapon: j.weapon, tree: treeFor(j.tree, j.weapon, j.tier || 'normal', j.spec), bond: j.bond || 0 });
    parentPort.postMessage({ key: j.key, win: r.outcome === 'victory', t: Math.round(r.time), lvl: r.level, evo: r.marks.evo ?? null, nEvo: r.evolved.length, hurts: r.hurts, uses: r.abilityUses || 0, dmg: Math.round(r.dmg || 0) });
  }
}

export async function runLive(jobs, workers = Math.max(1, availableParallelism() - 1), chunk = 3) {
  const cost = (j) => (j.tree === 'full' ? 3 : j.tree === 'half' ? 2 : 1);
  const byTier = new Map(); // TIER is read by bot.mjs at import, so a worker serves one tier
  for (const j of jobs) { const t = j.tier || 'normal'; if (!byTier.has(t)) byTier.set(t, []); byTier.get(t).push(j); }
  const chunks = [];
  for (const [tier, js] of byTier) { js.sort((a, b) => cost(b) - cost(a) || a.seed - b.seed); for (let i = 0; i < js.length; i += chunk) chunks.push({ tier, jobs: js.slice(i, i + chunk) }); }
  chunks.sort((a, b) => cost(b.jobs[0]) - cost(a.jobs[0])); // expensive first so the tail is short
  const out = new Map(); let next = 0, n = 0; const t0 = Date.now();
  const lane = async () => {
    while (next < chunks.length) {
      const c = chunks[next++];
      await new Promise((res, rej) => {
        const w = new Worker(fileURLToPath(import.meta.url), { workerData: { liveProbe: true, jobs: c.jobs }, env: { ...process.env, TIER: c.tier, GATES: 'starter', BLESS: 'on', META: 'none', BOND: '0', ENDLESS: '0', ASSIST: '0', SITES: '0' } });
        w.on('message', (m) => { if (!out.has(m.key)) out.set(m.key, []); out.get(m.key).push(m); if (++n % 100 === 0) console.error(`  ${n}/${jobs.length} runs, ${((Date.now() - t0) / 60000).toFixed(1)} min`); });
        w.on('error', rej); w.on('exit', res);
      });
    }
  };
  await Promise.all(Array.from({ length: Math.min(workers, chunks.length) }, lane));
  console.error(`  ${n} runs in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  return out;
}

export const fmtT = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
export function summarise(runs = []) {
  const n = runs.length || 1, w = runs.filter((r) => r.win).length;
  const evo = runs.map((r) => r.evo).filter((v) => v != null);
  return { n: runs.length, win: Math.round((100 * w) / n), se: Math.round(100 * Math.sqrt((w / n) * (1 - w / n) / n)), lvl: med(runs.map((r) => r.lvl)), evo: fmtT(med(evo)), time: fmtT(med(runs.map((r) => r.t))), nEvo: +(runs.reduce((a, r) => a + r.nEvo, 0) / n).toFixed(1) };
}
