// node build.mjs [diag|best|motion|world|compare] [A|B|C]  -> PNGs in this folder. Local Chrome via CDP (own PID only), Node built-ins only, no deps.
// World pages composite the code-drawn enemies onto the REAL build plates captured in round 1 (../enemies-sheet/plates/*.jpg, enemies removed).
// Intermediate HTML goes to the OS temp dir (it is large); index.html in this folder is the gallery.
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
import { bestiaryPage, motionPage, worldPage, comparePage, diagnosisPage, DESK_K, PHONE_K } from './sheets.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.EN2_TMP || tmpdir();
const what = process.argv[2] || '', only = process.argv[3] || '';
const url = (p) => pathToFileURL(join(here, p)).href;
const c = await openChrome();
const out = async (name, html, w, h, dpr = 1, cap = 950) => { const buf = await c.shot(join(tmp, 'en2_' + name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, cap); };
const takes = only ? [only] : ['A', 'B', 'C'];
const lc = (id) => id.toLowerCase();
try {
  if (!what || what === 'diag') await out('00-diagnosis', diagnosisPage({ live: url('live/live-desk-day.png'), wl: 1280, hl: 720, r1: url('../enemies-sheet/es1-reworks-options.png'), hero: url('../wren-v2/wren-v2-sheet.png') }), 1600, 900);
  for (const id of takes) {
    if (!what || what === 'best') await out(`${lc(id)}1-bestiary`, bestiaryPage(id), 1600, 1000);
    if (!what || what === 'motion') await out(`${lc(id)}2-motion`, motionPage(id), 1600, 96 + 7 * 122 + 22);
    if (!what || what === 'world') {
      const P = (n) => url('../enemies-sheet/plates/' + n + '.jpg');
      await out(`${lc(id)}3-world-desk-night-wren`, worldPage(id, P('desk-night-wren'), 1280, 720, DESK_K, true, `TAKE ${id} ${'HUSKS WICKERKIN SNUFFED'.split(' ')['ABC'.indexOf(id)]}: 0:30 dark start, true size`), 1280, 720, 1, 750);
      await out(`${lc(id)}4-world-desk-day-elias`, worldPage(id, P('desk-day-elias'), 1280, 720, DESK_K, false, `TAKE ${id}: 11:30 first grey light, true size, Elias`), 1280, 720, 1, 750);
      await out(`${lc(id)}5-world-phone-night-wren`, worldPage(id, P('phone-night-wren'), 844, 390, PHONE_K, true), 844, 390, 2, 750);
      await out(`${lc(id)}6-world-phone-day-wren`, worldPage(id, P('phone-day-wren'), 844, 390, PHONE_K, false), 844, 390, 2, 750);
    }
  }
  if (!what || what === 'compare') await out('99-compare', comparePage({ day: url('../enemies-sheet/plates/desk-day-elias.jpg'), night: url('../enemies-sheet/plates/desk-night-wren.jpg') }), 1600, 1060);
} finally { c.close(); }
process.exit(0);
