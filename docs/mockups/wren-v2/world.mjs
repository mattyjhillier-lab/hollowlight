// wren-v2-in-world.png: Wren v2 + pup in the shared style-lab mini-scene at MOCK-UP scale (about 200px, mood only; NOT game scale).
// style-lab/scene.mjs is not modified: its source is read, the one Wren call is swapped, and the patched copy is loaded from the OS temp dir.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { begin, use, T, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage } from '../wren-sheet/common.mjs';
import { pawPrint } from '../wren-alternatives/takes.mjs';
import { wren2 } from './wren2.mjs';
import { banner } from './sheet.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const labDir = join(here, '..', 'style-lab');
const K = 1.62, WX = 905, WY = 590;

export async function worldPage() {
  let src = readFileSync(join(labDir, 'scene.mjs'), 'utf8');
  src = src.replace("'./lab.mjs'", JSON.stringify(pathToFileURL(join(labDir, 'lab.mjs')).href)).replace("'./lab.mjs'", JSON.stringify(pathToFileURL(join(labDir, 'lab.mjs')).href));
  src = src.replace("'../cartoon-polished/", JSON.stringify(pathToFileURL(join(labDir, '..', 'cartoon-polished')).href + '/').slice(0, -1) + "/");
  src = src.replace('${wren()}', '${globalThis.__WREN__()}').replace("((cs === 'P3' ? 190 : 172) / WREN_H[cs]).toFixed(3)", `(${K}).toFixed(3)`);
  const dir = mkdtempSync(join(tmpdir(), 'hl-wren2-scene-'));
  const file = join(dir, 'scene-patched.mjs');
  writeFileSync(file, src);
  const mod = await import(pathToFileURL(file).href);
  // she faces the Hollow (left); the pup sits in front of her, under the ember, head tilted at it: curious
  globalThis.__WREN__ = () => wren2({ view: '3q', dir: -1, expr: 'neutral', ember: { dx: 34, dy: -84 }, pup: { x: 40, y: 9, view: '3q', pose: 'sit', expr: 'open', head: -12, wag: 0.8, thread: false, front: true } });
  const s = STYLES.S1;
  begin(); use(s);
  let body = mod.sceneBody(s);
  // G2: long glowing wake behind the ember (she walked in from the right) + amber paw prints the pup left on the restored grass
  const ex = WX - 34 * K, ey = WY - 84 * K;
  body += `<g style="mix-blend-mode:screen"><path d="M${ex} ${ey} Q${ex + 220} ${ey - 40} ${ex + 400} ${ey + 10}" stroke="#ffb84a" stroke-width="14" fill="none" opacity=".22" filter="url(#b8)" stroke-linecap="round"/><path d="M${ex} ${ey} Q${ex + 220} ${ey - 40} ${ex + 400} ${ey + 10}" stroke="#ffe3a6" stroke-width="2.6" fill="none" opacity=".8" stroke-dasharray="1 9" stroke-linecap="round"/></g>`;
  const prints = [[1230, 640], [1176, 626], [1128, 640], [1086, 628], [1046, 641], [1004, 630], [968, 642]];
  prints.forEach(([x, y], i) => { const a = 0.95 - i * 0.1, side = i % 2 ? 3 : -3; body += glow(x, y + side, 24, 13, '#ffb84a', 0.55 * a) + `<g transform="rotate(-90 ${x} ${y})">${pawPrint(x, y + side, 1.25, '#ffb84a', a)}</g>`; });
  // tail-tip ember of the pup: a short comet of light
  body += `<g style="mix-blend-mode:screen"><path d="M${WX - 40 * K + 30} ${WY + 3} Q${WX - 40 * K + 70} ${WY - 16} ${WX - 40 * K + 120} ${WY - 4}" stroke="#ffb84a" stroke-width="5" fill="none" opacity=".3" filter="url(#b4)" stroke-linecap="round"/></g>`;
  body += banner('WREN v2 IN THE WORLD', 'She stops at the edge of the light. The pup watches the ember; the Hollow waits.');
  body += T('MOCK-UP SCALE (Wren about 200px) for mood only. In the game she is 60px (desktop) / 40px (phone): see wren-v2-actual-size.png', 12, 112, { s: 11, c: '#ffe8b0', w: 700, st: '#07090d', sw: 3.4 });
  return svgPage(1280, 720, body);
}
