// E6 MINIMAP "Lantern Pool" (docs/design/minimap-v1.md, option A). Render/UI only: reads sim.player, sim.sites, sim.boss / sim.mini and the
// render-side life map; never writes any of them. One small DOM canvas (decorative: aria-hidden, pointer-events none), one 64x64 offscreen canvas.
// No markup is built from data. The life layer is repainted ~2 Hz, the hero dot every frame (only when something moved).
export const MM_GRID = 64; // life layer resolution (averaged from the 256 map)
export const MM_PX = 128; // backing store of the visible canvas (shown at ~64-96 css px)
const REPAINT = 0.5; // s between life-layer repaints (~2 Hz)
const PULSE_S = 0.9; // the boss ring pulses once on arrival

/** Settings.miniMap ('auto' | 'on' | 'off', anything else = auto) + phone flag -> shown or not. */
export function mapOn(setting, phone) {
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return !phone;
}

/** world coordinate -> canvas pixel inside the disc (the whole world spans the diameter; markers are held inside the rim). */
export function toDisc(x, y, world, size = MM_PX, pad = 0.06) {
  const half = size / 2;
  let dx = (Number.isFinite(x) ? x / world : 0.5) * size - half;
  let dy = (Number.isFinite(y) ? y / world : 0.5) * size - half;
  const lim = half * (1 - pad), d = Math.hypot(dx, dy);
  if (d > lim) { dx *= lim / d; dy *= lim / d; }
  return { x: half + dx, y: half + dy };
}

/** Average a life-map Float32 grid (n x n) into g x g bytes (0..255). Pure; out is reused. */
export function downsample(life, n, g, out) {
  const k = Math.max(1, Math.floor(n / g));
  for (let j = 0; j < g; j++) {
    for (let i = 0; i < g; i++) {
      let s = 0;
      for (let b = 0; b < k; b++) { const row = (j * k + b) * n + i * k; for (let a = 0; a < k; a++) s += life[row + a]; }
      const v = s / (k * k);
      out[j * g + i] = v <= 0 ? 0 : v >= 1 ? 255 : (v * 255 + 0.5) | 0;
    }
  }
  return out;
}

// colours: warm lantern gold on a cool grey-blue Hollow (docs/IDENTITY.md); rose = boss / miniboss (hud role colour)
const COL = { gold: '#ffd36b', cream: '#fff3dc', lamp: '#f0b050', warm: '#e9b25a', lilac: '#b9a4ff', rose: '#ff7a8a' };

export class Minimap {
  constructor(doc, host) {
    this.doc = doc;
    this.root = doc.createElement('div');
    this.root.className = 'h-mini';
    this.root.setAttribute('aria-hidden', 'true');
    this.cv = doc.createElement('canvas');
    this.cv.width = this.cv.height = MM_PX;
    this.root.appendChild(this.cv);
    host.appendChild(this.root);
    this.ctx = this.cv.getContext ? this.cv.getContext('2d') : null;
    this.off = doc.createElement('canvas');
    this.off.width = this.off.height = MM_GRID;
    this.octx = this.off.getContext ? this.off.getContext('2d') : null;
    this.img = this.octx && this.octx.createImageData ? this.octx.createImageData(MM_GRID, MM_GRID) : null;
    this.cells = new Uint8Array(MM_GRID * MM_GRID);
    this.reset();
  }

  reset() {
    this.shown = false; this.root.classList.remove('on');
    this.acc = REPAINT; this.t = 0; this.last = '';
    this.bossT = -1; this.hadBoss = false;
  }

  setShown(on) {
    if (this.shown === on) return;
    this.shown = on; this.root.classList.toggle('on', on);
    this.last = ''; // repaint on the next show
    if (on) this.acc = REPAINT;
  }

  // life layer: grey-blue Hollow with warm gold where the ground is restored (skipped on Low: dots only)
  paintLife(life, low) {
    const o = this.octx, im = this.img;
    if (!o || !im) return;
    const d = im.data, c = this.cells, N = MM_GRID * MM_GRID;
    if (low || !life || !life.life) { for (let i = 0; i < N; i++) { const k = i * 4; d[k] = 34; d[k + 1] = 42; d[k + 2] = 54; d[k + 3] = 255; } }
    else {
      downsample(life.life, life.n, MM_GRID, c);
      for (let i = 0; i < N; i++) {
        const v = c[i] / 255, k = i * 4;
        d[k] = 34 + (255 - 34) * v * 0.92 | 0; d[k + 1] = 42 + (200 - 42) * v * 0.9 | 0; d[k + 2] = 54 + (110 - 54) * v * 0.75 | 0; d[k + 3] = 255;
      }
    }
    o.putImageData(im, 0, 0);
  }

  // ctx: { on, life, low, calm, world }. Cheap when hidden. dt in seconds.
  frame(sim, dt, cfg) {
    const show = !!(cfg && cfg.on && sim && sim.player);
    this.setShown(show);
    if (!show || !this.ctx) return;
    const world = cfg.world || 4000, low = !!cfg.low, calm = !!cfg.calm;
    this.t += dt; this.acc += dt;
    let repaint = false;
    if (this.acc >= REPAINT) { this.acc = 0; this.paintLife(cfg.life, low); repaint = true; }
    const b = (sim.boss && !sim.boss.dead ? sim.boss : null) || (sim.mini && !sim.mini.dead ? sim.mini : null);
    if (b && !this.hadBoss) this.bossT = calm ? PULSE_S : 0;
    this.hadBoss = !!b;
    if (this.bossT >= 0 && this.bossT < PULSE_S && !calm) { this.bossT += dt; repaint = true; }
    const p = sim.player, S = sim.sites, g = this.ctx, H = MM_PX / 2;
    // cheap change key: skip the redraw when nothing visible moved (hero ~0.5 px, markers by state)
    const hp = toDisc(p.x, p.y, world);
    let key = `${hp.x | 0},${hp.y | 0}`;
    if (S) for (const s of S.list) if (s.state !== 'sleep') key += `|${s.id}${s.state}${s.lit | 0}`;
    if (b) key += `|b${b.x | 0},${b.y | 0}`;
    if (!repaint && key === this.last) return;
    this.last = key;
    g.clearRect(0, 0, MM_PX, MM_PX);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.off, 0, 0, MM_PX, MM_PX);
    if (S) this.drawSites(g, S, world, low);
    if (b) this.drawBoss(g, b, world, calm);
    this.drawHero(g, hp, low);
    void H;
  }

  drawSites(g, S, world, low) {
    for (const s of S.list) {
      const st = s.state;
      if (st === 'sleep' || st === 'gone' || st === 'failed') continue; // fog: undiscovered / lost sites are not drawn
      if (s.kind === 'road' && s.lanterns) {
        const lit = s.lanterns.filter((L) => L.lit);
        if (lit.length > 1 || st === 'done') { // the lit Lantern Road: a thin gold line through the lit lanterns
          g.strokeStyle = COL.gold; g.lineWidth = 2; g.globalAlpha = 0.9; g.beginPath();
          const pts = st === 'done' ? s.lanterns : lit;
          pts.forEach((L, i) => { const q = toDisc(L.x, L.y, world); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); });
          g.stroke(); g.globalAlpha = 1;
        }
      }
      const q = toDisc(s.x, s.y, world);
      if (st === 'done') { g.fillStyle = COL.warm; g.beginPath(); g.arc(q.x, q.y, 3, 0, 6.2832); g.fill(); continue; }
      // awake / active / fight / calm: a small badge dot in the site's own shape (lamp = circle, road = diamond, knot = triangle)
      if (!low) { g.fillStyle = 'rgba(255, 211, 107, .28)'; g.beginPath(); g.arc(q.x, q.y, 7, 0, 6.2832); g.fill(); }
      g.fillStyle = s.kind === 'knot' ? COL.lilac : s.kind === 'road' ? COL.gold : COL.lamp;
      g.beginPath();
      if (s.kind === 'road') { g.moveTo(q.x, q.y - 4.5); g.lineTo(q.x + 4.5, q.y); g.lineTo(q.x, q.y + 4.5); g.lineTo(q.x - 4.5, q.y); g.closePath(); }
      else if (s.kind === 'knot') { g.moveTo(q.x, q.y - 4.8); g.lineTo(q.x + 4.4, q.y + 3.4); g.lineTo(q.x - 4.4, q.y + 3.4); g.closePath(); }
      else g.arc(q.x, q.y, 3.2, 0, 6.2832);
      g.fill();
      g.strokeStyle = 'rgba(20, 14, 10, .85)'; g.lineWidth = 1; g.stroke();
    }
  }

  drawBoss(g, b, world, calm) {
    const q = toDisc(b.x, b.y, world);
    g.strokeStyle = COL.rose; g.lineWidth = 2.4;
    g.beginPath(); g.arc(q.x, q.y, 6, 0, 6.2832); g.stroke();
    if (!calm && this.bossT >= 0 && this.bossT < PULSE_S) { // one pulse on arrival, then still
      const k = this.bossT / PULSE_S;
      g.globalAlpha = 1 - k; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 6 + 18 * k, 0, 6.2832); g.stroke(); g.globalAlpha = 1;
    }
  }

  drawHero(g, q, low) {
    if (!low) { g.fillStyle = 'rgba(255, 233, 180, .35)'; g.beginPath(); g.arc(q.x, q.y, 8, 0, 6.2832); g.fill(); }
    g.fillStyle = COL.cream; g.beginPath(); g.arc(q.x, q.y, 4.6, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(20, 14, 10, .9)'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = COL.cream; g.lineWidth = 1.2; g.beginPath(); g.arc(q.x, q.y, 7, 0, 6.2832); g.stroke(); // ring: the hero reads apart from the amber site dots
  }
}
