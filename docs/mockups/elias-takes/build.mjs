// node build.mjs [sheet|actual|compare] [A|B|C]  -> PNG (+ HTML for sheets) in this folder. Local Chrome via CDP, Node built-ins only, no deps.
// Imports (never edits) ../wren-sheet/render.mjs, ../style-lab, ../wren-v2 and ../wren-alternatives. Big intermediate HTML goes to the OS temp dir.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.ELIAS_TMP || tmpdir();
const what = process.argv[2] || '', which = process.argv[3] ? [process.argv[3].toUpperCase()] : ['A', 'B', 'C'];
const c = await openChrome();
const out = async (name, html, w = 1280, h = 720, dpr = 1, keepHtml = true) => { const buf = await c.shot(join(keepHtml ? here : tmp, name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, 340); return buf; };
if (!what || what === 'sheet') { const { sheetPage } = await import('./sheet.mjs'); for (const id of which) await out(`elias-take-${id.toLowerCase()}-sheet`, sheetPage(id), 1280, 720, 1, false); }
if (!what || what === 'actual') { const { actualPage } = await import('./actual.mjs'); for (const id of which) await actualPage(c, tmp, id, (n, h) => out(n, h, 1280, 720, 1, false)); }
if (!what || what === 'compare') { const { comparePage } = await import('./compare.mjs'); await comparePage(c, tmp, (n, h) => out(n, h, 1280, 720, 1, false)); }
c.close(); process.exit(0);
