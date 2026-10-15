// Starter-kit candidates: which second starter weapon keeps a no-tree starter run near the 15-25% target?
// Usage: node scripts/gates-kits.mjs [seeds=48]   (no tree, evolutions: the one starter evolution per kit weapon)
import { runJobs, summarise } from './gates-lib.mjs';
const seeds = Number(process.argv[2] || 48);
const SIG = { wren: 'ghost_wolves', elias: 'holy_orbit' };
const EVO = { ghost_wolves: 'howling_legion', raven_flock: 'dive_bombers', spirit_bolts: 'spirit_tempest', holy_orbit: 'sanctum_halo', chain_lightning: 'thunder_judgment' };
const cands = { wren: ['raven_flock', 'spirit_bolts', 'holy_orbit', null], elias: ['raven_flock', 'spirit_bolts', 'ghost_wolves', null] };
const jobs = [];
for (const [hero, list] of Object.entries(cands)) for (const second of list) for (const focus of [false, true]) for (let seed = 1; seed <= seeds; seed++) {
  const kit = second ? [SIG[hero], second] : [SIG[hero]];
  jobs.push({ key: `${hero}|${second || '(signature only)'}|${focus ? 'focus' : 'random'}`, cfg: { hero, seed, focus, kit, weapons: [], evos: kit.map((k) => EVO[k]), treeSpec: { preset: 'none' } } });
}
const res = await runJobs(jobs);
console.log('hero  kit second weapon     random win% (L, firstEvo) | focus win% (L, firstEvo)');
for (const [hero, list] of Object.entries(cands)) for (const second of list) {
  const c = (b) => { const s = summarise(res.get(`${hero}|${second || '(signature only)'}|${b}`)); return `${String(s.win).padStart(3)}% (L${s.lvl}, ${s.evo})`; };
  console.log(`${hero.padEnd(6)}${(second || '(signature only)').padEnd(20)} ${c('random').padEnd(22)} | ${c('focus')}`);
}
