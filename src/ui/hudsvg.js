// HUD-1 inline SVG builders (createElementNS only; no innerHTML, no data in markup). Shapes ported from
// docs/mockups/hud-sheet/kit.mjs (Direction A). The wolf emblem is REDRAWN (broad ruff, long muzzle, cool silver,
// amber eyes) because the sheet's wolf read as a fox at 36px. Colours are the Warm Lantern tokens (palette.js / :root).
const NS = 'http://www.w3.org/2000/svg';

export function mk(doc, tag, attrs, kids) {
  const e = doc.createElementNS(NS, tag);
  if (attrs) for (const k of Object.keys(attrs)) e.setAttribute(k, String(attrs[k]));
  if (kids) for (const c of kids) if (c) e.appendChild(c);
  return e;
}

// Shared gradients: ONE hidden <svg> per page; other SVGs reference these ids with url(#hl...).
export function defs(doc) {
  const stops = (arr) => arr.map(([o, c, op]) => mk(doc, 'stop', { offset: o, 'stop-color': c, ...(op != null ? { 'stop-opacity': op } : {}) }));
  const lin = (id, x1, y1, x2, y2, s) => mk(doc, 'linearGradient', { id, x1, y1, x2, y2 }, stops(s));
  const rad = (id, s) => mk(doc, 'radialGradient', { id }, stops(s));
  const svg = mk(doc, 'svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false', style: 'position:absolute' }, [mk(doc, 'defs', null, [
    lin('hlPlate', 0, 0, 0, 1, [[0, '#2d2520'], [1, '#17120f']]),
    lin('hlBrass', 0, 0, 1, 1, [[0, '#f3d99a'], [0.5, '#c79a4c'], [1, '#7a5a28']]),
    lin('hlFlame', 0, 1, 0, 0, [[0, '#e0601b'], [0.55, '#ffab3a'], [1, '#fff0a0']]),
    lin('hlEmber', 0, 1, 0, 0, [[0, '#8f2a14'], [0.6, '#e8561f'], [1, '#ff9a5a']]),
    lin('hlWolf', 0, 0, 0.3, 1, [[0, '#f4fbff'], [0.55, '#b6dcf2'], [1, '#6f9cc4']]),
    lin('hlRaven', 0, 0, 0.3, 1, [[0, '#ffe8f0'], [0.5, '#d894c0'], [1, '#7a45a8']]),
    lin('hlBark', 0, 0, 1, 0, [[0, '#8f2a1d'], [0.6, '#d9482f'], [1, '#ff8a5a']]),
    rad('hlGlowF', [[0, '#ffb23a', 0.95], [0.25, '#ffb23a', 0.5], [0.55, '#ffb23a', 0.14], [1, '#ffb23a', 0]]),
    rad('hlGlowC', [[0, '#fff3dc', 0.9], [0.3, '#ffe0a0', 0.4], [1, '#ffe0a0', 0]]),
    rad('hlGlowG', [[0, '#ffd36b', 0.95], [0.3, '#ffd36b', 0.45], [1, '#ffd36b', 0]]),
  ])]);
  return svg;
}

const P = (doc, d, attrs) => mk(doc, 'path', { d, ...attrs });
const body = (doc, d, fill, ol, w = 6) => [P(doc, d, { fill: ol, stroke: ol, 'stroke-width': w, 'stroke-linejoin': 'round' }), P(doc, d, { fill })];
const rim = (doc, d) => P(doc, d, { fill: 'none', stroke: '#fff', 'stroke-width': 1.4, 'stroke-opacity': 0.5, 'stroke-linejoin': 'round' });

// Emblems in a -24..24 box. kind: wolf | raven | orb | bolt | chain | sanctuary | coin
export function emblem(doc, kind, size = 48) {
  const g = mk(doc, 'g', { transform: `scale(${(size / 48).toFixed(3)})` });
  const add = (...n) => n.flat().forEach((x) => x && g.appendChild(x));
  if (kind === 'wolf') {
    // front-facing wolf: spiky cheek ruff, long pale muzzle, slanted amber eyes, cool silver coat (not fox orange)
    const d = 'M-18 -26 L-8 -13 C-4 -15 4 -15 8 -13 L18 -26 L21 -6 L27 3 L20 7 L22 15 L12 14 L7 23 L0 26 L-7 23 L-12 14 L-22 15 L-20 7 L-27 3 L-21 -6Z';
    add(body(doc, d, 'url(#hlWolf)', '#27465f'),
      P(doc, 'M-16 -19 L-10 -12 L-16 -8Z M16 -19 L10 -12 L16 -8Z', { fill: '#4a6f94' }),
      mk(doc, 'ellipse', { cx: 0, cy: 12, rx: 8.5, ry: 11, fill: '#f2f9fd' }),
      P(doc, 'M-14 -4 Q-9 -9 -3 -3 Q-9 -1 -14 -4Z M14 -4 Q9 -9 3 -3 Q9 -1 14 -4Z', { fill: '#ffc766', stroke: '#27465f', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }),
      mk(doc, 'circle', { cx: -7.5, cy: -4, r: 1.7, fill: '#27465f' }), mk(doc, 'circle', { cx: 7.5, cy: -4, r: 1.7, fill: '#27465f' }),
      mk(doc, 'ellipse', { cx: 0, cy: 5.6, rx: 4, ry: 2.8, fill: '#1d2a36' }),
      P(doc, 'M0 8 V15 M-5 17 Q0 21 5 17', { fill: 'none', stroke: '#27465f', 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
      rim(doc, d));
  } else if (kind === 'raven') {
    const d = 'M-23 8 C-23 -4 -10 -13 3 -11 C7 -17 14 -20 20 -16 L27 -13 L20 -9 C20 2 11 14 -2 14 L-9 23 L-12 12 C-18 12 -23 12 -23 8Z';
    add(body(doc, d, 'url(#hlRaven)', '#432a72'),
      P(doc, 'M-14 4 C-10 -12 4 -24 14 -28 C12 -14 6 -2 -4 8Z', { fill: '#a867c8', stroke: '#432a72', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }),
      P(doc, 'M26 -13 L14 -16 L14 -9Z', { fill: '#ffb84a', stroke: '#8a5a1a', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
      mk(doc, 'circle', { cx: 9, cy: -12, r: 3, fill: '#2b1c20' }), mk(doc, 'circle', { cx: 8, cy: -13, r: 1.1, fill: '#fff' }), rim(doc, d));
  } else if (kind === 'orb') {
    add(mk(doc, 'ellipse', { rx: 20, ry: 9, fill: 'none', stroke: '#6a4a1a', 'stroke-width': 7 }), mk(doc, 'ellipse', { rx: 20, ry: 9, fill: 'none', stroke: '#fff4d2', 'stroke-width': 3 }));
    for (const [x, y] of [[-20, 0], [20, 0], [0, 9]]) {
      add(mk(doc, 'g', { transform: `translate(${x},${y - 6})` }, [
        P(doc, 'M0 -12 C-6 -4 -6 4 0 6 C6 4 6 -4 0 -12Z', { fill: '#ffc766', stroke: '#6a4a1a', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }),
        P(doc, 'M0 -5 C-2 -2 -2 1 0 2 C2 1 2 -2 0 -5Z', { fill: '#fff' })]));
    }
  } else if (kind === 'bolt') {
    const d = 'M6 -24 L-13 3 L-2 3 L-8 24 L15 -4 L3 -4Z';
    add(body(doc, d, '#7ff0ff', '#1f5f80', 7), P(doc, 'M4 -18 L-7 -2 L0 -2Z', { fill: '#eaffff', opacity: 0.85 }), rim(doc, d));
  } else if (kind === 'chain') {
    const d = 'M-4 -22 L-16 4 H-4 L-8 22 L16 -6 H4 L10 -22Z';
    add(body(doc, d, '#e8f4ff', '#3a5a8a', 7), rim(doc, d),
      mk(doc, 'circle', { cx: -15, cy: -14, r: 3.6, fill: '#eaf6ff', stroke: '#3a5a8a', 'stroke-width': 1.6 }), mk(doc, 'circle', { cx: 15, cy: 14, r: 3.6, fill: '#eaf6ff', stroke: '#3a5a8a', 'stroke-width': 1.6 }));
  } else if (kind === 'sanctuary') {
    // Elias: a halo of consecrated light (ring + eight rays + a small flame)
    const rays = []; for (let i = 0; i < 8; i++) rays.push(mk(doc, 'path', { d: 'M0 -20 L0 -14', transform: `rotate(${i * 45})`, stroke: '#ffc766', 'stroke-width': 3.4, 'stroke-linecap': 'round' }));
    add(rays, mk(doc, 'circle', { r: 11, fill: 'none', stroke: '#6a4a1a', 'stroke-width': 7 }), mk(doc, 'circle', { r: 11, fill: 'none', stroke: '#fff4d2', 'stroke-width': 3.2 }),
      P(doc, 'M0 -7 C-4 -2 -5 3 0 5 C5 3 4 -2 0 -7Z', { fill: '#ffab3a', stroke: '#9a3a0c', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }));
  } else if (kind === 'coin') {
    add(mk(doc, 'circle', { r: 20, fill: '#5a3d1a' }), mk(doc, 'circle', { r: 17, fill: 'url(#hlBrass)' }), mk(doc, 'circle', { r: 11, fill: 'none', stroke: '#5a3d1a', 'stroke-width': 2, opacity: 0.55 }),
      P(doc, 'M-4 -5 H4 M-4 0 H4 M-4 5 H4', { stroke: '#5a3d1a', 'stroke-width': 2.4, opacity: 0.6, fill: 'none' }));
  }
  return g;
}
export const EMBLEM_OF = { ghost_wolves: 'wolf', raven_flock: 'raven', holy_orbit: 'orb', spirit_bolts: 'bolt', chain_lightning: 'chain', rally_pack: 'wolf', pack_howl: 'wolf', sanctuary: 'sanctuary', candle_wheel: 'sanctuary' };
export const ROLE_COL = { wolf: '#ffb457', raven: '#d894c0', orb: '#ffc766', bolt: '#7ff0ff', chain: '#e8f4ff', sanctuary: '#ffc766' };

// Lantern (brass cage). The flame group (returned as .flame / .core) is scaled + recoloured by the HUD each tick.
export function lantern(doc) {
  const flame = mk(doc, 'g', { transform: 'translate(0,13) scale(0.7)' });
  const fl = P(doc, 'M0 -44 C-6 -28 -15 -20 -14 -8 C-13 -2 -7 2 0 2 C7 2 13 -2 14 -8 C15 -20 6 -28 0 -44Z', { fill: 'url(#hlFlame)', stroke: '#9a3a0c', 'stroke-width': 2.6, 'stroke-linejoin': 'round' });
  const core = P(doc, 'M0 -22 C-4 -14 -8 -10 -7 -4 C-6 0 -3 1 0 1 C3 1 6 0 7 -4 C8 -10 4 -14 0 -22Z', { fill: '#fff6c8', opacity: 0.95 });
  flame.append(fl, core);
  const cage = 'M-15 -16 L15 -16 L13 14 C13 18 -13 18 -13 14Z';
  const glow = mk(doc, 'circle', { r: 44, fill: 'url(#hlGlowF)', opacity: 0.9 });
  const svg = mk(doc, 'svg', { viewBox: '-26 -42 52 70', 'aria-hidden': 'true' }, [
    glow,
    P(doc, 'M-8 -27 C-8 -36 8 -36 8 -27', { fill: 'none', stroke: '#5a3d1a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    P(doc, 'M-8 -27 C-8 -36 8 -36 8 -27', { fill: 'none', stroke: 'url(#hlBrass)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    P(doc, 'M-13 -23 L13 -23 L17 -16 L-17 -16Z', { fill: 'url(#hlBrass)', stroke: '#5a3d1a', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    P(doc, cage, { fill: '#ffd98a', 'fill-opacity': 0.3, stroke: '#5a3d1a', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }),
    flame,
    P(doc, cage, { fill: 'none', stroke: 'url(#hlBrass)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
    P(doc, 'M-14 17 L14 17 L12 23 L-12 23Z', { fill: 'url(#hlBrass)', stroke: '#5a3d1a', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
  ]);
  return { svg, flame, flameBody: fl, core, glow };
}

// Moon arc: returns { svg, moon, lit } ; the HUD sets moon transform and lit dasharray (pathLength 100).
export function moonArc(doc, w, rise, g) {
  const x0 = -g.w / 2, x1 = g.w / 2, yb = 0;
  const d = `M${x0} ${yb} A${g.R} ${g.R} 0 0 1 ${x1} ${yb}`;
  const pad = 22, H = rise + pad + 10;
  const moon = mk(doc, 'g');
  moon.append(mk(doc, 'circle', { r: 31, fill: 'url(#hlGlowC)', opacity: 0.8 }), mk(doc, 'circle', { r: 12, fill: '#fff3d2', stroke: '#8d6c34', 'stroke-width': 2 }),
    mk(doc, 'circle', { cx: -3.6, cy: 1.8, r: 3.6, fill: '#e6d4a6' }), mk(doc, 'circle', { cx: 3.6, cy: -4.8, r: 2.4, fill: '#e6d4a6' }));
  const lit = P(doc, d, { fill: 'none', stroke: '#ffd7a0', 'stroke-opacity': 0.9, 'stroke-width': 3, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '0 100' });
  const sun = mk(doc, 'g', { transform: `translate(${x1},${yb + 1})` }, [
    mk(doc, 'circle', { r: 15, fill: 'url(#hlGlowG)', opacity: 0.8 }),
    P(doc, 'M-9 4 A9 9 0 0 1 9 4Z', { fill: '#ffd36b', stroke: '#8a5a12', 'stroke-width': 1.6 }), P(doc, 'M-14 4 H14', { stroke: '#ffd36b', 'stroke-width': 2, 'stroke-linecap': 'round' })]);
  const root = mk(doc, 'g', { transform: `translate(${w / 2},${pad + 4 + 0})` });
  // arc coordinates are relative to the arc's top y0=-rise at centre; shift so the arc's top is at y=pad
  const arcG = mk(doc, 'g', { transform: `translate(0,${rise})` }, [
    P(doc, d, { fill: 'none', stroke: '#0c0908', 'stroke-opacity': 0.7, 'stroke-width': 9, 'stroke-linecap': 'round' }),
    P(doc, d, { fill: 'none', stroke: '#8d6c34', 'stroke-width': 2.4, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round' }),
    lit, sun, moon]);
  root.appendChild(arcG);
  const svg = mk(doc, 'svg', { viewBox: `0 0 ${w} ${H}`, 'aria-hidden': 'true' }, [root]);
  return { svg, moon, lit };
}

// Frost texture, baked once to a data URL on a small canvas (needs a browser; returns '' elsewhere). Mottled icy edge +
// crystals in the four corners. Static: the HUD only changes the element's opacity (no filter, no per-frame work).
export function bakeFrost(doc) {
  try {
    const W = 320, H = 180, c = doc.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    if (!x) return '';
    let s = 41; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    // edge-only veil (centre and mid-screen stay clear): thin linear falloff from each edge, strongest in the corners
    const band = (x0, y0, x1, y1, a) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(223,241,250,${a})`); g.addColorStop(1, 'rgba(223,241,250,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
    band(0, 0, 0, H * 0.16, 0.34); band(0, H, 0, H * 0.84, 0.34); band(0, 0, W * 0.1, 0, 0.34); band(W, 0, W * 0.9, 0, 0.34);
    for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, H * 0.42); g.addColorStop(0, 'rgba(223,241,250,0.4)'); g.addColorStop(1, 'rgba(223,241,250,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    // mottling: many soft blobs, denser toward the edge
    for (let i = 0; i < 420; i++) {
      const px = r() * W, py = r() * H;
      const e = Math.max(Math.abs(px / W - 0.5), Math.abs(py / H - 0.5)) * 2; // 0 centre .. 1 edge
      if (e < 0.72 || r() > e * e * e) continue;
      const rad = 3 + r() * 11;
      const g = x.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, `rgba(240,250,255,${0.1 + r() * 0.16})`); g.addColorStop(1, 'rgba(240,250,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, 6.283); x.fill();
    }
    // corner crystals
    const crystal = (cx, cy, a, l) => {
      const wd = l * 0.18, p = (t, o) => [cx + Math.cos(a + t) * l * o, cy + Math.sin(a + t) * l * o];
      x.beginPath(); x.moveTo(cx, cy);
      x.lineTo(cx + Math.cos(a - 0.2) * l * 0.5 + Math.cos(a + 1.57) * wd, cy + Math.sin(a - 0.2) * l * 0.5 + Math.sin(a + 1.57) * wd);
      x.lineTo(...p(0, 1));
      x.lineTo(cx + Math.cos(a + 0.2) * l * 0.5 - Math.cos(a + 1.57) * wd, cy + Math.sin(a + 0.2) * l * 0.5 - Math.sin(a + 1.57) * wd);
      x.closePath(); x.fillStyle = 'rgba(232,246,255,0.5)'; x.fill(); x.strokeStyle = 'rgba(159,196,214,0.6)'; x.lineWidth = 1; x.stroke();
    };
    const u = H / 360;
    for (const [cx, cy, a0] of [[0, 0, 0.78], [W, 0, 2.36], [0, H, -0.78], [W, H, -2.36]]) for (let i = 0; i < 5; i++) crystal(cx + (r() - 0.5) * 20 * u, cy + (r() - 0.5) * 20 * u, a0 + (r() - 0.5) * 1.3, (24 + r() * 38) * u);
    return c.toDataURL('image/png');
  } catch { return ''; }
}

// Standalone ability emblem (an <svg>) for the touch ability button.
export function abilityEmblem(doc, id) {
  return mk(doc, 'svg', { viewBox: '-28 -28 56 56', 'aria-hidden': 'true' }, [emblem(doc, EMBLEM_OF[id] || 'sanctuary', 52)]);
}
