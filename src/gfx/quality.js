// Quality tiers + auto tier selection. Pure JS (no DOM/Phaser) so it is unit-testable.
export const TIERS = ['low', 'med', 'high'];

// Budget (docs/research/11): <=300 particles, FX/bloom on High only.
export const CAPS = {
  low: { ribbon: { lantern: { life: 1.5, pts: 18, w: 11, a: 0.34 }, scarf: { life: 0, pts: 0 }, spirits: { n: 0, life: 0, pts: 0 }, segs: 20 }, particles: 100, halos: 40, gemGlow: 0, trails: 0, dmgNums: 14, vignette: false, lightmap: false, lights: 0, bloom: false, ambient: { total: 2, sway: 0, motes: 0, fireflies: 0, critters: 2, petals: 0, bloom: 0, birds: 4 } },
  med: { ribbon: { lantern: { life: 3.0, pts: 40, w: 13, a: 0.38 }, scarf: { life: 1.0, pts: 14, w: 6, a: 0.24 }, spirits: { n: 6, life: 1.1, pts: 14, w: 11, a: 0.4 }, segs: 260 }, particles: 250, halos: 90, gemGlow: 30, trails: 1, dmgNums: 24, vignette: true, lightmap: true, lights: 40, bloom: false, ambient: { total: 85, sway: 36, motes: 14, fireflies: 10, critters: 3, petals: 4, bloom: 16, birds: 8 } },
  high: { ribbon: { lantern: { life: 4.0, pts: 48, w: 14, a: 0.4, core: true }, scarf: { life: 1.3, pts: 18, w: 6, a: 0.3 }, spirits: { n: 12, life: 1.3, pts: 18, w: 11, a: 0.44 }, segs: 600 }, particles: 300, halos: 160, gemGlow: 60, trails: 2, dmgNums: 24, vignette: true, lightmap: true, lights: 80, bloom: true, ambient: { total: 165, sway: 64, motes: 28, fireflies: 24, critters: 5, petals: 8, bloom: 32, birds: 12 } },
};

const BUCKET_MS = 1000; // 3 one-second buckets = rolling ~3 s window
const DOWN_MS = 20; // avg frame interval above this (<50 fps) -> step down
const DOWN_WORK = 14; // avg CPU work above this -> step down
const UP_MS = 17.5; // holding ~60 fps ...
const UP_WORK = 7; // ... with headroom
const UP_NEED = 8; // consecutive good evaluations (~8 s) before stepping up
const MIN_HOLD = 15000; // ms after any change before stepping up

export class Quality {
  constructor(initial = 'med') {
    this.mode = 'auto';
    this.idx = Math.max(0, TIERS.indexOf(initial));
    this.b = [{ t: 0, w: 0, n: 0 }, { t: 0, w: 0, n: 0 }, { t: 0, w: 0, n: 0 }];
    this.bi = 0;
    this.bAge = 0;
    this.good = 0;
    this.sinceChange = 0;
    this.lock = MIN_HOLD;
    this.avgMs = 0;
    this.avgWork = 0;
  }

  get tier() { return TIERS[this.idx]; }
  get caps() { return CAPS[TIERS[this.idx]]; }

  // Returns true if the effective tier changed.
  setMode(mode) {
    const old = this.idx;
    this.mode = mode === 'low' || mode === 'med' || mode === 'high' ? mode : 'auto';
    if (this.mode !== 'auto') this.idx = TIERS.indexOf(this.mode);
    this.resetWindow();
    return old !== this.idx;
  }

  resetWindow() {
    for (const k of this.b) { k.t = 0; k.w = 0; k.n = 0; }
    this.bAge = 0;
    this.good = 0;
    this.sinceChange = 0;
  }

  // dtMs = frame interval, workMs = CPU time inside the frame. Allocation-free.
  // Returns true if the tier changed this call.
  sample(dtMs, workMs) {
    if (!(dtMs > 0) || dtMs > 250) return false; // ignore hitches / hidden tab
    const k = this.b[this.bi];
    k.t += dtMs;
    k.w += workMs > 0 ? workMs : 0;
    k.n++;
    this.bAge += dtMs;
    this.sinceChange += dtMs;
    if (this.bAge < BUCKET_MS) return false;
    this.bAge = 0;
    let t = 0;
    let w = 0;
    let n = 0;
    for (const x of this.b) { t += x.t; w += x.w; n += x.n; }
    this.bi = (this.bi + 1) % this.b.length;
    const nk = this.b[this.bi];
    nk.t = 0; nk.w = 0; nk.n = 0;
    if (n < 30) return false;
    this.avgMs = t / n;
    this.avgWork = w / n;
    if (this.mode !== 'auto') return false;

    if ((this.avgMs > DOWN_MS || this.avgWork > DOWN_WORK) && this.idx > 0) {
      this.idx--;
      this.afterChange(true);
      return true;
    }
    if (this.avgMs <= UP_MS && this.avgWork <= UP_WORK) this.good++;
    else this.good = 0;
    if (this.good >= UP_NEED && this.sinceChange >= this.lock && this.idx < TIERS.length - 1) {
      this.idx++;
      this.afterChange(false);
      return true;
    }
    return false;
  }

  afterChange(down) {
    this.resetWindow();
    // Back off after a drop so a borderline device does not flip-flop.
    this.lock = down ? Math.min(120000, this.lock * 2) : this.lock;
  }
}
