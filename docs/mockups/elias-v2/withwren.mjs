// elias-v2-with-wren.png: the two launch heroes together (big view, true-size crops, black shapes, contrast table). Mock-up only.
// The battle frames are rendered by actual.mjs (cached in the OS temp dir); if missing they are rendered here.
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { DESK, PHONE } from '../wren-sheet/actual.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { gameFrame, img, crop } from '../wren-alternatives/actual.mjs';
import { wren2 } from '../wren-v2/wren2.mjs';
import { elias2 } from './elias2.mjs';
import { pair, EDX } from './actual.mjs';
import { banner } from './sheet.mjs';

const wrenPup = { x: -46, y: 6, view: '3q', pose: 'sit', expr: 'open', thread: true };
const wrenRunSil = () => wren2({ view: '3q', sil: true, run: true, pup: { x: -78, y: 0, view: 'side', pose: 'run', ph: 1.2, bob: -2, thread: false } });
const eliasRunSil = () => elias2({ view: '3q', dir: -1, sil: true, run: true, leg: 1.1, orbs: { n: 3, ph: 0.9 } });
const ROWS = [
  ['SHAPE', 'low, pointed wolf-hood + bushy tail', 'tall stout block + crowned pole'],
  ['HEIGHT', '122 u: 65px desktop / 44px phone', '140 u: 75px desktop / 50px phone'],
  ['COLOUR', 'cool pelt-grey + navy, amber accent', 'warm rust coat + brass, lilac accent'],
  ['LIGHT', 'ember + cream pup: low, moving, trails', 'crown + pockets + flame ring: high, steady'],
  ['MOTION', 'quick, light, curious; pup bounds', 'slow, heavy, steady; flames orbit him'],
  ['FACE', 'void + 2 glints: a mystery', 'kind human face, moustache: a person'],
  ['ROLE', '60 HP, fast, runs the light out (wolves)', '110 HP, +15% holy, holds the light (ring)'],
  ['MOOD', 'orphan: wary, hopeful', 'gravedigger: gentle, grieving, patient'],
  ['40px TELL', 'pale head + ember dot + pup bump', 'wide block + gold crown dots + lilac sparks'],
];

export async function withWrenPage(c, tmp, out) {
  const fd = join(tmp, 'elias-v2-frame-d.png'), fp = join(tmp, 'elias-v2-frame-p.png');
  if (!existsSync(fd) || !existsSync(fp)) {
    writeFileSync(fd, await c.shot(join(tmp, 'elias-v2-pass-d.html'), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, pair)), 1280, 720, 1));
    writeFileSync(fp, await c.shot(join(tmp, 'elias-v2-pass-p.html'), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, pair)), 390, 844, 2));
  }
  const dI = img(readFileSync(fd)), pI = img(readFileSync(fp));
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  // ---------- big view ----------
  b += card(8, 100, 756, 300, 'THE LAUNCH DUO (same scale)', 'she runs the light out, he holds it in place');
  const k = 1.42, base = 366, wx = 250, ex = 520;
  b += stage(wx - 10, base, 110, 15, 31) + stage(ex + 14, base, 120, 15, 32) + shadow(wx, base + 2, 44) + shadow(ex, base + 2, 48);
  b += `<g transform="translate(${wx},${base}) scale(${k})">${wren2({ view: '3q', pup: wrenPup })}</g>`;
  b += `<g transform="translate(${ex},${base}) scale(${k})">${elias2({ view: '3q', orbs: { n: 3, ph: 0.9 } })}</g>`;
  b += T('WREN v2: low, cool, quick', wx, 392, { s: 11.5, f: FONT.title, w: 900, c: '#ffd98a', a: 'middle', ls: 0.6 }) + T('ELIAS v2: tall, warm, steady', ex + 10, 392, { s: 11.5, f: FONT.title, w: 900, c: '#ffd98a', a: 'middle', ls: 0.6 });
  // vertical height comparison line (Wren 122u vs Elias 140u)
  b += `<path d="M${wx + 62} ${base - 122 * k} H${ex + 120}" stroke="#7fd68a" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>` + `<path d="M${wx + 62} ${base - 140 * k} H${ex + 120}" stroke="#ffb84a" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>`;
  b += T('Wren 122u', ex + 124, base - 122 * k + 3, { s: 8.6, c: '#7fd68a', w: 700 }) + T('Elias 140u', ex + 124, base - 140 * k + 3, { s: 8.6, c: '#ffb84a', w: 700 });
  // ---------- contrast table ----------
  b += card(772, 100, 500, 300, 'WHY THEY ARE A DUO', 'opposites that share the light');
  b += T('WREN v2', 912, 138, { s: 10.4, f: FONT.mono, w: 900, c: '#cdd9e2', a: 'middle' }) + T('ELIAS v2', 1124, 138, { s: 10.4, f: FONT.mono, w: 900, c: '#e0a070', a: 'middle' });
  ROWS.forEach(([l, w, e], i) => {
    const y = 152 + i * 27;
    b += `<rect x="782" y="${y}" width="480" height="24" rx="6" fill="${i % 2 ? '#1a2330' : '#1d2733'}"/>` + T(l, 790, y + 15, { s: 9.2, f: FONT.mono, w: 900, c: '#ffb84a' }) + T(w, 858, y + 15, { s: 8.9, c: '#cfd9e3', w: 500 }) + T(e, 1064 - 6, y + 15, { s: 8.9, c: '#f0dcc4', w: 500 });
  });
  // ---------- actual size ----------
  b += card(8, 408, 620, 304, 'ACTUAL SIZE (1:1 true pixels, Wren left, Elias right)', 'desktop 60px | phone 40px');
  b += crop(dI, 1280, 720, 645, 270, 300, 250, 18, 436, 300, 250, false);
  b += crop(pI, 780, 1688, 240, 560, 560, 500, 330, 436, 280, 250, false);
  b += T('desktop (60px Wren / 75px Elias)', 24, 450, { s: 10, c: '#fff', w: 900, st: '#07090d', sw: 3 }) + T('phone (44px / 50px)', 336, 450, { s: 10, c: '#fff', w: 900, st: '#07090d', sw: 3 });
  b += T('each crop is real screen pixels, not scaled: this is what the player sees', 318, 702, { s: 10, c: '#9fb0c2', w: 600, a: 'middle' });
  // ---------- black shapes ----------
  b += card(636, 408, 300, 304, 'BLACK SHAPES, true size');
  b += `<rect x="646" y="434" width="280" height="142" rx="8" fill="#d9e1e8"/><rect x="646" y="584" width="280" height="118" rx="8" fill="#d9e1e8"/>`;
  b += T('60px desktop', 656, 450, { s: 9.6, c: '#445', w: 800 }) + T('40px phone', 656, 600, { s: 9.6, c: '#445', w: 800 });
  b += `<g transform="translate(730,556) scale(0.536)">${wrenRunSil()}</g><g transform="translate(850,556) scale(0.536)">${eliasRunSil()}</g>`;
  b += `<g transform="translate(730,676) scale(0.357)">${wrenRunSil()}</g><g transform="translate(850,676) scale(0.357)">${eliasRunSil()}</g>`;
  b += T('Wren', 735, 572, { s: 9, c: '#445', w: 800, a: 'middle' }) + T('Elias', 850, 572, { s: 9, c: '#445', w: 800, a: 'middle'}) + T('Wren', 735, 694, { s: 9, c: '#445', w: 800, a: 'middle' }) + T('Elias', 850, 694, { s: 9, c: '#445', w: 800, a: 'middle' });
  // ---------- verdict ----------
  b += card(944, 408, 328, 304, 'VERDICT (honest)');
  const V = [['DISTINCT', '#7fd68a'], ['pointed low wolf vs tall block + pole;', ''], ['cool grey-blue vs warm rust; face void vs face.', ''], ['COMPLEMENTARY', '#7fd68a'], ['her light runs ahead (ember, pup, wolves); his', ''], ['light stays (wheel, pockets, ring). Fast/fragile', ''], ['next to slow/tanky; the ring heals her too.', ''], ['RISK', '#ff9a8a'], ['both carry GOLD light dots at 40px (ember, crown).', ''], ['Told apart by place: hers low and moving with a', ''], ['pup bump, his ABOVE the head on a pole, steady.', ''], ['Lilac flames are the only cool-white spark', ''], ['(ghost wolves + pup are cream, not lilac).', '']];
  V.forEach(([tx, col], i) => { const hd = col !== ''; b += T(tx, 958, 450 + i * 17, { s: hd ? 10.4 : 10, c: hd ? col : '#d3dce6', w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); });
  b += banner('ELIAS v2 + WREN v2: THE LAUNCH DUO', 'Two heroes, one world: distinct in shape, colour and light, complementary in role.');
  await out('elias-v2-with-wren', svgPage(1280, 720, b));
}
