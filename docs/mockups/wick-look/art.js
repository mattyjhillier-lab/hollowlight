// The Wick (Elias's companion): THREE look options, drawn with the REAL rig helpers (real-rigs.js = src/gfx/wrenart.js, the same ones eliasart.js uses):
// same design units as Elias (1 du = 0.211 world units; Elias ~150 du tall), L2 tinted outline (shape(): ink = fill mixed 70% to #2a0f30),
// H2 diagonal gradient + lower-right rim crescent, P1 chibi. Origin = the creature's floating base point (it hovers by Elias's shoulder), faces +x.
// Sandbox only: NOT game code.
'use strict';
window.WICK = (() => {
  const { shape, S, E, stroke, fillP, dot, ell, mix } = RIGS.wren;
  let GK = 1; // glow multiplier for the current draw (0 = silhouette check)
  const glowAt = (c, x, y, r, col, a) => { if (GK > 0) RIGS.wren.glowAt(c, x, y, r, col, Math.min(1, a * GK)); };
  const F = (n) => (+n).toFixed(2);
  const TAU = Math.PI * 2;
  const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  // closed outline through points; [x,y,1] = sharp tip, others smoothed (same helper as the pup sandbox)
  function outline(pts) {
    const n = pts.length; const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let p = mid(pts[n - 1], pts[0]); let d = `M${F(p[0])} ${F(p[1])}`;
    for (let i = 0; i < n; i++) {
      const v = pts[i]; const m = mid(v, pts[(i + 1) % n]);
      d += v[2] ? ` L${F(v[0])} ${F(v[1])} L${F(m[0])} ${F(m[1])}` : ` Q${F(v[0])} ${F(v[1])} ${F(m[0])} ${F(m[1])}`;
    }
    return d + 'Z';
  }
  const bz = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };
  function taper(p, wf, n = 18) {
    const L = []; const R = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n; const q = bz(p, t); const a = bz(p, Math.max(0, t - 0.02)); const b = bz(p, Math.min(1, t + 0.02));
      const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; const w = wf(t);
      L.push([q[0] - (dy / l) * w, q[1] + (dx / l) * w]); R.push([q[0] + (dy / l) * w, q[1] - (dx / l) * w]);
    }
    return L.concat(R.reverse());
  }
  const tf = (pts, x, y, s = 1, sy = s) => pts.map((q) => [x + q[0] * s, y + q[1] * sy, q[2]]);

  // ---- palettes: apricot candle-flame (warmer + rosier than Elias's gold candles, nothing like the lilac Holy Orbit lights) ----------
  // fo outer flame, fm inner flame, fc cream core (a light, excluded from the reserved-colour check like every flame core), eye, cheek, glow
  const BASE = { fo: '#ffae78', fm: '#ffcf9c', fc: '#fff3dc', eye: '#3a1f2e', cheek: '#ff9c86', glow: '#ffb488' };
  const PP = {
    A: { ...BASE, name: 'A Chamberstick', short: 'Chamberstick', brass: '#d6a94c', wax: '#f3ead8' }, // brass + wax = Elias's own PE.brass / PE.candle
    B: { ...BASE, name: 'B Scarf Flicker', short: 'Scarf', scarf: '#8796ad', scarfLt: '#c9d1dc' }, // smoke-slate scarf (Elias's slate family)
    C: { ...BASE, name: 'C Lampmoth', short: 'Lampmoth', fuzz: '#efe2c8', wing: '#ffe3b8', wingEdge: '#e9a46c', ant: '#6b5848' },
  };
  const POSES = ['idle', 'follow', 'ward', 'dim', 'relight', 'feed'];
  const dimP = (P, k) => ({ ...P, fo: mix(P.fo, '#a07a6e', k), fm: mix(P.fm, '#c9a490', k), fc: mix(P.fc, '#e6d2c0', k * 0.6), glow: P.glow });

  // ---- face: dark round eyes with catchlights (friendly; never the Husk ember-in-a-socket look) ---------------------------------
  function face(c, x, y, s, mood, P) {
    const ex0 = x - 3.6 * s; const ex1 = x + 4.6 * s; const er = 2.1 * s;
    const eye = (ex, k) => {
      if (mood === 'closed' || mood === 'happy') { stroke(c, mood === 'happy' ? `M${F(ex - er)} ${F(y + er * 0.4)} Q${F(ex)} ${F(y - er * 1.3)} ${F(ex + er)} ${F(y + er * 0.4)}` : `M${F(ex - er)} ${F(y)} Q${F(ex)} ${F(y + er * 1.1)} ${F(ex + er)} ${F(y)}`, P.eye, 1.15 * s); return; }
      if (mood === 'squeeze') { stroke(c, `M${F(ex - er * k)} ${F(y - er)} L${F(ex + er * 0.4 * k)} ${F(y)} L${F(ex - er * k)} ${F(y + er)}`.replace(/NaN/g, '0'), P.eye, 1.2 * s); return; }
      const big = mood === 'wide' ? 1.18 : 1;
      ell(c, ex, y, er * 0.86 * big * k, er * 1.22 * big * k, P.eye);
      if (mood === 'sleepy') { fillP(c, `M${F(ex - er * 1.3)} ${F(y - er * 1.6)} L${F(ex + er * 1.3)} ${F(y - er * 1.6)} L${F(ex + er * 1.3)} ${F(y + er * 0.05)} L${F(ex - er * 1.3)} ${F(y + er * 0.05)}Z`, P.fc); stroke(c, `M${F(ex - er)} ${F(y + 0.05)} L${F(ex + er)} ${F(y + 0.05)}`, P.eye, 0.9 * s); return; }
      dot(c, ex + er * 0.25 * k, y - er * 0.5, er * 0.42 * k, '#ffffff'); dot(c, ex - er * 0.3 * k, y + er * 0.55, er * 0.2 * k, '#ffffff', 0.85);
      if (mood === 'wide') dot(c, ex + er * 0.35, y + er * 0.2, er * 0.14, '#ffffff', 0.9);
    };
    // squeeze: the far eye points the other way (><)
    if (mood === 'squeeze') { eye(ex0, -1); eye(ex1, 1); } else { eye(ex0, 0.9); eye(ex1, 1); }
    // cheeks + mouth
    ell(c, ex0 - 1.6 * s, y + 3 * s, 1.9 * s, 1.1 * s, P.cheek, mood === 'sleepy' ? 0.3 : 0.55); ell(c, ex1 + 1.9 * s, y + 3 * s, 2 * s, 1.15 * s, P.cheek, mood === 'sleepy' ? 0.3 : 0.55);
    const mx = x + 1 * s; const my = y + 3.4 * s;
    if (mood === 'wide') ell(c, mx, my + 0.6 * s, 1.1 * s, 1.4 * s, '#7a3040');
    else if (mood === 'squeeze') stroke(c, `M${F(mx - 1.8 * s)} ${F(my + 0.4 * s)} L${F(mx + 1.8 * s)} ${F(my + 0.4 * s)}`, P.eye, 1 * s);
    else if (mood === 'sleepy') stroke(c, `M${F(mx - 1 * s)} ${F(my + 0.3 * s)} Q${F(mx)} ${F(my + 0.8 * s)} ${F(mx + 1 * s)} ${F(my + 0.3 * s)}`, P.eye, 0.8 * s);
    else stroke(c, `M${F(mx - 1.7 * s)} ${F(my)} Q${F(mx)} ${F(my + 1.9 * s)} ${F(mx + 1.7 * s)} ${F(my)}`, P.eye, 1 * s);
  }

  // inner flame + cream core over an outlined outer flame (all three options); core centred at (cx, cy) size r
  function flameInside(k, P, cx, cy, r, h, lean) {
    fillP(k, `M${F(cx)} ${F(cy + r * 0.95)} C${F(cx - r * 1.25)} ${F(cy + r * 0.95)} ${F(cx - r * 1.1)} ${F(cy - h * 0.35)} ${F(cx + lean * 0.8)} ${F(cy - h * 0.62)} C${F(cx + r * 1.1)} ${F(cy - h * 0.35)} ${F(cx + r * 1.25)} ${F(cy + r * 0.95)} ${F(cx)} ${F(cy + r * 0.95)}Z`, P.fm, 0.95);
    ell(k, cx + 0.5, cy + r * 0.12, r * 0.8, r * 0.78, P.fc, 0.95);
  }
  const flick = (t) => ({ le: Math.sin(t * 7.3) * 1.3 + Math.sin(t * 12.1) * 0.6, dh: Math.sin(t * 9.4) * 1.1 + Math.sin(t * 15.7) * 0.5 });

  // a burst ring (ward flash): cream inner ring, apricot outer ring, short rays
  const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
  function burst(c, x, y, u, P, rad = 26) {
    // sized to read at true size: the bloom and ring reach ~10 world units (a hit that did not land is the moment players must see)
    const a = 1 - sm(u) * 0.75; const r = 12 + rad * 1.5 * sm(u);
    c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, x, y, r * 1.9, '#fff1d6', 0.9 * a); glowAt(c, x, y, 16, '#ffffff', 0.8 * a); c.restore();
    stroke(c, circ(x, y, r * 1.25), mix(P.fo, '#2a0f30', 0.35), 6 * a + 1, { a: 0.5 * a });
    stroke(c, circ(x, y, r), '#fff1d6', 5.5 * a + 0.6, { a: 0.95 * a });
    stroke(c, circ(x, y, r * 1.25), P.fo, 3.2 * a + 0.4, { a: 0.9 * a });
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU + 0.2; const r0 = r * 1.45; const r1 = r * 1.45 + 9 * a; stroke(c, `M${F(x + Math.cos(an) * r0)} ${F(y + Math.sin(an) * r0)} L${F(x + Math.cos(an) * r1)} ${F(y + Math.sin(an) * r1)}`, '#fff1d6', 2.4, { a: 0.9 * a }); }
  }
  function spark(c, x, y, s, a = 1) {
    glowAt(c, x, y, 9 * s, '#fff1d6', 0.8 * a);
    fillP(c, `M${F(x)} ${F(y - 6 * s)} Q${F(x + 0.9 * s)} ${F(y - 0.9 * s)} ${F(x + 6 * s)} ${F(y)} Q${F(x + 0.9 * s)} ${F(y + 0.9 * s)} ${F(x)} ${F(y + 6 * s)} Q${F(x - 0.9 * s)} ${F(y + 0.9 * s)} ${F(x - 6 * s)} ${F(y)} Q${F(x - 0.9 * s)} ${F(y - 0.9 * s)} ${F(x)} ${F(y - 6 * s)}Z`, '#fffaf0', a);
  }
  // warm motes trailing behind (follow / feed); small and apricot-cream, never the green XP gem or a gold coin
  function motes(c, x, y, t, n, len, dir, P, a = 1) {
    for (let i = 0; i < n; i++) { const u = (t * 1.4 + i / n) % 1; const px = x + dir[0] * u * len + Math.sin(i * 2.7 + t * 3) * 3; const py = y + dir[1] * u * len + Math.cos(i * 1.9 + t * 2.4) * 3;
      dot(c, px, py, (1 - u) * 1.6 + 0.3, i % 2 ? P.fc : P.fo, (1 - u) * 0.85 * a); }
  }

  // ---- A Chamberstick: a flame-sprite standing in a stub of wax in a tiny floating brass chamberstick (finger-loop handle) -------
  function dishA(c, P, x, y, rot, sc = 1) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
    const b = P.brass; const bInk = mix(b, '#2a0f30', 0.62);
    // finger-loop handle at the back
    const loop = 'M-14 0.5 Q-22 -0.5 -22.5 4 Q-22.5 8.5 -16.5 7.5';
    stroke(c, loop, bInk, 5.6); stroke(c, loop, b, 3); stroke(c, 'M-15 0 Q-20.5 -0.3 -21.3 3.4', '#fff0b8', 0.9, { a: 0.7 });
    shape(c, S('M-15.5 0 Q-14.5 6.4 -6 7.6 L6 7.6 Q14.5 6.4 15.5 0Z'), mix(b, '#3a1f4a', 0.12), { w: 0.6 });
    shape(c, E(0, 9.2, 4.2, 2), mix(b, '#3a1f4a', 0.2), { w: 0.45 });
    shape(c, E(0, 0, 15.5, 4.6), b, { w: 0.6, x: (k) => { ell(k, 0, 0.6, 12, 3.1, mix(b, '#5a3a1c', 0.45), 0.6); stroke(k, 'M-12.5 -2.2 Q0 -4.6 12.5 -2.2', '#fff0b8', 1, { a: 0.75 }); } });
    c.restore();
  }
  function waxA(c, P, x, y, melt = 0) {
    const d = `M${F(x - 6.5)} ${F(y + 0.8)} L${F(x - 6.5)} ${F(y - 7 + melt)} Q${F(x - 6.6)} ${F(y - 9.4 + melt)} ${F(x - 3.5)} ${F(y - 9 + melt)} Q${F(x)} ${F(y - 8 + melt)} ${F(x + 3.5)} ${F(y - 9.2 + melt)} Q${F(x + 6.6)} ${F(y - 9.6 + melt)} ${F(x + 6.5)} ${F(y - 7 + melt)} L${F(x + 6.5)} ${F(y + 0.8)}Z`
      + ` M${F(x + 6.2)} ${F(y - 7 + melt)} Q${F(x + 8.6)} ${F(y - 6.4 + melt)} ${F(x + 8.2)} ${F(y - 2.6)} Q${F(x + 8)} ${F(y - 0.6)} ${F(x + 6.2)} ${F(y - 1.2)}Z`
      + ` M${F(x - 6.2)} ${F(y - 6 + melt)} Q${F(x - 8.2)} ${F(y - 5 + melt)} ${F(x - 7.8)} ${F(y - 3.2)} Q${F(x - 7.4)} ${F(y - 2)} ${F(x - 6.2)} ${F(y - 2.6)}Z`;
    shape(c, S(d), P.wax, { w: 0.6 });
  }
  function flameA(c, P, x, y, r, h, le, mood, s = 1) {
    // single candle-flame with a curled lick on its front edge (a quiff), face on the core
    const pts = tf([[0, 0.6], [-r * 0.98, -1.2], [-r * 1.12, -h * 0.34], [-r * 0.8, -h * 0.66], [-r * 0.32 + le * 0.7, -h * 0.88], [le - r * 0.05, -h, 1], [r * 0.32 + le * 0.6, -h * 0.84], [r * 0.12 + le * 0.5, -h * 0.74, 1], [r * 0.7 + le * 0.3, -h * 0.62], [r * 1.1, -h * 0.34], [r * 0.98, -1.2]], x, y);
    glowAt(c, x, y - h * 0.4, h * 1.25, P.glow, 0.32);
    shape(c, S(outline(pts)), P.fo, { w: 0.8, x: (k) => flameInside(k, P, x, y - r * 1.05, r * 0.72, h, le) });
    if (mood) face(c, x, y - r * 1.02, s, mood, P);
  }
  function drawA(c, P, pose, t, o) {
    const { le, dh } = flick(t); const bob = Math.sin(t * 2.1) * 1.6;
    const R0 = 11; const H0 = 33;
    const blink = t % 3.4 < 0.13;
    if (pose === 'idle' || pose === 'follow') {
      const tilt = pose === 'follow' ? -0.16 : Math.sin(t * 1.3) * 0.04; const lean = pose === 'follow' ? -7 : 0;
      c.save(); c.translate(0, bob); c.rotate(tilt);
      if (pose === 'follow') motes(c, -10, -18, t, 6, 34, [-1, 0.15], P);
      dishA(c, P, 0, 0, 0); waxA(c, P, 0, 0);
      stroke(c, 'M0 -8.6 L0 -11', '#4a3238', 1.4);
      flameA(c, P, 0, -7.5, R0, H0 + dh, le + lean, blink ? 'closed' : 'open');
      c.restore(); return;
    }
    if (pose === 'ward') {
      // the dish swings up in front like a little shield and the hit bursts on it; the flame braces behind it (><)
      const u = o.u ?? 0.35;
      c.save(); c.translate(0, bob * 0.3);
      waxA(c, P, -3, 0); stroke(c, 'M-3 -8.6 L-3 -11', '#4a3238', 1.4);
      flameA(c, P, -3, -7.5, R0 * 1.06, H0 * 0.82, -4, 'squeeze');
      dishA(c, P, 15, -12, -1.38, 1.08);
      burst(c, 30, -13, u, P, 22);
      c.restore(); return;
    }
    if (pose === 'dim') {
      // charge spent: a small low flame, sleepy, a thin curl of wick smoke; the dish sits still
      const Q = dimP(P, 0.45);
      c.save(); c.translate(0, bob * 0.4 + 2);
      dishA(c, Q, 0, 0, 0); waxA(c, Q, 0, 0);
      stroke(c, 'M0 -8.6 L0 -11', '#4a3238', 1.4);
      stroke(c, `M0.5 -22 Q${F(-3 + Math.sin(t * 2) * 2)} -28 1 -33 Q${F(4 + Math.sin(t * 2.3))} -38 0 -43`, '#c9c2c8', 1.2, { a: 0.45 });
      flameA(c, Q, 0, -7.5, R0 * 0.62, H0 * 0.5 + dh * 0.4, le * 0.4, t % 2.6 < 0.2 ? 'closed' : 'sleepy', 0.72);
      c.restore(); return;
    }
    if (pose === 'relight') {
      // pop: a spark on the wick and the flame springs back up, eyes wide
      const u = o.u ?? 0.55; const g = 0.55 + 0.45 * sm(u * 1.6);
      c.save(); c.translate(0, bob);
      dishA(c, P, 0, 0, 0); waxA(c, P, 0, 0); stroke(c, 'M0 -8.6 L0 -11', '#4a3238', 1.4);
      flameA(c, P, 0, -7.5, R0 * (0.75 + 0.25 * g), H0 * g * 1.08, le, 'wide', 0.85 + 0.15 * g);
      spark(c, 9, -36 * g, 1.1, 1 - u * 0.5); spark(c, -10, -24, 0.6, 0.8);
      for (let i = 0; i < 6; i++) { const an = -Math.PI / 2 + (i - 2.5) * 0.45; dot(c, Math.cos(an) * (16 + u * 10), -18 + Math.sin(an) * (16 + u * 10), 1.3, P.fc, 0.8 * (1 - u * 0.6)); }
      c.restore(); return;
    }
    // feed: tips its dish and pours a stream of light down into the Sanctuary Ring; flame tall and bright, eyes happy
    c.save(); c.translate(0, bob * 0.5); c.rotate(0.5);
    glowAt(c, 0, -18, 60, P.glow, 0.45 * (o.glow ?? 1));
    dishA(c, P, 0, 0, 0); waxA(c, P, 0, 0); stroke(c, 'M0 -8.6 L0 -11', '#4a3238', 1.4);
    flameA(c, P, 0, -7.5, R0 * 1.1, H0 * 1.22 + dh, le - 6, 'happy', 1.05);
    c.restore();
    pour(c, P, 14, 4, t, o.reach ?? 46);
  }
  // a tapered ribbon of light pouring down to the ground (A feed), with drops
  function pour(c, P, x, y, t, len) {
    const p = [x, y, x + 6, y + len * 0.3, x + 2, y + len * 0.7, x - 2, y + len];
    const pts = taper(p, (u) => 3.2 - u * 1.6 + Math.sin(u * 9 + t * 8) * 0.4, 16);
    glowAt(c, x, y + len * 0.6, len * 0.6, P.glow, 0.35);
    fillP(c, outline(pts), P.fm, 0.9); fillP(c, outline(taper(p, (u) => 1.4 - u * 0.6, 16)), '#fffaf0', 0.9);
    for (let i = 0; i < 5; i++) { const u = (t * 1.8 + i / 5) % 1; const q = bz(p, u); dot(c, q[0] + Math.sin(i * 3) * 4, q[1], 1.4 * (1 - u) + 0.4, '#fffaf0', 0.9); }
    glowAt(c, x - 2, y + len, 18, '#fff1d6', 0.6);
  }

  // ---- B Scarf Flicker: a bare chubby flame with two little flame ears and stubby flame arms, a smoke-slate scarf trailing --------
  function bodyB(r, h, le, arm) {
    return [[0, 0.8], [-r * 0.92, -1.4], [-r * 1.12, -h * 0.24], [-r * 1.6, -h * 0.4 + arm, 1], [-r * 1.0, -h * 0.42], [-r * 0.88, -h * 0.64], [-r * 0.6 + le * 0.6, -h * 0.84], [-r * 0.5 + le, -h, 1], [-r * 0.12 + le * 0.7, -h * 0.76], [r * 0.18 + le, -h * 0.97, 1], [r * 0.56 + le * 0.5, -h * 0.68], [r * 0.95, -h * 0.46], [r * 1.58, -h * 0.42 - arm, 1], [r * 1.12, -h * 0.25], [r * 0.95, -1.4]];
  }
  function scarfB(c, P, x, y, r, t, len, wave, back = true) {
    // band around the waist + a long trailing tail that thins into smoke
    if (back) {
      const p = [x - r * 0.8, y, x - r * 0.8 - len * 0.35, y - 2 + Math.sin(t * wave) * 3, x - r * 0.8 - len * 0.7, y - 6 - Math.sin(t * wave + 1) * 4, x - r * 0.8 - len, y - 4 + Math.sin(t * wave + 2) * 5];
      // the scarf end is solid knit near the knot and breaks up into soft smoke puffs further back
      const p1 = [p[0], p[1], p[0] + (p[2] - p[0]) * 0.5, p[1] + (p[3] - p[1]) * 0.5, p[0] + (p[4] - p[0]) * 0.45, p[1] + (p[5] - p[1]) * 0.45, bz(p, 0.42)[0], bz(p, 0.42)[1]];
      shape(c, S(outline(taper(p1, (u) => 4.4 - u * 0.8, 12))), P.scarf, { w: 0.55, x: (k) => { for (const q of [0.3, 0.6, 0.9]) { const a = bz(p1, q); stroke(k, `M${F(a[0] - 1)} ${F(a[1] - 4)} l2 8`, P.scarfLt, 1.2, { a: 0.75 }); } } });
      for (let i = 0; i < 9; i++) { const u = 0.4 + i * 0.075; const q = bz(p, Math.min(1, u)); const r = 3.6 + i * 0.5 + Math.sin(t * 2 + i) * 0.4; const a = 0.85 - i * 0.085;
        dot(c, q[0] + 0.6, q[1] + 1, r, P.scarf, a * 0.8); dot(c, q[0], q[1] - 0.4, r * 0.82, P.scarfLt, a); }
      return;
    }
    shape(c, S(`M${F(x - r * 1.08)} ${F(y - 3.4)} Q${F(x)} ${F(y + 1.2)} ${F(x + r * 1.08)} ${F(y - 3.8)} L${F(x + r * 1.04)} ${F(y + 1.4)} Q${F(x)} ${F(y + 6.2)} ${F(x - r * 1.04)} ${F(y + 1.6)}Z`), P.scarf, { w: 0.55, x: (k) => stroke(k, `M${F(x - r)} ${F(y - 0.6)} Q${F(x)} ${F(y + 3.6)} ${F(x + r)} ${F(y - 1)}`, P.scarfLt, 1, { a: 0.75 }) });
    shape(c, E(x - r * 0.7, y + 0.8, 2.8, 3.2), mix(P.scarf, '#2a0f30', 0.12), { w: 0.45 });
  }
  function flameB(c, P, x, y, r, h, le, arm, mood, s = 1, sy = 1) {
    glowAt(c, x, y - h * 0.4, h * 1.25, P.glow, 0.34);
    shape(c, S(outline(tf(bodyB(r, h, le, arm), x, y, 1, sy))), P.fo, { w: 0.8, x: (k) => flameInside(k, P, x, y - r * 0.95 * sy, r * 0.74, h * sy, le) });
    if (mood) face(c, x + 0.5, y - r * 0.92 * sy, s, mood, P);
  }
  function drawB(c, P, pose, t, o) {
    const { le, dh } = flick(t); const bob = Math.sin(t * 2.1) * 1.8; const R0 = 13; const H0 = 38;
    const blink = t % 3.4 < 0.13; const arm = Math.sin(t * 2.6) * 2.2;
    if (pose === 'idle' || pose === 'follow') {
      const f = pose === 'follow'; c.save(); c.translate(0, bob); c.rotate(f ? -0.14 : 0);
      if (f) motes(c, -14, -16, t, 6, 30, [-1, 0.1], P);
      scarfB(c, P, 0, -7, R0, t, f ? 40 : 26, f ? 9 : 3.5, true);
      flameB(c, P, 0, 0, R0, H0 + dh, le + (f ? -8 : 0), f ? 3 : arm, blink ? 'closed' : 'open');
      scarfB(c, P, 0, -7, R0, t, 0, 0, false);
      c.restore(); return;
    }
    if (pose === 'ward') {
      // puffs up into a round ball of light, ears flat, and the hit bursts off it; scarf whips back
      const u = o.u ?? 0.35; c.save();
      scarfB(c, P, 0, -8, R0 * 1.2, t, 34, 12, true);
      flameB(c, P, 0, 0, R0 * 1.24, H0 * 0.74, -2, 6, 'squeeze', 1.05);
      scarfB(c, P, 0, -8, R0 * 1.2, t, 0, 0, false);
      burst(c, 24, -17, u, P, 24); c.restore(); return;
    }
    if (pose === 'dim') {
      const Q = dimP(P, 0.45); c.save(); c.translate(0, bob * 0.4 + 2);
      scarfB(c, Q, 0, -4, R0 * 0.7, t, 12, 2, true);
      flameB(c, Q, 0, 0, R0 * 0.66, H0 * 0.52 + dh * 0.4, le * 0.3, -3, t % 2.6 < 0.2 ? 'closed' : 'sleepy', 0.72);
      scarfB(c, Q, 0, -4, R0 * 0.7, t, 0, 0, false);
      stroke(c, `M2 -22 Q${F(-2 + Math.sin(t * 2) * 2)} -28 2 -33 Q${F(5 + Math.sin(t * 2.3))} -38 1 -42`, '#c9c2c8', 1.2, { a: 0.45 });
      c.restore(); return;
    }
    if (pose === 'relight') {
      const u = o.u ?? 0.55; const g = 0.55 + 0.45 * sm(u * 1.6); c.save(); c.translate(0, bob);
      scarfB(c, P, 0, -7, R0 * (0.75 + 0.25 * g), t, 24, 5, true);
      flameB(c, P, 0, 0, R0 * (0.75 + 0.25 * g), H0 * g * 1.08, le, 6, 'wide', 0.85 + 0.15 * g);
      scarfB(c, P, 0, -7, R0 * (0.75 + 0.25 * g), t, 0, 0, false);
      spark(c, 10, -40 * g, 1.1, 1 - u * 0.5); spark(c, -12, -26, 0.6, 0.8);
      c.restore(); return;
    }
    // feed: dives head-first into the Sanctuary Ring as a streak, scarf streaming behind, eyes happy
    c.save(); c.rotate(1.0);
    glowAt(c, 0, -18, 60, P.glow, 0.45 * (o.glow ?? 1));
    motes(c, -18, -20, t, 8, 44, [-1, -0.1], P);
    scarfB(c, P, 0, -7, R0, t, 46, 10, true);
    flameB(c, P, 0, 0, R0 * 0.95, H0 * 1.25 + dh, -9, 5, 'happy', 1.02);
    scarfB(c, P, 0, -7, R0 * 0.95, t, 0, 0, false);
    c.restore();
  }

  // ---- C Lampmoth: a little cream moth whose head is a round candle-flame, feathery antennae, two pairs of wings made of light ----
  function wingsC(c, P, x, y, open, flap, near, sc = 1) {
    // forewing + hindwing, swept back (-x) and up; flap squashes them (beats); near pair brighter
    c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(-open);
    const fx = 0.3 + 0.7 * Math.abs(Math.cos(flap)); c.scale(1, fx);
    const fw = outline([[1, 0], [-4, -9], [-15, -20], [-26, -27, 1], [-29, -18], [-24, -8], [-13, -2]]);
    const hw = outline([[1, 1], [-8, -2], [-18, 0], [-21, 7, 1], [-13, 10], [-4, 6]]);
    const col = near ? P.wing : mix(P.wing, P.wingEdge, 0.35);
    c.save(); c.globalAlpha = near ? 0.92 : 0.8;
    shape(c, S(hw), mix(col, P.wingEdge, 0.2), { w: 0.5, x: (k) => { ell(k, -12, 3.4, 3, 2.2, P.wingEdge, 0.55); } });
    shape(c, S(fw), col, { w: 0.5, x: (k) => {
      fillP(k, 'M-14 -19 Q-24 -24 -27 -26 Q-27 -18 -23 -10 Q-18 -14 -14 -19Z', P.wingEdge, 0.4);
      ell(k, -15, -13, 3.6, 2.6, P.fo, 0.8); ell(k, -15, -13, 1.6, 1.2, '#fffaf0', 0.95);
      for (const [ax, ay] of [[-24, -24], [-26, -16], [-18, -6]]) stroke(k, `M-2 -2 L${ax} ${ay}`, P.wingEdge, 0.7, { a: 0.55 });
    } });
    c.restore(); c.restore();
  }
  function headC(c, P, x, y, r, le, mood, s = 1) {
    const pts = [];
    for (const a of [90, 125, 160, 195]) pts.push([x + Math.cos(a * Math.PI / 180) * r, y + Math.sin(a * Math.PI / 180) * r]);
    pts.push([x - r * 0.95 + le * 0.4, y - r * 1.05, 1], [x - r * 0.45, y - r * 0.92], [x + le - r * 0.1, y - r - 13, 1], [x + r * 0.5, y - r * 0.9]);
    for (const a of [-30, 0, 35, 65]) pts.push([x + Math.cos(a * Math.PI / 180) * r, y + Math.sin(a * Math.PI / 180) * r]);
    glowAt(c, x, y - 4, r * 3.4, P.glow, 0.34);
    shape(c, S(outline(pts)), P.fo, { w: 0.8, x: (k) => { fillP(k, `M${F(x - r * 0.75)} ${F(y + r * 0.3)} Q${F(x - r * 0.8)} ${F(y - r * 0.9)} ${F(x + le * 0.8 - r * 0.1)} ${F(y - r - 8)} Q${F(x + r * 0.8)} ${F(y - r * 0.9)} ${F(x + r * 0.75)} ${F(y + r * 0.3)}Z`, P.fm, 0.95); ell(k, x + 0.5, y + 0.6, r * 0.66, r * 0.6, P.fc, 0.95); } });
    if (mood) face(c, x + 0.8, y, s * 0.95, mood, P);
  }
  function antennaeC(c, P, x, y, r, t, droop = 0) {
    for (const [dx, k] of [[-2.5, 0.85], [3, 1]]) {
      const w = Math.sin(t * 3 + dx) * 1.2;
      const p = [x + dx, y - r * 0.8, x + dx + 3, y - r - 4 + droop, x + dx + 7 + w, y - r - 9 + droop * 1.5, x + dx + 10 + w, y - r - 8 + droop * 2];
      stroke(c, `M${F(p[0])} ${F(p[1])} C${F(p[2])} ${F(p[3])} ${F(p[4])} ${F(p[5])} ${F(p[6])} ${F(p[7])}`, mix(P.ant, '#2a0f30', 0.3), 2.2 * k);
      stroke(c, `M${F(p[0])} ${F(p[1])} C${F(p[2])} ${F(p[3])} ${F(p[4])} ${F(p[5])} ${F(p[6])} ${F(p[7])}`, P.ant, 1.1 * k);
      for (let i = 1; i < 6; i++) { const q = bz(p, 0.25 + i * 0.13); stroke(c, `M${F(q[0])} ${F(q[1])} l${F(-1.6 * k)} ${F(-2.2 * k)} M${F(q[0])} ${F(q[1])} l${F(1.8 * k)} ${F(-1.2 * k)}`, P.ant, 0.8, { a: 0.9 }); }
    }
  }
  function bodyC(c, P, x, y) {
    // fuzzy abdomen + thorax with a cream ruff (moth fluff) at the neck
    shape(c, S(outline([[x - 1, y + 1], [x - 5.4, y - 3], [x - 6, y - 9], [x - 3, y - 13], [x + 3.6, y - 13], [x + 5.6, y - 8], [x + 3.6, y - 2]])), mix(P.fuzz, '#b89a7a', 0.18), { w: 0.6, x: (k) => { for (const yy of [-4, -7.5, -11]) stroke(k, `M${F(x - 6)} ${F(y + yy)} Q${F(x)} ${F(y + yy + 1.8)} ${F(x + 6)} ${F(y + yy)}`, mix(P.fuzz, '#8a6a5a', 0.45), 1, { a: 0.6 }); } });
    const ruff = []; const n = 9;
    for (let i = 0; i <= n; i++) { const a = Math.PI * (1 + i / n); const rr = i % 2 ? 9.4 : 7.4; ruff.push([x + 0.5 + Math.cos(a) * rr, y - 14.5 - Math.sin(a) * rr * 0.55 * -1 + 2, i % 2 ? 1 : 0]); }
    ruff.push([x + 7, y - 11], [x - 6, y - 11]);
    shape(c, S(outline(ruff)), P.fuzz, { w: 0.6 });
  }
  function drawC(c, P, pose, t, o) {
    const { le, dh } = flick(t); const bob = Math.sin(t * 2.4) * 1.7; const blink = t % 3.4 < 0.13; const R0 = 10.5;
    void dh;
    if (pose === 'idle' || pose === 'follow') {
      const f = pose === 'follow'; const flap = t * (f ? 16 : 9);
      c.save(); c.translate(0, bob); c.rotate(f ? -0.2 : 0);
      if (f) motes(c, -16, -16, t, 6, 30, [-1, 0.2], P);
      wingsC(c, P, -2, -13, f ? 0.05 : 0.25, flap + 0.6, false, 0.95);
      bodyC(c, P, 0, 0);
      headC(c, P, 1, -24, R0, le + (f ? -6 : 0), blink ? 'closed' : 'open');
      antennaeC(c, P, 2, -24, R0, t, f ? 3 : 0);
      wingsC(c, P, -1, -11, f ? -0.05 : 0.12, flap, true);
      c.restore(); return;
    }
    if (pose === 'ward') {
      // wings sweep forward around it like a cloak of light and the hit bursts on them
      const u = o.u ?? 0.35; c.save();
      bodyC(c, P, 0, 0);
      headC(c, P, 1, -24, R0 * 1.05, -3, 'squeeze');
      antennaeC(c, P, 2, -24, R0, t, 4);
      c.save(); c.translate(6, -12); c.scale(-1, 1); wingsC(c, P, 0, 0, 0.6, 0, true, 1.05); c.restore();
      c.save(); c.translate(4, -10); c.scale(-1, 1); wingsC(c, P, 0, 0, 0.1, 0, true, 0.95); c.restore();
      burst(c, 30, -18, u, P, 22); c.restore(); return;
    }
    if (pose === 'dim') {
      const Q = dimP(P, 0.45); c.save(); c.translate(0, bob * 0.4 + 2);
      wingsC(c, Q, -2, -12, -0.75, 0, false, 0.9); bodyC(c, Q, 0, 0);
      headC(c, Q, 1, -23, R0 * 0.8, le * 0.3, t % 2.6 < 0.2 ? 'closed' : 'sleepy', 0.8);
      antennaeC(c, Q, 2, -23, R0 * 0.8, t * 0.3, 5);
      wingsC(c, Q, -1, -10, -0.9, 0, true, 0.95);
      c.restore(); return;
    }
    if (pose === 'relight') {
      const u = o.u ?? 0.55; const g = 0.55 + 0.45 * sm(u * 1.6); c.save(); c.translate(0, bob);
      wingsC(c, P, -2, -13, 0.55, 0, false, 1); bodyC(c, P, 0, 0);
      headC(c, P, 1, -24, R0 * (0.8 + 0.2 * g), le, 'wide', 0.9 + 0.1 * g);
      antennaeC(c, P, 2, -24, R0, t, -1);
      wingsC(c, P, -1, -11, 0.45, 0, true, 1.05);
      spark(c, 10, -40 * g, 1.1, 1 - u * 0.5); spark(c, -14, -30, 0.6, 0.8);
      c.restore(); return;
    }
    // feed: wings spread wide, spirals down into the ring, light motes shaken from its wings
    c.save(); c.rotate(0.55);
    glowAt(c, 0, -18, 60, P.glow, 0.45 * (o.glow ?? 1));
    motes(c, -20, -18, t, 10, 40, [-0.8, -0.5], P);
    wingsC(c, P, -2, -13, 0.6, 0.2, false, 1.15); bodyC(c, P, 0, 0);
    headC(c, P, 1, -24, R0 * 1.1, -5, 'happy', 1.05); antennaeC(c, P, 2, -24, R0, t, 2);
    wingsC(c, P, -1, -11, 0.35, 0, true, 1.2);
    c.restore();
  }

  function drawWick(c, V, pose, t, opt = {}) {
    const P = PP[V]; const glowK = opt.glow ?? 1; GK = glowK;
    if (glowK > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, 0, -20, pose === 'dim' ? 22 : 34, P.glow, (pose === 'dim' ? 0.1 : 0.22) * glowK); c.restore(); }
    ({ A: drawA, B: drawB, C: drawC })[V](c, P, pose, t, opt);
  }
  // soft ground shadow + warm light spot it casts (drawn at ground level under the floating Wick)
  function drawShadow(c, V, pose, glowK = 1) {
    GK = 1;
    c.save(); c.scale(1, 0.3); glowAt(c, 0, 0, 16, '#04040c', 0.35); c.restore();
    if (glowK > 0 && pose !== 'dim') { c.save(); c.scale(1, 0.4); glowAt(c, 0, 0, 30, PP[V].glow, 0.18 * glowK); c.restore(); }
  }

  const BB = [-80, -95, 75, 60]; // du bake box around the origin
  const INFO = {
    A: { fantasy: 'A brave little flame living in a stub of wax in a tiny brass chamberstick, the kind Elias carries to light the lamps.',
      moves: 'Floats at his far shoulder, dish level, flame swaying; when he walks the dish tips back and the flame streams. Ward: swings its dish up like a shield, the hit bursts on the brass, then it re-lights with a spark. Ring: tips the dish and pours its light into the ring.',
      crowd: 'Only one with a solid, dark-outlined brass base under the light: reads as an OBJECT-creature (lamp with a face), never as a free-flying Orbit light (lilac, no dish). Apricot flame + brass: no reserved colour; brass is Elias\'s own.',
      cost: '~10 atlas parts: dish (level, shield, tipped), wax x2, flame x3 flicker, 6 faces, pour ribbon (live, like the bolt tail). ~1 day.' },
    B: { fantasy: 'A plump, bare little flame with two flame-ears and stubby flame-arms, a curl of smoke wrapped round it like a scarf.',
      moves: 'Bobs and waves its little arms; walking, the scarf streams behind like smoke. Ward: puffs into a ball and the hit bursts off it. Ring: dives head-first in a streak.',
      crowd: 'Ears + arms give a star-ish flame silhouette and the slate scarf is the one cool mark; risk: it is still a free-floating warm flame, the closest of the three to a Holy Orbit light or a candle flame at a glance (true size: about the size of an Orbit flame\'s core).',
      cost: 'Cheapest: ~8 parts (body x3 flicker, scarf band, scarf tail as a live ribbon, 6 faces). ~0.75 day.' },
    C: { fantasy: 'A little moth that loved the light so much it became one: a fluffy cream moth with a candle-flame head and wings of light.',
      moves: 'Flutters (wings beat) at his shoulder; walking, it beats faster. Ward: wraps its wings forward like a cloak, the hit bursts on them. Ring: spreads its wings and spirals down.',
      crowd: 'Biggest, most creature-like silhouette (wings + antennae); risk: beating wings add motion noise in a crowd and sit near the retired Raven / evolution-gold family if pushed brighter; most to animate.',
      cost: '~14 parts (wing pairs x3 beat frames, body, head x3 flicker, antennae, 6 faces). ~1.5 days.' },
  };
  return { PP, POSES, drawWick, drawShadow, BB, INFO };
})();
