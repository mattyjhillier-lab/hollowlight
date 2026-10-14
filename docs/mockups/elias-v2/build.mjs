// node build.mjs [sheet|anim|actual|world|withwren]  -> PNG (+ HTML for sheet/anim/world) in this folder. Local Chrome via CDP, Node built-ins only, no deps.
// Imports (never edits) ../wren-sheet/render.mjs, ../style-lab, ../wren-v2, ../wren-alternatives, ../elias-takes. Big intermediate HTML goes to the OS temp dir.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.ELIAS_TMP || tmpdir();
const what = process.argv[2] || '';
const c = await openChrome();
const out = async (name, html, w = 1280, h = 720, dpr = 1, keepHtml = true) => { const buf = await c.shot(join(keepHtml ? here : tmp, name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, 340); return buf; };
if (!what || what === 'sheet') { const { sheetPage } = await import('./sheet.mjs'); await out('elias-v2-sheet', sheetPage(), 1280, 720, 1, false); }
if (!what || what === 'anim') { const { animPage } = await import('./anim.mjs'); await out('elias-v2-animation', animPage(), 1280, 720, 1, false); }
if (!what || what === 'actual') { const { actualPage } = await import('./actual.mjs'); await actualPage(c, tmp, (n, h) => out(n, h, 1280, 720, 1, false)); }
if (!what || what === 'world') { const { worldPage } = await import('./world.mjs'); await out('elias-v2-in-world', await worldPage(), 1280, 720, 1, false); }
if (!what || what === 'withwren') { const { withWrenPage } = await import('./withwren.mjs'); await withWrenPage(c, tmp, (n, h) => out(n, h, 1280, 720, 1, false)); }
c.close(); process.exit(0);
