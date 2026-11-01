// A2 text size shots (called by scripts/a11y-shots.mjs 2 <outDir>): Larger text on the 3-gold-card worst case, HUD, title, Settings,
// Almanac and the tree detail panel at game / desktop / phone sizes, with overflow checks.
const Q = '?auto=wren&seed=1&god=1&rr=30&grant=ghost_wolves:power=5,duration=5;chain_lightning:chains=5,power=5;raven_flock:count=5,range=5';

export async function run2({ ev, go, size, seed, shot, check, noOverflow, sleep, base, SIZES, played }) {
  const ready = async (expr) => { for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev(expr)) return true; } catch { /* loading */ } } return false; };
  // 1) 3 gold cards at Larger (the evo-text worst case), then the HUD
  for (const T of ['normal', 'larger']) for (const k of ['desktop', 'game', 'phoneL', 'phoneP', 'small']) {
    await size(k);
    await go(base + '/' + Q + (SIZES[k][2] ? '&touch=1' : ''));
    await ready('!!(window.__app && window.__app.sim)');
    await ev(`(()=>{const d=document.documentElement.dataset; if ('${T}'==='normal') delete d.text; else d.text='${T}'; return true})()`);
    await ev("(()=>{const s=window.__app.sim;['dire_alpha','thunder_judgment','murder_storm'].forEach((x)=>s.unlockedEvolutions.add(x));s.xp=s.xpNeeded+1;})()");
    let n = 0;
    for (let i = 0; i < 60 && n < 3; i++) { await sleep(250); n = await ev("document.querySelectorAll('.layer-levelup .card.is-evolve').length"); }
    await sleep(1200);
    const r = await ev(`(()=>{const cs=[...document.querySelectorAll('.layer-levelup .card')];const vh=innerHeight,vw=innerWidth;const ov=document.querySelector('.overlay.layer-levelup');const scroll=ov.scrollHeight>ov.clientHeight+1&&/auto|scroll/.test(getComputedStyle(ov).overflowY);return {vw,vh,scroll,sh:ov.scrollHeight,fs:getComputedStyle(document.querySelector('.layer-levelup .card .c-title')||document.body).fontSize,cards:cs.map(c=>{const b=c.getBoundingClientRect();const d=c.querySelector('.c-desc');return {x:b.x,y:b.y,h:b.height,b:b.bottom,r:b.right,dh:d?[d.scrollHeight,d.clientHeight]:null,cs:c.scrollHeight>c.clientHeight+1}})}})()`);
    const c = r.cards;
    check(`${k} ${T}: 3 evolve cards`, n === 3);
    check(`${k} ${T}: every card reachable (inside the screen, or the level-up screen scrolls to it)`, c.every((q) => q.x >= 0 && q.r <= r.vw + 1) && (r.scroll || c.every((q) => q.y >= 0 && q.b <= r.vh + 1)), c.map((q) => Math.round(q.b)).join(',') + ' fs ' + r.fs);
    check(`${k} ${T}: desc not clamped`, c.every((q) => !q.dh || q.dh[0] <= q.dh[1] + 1), c.map((q) => q.dh && q.dh.join('/')).join(' '));
    await shot(`a2-${T}-3evo-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
    await ev("document.querySelector('.layer-levelup .card').click(); true"); await sleep(900);
    await ev("window.__app.paused || window.__app.togglePause(); window.__app.togglePause(); true"); await sleep(300);
    const hud = await ev(`(()=>{const W=innerWidth,H=innerHeight;const bad=[];for(const e of document.querySelectorAll('#ui .hud *')){const b=e.getBoundingClientRect();if(!b.width)continue;if(b.right>W+1||b.left<-1||b.bottom>H+1||b.top<-1)bad.push(e.className&&e.className.baseVal===undefined?e.className:e.tagName);}return bad.slice(0,6)})()`);
    check(`${k} ${T}: HUD inside the screen`, !hud.length, JSON.stringify(hud));
    await shot(`a2-${T}-hud-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
  }
  // 2) Settings > Picture > Text size (real path), title, Almanac, tree at Larger
  for (const k of ['desktop', 'game', 'phoneP']) {
    await size(k); await seed(played); await go(base + '/');
    await ready("!!document.querySelector('.u3-title')");
    await ev("[...document.querySelectorAll('button')].find(b=>/Settings/.test(b.textContent)).click(); true"); await sleep(500);
    await ev("document.getElementById('u4-tab-picture').click(); true"); await sleep(200);
    await ev("[...document.querySelectorAll('[role=radio]')].find(b=>b.textContent==='Larger').click(); true"); await sleep(300);
    check(`${k}: Settings sets data-text=larger`, await ev("document.documentElement.dataset.text==='larger'"));
    await noOverflow(`${k} settings larger`);
    const clip = await ev(`[...document.querySelectorAll('.u4 .lg-tab, .u4 .u4-seg__opt')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent).slice(0,6)`);
    check(`${k} settings larger: no tab / choice label wider than its pill`, !clip.length, JSON.stringify(clip));
    await shot(`a2-larger-settings-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
    await ev("window.__app.ui.hideSettings(); true"); await sleep(600);
    await noOverflow(`${k} title larger`);
    await shot(`a2-larger-title-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
    const alm = await ev("(()=>{const b=document.querySelector('.cx-almbtn');if(!b)return false;b.click();return true})()"); await sleep(900);
    if (alm) { await noOverflow(`${k} almanac larger`); await shot(`a2-larger-almanac-${k}-${SIZES[k][0]}x${SIZES[k][1]}`); await ev("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); true"); await sleep(600); }
    await ev("window.__app.openTree(); true"); await sleep(1500);
    await ev("(()=>{const n=document.querySelector('.layer-tree [data-id], .tree [data-id], [class*=tree] button[data-id]');if(n){n.focus();n.click();}return !!n})()"); await sleep(600);
    await noOverflow(`${k} tree larger`, '.ts-item');
    await shot(`a2-larger-tree-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
  }
  // 3) persists: reload keeps Larger
  await size('desktop'); await go(base + '/'); await ready("!!document.querySelector('.u3-title')");
  check('text size persists across reload', await ev("document.documentElement.dataset.text==='larger'"));
}
