// node build.mjs [sheet|anim|actual|world]  -> PNG (+ HTML for sheet/anim/world) in this folder. Local Chrome via CDP, Node built-ins only, no deps.
// Imports (never edits) ../wren-sheet/render.mjs and the style-lab / wren-alternatives helpers. Large intermediate HTML (embedded frames) goes to the OS temp dir.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.WREN_TMP || tmpdir();
const what = process.argv[2] || '';
const c = await openChrome();
const out = async (name, html, w = 1280, h = 720, dpr = 1, keepHtml = true) => { const buf = await c.shot(join(keepHtml ? here : tmp, name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, 340); return buf; };
if (!what || what === 'sheet') { const { sheetPage } = await import('./sheet.mjs'); await out('wren-v2-sheet', sheetPage()); }
if (!what || what === 'anim') { const { animPage } = await import('./anim.mjs'); await out('wren-v2-animation', animPage()); }
if (!what || what === 'actual') { const { actualPage } = await import('./actual.mjs'); await actualPage(c, tmp, (n, h) => out(n, h, 1280, 720, 1, false)); }
if (!what || what === 'world') { const { worldPage } = await import('./world.mjs'); await out('wren-v2-in-world', await worldPage()); }
c.close(); process.exit(0);
