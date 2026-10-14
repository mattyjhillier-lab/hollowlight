// node build.mjs [sheet|anim|actual|world]  -> PNGs + HTMLs in this folder. Local Chrome via CDP, Node built-ins only.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openChrome, savePng } from './render.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] || '';
const c = await openChrome();
const out = async (name, html, w = 1280, h = 720, dpr = 1) => { const buf = await c.shot(join(here, name + '.html'), html, w, h, dpr); savePng(join(here, name + ".png"), buf, 346); return buf; };
if (!only || only === 'sheet') { const { sheetPage } = await import('./sheet.mjs'); await out('wren-sheet', sheetPage()); }
if (!only || only === 'anim') { const { animPage } = await import('./anim.mjs'); await out('wren-animation', animPage()); }
if (!only || only === 'actual') { const { actualPages } = await import('./actual.mjs'); await actualPages(c, here, out); }
if (!only || only === 'world') { const { worldPage } = await import('./world.mjs'); await out('wren-in-world', await worldPage()); }
c.close(); process.exit(0);
