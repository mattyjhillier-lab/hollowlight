// Ablation re-run on the LIVE bot (paired seeds): (A) hero ability on/off, (B) gated evolutions stripped vs present, (C) Spirit Bolts as Wren's weapon.
// Usage: node scripts/ablate-rerun.mjs <A|B|C> [seeds=48]   (table to stdout; RAW=<file> also writes every run as JSON lines)
import { writeFileSync } from 'node:fs';
import { runLive, summarise } from './live-probe.mjs';
const part = process.argv[2] || 'A', N = Number(process.argv[3] || 48);
const SIG = { wren: 'ghost_wolves', elias: 'holy_orbit' };
const jobs = [];
const add = (key, hero, weapon, tree, tier, bond, spec, extra = {}) => { for (let seed = 1 + Number(process.env.SEED0 || 0); seed <= N + Number(process.env.SEED0 || 0); seed++) jobs.push({ key, hero, weapon, seed, tree, tier, bond, spec: spec || {}, ...extra }); };
const CELLS = [['fresh', 'none', 'normal', 0], ['mid', 'half', 'normal', 0], ['maxed', 'full', 'normal', 25], ['longnight-max', 'full', 'expert', 25]];
if (part === 'A') for (const h of ['wren', 'elias']) for (const [n, t, tier, b] of CELLS) for (const ab of [true, false]) add(`${h}|${n}|${ab ? 'on' : 'off'}`, h, SIG[h], t, tier, b, {}, { ability: ab });
if (part === 'B') for (const h of ['wren', 'elias']) for (const [n, t, b] of [['mid', 'half', 0], ['maxed', 'full', 25]]) for (const ev of [true, false]) add(`${h}|${n}|${ev ? 'evos' : 'noevos'}`, h, SIG[h], t, 'normal', b, ev ? {} : { strip: ['evos'] });
if (part === 'C') {
  for (const f of [false, true]) {
    const fk = f ? 'focus' : 'random';
    add(`wren|sig only|${fk}`, 'wren', 'ghost_wolves', 'none', 'normal', 0, {}, { focus: f });
    for (const s2 of ['spirit_bolts', 'raven_flock', 'holy_orbit']) add(`wren|+${s2} (starter grant)|${fk}`, 'wren', 'ghost_wolves', 'none', 'normal', 0, { extra: [s2] }, { focus: f });
    add(`wren|start WITH spirit_bolts only|${fk}`, 'wren', 'spirit_bolts', 'none', 'normal', 0, {}, { focus: f });
    add(`wren|all gates open, wolves start|${fk}`, 'wren', 'ghost_wolves', 'none', 'normal', 0, { open: true }, { focus: f });
  }
}
const res = await runLive(jobs);
if (process.env.RAW) writeFileSync(process.env.RAW, [...res.values()].flat().map((r) => JSON.stringify(r)).join('\n'));
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const se = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1) / (a.length || 1)); };
const fmt = (k) => { const s = summarise(res.get(k)); return `${String(s.win).padStart(3)}% +-${s.se} L${s.lvl} evo ${s.evo} e${s.nEvo}`; };
const keys = [...res.keys()].sort();
console.log(`part ${part}, seeds ${N}, live bot random picks unless noted`);
for (const k of keys) console.log(k.padEnd(48), fmt(k), ' hurts', mean(res.get(k).map((r) => r.hurts)).toFixed(0), ' uses', mean(res.get(k).map((r) => r.uses)).toFixed(1), ' dmg', Math.round(mean(res.get(k).map((r) => r.dmg))));
const pairs = [];
if (part === 'A') for (const h of ['wren', 'elias']) for (const [n] of CELLS) pairs.push([`${h}|${n}|on`, `${h}|${n}|off`]);
if (part === 'B') for (const h of ['wren', 'elias']) for (const n of ['mid', 'maxed']) pairs.push([`${h}|${n}|evos`, `${h}|${n}|noevos`]);
console.log('paired delta (first - second), win points +-SE, and discordant seeds');
for (const [a, b] of pairs) {
  const A = new Map(res.get(a).map((r) => [r.seed, r])), B = new Map(res.get(b).map((r) => [r.seed, r]));
  const d = [...A.keys()].map((s) => (A.get(s).win ? 1 : 0) - (B.get(s).win ? 1 : 0));
  const up = d.filter((x) => x > 0).length, dn = d.filter((x) => x < 0).length;
  console.log(`${a} vs ${b.split('|')[2]}`.padEnd(48), `${(mean(d) * 100 >= 0 ? '+' : '') + (mean(d) * 100).toFixed(1)} +-${(se(d) * 100).toFixed(1)}  (only-first-wins ${up}, only-second-wins ${dn})`);
}
if (part === 'C') for (const k of keys) { const c = {}; for (const r of res.get(k)) for (const w of r.wp) c[w] = (c[w] || 0) + 1; const n = res.get(k).length; console.log(k.padEnd(48), 'weapon adoption:', Object.entries(c).map(([w, v]) => `${w} ${Math.round((100 * v) / n)}%`).join(', ')); }
