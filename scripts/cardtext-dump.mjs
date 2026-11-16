// Prints every weapon stat card as a player sees it, rank by rank (tag / title / big number / unit line / hint). Usage: node scripts/cardtext-dump.mjs [weaponId]
import { readFileSync } from 'node:fs';
import { hintText } from '../src/sim/cards.js';
import { cardModel } from '../src/ui/cardview.js';
const rd = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url)));
const data = { weapons: rd('weapons.json'), evolutions: rd('evolutions.json'), balance: rd('balance.json') };
const only = process.argv[2];
for (const [wid, def] of Object.entries(data.weapons)) {
  if (only && only !== wid) continue;
  console.log(`== ${def.name}  [${def.desc}]`);
  for (const key of Object.keys(def.stats)) {
    for (let r = 0; r < 5; r++) {
      const m = cardModel({ kind: 'stat', weaponId: wid, stat: key, rank: r, nextRank: r + 1, maxRank: 5, key: `s:${wid}:${key}` }, data);
      console.log(`${key}@${r} | ${m.title} | ${m.num} | ${m.unit} | ${m.desc}`);
    }
  }
}
