// wren-v2-actual-size.png: real renders (desktop 1280x720 @DPR1, phone 390x844 @DPR2) in the shared battle context, 1:1 and 3x, + honest note.
// gameFrame (2 ghost wolves + threads, raven, 5 Fell Wolves, root crawlers, gems, damage numbers, hollow/restored boundary) is imported from ../wren-alternatives/actual.mjs (untouched).
import { join } from 'node:path';
import { begin, use, T, FONT } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { DESK, PHONE } from '../wren-sheet/actual.mjs';
import { svgPage, bg, card } from '../wren-sheet/common.mjs';
import { gameFrame, img, crop } from '../wren-alternatives/actual.mjs';
import { wren2 } from './wren2.mjs';
import { banner } from './sheet.mjs';

const runHeel = { x: -80, y: 2, view: 'side', pose: 'run', ph: 1.3, bob: -2, thread: false, tongue: true };
const runRide = { x: -30, y: -46, view: 'side', pose: 'sit', expr: 'open', thread: false, front: true };
export const runPose = (alt) => wren2({ view: '3q', dir: -1, run: true, ember: { dx: 28 }, pup: alt ? runRide : runHeel });

const NOTE = [['SURVIVES (60px)', '#7fd68a'], ['pale wolf-head over a dark body, ears, pelt tail, ember dot,', ''], ['and a SECOND small warm light behind her: the pup + its tail', ''], ['ember (follows her, bounds). Nothing else on screen does this.', ''], ['SURVIVES (40px)', '#7fd68a'], ['pale head, dark body, ember dot, pup as a cream bump with a', ''], ['glow dot. Face is a dark dot; glints are gone.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['glint shapes (the emotions), forepaw ties, stitches, thread.', ''], ['At 40px the pup is ~12px and can read as a ghost wolf cub OR', ''], ['a smudge next to the 2 real ghost wolves (same colour).', ''], ['SO', '#ffd98a'], ['Keep pup glow + ember tail tip ON, pup always touching her', ''], ['heel, and the 2 real wolves stay larger. Emotion = UI portrait.', '']];

export async function actualPage(c, tmp, out) {
  const d = await c.shot(join(tmp, 'v2-pass-d.html'), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, () => runPose(false))), 1280, 720, 1);
  const p = await c.shot(join(tmp, 'v2-pass-p.html'), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, () => runPose(false))), 390, 844, 2);
  const dI = img(d), pI = img(p);
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  b += card(8, 100, 636, 300, 'DESKTOP 1280x720, 1:1 pixels', 'Wren about 65 px tall incl. ears');
  b += crop(dI, 1280, 720, 330, 262, 620, 262, 16, 130, 620, 262, false);
  b += card(654, 100, 406, 300, 'PHONE 390x844 @DPR2, true CSS size', 'about 44 px tall');
  b += crop(pI, 780, 1688, 0, 2 * 292, 780, 524, 662, 130, 390, 262, false);
  b += card(1070, 100, 202, 300, 'PUP PLACEMENT', '1:1');
  b += `<rect x="1080" y="128" width="182" height="264" rx="8" fill="#3d4757"/><path d="M1080 262 h182" stroke="#fff" stroke-opacity=".18"/>`;
  const ref = (px, x, y, alt) => `<g transform="translate(${x},${y}) scale(${(px / 112).toFixed(4)})">${runPose(alt)}</g>`;
  b += ref(60, 1124, 240, false) + ref(40, 1220, 240, false) + ref(60, 1124, 372, true) + ref(40, 1220, 372, true);
  b += T('HEEL + TRAIL (recommended)', 1171, 146, { s: 9, c: '#7fd68a', a: 'middle', w: 800 }) + T('60px', 1124, 254, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 }) + T('40px', 1220, 254, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 });
  b += T('ON HER BACK (alt)', 1171, 276, { s: 9, c: '#ff9a8a', a: 'middle', w: 800 }) + T('pale on pale: merges', 1171, 288, { s: 8.6, c: '#c9d3df', a: 'middle', w: 600 }) + T('60px', 1124, 386, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 }) + T('40px', 1220, 386, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 });
  b += card(8, 408, 380, 304, 'DESKTOP Wren + pup 3x (nearest-neighbour)');
  b += crop(dI, 1280, 720, 685, 322, 120, 78, 18, 436, 360, 234);
  b += T('each square = 1 real screen pixel', 198, 692, { s: 10, c: '#9fb0c2', a: 'middle', w: 600 });
  b += card(396, 408, 440, 304, 'PHONE Wren + pup 3x (device pixels)', '88 device px = 44 CSS px');
  b += crop(pI, 780, 1688, 416, 856, 140, 90, 406, 436, 420, 270);
  b += card(844, 408, 428, 304, 'HONEST NOTE: WHAT SURVIVES');
  NOTE.forEach(([tx, col], i) => { const hd = col !== ''; b += T(tx, 858, 450 + i * 16, { s: hd ? 10.6 : 10.2, c: hd ? col : '#d3dce6', w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); });
  b += [['TRUE SCALE: camera 640x360 shown 2x on 1280x720 = about 60px for a 112-unit figure; about 40px on a', '#d3dce6'], ['390px phone. Scene = 2 ghost wolves + amber threads, raven, 5 Fell Wolves, root crawlers, gems,', '#d3dce6'], ['damage numbers, hollow/restored boundary. Same frame as v1 / Take C; Wren runs left, pup bounds behind.', '#ffd98a'], ['Wren v2 stands 65px tall on desktop (44px phone) incl. ears; the pup is about 20px (14px phone).', '#d3dce6']].map(([tx, col], i) => T(tx, 716, 22 + i * 16, { s: 10, c: col, w: 600 })).join('');
  b += banner('WREN v2 ACTUAL SIZE', 'Pelt Walker + pup in a real battle frame: 1:1 and 3x.');
  await out('wren-v2-actual-size', svgPage(1280, 720, b));
}
