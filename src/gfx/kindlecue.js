// KINDLING START cue (tree, LOCKED 2026-11-12): visual only, reads sim.kindleLeft() (1 at the run start -> 0 after its seconds), never writes the sim.
// Restrained by design: a faint ring at the hero's feet in the STARTER weapon's colour that fades with the window, plus a hero flourish:
//   Wren  - her pup leaves a short amber trail (the pup 'runs a step ahead');
//   Elias - his candle crown flares a little brighter (eliasrig reads crownFlare()).
// Calm (reduced motion): no flicker, the trail is shorter and steady. Code-drawn only; no textures, no allocation per frame beyond a fixed ring buffer.
const HEX = /^#[0-9a-f]{6}$/i;
export const KINDLE_TRAIL = 6;

/** Pure: the cue strengths for a remaining fraction `left` (0..1). Anything non-finite is 0 (no cue). */
export function kindleCue(left, calm, t) {
  const k = Number.isFinite(left) ? Math.max(0, Math.min(1, left)) : 0;
  if (k <= 0) return { on: false, ringA: 0, ringR: 0, trailA: 0, trailN: 0, flare: 1 };
  const flick = calm || !Number.isFinite(t) ? 1 : 0.9 + 0.1 * Math.sin(t * 5.3);
  return { on: true, ringA: 0.32 * k * flick, ringR: 15 + 3 * k, trailA: 0.55 * k, trailN: calm ? 3 : KINDLE_TRAIL, flare: 1 + 0.45 * k };
}

/** The starter weapon's colour as a Phaser number (falls back to the warm lantern gold). */
export function kindleTint(data, weaponId) {
  const w = data && data.weapons && typeof weaponId === 'string' && Object.hasOwn(data.weapons, weaponId) ? data.weapons[weaponId] : null;
  const c = w && typeof w.color === 'string' && HEX.test(w.color) ? w.color : '#ffd27a';
  return parseInt(c.slice(1), 16);
}

export class KindleCue {
  constructor() { this.trail = new Float32Array(KINDLE_TRAIL * 2); this.n = 0; this.i = 0; this.acc = 0; }
  /** g = an ADD-blend Graphics cleared this frame; rig = the hero rig (pupX/pupY when it has a pup). */
  draw(g, sim, rig, calm, dt, tint, amber) {
    const left = sim && typeof sim.kindleLeft === 'function' ? sim.kindleLeft() : 0;
    const c = kindleCue(left, calm, sim ? sim.time : 0);
    if (!c.on) { this.n = 0; return c; }
    const p = sim.player;
    g.lineStyle(2, tint, c.ringA).strokeEllipse(p.x, p.y + 9, c.ringR * 2, c.ringR * 0.8);
    if (rig && rig.hasPup && Number.isFinite(rig.pupX)) {
      this.acc += dt;
      if (this.acc >= 0.06) { this.acc = 0; this.trail[this.i * 2] = rig.pupX; this.trail[this.i * 2 + 1] = rig.pupY; this.i = (this.i + 1) % KINDLE_TRAIL; this.n = Math.min(KINDLE_TRAIL, this.n + 1); }
      const m = Math.min(this.n, c.trailN);
      for (let j = 1; j <= m; j++) {
        const q = ((this.i - j) % KINDLE_TRAIL + KINDLE_TRAIL) % KINDLE_TRAIL, f = 1 - (j - 1) / Math.max(1, m);
        g.fillStyle(amber, c.trailA * f).fillCircle(this.trail[q * 2], this.trail[q * 2 + 1] - 2, 1.2 + 1.3 * f);
      }
    }
    return c;
  }
}
