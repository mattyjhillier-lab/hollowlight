// elias-v2-in-world.png: Elias v2 in the shared style-lab mini-scene at MOCK-UP scale (about 195px, mood only; NOT game scale), Candle Wheel blooming colour over the hollow/restored boundary.
// style-lab/scene.mjs is not modified: its source is read, the Wren call / ghost wolf / thread are swapped, and the patched copy is loaded from the OS temp dir.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { begin, use, T, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage } from '../wren-sheet/common.mjs';
import { elias2, orbFlame, bloomDisc, poleX } from './elias2.mjs';
import { banner } from './sheet.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const labDir = join(here, '..', 'style-lab');
const K = 1.4, EX = 742, EY = 604, SXP = 40;

export async function worldPage() {
  let src = readFileSync(join(labDir, 'scene.mjs'), 'utf8');
  src = src.replace("'./lab.mjs'", JSON.stringify(pathToFileURL(join(labDir, 'lab.mjs')).href)).replace("'./lab.mjs'", JSON.stringify(pathToFileURL(join(labDir, 'lab.mjs')).href));
  src = src.replace("'../cartoon-polished/", JSON.stringify(pathToFileURL(join(labDir, '..', 'cartoon-polished')).href + '/').slice(0, -1) + "/");
  src = src.replace('${wren()}', '${globalThis.__ELIAS__()}').replace("((cs === 'P3' ? 190 : 172) / WREN_H[cs]).toFixed(3)", `(${K}).toFixed(3)`);
  src = src.split('\n').map((l) => (l.trim().startsWith('[GY, ') ? '    [GY, \'\'],' : l)).join('\n');
  src = src.replace('o += trail(s) + thread();', '');
  src = src.replace('const WX = 905, WY = 590', `const WX = ${EX}, WY = ${EY}`);
  src = src.replace('ents.sort((a, b) => a[0] - b[0]);', 'ents.push(...globalThis.__EXTRA__());ents.sort((a, b) => a[0] - b[0]);');
  const dir = mkdtempSync(join(tmpdir(), 'hl-elias2-scene-'));
  const file = join(dir, 'scene-patched.mjs');
  writeFileSync(file, src);
  const mod = await import(pathToFileURL(file).href);
  const px = poleX('3q', SXP), CX = EX - px * K, R = 149 * K, RY = R * 0.4; // ring centre in screen px (he faces left, so the pole is on his left)
  // he planted the spade just now: calm face, the three Holy Orbit flames locked in the ring
  globalThis.__ELIAS__ = () => `<g transform="translate(0,0)">${elias2({ view: '3q', dir: -1, expr: 'kind', staffX: SXP, lean: 1, wheel: { low: 1, open: 1, R: 149, fs: 1.15, ph: 0.5, lock: [0, 2, 4] } })}</g>`;
  globalThis.__EXTRA__ = () => {
    let d = '';
    d += glow(CX, EY - 6, R * 1.35, RY * 2.3, '#ffc45a', 0.75);
    d += `<ellipse cx="${CX}" cy="${EY}" rx="${R * 1.06}" ry="${RY * 1.08}" fill="#e4f7b8" opacity=".45" filter="url(#b8)"/>`;
    d += `<g transform="translate(${CX},${EY}) scale(${K})">${bloomDisc(0, 0, 149, 59.6, 1, 11, 9)}</g>`;
    d += `<g style="mix-blend-mode:screen"><ellipse cx="${CX}" cy="${EY}" rx="${R}" ry="${RY}" fill="none" stroke="#ffe3a6" stroke-width="10" opacity=".35" filter="url(#b8)"/></g>`;
    // heal crosses + light motes rising inside the ring
    for (let i = 0; i < 12; i++) { const a = i * 2.4, x = CX + Math.cos(a) * R * 0.78 * ((i * 7 % 11) / 11 + 0.15), y = EY + Math.sin(a) * RY * 0.78 * ((i * 5 % 9) / 9 + 0.1) - 30 - (i % 4) * 26; d += i % 3 === 0 ? `<path d="M${x - 5} ${y} h10 M${x} ${y - 5} v10" stroke="#d6ffb0" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>` : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.6 + (i % 3)).toFixed(1)}" fill="#fff4c8" opacity=".85" filter="url(#b1)"/>`; }
    return [[458, d]];
  };
  const s = STYLES.S1;
  begin(); use(s);
  let body = mod.sceneBody(s);
  // G2: his own wake, a long warm line behind the chandelier (he walked in from the right)
  const lx = EX + 38 * K * 0.0 - (poleX('3q', SXP)) * K, ly = EY - 128 * K;
  body += `<g style="mix-blend-mode:screen"><path d="M${lx} ${ly} Q${lx + 260} ${ly - 50} ${lx + 520} ${ly + 30}" stroke="#ffb84a" stroke-width="14" fill="none" opacity=".2" filter="url(#b8)" stroke-linecap="round"/><path d="M${lx} ${ly} Q${lx + 260} ${ly - 50} ${lx + 520} ${ly + 30}" stroke="#ffe3a6" stroke-width="2.6" fill="none" opacity=".75" stroke-dasharray="1 9" stroke-linecap="round"/></g>`;
  body += banner('ELIAS v2 IN THE WORLD', 'The wheel is planted at the edge of the Hollow. Colour spreads inside the ring; the flames keep watch.');
  body += T('MOCK-UP SCALE (Elias about 195px) for mood only. In the game he is 75px (desktop) / 50px (phone): see elias-v2-actual-size.png', 12, 112, { s: 11, c: '#ffe8b0', w: 700, st: '#07090d', sw: 3.4 });
  return svgPage(1280, 720, body);
}
