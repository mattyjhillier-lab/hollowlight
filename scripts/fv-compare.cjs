// Final verification: map events ON vs OFF per rt-matrix cell and pooled per power state, with Wilson 95% CIs and the LOCKED bands.
// Usage: node scripts/fv-compare.cjs <on.jsonl> <off1.jsonl> [off2.jsonl ...]   (OFF files are merged; duplicate key#seed lines skipped)
const fs = require('fs');
const rd = (f) => { const m = new Map(); for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!l) continue; let o; try { o = JSON.parse(l); } catch { continue; } m.set(`${o.key}#${o.seed}`, o); } return m; };
const [onF, ...offF] = process.argv.slice(2);
const on = [...rd(onF).values()];
const offM = new Map(); for (const f of offF) for (const [k, v] of rd(f)) offM.set(k, v);
const off = [...offM.values()];
const BOSS_AT = 840;
const W = { ghost_wolves: 'Wolves', raven_flock: 'Ravens', spirit_bolts: 'Bolts', chain_lightning: 'Chain', holy_orbit: 'Orbit' };
const T = { normal: 'Twilight', hard: 'Deep Dusk', expert: 'Long Night' };
// LOCKED bands per state (FINAL RETUNE TARGETS, RETUNE PLAN DECISIONS, RT5 decisions)
const BAND = { 'none|normal|b0|random': [15, 30], 'none|normal|b0|focus': [15, 30], 'half|normal|b0|random': [30, 55], 'full|normal|b25|random': [65, 90],
  'half|hard|b0|random': [15, 30], 'full|hard|b0|random': [35, 55], 'full|hard|b25|random': [35, 100], 'full|expert|b25|random': [10, 20] };
const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const P = (x) => Math.round(100 * x);
const st = (rs) => {
  const n = rs.length; if (!n) return null;
  const w = rs.filter((r) => r.win).length, [lo, hi] = wilson(w, n), deaths = rs.filter((r) => !r.win);
  const reach = rs.filter((r) => r.win || r.t >= BOSS_AT).length, bossD = deaths.filter((r) => r.t >= BOSS_AT).length;
  return { n, w, win: P(w / n), lo: P(lo), hi: P(hi), early: P(rs.filter((r) => !r.win && r.t < 300).length / n), reachWin: reach ? P(w / reach) : null, bossShare: deaths.length ? P(bossD / deaths.length) : null,
    fight: med(rs.filter((r) => r.win && r.bossKill).map((r) => r.bossKill - BOSS_AT)), evo: med(rs.map((r) => r.evo).filter((v) => v != null)), dMed: med(deaths.map((r) => r.t)), gold: Math.round(rs.reduce((a, r) => a + r.gold, 0) / n) };
};
const state = (k) => k.split('|').slice(2).join('|');
const pass = (s, band) => { if (!s || !band) return '-'; const [a, b] = band; if (s.win >= a && s.win <= b) return 'PASS'; const near = (s.win < a ? a - s.win : s.win - b) <= 3 && s.lo <= b && s.hi >= a; return near ? 'pass (rule)' : (s.hi < a || s.lo > b ? 'MISS (sure)' : 'miss'); };
const cell = (s) => (s ? `${s.win} (${s.lo}-${s.hi}) n${s.n}` : '-');
const states = [...new Set(on.map((r) => state(r.key)))].sort();
for (const S of states) {
  const band = BAND[S]; const [tree, tier, bond, bot] = S.split('|');
  console.log(`\n### ${T[tier]} ${tree} ${bond} ${bot}  band ${band ? band.join('-') : '-'}%`);
  console.log('| start | hero | OFF win (CI) | ON win (CI) | delta | ON pass | dead<5:00 OFF/ON | first evo OFF/ON | reach-win ON | fight ON |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  const keys = [...new Set(on.filter((r) => state(r.key) === S).map((r) => r.key))].sort();
  for (const k of keys) {
    const a = st(off.filter((r) => r.key === k)), b = st(on.filter((r) => r.key === k)); const [h, wp] = k.split('|');
    console.log(`| ${W[wp]} | ${h} | ${cell(a)} | ${cell(b)} | ${a ? (b.win - a.win > 0 ? '+' : '') + (b.win - a.win) : '-'} | ${pass(b, band)} | ${a ? a.early : '-'}/${b.early} | ${fmt(a && a.evo)}/${fmt(b.evo)} | ${b.reachWin} | ${b.fight ?? '-'} s |`);
  }
  const A = st(off.filter((r) => state(r.key) === S)), B = st(on.filter((r) => state(r.key) === S));
  const hero = (h, rs) => st(rs.filter((r) => state(r.key) === S && r.key.startsWith(h + '|')));
  console.log(`POOLED: OFF ${cell(A)} | ON ${cell(B)} | pass ${pass(B, band)} | dead<5:00 ${A ? A.early : '-'}/${B.early}% | reach-win ${A ? A.reachWin : '-'}/${B.reachWin}% | boss share ${A ? A.bossShare : '-'}/${B.bossShare}% | fight ${A ? A.fight : '-'}/${B.fight} s | first evo ${fmt(A && A.evo)}/${fmt(B.evo)} | gold ${A ? A.gold : '-'}/${B.gold}`);
  const ow = hero('wren', off), oe = hero('elias', off), nw = hero('wren', on), ne = hero('elias', on);
  console.log(`HEROES: OFF Wren ${ow ? ow.win : '-'} / Elias ${oe ? oe.win : '-'} | ON Wren ${nw.win} / Elias ${ne.win} (gap ${ne.win - nw.win})`);
  const sr = on.filter((r) => state(r.key) === S && r.st); if (sr.length) { const av = (f) => sr.reduce((x, r) => x + f(r.st), 0) / sr.length; console.log(`SITES per run: lamps ${av((s) => s.l).toFixed(1)}/12, roads ${av((s) => s.r).toFixed(2)}/2, knots ${av((s) => s.k).toFixed(2)}/2, XP ${av((s) => s.xp).toFixed(2)} L, gold ${av((s) => s.g).toFixed(0)}, Blessings ${av((s) => s.b).toFixed(2)}, shards ${av((s) => s.sh).toFixed(2)}`); }
}
