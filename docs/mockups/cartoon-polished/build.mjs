// node build.mjs [filter]  -> p1/p2 x world|creatures|tree|levelup  HTML + PNG (local Chrome; Node built-ins only)
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P1, P2 } from './core.mjs';
import { page } from './frame.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] || '';
const jobs = [];
const SUBS = {
  creatures: 'Creature sheet: 8 core + 3 new Chapter-1 enemies. Heroes warm-outlined, spirits glow-rimmed, enemies bold dark-outlined.',
  world: 'In-run scene: the Hollow (grey, veined) vs restored colour. HUD: lantern = HP, moon arc = timer, spirit thread = XP.',
  tree: 'Skill web: radial from the hub, three branches. Lit = owned, pulsing = buyable, grey + lock = locked with progress.',
  levelup: 'Level-up: three icon-led cards, rarity glow, one gold EVOLVE card (gold is reserved for evolutions).',
};
const MODS = { creatures: ['./sheet.mjs', 'sheet'], world: ['./world.mjs', 'world'], tree: ['./tree.mjs', 'tree'], levelup: ['./levelup.mjs', 'levelup'] };
for (const K of [P1, P2]) {
  const n = K.id.toLowerCase();
  for (const key of Object.keys(MODS)) {
    if (only && !(n + '-' + key).includes(only)) continue;
    const m = await import(MODS[key][0]);
    jobs.push([`${n}-${key}`, page(K, SUBS[key], m[MODS[key][1]](K), m.worldDefs ? m.worldDefs(K) : '')]);
  }
}
const { renderAll } = await import('./render.mjs');
await renderAll(jobs, here);
