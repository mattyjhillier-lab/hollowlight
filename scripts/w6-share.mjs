// W6: Bleed (Rend) share of wolf damage with Howling Legion at max ranks: swarm (60 foes, stand still) and boss. Gates: <=35% swarm, <=10% boss.
import { Sim } from '../src/sim/Sim.js';
import { data, ranksFor } from './evo-same-ranks.mjs';
const DT = 1 / 60;
for (const sc of ['swarm', 'boss']) {
  const out = [];
  for (const seed of [1, 2, 3]) {
    const sim = new Sim({ data, characterId: 'wren', seed, godMode: true });
    sim.weapons.length = 0; sim.ability.cdLeft = 1e9; sim.rollDrops = () => {};
    sim.debugGrant('ghost_wolves', ranksFor('ghost_wolves', 'howling_legion', 'max'), 'howling_legion');
    const p = sim.player;
    if (sc === 'boss') { sim.time = 600; sim.spawnEnemy('elder_treant', p.x + 70, p.y); }
    for (let f = 0; f < (sc === 'boss' ? 40 : 20) / DT; f++) {
      if (sc === 'swarm' && f % 30 === 0) { sim.time = Math.max(sim.time, 480); for (let k = sim.enemies.filter((e) => !e.dead).length; k < 60; k++) { const a = sim.rng.range(0, 6.2832); sim.spawnEnemy(k % 2 ? 'wolf' : 'crow', p.x + Math.cos(a) * 190, p.y + Math.sin(a) * 190); } }
      sim.step(DT, {});
      if (sim.state === 'levelup') { sim.pending = 0; sim.offer = null; sim.state = 'running'; sim.xp = 0; }
    }
    out.push((100 * (sim.dotBy.ghost_wolves || 0) / (sim.dmgBy.ghost_wolves || 1)).toFixed(1));
  }
  console.log(sc, 'bleed share of wolf damage % (3 seeds):', out.join(' '));
}
