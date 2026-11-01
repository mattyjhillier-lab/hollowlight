// Characters mock-up shooter (from codex/shoot.mjs): own headless Chrome on port 9393 with a throwaway profile
// (deleted afterwards); never touches other Chrome processes. Renders every ch-*.html at 1280x720, 844x390@2x, 390x844@2x
// (*-desk pages desktop only).
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9393; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE = mkdtempSync(join(tmpdir(), 'hl-ch-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--disable-extensions', '--allow-file-access-from-files', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* wait */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true }); return r.result && r.result.value; };
  const SIZES = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
  await send('Page.enable'); await send('Runtime.enable');
  for (const p of readdirSync(HERE).filter((f) => /^ch-.*\.html$/.test(f))) {
    const name = p.replace(/\.html$/, ''); const desk = name.endsWith('-desk');
    for (const [tag, w, h, dpr, m] of SIZES) {
      if (desk && tag !== '1280x720') continue;
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: m });
      await send('Page.navigate', { url: pathToFileURL(join(HERE, p)).href });
      await sleep(900);
      // overflow check: content wider/taller than the viewport = layout bug
      const o = await ev('JSON.stringify({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight,small:[...document.querySelectorAll("body *")].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<11).length})');
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const file = join(HERE, `${name}${desk ? '' : '-' + tag}.png`);
      writeFileSync(file, Buffer.from(r.data, 'base64')); console.log('shot', file, o);
    }
  }
  ws.close();
} finally { proc.kill(); await sleep(800); try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* locked */ } }
