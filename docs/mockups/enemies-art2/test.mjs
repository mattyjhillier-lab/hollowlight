// quick iteration harness: node test.mjs <module> <fn> [out]  -> scratch PNG of one creature: big day, states, true size. Not shipped output.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { openChrome } from '../wren-sheet/render.mjs';
import { resetAll, defs, f } from './paint.mjs';
const [mod, fn, outp] = process.argv.slice(2);
const M = await import('./' + mod + '.mjs');
const fns = fn.split(',');
resetAll();
const at = (x, y, k, s, flt) => `<g transform="translate(${x},${y}) scale(${k})"${flt ? ` filter="url(#${flt})"` : ''}>${s}</g>`;
let body = `<rect width="1600" height="900" fill="#5f6a79"/><rect width="1600" height="900" filter="url(#mottle)" opacity=".5"/><rect x="0" y="560" width="1600" height="340" fill="#121829"/>`;
fns.forEach((nm, j) => {
  const [name, sc] = nm.split('@'); const BK = sc ? +sc : 3.6;
  const F = M[name], x0 = 220 + j * 520;
  const big = F({ ph: 0.15 });
  body += at(x0 + 60, 470, BK, big.b + big.e);
  const sts = [{ ph: 0 }, { ph: 0.25 }, { ph: 0.5 }, { tele: 1 }, { hurt: 1, ph: 0.1 }, { die: 0.45 }, { die: 1 }];
  sts.forEach((st, i) => { const p = F(st); body += at(x0 - 160 + i * 74, 690, 0.9, p.b + p.e); });
  const n = F({ ph: 0.3 });
  body += at(x0 - 120, 830, 0.585, n.b + n.e) + at(x0 - 40, 830, 0.585, `<g filter="url(#nightF)">${n.b}</g>` + n.e) + at(x0 + 40, 830, 0.585 * 3, `<g filter="url(#silF)">${n.b}</g>`) + at(x0 + 200, 840, 0.325, n.b + n.e);
});
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">${defs()}${body}</svg></body></html>`;
const c = await openChrome();
const buf = await c.shot(join(process.env.TEMP || '.', 'en2test.html'), html, 1600, 900, 1);
writeFileSync(outp || join(process.env.TEMP || '.', 'en2test.png'), buf);
c.close(); process.exit(0);
