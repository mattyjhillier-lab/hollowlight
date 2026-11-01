// U4 check: node scripts/u4-shots.mjs <outDir> <before|after> [baseUrl]   (needs a built app served on 4191: npx vite preview --port 4191)
// Own Chrome on port 9391 (kills only that PID). Screenshots pause / settings / pause over a live swarm at 3 sizes. 'after' also measures + keyboard walkthrough.
import { launch, VIEWS, sleep } from './u3-lib.mjs';
const out = process.argv[2]; const mode = process.argv[3] || 'after'; const base = process.argv[4] || 'http://localhost:4191';
const c = await launch(9391);
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
const MEASURE = (sel) => `(async()=>{await document.fonts.ready;const l=document.querySelector('${sel}');const W=l.querySelector('.u4-wrap')||l;
 const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]')};
 const taps=[...l.querySelectorAll('button,[role=radio],[role=tab],[role=switch],input[type=range]')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.getAttribute('data-id')||e.className.split(' ')[0]),Math.round(r.width),Math.round(r.height)]});
 let minF=99;const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p)||p.closest('.u4-sr'))continue;minF=Math.min(minF,parseFloat(getComputedStyle(p).fontSize))}
 const wr=W.getBoundingClientRect();const out=[...l.querySelectorAll('*')].filter(vis).filter(e=>{if(e.closest('svg')&&e.tagName!=='svg')return false;const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1||r.bottom>innerHeight+1||r.top<-1}).map(e=>String(e.className.baseVal??e.className)).slice(0,4);
 const panel=l.querySelector('.lg-panel');const pr=panel&&panel.getBoundingClientRect();
 return {scroll:l.scrollHeight>l.clientHeight+1||l.scrollWidth>l.clientWidth+1||(W!==l&&(W.scrollHeight>W.clientHeight+1)),small:taps.filter(t=>t[1]<44||t[2]<44),minF,out,panel:pr&&[Math.round(pr.top),Math.round(pr.bottom),innerHeight]}})()`;
const check = async (sel, tag) => { const m = await c.ev(MEASURE(sel)); console.log(' ', tag, JSON.stringify(m));
  if (m.scroll) fail(tag + ' scrolls'); if (m.small.length) fail(tag + ' small taps ' + JSON.stringify(m.small)); if (m.minF < 12) fail(tag + ' text ' + m.minF); if (m.out.length) fail(tag + ' overflow ' + m.out); };
const kk = async (k, code, vk) => { const en = k === 'Enter' || k === ' '; await c.send('Input.dispatchKeyEvent', { type: en ? 'keyDown' : 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, ...(en ? { text: k === ' ' ? ' ' : String.fromCharCode(13) } : {}) }); await sleep(90); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); await sleep(60); };
const start = async (url, w, h, d, m) => { await c.open(url, w, h, d, m); for (let i = 0; i < 60; i++) { if (await c.ev('!!(window.__app.sim)')) break; await sleep(250); } await sleep(1800); };
for (const [n, w, h, d, m] of VIEWS) {
  console.log(n);
  await start(`${base}/?auto=wren&seed=3&t=480&god=1${m ? '&touch=1' : ''}`, w, h, d, m);
  await c.ev('__app.togglePause()'); await sleep(500);
  await c.shot(out, `${mode}-pause-swarm-${n}`);
  if (mode === 'after') await check('.layer-pause', 'pause');
  await c.ev('__app.ui.showSettings()'); await sleep(500);
  if (mode === 'before') { await c.shot(out, `before-settings-${n}`); continue; }
  for (const tab of ['sound', 'picture', 'controls', 'saves']) {
    await c.ev(`document.querySelector('.layer-settings [data-id=${tab}]').click()`); await sleep(250);
    await c.shot(out, `after-settings-${tab}-${n}`); await check('.layer-settings', 'settings ' + tab);
  }
  await c.ev("document.querySelector('.layer-settings [data-id=saves] ')&&0");
  if (c.errors.length) fail('console ' + c.errors.join(';'));
  if (c.reqs.some((u) => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:'))) fail('external request');
}
if (mode === 'after') {
  console.log('pause with four weapons');
  for (const [n, w, h, d, m] of VIEWS) {
    await start(`${base}/?auto=wren&seed=3&t=600&god=1&grant=ghost_wolves:speed=5,power=5:phantom_stampede;holy_orbit:;raven_flock:;spirit_bolts:${m ? '&touch=1' : ''}`, w, h, d, m);
    await c.ev('__app.togglePause()'); await sleep(500);
    await c.shot(out, `after-pause-full-${n}`); await check('.layer-pause', 'pause full');
  }
}
if (mode === 'after') {
  console.log('pause confirm + plain pause shots');
  for (const [n, w, h, d, m] of VIEWS) {
    await start(`${base}/?auto=elias&seed=5&t=200${m ? '&touch=1' : ''}`, w, h, d, m);
    await c.ev('__app.togglePause()'); await sleep(400);
    await c.shot(out, `after-pause-${n}`);
    await c.ev("document.querySelector('.layer-pause .lg-btn--danger').click()"); await sleep(400);
    await c.shot(out, `after-pause-confirm-${n}`); await check('.layer-pause', 'pause confirm');
  }
}
if (mode === 'after') {
  console.log('keyboard-only walkthrough');
  const active = () => c.ev("(()=>{const e=document.activeElement;return (e.getAttribute('role')||e.tagName)+':'+((e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,16))})()");
  const vis = (sel) => c.ev(`(()=>{const e=document.querySelector('${sel}');return !!e&&e.style.display!=='none'})()`);
  const expect = (cond, m) => { if (!cond) fail(m); };
  await start(`${base}/?auto=wren&seed=7&t=120&god=1`, 1280, 720, 1, false);
  await kk('Escape', 'Escape', 27); await sleep(500);
  expect(await vis('.layer-pause'), 'Esc did not pause'); console.log(' focus on pause:', await active());
  expect((await active()).startsWith('BUTTON:Resume'), 'Resume not focused');
  await kk('ArrowDown', 'ArrowDown', 40); console.log(' Down ->', await active());
  expect((await active()).startsWith('BUTTON:Settings'), 'Down did not reach Settings');
  await kk('Enter', 'Enter', 13); await sleep(400);
  expect(await vis('.layer-settings'), 'Enter did not open settings'); console.log(' settings focus:', await active());
  const trail = [];
  await kk('ArrowRight', 'ArrowRight', 39); trail.push(await active());
  await kk('Tab', 'Tab', 9); trail.push(await active());
  await kk('ArrowRight', 'ArrowRight', 39); trail.push(await active());
  console.log(' picture tab:', trail.join(' > '), 'quality=', await c.ev('__app.save.data.settings.quality'));
  expect((await c.ev('__app.save.data.settings.quality')) === 'low', 'arrow on quality did not choose Low');
  await kk('Tab', 'Tab', 9); await kk('Tab', 'Tab', 9); console.log(' next:', await active());
  await kk('ArrowLeft', 'ArrowLeft', 37); await kk('ArrowRight', 'ArrowRight', 39);
  console.log(' screenShake=', await c.ev('__app.save.data.settings.screenShake'));
  await c.ev("document.getElementById('u4-tab-picture').focus()"); await kk('ArrowLeft', 'ArrowLeft', 37); await kk('Tab', 'Tab', 9); console.log(' sound slider:', await active());
  const before = await c.ev('__app.save.data.settings.musicVol'); await kk('ArrowRight', 'ArrowRight', 39);
  const after = await c.ev('__app.save.data.settings.musicVol'); console.log(' musicVol', before, '->', after);
  expect(after > before, 'slider arrow did not change volume');
  await sleep(1500);
  const stored = await c.ev("(()=>{for(const k of Object.keys(localStorage)){try{const j=JSON.parse(localStorage[k]);if(j&&j.settings&&!k.includes('backup'))return k+':'+j.settings.musicVol}catch{}}return 'none'})()");
  console.log(' persisted', stored);
  await c.ev("document.getElementById('u4-tab-sound').focus()"); await kk('ArrowRight', 'ArrowRight', 39); await kk('Tab', 'Tab', 9); await kk('Tab', 'Tab', 9); await kk('Tab', 'Tab', 9);
  const rm0 = await c.ev('__app.save.data.settings.reducedMotion'); console.log(' on', await active()); await kk(' ', 'Space', 32); const rm1 = await c.ev('__app.save.data.settings.reducedMotion'); console.log(' Space on Calm motion', rm0, '->', rm1); expect(rm0 !== rm1, 'Space did not toggle the switch');
  await kk('Escape', 'Escape', 27); await sleep(400);
  expect(!(await vis('.layer-settings')) && (await vis('.layer-pause')), 'Esc in settings should close settings only'); console.log(' after Esc:', await active());
  expect((await active()).startsWith('BUTTON:Settings'), 'focus not returned to pause Settings');
  await kk('ArrowDown', 'ArrowDown', 40); await kk('Enter', 'Enter', 13); await sleep(300);
  console.log(' quit confirm focus:', await active(), 'quit fired?', await c.ev('!!__app.sim'));
  expect((await active()).startsWith('BUTTON:Stay'), 'confirm should focus Stay'); expect(await c.ev('!!__app.sim'), 'run lost without confirm');
  await kk('Escape', 'Escape', 27); await sleep(500);
  expect((await vis('.layer-pause')) && (await c.ev('__app.paused')), 'Esc in confirm should only cancel the confirm'); console.log(' after Esc in confirm:', await active());
  await kk('Escape', 'Escape', 27); await sleep(600);
  expect(!(await c.ev('__app.paused')), 'Esc did not resume'); console.log(' resumed, pause visible?', await vis('.layer-pause'));
  await kk('Escape', 'Escape', 27); await sleep(500); await kk('ArrowDown', 'ArrowDown', 40); await kk('ArrowDown', 'ArrowDown', 40); await kk('Enter', 'Enter', 13); await sleep(200);
  await kk('Tab', 'Tab', 9); await kk('Enter', 'Enter', 13); await sleep(600);
  console.log(' left run via confirm ->', await vis('.layer-start'), 'sim', await c.ev('!!__app.sim'));
  expect((await vis('.layer-start')) && !(await c.ev('!!__app.sim')), 'Leave run did not reach title');
  await c.ev('document.activeElement.blur()'); await kk('s', 'KeyS', 83); await sleep(300);
  expect(await vis('.layer-settings'), 'S from title'); await kk('Escape', 'Escape', 27); await sleep(300);
  console.log(' title after Esc focus:', await active());
  expect((await active()).includes('Settings'), 'focus not back on title Settings');
  if (c.errors.length) fail('console ' + c.errors.join(';'));
}
c.close();
console.log(fails ? `FAILS ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
