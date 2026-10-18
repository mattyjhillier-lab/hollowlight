// Difficulty tiers mock-up shooter (copied from skill-tree-v2/shoot.mjs) (own headless Chrome on port 9382; never touches other Chrome processes).
// node shoot.mjs current [baseUrl]   -> screenshots of the CURRENT tree screen (dev server, default http://127.0.0.1:5173)
// node shoot.mjs mock                -> renders every mock-up page in this folder to PNG at 1280x720, 844x390@2x, 390x844@2x
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const [mode = 'mock', base = 'http://127.0.0.1:5173'] = process.argv.slice(2);
const PORT = 9382; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-dt-'))}`, '--no-first-run', '--disable-extensions', '--enable-unsafe-swiftshader', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* wait */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result && r.result.value; };
  const shot = async (file) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); console.log('shot', file); };
  const SIZES = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
  await send('Page.enable'); await send('Runtime.enable');
  if (mode === 'current') {
    const out = join(HERE, 'current'); mkdirSync(out, { recursive: true });
    for (const [tag, w, h, dpr, m] of SIZES) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
      await send('Page.navigate', { url: `${base}/${m ? '?touch=1' : ''}` });
      for (let i = 0; i < 80; i++) { await sleep(250); if (await ev('!!(window.__app&&window.__app.ui)')) break; }
      // Mid-game save (about 8 runs in): some nodes owned, a few gates met. Page-local only (own Chrome profile).
      await ev(`(()=>{const s=window.__app.save.data;s.gold=2400;s.shards=3;s.tree={sp_reroll1:1,sp_ban1:1,su_bond:1,ma_focus:1,li_vigor:1,su_pot:1,li_step:1,gt_phantom_stampede:1,gt_judgement_wheel:1};
        s.stats.runs=8;s.stats.killsByEnemy={wolf:5200,crow:3900,root_crawler:900};s.stats.evolved={howling_legion:3,sanctum_halo:2,phantom_stampede:1};s.stats.charsUsed={wren:5,elias:3};s.stats.bossKills={elder_treant:1};
        window.__app.save.saveNow&&window.__app.save.saveNow();window.__app.openTree();return 1})()`);
      await sleep(1200);
      await shot(join(out, `current-tree-${tag}.png`));
      await ev(`(()=>{window.__app.ui.tree.select('gt_raven_flock');return 1})()`); await sleep(700);
      await shot(join(out, `current-tree-selected-${tag}.png`));
    }
  } else {
    const pages = readdirSync(HERE).filter((f) => /^dt-.*\.html$/.test(f));
    for (const p of pages) {
      const name = p.replace(/\.html$/, '');
      const only = name.match(/-(desk|phl|php)$/);
      for (const [tag, w, h, dpr, m] of SIZES) {
        if (only && ({ desk: '1280x720', phl: '844x390', php: '390x844' })[only[1]] !== tag) continue;
        await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
        await send('Page.navigate', { url: pathToFileURL(join(HERE, p)).href });
        await sleep(900);
        await shot(join(HERE, `${name}${only ? '' : '-' + tag}.png`));
      }
    }
  }
  ws.close();
} finally { proc.kill(); }
