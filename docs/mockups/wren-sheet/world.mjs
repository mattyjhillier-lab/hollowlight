// wren-in-world.png: Wren (new design) in the shared style-lab mini-scene at MOCK-UP scale (about 180px, mood only; NOT game scale).
// style-lab/scene.mjs is not modified: its source is read, the one Wren call is swapped for the new Wren, and the patched copy is loaded from the OS temp dir.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { begin, use, defsOut, T, FONT, glow, lgU } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { wren } from './wren.mjs';
import { svgPage, banner } from './common.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const labDir = join(here, '..', 'style-lab');

export async function worldPage() {
  let src = readFileSync(join(labDir, 'scene.mjs'), 'utf8');
  src = src.replace("'./lab.mjs'", JSON.stringify(pathToFileURL(join(labDir, 'lab.mjs')).href)).replace("'./lab.mjs'", JSON.stringify(pathToFileURL(join(labDir, 'lab.mjs')).href));
  src = src.replace("'../cartoon-polished/", JSON.stringify(pathToFileURL(join(labDir, '..', 'cartoon-polished')).href + '/').slice(0, -1) + "/");
  src = src.replace('${wren()}', '${globalThis.__WREN__()}').replace("((cs === 'P3' ? 190 : 172) / WREN_H[cs]).toFixed(3)", '(1.62).toFixed(3)');
  const dir = mkdtempSync(join(tmpdir(), 'hl-wren-scene-'));
  const file = join(dir, 'scene-patched.mjs');
  writeFileSync(file, src);
  const mod = await import(pathToFileURL(file).href);
  globalThis.__WREN__ = () => wren({ view: 'front', leg: 0.3, stride: 6, lanternAngle: 6, scarf: { len: 190, amp: 15, phase: 0.7, sag: 4, ang: -0.16, glow: 2.4, w0: 11.5, w1: 8.5, sx: 14 }, lanternGlow: 1.15 });
  const s = STYLES.S1;
  begin(); use(s);
  let body = mod.sceneBody(s);
  // long lantern light trail on the ground behind her path and a warm scarf light trail
  body += `<g style="mix-blend-mode:screen"><path d="M842 640 Q760 650 690 640" stroke="#ffb84a" stroke-width="16" fill="none" opacity=".25" filter="url(#b8)" stroke-linecap="round"/><path d="M842 640 Q760 650 690 640" stroke="#ffe3a6" stroke-width="3" fill="none" opacity=".85" stroke-dasharray="1 9" stroke-linecap="round"/></g>`;
  body += banner();
  body += T('MOCK-UP SCALE (Wren about 180px) for mood only. In the game she is 60px (desktop) / 40px (phone): see wren-actual-size.png', 12, 112, { s: 11, c: '#ffe8b0', w: 700, st: '#07090d', sw: 3.4 });
  return svgPage(1280, 720, body);
}
