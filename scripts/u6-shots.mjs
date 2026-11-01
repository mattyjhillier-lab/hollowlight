// U6 check: node scripts/u6-shots.mjs <outDir> <before|after> [baseUrl]   (serve a build first: npx vite preview --port 4190)
// Own headless Chrome on port 9396 (kills only that PID). The REAL ui.showEnd is called in a debug run (never touches the real save) with staged
// result + bank objects of the exact shapes sim.result() / app.bankRun() produce. Screenshots every scenario at 1280x720, 844x390@2x, 390x844@2x.
// 'after' also measures (no scroll, buttons in view and >= 44 px, text >= 12 px, dropped rows).
import { launch, VIEWS as V0, sleep } from './u3-lib.mjs';
const VIEWS = process.env.BIG ? [['d2560x1440', 2560, 1440, 1, false], ['d2560x1080', 2560, 1080, 1, false], ['d1920x1001', 1920, 1001, 1, false], ['d1440x900', 1440, 900, 1, false], ...V0] : V0; // BIG=1 adds large desktop windows
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const out = process.argv[2]; const mode = process.argv[3] || 'after'; const base = process.argv[4] || 'http://localhost:4190';
const c = await launch(+process.env.PORT || 9396);
const shot = async (dir, name) => { mkdirSync(dir, { recursive: true }); const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); writeFileSync(join(dir, name + '.jpg'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
let fails = 0;

const W = (id, damage, evo = null, kills = 0) => ({ id, evo, ranks: { power: 3, speed: 3 }, damage, kills });
const SCEN = {
  early: { r: { outcome: 'defeat', time: 96, level: 3, kills: 31, gold: 24, shards: 0, bossKilled: false, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 900)] }, bank: { gold: 24, shards: 0, bestTime: 462, newBest: false, prevBest: 462, newly: [], closest: [] } },
  nearmiss: { r: { outcome: 'defeat', time: 462, level: 9, kills: 412, gold: 312, shards: 2, bossKilled: false, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 6200), W('holy_orbit', 2400), W('raven_flock', 1400)] }, bank: { gold: 1840, shards: 7, bestTime: 680, newBest: false, prevBest: 680, newly: [], closest: [{ id: 'x', name: 'Raven Flock', gate: true, frac: 0.84, text: 'Crows slain: 101/120' }] } },
  newbest: { r: { outcome: 'defeat', time: 700, level: 12, kills: 640, gold: 520, shards: 3, bossKilled: false, chapter: 'cursed_forest', character: 'elias', weapons: [W('holy_orbit', 5000), W('spirit_bolts', 1000)] }, bank: { gold: 2400, shards: 9, bestTime: 700, newBest: true, prevBest: 462, newly: [], closest: [{ id: 'x', name: 'Chain Lightning', gate: false, frac: 0.4, text: 'Wolves slain: 80/200' }] } },
  newunlock: { r: { outcome: 'defeat', time: 540, level: 10, kills: 500, gold: 400, shards: 1, bossKilled: false, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 4000), W('holy_orbit', 2000)] }, bank: { gold: 900, shards: 3, bestTime: 600, newBest: false, prevBest: 600, newly: ['NEW: Raven Flock is ready to unlock in the Skill Tree (150 gold).', 'Second thing', 'Third thing'], closest: [] } },
  victory: { r: { outcome: 'victory', time: 900, level: 17, kills: 1538, gold: 1120, shards: 5, bossKilled: true, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 12000, 'phantom_stampede'), W('holy_orbit', 4000), W('raven_flock', 2000)] }, bank: { gold: 2648, shards: 10, bestTime: 900, newBest: true, prevBest: 700, newly: ['NEW: Hall node is ready.'], closest: [] } },
  many: { r: { outcome: 'defeat', time: 612, level: 14, kills: 902, gold: 640, shards: 5, bossKilled: false, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 5000), W('holy_orbit', 4000), W('raven_flock', 3000), W('spirit_bolts', 2000), W('chain_lightning', 1000)] }, bank: { gold: 1500, shards: 8, bestTime: 612, newBest: true, prevBest: 500, newly: [], closest: [{ id: 'x', name: 'Frost Bell', gate: false, frac: 0.2, text: 'Kills: 40/200' }] } },
  evolved: { r: { outcome: 'defeat', time: 800, level: 16, kills: 1300, gold: 900, shards: 4, bossKilled: true, chapter: 'cursed_forest', character: 'elias', weapons: [W('holy_orbit', 9000, 'sanctum_halo'), W('spirit_bolts', 3000, 'soul_lance'), W('ghost_wolves', 1500)] }, bank: { gold: 3000, shards: 12, bestTime: 800, newBest: true, prevBest: 700, newly: [], closest: [{ id: 'x', name: 'A node with a rather long name indeed', gate: false, frac: 0.55, text: 'Some long condition text: 1234/5678 + another: 12/99' }] } },
  zerodmg: { r: { outcome: 'defeat', time: 40, level: 1, kills: 0, gold: 0, shards: 0, bossKilled: false, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 0), W('holy_orbit', 0)] }, bank: { gold: 1840, shards: 7, bestTime: 462, newBest: false, prevBest: 462, newly: [], closest: [] } },
  longnames: { tweak: "(() => { const d = __app.data; d.characters.wren.name = 'Wren Thistlewood-Featherstonehaugh of the Hollow Marches, ' + 'Keeper of Very Long Names '.repeat(3); d.evolutions.phantom_stampede.name = 'The Magnificently Overlong Pouncing Pack of Endless Moonlit Hunting'; d.chapters.cursed_forest.name = 'The Extraordinarily Cursed Forest of Neverending Names'; })()", r: { outcome: 'victory', time: 900, level: 99, kills: 1234567, gold: 9999999, shards: 99999, bossKilled: true, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 12000, 'phantom_stampede'), W('holy_orbit', 4000), W('raven_flock', 2000)] }, bank: { gold: 99999999, shards: 999999, bestTime: 900, newBest: false, prevBest: 900, newly: ['NEW: ' + 'a very long unlock sentence '.repeat(10)], closest: [] } },
  hostile: { r: { outcome: 'defeat', time: 300, level: 5, kills: 100, gold: 50, shards: 0, bossKilled: false, chapter: '<img src=x onerror=alert(1)>', character: '"><script>1</script>', weapons: [W('<b>x</b>', 100), W('ghost_wolves', 5, '<i>e</i>')] }, bank: { gold: 50, shards: 0, bestTime: 300, newBest: false, prevBest: 300, newly: ['<img src=x onerror=alert(2)>'], closest: [{ id: 'x', name: '<script>alert(3)</script>', gate: false, frac: 0.5, text: '<b>bold</b>' }], note: '<u>note</u>' } },
  debug: { r: { outcome: 'defeat', time: 200, level: 4, kills: 60, gold: 30, shards: 0, bossKilled: false, chapter: 'cursed_forest', character: 'wren', weapons: [W('ghost_wolves', 500)] }, bank: null },
};
const names = Object.keys(SCEN).filter((n) => !process.env.ONLY || process.env.ONLY.split(',').includes(n)).filter((n) => mode !== 'before' || n !== 'hostile'); // the old screen throws on unknown evolution ids

const STAGE = (n) => `(() => { ${process.env.INJECT ? `if(!document.getElementById('inj')){const st=document.createElement('style');st.id='inj';st.textContent=${JSON.stringify(process.env.INJECT)};document.head.append(st);}` : ''} const S = ${JSON.stringify(SCEN[n])}; if (S.tweak) eval(S.tweak); __app.ui.hideAll(); __app.sim.state = 'defeat'; __app.ui.showEnd({ result: () => S.r }, S.bank); return 1; })()`;
const MEASURE = `(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 1200));
  const lay = document.querySelector('.layer-end'); const R = (e) => e.getBoundingClientRect();
  const vis = (e) => { const r = R(e), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const btns = [...lay.querySelectorAll('.lg-btn')].filter(vis);
  const taps = btns.map((b) => { const r = R(b); return { w: Math.round(r.width), h: Math.round(r.height), inView: r.top >= -0.5 && r.bottom <= innerHeight + 0.5 && r.left >= -0.5 && r.right <= innerWidth + 0.5 }; });
  let minF = 99; const small = []; const tw = document.createTreeWalker(lay, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { if (!n.textContent.trim()) continue; const p = n.parentElement; if (!vis(p) || p.closest('.u6-sr') || p.closest('[hidden]')) continue; const f = parseFloat(getComputedStyle(p).fontSize); if (f < minF) minF = f; if (f < 12) small.push(p.className + ':' + f); }
  const out = []; for (const e of lay.querySelectorAll('.u6-main *, .u6-acts *')) { if (!vis(e) || (e.closest('svg') && e.tagName !== 'svg')) continue; const r = R(e); if (r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1 || r.top < -1) out.push(e.className + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom)); }
  const panel = lay.querySelector('.u6-panel'), main = lay.querySelector('.u6-main'), acts = lay.querySelector('.u6-acts');
  const wrap = lay.querySelector('.u6-wrap');
  return { taps, minF, small, out, dropped: wrap.getAttribute('data-dropped'), scroll: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1 || lay.scrollHeight > lay.clientHeight + 1, mainOver: main.scrollHeight > main.clientHeight + 1, panelOver: panel.scrollHeight > panel.clientHeight + 1, noOverlap: R(panel).bottom <= R(acts).top + 0.5 && R(main).bottom <= R(acts).top + 0.5, ext: performance.getEntriesByType('resource').map((r) => r.name).filter((u) => !u.startsWith(location.origin) && !u.startsWith('data:')) };
})()`;
const start = async (url, w, h, d, m) => { await c.open(url, w, h, d, m); for (let i = 0; i < 60; i++) { if (await c.ev('!!(window.__app && window.__app.sim)')) break; await sleep(250); } await sleep(1200); };
for (const [vn, w, h, d, m] of VIEWS.filter((v) => !process.env.VIEW || v[0] === process.env.VIEW)) {
  console.log(vn);
  await start(`${base}/?auto=wren&seed=1&god=1${m ? '&touch=1' : ''}`, w, h, d, m);
  for (const n of names) {
    await c.ev(STAGE(n)); await sleep(mode === 'before' ? 400 : 1500);
    await shot(join(out, mode), `${n}-${vn}`);
    if (mode === 'after') {
      const m1 = await c.ev(MEASURE);
      const bad = m1.scroll || m1.mainOver || m1.panelOver || !m1.noOverlap || m1.out.length || m1.small.length || m1.taps.some((t) => !t.inView || t.w < 44 || t.h < 44);
      console.log(bad ? 'FAIL' : 'PASS', n, vn, JSON.stringify({ dropped: m1.dropped, minF: m1.minF, taps: m1.taps.map((t) => `${t.w}x${t.h}`).join(','), scroll: m1.scroll, mainOver: m1.mainOver, panelOver: m1.panelOver, out: m1.out.slice(0, 3), small: m1.small.slice(0, 3), ext: m1.ext }));
      if (bad) fails++;
    }
  }
}
if (c.errors.length) console.log('PAGE ERRORS', c.errors.slice(0, 5));
c.close();
console.log(fails ? `FAILS ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
