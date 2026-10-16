// U3 check: node scripts/u3-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4181`). Own Chrome on port 9378.
// Screenshots (title, continue state, hero select with each hero) at 3 sizes; per screen: fits without scroll, taps >= 44, text >= 12, no external requests,
// console errors; keyboard-only walkthrough (Tab order, Enter, arrows, Esc, Enter starts the run).
import { launch, VIEWS, sleep } from './u3-lib.mjs';
const out = process.argv[2]; const base = process.argv[3] || 'http://localhost:4181';
const c = await launch(9378);
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
const MEASURE = `(async()=>{await document.fonts.ready;const l=[...document.querySelectorAll('.overlay.u3')].find(e=>e.style.display!=='none');const W=l.querySelector('.u3-wrap');
 const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const taps=[...l.querySelectorAll('button,[role=radio]')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.className.split(' ')[0]),Math.round(r.width),Math.round(r.height)]});
 let minF=99;const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p)||p.closest('.u3-sr'))continue;minF=Math.min(minF,parseFloat(getComputedStyle(p).fontSize))}
 const kids=[...W.querySelectorAll('*')].filter(vis);const wr=W.getBoundingClientRect();const out=kids.filter(e=>{const r=e.getBoundingClientRect();return r.right>wr.right+1||r.left<wr.left-1||r.bottom>wr.bottom+1||r.top<wr.top-1}).map(e=>e.className.baseVal??e.className).slice(0,4);
 return {scroll:W.scrollHeight>W.clientHeight+1||W.scrollWidth>W.clientWidth+1,small:taps.filter(t=>t[1]<44||t[2]<44),minF,out,fonts:[...document.fonts].filter(f=>f.status!=='loaded').length}})()`;
const check = async (tag) => { const m = await c.ev(MEASURE); console.log(' ', tag, JSON.stringify(m));
  if (m.scroll) fail(tag + ' scrolls'); if (m.small.length) fail(tag + ' small taps ' + JSON.stringify(m.small)); if (m.minF < 12) fail(tag + ' text ' + m.minF); if (m.out.length) fail(tag + ' overflow ' + m.out); };
const active = () => c.ev("(()=>{const e=document.activeElement;return (e.getAttribute('role')||e.tagName)+':'+((e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,14))})()");
const BEGIN = "document.querySelector('.u3-title .lg-btn').click()";
for (const [n, w, h, d, m] of VIEWS) {
  console.log(n);
  await c.open(`${base}/${m ? '?touch=1' : ''}`, w, h, d, m); await sleep(500);
  await c.shot(out, `after-title-${n}`); await check('title');
  if (c.reqs.some((u) => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:'))) fail('external request ' + c.reqs.filter((u) => !u.startsWith(base) && !u.startsWith('data:')));
  await c.ev("(()=>{const a=__app.save.data;a.stats.runs=3;a.gold=120;a.shards=2;__app.showMenu()})()"); await sleep(400);
  await c.shot(out, `after-title-continue-${n}`); await check('continue');
  await c.ev(BEGIN); await sleep(400);
  await c.shot(out, `after-hero-wren-${n}`); await check('hero');
  await c.ev("document.querySelectorAll('.u3-hero')[1].click()"); await sleep(300);
  await c.shot(out, `after-hero-elias-${n}`);
  if (c.errors.length) fail('console ' + c.errors.join(';'));
}
// keyboard-only walkthrough (desktop)
console.log('keyboard');
await c.open(`${base}/`, 1280, 720, 1, false); await sleep(500);
const seen = [await active()];
for (let i = 0; i < 4; i++) { await c.key('Tab', 'Tab', 9); seen.push(await active()); }
console.log(' title tab order', seen.join(' > '));
if (!/^BUTTON:Begin/.test(seen[0]) || !/Skill/.test(seen[1]) || !/Setti/.test(seen[2])) fail('title tab order');
await c.ev('document.activeElement.blur()');
await c.key('Enter', 'Enter', 13); await sleep(300);
if (!(await c.ev("document.querySelector('.layer-hero').style.display!=='none'"))) fail('Enter on body did not open hero select');
console.log(' hero focus', await active());
await c.key('ArrowRight', 'ArrowRight', 39); console.log(' after Right', await active(), await c.ev("document.querySelector('.u3-hero-screen .lg-btn--primary').textContent"));
await c.key('1', 'Digit1', 49); console.log(' after 1', await active());
await c.key('Tab', 'Tab', 9); await c.key('Tab', 'Tab', 9); console.log(' tab x2', await active());
await c.key('Escape', 'Escape', 27); await sleep(300);
if (!(await c.ev("document.querySelector('.layer-start').style.display!=='none'"))) fail('Esc did not return to title');
await c.ev('document.activeElement.blur()');
await c.key('Enter', 'Enter', 13); await sleep(300);
await c.ev('document.activeElement.blur()');
await c.key('ArrowRight', 'ArrowRight', 39); await c.key('Enter', 'Enter', 13); await sleep(1200);
const run = await c.ev('JSON.stringify([__app.sim&&__app.sim.characterId, document.querySelector(".layer-hero").style.display])');
console.log(' run after Enter:', run);
if (!run.includes('"elias"')) fail('Enter did not start Elias');
// T and S shortcuts from the title
await c.open(`${base}/`, 1280, 720, 1, false); await sleep(400);
await c.ev('document.activeElement.blur()'); await c.key('s', 'KeyS', 83); await sleep(300);
console.log(' S opens settings:', await c.ev("document.querySelector('.settings')&&document.querySelector('.settings').style.display!=='none'"));
c.close();
console.log(fails ? `FAILS ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
