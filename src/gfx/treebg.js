// Q1a: the CARVED STONE NIGHT backdrop of the Lantern Web (LOCKED look, docs/mockups/tree-v3/R3-bgB-carved-stone-night.png).
// Code-drawn and BAKED ONCE (on open / when the web size or screen size class changes), never per frame:
//   world layer  = dark blue-grey stone wall (chiselled block seams, speckle) + engraved runic rings centred on the hub, fading out at the web edge
//   screen layer = moon haze (top-left) + vignette, at half resolution
// Per frame only cheap things happen: one drawImage of the world layer, a few additive tint circles (region colour = lit fraction), a few additive
// ring arcs whose gold is the lit fraction of that ring's lanterns, and one drawImage of the screen layer. Nothing animates (changes are plain
// redraws on state change), so Calm motion needs no special case.
// `make(w, h)` returns a canvas-like object (document.createElement('canvas') in the browser, a recording fake in tests).
import { createRng } from '../sim/rng.js';

const STONE = { base: '#222a3a', hi: 'rgba(160,178,214,.10)', lo: 'rgba(4,7,14,.55)' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class TreeBackdrop {
  constructor(make) {
    this.make = make;
    this.bakes = 0; // how many bakes ran (tests: stays flat while frames draw)
    this.world = null; this.worldKey = ''; this.E = 0; this.scale = 1;
    this.screen = null; this.screenKey = '';
  }

  /** Bake the world layer if the web size / size class changed. radii = engraved ring radii (world units). Returns true when it baked. */
  ensureWorld(webR, radii, small) {
    const E = Math.ceil((Number(webR) || 1500) + 500);
    const scale = small ? 0.26 : 0.42;
    const key = `${E}|${scale}|${(radii || []).join(',')}`;
    if (this.world && key === this.worldKey) return false;
    this.worldKey = key; this.E = E; this.scale = scale;
    const px = Math.round(2 * E * scale);
    const cv = this.make(px, px);
    this.world = cv;
    this.bakes++;
    const g = cv.getContext('2d');
    if (!g) return true;
    const rnd = createRng(0x57017e).next;
    g.setTransform(scale, 0, 0, scale, E * scale, E * scale); // world units, hub at the middle
    g.fillStyle = STONE.base; g.fillRect(-E, -E, 2 * E, 2 * E);
    // block courses: rows of about 90 units, blocks 130-260 wide, every row offset; each block a touch lighter or darker
    for (let y = -E, row = 0; y < E; y += 90, row++) {
      const h = 90;
      let x = -E - Math.floor(rnd() * 200);
      while (x < E) {
        const w = 130 + Math.floor(rnd() * 130);
        const t = rnd() - 0.5;
        g.fillStyle = t > 0 ? `rgba(150,170,210,${(t * 0.10).toFixed(3)})` : `rgba(2,4,10,${(-t * 0.22).toFixed(3)})`;
        g.fillRect(x, y, w, h);
        g.fillStyle = STONE.lo; g.fillRect(x + w - 3, y, 4, h); g.fillRect(x, y + h - 3, w, 4); // seam: dark groove
        g.fillStyle = STONE.hi; g.fillRect(x + 1, y + 1, w - 5, 2); g.fillRect(x + 1, y + 1, 2, h - 5); // lit chisel edge
        x += w;
      }
    }
    if (!small) { // fine speckle, desktop only
      for (let i = 0; i < 5200; i++) { g.fillStyle = rnd() > 0.5 ? 'rgba(180,196,230,.05)' : 'rgba(0,0,0,.12)'; const s = 2 + rnd() * 5; g.fillRect((rnd() * 2 - 1) * E, (rnd() * 2 - 1) * E, s, s); }
    }
    // engraved rings and runes (a dark groove with a pale lip; the lit-gold version is drawn per frame over the same arcs)
    for (const r of radii || []) {
      g.lineWidth = 7; g.strokeStyle = 'rgba(3,6,12,.65)'; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.stroke();
      g.lineWidth = 2; g.strokeStyle = 'rgba(170,186,222,.14)'; g.beginPath(); g.arc(0, 0, r + 5, 0, 6.2832); g.stroke();
      const n = Math.max(12, Math.round((6.2832 * r) / 70));
      g.lineWidth = 3; g.lineCap = 'round'; g.strokeStyle = 'rgba(3,6,12,.6)';
      for (let i = 0; i < n; i++) { // runes: three short strokes inside a 12 x 18 box, turned to face along the ring
        const a = (i / n) * 6.2832 + rnd() * 0.04;
        g.save(); g.translate(Math.cos(a) * (r + 22), Math.sin(a) * (r + 22)); g.rotate(a + 1.5708);
        g.beginPath();
        for (let k = 0; k < 3; k++) { g.moveTo((rnd() - 0.5) * 12, (rnd() - 0.5) * 18); g.lineTo((rnd() - 0.5) * 12, (rnd() - 0.5) * 18); }
        g.stroke(); g.restore();
      }
    }
    // the wall fades into the dusk sky at the web edge
    g.globalCompositeOperation = 'destination-in';
    const f = g.createRadialGradient(0, 0, E * 0.62, 0, 0, E);
    f.addColorStop(0, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.fillRect(-E, -E, 2 * E, 2 * E);
    g.globalCompositeOperation = 'source-over';
    return true;
  }

  /** Bake the screen layer (moon haze top-left, vignette) at half resolution if the screen size / size class changed. */
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
    const hz = g.createRadialGradient(w * 0.14, h * 0.1, 0, w * 0.14, h * 0.1, Math.max(w, h) * 0.6);
    hz.addColorStop(0, `rgba(190,208,255,${small ? 0.16 : 0.2})`); hz.addColorStop(1, 'rgba(190,208,255,0)');
    g.fillStyle = hz; g.fillRect(0, 0, w, h);
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.55);
    vg.addColorStop(0, 'rgba(2,4,10,0)'); vg.addColorStop(1, 'rgba(2,4,10,.6)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    return true;
  }

  /** Per frame: the stone wall (one drawImage), region colour washes, then the gold of lit rings. lit[k] = 0..1 for radii[k]. cam = {x,y,z}. */
  drawWorld(c, cam, W, H, radii, lit, tints) {
    if (!this.world) return;
    const z = cam.z, E = this.E;
    c.imageSmoothingEnabled = true;
    c.drawImage(this.world, (-E - cam.x) * z + W / 2, (-E - cam.y) * z + H / 2, 2 * E * z, 2 * E * z);
    const hx = (0 - cam.x) * z + W / 2, hy = (0 - cam.y) * z + H / 2;
    if (tints && tints.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const t of tints) {
        const sx = (t.x - cam.x) * z + W / 2, sy = (t.y - cam.y) * z + H / 2, R = t.r * z;
        if (!(t.frac > 0) || sx < -R || sx > W + R || sy < -R || sy > H + R) continue;
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, R);
        g.addColorStop(0, t.color0); g.addColorStop(1, t.color1);
        c.globalAlpha = clamp(t.frac, 0, 1) * 0.5; c.fillStyle = g; c.beginPath(); c.arc(sx, sy, R, 0, 6.2832); c.fill();
      }
      c.restore();
    }
    if (radii && radii.length) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let k = 0; k < radii.length; k++) {
        const a = clamp((lit && lit[k]) || 0, 0, 1);
        if (a <= 0) continue;
        const R = radii[k] * z;
        const dx = Math.max(0, Math.abs(W / 2 - hx) - W / 2), dy = Math.max(0, Math.abs(H / 2 - hy) - H / 2);
        // the circle can only touch the screen if the nearest and farthest screen corners straddle R
        const far = Math.hypot(Math.abs(hx - W / 2) + W / 2, Math.abs(hy - H / 2) + H / 2);
        const near = Math.hypot(dx, dy);
        if (R + 40 < near || R - 40 > far) continue;
        c.strokeStyle = `rgba(255,201,110,${(0.05 + 0.2 * a).toFixed(3)})`; c.lineWidth = Math.max(2, 7 * z);
        c.beginPath(); c.arc(hx, hy, R, 0, 6.2832); c.stroke();
        c.strokeStyle = `rgba(255,226,160,${(0.08 + 0.3 * a).toFixed(3)})`; c.lineWidth = Math.max(1, 2 * z);
        c.setLineDash([Math.max(3, 14 * z), Math.max(5, 28 * z)]); c.beginPath(); c.arc(hx, hy, R + 22 * z, 0, 6.2832); c.stroke(); c.setLineDash([]); // runes lit as dashes
      }
      c.restore();
    }
  }

  drawScreen(c, W, H) {
    if (!this.screen) return;
    c.imageSmoothingEnabled = true;
    c.drawImage(this.screen, 0, 0, W, H);
  }
}

/** Lit fraction per ring band: band k holds the lanterns whose distance from the hub is up to radii[k] (+60 slack) and past the previous ring. Pure. */
export function ringLitFractions(def, litOf, radii) {
  const tot = new Array(radii.length).fill(0), on = new Array(radii.length).fill(0);
  if (!radii.length) return [];
  for (const id of def.list) {
    const n = def.nodes[id]; if (n.teaser) continue;
    const d = Math.hypot(n.x, n.y);
    let k = radii.findIndex((r) => d <= r + 60);
    if (k < 0) k = radii.length - 1;
    tot[k]++; if (litOf(id)) on[k]++;
  }
  return tot.map((t, k) => (t ? on[k] / t : 0));
}
