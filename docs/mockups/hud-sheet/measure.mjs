// Measured numbers for the README/proof images: HUD footprint % (transparent render, alpha counted), centre-50% coverage, smallest text, smallest tap target.
import { join } from 'node:path';
import { decode } from '../cartoon-polished/pal.mjs';
import { HDEFS, REC } from './kit.mjs';
import { DIRS, DIM } from './compose.mjs';
import { HERO } from './scenes.mjs';
import { ST } from './dirA.mjs';
import { defs as coreDefs, P1 } from '../cartoon-polished/core.mjs';

export const stM = (key, o = {}) => ({ ...ST, noFade: true, ...o });
export async function measure(c, tmp) {
  const R = {};
  for (const key of ['A', 'B', 'C']) {
    R[key] = {};
    for (const mode of ['desk', 'land', 'port']) {
      const [W, H] = DIM[mode];
      const one = async (st) => {
        const h = DIRS[key].hud(mode, st, HERO[mode]);
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${coreDefs(P1)}${HDEFS}${h.svg}</svg></body></html>`;
        const png = await c.shot(join(tmp, `m-${key}-${mode}.html`), html, W, H, 1, true);
        const { w, h: hh, bpp, img } = decode(png); let solid = 0, any = 0, cen = 0, cenAny = 0;
        for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
          const a = img[(y * w + x) * bpp + 3]; if (a >= 90) solid++; if (a >= 12) any++;
          if (x > W / 4 && x < W * 0.75 && y > H / 4 && y < H * 0.75) { if (a >= 90) cen++; if (a >= 12) cenAny++; }
        }
        return { solid: (100 * solid) / (w * hh), any: (100 * any) / (w * hh), centre: (100 * cen) / (w * hh / 4), centreAny: (100 * cenAny) / (w * hh / 4), zones: h.zones };
      };
      REC.list.length = 0; REC.on = true;
      const bright = await one(stM(key, { wfade: 1 }));
      REC.on = false;
      const words = REC.list.filter((r) => r[0] === 'word').map((r) => r[1]), nums = REC.list.filter((r) => r[0] === 'num').map((r) => r[1]);
      const faded = await one(stM(key, { wfade: 0.42 }));
      const taps = bright.zones.filter((z) => z.tap).map((z) => Math.min(z.w, z.h));
      R[key][mode] = { fp: bright.solid, fpAny: bright.any, fpFaded: faded.solid, centre: bright.centre, centreAny: bright.centreAny, minWord: words.length ? Math.min(...words) : null, minNum: Math.min(...nums), minTap: Math.min(...taps), zones: bright.zones };
    }
  }
  return R;
}
export const MEAS = { v: null };
