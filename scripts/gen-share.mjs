// Share image 1200x630 -> public/share.png. Reuses the REAL drawn wordmark from the running build (node scripts/gen-share.mjs; needs `npm run build` + `npx vite preview --port 4190`).
// Code-drawn only: dusk sky, lantern glow pool, wordmark, subtitle. No downloads.
import { writeFileSync } from 'node:fs';
import { launch, sleep } from './u3-lib.mjs';
const c = await launch(9392);
await c.open(process.argv[2] || 'http://localhost:4190/', 1280, 720, 1, false);
await c.ev(`(() => {
  const wm = document.querySelector('.lg-wordmark').cloneNode(true);
  const sub = document.createElement('div'); sub.textContent = 'Spirits of the Dusk';
  const tag = document.createElement('div'); tag.textContent = 'A summoner survivors-like. Light the Hollow, one spirit at a time.';
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;width:1200px;height:630px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(ellipse 60% 55% at 50% 52%,rgba(255,171,58,.30),rgba(255,171,58,0) 70%),linear-gradient(#26384a 0%,#1a2338 55%,#12182b 100%);z-index:99999';
  wm.style.cssText = 'width:900px;height:auto;display:block;filter:drop-shadow(0 8px 18px rgba(0,0,0,.55)) drop-shadow(0 0 40px rgba(255,171,58,.30))';
  sub.style.cssText = 'font:italic 400 54px "Hollowlight Chancery",Georgia,serif;color:#ffe0a0;text-shadow:0 2px 10px rgba(0,0,0,.6)';
  tag.style.cssText = 'font:400 26px "Alegreya Sans",Georgia,serif;color:rgba(255,243,220,.82);margin-top:14px';
  box.append(wm, sub, tag); document.body.replaceChildren(box);
})()`);
await sleep(600);
await c.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await sleep(300);
const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
writeFileSync('public/share.png', Buffer.from(r.data, 'base64'));
c.close();
