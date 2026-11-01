// DR4: real results screen with a staged death (counters set on a real run), at the three sizes. Own Chrome (port 9398). Usage: node scripts/dr-recap-shots.mjs <baseUrl> <outDir> [tag]
import { launch, sleep, VIEWS } from './u3-lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:4190', out = process.argv[3] || 'docs/screenshots/dr', tag = process.argv[4] || 'dr4';
const c = await launch(9398);
const HURT = "(()=>{const s=__app.sim;s.time=391;s.level=14;s.kills=412;s.gold=312;s.shards=2;s.hurtBy={wolf:80,crow:35,root_crawler:25,bramble_hart:10};s.hitsBy={wolf:14,crow:9,root_crawler:3,bramble_hart:1};s.lungeHits=7;s.lastHit={src:'wolf',kind:'lunge',id:5,t:391,amt:6,x:0,y:0};s.player.hp=0;s.state='defeat';return 1})()";
try {
  for (const [name, w, h, dpr, mobile] of VIEWS) {
    await c.open(`${base}/?x=1`, w, h, dpr, mobile);
    await c.ev("__app.startRun('wren')"); await sleep(600);
    await c.ev(HURT); await sleep(1800);
    const info = await c.ev(`(()=>{const m=document.querySelector('.layer-end .u6-main'),p=document.querySelector('.layer-end .u6-panel'),r=document.querySelector('.layer-end .u6-wrap');return {dropped:r&&r.getAttribute('data-dropped'),scrollMain:m&&m.scrollHeight-m.clientHeight,scrollPanel:p&&p.scrollHeight-p.clientHeight,scrollHero:(h=>h&&h.scrollHeight-h.clientHeight)(document.querySelector('.layer-end .u6-hero')),mainH:m&&m.clientHeight,panelH:p&&p.clientHeight,struck:(document.querySelector('.u6-struck')||{}).textContent,small:[...document.querySelectorAll('.layer-end *')].filter(e=>e.children.length===0&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<11).length}})()`);
    console.log(name, JSON.stringify(info));
    await c.shot(out, `${tag}-recap-${name}`);
  }
  console.log('errors', JSON.stringify(c.errors.slice(0, 5)));
} finally { c.close(); }
