// The Tracker (Wren's bonded ghost-wolf pup): THREE look options, drawn with the REAL Wren rig helpers (real-rigs.js = src/gfx/wrenart.js):
// same design units as Wren (122 du = feet to ear tips, 1 du = 0.211 world units), L2 tinted outline (shape(): ink = fill mixed 70% to #2a0f30),
// H2 diagonal gradient + lower-right rim crescent, P1 chibi. Origin = ground under the paws, faces +x. Sandbox only: NOT game code.
'use strict';
window.PUP = (() => {
  const { shape, S, E, C, CAP, stroke, fillP, glowAt, dot, ell, mix } = RIGS.wren;
  const F = (n) => (+n).toFixed(2);
  const INK = '#2a0f30';
  const TAU = Math.PI * 2;
  const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  // ---- path helpers --------------------------------------------------------------------------------------------------------------
  // closed outline through points; a point [x,y,1] is a sharp corner (fur tuft tip), others are smoothed (quadratic through midpoints)
  function outline(pts) {
    const n = pts.length; const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let p = mid(pts[n - 1], pts[0]); let d = `M${F(p[0])} ${F(p[1])}`;
    for (let i = 0; i < n; i++) {
      const v = pts[i]; const m = mid(v, pts[(i + 1) % n]);
      d += v[2] ? ` L${F(v[0])} ${F(v[1])} L${F(m[0])} ${F(m[1])}` : ` Q${F(v[0])} ${F(v[1])} ${F(m[0])} ${F(m[1])}`;
    }
    return d + 'Z';
  }
  // fur tufts between a and b (clockwise outline => outward normal = (dy,-dx)); n tufts, depth h; returns points incl. a, excl. b
  function jag(a, b, n, h, lean = 0.25) {
    const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; const nx = dy / l; const ny = -dx / l;
    const out = [[a[0], a[1]]];
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.5 + lean) / n; const t1 = (i + 1) / n;
      out.push([a[0] + dx * t0 + nx * h, a[1] + dy * t0 + ny * h, 1]);
      if (i < n - 1) out.push([a[0] + dx * t1 - nx * h * 0.15, a[1] + dy * t1 - ny * h * 0.15]);
    }
    return out;
  }
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const bz = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };
  // tapered ribbon along a cubic (tail, spirit trail): returns S() shape
  function taper(p, wf, n = 20) {
    const L = []; const R = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n; const q = bz(p, t); const a = bz(p, Math.max(0, t - 0.02)); const b = bz(p, Math.min(1, t + 0.02));
      const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; const w = wf(t);
      L.push([q[0] - (dy / l) * w, q[1] + (dx / l) * w]); R.push([q[0] + (dy / l) * w, q[1] - (dx / l) * w]);
    }
    return L.concat(R.reverse());
  }

  // ---- palettes (moon-blue wolf-light family = the retired Lantern-Heart wolves: c #c4e9ff, dk #8cc3ee, glow #9fd8ff) --------------
  const PP = {
    A: { name: 'A Lantern Scruff', short: 'Scruff', fur: '#bcdcf4', saddle: '#7fa4d0', light: '#eef8ff', inner: '#a9c2e4', nose: '#26304a', eye: '#1b2740', tip: '#ffb84a', tipHot: '#ffe2a0', glow: '#9fd8ff' },
    B: { name: 'B Wisp Runner', short: 'Wisp', fur: '#cbe6fc', saddle: '#a6cdee', light: '#ffffff', inner: '#cfe6fb', nose: '#26304a', eye: '#1b2740', bone: '#efe4cc', bell: '#ffb84a', glow: '#9fd8ff' },
    C: { name: 'C Bigpaw', short: 'Bigpaw', fur: '#c6dcef', saddle: '#89acd2', light: '#f2f8ff', inner: '#a9c2e4', nose: '#26304a', eye: '#1b2740', pad: '#5a7598', scarf: '#3a5a7c', stitch: '#ffb84a', glow: '#9fd8ff' },
  };
  // body plans: genuinely different silhouettes (du). L = shoulder-to-hip, cr/hr chest/hip radii, leg length + width, paw, head radius, muzzle length
  const CFG = {
    A: { L: 27, cr: 10.5, hr: 9.5, leg: 13, lw: 3.4, paw: 4.2, R: 14.5, mz: 1.05, ear: 1.0, earW: 0.62, tufts: true },
    B: { L: 30, cr: 9.5, hr: 7, leg: 15.5, lw: 2.7, paw: 3.4, R: 13, mz: 1.25, ear: 1.12, earW: 0.5, tufts: false },
    C: { L: 17, cr: 13, hr: 12, leg: 9.5, lw: 4.6, paw: 6.4, R: 17.5, mz: 0.85, ear: 0.92, earW: 0.52, tufts: false },
  };
  const POSES = ['idle', 'trot', 'dart', 'bite', 'howl'];

  // ---- pose solver: joints (du) for a pose at time t ------------------------------------------------------------------------------
  function solve(V, pose, t) {
    const G = CFG[V]; const { L, cr, hr, leg, R } = G;
    const o = { ears: 0, mouth: 0, eyes: 1, tailA: 0, lean: 0, stretch: 1, motes: 0 };
    const sitH = leg + cr * 0.7;
    if (pose === 'idle' || pose === 'howl') {
      const howl = pose === 'howl';
      o.sit = true;
      o.hip = [-L * 0.32, -hr * 0.95];
      o.sh = [L * 0.22, -sitH - cr * 0.35];
      o.head = [L * 0.3 + R * 0.12, o.sh[1] - cr * 0.55 - R * 0.75]; o.headA = howl ? -0.95 : Math.sin(t * 1.3) * 0.06 + (Math.sin(t * 0.4) > 0.85 ? 0.18 : 0);
      o.feet = [[L * 0.36, 0], [L * 0.2, 0], [-L * 0.02, 0], [-L * 0.16, 0]];
      o.tailRoot = [-L * 0.32 - hr * 0.7, -hr * 0.5]; o.tailA = howl ? 0.15 : Math.sin(t * 5) * 0.25;
      o.ears = howl ? -0.45 : (Math.sin(t * 0.9 + 1) > 0.9 ? -0.25 : 0);
      o.eyes = howl ? 0 : (t % 3.2 < 0.12 ? 0 : 1);
      o.mouth = howl ? 0.75 + Math.sin(t * 6) * 0.08 : 0;
      o.howl = howl;
      return o;
    }
    if (pose === 'trot') {
      const ph = (t * 2.6) % 1; const s = Math.sin(ph * TAU); const bob = -Math.abs(Math.cos(ph * TAU)) * 1.8;
      const by = -leg * 0.72 - cr * 0.62 + bob;
      o.hip = [-L / 2, by + 1]; o.sh = [L / 2, by - 1];
      o.head = [L / 2 + R * 0.62, by - cr * 0.55 - R * 0.55]; o.headA = Math.sin(ph * TAU * 2) * 0.04;
      const sw = leg * 0.55; const lift = leg * 0.35;
      const f = (x, phase) => { const q = Math.sin(ph * TAU + phase); return [x + sw * q, -Math.max(0, Math.cos(ph * TAU + phase)) * lift * (q > 0 ? 1 : 0.3)]; };
      o.feet = [f(L / 2 + 1, 0), f(L / 2 - 1, Math.PI), f(-L / 2, Math.PI), f(-L / 2 + 1, 0)];
      o.tailRoot = [-L / 2 - hr * 0.8, by - hr * 0.3]; o.tailA = 0.2 + s * 0.12;
      o.mouth = 0.18; o.motes = 0.6;
      return o;
    }
    if (pose === 'dart') {
      // gallop extension: body long and low, forelegs reaching, hind legs pushing back, ears pinned, tail streaming
      const ph = (t * 4) % 1; const k = Math.sin(ph * TAU);
      const by = -leg * 1.05 - cr * 0.45 + k * 1.2;
      o.stretch = 1.18;
      o.hip = [-L * 0.6, by + 1.5]; o.sh = [L * 0.6, by];
      o.head = [L * 0.6 + R * 0.95, by - cr * 0.2 - R * 0.55]; o.headA = 0.12;
      const reach = leg * (0.9 + 0.25 * k);
      o.feet = [[L * 0.6 + reach, -leg * 0.62], [L * 0.6 + reach * 0.8, -leg * 0.5], [-L * 0.6 - reach, -leg * 0.42], [-L * 0.6 - reach * 0.85, -leg * 0.3]];
      o.tailRoot = [-L * 0.6 - hr * 0.8, by - hr * 0.2]; o.tailA = 0.95;
      o.ears = -0.85; o.mouth = 0.25; o.motes = 1; o.speed = true;
      return o;
    }
    // bite: braced, head thrust forward-down, jaws snap open/shut (0.35 s cycle)
    const ph = (t / 0.35) % 1; const open = ph < 0.55 ? sm(ph / 0.55) : 1 - sm((ph - 0.55) / 0.2);
    const by = -leg * 0.66 - cr * 0.62;
    o.hip = [-L * 0.5, by - 2.5]; o.sh = [L * 0.45, by + 1.5];
    o.head = [L * 0.45 + R * 1.0 + open * 2.5, by + cr * 0.05 - R * 0.35]; o.headA = 0.22 - open * 0.12;
    o.feet = [[L * 0.45 + leg * 0.75, 0], [L * 0.45 + leg * 0.45, 0], [-L * 0.5 - leg * 0.15, 0], [-L * 0.5 + leg * 0.15, 0]];
    o.tailRoot = [-L * 0.5 - hr * 0.8, by - hr * 0.5]; o.tailA = -0.35;
    o.ears = -0.35; o.mouth = 0.15 + open * 0.95; o.snap = open; o.bite = true;
    return o;
  }

  // ---- parts ---------------------------------------------------------------------------------------------------------------------
  // leg: capsule from joint to foot + paw (near legs lighter). sit-hind = folded haunch drawn by the body
  function leg(c, V, P, j, f, near, w) {
    const G = CFG[V]; const col = near ? P.fur : mix(P.fur, P.saddle, 0.55);
    shapeK(c, 2, (k) => CAP(j[0] * k, j[1] * k, f[0] * k, (f[1] - G.paw * 0.4) * k, G.lw * (w || 1) * k, G.lw * 0.85 * (w || 1) * k), col, { w: 0.5 });
    const pr = G.paw;
    shapeK(c, 2, (k) => E((f[0] + pr * 0.35) * k, (f[1] - pr * 0.42) * k, pr * k, pr * 0.62 * k), near ? P.light : mix(P.light, P.saddle, 0.45), { w: 0.45, x: V === 'C' ? (k) => { for (const q of [-0.45, 0, 0.45]) stroke(k, `M${F(f[0] + pr * (0.6 + q * 0.7))} ${F(f[1] - pr * 0.05)} l0 ${F(-pr * 0.42)}`, mix(P.light, INK, 0.45), 0.7, { a: 0.8 }); } : null });
  }

  function tail(c, V, P, o, t) {
    const [x, y] = o.tailRoot; const a = o.tailA; const G = CFG[V];
    if (V === 'B') return; // B's tail is the spirit trail (drawn separately)
    // wolf tail: bushy, hangs LOW / streams straight back (never curled over the back like a dog)
    const len = V === 'C' ? 21 : 27; const wav = Math.sin(t * 7) * (o.sit ? 0 : 1.5);
    let p;
    if (o.sit) p = [x, y, x - 8, y + 4, x - len * 0.7, y + 6 - a * 6, x - len * 0.95, y + 3 - a * 10];
    else { const [dx, dy] = rot(-len, 0, -a * 0.55); p = [x, y, x + dx * 0.35, y + dy * 0.35 - 3, x + dx * 0.7, y + dy * 0.7 + wav, x + dx, y + dy + wav]; }
    const wmax = V === 'C' ? 6.4 : 5.4;
    const pts = taper(p, (u) => (u < 0.15 ? 2.6 + u * 18 : wmax * (1 - Math.pow(Math.max(0, u - 0.55) / 0.45, 1.6) * 0.75)) + (u > 0.97 ? -1 : 0), 14);
    const tp = pts.map((q, i) => (V === 'A' && i % 3 === 1 && i > 3 && i < pts.length - 3 ? [q[0], q[1], 1] : q));
    shape(c, S(outline(tp)), mix(P.fur, P.saddle, 0.35), { w: 0.6, x: (k) => {
      const end = bz(p, 1); const e2 = bz(p, 0.8);
      if (V === 'A') { fillP(k, `M${F(e2[0])} ${F(e2[1] - 7)} L${F(end[0] - 5)} ${F(end[1] - 7)} L${F(end[0] - 5)} ${F(end[1] + 7)} L${F(e2[0])} ${F(e2[1] + 7)}Z`, P.light, 0.9); } else fillP(k, `M${F(e2[0])} ${F(e2[1] - 7)} L${F(end[0] - 5)} ${F(end[1] - 7)} L${F(end[0] - 5)} ${F(end[1] + 7)} L${F(e2[0])} ${F(e2[1] + 7)}Z`, P.light, 0.9);
      stroke(k, `M${F(p[0])} ${F(p[1] - 1)} C${F(p[2])} ${F(p[3] - 1.5)} ${F(p[4])} ${F(p[5] - 1.5)} ${F(e2[0])} ${F(e2[1] - 1.5)}`, P.saddle, 1.6, { a: 0.6 });
    } });
    if (V === 'A') { const end = bz(p, 0.96); glowAt(c, end[0], end[1], 11, P.tip, 0.85); dot(c, end[0], end[1], 2.8, P.tip); dot(c, end[0] - 0.4, end[1] - 0.5, 1.3, '#fff4c8'); }
    void G;
  }

  // small parts drawn at k x resolution so Wren's fixed rim offset (2.8 du) stays proportionate on thin legs / ears (outline width unchanged)
  const shapeK = (c, k, mk, col, o = {}) => { c.save(); c.scale(1 / k, 1 / k); shape(c, mk(k), col, { ...o, w: (o.w ?? 1) * k, x: o.x ? (q) => { q.save(); q.scale(k, k); o.x(q); q.restore(); } : null }); c.restore(); };
  function fadeLayer(c, x0, x1, fn) {
    const cv = c.canvas; const off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height; const o = off.getContext('2d');
    o.setTransform(c.getTransform()); fn(o);
    o.globalCompositeOperation = 'destination-in'; const g = o.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    o.fillStyle = g; o.fillRect(-400, -400, 800, 800);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(off, 0, 0); c.restore();
  }
  // head at its centre, facing +x. o: ears (rad, - = pinned back), mouth 0..1, eyes 1 open / 0 closed
  function head(c, V, P, o, t) {
    const G = CFG[V]; const R = G.R; const mz = G.mz;
    const ear = (bx, by, h, wb, lean, col, inner, near) => {
      c.save(); c.translate(bx, by); c.rotate(o.ears + lean);
      const fold = V === 'C' && near && !o.speed && !o.howl; // Bigpaw: the near ear tip still soft and folded (puppy)
      const d = (k) => S(fold
        ? `M${F(-wb * k)} 0 Q${F(-wb * 0.85 * k)} ${F(-h * 0.62 * k)} ${F(-wb * 0.15 * k)} ${F(-h * 0.9 * k)} Q${F(wb * 0.45 * k)} ${F(-h * 1.0 * k)} ${F(wb * 0.95 * k)} ${F(-h * 0.66 * k)} Q${F(wb * 0.95 * k)} ${F(-h * 0.3 * k)} ${F(wb * k)} 0Z`
        : `M${F(-wb * k)} 0 Q${F(-wb * 0.8 * k)} ${F(-h * 0.6 * k)} ${F(-wb * 0.2 * k)} ${F(-h * 0.97 * k)} Q${F(0)} ${F(-h * 1.04 * k)} ${F(wb * 0.18 * k)} ${F(-h * 0.95 * k)} Q${F(wb * 0.65 * k)} ${F(-h * 0.5 * k)} ${F(wb * k)} 0Z`);
      shapeK(c, 2, d, col, { w: 0.55, x: (k) => {
        if (inner) {
          fillP(k, `M${F(-wb * 0.55)} 1 Q${F(-wb * 0.45)} ${F(-h * 0.45)} ${F(-wb * 0.12)} ${F(-h * 0.78)} Q${F(wb * 0.3)} ${F(-h * 0.42)} ${F(wb * 0.5)} 1Z`, inner, 0.95);
          for (const q of [-0.25, 0.05, 0.3]) stroke(k, `M${F(wb * q)} 0 l${F(-wb * 0.12)} ${F(-h * 0.3)}`, P.light, 1, { a: 0.9 });
        }
        if (fold) fillP(k, `M${F(-wb * 0.15)} ${F(-h * 0.9)} Q${F(wb * 0.45)} ${F(-h * 1.0)} ${F(wb * 0.95)} ${F(-h * 0.66)} Q${F(wb * 0.3)} ${F(-h * 0.74)} ${F(-wb * 0.15)} ${F(-h * 0.9)}Z`, P.saddle, 0.85);
      } });
      if (V === 'A' && near !== null) { glowAt(c, 0, -h * 0.98, 6.5, P.tip, 0.65); dot(c, 0, -h * 0.98, 1.5, P.tip); dot(c, -0.3, -h * 1.0, 0.7, P.tipHot); }
      c.restore();
    };
    const eh = R * 0.9 * G.ear; const ew = R * G.earW;
    // far ear (behind the skull, darker)
    ear(-R * 0.36, -R * 0.6, eh * 0.95, ew * 0.85, -0.28, mix(P.fur, P.saddle, 0.6), mix(P.inner, P.saddle, 0.3), false);
    ear(R * 0.12, -R * 0.62, eh, ew, 0.1, P.fur, P.inner, true);
    // skull with the cheek ruff (wolf tell): pointed tufts low at the back of the jaw
    const ruffN = V === 'A' ? 4 : 3; const ruffH = V === 'A' ? 4.4 : V === 'C' ? 3.6 : 3.2;
    const ry = V === 'C' ? 0.95 : 0.9; const E2 = (a) => [Math.cos(a) * R, Math.sin(a) * R * ry];
    const pts = [];
    for (const a of [-1.8, -1.2, -0.6, 0, 0.6, 1.2]) pts.push(E2(a));
    const r0 = E2(1.6); const r1 = E2(2.9);
    pts.push(...jag([r0[0] + 0.5, r0[1] + 2.4], [r1[0] - 2.4, r1[1] + 1.2], ruffN, ruffH, 0.1));
    for (const a of [2.9, 3.5, 4.0, 4.45]) pts.push(E2(a));
    shape(c, S(outline(pts)), P.fur, { w: 0.75, x: (k) => {
      // wolf face: darker crown cap with a soft peak down the brow, pale cheeks, pale brow dots
      fillP(k, `M${F(-R * 1.3)} ${F(-R * 1.3)} L${F(R * 1.0)} ${F(-R * 1.3)} L${F(R * 0.62)} ${F(-R * 0.62)} Q${F(R * 0.42)} ${F(-R * 0.4)} ${F(R * 0.2)} ${F(-R * 0.52)} Q${F(-R * 0.2)} ${F(-R * 0.45)} ${F(-R * 0.5)} ${F(R * 0.05)} Q${F(-R * 0.7)} ${F(R * 0.3)} ${F(-R * 1.3)} ${F(R * 0.2)}Z`, P.saddle, V === 'B' ? 0.5 : 0.8);
      ell(k, R * 0.25, R * 0.45, R * 0.6, R * 0.42, P.light, 0.95, -0.25);
      ell(k, R * 0.2, -R * 0.5, R * 0.13, R * 0.09, P.light, 0.95, -0.3);
    } });
    // muzzle: short rounded snout that sticks out (wolf, not a flat puppy face), dark nose on the tip; jaw hinges down for bite / howl
    const mx = R * 0.7; const my = R * 0.24; const mrx = R * 0.5 * mz; const mry = R * 0.3;
    const op = o.mouth;
    if (op > 0.08) {
      // open: dark mouth, lower jaw rotated down, upper snout lifts a little
      c.save(); c.translate(R * 0.3, R * 0.36); c.rotate(op * 0.8);
      fillP(c, `M0 -2 L${F(mrx * 1.9)} ${F(-2 - op * 2)} L${F(mrx * 1.7)} ${F(2)} L0 4Z`, '#3a1830', 0.95);
      shapeK(c, 1.6, (k) => E((mrx * 0.95) * k, 3.4 * k, mrx * 0.95 * k, 3.1 * k), P.light, { w: 0.5 });
      fillP(c, `M${F(mrx * 0.6)} 1.4 Q${F(mrx * 1.0)} -0.6 ${F(mrx * 1.4)} 1.2Z`, '#ff8f9a', 0.9);
      fillP(c, `M${F(mrx * 1.62)} 1 l0.8 -2.4 l1 2.4Z`, '#ffffff');
      c.restore();
    }
    c.save(); c.translate(mx, my); c.rotate(-op * 0.18);
    shapeK(c, 1.6, (k) => S(`M${F(-mrx * 0.9 * k)} ${F(-mry * 1.1 * k)} Q${F(mrx * 0.3 * k)} ${F(-mry * 1.35 * k)} ${F(mrx * 1.02 * k)} ${F(-mry * 0.45 * k)} Q${F(mrx * 1.18 * k)} ${F(mry * 0.55 * k)} ${F(mrx * 0.6 * k)} ${F(mry * 0.95 * k)} Q${F(-mrx * 0.2 * k)} ${F(mry * 1.15 * k)} ${F(-mrx * 0.9 * k)} ${F(mry * 0.8 * k)}Z`), P.light, { w: 0.55 });
    ell(c, -mrx * 0.62, mry * 0.1, mrx * 0.42, mry * 0.92, P.light, 1); // hide the snout's back edge inside the cheek
    // nose: plain dark fill (no rim), soft shine
    fillP(c, `M${F(mrx * 0.62)} ${F(-mry * 0.95)} Q${F(mrx * 1.0)} ${F(-mry * 1.2)} ${F(mrx * 1.18)} ${F(-mry * 0.55)} Q${F(mrx * 1.15)} ${F(-mry * 0.05)} ${F(mrx * 0.88)} ${F(-mry * 0.05)} Q${F(mrx * 0.55)} ${F(-mry * 0.3)} ${F(mrx * 0.62)} ${F(-mry * 0.95)}Z`, P.nose);
    dot(c, mrx * 0.82, -mry * 0.82, 0.75, '#ffffff', 0.75);
    if (op > 0.25) fillP(c, `M${F(mrx * 0.7)} ${F(mry * 0.7)} l0.9 2.6 l1.1 -2.6Z`, '#ffffff');
    else stroke(c, `M${F(mrx * 0.95)} ${F(-mry * 0.05)} L${F(mrx * 0.9)} ${F(mry * 0.45)} Q${F(mrx * 0.75)} ${F(mry * 0.72)} ${F(mrx * 0.5)} ${F(mry * 0.55)}`, mix(P.light, INK, 0.6), 0.9);
    c.restore();
    // eye: big round dark pup eye with catchlights (friendly; never the Husk ember-in-a-socket look)
    const ex = R * 0.34; const ey = -R * 0.14; const er = R * (V === 'C' ? 0.2 : 0.17);
    if (o.eyes > 0.5) {
      ell(c, ex, ey, er * 0.88, er, P.eye);
      dot(c, ex + er * 0.12, ey - er * 0.38, er * 0.42, '#ffffff'); dot(c, ex - er * 0.35, ey + er * 0.42, er * 0.18, '#cfe9ff', 0.9);
      stroke(c, `M${F(ex - er * 1.1)} ${F(ey - er * 1.25)} Q${F(ex)} ${F(ey - er * 1.75)} ${F(ex + er * 1.1)} ${F(ey - er * 1.1)}`, mix(P.saddle, INK, 0.35), 0.9, { a: 0.7 });
    } else stroke(c, `M${F(ex - er)} ${F(ey - 0.2)} Q${F(ex)} ${F(ey + er * 0.9)} ${F(ex + er)} ${F(ey - 0.4)}`, P.eye, 1.3);
  }


  // ---- whole pup ------------------------------------------------------------------------------------------------------------------
  function drawPup(c, V, pose, t, opt = {}) {
    const P = PP[V]; const G = CFG[V]; const o = solve(V, pose, t); const glowK = opt.glow ?? 1;
    const [hx, hy] = o.hip; const [sx, sy] = o.sh;
    // ground shadow + wolf-light under-glow
    c.save(); c.translate(o.speed ? -4 : 0, 1); c.scale(1, 0.24); glowAt(c, 0, 0, (G.L + G.cr + 8) * (o.speed ? 1.3 : 1), '#04040c', 0.42); c.restore();
    if (glowK > 0) glowAt(c, (sx + hx) / 2, (sy + hy) / 2 - 4, V === 'B' ? 44 : 36, P.glow, (V === 'B' ? 0.42 : 0.28) * glowK);
    // trailing light (all three: locked 'pale-blue pup trailing light'), strongest on the dart
    const motes = o.motes || 0;
    if (motes && V !== 'B') {
      for (let i = 0; i < 7; i++) { const u = ((t * 1.6 + i / 7) % 1); const x = hx - 6 - u * (o.speed ? 46 : 26); const y = hy - 3 + Math.sin(i * 2.3 + t * 3) * 4 - u * 4;
        dot(c, x, y, (1 - u) * (o.speed ? 2.2 : 1.6), i % 2 ? '#ffffff' : P.glow, (1 - u) * 0.85 * motes); }
      if (o.speed) for (let i = 0; i < 3; i++) stroke(c, `M${F(hx - 10 - i * 3)} ${F(hy - 10 + i * 6)} l${F(-18 - i * 6)} 0`, P.glow, 1.4, { a: 0.55 });
    }
    // B: the hind half IS a spirit trail (a waving ribbon of wolf-light): drawn first, the solid front half is clipped over it
    const cutX = o.sit ? hx + G.hr * 0.3 : hx + (sx - hx) * 0.3;
    if (V === 'B') {
      const wv = Math.sin(t * (o.speed ? 9 : 4)); const len = o.speed ? 64 : o.sit ? 34 : 48;
      const p = o.sit ? [sx - 3, sy + 6, hx - G.hr * 2.2, hy + 2, hx - G.hr * 1.4, -1, hx + G.L * 0.55 + wv * 1.5, -3]
        : [sx - 4, sy + 1, hx - 4, hy - 1, hx - len * 0.5, hy - 2 + wv * 4, hx - len, hy - 8 - wv * 5];
      const w0 = o.sit ? 7.5 : 8.4; const pts = taper(p, (u) => w0 * Math.pow(1 - u, 0.85) + 0.5, 26);
      glowAt(c, (p[0] + p[6]) / 2, (p[1] + p[7]) / 2, len * 0.75, P.glow, 0.32 * glowK);
      const tp = new Path2D(outline(pts)); const ink = mix(P.fur, INK, 0.7);
      const gx0 = o.sit ? cutX : cutX; const gs = c.createLinearGradient(gx0, 0, p[6], 0); gs.addColorStop(0, ink); gs.addColorStop(0.18, ink); gs.addColorStop(0.6, 'rgba(44,90,146,0)');
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 5.6 * 0.85; c.strokeStyle = gs; const n2 = pts.length / 2; for (const side of [pts.slice(1, n2), pts.slice(n2, pts.length - 1)]) { const e = new Path2D(); e.moveTo(side[0][0], side[0][1]); for (const q of side) e.lineTo(q[0], q[1]); c.stroke(e); }
      const g = c.createLinearGradient(gx0, 0, p[6], 0); g.addColorStop(0, P.fur); g.addColorStop(0.2, P.fur); g.addColorStop(0.55, 'rgba(206,234,255,0.8)'); g.addColorStop(1, 'rgba(159,216,255,0)');
      c.fillStyle = g; c.fill(tp);
      stroke(c, `M${F(p[0])} ${F(p[1] - 2)} C${F(p[2])} ${F(p[3] - 2)} ${F(p[4])} ${F(p[5] - 2)} ${F(p[6])} ${F(p[7])}`, '#ffffff', 1.4, { a: 0.65 });
      for (let i = 0; i < 7; i++) { const u = (t * 0.9 + i / 7) % 1; const q = bz(p, 0.35 + u * 0.65); dot(c, q[0], q[1] - 1 + Math.sin(i * 3 + t * 4) * 3, 1.8 * (1 - u) + 0.4, '#ffffff', 0.85 * (1 - u)); }
      c.restore();
      if (!o.sit) for (const [i, al] of [[2, 0.4], [3, 0.25]]) { const f = o.feet[i]; stroke(c, `M${F(hx + 4)} ${F(hy + 2)} Q${F((hx + f[0]) / 2 - 2)} ${F((hy + f[1]) / 2)} ${F(f[0])} ${F(f[1] - 4)}`, P.glow, 3.2, { a: al }); }
    }
    // tail behind (A, C)
    if (!o.sit) tail(c, V, P, o, t);
    // far legs
    if (o.sit) { leg(c, V, P, [sx - 2, sy + 4], o.feet[1], false); }
    else { leg(c, V, P, [sx - 1.5, sy + 3], o.feet[1], false); if (V !== 'B') leg(c, V, P, [hx + 1, hy + 3], o.feet[3], false); }
    if (o.sit) tail(c, V, P, o, t);
    // body
    const cr = G.cr * (V === 'C' ? 1 : 1); const hr = V === 'B' ? G.hr * 0.9 : G.hr;
    let body;
    if (o.sit) {
      // sitting: haunch low at the back, chest tall at the front
      const pts = [[hx - hr * 0.95, hy - hr * 0.7], [hx - hr * 0.2, hy - hr * 1.45], [sx - cr * 0.6, sy - cr * 0.85], [sx + cr * 0.35, sy - cr * 1.0], [sx + cr * 1.0, sy - cr * 0.2],
        [sx + cr * 0.75, sy + cr * 0.9], [sx + cr * 0.2, hy + hr * 0.2], [hx + hr * 0.9, -0.5], [hx - hr * 0.5, -0.5], [hx - hr * 1.15, hy + hr * 0.25]];
      body = pts;
    } else {
      const st = o.stretch; const k = V === 'C' ? 1.08 : 1;
      const top = [[hx - hr * 0.9, hy - hr * 0.55], [hx - hr * 0.1, hy - hr * 1.0 * k], [(hx + sx) / 2, Math.min(hy, sy) - Math.min(hr, cr) * 0.95 * k + (st > 1 ? 1.5 : 0)], [sx - cr * 0.1, sy - cr * 1.02 * k], [sx + cr * 0.8, sy - cr * 0.55]];
      const bot = [[sx + cr * 0.95, sy + cr * 0.3], [sx + cr * 0.2, sy + cr * 0.95], [(hx + sx) / 2, Math.max(hy, sy) + Math.min(hr, cr) * (V === 'C' ? 0.95 : 0.62)], [hx + hr * 0.2, hy + hr * 0.95], [hx - hr * 0.95, hy + hr * 0.45]];
      body = top.concat(bot);
    }
    // A: scruffy coat = tufts along the back and chest
    if (G.tufts) {
      const out = [];
      for (let i = 0; i < body.length; i++) {
        const a = body[i]; const b = body[(i + 1) % body.length];
        const tuftSeg = o.sit ? (i === 1 || i === 4 || i === 5) : (i === 1 || i === 2 || i === 5 || i === 6);
        if (tuftSeg) out.push(...jag(a, b, 3, 3.2, 0.15)); else out.push(a);
      }
      body = out;
    }
    const bodyDraw = (c) => shape(c, S(outline(body)), P.fur, { w: 0.85, x: (k) => {
      // saddle (darker back) + pale chest bib
      if (o.sit) {
        fillP(k, `M${F(hx - 30)} ${F(hy - 30)} L${F(sx - cr * 0.2)} ${F(sy - cr * 2)} Q${F(sx - cr * 0.5)} ${F(sy + 2)} ${F(hx - 2)} ${F(hy - 2)} Q${F(hx - 8)} ${F(hy + 6)} ${F(hx - 30)} ${F(hy + 8)}Z`, P.saddle, V === 'B' ? 0.35 : 0.8);
        ell(k, sx + cr * 0.55, sy + cr * 0.15, cr * 0.55, cr * 1.0, P.light, 0.95, -0.15);
      } else {
        fillP(k, `M${F(hx - 30)} ${F(hy - 30)} L${F(sx + 6)} ${F(sy - 30)} L${F(sx + 2)} ${F(sy - cr * 0.35)} Q${F((hx + sx) / 2)} ${F(Math.min(hy, sy) - 1)} ${F(hx - hr)} ${F(hy - 1)}Z`, P.saddle, V === 'B' ? 0.4 : 0.8);
        ell(k, sx + cr * 0.62, sy + cr * 0.3, cr * 0.6, cr * 0.72, P.light, 0.95, 0.3);
        ell(k, (hx + sx) / 2, Math.max(hy, sy) + cr * 0.7, (sx - hx) * 0.45, cr * 0.35, P.light, 0.55);
      }
      if (false) for (const [x, y] of [[sx - 6, sy - cr * 0.6], [hx + 4, hy - hr * 0.7], [(hx + sx) / 2, Math.min(hy, sy) - cr * 0.5]]) stroke(k, `M${F(x - 3)} ${F(y)} l2 -2.2 l1.6 2 l2 -2.4`, mix(P.saddle, INK, 0.25), 0.9, { a: 0.7 });
    } });
    if (V === 'B') fadeLayer(c, cutX - 6, cutX + 10, bodyDraw); else bodyDraw(c);
    // sitting haunch (thigh) + hind paw (A, C); near legs
    if (o.sit && V !== 'B') {
      shape(c, E(hx + hr * 0.15, hy - hr * 0.15, hr * 0.78, hr * 0.85), P.fur, { w: 0.6, x: (k) => ell(k, hx + hr * 0.1, hy - hr * 0.6, hr * 0.7, hr * 0.4, P.saddle, 0.5) });
      shape(c, E(hx + hr * 0.75, -G.paw * 0.55, G.paw * 1.15, G.paw * 0.6), P.light, { w: 0.5 });
    }
    
    if (o.sit) leg(c, V, P, [sx + 2, sy + 4], o.feet[0], true);
    else { if (V !== 'B') leg(c, V, P, [hx + 2.5, hy + 3], o.feet[2], true); leg(c, V, P, [sx + 1.5, sy + 3], o.feet[0], true); }
    // B: bone-bell charm cord from Wren's pelt (bone + amber), C: scarf in Wren's tunic blue with her amber stitch
    const R = G.R; const hdx = o.head[0]; const hdy = o.head[1];
    const neck = [(sx + hdx) / 2 - 1, (sy + hdy) / 2 + R * 0.4];
    if (V === 'C') { // scarf: two tails from the knot at the back of the neck flutter behind (the light trail rides on them)
      const fl = Math.sin(t * (o.speed ? 14 : 6)); const lenS = o.speed ? 26 : o.sit ? 15 : 19;
      const k0 = [hdx - R * 0.66, hdy + R * 0.7];
      for (const [dy, ln, ph] of [[2.5, lenS * 0.8, 1.3], [0, lenS, 0]]) {
        const f2 = Math.sin(t * (o.speed ? 14 : 6) + ph);
        const sp = o.sit ? [k0[0], k0[1] + dy, k0[0] - 4, k0[1] + 4 + dy, k0[0] - 6 + f2, k0[1] + ln * 0.6, k0[0] - 5 + f2 * 1.5, k0[1] + ln]
          : [k0[0], k0[1] + dy, k0[0] - ln * 0.3, k0[1] - 5 + f2 * 2 + dy, k0[0] - ln * 0.65, k0[1] - 9 - f2 * 3 + dy * 0.5, k0[0] - ln, k0[1] - 10 + f2 * 4 + dy * 0.3];
        shapeK(c, 2, (k) => S(outline(taper(sp, (u) => 3.6 - u * 0.6, 10).map((q) => [q[0] * k, q[1] * k]))), dy ? mix(P.scarf, INK, 0.25) : P.scarf, { w: 0.5, x: (q) => stroke(q, `M${F(sp[0])} ${F(sp[1])} C${F(sp[2])} ${F(sp[3])} ${F(sp[4])} ${F(sp[5])} ${F(sp[6])} ${F(sp[7])}`, P.stitch, 0.9, { dash: [1.6, 1.6], a: 0.95 }) });
        const e = bz(sp, 1); if (!dy) for (const q of [-1.6, 0, 1.6]) stroke(c, `M${F(e[0])} ${F(e[1] + q)} l${F(-2.4)} ${F(q * 0.4)}`, P.stitch, 0.9, { a: 0.9 });
      }
      void fl;
    }
    // head
    c.save(); c.translate(hdx, hdy); c.rotate(o.headA || 0); head(c, V, P, o, t);
    c.restore();
    if (V === 'B') {
      c.save(); c.translate(hdx, hdy); c.rotate(o.headA || 0);
      const ny = R * 0.84; const sw = Math.sin(t * (o.speed ? 12 : 3)) * (o.sit ? 0.15 : 0.4);
      stroke(c, `M${F(-R * 0.6)} ${F(ny - 2)} Q${F(-R * 0.05)} ${F(ny + 2.4)} ${F(R * 0.55)} ${F(ny - 2.2)}`, '#8a6a46', 1.3);
      c.save(); c.translate(R * 0.02, ny + 1.4); c.rotate(sw);
      stroke(c, 'M0 0 L0 3', '#8a6a46', 0.9);
      shape(c, S('M-3.2 7.6 Q-3 2.2 0 2.2 Q3 2.2 3.2 7.6Z'), P.bone, { w: 0.4 }); dot(c, 0, 8.1, 1.1, P.bell); glowAt(c, 0, 7.5, 6, P.bell, 0.45);
      stroke(c, 'M-1.8 4.4 Q0 3.4 1.8 4.4', mix(P.bone, '#7a5a3a', 0.5), 0.6, { a: 0.8 });
      c.restore(); c.restore();
    }
    // neck accessories in front of the chest
    if (V === 'C') {
      c.save(); c.translate(hdx, hdy); c.rotate(o.headA || 0);
      const ny = R * 0.9;
      shapeK(c, 2, (k) => S(`M${F(-R * 0.82 * k)} ${F((ny - 3.6) * k)} Q${F(-R * 0.1 * k)} ${F((ny + 0.6) * k)} ${F(R * 0.66 * k)} ${F((ny - 3.8) * k)} L${F(R * 0.72 * k)} ${F((ny + 2.6) * k)} Q${F(-R * 0.1 * k)} ${F((ny + 7.6) * k)} ${F(-R * 0.86 * k)} ${F((ny + 2.8) * k)}Z`), P.scarf, { w: 0.5, x: (q) => { stroke(q, `M${F(-R * 0.78)} ${F(ny - 0.6)} Q${F(-R * 0.1)} ${F(ny + 3.8)} ${F(R * 0.66)} ${F(ny - 0.8)}`, P.stitch, 1, { dash: [1.8, 1.6] }); stroke(q, `M${F(-R * 0.5)} ${F(ny - 1.6)} l2 4 M${F(R * 0.1)} ${F(ny)} l2 4.2`, mix(P.scarf, INK, 0.3), 0.8, { a: 0.8 }); } });
      shapeK(c, 2, (k) => E(-R * 0.62 * k, (ny + 0.4) * k, 3 * k, 3.4 * k), mix(P.scarf, INK, 0.12), { w: 0.45 });
      c.restore();
    }
    // bite: snap arc in front of the jaws; howl: soft sound rings
    if (o.bite && o.snap > 0.6) {
      const jx = hdx + R * 1.8; const jy = hdy + R * 0.3; const a = (o.snap - 0.6) / 0.4;
      for (const s of [-1, 1]) stroke(c, `M${F(jx - 3)} ${F(jy + s * 9)} Q${F(jx + 5)} ${F(jy + s * 4)} ${F(jx + 4)} ${F(jy)}`, '#ffffff', 2, { a: 0.9 * a });
      for (const an of [-0.5, 0, 0.5]) { const [dx, dy] = rot(7, 0, an); stroke(c, `M${F(jx + 6 + dx * 0.6)} ${F(jy + dy * 0.6)} l${F(dx * 0.5)} ${F(dy * 0.5)}`, '#ffffff', 1.4, { a: 0.8 * a }); }
      glowAt(c, jx + 1, jy, 9, P.glow, 0.6 * a);
    }
    if (o.howl) {
      c.save(); c.translate(hdx, hdy); c.rotate(-0.95);
      for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; const r = 8 + u * 22; stroke(c, `M${F(R + r * 0.5)} ${F(-r * 0.55)} Q${F(R + r)} 0 ${F(R + r * 0.5)} ${F(r * 0.55)}`, P.glow, 2.2 * (1 - u) + 0.4, { a: 0.9 * (1 - u) }); }
      c.restore();
    }
  }

  // bounding box (du) for baking: x0, y0, x1, y1
  const BB = [-80, -80, 70, 10];
  const INFO = {
    A: { fantasy: 'A scrappy little wolf in Wren\'s own pale pelt colours; its ear tips and tail tip catch her lantern light like embers.',
      moves: 'Solid, low trot at her heel; darts in a scruffy streak, ears pinned; quick double snap; sits and scratches between fights.',
      crowd: 'Pale moon-blue body + two warm amber ear points read against dark Husks; no mask, no socket eyes. Amber dots are on TOP of the ears, Husk embers sit low in bark faces.',
      cost: 'Same rig as today\'s pup: ~11 atlas parts (head x5 expressions incl. bite/howl, body sit/run x4/dart/bite, tail x2, ear-tip glow sprite). ~1 day.' },
    B: { fantasy: 'A half-there spirit pup: a solid little wolf at the front that thins into a ribbon of wolf-light, a bone bell from Wren\'s pelt at its throat.',
      moves: 'Glides more than trots (hind legs are wisps); darts as a long streak of light; the trail curls when it snaps; howl pulses the trail.',
      crowd: 'Brightest of the three and has the longest trail, so it is the easiest to find in a crowd; risk: a fast streak of blue light can be mistaken for a Spirit Bolt (cyan orb + ink tail) at a glance.',
      cost: 'Fewest leg frames (2 front legs) but the trail is a live ribbon (like the bolt tail code) + additive glow; ~9 atlas parts + 1 ribbon. ~1-1.5 days.' },
    C: { fantasy: 'A round, clumsy, brave puppy with paws it has not grown into, wearing a scrap of Wren\'s tunic as a scarf.',
      moves: 'Bouncy hop-trot, paws flop; dart is a belly-low scramble; the bite is a pounce; the scarf end trails behind (the light trail rides on it).',
      crowd: 'Biggest head and paws = cutest silhouette; the dark blue scarf is a unique marker no Husk has; risk: round head + short muzzle drifts toward "dog".',
      cost: '~12 atlas parts (bigger paw frames, scarf end as a small swinging sprite). ~1 day.' },
  };
  return { PP, CFG, POSES, drawPup, solve, BB, INFO };
})();
