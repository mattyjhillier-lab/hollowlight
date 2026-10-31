// Summarise tempest-standstill.jsonl -> markdown tables. Usage: node scripts/tempest-standstill-report.mjs in.jsonl
import { readFileSync } from 'node:fs';
const rows = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const by = new Map();
for (const r of rows) { if (!by.has(r.key)) by.set(r.key, []); by.get(r.key).push(r); }
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const se = (a) => (a.length > 1 ? sd(a) / Math.sqrt(a.length) : NaN);
const med = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const f = (x, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const keys = [...by.keys()].sort();
const lines = ['| tier | tree | weapon/evo | arm | n | win% (SE) | evo% | win% | med t s | hpLost (SE) | kills/min post-evo (n) |', '|---|---|---|---|---|---|---|---|---|---|---|'];
for (const k of keys) {
  const [tier, tree, w, evo, arm] = k.split('|'); const a = by.get(k);
  const p = mean(a.map((r) => +r.win)), n = a.length, ev = a.filter((r) => r.got);
  const kpm = ev.filter((r) => r.t - r.evoT > 30).map((r) => (r.kills - r.kEvo) / ((r.t - r.evoT) / 60));
  lines.push(`| ${tier} | ${tree} | ${evo} | ${arm} | ${n} | ${f(p * 100)} (${f(Math.sqrt(p * (1 - p) / n) * 100)}) | ${f(ev.length / n * 100)} | ${ev.length ? f(mean(ev.map((r) => +r.win)) * 100) : '-'} (n=${ev.length}) | ${f(med(a.map((r) => r.t)))} | ${f(mean(a.map((r) => r.hpLost)))} (${f(se(a.map((r) => r.hpLost)))}) | ${f(mean(kpm))} ±${f(se(kpm))} (${kpm.length}) |`);
}
console.log(lines.join('\n'));
