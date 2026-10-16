// Ground zone selector (W1, world sheet #2). Pure JS, visual only. 3x3 authored zones over the world; each zone uses
// ground set A (Meadow Glade: opening, road, wells, meadow, chapel) or B (Deep Forest Floor: grove, thicket, graves)
// and the map edge band is always B (it becomes the edge wall in W5). zoneB() returns the weight of set B, 0..1,
// with soft ~300-unit transitions so a border never shows a hard line. Nothing in src/sim reads this.
export const ZONE_SET = [
  ['B', 'A', 'B'], // NW DEAD GROVE, N MEADOW RUN, NE ROOT THICKET
  ['A', 'A', 'A'], // W MOSSY HOLLOW, CENTRE START, E OLD ROAD
  ['B', 'A', 'A'], // SW GRAVES/MIRE, S MEADOW, SE CHAPEL
];
export const ZONE_NAME = [
  ['Dead Grove', 'Meadow Run', 'Root Thicket'],
  ['Mossy Hollow', 'Start', 'Old Road'],
  ['Graves', 'Meadow', 'Chapel'],
];
export const BLEND = 300; // transition width across a zone border (world units)
export const EDGE_FROM = 300; // world units from the map edge where the B edge band starts to fade in
export const EDGE_TO = 560; // ... and is fully B at this distance from the edge going in (weight 0 beyond)

const sstep = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };

// continuous grid position 0..2 along one axis (boundaries at 1/3 and 2/3 of the world, soft)
function pos(v, world) {
  const c = world / 3;
  const h = BLEND / 2;
  return sstep(c - h, c + h, v) + sstep(2 * c - h, 2 * c + h, v);
}

export function zoneB(x, y, world = 4000) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !(world > 0)) return 0;
  const ex = pos(x, world);
  const ey = pos(y, world);
  const i = ex >= 2 ? 1 : Math.floor(ex);
  const j = ey >= 2 ? 1 : Math.floor(ey);
  const fx = ex - i;
  const fy = ey - j;
  const v = (a, b) => (ZONE_SET[b][a] === 'B' ? 1 : 0);
  const top = v(i, j) * (1 - fx) + v(i + 1, j) * fx;
  const bot = v(i, j + 1) * (1 - fx) + v(i + 1, j + 1) * fx;
  const grid = top * (1 - fy) + bot * fy;
  const d = Math.min(x, y, world - x, world - y);
  const edge = 1 - sstep(EDGE_FROM, EDGE_TO, d);
  const w = grid > edge ? grid : edge;
  return w < 0 ? 0 : w > 1 ? 1 : w;
}

export function zoneNameAt(x, y, world = 4000) {
  const c = world / 3;
  const i = Math.max(0, Math.min(2, Math.floor(x / c)));
  const j = Math.max(0, Math.min(2, Math.floor(y / c)));
  return ZONE_NAME[j][i];
}
