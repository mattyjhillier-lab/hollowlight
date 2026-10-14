// elias-v2-actual-size.png: real renders (desktop 1280x720 @DPR1, phone 390x844 @DPR2) in the shared battle context, 1:1 and 3x, + honest note.
// gameFrame (Wren v2 + pup, 2 ghost wolves + amber threads, raven, 5 Fell Wolves, root crawlers, gems, damage numbers, hollow/restored boundary) is imported (never edited).
// Test frame only: Elias walks beside Wren v2 so the two can be compared at true size. In the real game you play ONE hero.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { DESK, PHONE } from '../wren-sheet/actual.mjs';
import { svgPage, bg, card } from '../wren-sheet/common.mjs';
import { gameFrame, img, crop } from '../wren-alternatives/actual.mjs';
import { runPose as wrenRun } from '../wren-v2/actual.mjs';
import { wren2 } from '../wren-v2/wren2.mjs';
import { elias2 } from './elias2.mjs';
import { banner } from './sheet.mjs';

export const EDX = 165; // Elias stands 165 design units to Wren's right (88px desktop / 59px phone)
export const eliasWalk = (extra = {}) => elias2({ view: '3q', dir: -1, run: true, leg: 1.1, orbs: { n: 3, ph: 0.9 }, ...extra });
export const wrenRunPose = () => wren2({ view: '3q', dir: -1, run: true, ember: { dx: 28 }, pup: { x: -80, y: 2, view: 'side', pose: 'run', ph: 1.3, bob: -2, thread: false, tongue: true } });
// Wren v2 (+ pup) at the hero spot, Elias beside her with his own pool of light and shadow
export const pair = () => wrenRun(false) + `<g transform="translate(${EDX},5)"><ellipse cx="0" cy="2" rx="46" ry="8" fill="#000" opacity=".32" filter="url(#b2)"/>${glow(-4, -6, 100, 42, '#ffc45a', 0.4)}${eliasWalk()}</g>`;
export const H = 140;

export const NOTES = [['SURVIVES (60px)', '#7fd68a'], ['a wide rust block, a bright brass CROWN of candle dots on a', ''], ['thick pole, warm pocket patches, lilac flames circling him.', ''], ['No other thing on screen has a crown of lights above its head.', ''], ['SURVIVES (40px)', '#7fd68a'], ['block + gold crown + pole (3px) + warm patches; the 3 lilac', ''], ['flames read as sparks. The staff side + crown is the tell.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['face, moustache, brows, patches, buttons, spare candles. At 40px', ''], ['the 6 candle dots merge into one gold bar, flames are 2px.', ''], ['SO', '#ffd98a'], ['Keep crown glow + pocket glow ON; flame ring needs its comet', ''], ['trail; lilac is the only cool light (not ghost-wolf cream).', '']];

export async function actualPage(c, tmp, out) {
  const d = await c.shot(join(tmp, 'elias-v2-pass-d.html'), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, pair)), 1280, 720, 1);
  const p = await c.shot(join(tmp, 'elias-v2-pass-p.html'), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, pair)), 390, 844, 2);
  writeFileSync(join(tmp, 'elias-v2-frame-d.png'), d); writeFileSync(join(tmp, 'elias-v2-frame-p.png'), p);
  const dI = img(d), pI = img(p);
  begin(); use(STYLES.S1);
  const Ex = 730 + EDX * 0.536, Px = 232 + EDX * (2 / 3) * (60 / 112);
  let b = bg(1280, 720);
  b += card(8, 100, 636, 300, 'DESKTOP 1280x720, 1:1 pixels', `Elias ${Math.round(H * 60 / 112)} px tall, Wren v2 65 px`);
  b += crop(dI, 1280, 720, 330, 262, 620, 262, 16, 130, 620, 262, false);
  b += card(654, 100, 406, 300, 'PHONE 390x844 @DPR2', `Elias ${Math.round(H * 40 / 112)} px, Wren v2 44 px (CSS size)`);
  b += crop(pI, 780, 1688, 0, 2 * 292, 780, 524, 662, 130, 390, 262, false);
  b += card(1070, 100, 202, 300, 'SIZE REFERENCE', '1:1');
  b += `<rect x="1080" y="128" width="182" height="264" rx="8" fill="#3d4757"/><path d="M1080 262 h182" stroke="#fff" stroke-opacity=".18"/>`;
  const ref = (svg, px, x, y) => `<g transform="translate(${x},${y}) scale(${(px / 112).toFixed(4)})">${svg}</g>`;
  b += ref(wrenRunPose(), 60, 1112, 246) + ref(eliasWalk({ orbs: undefined }), 60, 1196, 246) + ref(wrenRunPose(), 40, 1112, 376) + ref(eliasWalk({ orbs: undefined }), 40, 1196, 376);
  b += T('WREN v2', 1112, 146, { s: 9, c: '#ffd98a', a: 'middle', w: 800 }) + T('ELIAS v2', 1196, 146, { s: 9, c: '#ffd98a', a: 'middle', w: 800 }) + T('60px desktop', 1171, 258, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 }) + T('40px phone', 1171, 388, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 });
  b += card(8, 408, 380, 304, 'DESKTOP Elias 2.8x (nearest-neighbour)');
  b += crop(dI, 1280, 720, Math.round(Ex - 88), 317, 128, 92, 18, 432, 360, 258);
  b += T('each square = 1 real screen pixel', 198, 708, { s: 10, c: '#9fb0c2', a: 'middle', w: 600 });
  b += card(396, 408, 440, 304, 'PHONE Elias 2.3x (device pixels)', `${Math.round(H * 80 / 112)} device px = ${Math.round(H * 40 / 112)} CSS px`);
  b += crop(pI, 780, 1688, Math.round(2 * Px - 122), 2 * 472 - 116, 196, 126, 406, 434, 420, 270);
  b += card(844, 408, 428, 304, 'HONEST NOTE: WHAT SURVIVES');
  NOTES.forEach(([tx, col], i) => { const hd = col !== ''; b += T(tx, 858, 450 + i * 16, { s: hd ? 10.6 : 10.2, c: hd ? col : '#d3dce6', w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); });
  b += [['TRUE SCALE: camera 640x360 shown 2x on 1280x720 = about 60px for a 112-unit figure; about 40px on a', '#d3dce6'], ['390px phone. Scene = Wren v2 + pup, 2 ghost wolves + amber threads, raven, 5 Fell Wolves, crawlers, gems.', '#d3dce6'], ['TEST FRAME: Elias walks beside Wren with 3 Holy Orbit flames (in the real game you play one hero).', '#ffd98a'], [`Elias v2 = ${H} units: ${Math.round(H * 60 / 112)}px desktop / ${Math.round(H * 40 / 112)}px phone incl. crown; Wren v2 is 122 units.`, '#d3dce6']].map(([tx, col], i) => T(tx, 716, 22 + i * 16, { s: 10, c: col, w: 600 })).join('');
  b += banner('ELIAS v2 ACTUAL SIZE', 'Lamplighter in a real battle frame: 1:1 and 3x.');
  await out('elias-v2-actual-size', svgPage(1280, 720, b));
}
