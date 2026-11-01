// node build.mjs [overview|pieces|world] [pieceKey] -> PNGs in this folder. Local headless Chrome via CDP (own PID only), Node built-ins only, no deps.
// World/crop pages composite the code-drawn Husks onto the REAL build plates captured in round 1 (../enemies-sheet/plates/*.jpg, enemies removed).
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
import { piecePage, overviewPage, worldPage, DESK_K, PHONE_K } from './sheets.mjs';
import { PIECES } from './roster.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.HK_TMP || tmpdir();
const what = process.argv[2] || '', only = process.argv[3] || '';
const plates = pathToFileURL(join(here, '../enemies-sheet/plates')).href;
const c = await openChrome();
const out = async (name, html, w, h, dpr = 1, cap = 900) => { const buf = await c.shot(join(tmp, 'hk_' + name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, cap); };
const slug = (p) => String(p.n).padStart(2, '0') + '-' + { wolf: 'fell-wolf', crow: 'grave-crow', crawler: 'root-crawler', spit: 'ranged', bulb: 'area-denial', hart: 'charger', alpha: 'miniboss', chest: 'chest', treant: 'treant-hint' }[p.key];
try {
  if (!what || what === 'overview') await out('00-overview', overviewPage(plates), 1600, 1000);
  if (!what || what === 'pieces') for (const p of PIECES) if (!only || only === p.key) await out(slug(p), piecePage(p, plates), 1600, 1000);
  if (!what || what === 'world') {
    const P = (n) => plates + '/' + n + '.jpg';
    await out('w1-desk-night-wren', worldPage(P('desk-night-wren'), 1280, 720, DESK_K, true, 'HUSKS (all A picks): 0:30 dark start, true size, Wren'), 1280, 720, 1, 750);
    await out('w2-desk-day-elias', worldPage(P('desk-day-elias'), 1280, 720, DESK_K, false, 'HUSKS (all A picks): 11:30 grey light, true size, Elias'), 1280, 720, 1, 750);
    await out('w3-phone-night-wren', worldPage(P('phone-night-wren'), 844, 390, PHONE_K, true, 'PHONE night, true size'), 844, 390, 2, 750);
    await out('w4-phone-day-wren', worldPage(P('phone-day-wren'), 844, 390, PHONE_K, false, 'PHONE day, true size'), 844, 390, 2, 750);
  }
} finally { c.close(); }
process.exit(0);
