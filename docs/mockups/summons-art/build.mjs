// node build.mjs [audit|fam|fx|world] [family] -> PNGs in this folder. Local headless Chrome via CDP (own PID only), Node built-ins only, no deps.
// The audit page reads the 2x crops written by `node audit.mjs <dir>` (AUD env = that dir); every other page uses ./plates (summon-free real build frames).
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
import { familyPage, auditPage, fxPage, worldPage } from './sheets.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.SA_TMP || tmpdir();
const what = process.argv[2] || '', only = process.argv[3] || '';
const P = pathToFileURL(join(here, 'plates')).href;
const c = await openChrome();
const out = async (name, html, w, h, dpr = 1, cap = 900) => { const buf = await c.shot(join(tmp, 'sa_' + name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, cap); };
const FAMS = [['wolves', '01-ghost-wolf'], ['ravens', '02-raven'], ['bolts', '03-spirit-bolt'], ['chain', '04-chain-lightning'], ['orbit', '05-holy-orbit']];
try {
  if ((!what || what === 'audit') && process.env.AUD) await out('00-audit', auditPage(pathToFileURL(process.env.AUD).href), 1600, 1290);
  if (!what || what === 'fam') for (const [k, n] of FAMS) if (!only || only === k) await out(n, familyPage(k, P), 1600, 1250);
  if (!what || what === 'fx') await out('06-shared-fx', fxPage(), 1600, 1060);
  if (!what || what === 'world') {
    await out('w1-desk-night-wren', worldPage(P, 'desk', 'wren', 'night', 'RECOMMENDED (all A): 0:30 dark start, Wren: wolves + ravens + chain, true size'), 1280, 720, 1, 750);
    await out('w2-desk-day-elias', worldPage(P, 'desk', 'elias', 'day', 'RECOMMENDED (all A): 11:30 grey light, Elias: orbit + bolts + a Judgment pillar, true size'), 1280, 720, 1, 750);
    await out('w3-phone-land-night-wren', worldPage(P, 'land', 'wren', 'night', 'PHONE 844x390 night, true size'), 844, 390, 2, 750);
    await out('w4-phone-port-day-elias', worldPage(P, 'port', 'elias', 'day', 'PHONE 390x844 day, true size'), 390, 844, 2, 750);
  }
} finally { c.close(); }
process.exit(0);
