// iteration harness (not shipped output): node test.mjs <module> <fn[@bigScale][,fn2...]> [out.png] [g]
// big render on a lit stage, the states strip (walk x4, tell, hurt, death x2), true size day/night, 30 px black silhouette.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { openChrome } from '../wren-sheet/render.mjs';
import { resetAll, defs } from '../enemies-art2/paint.mjs';
import { EXTRA_DEFS } from './kit.mjs';
const [mod, fn, outp, gs] = process.argv.slice(2);
const M = await import('./' + mod + '.mjs');
const fns = fn.split(','), g = +(gs || 0.8), DK = 2.34 / 4;
resetAll();
const at = (x, y, k, s, flt) => `<g transform="translate(${x},${y}) scale(${k})"${flt ? ` filter="url(#${flt})"` : ''}>${s}</g>`;
let body = `<rect width="1600" height="900" fill="#1a2130"/><ellipse cx="800" cy="300" rx="800" ry="320" fill="#3a4a70" opacity=".35"/><rect x="0" y="600" width="1600" height="300" fill="#555c70"/><rect x="0" y="600" width="1600" height="300" filter="url(#mottle)" opacity=".45"/><rect x="0" y="760" width="1600" height="140" fill="#11152a"/>`;
fns.forEach((nm, j) => {
  const [name, sc] = nm.split('@'); const BK = sc ? +sc : 3.4;
  const F = M[name], x0 = 270 + j * 530;
  const big = F({ ph: 0.15 });
  body += `<ellipse cx="${x0}" cy="470" rx="190" ry="28" fill="#4e566a"/>` + at(x0, 470, BK, big.b + big.e);
  const sts = [{ ph: 0 }, { ph: 0.25 }, { ph: 0.5 }, { ph: 0.75 }, { tele: 1 }, { hurt: 1, ph: 0.1 }, { die: 0.4 }, { die: 0.85 }];
  sts.forEach((st, i) => { const p = F(st); body += at(x0 - 230 + i * 62, 690, 0.62, p.b + p.e); });
  const n = F({ ph: 0.3 }), k = g * DK;
  body += at(x0 - 200, 850, k, `<g filter="url(#dayF)">${n.b}</g>` + n.e) + at(x0 - 120, 850, k, `<g filter="url(#nightRim)" opacity=".75">${n.b}</g><g filter="url(#nightF)">${n.b}</g>` + n.e)
    + `<rect x="${x0 - 60}" y="790" width="240" height="80" fill="#d9dee6"/>` + at(x0, 860, 30 / 70, `<g filter="url(#silF)">${n.b}</g>`) + at(x0 + 100, 860, k, `<g filter="url(#silF)">${n.b}</g>`);
});
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg></body></html>`;
const c = await openChrome();
const out = outp || join(process.env.TEMP || '.', 'hk-test.png');
const buf = await c.shot(out.replace(/\.png$/, '.html'), html, 1600, 900, 1);
writeFileSync(out, buf);
c.close(); process.exit(0);
