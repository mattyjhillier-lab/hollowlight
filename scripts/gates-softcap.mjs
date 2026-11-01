// Soft-cap effect on the live tree. The cap is a script-side transform of aggregateMods output (src/meta tree is untouched):
// total = cap * (1 - exp(-sum/cap)) per stat category; verbs such as rerolls/revive/auto are untouched. Win rates come from the LIVE bot
// (dodge, Blessings, Bond, map events) via scripts/live-probe.mjs; all gated weapons/evolutions are open in every row so only stat power differs.
// Target (LOCKED): tree total power inside the soft-cap budget, i.e. the capped full tree should land at or below the raw one and within the max band (65-90%).
// Usage: node scripts/gates-softcap.mjs [seeds=32] [scales=1,0.6] [bots=random]   (bots: random | random,focus; full-tree runs are slow, ~15 s each on a loaded 6-core PC; pass 12-16 seeds for a quick look)
import { SOFT, liveTreeFactory } from './live-tree.mjs';
import { runLive, summarise } from './live-probe.mjs';

const seeds = Number(process.argv[2] || 32);
const scales = (process.argv[3] || '1,0.6').split(',').map(Number);
const bots = (process.argv[4] || 'random').split(',');
const heroes = ['wren', 'elias'], SIG = { wren: 'ghost_wolves', elias: 'holy_orbit' };

// 1) what the cap does to the aggregate
const { treeFor } = await liveTreeFactory();
const raw = treeFor('full', 'ghost_wolves', 'normal', { open: true });
console.log('category            raw full tree   soft cap            cap');
const show = (name, rv, sv, cap) => console.log(`${name.padEnd(18)} ${String(rv).padStart(10)}    ${String(sv).padStart(10)}        ${cap}`);
const pc = (v) => `${((v - 1) * 100).toFixed(1)}%`;
const wp = (a, w, st) => (a.weaponBonus[w]?.[st]?.pct ?? 0).toFixed(1) + '%';
for (const scale of scales) {
  const s = treeFor('full', 'ghost_wolves', 'normal', { open: true, soft: true, scale });
  console.log(`-- scale ${scale}`);
  for (const k of ['damage', 'area', 'speed', 'pickup', 'xp', 'gold']) show(`mod.${k}`, pc(raw.mods[k]), pc(s.mods[k]), `${SOFT[`mod_${k}`] * scale}%`);
  for (const k of ['cooldown', 'abilityCd']) show(`mod.${k} (cut)`, `${((1 - raw.mods[k]) * 100).toFixed(1)}%`, `${((1 - s.mods[k]) * 100).toFixed(1)}%`, `${SOFT[`mod_${k}`] * scale}%`);
  show('maxHp', pc(raw.player.maxHp), pc(s.player.maxHp), `${SOFT.maxHp * scale}%`);
  show('levelHeal', `${raw.player.levelHeal.toFixed(1)}%`, `${s.player.levelHeal.toFixed(1)}%`, `${SOFT.levelHeal * scale}%`);
  for (const k of ['heart', 'magnet', 'heartHeal']) show(`drop.${k}`, pc(raw.drops[k]), pc(s.drops[k]), `${SOFT[k] * scale}%`);
  for (const [w, st] of [['ghost_wolves', 'power'], ['holy_orbit', 'power'], ['spirit_bolts', 'power'], ['raven_flock', 'range']]) show(`${w}.${st}`, wp(raw, w, st), wp(s, w, st), `${(st === 'power' ? SOFT.w_power : SOFT.w_other) * scale}%`);
}

// 2) win rates
const rows = [
  { name: 'ref: all unlocked, no tree', tree: 'none', spec: { open: true } },
  { name: 'full tree, raw', tree: 'full', spec: { open: true } },
  ...scales.map((scale) => ({ name: `full tree, soft cap x${scale}`, tree: 'full', spec: { open: true, soft: true, scale } })),
  { name: 'half tree, raw', tree: 'half', spec: { open: true } },
  { name: 'half tree, soft cap x1', tree: 'half', spec: { open: true, soft: true, scale: 1 } },
];
const jobs = [];
for (const row of rows) for (const hero of heroes) for (const b of bots) for (let seed = 1; seed <= seeds; seed++) jobs.push({ key: `${row.name}|${hero}|${b}`, hero, weapon: SIG[hero], seed, focus: b === 'focus', tree: row.tree, spec: row.spec });
console.log(`\nseeds=${seeds}, live bot, Twilight, Bond 0, all weapons/evolutions unlocked (win% +-SE | median level | first evo)`);
const res = await runLive(jobs);
const cols = heroes.flatMap((h) => bots.map((b) => `${h}/${b}`));
console.log(`${'row'.padEnd(32)} ${cols.map((c) => c.padStart(22)).join(' ')}`);
for (const row of rows) console.log(`${row.name.padEnd(32)} ${heroes.flatMap((h) => bots.map((b) => { const s = summarise(res.get(`${row.name}|${h}|${b}`)); return `${String(s.win).padStart(3)}% +-${s.se} L${s.lvl} ${s.evo}`.padStart(22); })).join(' ')}`);
