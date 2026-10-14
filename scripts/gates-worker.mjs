// Worker for gates-sim / gates-softcap. Input: { jobs:[{key, cfg}] } -> [{key, res}]
import { parentPort, workerData } from 'node:worker_threads';
import { playGated, buildTree } from './gates-lib.mjs';

const out = [];
for (const j of workerData.jobs) {
  const r = playGated({ ...j.cfg, tree: buildTree(j.cfg.treeSpec) });
  out.push({ key: j.key, res: { outcome: r.outcome, time: r.time, level: r.level, kills: r.kills, firstEvo: r.firstEvo, evos: r.weapons.filter((w) => w.evo).length } });
}
parentPort.postMessage(out);
