// About tab screenshots (needs `npx vite preview --port 4190`).
import { writeFileSync } from 'node:fs';
import { launch, sleep, VIEWS } from './u3-lib.mjs';
const c = await launch(9393);
for (const [name, w, h, dpr, mobile] of VIEWS) {
  await c.open('http://localhost:4190/', w, h, dpr, mobile); await sleep(1500);
  await c.ev("window.__app.ui.showSettings('', 'about')"); await sleep(1200);
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`docs/screenshots/brand/about-${name}.png`, Buffer.from(r.data, 'base64'));
  console.log(name, JSON.stringify(c.errors));
}
c.close();
