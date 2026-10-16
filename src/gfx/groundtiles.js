// W1 ground tiles: four code-painted, seamless 1024 px tiles (512 world units, 2 texels/unit), Hollowlight Style v1:
// painted texture + grass/flower detail, tinted (darker-shade) outlines on every tuft/flower/stone, soft value variation.
//   hollowA / restoredA = Take A Meadow Glade   (opening, road, wells, meadow, chapel)
//   hollowB / restoredB = Take B Deep Forest Floor (grove, thicket, graves, map edge)
// Authored at FULL daylight brightness: the lightmap (or the Low tint) multiplies them down for dusk.
// Readability rule (docs/design/ambient-life-v1.md R1, world sheet): ground detail is a quiet decal, <= 18% local
// contrast. Detail colours are chosen to match the base LUMINANCE and differ mainly in hue (rose/lilac/amber vs green),
// so a creature always out-contrasts the flowers. TILE_PX and DETAIL_MAX are asserted in tests/groundtiles.test.mjs and
// the local contrast of the real canvases is measured by scripts/w1.mjs.
export const TILE_PX = 1024;
export const TILE_UNITS = 512;
export const DETAIL_MAX = 0.18;

const TAU = Math.PI * 2;
function rnd(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const shade = (c, k) => [Math.round(c[0] * k), Math.round(c[1] * k * 0.98), Math.min(255, Math.round(c[2] * k * 1.04))]; // darker tinted outline (L2)

// Per-tile drawing kit bound to one canvas. Every draw wraps across the tile edges so the tile is seamless.
function kit(cv, seed) {
  const N = cv.width;
  const c = cv.getContext('2d');
  const r = rnd(seed);
  const wrap = (x, y, pad, fn) => {
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      if (x + dx < -pad || x + dx > N + pad || y + dy < -pad || y + dy > N + pad) continue;
      fn(x + dx, y + dy);
    }
  };
  const blot = (n, rmin, rmax, cols, amin, amax) => {
    for (let i = 0; i < n; i++) {
      const x = r() * N; const y = r() * N; const rad = rmin + r() * (rmax - rmin);
      const col = cols[(r() * cols.length) | 0]; const a = amin + r() * (amax - amin);
      wrap(x, y, rad, (px, py) => {
        const g = c.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, rgb(col, a)); g.addColorStop(0.6, rgb(col, a * 0.5)); g.addColorStop(1, rgb(col, 0));
        c.fillStyle = g; c.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      });
    }
  };
  const ellipse = (x, y, rx, ry, rot, fill, line, lw) => wrap(x, y, Math.max(rx, ry) + 4, (px, py) => {
    c.beginPath(); c.ellipse(px, py, rx, ry, rot, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (line) { c.lineWidth = lw || 1; c.strokeStyle = line; c.stroke(); }
  });
  // tuft: n blades fanning from (x,y), tinted outline stroke under the fill stroke
  const tuft = (x, y, h, n, cols, line, a) => {
    const bl = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const hh = h * (0.7 + r() * 0.5) * (1 - Math.abs(t) * 0.5);
      bl.push([t * 9 + (r() - 0.5) * 2, hh, t * 12 + (r() - 0.5) * 5, cols[(r() * cols.length) | 0]]);
    }
    wrap(x, y, h + 8, (px, py) => {
      c.lineCap = 'round';
      for (const pass of [0, 1]) for (const b of bl) {
        c.strokeStyle = pass === 0 ? rgb(line, a) : rgb(b[3], a);
        c.lineWidth = pass === 0 ? 3.4 : 1.8;
        c.beginPath(); c.moveTo(px + b[0] * 0.3, py); c.quadraticCurveTo(px + b[0] + b[2] * 0.2, py - b[1] * 0.55, px + b[0] + b[2], py - b[1]); c.stroke();
      }
    });
  };
  const flower = (x, y, sz, petal, centre, a) => {
    const rot = r() * TAU;
    wrap(x, y, sz * 2 + 4, (px, py) => {
      const line = shade(petal, 0.7);
      for (const pass of [0, 1]) {
        for (let i = 0; i < 5; i++) {
          const ang = rot + (i / 5) * TAU;
          c.beginPath(); c.ellipse(px + Math.cos(ang) * sz * 0.62, py + Math.sin(ang) * sz * 0.62, sz * 0.52, sz * 0.52, 0, 0, TAU);
          if (pass === 0) { c.lineWidth = 1.3; c.strokeStyle = rgb(line, a); c.stroke(); } else { c.fillStyle = rgb(petal, a); c.fill(); }
        }
      }
      c.beginPath(); c.arc(px, py, sz * 0.34, 0, TAU); c.fillStyle = rgb(centre, a); c.fill();
    });
  };
  const stone = (x, y, rx, ry, col, a) => wrap(x, y, rx + 6, (px, py) => {
    c.beginPath(); c.ellipse(px + 1.5, py + 2.2, rx, ry * 0.9, 0, 0, TAU); c.fillStyle = 'rgba(20,30,40,' + 0.16 * a + ')'; c.fill(); // soft contact shadow
    c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, TAU); c.fillStyle = rgb(col, a); c.fill();
    c.lineWidth = 1.4; c.strokeStyle = rgb(shade(col, 0.72), a); c.stroke();
    c.beginPath(); c.ellipse(px - rx * 0.25, py - ry * 0.3, rx * 0.5, ry * 0.35, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,' + 0.1 * a + ')'; c.fill(); // rim light
  });
  // root / branch: a wavy stroke with a tinted outline and a thin light edge on top
  const root = (x, y, len, w, col, a) => {
    const ang = r() * TAU; const wob = (r() - 0.5) * 0.9;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; const aa = ang + Math.sin(t * 3 + wob * 6) * 0.35 + wob * t; pts.push([Math.cos(aa) * len * t, Math.sin(aa) * len * t]); }
    wrap(x, y, len + 10, (px, py) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const pass of [0, 1, 2]) {
        const oy = pass === 2 ? -w * 0.25 : 0;
        c.beginPath(); c.moveTo(px + pts[0][0], py + pts[0][1] + oy);
        for (let i = 1; i < pts.length; i++) c.lineTo(px + pts[i][0], py + pts[i][1] + oy);
        if (pass === 0) { c.lineWidth = w + 2.4; c.strokeStyle = rgb(shade(col, 0.78), a * 0.8); } else if (pass === 1) { c.lineWidth = w; c.strokeStyle = rgb(col, a); } else { c.lineWidth = Math.max(1, w * 0.28); c.strokeStyle = 'rgba(255,255,255,' + 0.1 * a + ')'; }
        c.stroke();
      }
    });
  };
  const grain = (amp) => {
    const id = c.getImageData(0, 0, N, N); const d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.1; }
    c.putImageData(id, 0, 0);
  };
  return { c, r, N, wrap, blot, ellipse, tuft, flower, stone, root, grain, fill: (col) => { c.fillStyle = rgb(col); c.fillRect(0, 0, N, N); } };
}

// A, Hollow: blue-grey drained meadow: dead pale tufts with grey outline, grey buds, faint cracks. Stays still and quiet.
export function drawHollowA(cv) {
  const k = kit(cv, 101); const { c, r, N } = k;
  k.fill([138, 152, 171]);
  k.blot(46, 90, 230, [[116, 130, 152], [158, 170, 188], [128, 142, 164]], 0.28, 0.55);
  k.blot(22, 60, 150, [[176, 186, 200]], 0.1, 0.2);
  const dead = [[168, 178, 194], [152, 164, 182], [178, 186, 200]];
  const line = [100, 112, 134];
  for (let i = 0; i < 150; i++) k.tuft(r() * N, r() * N, 9 + r() * 11, 3 + ((r() * 3) | 0), dead, line, 0.5);
  for (let i = 0; i < 46; i++) { // grey buds: small closed blooms on thin stems, no colour
    const x = r() * N; const y = r() * N; const h = 9 + r() * 7;
    k.wrap(x, y, 20, (px, py) => {
      c.lineCap = 'round'; c.strokeStyle = rgb(line, 0.55); c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py); c.lineTo(px + 1, py - h); c.stroke();
      c.beginPath(); c.arc(px + 1, py - h, 2.7, 0, TAU); c.fillStyle = rgb([176, 184, 198], 0.7); c.fill(); c.lineWidth = 1.1; c.strokeStyle = rgb(line, 0.6); c.stroke();
    });
  }
  c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { // faint hairline cracks
    const x = r() * N; const y = r() * N; const a = r() * TAU; const len = 40 + r() * 70;
    k.wrap(x, y, len + 10, (px, py) => { c.strokeStyle = 'rgba(86,98,120,0.16)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + Math.cos(a + 0.6) * len * 0.5, py + Math.sin(a + 0.6) * len * 0.5, px + Math.cos(a) * len, py + Math.sin(a) * len); c.stroke(); });
  }
  for (let i = 0; i < 9; i++) k.stone(r() * N, r() * N, 7 + r() * 6, 5 + r() * 4, [150, 160, 178], 0.7);
  k.grain(6);
  return cv;
}

// A, Restored: sunlit meadow: painted lawn, tufts with tinted outlines, small flower drifts (hue-contrast, not value), pebbles.
export function drawRestoredA(cv) {
  const k = kit(cv, 202); const { r, N } = k;
  k.fill([116, 186, 92]);
  k.blot(46, 90, 230, [[140, 206, 106], [92, 160, 76], [124, 190, 94]], 0.3, 0.55);
  k.blot(18, 70, 160, [[176, 204, 104]], 0.12, 0.24); // warm sun patches
  k.blot(14, 70, 150, [[70, 130, 70]], 0.1, 0.2); // cool shade
  const blade = [[92, 156, 72], [140, 204, 98], [74, 134, 66]];
  const line = [58, 108, 54];
  for (let i = 0; i < 230; i++) k.tuft(r() * N, r() * N, 10 + r() * 14, 3 + ((r() * 4) | 0), blade, line, 0.4);
  const flowers = [[[214, 124, 142], [226, 205, 140]], [[172, 142, 204], [226, 205, 140]], [[206, 184, 96], [150, 120, 70]], [[200, 148, 150], [226, 205, 140]]];
  for (let d = 0; d < 20; d++) { // drifts: 4-8 flowers in a loose cluster
    const cx = r() * N; const cy = r() * N; const cnt = 4 + ((r() * 5) | 0); const f = flowers[(r() * flowers.length) | 0];
    for (let i = 0; i < cnt; i++) {
      const a = r() * TAU; const rr = r() * 52;
      k.flower(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8, 4.2 + r() * 2.6, f[0], f[1], 0.68);
    }
  }
  for (let i = 0; i < 10; i++) k.stone(r() * N, r() * N, 6 + r() * 6, 4.5 + r() * 3.5, [148, 176, 136], 0.7);
  k.grain(6);
  return cv;
}

// B, Hollow: slate floor: grey leaf litter, dark roots, grey fern strokes. A little darker than A.
export function drawHollowB(cv) {
  const k = kit(cv, 303); const { r, N } = k;
  k.fill([98, 112, 130]);
  k.blot(46, 90, 230, [[84, 98, 118], [114, 126, 144], [92, 106, 124]], 0.3, 0.55);
  k.blot(16, 70, 160, [[130, 142, 158]], 0.1, 0.18);
  for (let i = 0; i < 280; i++) { // grey litter, leaf-shaped ellipses, a notch lighter or darker than the floor
    const lt = r() < 0.5;
    k.ellipse(r() * N, r() * N, 5 + r() * 4, 2.4 + r() * 1.6, r() * TAU, rgb(lt ? [112, 124, 142] : [86, 100, 118], 0.55), rgb([76, 88, 106], 0.3), 1);
  }
  for (let i = 0; i < 14; i++) k.root(r() * N, r() * N, 60 + r() * 110, 4 + r() * 3, [82, 94, 112], 0.8);
  const fern = [[112, 126, 146], [96, 110, 130]];
  for (let i = 0; i < 40; i++) k.tuft(r() * N, r() * N, 12 + r() * 10, 5, fern, [66, 78, 98], 0.45);
  for (let i = 0; i < 8; i++) k.stone(r() * N, r() * N, 7 + r() * 6, 5 + r() * 4, [118, 130, 148], 0.7);
  k.grain(6);
  return cv;
}

// B, Restored: living forest floor: moss, amber/rust litter (luminance matched), ferns, brown roots, soft dapple light.
export function drawRestoredB(cv) {
  const k = kit(cv, 404); const { r, N } = k;
  k.fill([80, 124, 72]);
  k.blot(46, 90, 230, [[98, 148, 84], [62, 102, 62], [86, 132, 76]], 0.3, 0.55);
  k.blot(22, 120, 240, [[170, 204, 120]], 0.07, 0.14); // dapples
  for (let i = 0; i < 300; i++) {
    const hue = r(); const col = hue < 0.45 ? [164, 116, 64] : hue < 0.8 ? [150, 96, 62] : [128, 128, 66];
    k.ellipse(r() * N, r() * N, 5 + r() * 4, 2.4 + r() * 1.6, r() * TAU, rgb(col, 0.66), rgb(shade(col, 0.72), 0.4), 1);
  }
  for (let i = 0; i < 14; i++) k.root(r() * N, r() * N, 60 + r() * 110, 4 + r() * 3, [108, 90, 62], 0.8);
  const fern = [[96, 158, 82], [70, 124, 66], [118, 176, 92]];
  for (let i = 0; i < 56; i++) k.tuft(r() * N, r() * N, 13 + r() * 12, 5 + ((r() * 3) | 0), fern, [50, 92, 52], 0.55);
  for (let i = 0; i < 8; i++) k.stone(r() * N, r() * N, 7 + r() * 6, 5 + r() * 4, [124, 146, 112], 0.7);
  k.grain(6);
  return cv;
}

// Local-contrast probe used by scripts/w1.mjs: for each (sampled) pixel, |L - mean of the surrounding (2R+1)^2 box| / that
// mean; returns the given percentile (0..1). RGBA data (Uint8ClampedArray), n x n. Box mean via a summed-area table.
export function detailContrast(data, n, R = 12, pct = 0.99) {
  const L = new Float32Array(n * n);
  for (let i = 0, j = 0; i < L.length; i++, j += 4) L[i] = 0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2];
  const W = n + 1; const S = new Float64Array(W * W);
  for (let y = 0; y < n; y++) { let row = 0; for (let x = 0; x < n; x++) { row += L[y * n + x]; S[(y + 1) * W + x + 1] = S[y * W + x + 1] + row; } }
  const bins = new Uint32Array(1001); let cnt = 0;
  for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x += 2) {
    const x0 = Math.max(0, x - R); const x1 = Math.min(n, x + R + 1); const y0 = Math.max(0, y - R); const y1 = Math.min(n, y + R + 1);
    const m = (S[y1 * W + x1] - S[y0 * W + x1] - S[y1 * W + x0] + S[y0 * W + x0]) / ((x1 - x0) * (y1 - y0));
    const v = m > 0 ? Math.abs(L[y * n + x] - m) / m : 0;
    bins[Math.min(1000, (v * 1000) | 0)]++; cnt++;
  }
  let acc = 0;
  for (let b = 0; b <= 1000; b++) { acc += bins[b]; if (acc >= cnt * pct) return b / 1000; }
  return 1;
}

export const TILE_DRAW = { hollowA: drawHollowA, restoredA: drawRestoredA, hollowB: drawHollowB, restoredB: drawRestoredB };
