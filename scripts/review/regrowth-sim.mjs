// Independent check of the Regrowth refund (save v2 -> v3): simulate random v1 purchase histories with the v1 rules
// re-implemented from tests/fixtures/tree-v1.json, write a v2 save, load it through the real parseSave, and require
//   gold_after   == gold_start - gold spent on permanent gates
//   shards_after == shards_start - shards spent on permanent gates
//   tree_after   == exactly the gates bought
// Usage: node scripts/review/regrowth-sim.mjs [seeds=2000]
import { data } from '../../tests/helpers.mjs';
import { parseSave, serializeSave } from '../../src/save/schema.js';
import { rng, v1RandomBuys, BIG_STATS, isGateV1 } from './lib.mjs';

void data;
const N = Number(process.argv[2]) || 2000;
let bad = 0;
let maxGold = 0;
for (let seed = 1; seed <= N; seed++) {
  const rand = rng(seed);
  const steps = 1 + Math.floor(rand() * 120);
  const { tree, spent, gateSpent, byId } = v1RandomBuys(rand, steps);
  const G0 = 200000, S0 = 100;
  const save = { version: 2, createdAt: 1, updatedAt: 1, gold: G0 - spent.gold, shards: S0 - spent.shards, stats: BIG_STATS, unlocks: {}, tree, seen: {}, settings: {} };
  const r = parseSave(JSON.stringify(save));
  const wantGates = Object.keys(tree).filter((id) => isGateV1(byId[id])).sort();
  const errs = [];
  if (!r.ok) errs.push(`parse failed ${r.code}`);
  else {
    const s = r.save;
    if (s.gold !== G0 - gateSpent.gold) errs.push(`gold ${s.gold} != ${G0 - gateSpent.gold}`);
    if (s.shards !== S0 - gateSpent.shards) errs.push(`shards ${s.shards} != ${S0 - gateSpent.shards}`);
    const got = Object.keys(s.tree).sort();
    if (JSON.stringify(got) !== JSON.stringify(wantGates)) errs.push(`tree ${got} != gates ${wantGates}`);
    // idempotent through the on-disk form
    const again = parseSave(JSON.stringify(serializeSave(s)));
    if (!again.ok || again.save.gold !== s.gold || again.save.shards !== s.shards || JSON.stringify(again.save.tree) !== JSON.stringify(s.tree)) errs.push('second load changed the save');
    maxGold = Math.max(maxGold, spent.gold - gateSpent.gold);
  }
  if (errs.length) { bad++; if (bad <= 5) console.log(`seed ${seed}: ${errs.join('; ')}`); }
}
console.log(`regrowth-sim: ${N} random v1 histories, ${bad} mismatches, largest refund ${maxGold} gold`);
process.exitCode = bad ? 1 : 0;
