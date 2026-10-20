// DR2: one shared telegraph rule (pure JS, no Phaser/DOM). "Only warnings that will actually reach the hero are bright": every tell asks
// threatens() whether the hero is inside its danger zone; the answer picks full strength or TELE_FAINT. Wolf lunge tells are also budgeted
// (4 full + 6 faint, nearest first) so a 60-wolf swarm cannot paint 30 converging lines. Visual only: reads sim state, never writes it.
// No allocation per call (fixed typed arrays, plain numbers).
export const TELE_FAINT = 0.28; // alpha multiplier of a tell that will not reach the hero
export const WOLF_FULL = 4; // full-strength wolf chevrons at once
export const WOLF_FAINT = 6; // faint ones on top of those
export const WOLF_MARGIN = 6; // world units of slack around the real hit radius
export const WOLF_LUNGE_MUL = 3.2; // sim: lunge speed = wolf speed x this ...
export const WOLF_LUNGE_T = 0.6; // ... for this long (Sim.updateEnemies)
export const WOLF_TELL_T = 0.55;

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

// squared distance from point (px,py) to the segment (x0,y0)-(x1,y1)
export function segDist2(px, py, x0, y0, x1, y1) {
  const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy;
  let t = l2 > 1e-9 ? ((px - x0) * vx + (py - y0) * vy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = px - (x0 + vx * t), dy = py - (y0 + vy * t);
  return dx * dx + dy * dy;
}

// Will this tell reach the hero? e = sim enemy in its tell; p = sim player ({x, y, r}). Boss slam: kind 'slam'. A = e.ai block for the data-driven kinds.
export function threatens(e, p) {
  if (!e || !p) return false;
  const A = e.ai, pr = fin(p.r, 6);
  if (e.boss) { const d = Math.hypot(p.x - e.x, p.y - e.y); return d < 74 + pr + WOLF_MARGIN; }
  if (!A) { // Fell Wolf lunge: a straight run of speed x 3.2 for 0.6 s along the direction locked at tell start
    const L = fin(e.speed) * WOLF_LUNGE_MUL * WOLF_LUNGE_T, R = pr + fin(e.r) * 0.85 + WOLF_MARGIN;
    return segDist2(p.x, p.y, e.x, e.y, e.x + fin(e.dx) * L, e.y + fin(e.dy) * L) < R * R;
  }
  if (A.kind === 'fuse') { const R = fin(A.burstR) + pr + 2; const dx = p.x - e.x, dy = p.y - e.y; return dx * dx + dy * dy < R * R; }
  if (A.kind === 'charger') {
    const L = fin(e.speed) * fin(A.chargeMul) * fin(A.charge), R = pr + fin(e.r) * 0.85 + WOLF_MARGIN;
    return segDist2(p.x, p.y, e.x, e.y, e.x + fin(e.dx) * L, e.y + fin(e.dy) * L) < R * R;
  }
  if (A.kind === 'ranged') {
    const L = fin(A.shotSpeed) * fin(A.shotLife), R = pr + fin(A.shotR) + WOLF_MARGIN, mx = e.x + fin(e.dx) * fin(A.muzzle), my = e.y - 6 + fin(e.dy) * fin(A.muzzle);
    return segDist2(p.x, p.y, mx, my, mx + fin(e.dx) * L, my + fin(e.dy) * L) < R * R;
  }
  return true;
}

// Wolf chevron budget for one frame: add() every telling wolf, plan() once, then read mode[i] (2 full, 1 faint, 0 hidden) for the i-th added wolf.
export class WolfBudget {
  constructor(cap = 96) {
    this.cap = cap;
    this.n = 0;
    this.d2 = new Float64Array(cap);
    this.thr = new Uint8Array(cap);
    this.mode = new Uint8Array(cap);
    this.ord = new Int16Array(cap);
  }

  reset() { this.n = 0; }

  // returns the slot index (or -1 when over the hard cap: that wolf is simply not drawn)
  add(d2, threat) {
    if (this.n >= this.cap) return -1;
    this.d2[this.n] = fin(d2, 1e12); this.thr[this.n] = threat ? 1 : 0; this.mode[this.n] = 0;
    return this.n++;
  }

  // nearest first; the 4 nearest THREATENING ones are full strength; the next 6 nearest of the rest (including threatening overflow) are faint
  plan() {
    const n = this.n, o = this.ord, d2 = this.d2;
    for (let i = 0; i < n; i++) {
      let j = i;
      while (j > 0 && d2[o[j - 1]] > d2[i]) { o[j] = o[j - 1]; j--; }
      o[j] = i;
    }
    let full = 0, faint = 0;
    for (let k = 0; k < n; k++) { const i = o[k]; if (this.thr[i] && full < WOLF_FULL) { this.mode[i] = 2; full++; } }
    for (let k = 0; k < n && faint < WOLF_FAINT; k++) { const i = o[k]; if (this.mode[i] === 0) { this.mode[i] = 1; faint++; } }
    return n;
  }
}
