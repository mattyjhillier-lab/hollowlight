// Brand screenshots: node scripts/brand-shots.mjs <tag> [url]  (expects a server on 4190: npx vite preview --port 4190)
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep, VIEWS } from './u3-lib.mjs';
const tag = process.argv[2] || 'title', url = process.argv[3] || 'http://localhost:4190/';
mkdirSync('docs/screenshots/brand', { recursive: true });
const c = await launch(9391);
for (const [name, w, h, dpr, mobile] of [VIEWS[0], VIEWS[1], VIEWS[2]]) {
  await c.open(url, w, h, dpr, mobile); await sleep(2500);
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`docs/screenshots/brand/${tag}-${name}.png`, Buffer.from(r.data, 'base64'));
}
c.close();
