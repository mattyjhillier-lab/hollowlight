// WARDROBE v2 headless screenshots + smoke through Chrome DevTools (no deps). Serve dist/ first (e.g. any static server), then:
//   node scripts/wardrobe-shots.mjs http://127.0.0.1:5198/ docs/screenshots/wardrobe-build
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const URL0 = process.argv[2] || 'http://127.0.0.1:5198/', OUT = process.argv[3] || 'docs/screenshots/wardrobe-build';
fs.mkdirSync(OUT, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 90);
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const chrome = spawn(CH, ['--headless=new', '--hide-scrollbars', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(process.env.TEMP || 'C:/Temp', 'wd-prof-' + Date.now())}`, '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map(); const logs = [];
for (let k = 0; k < 60; k++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find((x) => x.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); break; } } catch { /* retry */ } await sleep(300); }
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text)); else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description).join(' ')); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails)); return r.result.result.value; };
const size = (w, h, mobile = false) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
const shot = async (name, wait = 600) => { await sleep(wait); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('shot', name); };
let fails = 0; const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const boot = async (query = '') => { await send('Page.navigate', { url: URL0 + query }); for (let k = 0; k < 120; k++) { await sleep(500); try { if (await ev('!!(window.__app && window.__boot && window.__boot.ready)')) return true; } catch { /* loading */ } } return false; };

try {
  await send('Runtime.enable'); await send('Page.enable'); await size(1280, 720);
  await boot(); await ev('localStorage.clear()'); ok(await boot(), 'game boots');
  // a save with the Hearth ring closed, the Wick part way, the Dusk started
  const setup = `(() => { const a = window.__app, api = a.treeApi(), def = api.def, ro = api.view.ringOf;
    const real = (k) => def.list.filter((id) => !def.nodes[id].teaser && !def.nodes[id].inert && ro[id] === k); const t = {};
    for (const id of real(0)) t[id] = 1; real(1).slice(0, 7).forEach((id) => { t[id] = 1; }); real(2).slice(0, 3).forEach((id) => { t[id] = 1; });
    a.save.data.tree = t; const r = a.syncCostumes(); a.save.saveNow(); return JSON.stringify({ r, counts: [0, 1, 2, 3, 4].map((k) => real(k).length), earned: a.save.data.cosm.earned }); })()`;
  console.log(await ev(setup));
  const openWear = async (hero) => { await ev(`(() => { const u = window.__app.ui; u.lastHero = '${hero}'; u.navTo('wear'); })()`); await sleep(900); };
  const click = (id) => ev(`(() => { const n = document.querySelector('.wr-med[data-id="${id}"]'); n && n.click(); return !!n; })()`);
  const btnText = () => ev(`(document.querySelector('.wr-btn') || {}).textContent`);

  await openWear('wren');
  ok(await ev(`document.querySelectorAll('.wr-med').length === 6`), 'six shelf medallions');
  await click('wren_hearth'); await sleep(300);
  ok((await btnText()) === 'Wear on Wren', 'earned: Wear on Wren');
  await ev(`document.querySelector('.wr-btn').click()`); await sleep(300);
  ok((await btnText()) === 'Take off', 'worn: Take off');
  ok(await ev(`window.__app.save.data.cosm.worn.costume.wren === 'wren_hearth'`), 'wear persists in cosm.worn.costume');
  await shot('01-desktop-wren-hearth', 900);
  await click('wren_wick'); await sleep(400);
  ok((await btnText()) === 'Not yet yours', 'locked wick: preview only');
  await shot('02-desktop-wren-locked-peek', 600);
  await click('wren_dusk'); await sleep(300);
  await shot('02b-desktop-wren-locked-dusk', 400);
  await openWear('elias'); await click('elias_hearth'); await sleep(300);
  await ev(`document.querySelector('.wr-btn').click()`); await sleep(500);
  await shot('03-desktop-elias-hearth-worn', 900);
  // every costume on both heroes (own everything so the whole shelf is lit)
  await ev(`(() => { const a = window.__app, api = a.treeApi(), def = api.def, t = {}; for (const id of def.list) if (!def.nodes[id].teaser) t[id] = 1; a.save.data.tree = t; a.syncCostumes(); a.save.saveNow(); })()`);
  for (const h of ['wren', 'elias']) {
    await openWear(h);
    for (const c of ['hearth', 'wick', 'dusk', 'far', 'deep', 'dawn']) { await click(`${h}_${c}`); await sleep(250); await shot(`10-${h}-${c}`, 450); }
    await openWear(h);
  }
  ok(await ev(`window.__app.save.data.cosm.earned.length === 12`), 'all five rings: 12 costumes earned incl. Dawnbearer');
  // calm
  await ev(`document.documentElement.classList.add('reduced-motion')`); await openWear('wren'); await click('wren_dawn'); await shot('06-calm-wren-dawn', 700);
  await ev(`document.documentElement.classList.remove('reduced-motion')`);
  // phone
  await size(390, 844, true); await openWear('wren'); await click('wren_hearth'); await sleep(300);
  await shot('07-phone-wren-hearth', 900);
  ok(await ev(`(() => { const b = document.querySelector('.wr-acts .lg-btn'); const r = b.getBoundingClientRect(); return r.bottom <= window.innerHeight + 1 && r.top >= 0; })()`), 'phone: Back / Wear stay on screen');
  ok(await ev(`document.documentElement.scrollWidth <= 391`), 'phone: no horizontal scroll');
  await ev(`document.querySelector('.wr-scroll').scrollTop = 400`); await shot('08-phone-scrolled', 400);
  await ev(`window.__app.ui.lastHero='elias'`); await openWear('elias'); await click('elias_deep'); await shot('09-phone-elias-deep', 800);
  // in the run: costume baked into the rig (desktop size)
  await size(1280, 720);
  await ev(`window.__app.save.data.cosm.worn.costume = { wren: 'wren_dusk', elias: 'elias_deep' }; window.__app.save.saveNow()`);
  for (const [h, c] of [['wren', 'dusk'], ['elias', 'deep']]) {
    ok(await boot(`?auto=${h}&seed=1&t=25&god=1`), `run boots (${h})`); await sleep(2500);
    for (let k = 0; k < 4; k++) { await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))`); await sleep(700); }
    ok((await ev(`(window.__game.scene.getScenes(true)[0].textures.get('${h}_rig')||{}).costumeId`)) === `${h}_${c}`, `${h}: ${c} baked into the rig texture`);
    await shot(`20-run-${h}-${c}`, 800);
  }
  ok(await boot(`?auto=wren&seed=1&t=25&god=1`), 'run boots (wren dusk 2)');
} catch (e) { console.log('ERR', e.message); fails++; }
console.log('LOGS', logs.slice(0, 12));
if (logs.some((l) => l.startsWith('EXC'))) fails++;
try { ws.close(); } catch { /* done */ } chrome.kill();
console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
