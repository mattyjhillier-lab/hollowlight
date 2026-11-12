// Tree look port (LOCKED from the live sandbox, docs/LOCKED.md 'TREE LOOK LOCKED FROM THE LIVE SANDBOX' + 'TREE RINGS PICKED'):
// the NIGHT SKY backdrop and the RUNE distance rings of the Lantern Web. Replaces the carved-stone wall of Q1a.
// Code-drawn. The sky is BAKED ONCE (on open / when the screen size class changes), never per frame; per frame only one drawImage of it (with a slow
// parallax), a flat dim, a few additive region tints, the rune rings (cheap vector arcs, culled to the screen) and one drawImage of the screen layer
// (moon haze + moon + vignette, half resolution). Nothing animates except the short bloom of a ring that has just been completed.
// `make(w, h)` returns a canvas-like object (document.createElement('canvas') in the browser, a recording fake in tests).
import { createRng } from '../sim/rng.js';

/** The locked look values (sandbox 'Tune' panel, copied from Matt's settings). Read-only; the screen multiplies by them. */
export const LOOK = Object.freeze({
  bright: 0.7, glow: 0.91, medSize: 0.92, thrLit: 1, thrAvail: 0.39, thrLocked: 0.29, density: 1, bgDim: 0.3, labelSize: 13, labelDensity: 0.48,
  ringBright: 1, ringLabels: true, ringArcs: true,
});
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hex = (h) => { const n = parseInt(String(h).slice(1), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${(+a).toFixed(3)})`; };
const D2R = Math.PI / 180;
const SIL = '#aebdea', GOLD = '#ffd27a';
export const SKY_W = 2600, SKY_H = 1700; // logical size of the sky (the baked canvas may be smaller on phones; it is drawn scaled)

export class TreeBackdrop {
  constructor(make) {
    this.make = make;
    this.bakes = 0; // how many bakes ran (tests: stays flat while frames draw)
    this.sky = null; this.skyKey = '';
    this.screen = null; this.screenKey = '';
    this.glyphCache = new Map(); // ring index -> rune glyph segments
  }

  /** Bake the night sky if the size class changed: a deep blue gradient, three soft aurora bands (teal, violet, blue) and ~900 stars. Returns true when it baked. */
  ensureSky(small) {
    const key = small ? 'S' : 'L';
    if (this.sky && key === this.skyKey) return false;
    this.skyKey = key;
    const k = small ? 0.5 : 1; // phone bake is a quarter of the pixels
    const w = Math.round(SKY_W * k), h = Math.round(SKY_H * k);
    const cv = this.make(w, h);
    this.sky = cv;
    this.bakes++;
    const g = cv.getContext('2d');
    if (!g) return true;
    const rnd = createRng(991).next;
    g.setTransform(k, 0, 0, k, 0, 0);
    const W = SKY_W, H = SKY_H;
    const gr = g.createLinearGradient(0, 0, W * 0.3, H); gr.addColorStop(0, '#0c1236'); gr.addColorStop(0.5, '#1a1650'); gr.addColorStop(1, '#0b1330');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    [['#2fd6a8', 400, 0.09], ['#7b5cff', 800, 0.1], ['#3a8cff', 1150, 0.07]].forEach(([col, y, a], i) => {
      for (let j = 0; j < 3; j++) {
        const x0 = rnd() * W * 0.3, cy = y + (rnd() - 0.5) * 200, sg = i % 2 ? -1 : 1;
        const lg = g.createLinearGradient(0, cy - 160, 0, cy + 160); lg.addColorStop(0, rgba(col, 0)); lg.addColorStop(0.5, rgba(col, a)); lg.addColorStop(1, rgba(col, 0));
        g.fillStyle = lg; g.beginPath(); g.moveTo(x0, cy);
        g.bezierCurveTo(W * 0.3, cy - 220 * sg, W * 0.6, cy + 220 * sg, W, cy + (rnd() - 0.5) * 150); g.lineTo(W, cy + 200);
        g.bezierCurveTo(W * 0.6, cy + 420, W * 0.3, cy + 100, x0, cy + 200); g.closePath(); g.fill();
      }
    });
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 900; i++) {
      const r = rnd(); g.fillStyle = `rgba(225,232,255,${((0.12 + rnd() * 0.5) * (r > 0.96 ? 1 : 0.6)).toFixed(3)})`;
      const sz = r > 0.97 ? 2.4 : r > 0.85 ? 1.6 : 1;
      g.beginPath(); g.arc(rnd() * W, rnd() * H, sz, 0, 7); g.fill();
    }
    return true;
  }

  /** Bake the screen layer (moon haze, a pale moon, vignette) at half resolution if the screen size / size class changed. */
  ensureScreen(W, H, small) {
    const key = `${Math.round(W)}x${Math.round(H)}|${small ? 1 : 0}`;
    if (this.screen && key === this.screenKey) return false;
    this.screenKey = key;
    const w = Math.max(2, Math.round(W / 2)), h = Math.max(2, Math.round(H / 2));
    const cv = this.make(w, h);
    this.screen = cv;
    this.bakes++;
    const g = cv.getContext('2d');
    if (!g) return true;
    const mx = w * 0.84, my = h * 0.17;
    const hz = g.createRadialGradient(mx, my, 0, mx, my, h * 0.5);
    hz.addColorStop(0, `rgba(200,214,255,${(0.16 * LOOK.bright).toFixed(3)})`); hz.addColorStop(1, 'rgba(200,214,255,0)');
    g.fillStyle = hz; g.fillRect(0, 0, w, h);
    g.fillStyle = `rgba(232,238,255,${(0.55 * LOOK.bright).toFixed(3)})`; g.beginPath(); g.arc(mx, my, (small ? 12 : 19) / 2, 0, 7); g.fill();
    const vg = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.5, w / 2, h * 0.45, Math.hypot(w, h) * 0.55);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,4,12,.7)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    return true;
  }

  /** Per frame: the baked sky (one drawImage, 5% parallax with the camera) and the flat dim. cam = {x,y,z}. */
  drawSky(c, cam, W, H) {
    if (!this.sky) return;
    const sc = Math.max(1, W / 2200, H / 1500), sw = SKY_W * sc, sh = SKY_H * sc;
    const ox = clamp(W / 2 - sw / 2 - cam.x * 0.05, W - sw, 0), oy = clamp(H / 2 - sh / 2 - cam.y * 0.05, H - sh, 0);
    c.imageSmoothingEnabled = true;
    c.drawImage(this.sky, ox, oy, sw, sh);
    c.fillStyle = `rgba(3,6,16,${LOOK.bgDim})`; c.fillRect(0, 0, W, H);
  }

  /** Per frame: additive colour washes behind each woken region (cheap radial fills, culled). tints = [{x,y,r,frac,color0,color1}] in world units. */
  drawTints(c, cam, W, H, tints) {
    if (!tints || !tints.length) return;
    const z = cam.z;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const t of tints) {
      const sx = (t.x - cam.x) * z + W / 2, sy = (t.y - cam.y) * z + H / 2, R = t.r * z;
      if (!(t.frac > 0) || sx < -R || sx > W + R || sy < -R || sy > H + R) continue;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, t.color0); g.addColorStop(1, t.color1);
      c.globalAlpha = clamp(t.frac, 0, 1) * 0.5 * LOOK.glow; c.fillStyle = g; c.beginPath(); c.arc(sx, sy, R, 0, 6.2832); c.fill();
    }
    c.restore();
  }

  drawScreen(c, W, H) {
    if (!this.screen) return;
    c.imageSmoothingEnabled = true;
    c.drawImage(this.screen, 0, 0, W, H);
  }

  /** Runic glyph segments of ring k (unit boxes, generated once, deterministic). */
  glyphs(k, R) {
    let out = this.glyphCache.get(k);
    if (out) return out;
    const rnd = createRng(31 + k * 97).next;
    const n = Math.max(30, Math.min(300, Math.round((2 * Math.PI * R) / 40)));
    out = [];
    for (let i = 0; i < n; i++) {
      const segs = [], m = 2 + Math.floor(rnd() * 2);
      for (let q = 0; q < m; q++) segs.push([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]);
      segs.push([0, -0.5, 0, 0.5]);
      out.push(segs);
    }
    this.glyphCache.set(k, out);
    return out;
  }

  /** Arc text along a ring (each glyph rotated onto the circle). Used for the engraved ring names; font comes from the caller. */
  arcText(c, txt, R, ang, fs, col, font) {
    c.font = `${fs}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const chars = [...txt], adv = chars.map((ch) => c.measureText(ch).width + fs * 0.32), total = adv.reduce((a, b) => a + b, 0) / R;
    let a = ang - total / 2;
    for (let q = 0; q < chars.length; q++) {
      const am = a + adv[q] / R / 2;
      c.save(); c.translate(Math.cos(am) * R, Math.sin(am) * R); c.rotate(am + Math.PI / 2);
      c.lineWidth = fs * 0.28; c.strokeStyle = 'rgba(4,7,20,.9)'; c.lineJoin = 'round'; c.strokeText(chars[q], 0, 0);
      c.fillStyle = col; c.fillText(chars[q], 0, 0); c.restore();
      a += adv[q] / R;
    }
  }

  /**
   * The RUNE distance rings (hearth, wick, dusk ... ) centred on the hub: a double band with runic glyphs between, engraved names, and a gold progress arc
   * (owned real lanterns in that tier / all real lanterns in it). A completed ring stays softly lit; `bloom[k]` (0..1) is the short flash right after it completes.
   * rings = [{r, name, frac, bloom}], font = canvas font family for the names. Cheap: vector arcs and one stroke per colour, culled to the screen.
   */
  drawRings(c, cam, W, H, rings, font) {
    if (!rings || !rings.length) return;
    const z = cam.z, B = LOOK.ringBright, pw = 1 / z, a0 = -Math.PI / 2;
    const hx = W / 2 - cam.x * z, hy = H / 2 - cam.y * z;
    let dmax = 0; for (const [px, py] of [[0, 0], [W, 0], [0, H], [W, H]]) dmax = Math.max(dmax, Math.hypot(px - hx, py - hy));
    const inside = hx >= 0 && hx <= W && hy >= 0 && hy <= H;
    const dmin = inside ? 0 : Math.hypot(Math.max(0 - hx, 0, hx - W), Math.max(0 - hy, 0, hy - H));
    const vis = (x, y, m) => { const sx = hx + x * z, sy = hy + y * z; return sx > -m && sx < W + m && sy > -m && sy < H + m; };
    c.save(); c.translate(hx, hy); c.scale(z, z); c.lineCap = 'round';
    rings.forEach((q, k) => {
      const R = q.r, sr = R * z;
      if (!(R > 0) || sr < dmin - 60 || sr > dmax + 60) return;
      const f = LOOK.ringArcs ? clamp(q.frac || 0, 0, 1) : 0, a1 = a0 + Math.PI * 2 * f, done = f >= 0.999;
      const bloom = clamp(q.bloom || 0, 0, 1);
      const silA = 0.5 * B * LOOK.bright, goldA = clamp(0.95 * B, 0, 1);
      const band = Math.max(14, 8 * pw);
      const arc = (r, from, to) => { c.beginPath(); c.arc(0, 0, r, from, to); };
      c.strokeStyle = 'rgba(2,4,14,.35)'; c.lineWidth = 5.5 * pw; arc(R - band, 0, 7); c.stroke(); arc(R + band, 0, 7); c.stroke();
      c.strokeStyle = rgba(SIL, silA * 0.9); c.lineWidth = 2.6 * pw; arc(R - band, 0, 7); c.stroke(); arc(R + band, 0, 7); c.stroke();
      if (f > 0.002) {
        c.strokeStyle = rgba(GOLD, 0.16 * B * LOOK.glow); c.lineWidth = 10 * pw; arc(R - band, a0, a1); c.stroke();
        c.strokeStyle = rgba(GOLD, goldA); c.lineWidth = 3.4 * pw; arc(R - band, a0, a1); c.stroke(); arc(R + band, a0, a1); c.stroke();
      }
      if (done || bloom > 0) { c.strokeStyle = rgba(GOLD, (done ? 0.1 : 0) + bloom * 0.5); c.lineWidth = (done ? 16 : 16 + 26 * (1 - bloom)) * pw; arc(R, 0, 7); c.stroke(); }
      // runes between the bands, gold where the arc has reached
      const G = this.glyphs(k, R), n = G.length, gsz = band * 1.15, gp = new Path2D(), sp = new Path2D();
      for (let i = 0; i < n; i++) {
        const an = a0 + (i / n) * Math.PI * 2, x = Math.cos(an) * R, y = Math.sin(an) * R;
        if (!vis(x, y, 30)) continue;
        const cs = Math.cos(an + Math.PI / 2), sn = Math.sin(an + Math.PI / 2), P = i / n <= f && f > 0 ? gp : sp;
        for (const g of G[i]) {
          const ux = g[0] * gsz * 0.6, uy = g[1] * gsz, vx = g[2] * gsz * 0.6, vy = g[3] * gsz;
          P.moveTo(x + ux * cs - uy * sn, y + ux * sn + uy * cs); P.lineTo(x + vx * cs - vy * sn, y + vx * sn + vy * cs);
        }
      }
      c.lineWidth = 1.8 * pw; c.strokeStyle = rgba(SIL, silA * 0.9); c.stroke(sp); c.strokeStyle = rgba(GOLD, goldA); c.stroke(gp);
      if (LOOK.ringLabels && q.name) {
        const txt = `${String(q.name).toUpperCase()}${LOOK.ringArcs ? `  ${Math.round(f * 100)}%` : ''}`;
        const col = done ? '#ffe6ae' : rgba('#dfe6ff', clamp(0.72 * B, 0.2, 0.95)), rad = R + band + 16 * pw;
        // three names 60 degrees apart if they fit without touching at a readable size, else one name at the top (small rings such as the Hearth)
        const fs3 = (0.85 * rad * 1.0472) / (txt.length * 0.87);
        const three = fs3 * z >= 10, fs = three ? Math.min(15 * pw, fs3) : Math.min(15 * pw, (0.85 * rad * 2.2) / (txt.length * 0.87));
        for (const dg of three ? [-150, -90, -30] : [-90]) { const an = dg * D2R; if (!vis(Math.cos(an) * rad, Math.sin(an) * rad, 80)) continue; this.arcText(c, txt, rad, an, fs, col, font); }
      }
    });
    c.restore();
  }
}

/**
 * Progress per distance ring: owned real lanterns / all real lanterns in the ring tier. Display-only things (teasers, inert slots; hero medallions and
 * reserved slots have no ids at all) are excluded. `ringOf` maps node id -> ring index (view.ringOf). Pure.
 */
export function ringProgress(def, ringOf, count, isOwned) {
  const tot = new Array(count).fill(0), on = new Array(count).fill(0);
  if (!count) return [];
  for (const id of def.list) {
    const n = def.nodes[id]; if (!n || n.teaser || n.inert) continue;
    let k = ringOf && Number.isInteger(ringOf[id]) ? ringOf[id] : -1;
    if (k < 0 || k >= count) continue;
    tot[k]++; if (isOwned(id)) on[k]++;
  }
  return tot.map((t, k) => (t ? on[k] / t : 0));
}
