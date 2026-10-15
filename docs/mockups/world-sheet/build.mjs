// node build.mjs [overview|ground|props|life|arc|poi|actual|build]  -> PNGs in this folder. Local Chrome via CDP (own spawned PID only), Node built-ins, no deps.
// Imports (never edits) ../style-lab, ../wren-sheet/render.mjs, ../wren-v2, ../elias-v2. Big intermediate HTML goes to the OS temp dir.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { writeFileSync } from 'node:fs';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.WS_TMP || tmpdir();
const what = process.argv[2] || '';
const c = await openChrome();
const ctx = { c, tmp };
const S = await import('./sheets.mjs');
const out = async (name, html, w = 1280, h = 720, dpr = 1, cap = 520) => { const buf = await c.shot(join(tmp, name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, cap); return buf; };
const want = (k) => !what || what === k;
if (want('overview')) await out('ws1-overview', await S.overview(ctx));
if (want('ground')) await out('ws2-ground', await S.ground(ctx));
if (want('props')) await out('ws3-props', await S.props(ctx));
if (want('life')) await out('ws4-life-corruption', await S.life(ctx));
if (want('arc')) await out('ws5-dusk-to-dawn', await S.arc(ctx));
if (want('poi')) await out('ws6-points-of-interest', await S.poi(ctx));
if (want('actual')) {
  for (const [K, tag] of [['A', 'Meadow Glade'], ['B', 'Deep Forest Floor']]) {
    const r = await S.actual(ctx, K, tag);
    await out(`ws7-actual-size-${K}`, r.html);
    savePng(join(here, `frame-${K}-desktop-1280x720.png`), r.D.buf, 700);
    savePng(join(here, `frame-${K}-phone-390x844@2x.png`), r.Pn.buf, 600);
  }
}
if (want('build')) await out('ws8-build-and-perf', await S.build(ctx));
c.close(); process.exit(0);
