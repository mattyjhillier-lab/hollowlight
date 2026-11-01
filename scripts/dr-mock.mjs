// Damage-readability mock-ups ON the real build: stage a moment, freeze at a hit, then draw each option with temporary in-page overlays
// (Phaser objects + DOM), screenshot, measure. Nothing is saved; the build itself is unchanged. Own Chrome 9532 + server 4252.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9532, HTTP = 4252;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const ONLY = process.argv[3] || '';
const metrics = [];

function serve(dir) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(HTTP, '127.0.0.1', () => r(srv)));
}
async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-drm-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  console.log('chrome pid', proc.pid);
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500); };
  return { send, ev, close };
}
async function open(c, query, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}` });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools)')) { await c.ev("window.__app.save.setSettings({quality:'high',brightness:'normal'}); true"); return; } } catch { /* */ } }
  throw new Error('game did not start');
}
const capture = async (c) => (await c.send('Page.captureScreenshot', { format: 'png' })).data;
const autoPick = (c) => c.ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");

async function stage(c, t, mix, restored) {
  for (let i = 0; i < 12; i++) { if (await c.ev("window.__app.sim.state==='running'")) break; await autoPick(c); await sleep(80); }
  await c.ev(`(()=>{const a=window.__app,s=a.sim,p=s.player,l=a.scene.life;s.enemies.length=0;s.xp=-1e9;if(${t}>=600){s.bossSpawned=true;s.bossKilled=true;s.boss=null;}s.time=${t};p.x=2000;p.y=2000;p.hp=p.maxHp*0.62;a.scene.cameras.main.centerOn(2000,2000);l.decay=1e9;
    if(${restored}>0){l.stamp(2000,2000,${restored},1);}
    const M=${JSON.stringify(mix)};let k=0;for(const [ty,n,d0,d1] of M){for(let i=0;i<n;i++,k++){const an=(k*2.399)%6.2832,d=d0+((k*37)%Math.max(1,d1-d0));s.spawnEnemy(ty,p.x+Math.cos(an)*d*1.6,p.y+Math.sin(an)*d*0.95);const e=s.enemies[s.enemies.length-1];e.grace=0;if(ty==='stoat_piper'||ty==='bramble_hart'){e.hp=1e6;e.maxHp=1e6;e.aiCd=0.3;}}}
    s.player.iframes=1.2;return s.enemies.length})()`);
}

// hook: freeze on the first hit by `want` (or any), remember the attacker
async function waitHit(c, want, maxWait = 20000) {
  await c.ev(`(()=>{const a=window.__app,s=a.sim;window.__hit=null;const o=window.__o0=window.__o0||s.damagePlayer.bind(s);const W=${JSON.stringify(want)};
    s.damagePlayer=function(am,src){const p=s.player;if(window.__hit||(W!==null&&src!==W))return;if(p.iframes>0)return o(am,src);
      let att=null,bd=-1;for(const e of s.enemies){if(e.dead)continue;const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<p.r+e.r*0.85){const dm=e.cdmg&&e.state==='charge'?e.cdmg:e.dmg;if(dm>bd){bd=dm;att=e;}}}
      let ax=att?att.x:p.x,ay=att?att.y:p.y,kind='contact',aid=att?att.id:-1,atype=att?att.type:src;
      if(src==='stoat_piper'&&!(att&&att.type==='stoat_piper')){kind='thorn';const sh=s.eshots.find(q=>!q.dead&&Math.hypot(p.x-q.x,p.y-q.y)<p.r+q.r+1);if(sh){ax=sh.x-sh.vx*sh.age;ay=sh.y-sh.vy*sh.age;}let bp=null,bd2=1e9;for(const e of s.enemies){if(e.type!=='stoat_piper'||e.dead)continue;const d=Math.hypot(e.x-ax,e.y-ay);if(d<bd2){bd2=d;bp=e;}}if(bp){aid=bp.id;ax=bp.x;ay=bp.y;}atype='stoat_piper';}
      window.__hit={src,kind,aid,atype,ax,ay,px:p.x,py:p.y,am};a.scene.hitStop=1e9;return o(am,src);};return 1})()`);
  const t0 = Date.now(); let h = null;
  while (Date.now() - t0 < maxWait) { h = await c.ev("(()=>{const a=window.__app,s=a.sim;s.xp=-1e9;if(s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);if(s.player.hp<s.player.maxHp*0.4)s.player.hp=s.player.maxHp*0.62;return window.__hit})()"); if (h) break; await sleep(15); }
  return h;
}

// in-page option painter. Installed once per page; window.__opt = {hit:'A'|..., dir:..., tell:..., crowd:...}
const PAINTER = `(()=>{const a=window.__app,S=a.scene,s=a.sim;if(window.__painter)return 1;window.__painter=1;
  const LR=0xff8078, RO=0xff5a3c, CREAM=0xfff3dc;
  const G=S.add.graphics().setDepth(130000);window.__G=G;const objs=[];window.__objs=objs;
  const wDraw=S.draw.bind(S);
  const copyOf=(img,tint,k,alpha,depth)=>{const c=S.add.image(img.x,img.y,img.texture.key,img.frame.name).setOrigin(img.originX,img.originY).setScale(img.scaleX*k,img.scaleY*k).setFlipX(img.flipX).setTintFill(tint).setAlpha(alpha).setDepth(depth);objs.push(c);return c;};
  const findImg=(e)=>{const pl=S.pools[e.type];const r=pl&&pl.map.get(e.id);return r&&r.img;};
  const FILLER={wolf:1,crow:1,root_crawler:1};
  window.__arc=(x,y,r,a0,a1,w,col,al)=>{G.lineStyle(w,col,al);G.beginPath();G.arc(x,y,r,a0,a1,false);G.strokePath();};
  S.draw=function(){
    const O=window.__opt||{};const stash=[];
    if(O.tell&&O.tell!=='before'){for(const e of s.enemies){if(e.type==='wolf'&&e.tele){stash.push(e);e.tele=false;}}}
    wDraw();
    for(const e of stash)e.tele=true;
    for(const o of objs)o.destroy();objs.length=0;G.clear();
    const p=s.player;const H=window.__hit;
    const ho=S.heroOut;
    // ---------- crowd hierarchy ----------
    if(O.crowd&&O.crowd!=='before'){
      for(const e of s.enemies){const img=findImg(e);if(!img||!img.visible)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);
        if(O.crowd==='A'||O.crowd==='C'){
          if(FILLER[e.type]){img.setAlpha(0.74);}
          else{img.setDepth(img.depth+3000);copyOf(img,CREAM,1.14,0.55,img.depth-0.1);}
        }
        if((O.crowd==='B'||O.crowd==='C')&&d<52){img.setAlpha(0.42);if(O.crowd==='B')copyOf(img,0xdfe6f2,1.08,0.25,img.depth+0.05);}
        else if(O.crowd==='A'&&d<30)img.setAlpha(0.5);
      }
      if(O.crowd==='B'||O.crowd==='C'){G.lineStyle(1.2,CREAM,0.35);G.strokeEllipse(p.x,p.y+4,104,62);}
      ho.setVisible(true).setAlpha(1).setDepth(129000);
      if(O.crowd!=='B'){const T=S.nums.texts;const sl=S.nums.pool.slots;for(let i=0;i<T.length;i++){if(T[i]&&sl[i].on&&sl[i].kind===0&&sl[i].val<20)T[i].setVisible(false);}}
    }
    // ---------- tells ----------
    if(O.tell&&O.tell!=='before'){
      const ws=[];for(const e of stash){const ux=e.dx,uy=e.dy;const tx=p.x-e.x,ty=p.y-e.y;const along=tx*ux+ty*uy;const perp=Math.abs(tx*uy-ty*ux);const threat=along>0&&along<110&&perp<p.r+e.r+6;ws.push({e,threat,d:Math.hypot(tx,ty)});}
      ws.sort((q,w)=>q.d-w.d);
      if(O.tell==='A'){let n=0;for(const w of ws){const e=w.e;if(!w.threat&&n>=6)continue;n++;const al=w.threat?0.95:0.28;const L=w.threat?15:9;
          // ground chevron wedge at the feet, pointing along the lunge
          const bx=e.x+e.dx*8,by=e.y+4+e.dy*8,nx=-e.dy,ny=e.dx;G.fillStyle(RO,al*0.85);G.fillTriangle(bx+e.dx*L,by+e.dy*L,bx+nx*4,by+ny*4,bx-nx*4,by-ny*4);
          if(w.threat){G.lineStyle(1.4,0x2a1410,0.8);G.strokeTriangle(bx+e.dx*L,by+e.dy*L,bx+nx*4,by+ny*4,bx-nx*4,by-ny*4);}}
      }
      if(O.tell==='B'){for(const w of ws){const e=w.e;// body-first: eye flare only (no decal)
          G.fillStyle(0xffd2a0,0.95);G.fillCircle(e.x+(e.faceX||1)*5,e.y-6,1.8);G.fillStyle(RO,0.5);G.fillCircle(e.x+(e.faceX||1)*5,e.y-6,3.4);}}
      if(O.tell==='C'){const R=34;G.lineStyle(1,CREAM,0.25);G.strokeCircle(p.x,p.y-6,R);
        const thr=[];for(const w of ws)if(w.threat)thr.push([Math.atan2(w.e.y-p.y,w.e.x-p.x),1-Math.min(1,w.d/130)]);
        for(const e of s.enemies){if(e.tele&&e.ai){thr.push([Math.atan2(e.y-p.y,e.x-p.x),0.8]);}}
        for(const q of s.eshots){const tx=p.x-q.x,ty=p.y-q.y;const v=Math.hypot(q.vx,q.vy)||1;const tt=(tx*q.vx+ty*q.vy)/(v*v);if(tt>0&&tt<1.2)thr.push([Math.atan2(q.y-p.y,q.x-p.x),1-tt/1.2]);}
        for(const [an,k] of thr){window.__arc(p.x,p.y-6,R,an-0.32,an+0.32,2+3*k,RO,0.45+0.5*k);}}
      // projectile visibility floor (A and B): thorn drawn at least r5 with a dark rim + cream core + short trail
      if(O.tell==='A'||O.tell==='B'){for(const q of s.eshots){const v=Math.hypot(q.vx,q.vy)||1,ux=q.vx/v,uy=q.vy/v;G.lineStyle(3,0x2a2236,0.55);G.lineBetween(q.x,q.y,q.x-ux*16,q.y-uy*16);G.fillStyle(0x2a2236,1);G.fillCircle(q.x,q.y,5);G.fillStyle(0xff8a50,1);G.fillCircle(q.x,q.y,3.4);G.fillStyle(0xffe9c4,1);G.fillCircle(q.x,q.y,1.8);}}
    }
    // ---------- hit feedback on the hero ----------
    if(H&&O.hit&&O.hit!=='before'){
      const fb=S.rig.flatBox;const top=p.y+(S.rig.active?-fb.h*S.heroOut.scaleY*0.0+0:0);
      const hb=ho.getBounds();
      if(O.hit==='A'){const r=copyOf(ho,LR,1.0,1,129500);r.setPosition(ho.x,ho.y);r.setVisible(true);
        const T=S.nums.texts,sl=S.nums.pool.slots;for(let i=0;i<T.length;i++){if(T[i]&&sl[i].on&&sl[i].kind===3)T[i].setVisible(false);}
        const pl=S.add.graphics().setDepth(130001);objs.push(pl);pl.fillStyle(0x1a1020,0.72);pl.fillRoundedRect(hb.centerX-15,hb.y-19,30,14,5);
        const t=S.add.bitmapText(hb.centerX,hb.y-12,'digitsB','-'+Math.round(H.am)).setOrigin(0.5).setTint(LR).setDepth(130002).setScale(S.nums.texts.find(Boolean)?S.nums.texts.find(Boolean).scaleX*1.25:0.5);objs.push(t);}
      if(O.hit==='B'){const r=copyOf(ho,0xffffff,1.0,0.85,129500);r.setPosition(ho.x,ho.y).setVisible(true);G.lineStyle(5,0x1a1020,0.55);G.strokeEllipse(p.x,hb.bottom-2,56,22);G.lineStyle(3,LR,1);G.strokeEllipse(p.x,hb.bottom-2,56,22);G.lineStyle(1.5,LR,0.5);G.strokeEllipse(p.x,hb.bottom-2,78,31);}
    }
    // ---------- direction / source ----------
    if(H&&O.dir&&O.dir!=='before'){
      const att=s.enemies.find(e=>e.id===H.aid);const ax=att?att.x:H.ax,ay=att?att.y:H.ay;const an=Math.atan2(ay-p.y,ax-p.x);const img=att&&findImg(att);
      if(O.dir==='A'){if(img){img.setDepth(129400);copyOf(img,0x1a1020,1.26,0.9,129398);copyOf(img,LR,1.14,1,129399);}window.__arc(p.x,p.y-6,25,an-0.62,an+0.62,6.5,0x1a1020,0.7);window.__arc(p.x,p.y-6,25,an-0.6,an+0.6,4,LR,1);}
      if(O.dir==='B'){const R=58;window.__arc(p.x,p.y-6,R,an-0.47,an+0.47,8,0x1a1020,0.6);window.__arc(p.x,p.y-6,R,an-0.45,an+0.45,5,LR,0.95);G.fillStyle(LR,0.95);const tx=p.x+Math.cos(an)*(R+7),ty=p.y-6+Math.sin(an)*(R+7);G.fillTriangle(tx+Math.cos(an)*6,ty+Math.sin(an)*6,tx+Math.cos(an+1.9)*5,ty+Math.sin(an+1.9)*5,tx+Math.cos(an-1.9)*5,ty+Math.sin(an-1.9)*5);
        if(img){const bx=p.x+Math.cos(an)*(R+22),by=p.y-6+Math.sin(an)*(R+22);G.fillStyle(0x1a1020,0.8);G.fillCircle(bx,by,13);G.lineStyle(1.5,LR,0.9);G.strokeCircle(bx,by,13);const ic=S.add.image(bx,by+3,img.texture.key,img.frame.name).setScale(img.scaleX*0.55,img.scaleY*0.55).setDepth(130003).setFlipX(img.flipX);objs.push(ic);}}
      if(O.dir==='C'){const T=S.nums.texts,sl=S.nums.pool.slots;for(let i=0;i<T.length;i++){if(T[i]&&sl[i].on&&sl[i].kind===3)T[i].setVisible(false);}
        const nx=p.x-Math.cos(an)*30,ny=p.y-14-Math.sin(an)*18;const pl=S.add.graphics().setDepth(130001);objs.push(pl);pl.fillStyle(0x1a1020,0.72);pl.fillRoundedRect(nx-24,ny-8,48,16,6);
        if(img){const ic=S.add.image(nx-14,ny+2,img.texture.key,img.frame.name).setScale(img.scaleX*0.42,img.scaleY*0.42).setDepth(130003).setFlipX(true);objs.push(ic);}
        const t=S.add.bitmapText(nx+8,ny,'digitsB','-'+Math.round(H.am)).setOrigin(0.5).setTint(LR).setDepth(130002).setScale(S.nums.texts.find(Boolean)?S.nums.texts.find(Boolean).scaleX*1.1:0.5);objs.push(t);
        G.lineStyle(1,LR,0.5);G.lineBetween(nx+Math.cos(an)*26,ny+Math.sin(an)*10,ax,ay-4);}
    }
  };
  return 1})()`;

// DOM-side parts of the hit options (HUD/edges). Removed each time.
const DOM = (opt) => `(()=>{document.querySelectorAll('.__mk').forEach(n=>n.remove());const O=${JSON.stringify(opt)};const H=window.__hit;const hud=window.__app.ui.hudView;
  const add=(css,html='')=>{const d=document.createElement('div');d.className='__mk';d.style.cssText='position:fixed;pointer-events:none;z-index:99999;'+css;d.innerHTML=html;document.body.appendChild(d);return d;};
  const L=hud.lantern.getBoundingClientRect();
  if(O.hit==='A'){add('left:'+(L.left)+'px;top:'+(L.top)+'px;width:'+(L.width)+'px;height:'+(L.height)+'px;border-radius:14px;box-shadow:0 0 0 2px rgba(255,128,120,.9),0 0 18px 4px rgba(255,128,120,.55);');
    const f=hud.lantern.querySelector('svg')||hud.lantern;const fr=f.getBoundingClientRect();add('left:'+(fr.left)+'px;top:'+(fr.top+fr.height*0.15)+'px;width:'+(fr.width*0.55)+'px;height:'+(fr.height*0.7)+'px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,128,120,.55),transparent);');}
  if(O.hit==='B'){add('inset:0;box-shadow:inset 0 0 2.2em .25em rgba(255,128,120,.55);');}
  if(O.hit==='C'){add('inset:0;box-shadow:inset 0 0 1.4em .1em rgba(255,128,120,.45);');add('left:'+(L.left)+'px;top:'+(L.top)+'px;width:'+(L.width)+'px;height:'+(L.height)+'px;border-radius:14px;box-shadow:0 0 22px 6px rgba(255,128,120,.6);');
    add('left:'+(L.right+8)+'px;top:'+(L.top+L.height*0.12)+'px;font:700 '+Math.round(L.height*0.42)+'px system-ui;color:#ff8078;text-shadow:0 2px 0 #1a1020,0 0 6px #1a1020;','-'+Math.round(H?H.am:0));
    const bar=hud.lantern.querySelector('.h-hpbar,.h-bar,progress')||null;}
  return 1})()`;

// pixel metrics on the captured frame (in page: decode the PNG into a canvas)
const METRIC = (b64, cx, cy, R) => `(async()=>{const i=new Image();await new Promise(r=>{i.onload=r;i.src='data:image/png;base64,${b64}';});const W=i.width,H=i.height;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.drawImage(i,0,0);const d=g.getImageData(0,0,W,H).data;
  let red=0,lr=0,bright=0,n=0;const R2=${R}*${R};for(let y=Math.max(0,${cy}-${R});y<Math.min(H,${cy}+${R});y++)for(let x=Math.max(0,${cx}-${R});x<Math.min(W,${cx}+${R});x++){const dx=x-${cx},dy=y-${cy};if(dx*dx+dy*dy>R2)continue;const k=(y*W+x)*4,r=d[k],gg=d[k+1],b=d[k+2];n++;if(r>170&&gg<120&&b<110&&r-gg>80)red++;if(r>200&&gg>95&&gg<165&&b>85&&b<160&&r-gg>55)lr++;if(r+gg+b>660)bright++;}
  // squint edge density: 1/8 downsample, mean |grad L|
  const w=Math.floor(W/8),h=Math.floor(H/8);const c2=document.createElement('canvas');c2.width=w;c2.height=h;const g2=c2.getContext('2d');g2.drawImage(i,0,0,w,h);const e=g2.getImageData(0,0,w,h).data;const Lf=(x,y)=>{const k=(y*w+x)*4;return 0.2126*e[k]+0.7152*e[k+1]+0.0722*e[k+2];};let sum=0,m=0;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){sum+=Math.abs(Lf(x+1,y)-Lf(x-1,y))+Math.abs(Lf(x,y+1)-Lf(x,y-1));m++;}
  return {redPct:+(100*red/n).toFixed(2),lightRedPct:+(100*lr/n).toFixed(2),brightPct:+(100*bright/n).toFixed(2),squintEdge:+(sum/m).toFixed(2)};})()`;
const OCC = `(()=>{const S=window.__app.scene,s=S.__s||window.__app.sim,p=s.player;const hb=S.heroOut.getBounds();let occ=0,tells=0;for(const e of s.enemies){if(e.dead)continue;if(e.tele)tells++;const pl=S.pools[e.type];const r=pl&&pl.map.get(e.id);if(!r||!r.img.visible)continue;const b=r.img.getBounds();if(r.img.depth>((S.rig.depth)||0)&&r.img.alpha>0.6&&b.right>hb.left&&b.left<hb.right&&b.bottom>hb.top&&b.top<hb.bottom&&e.y>p.y)occ++;}return {occluders:occ,tellsLive:tells}})()`;

async function shotOpt(c, view, name, opt, retrigger) {
  await c.ev(`(()=>{window.__opt=${JSON.stringify(opt)};return 1})()`);
  await c.ev(DOM(opt));
  if (retrigger) await c.ev("(()=>{const S=window.__app.scene;S.rig.hurtT=0.07;if(" + JSON.stringify(!!opt.hitFlash) + ")window.__app.ui.hurt();return 1})()");
  await sleep(45);
  const b64 = await capture(c);
  writeFileSync(join(out, `${name}.png`), Buffer.from(b64, 'base64'));
  const [w, h, dpr] = VIEWS[view];
  const R = Math.round(Math.min(w, h) * dpr * 0.2);
  const m = await c.ev(METRIC(b64, Math.round(w * dpr / 2), Math.round(h * dpr / 2), R));
  const o = await c.ev(OCC);
  metrics.push({ name, view, ...m, ...o });
  console.log(name, JSON.stringify(m), JSON.stringify(o));
}

const CROWD = [['wolf', 130, 60, 330], ['crow', 110, 50, 330], ['root_crawler', 50, 70, 330], ['stoat_piper', 8, 150, 200], ['puffback_toad', 10, 60, 200], ['bramble_hart', 4, 150, 220], ['wolf', 38, 330, 420]];
const SCEN = {
  hit: { t: 380, hero: 'wren', grant: 'ghost_wolves:speed=5,power=5:phantom_stampede', mix: [['bramble_hart', 2, 110, 130], ['wolf', 30, 60, 260], ['crow', 20, 60, 260], ['root_crawler', 10, 60, 260]], restored: 200, want: 'bramble_hart', pre: 400 },
  thorn: { t: 240, hero: 'wren', grant: 'ghost_wolves:speed=4,power=4;raven_flock', mix: [['wolf', 60, 40, 260], ['crow', 40, 50, 260], ['root_crawler', 14, 60, 260], ['stoat_piper', 4, 150, 190], ['puffback_toad', 4, 60, 160]], restored: 120, want: 'stoat_piper', pre: 400 },
  crowd: { t: 690, hero: 'wren', grant: 'ghost_wolves:speed=5,power=5:phantom_stampede;raven_flock:count=3', mix: CROWD, restored: 330, want: null, pre: 1200, extra: '&god=1' },
};
const PLAN = [
  ['hit', ['desk', 'land', 'port'], [['before', { hitFlash: true }], ['hitA', { hit: 'A', hitFlash: false }], ['hitB', { hit: 'B', hitFlash: false }], ['hitC', { hit: 'C', hitFlash: false }], ['dirA', { dir: 'A', hit: 'A' }], ['dirB', { dir: 'B', hit: 'A' }], ['dirC', { dir: 'C', hit: 'A' }]], true],
  ['thorn', ['desk', 'port'], [['before', { hitFlash: true }], ['tellA', { tell: 'A', hit: 'A' }], ['tellB', { tell: 'B', hit: 'A' }], ['tellC', { tell: 'C', hit: 'A' }]], true],
  ['crowd', ['desk', 'land', 'port'], [['before', {}], ['crowdA', { crowd: 'A', tell: 'A' }], ['crowdB', { crowd: 'B' }], ['crowdC', { crowd: 'C', tell: 'A' }]], false],
];

const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
try {
  for (const [sc, views, opts, isHit] of PLAN) {
    if (ONLY && sc !== ONLY) continue;
    const S = SCEN[sc];
    for (const view of views) {
      const [w, h, dpr] = VIEWS[view];
      // crowd: also a 'clarity' load with ambient layers off (fog, motes, critters, foliage sway) for options A and C
      for (const amb of sc === 'crowd' ? ['', '&fog=0&motes=0&critters=0&sway=0'] : ['']) {
        await open(c, `auto=${S.hero}&seed=7&t=${S.t}&grant=${S.grant}${S.extra || ''}${amb}`, w, h, dpr);
        await sleep(500); await stage(c, S.t, S.mix, S.restored); await sleep(S.pre);
        for (let i = 0; i < 6; i++) { await autoPick(c); await sleep(60); }
        await c.ev(`(()=>{const s=window.__app.sim;s.time=${S.t};s.xp=-1e9;return 1})()`);
        if (isHit) { const hh = await waitHit(c, S.want); if (!hh) { console.log('no hit', sc, view); continue; } writeFileSync(join(out, `${sc}-${view}-hit.json`), JSON.stringify(hh)); await sleep(70); }
        else { await sleep(200); await c.ev('(()=>{window.__app.scene.hitStop=1e9;return 1})()'); }
        await c.ev(PAINTER);
        await c.ev('(()=>{const S=window.__app.scene;S.nums.update=function(){};return 1})()'); // hold the numbers on screen across the option frames
        for (const [tag, opt] of opts) {
          const isAmbTag = tag === 'crowdA' || tag === 'crowdC';
          if (sc === 'crowd' && ((amb === '') === isAmbTag)) continue;
          await shotOpt(c, view, `${sc}-${tag}-${view}`, opt, isHit);
        }
      }
    }
  }
} finally { writeFileSync(join(out, `metrics-${ONLY || 'all'}.json`), JSON.stringify(metrics, null, 1)); c.close(); srv.close(); }
