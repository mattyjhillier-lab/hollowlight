// EXTRAS v1 Endless Dusk sweep: node scripts/endless-sweep.mjs [hero] [seeds]   (META=none|half|full, TIER=..., ASSIST=1 as in bot.mjs)
// Every run that wins its dawn stays in the dark until it falls (bot.mjs ENDLESS). Reports time past dawn and the endless gold share.
process.env.ENDLESS = '1';
const { playRun } = await import('./bot.mjs');
const hero = process.argv[2] || 'wren';
const seeds = Number(process.argv[3] || 20);
const s0 = Number(process.env.SEED_FROM || 1);
const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const pct = (a, p) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : null);
const runs = [];
for (let sd = s0; sd < s0 + seeds; sd++) runs.push(playRun(hero, sd, {}));
const dark = runs.filter((r) => r.endless).map((r) => r.endless.dark);
const share = runs.filter((r) => r.endless && r.endless.gold0 > 0).map((r) => (r.gold - r.endless.gold0) / r.endless.gold0);
console.log(`${hero} ENDLESS META=${process.env.META || 'none'} TIER=${process.env.TIER || 'normal'} x${seeds}`);
console.log(`  dawns (entered the dark) ${dark.length}/${seeds}`);
console.log(`  time past dawn  median ${fmt(pct(dark, 0.5))} (p10 ${fmt(pct(dark, 0.1))}, p90 ${fmt(pct(dark, 0.9))}, max ${fmt(Math.max(0, ...dark))})`);
console.log(`  endless gold    median +${Math.round(100 * (pct(share, 0.5) || 0))}% of the dawn gold (max +${Math.round(100 * Math.max(0, ...share))}%, cap +50%)`);
console.log(`  all dark ${dark.map((d) => fmt(d)).join(' ')}`);
