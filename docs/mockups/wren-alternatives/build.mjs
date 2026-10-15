// node build.mjs [sheet|actual|compare] [A|B|C]  -> PNG + HTML in this folder. Local Chrome via CDP, Node built-ins only. Imports (never edits) ../wren-sheet/render.mjs.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const what = process.argv[2] || '', which = process.argv[3] ? [process.argv[3]] : ['A', 'B', 'C'];
const c = await openChrome();
const out = async (name, html, w = 1280, h = 720, dpr = 1) => { const buf = await c.shot(join(here, name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, 340); return buf; };
if (!what || what === 'sheet') { const { sheetPage } = await import('./sheet.mjs'); for (const id of which) await out(`wren-${id.toLowerCase()}-sheet`, sheetPage(id)); }
if (!what || what === 'actual') { const { actualPage } = await import('./actual.mjs'); for (const id of which) await actualPage(c, here, out, id); }
if (!what || what === 'compare') { const { comparePage } = await import('./compare.mjs'); await comparePage(c, here, out); }
c.close(); process.exit(0);
