// Shared battle frames (NO HUD): Wren v2 + pup, 2 ghost wolves, ravens, Fell Wolves, root crawlers, gems over the Hollow/restored split.
// Reuses gameFrame from ../wren-alternatives (60px hero desktop, 40px phone) and the Wren v2 run pose; nothing in those folders is edited.
import { join } from 'node:path';
import { gameFrame } from '../wren-alternatives/actual.mjs';
import { DESK as D0, PHONE as P0 } from '../wren-sheet/actual.mjs';
import { wren2 } from '../wren-v2/wren2.mjs';
import { svgPage } from '../wren-sheet/common.mjs';
import { dataUri } from './chrome.mjs';

const runHeel = { x: -80, y: 2, view: 'side', pose: 'run', ph: 1.3, bob: -2, thread: false, tongue: true };
const pose = () => wren2({ view: '3q', dir: -1, run: true, ember: { dx: 28 }, pup: runHeel });

export const DESK = { ...D0, dmg: [],
  fell: [...D0.fell, [120, 215, 1], [210, 335, 1], [95, 520, 1], [250, 640, 1], [350, 150, 1], [1135, 262, 1], [1060, 575, 1], [960, 640, 1], [1190, 430, 1], [660, 110, 1], [1015, 120, 1]],
  crawlers: [...D0.crawlers, [165, 440], [1010, 205], [1150, 610], [905, 255], [560, 640]],
  ravens: [[800, 275], [655, 262], [885, 336]],
  gems: [...D0.gems, [655, 335], [868, 470], [700, 505], [770, 305]] };
export const PHONE = { ...P0, dmg: [] };
export const LAND = { w: 844, h: 390, u: 2 / 3, wren: [470, 222], rest: [[470, 224, 112], [560, 252, 86], [395, 268, 62], [520, 168, 56]], seed: 7,
  fell: [[250, 170, 1], [190, 255, 1], [330, 320, 1], [345, 120, 1], [690, 130, 1], [740, 300, 1], [150, 120, 1], [120, 330, 1]], crawlers: [[236, 330], [700, 210], [60, 220]],
  ghost: [[392, 252, -1], [406, 194, -1]], gems: [[300, 190], [330, 262], [420, 148], [540, 300]], ravens: [[560, 148], [610, 215]], dmg: [] };

export async function renderScenes(c, tmp) {
  const d = await c.shot(join(tmp, 's-desk.html'), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, pose)), 1280, 720, 1);
  const l = await c.shot(join(tmp, 's-land.html'), svgPage(844, 390, gameFrame(844, 390, LAND.u, LAND, pose)), 844, 390, 2);
  const p = await c.shot(join(tmp, 's-port.html'), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, pose)), 390, 844, 2);
  return { desk: dataUri(d), land: dataUri(l), port: dataUri(p), raw: { d, l, p } };
}
export const HERO = { desk: [730, 392], land: [470, 222], port: [232, 470] };
