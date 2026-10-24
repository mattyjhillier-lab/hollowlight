// CHARACTER SYSTEM v2 smoke + screenshots (CH1-CH3): node scripts/ch-smoke.mjs <outDir> [baseUrl]   (needs `npm run build && npx vite preview --port 4193`)
// Own headless Chrome on port 9393 with its own temp profile (deleted at the end). Checks: Pelt Dash + Sanctuary Ring fire in a real page with
// no console errors (shots at 1280x720, 844x390@2x, 390x844@2x); a fresh profile gets the interim starter set (Wren + Ghost Wolves) and only Wren
// is offered; a pre-v2 save keeps both heroes and both launch hearts; the starting weapon of a run is the remembered loadout.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const out = process.argv[2] || 'docs/screenshots/characters'; const base = process.argv[3] || 'http://localhost:4193';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9393;
const dir = mkdtempSync(join(tmpdir(), 'hl-ch-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const errors = [];
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
    else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || ''));
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const open = async (url, w, h, dpr, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url });
    for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui)')) break; } catch { /* loading */ } }
    await sleep(800);
  };
  const shot = async (name) => { mkdirSync(out, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
  const VIEWS = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
  // 1. abilities in a real page (debug ?auto= runs never touch the save)
  for (const [n, w, h, d, m] of VIEWS) {
    for (const hero of ['wren', 'elias']) {
      await open(`${base}/?auto=${hero}&seed=4&t=150&god=1${m ? '&touch=1' : ''}`, w, h, d, m);
      for (let i = 0; i < 80; i++) { if (await ev('!!(__app.sim && __app.sim.time > 151)')) break; await sleep(250); }
      const info = await ev(`(()=>{const s=__app.sim;s.ability.cdLeft=0;s.player.hx=1;s.player.hy=-0.3;const ok=s.useAbility();return JSON.stringify({ok,id:s.ability.id,w:s.weapons.map(x=>x.id),hp:s.player.maxHp,zones:s.zones.filter(z=>z.sanctuary).length,dash:!!s.dash})})()`);
      const I = JSON.parse(info);
      if (!I.ok) fail(`${hero} ability did not fire`);
      if (hero === 'wren' && (I.id !== 'pelt_dash' || !I.dash)) fail('wren dash ' + info);
      if (hero === 'elias' && (I.id !== 'sanctuary_ring' || I.zones !== 1)) fail('elias ring ' + info);
      if (I.hp !== 100) fail(`${hero} body hp ${I.hp}`);
      await sleep(hero === 'wren' ? 120 : 900);
      await shot(`ch-${hero === 'wren' ? 'dash' : 'ring'}-${n}`);
    }
  }
  // 2. fresh profile: interim starter set (Wren + Ghost Wolves), only Wren offered; the loadout's weapon starts the run
  await open(`${base}/`, 1280, 720, 1, false);
  await ev('localStorage.clear()'); await open(`${base}/`, 1280, 720, 1, false);
  const fresh = JSON.parse(await ev(`(()=>{const A=__app;A.ui.showHeroSelect();const d=A.save.data;return JSON.stringify({starter:d.notes.starter,awake:Object.keys(d.chars).filter(k=>d.chars[k].woke),tree:Object.keys(d.tree),cards:document.querySelectorAll('.layer-hero [role=radio]').length})})()`));
  console.log('  fresh', JSON.stringify(fresh));
  if (!fresh.starter || fresh.starter.hero !== 'wren' || fresh.starter.weapon !== 'ghost_wolves') fail('fresh starter ' + JSON.stringify(fresh));
  if (fresh.awake.join() !== 'wren' || fresh.cards !== 1) fail('fresh heroes ' + JSON.stringify(fresh));
  await shot('ch-fresh-hero-1280x720');
  const run = JSON.parse(await ev(`(()=>{const A=__app;A.startRun('elias');const s=A.sim;const r={hero:s.characterId,w:s.weapons.map(x=>x.id),bond:s.bondLevel};A.togglePause&&A.togglePause();return JSON.stringify(r)})()`));
  if (run.hero !== 'wren' || run.w.join() !== 'ghost_wolves') fail('a sleeping hero cannot be played; starter weapon ' + JSON.stringify(run));
  // 3. a pre-v2 save (no chars block) keeps both heroes and both launch hearts
  const legacy = JSON.parse(await ev(`(()=>{const raw=JSON.stringify({version:3,createdAt:1,updatedAt:Date.now()+1e9,gold:500,stats:{runs:9,charsUsed:{wren:6,elias:3}},tree:{}});let idx=null;try{idx=JSON.parse(localStorage.getItem('hollowlight:lanterns'))}catch{}const cur=idx&&idx.active?idx.active:null;localStorage.setItem('hollowlight:save',raw);if(cur)localStorage.setItem('hollowlight:lantern:'+cur+':save',raw);return JSON.stringify(cur)})()`)); // updatedAt ahead: the running page's unload save yields to it
  await open(`${base}/`, 1280, 720, 1, false);
  const lg = JSON.parse(await ev(`(()=>{const A=__app;const d=A.save.data;A.ui.showHeroSelect();return JSON.stringify({awake:Object.keys(d.chars).filter(k=>d.chars[k].woke).sort(),hearts:['gt_ghost_wolves','gt_holy_orbit'].map(h=>d.tree[h]||0),xp:[d.chars.wren&&d.chars.wren.xp,d.chars.elias&&d.chars.elias.xp],cards:document.querySelectorAll('.layer-hero [role=radio]').length})})()`));
  console.log('  legacy', JSON.stringify(lg), legacy);
  if (lg.awake.join() !== 'elias,wren' || lg.hearts.join() !== '1,1' || lg.cards !== 2) fail('legacy ' + JSON.stringify(lg));
  await shot('ch-legacy-hero-1280x720');
  if (errors.length) fail('console errors: ' + errors.slice(0, 5).join(' | '));
} finally {
  try { proc.kill(); } catch { /* gone */ }
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* locked */ }
}
console.log(fails ? `${fails} FAIL` : 'ch-smoke ok');
process.exit(fails ? 1 : 0);
