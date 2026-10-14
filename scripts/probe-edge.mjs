// Edge-case probe: Pack Howl multiplier, Legion howl vs Pack Howl speed, Sanctum Halo healing,
// orbit "donut hole", boss while kiting, fear on bosses. Usage: node scripts/probe-edge.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Sim } from '../src/sim/Sim.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (n) => JSON.parse(readFileSync(join(dir, `${n}.json`), 'utf8'));
const base = Object.fromEntries(['balance', 'weapons', 'evolutions', 'characters', 'enemies', 'chapters'].map((n) => [n, load(n)]));
const data = {
  ...base,
  enemies: { ...base.enemies, dummy: { name: 'Dummy', hp: 1e9, speed: 0, dmg: 0, r: 8, xp: 0, gold: 0, color: '#fff', shape: 'wolf', mass: 1 } },
  chapters: { cursed_forest: { ...base.chapters.cursed_forest, waves: [], events: [], bossAt: 1e9 } },
};
const DT = 1 / 60;
const maxed = (wid) => Object.fromEntries(Object.keys(data.weapons[wid].stats).map((k) => [k, 5]));
function mk(wid, evo, char = 'wren') {
  const sim = new Sim({ data, characterId: char, seed: 5, godMode: true });
  sim.weapons.length = 0; sim.patches = []; sim.rollDrops = () => {};
  sim.debugGrant(wid, maxed(wid), evo);
  return sim;
}
const dmgOver = (sim, secs, each) => { const d0 = sim.damageDealt; for (let i = 0; i < secs / DT; i++) { if (each) each(sim, i); sim.step(DT, {}); } return (sim.damageDealt - d0) / secs; };

// 1. Pack Howl: desc says "move and bite twice as fast". Measure the DPS multiplier on one dummy.
console.log('1) Pack Howl DPS multiplier on a single dummy (forced howl every frame)');
for (const evo of [null, 'phantom_stampede', 'howling_legion', 'dire_alpha']) {
  const a = mk('ghost_wolves', evo); a.spawnEnemy('dummy', a.player.x + 30, a.player.y);
  const b = mk('ghost_wolves', evo); b.spawnEnemy('dummy', b.player.x + 30, b.player.y);
  const n = dmgOver(a, 10); const h = dmgOver(b, 10, (s) => { s.buffs.packHowl = 6; });
  console.log(`   ${evo || 'base max'}: ${n.toFixed(0)} -> ${h.toFixed(0)} dps (x${(h / n).toFixed(2)})`);
}

// 2. Howling Legion periodic howl while Pack Howl is active.
{
  const s = mk('ghost_wolves', 'howling_legion');
  s.ability.cdLeft = 0; s.step(DT, { ability: true });
  const m0 = s.buffs.speedMult; let after = m0; let t = 0;
  for (; t < 6; t += DT) { s.step(DT, {}); if (s.buffs.speedMult !== m0) { after = s.buffs.speedMult; break; } }
  console.log(`2) Pack Howl speedMult ${m0} -> ${after} after Legion howl at +${t.toFixed(1)}s (boost left ${s.buffs.speedBoost.toFixed(1)}s)`);
}

// 3. Sanctum Halo heal: player standing still vs walking a slow circle, 60 s, no enemies.
for (const mode of ['still', 'circle r60']) {
  const s = mk('holy_orbit', 'sanctum_halo', 'elias'); s.player.hp = 1;
  let zonesUnder = 0, frames = 0;
  for (let i = 0; i < 60 / DT; i++) {
    const t = i * DT;
    s.step(DT, mode === 'still' ? {} : { x: Math.cos(t * 1.4), y: Math.sin(t * 1.4) });
    frames++; if (s.zones.some((z) => Math.hypot(s.player.x - z.x, s.player.y - z.y) < z.r)) zonesUnder++;
  }
  console.log(`3) Sanctum Halo ${mode}: healed ${(s.player.hp - 1).toFixed(1)} hp in 60s, on a zone ${Math.round((100 * zonesUnder) / frames)}% of time, zones alive ${s.zones.length}`);
}

// 4. Donut hole: one dummy at distance d from player; orbit/raven DPS by distance.
console.log('4) Orbitals vs a static dummy at distance d (dps). Enemies that reach you sit at d~0-15.');
const ds = [0, 15, 30, 45, 60, 75, 100, 130];
for (const [wid, evo] of [['holy_orbit', null], ['holy_orbit', 'sanctum_halo'], ['holy_orbit', 'judgement_wheel'], ['raven_flock', null], ['raven_flock', 'murder_storm']]) {
  const row = ds.map((d) => { const s = mk(wid, evo); s.spawnEnemy('dummy', s.player.x + d, s.player.y); return dmgOver(s, 6).toFixed(0).padStart(4); });
  console.log(`   ${(evo || wid + ' max').padEnd(18)} d=${ds.join('/')}: ${row.join(' ')}`);
}

// 5. Boss while kiting (player walks a circle r~80 around the arena centre so the boss follows).
console.log('5) Elder Treant TTK with player kiting in a circle (god mode, 120s cap)');
const all = [];
for (const wid of Object.keys(data.weapons)) { all.push([wid, null]); for (const [eid, e] of Object.entries(data.evolutions)) if (e.weapon === wid) all.push([wid, eid]); }
for (const [wid, evo] of all) {
  const s = mk(wid, evo); s.time = 600; s.ability.cdLeft = 1e9;
  const boss = s.spawnEnemy('elder_treant', s.player.x + 90, s.player.y);
  let fear = 0, f = 0, t = 0;
  for (; t < 120 && !boss.dead; t += DT) { s.step(DT, { x: Math.cos(t * 0.9), y: Math.sin(t * 0.9) }); f++; if (boss.fearT > 0) fear++; }
  console.log(`   ${(evo || wid + ' max').padEnd(22)} ttk ${boss.dead ? t.toFixed(0) + 's' : '>120s (' + Math.round(100 * (1 - boss.hp / boss.maxHp)) + '%)'} bossFeared ${Math.round((100 * fear) / f)}%`);
}

// 6. Stats ignored after each evolution (rank spent there is wasted once evolved).
console.log('6) Stat sensitivity after evolution: dps change when one non-pair stat goes 5 -> 0 (swarm of static dummies)');
for (const [eid, e] of Object.entries(data.evolutions)) {
  const res = [];
  for (const k of Object.keys(data.weapons[e.weapon].stats)) {
    if (e.pair.includes(k)) continue;
    const go = (rank) => { const s = new Sim({ data, characterId: 'wren', seed: 9, godMode: true }); s.weapons.length = 0; s.patches = []; s.rollDrops = () => {};
      s.debugGrant(e.weapon, { ...maxed(e.weapon), [k]: rank }, eid);
      for (let i = 0; i < 30; i++) { const a = (i / 30) * 6.283; const d = 20 + (i % 6) * 22; s.spawnEnemy('dummy', s.player.x + Math.cos(a) * d, s.player.y + Math.sin(a) * d); }
      return dmgOver(s, 8); };
    const hi = go(5), lo = go(0);
    res.push(`${k} ${hi > 0 ? Math.round((100 * (lo - hi)) / hi) : 0}%`);
  }
  console.log(`   ${eid.padEnd(18)} ${res.join(', ')}`);
}

// 7. Base-weapon stat value: maxed weapon, one stat dropped 5 -> 0, real minute-8 swarm (60 alive), bot-style kiting.
function kite(sim) {
  const p = sim.player; let ax = 0, ay = 0;
  for (const e of sim.enemies) { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 90) { const w = (90 - d) / 90; ax += dx / d * w; ay += dy / d * w; } }
  return { x: ax, y: ay };
}
console.log('7) Base stat value in a kiting swarm: effective dps loss when that stat is rank 0 instead of 5 (others 5); hitsTaken/s');
for (const wid of Object.keys(data.weapons)) {
  const go = (ranks) => {
    const s = new Sim({ data, characterId: 'wren', seed: 11, godMode: true }); s.weapons.length = 0; s.patches = []; s.rollDrops = () => {};
    s.debugGrant(wid, ranks); s.time = 480; s.ability.cdLeft = 1e9;
    let eff = 0, taken = 0; const h = s.hurt.bind(s); s.hurt = (e, a, o) => { if (!e.dead && a > 0) eff += Math.min(a, Math.max(0, e.hp)); return h(e, a, o); };
    const dp = s.damagePlayer.bind(s); s.damagePlayer = (a) => { if (s.player.iframes <= 0) taken++; return dp(a); };
    const fill = () => { const p = s.player; while (s.enemies.length < 60) { const a = s.rng.range(0, 6.283), d = 160 + s.rng.next() * 60; s.spawnEnemy(s.rng.chance(0.5) ? 'wolf' : 'crow', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); } };
    for (let i = 0; i < 30 / DT; i++) { fill(); s.step(DT, kite(s)); if (s.state === 'levelup') { s.pending = 0; s.offer = null; s.state = 'running'; s.xp = 0; } }
    return [eff / 30, taken / 30];
  };
  const [full, tk] = go(maxed(wid));
  const parts = Object.keys(data.weapons[wid].stats).map((k) => { const [v, t2] = go({ ...maxed(wid), [k]: 0 }); return `${k} ${Math.round((100 * (v - full)) / full)}% (taken ${t2.toFixed(2)})`; });
  console.log(`   ${wid.padEnd(16)} full ${full.toFixed(0)} dps taken ${tk.toFixed(2)}/s | ${parts.join(', ')}`);
}
