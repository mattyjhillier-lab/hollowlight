// STALE PROBE (2026-10-30): old gates-lib bot, win rates not comparable to the live game; the aggregate table at the top is still valid. Balance numbers: scripts/rt-matrix.mjs.
// Soft-cap effect on the EXISTING 63-node tree. The cap is a script-side transform of aggregateMods output
// (total = cap * (1 - exp(-sum/cap)) per stat category; verbs such as rerolls/revive/auto are untouched).
// Usage: node scripts/gates-softcap.mjs [seeds=48] [scales=1,0.6,0.4]
import { GATES, STARTER_EVOS, SOFT, buildTree, runGrid, printGrid } from './gates-lib.mjs';

const seeds = Number(process.argv[2] || 48);
const scales = (process.argv[3] || '1,0.6,0.4').split(',').map(Number);
const all = { weapons: GATES.filter((g) => g.kind === 'weapon').map((g) => g.id), evos: [...STARTER_EVOS, ...GATES.filter((g) => g.kind === 'evo').map((g) => g.id)] };

// 1) what the cap does to the aggregate
const raw = buildTree({ preset: 'full' });
console.log('category            raw full tree   soft cap (scale 1)  cap');
const show = (name, rv, sv, cap) => console.log(`${name.padEnd(18)} ${String(rv).padStart(10)}    ${String(sv).padStart(10)}        ${cap}`);
for (const scale of scales) {
  const s = buildTree({ preset: 'full', soft: true, scale });
  console.log(`-- scale ${scale}`);
  const pc = (v) => `${((v - 1) * 100).toFixed(1)}%`;
  for (const k of ['damage', 'area', 'speed', 'pickup', 'xp', 'gold']) show(`mod.${k}`, pc(raw.mods[k]), pc(s.mods[k]), `${SOFT[`mod_${k}`] * scale}%`);
  for (const k of ['cooldown', 'abilityCd']) show(`mod.${k} (cut)`, `${((1 - raw.mods[k]) * 100).toFixed(1)}%`, `${((1 - s.mods[k]) * 100).toFixed(1)}%`, `${SOFT[`mod_${k}`] * scale}%`);
  show('maxHp', pc(raw.player.maxHp), pc(s.player.maxHp), `${SOFT.maxHp * scale}%`);
  show('levelHeal', `${raw.player.levelHeal.toFixed(1)}%`, `${s.player.levelHeal.toFixed(1)}%`, `${SOFT.levelHeal * scale}%`);
  for (const k of ['heart', 'magnet', 'heartHeal']) show(`drop.${k}`, pc(raw.drops[k]), pc(s.drops[k]), `${SOFT[k] * scale}%`);
  const wp = (a, w, st) => (a.weaponBonus[w]?.[st]?.pct ?? 0).toFixed(1) + '%';
  for (const [w, st] of [['ghost_wolves', 'power'], ['holy_orbit', 'power'], ['spirit_bolts', 'power'], ['raven_flock', 'range']]) show(`${w}.${st}`, wp(raw, w, st), wp(s, w, st), `${(st === 'power' ? SOFT.w_power : SOFT.w_other) * scale}%`);
}

// 2) win rates
const rows = [
  { name: 'ref: all unlocked, no tree', ...all, treeSpec: { preset: 'none' } },
  { name: 'old full tree, raw', ...all, treeSpec: { preset: 'full' } },
  ...scales.map((scale) => ({ name: `old full tree, soft cap x${scale}`, ...all, treeSpec: { preset: 'full', soft: true, scale } })),
  { name: 'old half tree, raw', ...all, treeSpec: { preset: 'half' } },
  { name: 'old half tree, soft cap x1', ...all, treeSpec: { preset: 'half', soft: true, scale: 1 } },
];
console.log(`\nseeds=${seeds}, all weapons/evolutions unlocked`);
const res = await runGrid(rows, seeds);
printGrid(rows, res);
