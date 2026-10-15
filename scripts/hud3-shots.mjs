// HUD-3 check: node scripts/hud3-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP, real runs. Effects are STAGED through the real sim/scene APIs in debug runs (never touches the real save):
// addGem/addPickup/healPlayer/damagePlayer/useAbility/enemy injection and a t=596 start for the boss. Captures damage numbers in a swarm,
// heal + damage-taken numbers, gem, heart, magnet, level-up burst, ability ready/active, boss intro, and checks classes/caps/reduced motion.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9351;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-hud3-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
};
const [out, base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  const kb = Math.round(statSync(f).size / 1024);
  console.log(`  shot ${name}.jpg ${kb}KB`);
  if (kb > 300) check(`size ${name}`, false, kb + 'KB');
};

async function load(w, h, mobile, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  await sleep(600);
}

const GRANT = 'ghost_wolves:speed=3,power=3;raven_flock:power=3;spirit_bolts:power=3,pierce=2;holy_orbit:power=2';
const injectJs = (n) => `(()=>{const s=window.__app.sim;const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${n}){const a=(k*2.399)%6.2832,d=40+((k*37)%150);s.spawnEnemy(T[k%3],s.player.x+Math.cos(a)*d,s.player.y+Math.sin(a)*d);k++;}return s.enemies.length})()`;
const pick = () => ev("(()=>{const a=window.__app,s=a.sim;if(s&&s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);return 1})()");
const nums = () => ev('(()=>{const n=window.__app.scene.nums;return {alive:n.alive,cap:n.cap,reduced:n.pool.reduced,big:n.pool.slots.filter(s=>s.on&&s.kind===1).length,heal:n.pool.slots.filter(s=>s.on&&s.kind===2).length,hurt:n.pool.slots.filter(s=>s.on&&s.kind===3).length,texts:n.pool.slots.filter(s=>s.on).slice(0,8).map(s=>s.sign+Math.round(s.val))}})()');
const cls = (sel) => ev(`(()=>{const e=document.querySelector('${sel}');return e?e.className:''})()`);

async function session(tag, w, h, mobile) {
  console.log(`== ${tag} ${w}x${h}`);
  const touch = mobile ? '&touch=1' : '';
  // 1. swarm: damage numbers
  await load(w, h, mobile, `?auto=wren&seed=1&t=358&god=1&debug=1&grant=${GRANT}${touch}`);
  await ev(injectJs(160));
  for (let i = 0; i < 6; i++) { await sleep(300); await pick(); }
  const n1 = await nums();
  check(`${tag}: numbers in a swarm stay within the cap`, n1.alive > 0 && n1.alive <= n1.cap && n1.cap <= 24, JSON.stringify(n1));
  await shot(`${tag}-1-numbers-swarm`);
  // 2. heal + damage taken + gem + gold (god OFF so damage is real)
  await load(w, h, mobile, `?auto=wren&seed=1&t=300&debug=1&grant=${GRANT}${touch}`);
  await ev("window.__app.save.setSettings({quality:'high'}); 1"); // full effects for the pickup shots
  await sleep(1500);
  await ev('(()=>{const s=window.__app.sim;s.player.hp=s.player.maxHp*0.6;s.player.iframes=0;return 1})()');
  await sleep(200);
  await ev('(()=>{const s=window.__app.sim;s.player.iframes=0;s.damagePlayer(9);return 1})()');
  await sleep(250);
  await ev('(()=>{const s=window.__app.sim,p=s.player;s.healPlayer(30);s.addGem(p.x+1,p.y,3);s.gold+=5;return 1})()');
  await sleep(120);
  const n2 = await nums();
  check(`${tag}: heal '+' and damage-taken '-' numbers shown`, n2.heal >= 1 && n2.hurt >= 1, JSON.stringify(n2));
  check(`${tag}: thread pulse + coin tick classes on`, /pulse/.test(await cls('.h-thread')) && /tick/.test(await cls('.h-coin')), (await cls('.h-thread')) + ' / ' + (await cls('.h-coin')));
  await shot(`${tag}-2-heal-hurt-gem`);
  // 3. heart
  await ev('(()=>{const s=window.__app.sim,p=s.player;p.hp=p.maxHp*0.5;s.addPickup("heart",p.x,p.y);return 1})()');
  await sleep(160);
  check(`${tag}: heart flares the HP lantern`, /flare/.test(await cls('.h-lamp')), await cls('.h-lamp'));
  await shot(`${tag}-3-heart`);
  // 4. magnet
  await sleep(900);
  await ev('(()=>{const s=window.__app.sim,p=s.player;for(let i=0;i<14;i++)s.addGem(p.x+Math.cos(i)*90,p.y+Math.sin(i)*60,1);s.addPickup("magnet",p.x,p.y);return 1})()');
  await sleep(140);
  await shot(`${tag}-4-magnet`);
  // 5. ability: ready ping, then active drain
  await pick();
  await ev('(()=>{const s=window.__app.sim;s.ability.cdLeft=0.4;return 1})()');
  await sleep(250);
  await ev('(()=>{window.__app.sim.ability.cdLeft=0;return 1})()');
  await sleep(500);
  const ab = await cls('.h-ability');
  check(`${tag}: ability ready ping + ready glow`, /ping/.test(ab) && /ready/.test(ab), ab);
  if (!mobile) await shot(`${tag}-5-ability-ready`);
  await pick();
  await ev('(()=>{window.__app.sim.useAbility();return 1})()');
  await sleep(1200);
  const ab2 = await cls('.h-ability');
  const dash = await ev("document.querySelector('.h-ability circle[stroke-dasharray]').getAttribute('stroke-dasharray')");
  check(`${tag}: ability active drains the ring`, /active/.test(ab2) && parseFloat(dash) < 100, ab2 + ' ' + dash);
  if (!mobile) await shot(`${tag}-6-ability-active`);
  // 6. level-up burst: real level-up (shot right as the state flips) + HUD knot
  await ev('(()=>{const s=window.__app.sim;s.xp=s.xpNeeded;return 1})()');
  await ev("(async()=>{const s=window.__app.sim;for(let i=0;i<60&&s.state!=='levelup';i++)await new Promise(r=>setTimeout(r,25));return s.state})()");
  await sleep(30);
  check(`${tag}: level-up flares the knot`, /flare/.test(await cls('.h-knot')), await cls('.h-knot'));
  await shot(`${tag}-7-levelup-burst`);
  await pick();
  // 7. boss intro (t=596 -> boss at 600)
  await load(w, h, mobile, `?auto=wren&seed=1&god=1&debug=1&t=596&grant=${GRANT}${touch}`);
  await ev("(async()=>{const s=window.__app.sim;for(let i=0;i<200&&!s.boss;i++)await new Promise(r=>setTimeout(r,50));return !!s.boss})()");
  await sleep(450);
  check(`${tag}: boss bar enters with the slide-in`, /enter/.test(await cls('.h-boss')) && /on/.test(await cls('.h-boss')), await cls('.h-boss'));
  await shot(`${tag}-8-boss-intro`);
  const bi = await ev("getComputedStyle(document.querySelector('.bossintro')).pointerEvents + '|' + getComputedStyle(document.querySelector('.h-boss')).pointerEvents");
  check(`${tag}: boss intro does not block input`, bi === 'none|none', bi);
  // 8. reduced motion: pings are classes only, CSS has no animation; numbers fade in place
  await ev('window.__app.save.setSettings({reducedMotion:true}); window.__app.applySettings(); 1');
  await sleep(300);
  await ev('(()=>{const s=window.__app.sim,p=s.player;s.healPlayer(1);s.addGem(p.x+1,p.y,3);window.__app.ui.hudView.pulseThread();window.__app.ui.hudView.tickCoin();return 1})()');
  const anim = await ev("[getComputedStyle(document.querySelector('.h-thread .h-rail')).animationName,getComputedStyle(document.querySelector('.h-coin')).animationName,getComputedStyle(document.querySelector('.h-boss')).animationName].join(',')");
  check(`${tag}: reduced motion disables the HUD pings`, anim === 'none,none,none', anim);
  const n3 = await nums();
  check(`${tag}: reduced motion reaches the number pool`, n3.reduced === true, JSON.stringify(n3));
  await ev('window.__app.save.setSettings({reducedMotion:false}); window.__app.applySettings(); 1');
  // 9. damage numbers off draws none
  await ev('window.__app.save.setSettings({damageNumbers:false}); 1');
  await ev(injectJs(60));
  await sleep(600);
  const n4 = await nums();
  check(`${tag}: damage-numbers setting off draws nothing`, n4.alive === 0, JSON.stringify(n4));
  await ev('window.__app.save.setSettings({damageNumbers:true}); 1');
}
const only = (process.env.ONLY || 'desk,land,port').split(',');
if (only.includes('desk')) await session('desk', 1280, 720, false);
if (only.includes('land')) await session('land', 844, 390, true);
if (only.includes('port')) await session('port', 390, 844, true);
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
try { ws.close(); proc.kill(); } catch { /* ignore */ }
process.exit(fails ? 1 : 0);
