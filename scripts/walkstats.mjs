// Pure analysis of a walk recording (scripts/walk.mjs). Row: [now, rawDelta, delta, px, py, scrollX, scrollY, zoom, phase, headY, bodyY, headRot, nEnemies, originX].
const DU = 0.211, FEET = 10.9;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const r3 = (v) => +v.toFixed(3);

// steady straight-walk stretches: same x direction for 60+ frames; skip the first 45 frames (camera catch-up) and last 3
export function steadyRuns(f) {
  const runs = []; let s = 1;
  const sign = (i) => Math.sign(f[i][3] - f[i - 1][3]);
  for (let i = 2; i <= f.length; i++) {
    if (i === f.length || sign(i) !== sign(s)) { if (sign(s) !== 0 && i - s > 60) runs.push([s + 45, i - 3]); s = i; }
  }
  return runs;
}

// share of (detrended) energy above `fCut` cycles/frame
export function hfShare(y, fCut) {
  const n = y.length; if (n < 16) return 0; const m = mean(y);
  let tot = 0, hi = 0;
  for (let k = 1; k < n / 2; k++) { let re = 0, im = 0; for (let i = 0; i < n; i++) { const a = (2 * Math.PI * k * i) / n; re += (y[i] - m) * Math.cos(a); im -= (y[i] - m) * Math.sin(a); } const e = re * re + im * im; tot += e; if (k / n > fCut) hi += e; }
  return tot > 0 ? hi / tot : 0;
}

export function countPeaks(y) { let n = 0; for (let i = 1; i < y.length - 1; i++) if (y[i] > y[i - 1] && y[i] >= y[i + 1]) n++; return n; }

export function analyzeWalk(f) {
  const runs = steadyRuns(f);
  const heroD = [], worldE = [], ph = [], jerk = [], speeds = [];
  let hfS = 0, hfN = 0, peaks = 0, steps = 0, headAmp = [];
  for (const [a, b] of runs) {
    const seg = [];
    let vSum = 0, tSum = 0;
    for (let i = a; i <= b; i++) { vSum += f[i][5] - f[i - 1][5]; tSum += f[i][1]; }
    const v = tSum > 0 ? vSum / tSum : 0; // scroll units per ms of display time
    for (let i = a; i <= b; i++) {
      const z = f[i][7], dpx = f[i][3] - f[i - 1][3], dsx = f[i][5] - f[i - 1][5];
      heroD.push((dpx - dsx) * z);
      worldE.push((dsx - v * f[i][1]) * z);
      speeds.push(Math.abs(dpx) / (f[i][2] / 1000 || 1));
      let d = f[i][8] - f[i - 1][8]; if (d < -0.5) d += 1; ph.push(d);
      seg.push(-(f[i][9] - f[i][4] - FEET) / DU); // head height above the soles, du (up = +)
    }
    for (let i = 3; i < seg.length; i++) jerk.push((seg[i] - 3 * seg[i - 1] + 3 * seg[i - 2] - seg[i - 3]) * 216000); // du/s^3 at 60 Hz
    const cyc = mean(ph.slice(-seg.length)); // leg cycles per frame
    if (cyc > 0) { hfS += hfShare(seg, 1.5 * 2 * cyc); hfN++; steps += 2 * cyc * seg.length; peaks += countPeaks(seg); }
    headAmp.push(Math.max(...seg) - Math.min(...seg));
  }
  return {
    runs: runs.length, frames: heroD.length,
    heroJitPx: r3(sd(heroD)), heroMaxPx: r3(Math.max(0, ...heroD.map(Math.abs))),
    worldJitPx: r3(sd(worldE)), worldMaxPx: r3(Math.max(0, ...worldE.map(Math.abs))),
    phaseCV: r3(sd(ph) / (mean(ph) || 1)), speed: +mean(speeds).toFixed(1),
    headPeaksPerStep: r3(steps ? peaks / steps : 0), headJerkRMS_k: +(Math.sqrt(mean(jerk.map((j) => j * j))) / 1000).toFixed(1),
    headHF: r3(hfN ? hfS / hfN : 0), headRangeDu: r3(mean(headAmp)),
  };
}
