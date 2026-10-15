// G1d tuning: bless-sweep plus death-time distribution. Usage: node scripts/g1d-sweep.mjs [seeds] [label]; env as bless-sweep.
// Env: BLESS=on|off, BLESSPICK=random|defence|offence, GATES (default starter), SEED_FROM.
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

if (!isMainThread) {
  const { playRun } = await import('./bot.mjs');
  parentPort.postMessage(workerData.seeds.map((sd) => {
    const r = playRun(workerData.char, sd);
    return { win: r.outcome === 'victory', time: r.time, level: r.level, levelups: r.levelups, filler: r.filler, dead: r.dead, short: r.short, shortAt: r.marks.short ?? null, deadAt: r.marks.dead ?? null, blessAt: r.marks.bless ?? null, blessPicks: r.blessPicks, healSwaps: r.healSwaps, hpLost: r.hpLost, dmg: r.dmg, gold: r.gold };
  }));
} else {
  const { GATES, BLESS, BLESSPICK } = await import('./bot.mjs');
  const N = Number(process.argv[2] || 96);
  const label = process.argv[3] || '';
  const S0 = Number(process.env.SEED_FROM || 1);
  const CH = 4;
  const jobs = [];
  for (const char of ['wren', 'elias']) for (const focus of [false, true]) for (let c = 0; c < CH; c++) {
    const seeds = []; for (let s = S0 + c; s < S0 + N; s += CH) seeds.push(s);
    jobs.push(new Promise((res, rej) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { char, seeds }, env: { ...process.env, FOCUS: focus ? '1' : '0' } });
      w.on('message', (m) => res({ key: `${char}/${focus ? 'focus' : 'random'}`, runs: m })); w.on('error', rej);
    }));
  }
  const groups = {};
  for (const j of await Promise.all(jobs)) (groups[j.key] ||= []).push(...j.runs);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
  console.log(`bless-sweep ${label} GATES=${GATES} BLESS=${BLESS} BLESSPICK=${BLESSPICK} N=${N}`);
  console.log('cell          win%(+/-95)  lvl  surv(s)  hpLost  dmg(k)  levelups dead/run dead%  short/run 1stShort 1stBless  blessPk healSw fillerAny%');
  const out = {};
  for (const [k, rs] of Object.entries(groups).sort()) {
    const n = rs.length, w = rs.filter((r) => r.win).length, p = w / n;
    const lu = rs.reduce((a, r) => a + r.levelups, 0), dd = rs.reduce((a, r) => a + r.dead, 0);
    const fl = rs.reduce((a, r) => a + r.filler, 0);
    out[k] = { n, win: p };
    {const d=rs.filter((r)=>!r.win).map((r)=>r.time/60);const b=[0,0,0,0,0,0];for(const t of d)b[t<5?0:t<7?1:t<9?2:t<11?3:t<13?4:5]++;const ds=rs.length;console.log('   deaths '+d.length+' ('+(100*d.length/ds).toFixed(0)+'%) <5:'+b[0]+' 5-7:'+b[1]+' 7-9:'+b[2]+' 9-11:'+b[3]+' 11-13:'+b[4]+' 13+:'+b[5]+'  boss(>=10:00) share '+(d.length?(100*d.filter((t)=>t>=10).length/d.length).toFixed(0):'-')+'%');}
console.log(`${k.padEnd(13)} ${(p * 100).toFixed(0).padStart(3)}% +/-${(196 * Math.sqrt(p * (1 - p) / n)).toFixed(0).padStart(2)}  ${med(rs.map((r) => r.level)).toString().padStart(4)} ${mean(rs.map((r) => r.time)).toFixed(0).padStart(7)} ${mean(rs.map((r) => r.hpLost)).toFixed(0).padStart(7)} ${(mean(rs.map((r) => r.dmg)) / 1000).toFixed(0).padStart(6)}  ${mean(rs.map((r) => r.levelups)).toFixed(1).padStart(7)} ${mean(rs.map((r) => r.dead)).toFixed(2).padStart(8)} ${(100 * dd / lu).toFixed(1).padStart(5)}  ${mean(rs.map((r) => r.short)).toFixed(1).padStart(8)} ${fmt(med(rs.map((r) => r.shortAt).filter((v) => v != null))).padStart(7)}  ${fmt(med(rs.map((r) => r.blessAt).filter((v) => v != null))).padStart(7)}  ${mean(rs.map((r) => r.blessPicks)).toFixed(1).padStart(6)} ${mean(rs.map((r) => r.healSwaps)).toFixed(2).padStart(6)} ${(100 * fl / lu).toFixed(1).padStart(6)}`);
  }
}
