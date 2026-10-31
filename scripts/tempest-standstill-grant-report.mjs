import { readFileSync } from 'node:fs';
const rows = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const by = new Map(); for (const r of rows) { if (!by.has(r.key)) by.set(r.key, []); by.get(r.key).push(r); }
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const se = (a) => { const m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length) : NaN; };
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const T0 = Number([...by.keys()][0].match(/^T(\d+)/)[1]);
console.log('| kit | evo | arm | n | win% (SE) | median survived s past T0 | mean (SE) | hpLost (SE) | kills/min (SE) |\n|---|---|---|---|---|---|---|---|---|');
for (const k of [...by.keys()].sort()) {
  const [, kit, , evo, arm] = k.split('|'); const a = by.get(k), p = mean(a.map((r) => +r.win));
  const s = a.map((r) => r.t - T0), km = a.map((r) => (r.kills - r.k0) / Math.max(1, (r.t - T0)) * 60);
  console.log(`| ${kit} | ${evo} | ${arm} | ${a.length} | ${(p * 100).toFixed(0)} (${(Math.sqrt(p * (1 - p) / a.length) * 100).toFixed(0)}) | ${med(s)} | ${mean(s).toFixed(0)} (${se(s).toFixed(0)}) | ${mean(a.map((r) => r.hpLost)).toFixed(0)} (${se(a.map((r) => r.hpLost)).toFixed(0)}) | ${mean(km).toFixed(0)} (${se(km).toFixed(0)}) |`);
}
