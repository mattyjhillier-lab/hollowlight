// U1 check: node scripts/u1-shots.mjs <outDir> <tag> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// tag = before | after. Captures HUD screenshots + a hash of computed text styles of every #ui element in a real debug run
// (HUD A must be unchanged by U1), and, if the build has it, the ?specimen=1 type specimen. Spawns its own Chrome; kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9361;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-u1-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const [out, tag = 'after', base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = [['desktop', 1280, 720, 1, false], ['phone-land', 844, 390, 2, true], ['phone-port', 390, 844, 2, true]];
const open = async (w, h, dpr, mobile, query) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
};
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
const STYLES = `(()=>{const o=[];for(const e of document.querySelectorAll('#ui, #ui *')){const c=getComputedStyle(e);o.push([e.tagName,e.className&&e.className.baseVal===undefined?e.className:'',c.fontFamily,c.fontSize,c.fontWeight,c.letterSpacing,c.color,c.lineHeight].join('|'));}return o.join(String.fromCharCode(10))})()`;
let fails = 0;
for (const [name, w, h, dpr, mobile] of VIEWS) {
  await open(w, h, dpr, mobile, `?auto=wren&seed=1&t=300&god=1&debug=1${mobile ? '&touch=1' : ''}`);
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  await sleep(1200);
  const styles = await ev(STYLES);
  const hash = createHash('sha256').update(styles).digest('hex').slice(0, 16);
  writeFileSync(join(out, `${tag}-${name}-styles.txt`), styles);
  console.log(`HUD ${name} ${w}x${h} elements=${styles.split('\n').length} style-hash=${hash}`);
  await shot(`hud-${tag}-${name}`);
}
if (tag === 'after') {
  for (const [name, w, h, dpr, mobile] of VIEWS) {
    await open(w, h, dpr, mobile, '?specimen=1');
    await sleep(1500);
    const st = await ev(`(async()=>{await document.fonts.ready;const f=[...document.fonts].map(x=>x.family+' '+x.weight+' '+x.status);const r=document.getElementById('specimen');return {f,ok:!!r,min:r?Math.min(...[...r.querySelectorAll('[data-size]')].map(e=>parseFloat(getComputedStyle(e).fontSize))):0,hscroll:document.documentElement.scrollWidth>innerWidth+1}})()`);
    console.log(`specimen ${name}`, JSON.stringify(st));
    if (!st.ok || st.hscroll || st.f.some((x) => !x.endsWith('loaded')) || st.min < 12) { fails++; console.log('FAIL specimen', name); }
    await shot(`specimen-${name}`);
    const full = await ev("document.getElementById('specimen').scrollHeight");
    if (full > h) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: Math.min(full, 3000), deviceScaleFactor: dpr, mobile }); await sleep(400); await shot(`specimen-${name}-full`); }
  }
}
ws.close(); proc.kill();
process.exit(fails ? 1 : 0);
