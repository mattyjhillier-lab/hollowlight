// node build.mjs [page ...] -> PNGs in this folder. Boss sheet #7 mock-ups (static, code-drawn Style v1; NOT game code).
// Local headless Chrome via CDP (own PID only, closed at the end), Node built-ins only, no deps, no network, no AI tools.
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
import { PAGES as P1 } from './pages.mjs';
import { PAGES2 } from './pages2.mjs';
const PAGES = [...P1, ...PAGES2];
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.BT_TMP || tmpdir();
const want = process.argv.slice(2);
const plates = pathToFileURL(join(here, '../enemies-sheet/plates')).href;
const c = await openChrome();
try {
  for (const p of PAGES) {
    if (want.length && !want.includes(p.name)) continue;
    const buf = await c.shot(join(tmp, 'bt_' + p.name + '.html'), p.html(plates), p.w, p.h, p.dpr || 1);
    savePng(join(here, p.name + '.png'), buf, p.cap || 900);
    console.log('wrote', p.name);
  }
} finally { c.close(); }
process.exit(0);
