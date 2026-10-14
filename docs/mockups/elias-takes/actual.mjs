// elias-take-<x>-actual-size.png: real renders (desktop 1280x720 @DPR1, phone 390x844 @DPR2) in the shared battle context, 1:1 and 3x, + honest note.
// gameFrame (Wren v2 + pup, 2 ghost wolves + amber threads, raven, 5 Fell Wolves, root crawlers, gems, damage numbers, hollow/restored boundary) is imported (never edited).
// Test frame only: Elias walks beside Wren v2 so the two can be compared at true size. In the real game you play ONE hero.
import { join } from 'node:path';
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { DESK, PHONE } from '../wren-sheet/actual.mjs';
import { svgPage, bg, card } from '../wren-sheet/common.mjs';
import { gameFrame, img, crop } from '../wren-alternatives/actual.mjs';
import { runPose as wrenRun } from '../wren-v2/actual.mjs';
import { wren2 } from '../wren-v2/wren2.mjs';
import { TAKES } from './elias.mjs';
import { banner, INFO } from './sheet.mjs';

export const EDX = 165; // Elias stands 165 design units to Wren's right (88px desktop / 59px phone)
export const eliasWalk = (id, extra = {}) => TAKES[id].fn({ view: '3q', dir: -1, run: true, orbs: { n: 3, ph: 0.9 }, ...extra });
// Wren v2 (+ pup) at the hero spot, Elias beside her with his own pool of light and shadow
export const pair = (id) => () => wrenRun(false) + `<g transform="translate(${EDX},5)"><ellipse cx="0" cy="2" rx="42" ry="8" fill="#000" opacity=".32" filter="url(#b2)"/>${glow(-4, -6, 96, 40, '#ffc45a', 0.4)}${eliasWalk(id)}</g>`;

const NOTES = {
  A: [['SURVIVES (60px)', '#7fd68a'], ['indigo bell, ring of flame dots round the head, white beard', ''], ['blob. Wide at the hem, clearly the widest thing on screen.', ''], ['SURVIVES (40px)', '#7fd68a'], ['bell + halo dots + white face. Reads "small saint". The flames', ''], ['are 2-3px dots and the iron ring thins out.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['spectacles, brows, closed-eye arcs, stole embroidery, rope', ''], ['belt, hand candle. At 40px the face is a white beard.', ''], ['SO', '#ffd98a'], ['Thicken the ring (+30%) and keep the halo glow ON; expressions', ''], ['go to the UI portrait. Halo flames read as spikes at 40px.', '']],
  B: [['SURVIVES (60px)', '#7fd68a'], ['wide rust block + a tall pole with a big lantern ABOVE his head', ''], ['+ spade point at the ground. Nothing else is this tall and thin.', ''], ['SURVIVES (40px)', '#7fd68a'], ['block + pole + lantern dot. The lantern is the clearest light', ''], ['dot of the set; orbs read as sparks next to it.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['patches, pocket glows (sub-2px), buttons, face. The pole is', ''], ['about 2px wide at 40px; the coat is a brown lump.', ''], ['SO', '#ffd98a'], ['Pole +25% thicker, lantern glow big, pockets as 3 dots of', ''], ['light. Tallest hero (about 76px): a hit-box / scale decision.', '']],
  C: [['SURVIVES (60px)', '#7fd68a'], ['a rose column + flame + a ring of small flames. A candle.', ''], ['Round, simple, unlike every enemy and the grey-blue Wren.', ''], ['SURVIVES (40px)', '#7fd68a'], ['pink column, flame tip, ring dots. The simplest shape: the', ''], ['most readable of the set, even in a swarm.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['face, cowl drips, mittens, wick. Pink wax sits near the orange', ''], ['damage numbers and the flame can vanish in its own glow.', ''], ['SO', '#ffd98a'], ['Keep a dark outline and a bigger flame. Cute first, sad second:', ''], ['the gutter state (flame shrinks) has to carry the sadness.', '']],
};
export const getNotes = (id) => NOTES[id];

export async function actualPage(c, tmp, id, out) {
  const t = TAKES[id];
  const d = await c.shot(join(tmp, `elias-pass-${id}-d.html`), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, pair(id))), 1280, 720, 1);
  const p = await c.shot(join(tmp, `elias-pass-${id}-p.html`), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, pair(id))), 390, 844, 2);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(tmp, `elias-frame-${id}-d.png`), d); writeFileSync(join(tmp, `elias-frame-${id}-p.png`), p);
  const dI = img(d), pI = img(p);
  begin(); use(STYLES.S1);
  const Ex = 730 + EDX * 0.536, Px = 232 + EDX * (2 / 3) * (60 / 112);
  let b = bg(1280, 720);
  b += card(8, 100, 636, 300, 'DESKTOP 1280x720, 1:1 pixels', `Elias ${Math.round(t.H * 60 / 112)} px tall, Wren v2 65 px`);
  b += crop(dI, 1280, 720, 330, 262, 620, 262, 16, 130, 620, 262, false);
  b += card(654, 100, 406, 300, 'PHONE 390x844 @DPR2', `Elias ${Math.round(t.H * 40 / 112)} px, Wren v2 44 px (CSS size)`);
  b += crop(pI, 780, 1688, 0, 2 * 292, 780, 524, 662, 130, 390, 262, false);
  b += card(1070, 100, 202, 300, 'SIZE REFERENCE', '1:1');
  b += `<rect x="1080" y="128" width="182" height="264" rx="8" fill="#3d4757"/><path d="M1080 262 h182" stroke="#fff" stroke-opacity=".18"/>`;
  const ref = (fn, px, x, y) => `<g transform="translate(${x},${y}) scale(${(px / 112).toFixed(4)})">${fn}</g>`;
  const wrenR = () => wren2({ view: '3q', dir: -1, run: true, ember: { dx: 28 }, pup: { x: -80, y: 2, view: 'side', pose: 'run', ph: 1.3, bob: -2, thread: false, tongue: true } });
  b += ref(wrenR(), 60, 1112, 246) + ref(eliasWalk(id, { orbs: undefined }), 60, 1196, 246) + ref(wrenR(), 40, 1112, 376) + ref(eliasWalk(id, { orbs: undefined }), 40, 1196, 376);
  b += T('WREN v2', 1112, 146, { s: 9, c: '#ffd98a', a: 'middle', w: 800 }) + T('ELIAS', 1196, 146, { s: 9, c: '#ffd98a', a: 'middle', w: 800 }) + T('60px desktop', 1171, 258, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 }) + T('40px phone', 1171, 388, { s: 9.5, c: '#e8edf3', a: 'middle', w: 800 });
  b += card(8, 408, 380, 304, 'DESKTOP Elias 3x (nearest-neighbour)');
  b += crop(dI, 1280, 720, Math.round(Ex - 62), 311, 124, 87, 18, 434, 360, 252);
  b += T('each square = 1 real screen pixel', 198, 706, { s: 10, c: '#9fb0c2', a: 'middle', w: 600 });
  b += card(396, 408, 440, 304, 'PHONE Elias 2.3x (device pixels)', `${Math.round(t.H * 80 / 112)} device px = ${Math.round(t.H * 40 / 112)} CSS px`);
  b += crop(pI, 780, 1688, Math.round(2 * Px - 93), 2 * 472 - 118, 186, 120, 406, 434, 420, 270);
  b += card(844, 408, 428, 304, 'HONEST NOTE: WHAT SURVIVES');
  NOTES[id].forEach(([tx, col], i) => { const hd = col !== ''; b += T(tx, 858, 450 + i * 16, { s: hd ? 10.6 : 10.2, c: hd ? col : '#d3dce6', w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); });
  b += [['TRUE SCALE: camera 640x360 shown 2x on 1280x720 = about 60px for a 112-unit figure; about 40px on a', '#d3dce6'], ['390px phone. Scene = Wren v2 + pup, 2 ghost wolves + amber threads, raven, 5 Fell Wolves, crawlers, gems.', '#d3dce6'], ['TEST FRAME: Elias walks beside Wren with 3 Holy Orbit lights (in the real game you play one hero).', '#ffd98a'], [`Elias ${id} = ${t.H} units: ${Math.round(t.H * 60 / 112)}px desktop / ${Math.round(t.H * 40 / 112)}px phone incl. flames/staff; Wren v2 is 122 units.`, '#d3dce6']].map(([tx, col], i) => T(tx, 716, 22 + i * 16, { s: 10, c: col, w: 600 })).join('');
  b += banner(id).replace(INFO[id].title, INFO[id].title.replace('ELIAS TAKE', 'ELIAS ACTUAL SIZE, TAKE'));
  await out(`elias-take-${id.toLowerCase()}-actual-size`, svgPage(1280, 720, b));
}
