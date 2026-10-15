// node build.mjs [world|touch|cards|states|compare|proof] [A|B|C]  -> PNGs in this folder. Local Chrome via CDP; Node built-ins only; no network.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { openChrome, savePng } from './chrome.mjs';
import { renderScenes } from './scenes.mjs';
import { measure, MEAS } from './measure.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.HUD_TMP || join(tmpdir(), 'hl-hud-sheet'); mkdirSync(tmp, { recursive: true });
const what = process.argv[2] || '', only = process.argv[3] || '';
const c = await openChrome();
const sc = await renderScenes(c, tmp);
MEAS.v = await measure(c, tmp);
(await import('./compose.mjs')).setScenes(sc);
const out = async (name, p) => savePng(join(here, name + '.png'), await c.shot(join(tmp, name + '.html'), p.html, p.w, p.h, p.dpr || 1));
const W = await import('./pages.mjs'), T = await import('./touch.mjs'), CP = await import('./cardpages.mjs');
for (const key of ['A', 'B', 'C']) {
  if (only && only !== key) continue;
  const k = key.toLowerCase();
  if (!what || what === 'world') await out(`hud-${k}-world-landscape`, W.worldPage(key, sc));
  if (!what || what === 'touch') await out(`hud-${k}-phone`, T.touchPage(key, sc));
  if (!what || what === 'cards') { await out(`hud-${k}-cards`, CP.cardsPage(key, sc)); await out(`hud-${k}-cards-desktop`, CP.cardsDeskPage(key, sc)); }
  if (!what || what === 'states') { const S = await import('./states.mjs'); await out(`hud-${k}-states`, S.statesPage(key, sc)); }
}
if (!what || what === 'fixes') { const X = await import('./fixes.mjs'); await out('hud-fixes-before-after', X.fixesPage(sc)); }
if (!what || what === 'compare') { const X = await import('./compare.mjs'); await out('hud-compare', await X.comparePage(sc, c, tmp)); }
if (!what || what === 'proof') { const X = await import('./proof.mjs'); for (const [n, p] of await X.proofPages(sc, c, tmp)) await out(n, p); }
c.close(); process.exit(0);
