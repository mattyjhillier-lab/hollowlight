// PWA-1: draws the Hollowlight lantern emblem in code (SVG) and renders PNGs with headless Chrome. Output -> public/.
// Run: node scripts/gen-icons.mjs   (spawns its own Chrome, kills only that PID; no downloads)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const OUT = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

// Palette: slate/deep (background), brass (frame), flame + cream (light). Same values as src/gfx/palette.js.
function svg({ size, scale, rounded }) {
  const bg = rounded
    ? '<rect width="512" height="512" rx="104" fill="url(#bg)"/>'
    : '<rect width="512" height="512" fill="url(#bg)"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26384a"/><stop offset="1" stop-color="#12182b"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffab3a" stop-opacity=".55"/><stop offset=".6" stop-color="#ffab3a" stop-opacity=".12"/><stop offset="1" stop-color="#ffab3a" stop-opacity="0"/></radialGradient>
<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#e98a2a"/></linearGradient>
<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ebc87e"/><stop offset="1" stop-color="#b8924a"/></linearGradient>
</defs>
${bg}
<g transform="translate(256 256) scale(${scale}) translate(-256 -248)">
<circle cx="256" cy="270" r="200" fill="url(#glow)"/>
<path d="M196 142 C196 84 316 84 316 142" fill="none" stroke="#8d6c34" stroke-width="16" stroke-linecap="round"/>
<circle cx="256" cy="116" r="13" fill="url(#brass)" stroke="#8d6c34" stroke-width="6"/>
<path d="M206 132 H306 L348 176 H164 Z" fill="url(#brass)" stroke="#8d6c34" stroke-width="8" stroke-linejoin="round"/>
<path d="M178 180 H334 C346 232 346 292 332 344 H180 C166 292 166 232 178 180 Z" fill="url(#glass)" stroke="#8d6c34" stroke-width="8" stroke-linejoin="round"/>
<path d="M216 182 V342 M296 182 V342" stroke="#8d6c34" stroke-width="7" stroke-linecap="round" opacity=".75"/>
<path d="M256 212 C286 246 298 270 288 298 C282 316 230 316 224 298 C214 270 226 248 256 212 Z" fill="#ffab3a"/>
<path d="M256 250 C271 270 275 282 269 296 C265 305 247 305 243 296 C237 282 241 270 256 250 Z" fill="#fff3dc"/>
<path d="M164 340 H348 L330 380 H182 Z" fill="url(#brass)" stroke="#8d6c34" stroke-width="8" stroke-linejoin="round"/>
<path d="M200 380 L190 398 M312 380 L322 398" stroke="#8d6c34" stroke-width="10" stroke-linecap="round"/>
</g></svg>`;
}

const TARGETS = [
  ['icon-192.png', 192, { scale: 1.12, rounded: true }],
  ['icon-512.png', 512, { scale: 1.12, rounded: true }],
  ['icon-maskable-512.png', 512, { scale: 0.95, rounded: false }], // full bleed, content inside the centre 80%
  ['apple-touch-icon.png', 180, { scale: 1.0, rounded: false }], // iOS rounds the corners itself
  ['favicon-32.png', 32, { scale: 1.25, rounded: true }],
];
writeFileSync(join(OUT, 'favicon.svg'), svg({ size: 64, scale: 1.25, rounded: true }));

const PORT = 9355;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-icons-'))}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  for (const [name, size, opt] of TARGETS) {
    await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
    const html = `<!doctype html><body style="margin:0;overflow:hidden;background:transparent"><style>svg{display:block}</style>${svg({ size, ...opt })}</body>`;
    await send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) });
    await sleep(400);
    const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 }, fromSurface: true });
    writeFileSync(join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('wrote', name);
  }
  ws.close();
} finally { proc.kill(); }
