// S2 Light Trails look (render only; reads the sim's trail points, never writes them). The evolved pack's trail is drawn as pawprints stamped on
// the EXISTING trail points (the sim drops one every 7 px a wolf runs, so one paw per point) over a soft ribbon (ribbons.js addTrailSoft) that
// never bridges a gap longer than SOFT_MAX: the old web of long straight streaks is gone. Point caps are unchanged (quality.js trail.body).
// Paws alternate left/right of each wolf's stride line and keep the heading they were stamped with (render-side WeakMap, so nothing flips as
// old points expire). They fade with the point's remaining life, under every creature, halo, pickup and number.
export const PAW_U = 7.5; // world units across the 48-texel paw frame (pad + toes ~4.6 u, ~11 px on the 1280x720 desktop)
export const PAW_SIDE = 1.6; // world units left/right of the stride line
export const PAW_A = 0.85, PAW_A_CROWD = 0.6; // max alpha; in a thick crowd (DR3 density) eased down to the combat clarity cap for ribbons/glow
export const PAW_FRAME = 'decal_paw';

// pts: the sim trail [{x, y, t, l, id}] in drop order; n: newest points to draw; mem: { side: WeakMap(point -> {s, r}), last: Map(id -> side) };
// out: { x, y, r, a, k } Float32Arrays (length >= n). Returns the number of stamps written.
export function pawStamps(pts, n, mem, out, crowd = 0) {
  const amax = PAW_A + (PAW_A_CROWD - PAW_A) * Math.max(0, Math.min(1, crowd || 0));
  const len = pts ? pts.length : 0, m = Math.min(len, Math.max(0, n | 0), out.x.length);
  if (!m) return 0;
  const from = len - m;
  const prev = new Map(); // id -> previous point (for the heading of a newly seen point)
  for (let i = Math.max(0, from - 64); i < from; i++) prev.set(pts[i].id, pts[i]);
  let c = 0;
  for (let i = from; i < len; i++) {
    const q = pts[i];
    let e = mem.side.get(q);
    if (!e) {
      const o = prev.get(q.id), s = -(mem.last.get(q.id) || -1);
      mem.last.set(q.id, s);
      e = { s, r: o ? Math.atan2(q.y - o.y, q.x - o.x) : 0 };
      mem.side.set(q, e);
    }
    prev.set(q.id, q);
    const f = Math.max(0, Math.min(1, q.t / (q.l || 1)));
    if (f <= 0) continue;
    const nx = -Math.sin(e.r), ny = Math.cos(e.r);
    out.x[c] = q.x + nx * PAW_SIDE * e.s; out.y[c] = q.y + ny * PAW_SIDE * e.s;
    out.r[c] = e.r + Math.PI / 2; // the paw frame's toes point up (-y): rotate them onto the heading
    out.a[c] = amax * (0.2 + 0.8 * f);
    out.k[c] = 0.8 + 0.2 * f;
    c++;
  }
  return c;
}

// Pooled Phaser images of the paw frame (created lazily, never more than `max`).
export class PawLayer {
  constructor(scene, key, depth, max = 300) {
    this.scene = scene; this.key = key; this.depth = depth; this.max = max; this.all = []; this.shown = 0;
    this.mem = { side: new WeakMap(), last: new Map() };
    this.out = { x: new Float32Array(max), y: new Float32Array(max), r: new Float32Array(max), a: new Float32Array(max), k: new Float32Array(max) };
  }
  render(pts, n, crowd = 0) {
    const c = pawStamps(pts, Math.min(n, this.max), this.mem, this.out, crowd), o = this.out, s0 = PAW_U / 48;
    for (let i = 0; i < c; i++) {
      let im = this.all[i];
      if (!im) { im = this.scene.add.image(0, 0, this.key, PAW_FRAME).setDepth(this.depth).setVisible(false); this.all.push(im); }
      im.setPosition(o.x[i], o.y[i]).setRotation(o.r[i]).setScale(s0 * o.k[i]).setAlpha(o.a[i]).setVisible(true);
    }
    for (let i = c; i < this.shown; i++) this.all[i].setVisible(false);
    this.shown = c;
    if (this.mem.last.size > 64) this.mem.last.clear();
    return c;
  }
  clear() { for (let i = 0; i < this.shown; i++) this.all[i].setVisible(false); this.shown = 0; }
}
