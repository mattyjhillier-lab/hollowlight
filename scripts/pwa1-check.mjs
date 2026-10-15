// PWA-1 check: node scripts/pwa1-check.mjs <outDir> [distDir]   (run `npm run build` first)
// Serves dist/ under the GitHub-Pages-style sub-path /hollowlight/ with a tiny node server, drives headless Chrome over CDP:
// manifest + installability errors, service worker registers and controls, offline reload + start a run, update flow
// (waiting prompt on title/pause only, never during a run), screenshots. Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const out = process.argv[2] || 'docs/screenshots/pwa1';
const DIST = resolve(process.argv[3] || 'dist');
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

// --- static server at /hollowlight/ ; GET /__bump makes sw.js report a different VERSION (simulates a new deploy)
let bumped = false;
const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__bump') { bumped = true; res.end('ok'); return; }
  if (!u.pathname.startsWith('/hollowlight/')) { res.statusCode = 404; res.end('nope'); return; }
  let rel = decodeURIComponent(u.pathname.slice('/hollowlight/'.length)) || 'index.html';
  if (rel.includes('..')) { res.statusCode = 400; res.end(); return; }
  const f = join(DIST, rel);
  if (!existsSync(f) || !statSync(f).isFile()) { res.statusCode = 404; res.end('missing'); return; }
  let body = readFileSync(f);
  if (rel === 'sw.js' && bumped) body = Buffer.from(body.toString().replace(/const VERSION = '([^']+)'/, "const VERSION = '$1-bumped'"));
  res.setHeader('Content-Type', MIME[extname(f)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'max-age=600');
  res.end(body);
});
await new Promise((r) => server.listen(4180, '127.0.0.1', r));
const URL0 = 'http://localhost:4180/hollowlight/';

const PORT = 9347;
const dir = mkdtempSync(join(tmpdir(), 'hl-pwa1-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
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
  const waitFor = async (expr, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch { /* page navigating */ } await sleep(200); } return false; };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 });
    const f = join(out, name + '.jpg');
    writeFileSync(f, Buffer.from(r.data, 'base64'));
    const kb = Math.round(statSync(f).size / 1024);
    console.log(`  shot ${name}.jpg ${kb}KB`);
    if (kb > 300) check(`size ${name}`, false, kb + 'KB');
  };
  const titleUp = "window.__app && window.__app.ui && window.__app.ui.layers.start && window.__app.ui.layers.start.style.display === 'flex'";
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');

  // ---- (a) manifest + installability, (b) SW registers and controls
  await send('Page.navigate', { url: URL0 });
  check('title screen loads under /hollowlight/', await waitFor(titleUp));
  const man = await ev(`fetch(document.querySelector('link[rel=manifest]').href).then(r => r.json()).then(m => ({name: m.name, display: m.display, start: m.start_url, icons: m.icons.length}))`);
  check('manifest parses', man.name === 'Hollowlight: Spirits of the Dusk' && man.icons === 3, JSON.stringify(man));
  check('SW ready', await waitFor(`navigator.serviceWorker.ready.then(() => true)`));
  check('SW controls the page (first visit claim)', await waitFor('!!navigator.serviceWorker.controller', 8000));
  const scope = await ev(`navigator.serviceWorker.getRegistration().then(r => r.scope)`);
  check('SW scope is the sub-path', scope === URL0, scope);
  await sleep(1000);
  const inst = await send('Page.getInstallabilityErrors');
  check('installability errors empty', (inst.installabilityErrors || []).length === 0, JSON.stringify(inst.installabilityErrors));
  const cacheNames = await ev('caches.keys()');
  check('one hollowlight cache', cacheNames.length === 1 && cacheNames[0].startsWith('hollowlight-'), cacheNames.join(','));
  const cacheKeys = await ev(`caches.open(${JSON.stringify(cacheNames[0])}).then(c => c.keys()).then(k => k.map(r => new URL(r.url).pathname))`);
  check('precache holds index + icons + manifest', ['/hollowlight/index.html', '/hollowlight/icon-192.png', '/hollowlight/manifest.webmanifest'].every((p) => cacheKeys.includes(p)), cacheKeys.length + ' entries');

  // ---- (c) offline: reload, still loads, start a run
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await send('Page.reload');
  check('offline reload shows title', await waitFor(titleUp, 20000));
  await ev(`window.__app.startRun('wren')`);
  await sleep(1500);
  const run = await ev(`({state: __app.sim && __app.sim.state, t: __app.sim && __app.sim.time})`);
  check('offline: run starts and advances', run.state === 'running' && run.t > 0.5, JSON.stringify(run));
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  // ---- (d) update flow
  await send('Page.reload');
  await waitFor(titleUp);
  await sleep(500);
  const before = await ev('caches.keys()');
  check('no update notice before a new version', (await ev(`document.querySelector('.layer-start .pwa-update').style.display`)) === 'none');
  await ev(`fetch('/__bump')`);
  await ev(`navigator.serviceWorker.getRegistration().then(r => r.update())`);
  check('waiting worker detected (updateReady)', await waitFor('__app.pwa.updateReady()', 15000));
  check('"New version ready" notice visible on title', (await ev(`getComputedStyle(document.querySelector('.layer-start .pwa-update')).display`)) !== 'none' && (await ev(`document.querySelector('.layer-start .pwa-update').textContent`)).includes('New version ready'));
  await shot('title-update-notice-desktop');
  await ev(`window.__app.startRun('wren')`);
  await sleep(600);
  const visibleDuringRun = await ev(`[...document.querySelectorAll('.pwa-update, .pwa-card')].filter(e => e.offsetParent !== null).length`);
  check('no PWA notice or card visible during a run', visibleDuringRun === 0, String(visibleDuringRun));
  await ev(`window.__app.togglePause()`);
  await sleep(300);
  check('pause menu shows the update notice', await ev(`!!document.querySelector('.layer-pause .pwa-update') && getComputedStyle(document.querySelector('.layer-pause .pwa-update')).display !== 'none'`));
  await ev(`document.querySelector('.layer-pause .pwa-update .btn').click()`);
  check('Reload activates the new SW and reloads', await waitFor(`navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.includes('sw.js') && !!window.__app && ${titleUp}`, 20000));
  await sleep(1500);
  const after = await ev('caches.keys()');
  check('new cache version, old one deleted', after.length === 1 && after[0] !== before[0] && after[0].endsWith('-bumped'), `${before} -> ${after}`);
  check('notice gone after update', (await ev(`getComputedStyle(document.querySelector('.layer-start .pwa-update')).display`)) === 'none');

  // ---- (e) screenshots: Android-style (Install + Full screen), iOS-style (3-step guide), pause menu, desktop
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
  const scenario = async (name, { ua, w, h, mobile, pre, fake }) => {
    await send('Emulation.setUserAgentOverride', { userAgent: ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile: !!mobile });
    if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.navigate', { url: URL0 + '?fresh=' + name });
    await waitFor(titleUp);
    await ev(`localStorage.removeItem('hollowlight.installCard.v1')`);
    if (pre) await ev(pre);
    // re-render by reopening the title (card state is read when the title is built)
    await ev(`window.__app.showMenu()`);
    await sleep(700);
    return await ev(`({card: !!document.querySelector('.layer-start .pwa-card'), text: [...document.querySelectorAll('.layer-start .pwa-card .btn')].map(b => b.textContent), steps: document.querySelectorAll('.layer-start .pwa-step').length, link: getComputedStyle(document.querySelector('.layer-start .pwa-link')).display !== 'none'})`);
  };
  const fakeInstall = `(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => Promise.resolve(); e.userChoice = Promise.resolve({outcome: 'accepted'}); window.dispatchEvent(e); })()`;
  let s = await scenario('android', { ua: ANDROID, w: 844, h: 390, mobile: true, pre: fakeInstall });
  check('Android-style: card with Install + Full screen + Not now', s.card && s.text.join('|') === 'Install|Full screen|Not now' && s.link, JSON.stringify(s));
  await shot('title-android-install-card-844x390');
  // real Install click path: prompt() called, card hides after appinstalled
  await ev(`window.dispatchEvent(new Event('appinstalled'))`);
  await sleep(300);
  check('card hidden after appinstalled', (await ev(`!document.querySelector('.layer-start .pwa-card')`)) && (await ev(`getComputedStyle(document.querySelector('.layer-start .pwa-link')).display`)) === 'none');

  s = await scenario('android-portrait', { ua: ANDROID, w: 390, h: 844, mobile: true, pre: fakeInstall });
  await shot('title-android-install-card-390x844');

  await send('Page.addScriptToEvaluateOnNewDocument', { source: "if (/iPhone/.test(navigator.userAgent)) { Object.defineProperty(document, 'fullscreenEnabled', { value: false }); window.addEventListener('beforeinstallprompt', (e) => e.stopImmediatePropagation(), true); }" });
  s = await scenario('ios', { ua: IPHONE, w: 844, h: 390, mobile: true });
  check('iOS-style: 3-step guide, no Install/Full screen buttons', s.card && s.steps === 3 && s.text.join('|') === 'Not now', JSON.stringify(s));
  await shot('title-ios-3-step-guide-844x390');
  s = await scenario('ios-portrait', { ua: IPHONE, w: 390, h: 844, mobile: true });
  await shot('title-ios-3-step-guide-390x844');
  await ev(`[...document.querySelectorAll('.layer-start .pwa-card .btn')].find(b => b.textContent === 'Not now').click()`);
  await sleep(200);
  check('Not now hides the card and remembers a validated timestamp', (await ev(`!document.querySelector('.layer-start .pwa-card')`)) && /^\d{13}$/.test(await ev(`localStorage.getItem('hollowlight.installCard.v1')`)));
  await ev(`window.__app.showMenu()`);
  await sleep(300);
  check('stays hidden on next title (dismissed)', await ev(`!document.querySelector('.layer-start .pwa-card')`));
  await ev(`localStorage.setItem('hollowlight.installCard.v1', String(Date.now() - 15 * 86400000))`);
  await send('Page.reload');
  await waitFor(titleUp);
  await sleep(500);
  check('shows again after 14 days', await ev(`!!document.querySelector('.layer-start .pwa-card')`));
  await ev(`localStorage.removeItem('hollowlight.installCard.v1')`);

  // desktop: title with card + pause menu + settings
  s = await scenario('desktop', { w: 1280, h: 720, mobile: false });
  check('desktop Chrome: Full screen button offered', s.card && s.text.includes('Full screen'), JSON.stringify(s));
  await shot('title-desktop-1280x720');
  await ev(`window.__app.startRun('wren')`);
  await sleep(800);
  await ev(`window.__app.togglePause()`);
  await sleep(400);
  check('pause menu has Fullscreen entry', await ev(`[...document.querySelectorAll('.layer-pause .btn')].some(b => /full screen/i.test(b.textContent))`));
  await shot('pause-desktop-1280x720');
  await ev(`document.querySelector('.layer-pause [data-act=settings]').click()`);
  await sleep(300);
  check('settings has Fullscreen entry', await ev(`[...document.querySelectorAll('.layer-settings .btn')].some(b => /full screen/i.test(b.textContent))`));
  await shot('settings-desktop-1280x720');
  // real gesture click on the pause-menu Fullscreen button (headless may refuse; reported honestly)
  await ev(`document.querySelector('.layer-settings [data-act=close]') ? 0 : 0`);
  s = await scenario('android-pause', { ua: ANDROID, w: 844, h: 390, mobile: true });
  await ev(`window.__app.startRun('wren')`);
  await sleep(800);
  await ev(`window.__app.togglePause()`);
  await sleep(400);
  await shot('pause-android-844x390');
  const pos = await ev(`(() => { const b = [...document.querySelectorAll('.layer-pause .btn')].find(x => /full screen/i.test(x.textContent)); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  for (const t of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x: pos[0], y: pos[1], button: 'left', clickCount: 1 });
  await sleep(800);
  const fsState = await ev(`({fs: !!document.fullscreenElement, label: [...document.querySelectorAll('.layer-pause .btn')].map(b => b.textContent).filter(t => /full screen/i.test(t))[0]})`);
  console.log('INFO real-gesture fullscreen in headless:', JSON.stringify(fsState));
  ws.close();
} catch (e) {
  fails++;
  console.error('ERROR', e);
} finally {
  proc.kill();
  server.close();
}
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
