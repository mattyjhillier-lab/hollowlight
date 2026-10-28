// Final verification visual QA (LAUNCH-CHECKLIST item 23): every main screen at game size (640x360), phone landscape (844x390@2)
// and phone portrait (390x844@2) on the REAL build (dist/), plus an automatic layout check (off-screen / clipped text / small taps).
//   npm run build && node scripts/fv-shots.mjs <outDir>     own headless Chrome (port 9611) + static server (4291); kills only its own Chrome.
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { launch, sleep } from './u3-lib.mjs';

const out = process.argv[2] || 'docs/screenshots/final';
mkdirSync(out, { recursive: true });
const HTTP = 4291;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const root = resolve('dist');
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
  const f = resolve(join(root, p));
  if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => srv.listen(HTTP, '127.0.0.1', r));
const base = `http://127.0.0.1:${HTTP}/`;
const VIEWS = [['game', 640, 360, 1, false], ['land', 844, 390, 2, true], ['port', 390, 844, 2, true]];

// Layout check over every visible overlay: text outside the viewport, text clipped by its own box (scroll size > box, overflow hidden,
// ellipsis counts as clipped), elements overlapping each other among buttons, tap targets < 32 css px on touch views, smallest font.
const MEASURE = `(async()=>{await document.fonts.ready;const vw=innerWidth,vh=innerHeight;const out={off:[],clip:[],small:[],overlap:[],minFont:99};
const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity!==0};
const layers=[...document.querySelectorAll('.overlay,[class*="layer-"]')].filter(vis);const name=(e)=>((e.getAttribute('aria-label')||e.textContent||e.className||'').trim().replace(/\\s+/g,' ').slice(0,28));
const seen=new Set();for(const l of layers){const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(seen.has(p)||!vis(p)||p.closest('.u3-sr,[aria-hidden="true"]'))continue;seen.add(p);
 const s=getComputedStyle(p);out.minFont=Math.min(out.minFont,parseFloat(s.fontSize));const r=p.getBoundingClientRect();
 let sc=p;while(sc&&sc!==document.body){const cs=getComputedStyle(sc);if(/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&sc.scrollHeight>sc.clientHeight+1)break;sc=sc.parentElement}
 const scroller=sc&&sc!==document.body;
 if(!scroller&&(r.right>vw+1||r.bottom>vh+1||r.left<-1||r.top<-1))out.off.push(name(p));
 if((s.overflow==='hidden'||s.textOverflow==='ellipsis'||s.overflowX==='hidden')&&(p.scrollWidth>p.clientWidth+1||p.scrollHeight>p.clientHeight+2))out.clip.push(name(p));}
 const btns=[...l.querySelectorAll('button')].filter(vis);for(const b of btns){const r=b.getBoundingClientRect();if(Math.min(r.width,r.height)<32)out.small.push(name(b)+' '+Math.round(r.width)+'x'+Math.round(r.height));}
 for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){if(btns[i].contains(btns[j])||btns[j].contains(btns[i]))continue;const a=btns[i].getBoundingClientRect(),b=btns[j].getBoundingClientRect();const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left),oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(ox>2&&oy>2)out.overlap.push(name(btns[i])+' / '+name(btns[j]));}}
out.small=[...new Set(out.small)].slice(0,8);out.overlap=out.overlap.slice(0,8);out.off=out.off.slice(0,8);out.clip=out.clip.slice(0,8);return out})()`;

const HURT = "(()=>{const s=__app.sim;s.time=391;s.level=14;s.kills=412;s.gold=312;s.shards=2;s.hurtBy={wolf:80,crow:35,root_crawler:25,bramble_hart:10};s.hitsBy={wolf:14,crow:9,root_crawler:3,bramble_hart:1};s.player.hp=0;s.state='defeat';return 1})()";
const NEAR_SITE = "(()=>{const s=__app.sim;if(!s.sites)return 'no sites';const a=s.sites.list.filter(x=>x.state==='awake'||x.state==='fight');const t=a.find(x=>x.kind==='road')||a.find(x=>x.kind==='lamp')||a[0];if(!t)return 'none awake';s.player.x=t.x-150;s.player.y=t.y+40;return t.kind})()";
const report = [];
const c = await launch(9611);
const step = async (view, name, fn, wait = 900) => {
  try { await fn(); await sleep(wait); } catch (e) { report.push({ view, name, error: String(e.message).slice(0, 160) }); console.log(view, name, 'ERROR', e.message); return; }
  const img = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 72 });
  writeFileSync(join(out, `${name}-${view}.jpg`), Buffer.from(img.data, 'base64'));
  const m = await c.ev(MEASURE).catch((e) => ({ error: e.message }));
  report.push({ view, name, ...m, errors: c.errors.slice(0, 3) });
  console.log(view, name, JSON.stringify(m));
};
try {
  for (const [view, w, h, dpr, mobile] of VIEWS) {
    await c.open(`${base}?x=1`, w, h, dpr, mobile);
    await c.ev("(()=>{const a=__app;if(a.needsStarter&&a.needsStarter())a.chooseStarter('wren','ghost_wolves');a.save.data.gold=840;a.save.data.shards=3;a.save.data.stats.runs=4;return 1})()").catch(() => 0);
    await step(view, 'title', () => c.ev('__app.showMenu()'));
    await step(view, 'map', () => c.ev("__app.ui.showNights('wren')"));
    await step(view, 'tree', () => c.ev('__app.openTree()'), 1500);
    await step(view, 'almanac', () => c.ev("(__app.ui.hideAll(), __app.ui.showAlmanac('title'))"), 1200);
    await step(view, 'settings', () => c.ev("(__app.ui.hideAll(), __app.ui.showSettings(''))"));
    await step(view, 'about', () => c.ev("(__app.ui.hideAll(), __app.ui.showSettings('', 'about'))"));
    // run with map events: bot run at 4:30 (near + mid lamps and road 1 awake), hero moved next to an awake site
    await c.open(`${base}?auto=wren&seed=1&t=270&god=1`, w, h, dpr, mobile);
    for (let i = 0; i < 40 && !(await c.ev('!!(__app.sim&&__app.scene&&__app.scene.siteView)').catch(() => false)); i++) await sleep(250);
    await step(view, 'run-events', async () => { await sleep(1500); console.log('  near', await c.ev(NEAR_SITE)); }, 700);
    // level-up worst case: 3 gold evolution cards
    await c.open(`${base}?auto=wren&seed=1&god=1&rr=30&grant=ghost_wolves:power=5,duration=5;chain_lightning:chains=5,power=5;raven_flock:count=5,range=5`, w, h, dpr, mobile);
    for (let i = 0; i < 40 && !(await c.ev('!!__app.sim').catch(() => false)); i++) await sleep(250);
    await step(view, 'levelup-3gold', async () => {
      await c.ev("(()=>{const s=__app.sim;['dire_alpha','thunder_judgment','murder_storm'].forEach((x)=>s.unlockedEvolutions.add(x));s.xp=s.xpNeeded+1;})()");
      let n = 0; for (let i = 0; i < 40 && n < 3; i++) { await sleep(250); n = await c.ev("document.querySelectorAll('.layer-levelup .card.is-evolve').length"); }
      if (n < 3) throw new Error('only ' + n + ' gold cards');
    }, 600);
    // results: staged defeat on a real run
    await c.open(`${base}?x=1`, w, h, dpr, mobile);
    await step(view, 'results', async () => { await c.ev("__app.startRun('wren')"); await sleep(600); await c.ev(HURT); }, 2200);
  }
} finally { c.close(); srv.close(); }
writeFileSync(join(out, 'fv-report.json'), JSON.stringify(report, null, 1));
