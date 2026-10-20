// iteration harness (not shipped output): node test.mjs <fn[@scale],...> [out.png] [statesJSON]
// each fn drawn big on a dark stage + day stage, a run strip (4 phases), true size (desktop 2.34 px/wu) day + night, and a black silhouette.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { openChrome } from '../wren-sheet/render.mjs';
import { resetAll, defs } from '../enemies-art2/paint.mjs';
import * as M0 from './spirits.mjs'; import * as M1 from './ravens.mjs'; const M = { ...M0, ...M1, ...(await import('./more.mjs').catch(() => ({}))) };
const [fn, outp, sts] = process.argv.slice(2);
const fns = fn.split(','), DK = 2.34 / 4, extra = sts ? JSON.parse(sts) : [{}, { pose: 'bite' }, { v: 1 }, { v: 2 }];
resetAll();
const at = (x, y, k, s, flt) => `<g transform="translate(${x},${y}) scale(${k})"${flt ? ` filter="url(#${flt})"` : ''}>${s}</g>`;
let body = `<rect width="1600" height="900" fill="#1a2130"/><rect x="800" width="800" height="560" fill="#6d7a62"/><rect x="800" width="800" height="560" filter="url(#mottle)" opacity=".4"/><rect y="560" width="1600" height="340" fill="#232a3c"/>`;
fns.forEach((nm, j) => {
  const [name, sc] = nm.split('@'); const BK = sc ? +sc : 3;
  const F = M[name], x0 = 220 + j * 400;
  body += at(x0, 330, BK, F({ ph: 0.15 })) + `<text x="${x0 - 150}" y="40" fill="#fff" font: font-family="sans-serif" font-size="20">${name}</text>`;
  extra.forEach((st, i) => { body += at(x0 - 150 + i * 90, 700, 1, F({ ph: 0.1, ...st })); });
  [0, 0.25, 0.5, 0.75].forEach((ph, i) => { body += at(x0 - 150 + i * 70, 800, 0.8, F({ ph })); });
  body += at(x0 - 160, 880, DK, F({ ph: 0.3 })) + at(x0 - 100, 880, DK, F({ ph: 0.3 }), 'silF');
});
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">${defs()}<defs>${M.SPIRIT_DEFS}</defs>${body}</svg></body></html>`;
const c = await openChrome();
const out = outp || join(process.env.TEMP || '.', 'sa-test.png');
writeFileSync(out, await c.shot(out.replace(/\.png$/, '.html'), html, 1600, 900, 1));
c.close(); process.exit(0);
