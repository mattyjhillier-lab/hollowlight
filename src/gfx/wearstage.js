// WARDROBE v2 Wear drawer stage: the hero (with the costume) on the REAL rig drawing code, a lantern pool and a small Hollow meadow, drawn on one canvas.
// Browser-only (Canvas2D), render only. Reads nothing from the save: the drawer passes plain validated colours. Stops its own loop when detached.
import { drawHero, drawCompanion, portrait } from './costume.js';

const TAU = Math.PI * 2;
const HEX = /^#[0-9a-f]{6}$/i;
const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mixc = (a, b, t) => { const x = hex2(a), y = hex2(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const rgba = (h, a) => { const c = hex2(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const hexOr = (v, d) => (typeof v === 'string' && HEX.test(v) ? v : d);
function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.2, rgba(col, a * 0.6)); g.addColorStop(0.45, rgba(col, a * 0.24)); g.addColorStop(0.75, rgba(col, a * 0.06)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }

// Painted Hollow ground: drained blue-grey meadow with tufts; colour (green, flowers) returns around (cx, cy) within radius sp.
function paintGround(c, w, h, seed, cx, cy, sp, night) {
  const r = rng(seed);
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, mixc('#3a4864', '#161c2c', night)); g.addColorStop(1, mixc('#566680', '#222c42', night));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, rr = 40 + r() * 120; const gg = c.createRadialGradient(x, y, 0, x, y, rr); const lite = r() > 0.5; gg.addColorStop(0, lite ? 'rgba(130,150,180,.10)' : 'rgba(10,14,28,.14)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  const n = Math.round(w * h / 1250);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, k = (0.55 + r() * 0.7 * (0.6 + y / h * 0.6)) * (w > 500 ? 1 : 0.8), d = Math.hypot(x - cx, (y - cy) * 1.25), col = clamp(1 - d / Math.max(1, sp), 0, 1), kind = r();
    const gcol = mixc('#7d8ca3', '#8fc27a', col), gcol2 = mixc('#4d5b73', '#4f8f5a', col);
    if (kind < 0.72) { c.lineCap = 'round'; for (let b = -1; b <= 1; b++) { c.beginPath(); c.moveTo(x + b * 3 * k, y); c.quadraticCurveTo(x + b * 5 * k, y - 8 * k, x + b * 7 * k + (r() - 0.5) * 3, y - (11 + r() * 5) * k); c.strokeStyle = gcol2; c.lineWidth = 3 * k; c.stroke(); c.strokeStyle = gcol; c.lineWidth = 1.7 * k; c.stroke(); } }
    else if (kind < 0.9) { const pet = col > 0.25 ? ['#ffd9a8', '#ffc2c8', '#f6efe0', '#cfc2ff'][(r() * 4) | 0] : '#6f7f97'; const s = 2.4 * k; c.fillStyle = mixc('#4d5b73', pet, 0.3); for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, 0, TAU); c.fill(); } c.fillStyle = mixc('#8d9bb0', pet, col > 0.25 ? 1 : 0); for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.6, 0, TAU); c.fill(); } c.fillStyle = col > 0.25 ? '#fff0b8' : '#a9b6c8'; c.beginPath(); c.arc(x, y, s * 0.5, 0, TAU); c.fill(); }
    else { c.fillStyle = 'rgba(8,12,24,.25)'; c.beginPath(); c.ellipse(x + 1.5, y + 2, 6 * k, 3.4 * k, 0, 0, TAU); c.fill(); c.fillStyle = mixc('#6b7a92', '#8f9a8a', col * 0.5); c.strokeStyle = '#3d4a62'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, 6 * k, 3.6 * k, 0, 0, TAU); c.fill(); c.stroke(); }
  }
}
function drawTree(c, x, y, s, trunk, canopy, rim) { // chunky cartoon tree: tinted outline, soft rim, round canopy blobs
  const ol = mixc(canopy, '#101428', 0.55);
  c.lineJoin = 'round'; c.fillStyle = ol; c.fillRect(x - 7 * s - 2, y - 40 * s, 14 * s + 4, 40 * s + 2); c.fillStyle = trunk; c.fillRect(x - 7 * s, y - 40 * s, 14 * s, 40 * s);
  const blobs = [[0, -60, 34], [-26, -44, 26], [26, -46, 27], [-12, -86, 26], [14, -82, 28], [0, -104, 22]];
  for (const pass of [0, 1]) for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + bx * s, y + by * s, br * s + (pass ? 0 : 3), 0, TAU); c.fillStyle = pass ? canopy : ol; c.fill(); }
  c.save(); c.globalAlpha = 0.55; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + (bx + 4) * s, y + (by + 5) * s, br * s * 0.9, 0, TAU); c.fillStyle = mixc(canopy, '#0b1020', 0.35); c.fill(); } c.restore();
  c.save(); c.globalAlpha = 0.6; c.strokeStyle = rim; c.lineWidth = 2 * s; for (const [bx, by, br] of blobs.slice(3)) { c.beginPath(); c.arc(x + bx * s, y + by * s, br * s * 0.8, Math.PI * 1.05, Math.PI * 1.55); c.stroke(); } c.restore();
}

const NIGHT = 0.3, SPREAD = 330, STAGE_SCALE = 2.9; // the sandbox defaults (LOCKED as-is)

/** Portrait medallion canvases for the ring shelf: cached per (hero, costume id, flame). Returns a canvas or null (no canvas support). */
const cache = new Map();
export function medallion(hero, item, px, flame) {
  try {
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const key = [hero, item ? item.id : 'plain', px, flame && flame.glow].join('|');
    let v = cache.get(key);
    if (!v) { if (cache.size > 120) cache.clear(); v = portrait(hero, item ? { ...item.pal, motifs: item.motifs, rise: item.rise } : null, px, { dpr, flame }); cache.set(key, v); }
    const out = document.createElement('canvas'); out.width = v.width; out.height = v.height; out.getContext('2d').drawImage(v, 0, 0); return out;
  } catch { return null; }
}

/**
 * host = the stage element. Returns { set(state), bump(), destroy() }. state = { hero, cost: {base..glow, motifs, rise} | null, flame: {glow, core},
 * trail: { style, color }, calm, dim }. Draws at 60 fps only while the host is in the document and the tab is visible; Calm draws one still frame per change.
 */
export function createWearStage(host, state0) {
  const cv = document.createElement('canvas');
  cv.className = 'wr-cv'; cv.setAttribute('aria-hidden', 'true');
  if (typeof cv.getContext !== 'function') return null;
  host.appendChild(cv);
  const cx = cv.getContext('2d');
  let S = { hero: 'wren', cost: null, flame: { glow: '#ffcf7a', core: '#fff1c8' }, trail: { style: 'thread', color: null }, calm: false, dim: false, ...state0 };
  let W = 0, H = 0, DPR = 1, ground = null, gkey = '', raf = 0, dead = false, bloomT = -1e9, seen = false;
  const T0 = performance.now();
  function layout() {
    const r = host.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(10, Math.round(r.width)); H = Math.max(10, Math.round(r.height));
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; gkey = '';
  }
  function bake() {
    const key = `${W}|${H}`; if (key === gkey && ground) return; gkey = key;
    ground = document.createElement('canvas'); ground.width = W * DPR; ground.height = H * DPR;
    const g = ground.getContext('2d'); g.scale(DPR, DPR);
    const hz = H * 0.34, sky = g.createLinearGradient(0, 0, 0, hz + 30); sky.addColorStop(0, mixc('#0f1426', '#06080f', NIGHT * 0.6)); sky.addColorStop(1, mixc('#2b3652', '#141b2c', NIGHT)); g.fillStyle = sky; g.fillRect(0, 0, W, hz + 30);
    glow(g, W * 0.72, hz * 0.4, 120, '#cfd8f0', 0.22); g.fillStyle = 'rgba(230,236,255,.85)'; g.beginPath(); g.arc(W * 0.72, hz * 0.4, 15, 0, TAU); g.fill();
    const r = rng(5); for (let i = 0; i < 12; i++) drawTree(g, (i + 0.3 + r() * 0.4) * W / 11, hz + 12 + r() * 12, 0.62 + r() * 0.28, '#2c3850', mixc('#3a4a66', '#1c2438', NIGHT * 0.5 + r() * 0.2), '#5c6c8a');
    g.save(); g.translate(0, hz); paintGround(g, W, H - hz, 21, W * 0.46, H * 0.5 - hz, SPREAD, NIGHT); g.restore();
    { const px = W * 0.47, py = H * 0.66, rr = Math.max(60, SPREAD * 1.25); const gg = g.createRadialGradient(px, py, 0, px, py, rr); gg.addColorStop(0, 'rgba(126,176,92,.30)'); gg.addColorStop(0.55, 'rgba(110,160,86,.16)'); gg.addColorStop(1, 'rgba(110,160,86,0)'); g.save(); g.scale(1, 0.62); g.translate(0, py * (1 / 0.62 - 1)); g.fillStyle = gg; g.fillRect(px - rr, py - rr, rr * 2, rr * 2); g.restore(); }
    const fog = g.createLinearGradient(0, hz - 16, 0, hz + 46); fog.addColorStop(0, 'rgba(120,140,175,0)'); fog.addColorStop(0.5, 'rgba(120,140,175,.20)'); fog.addColorStop(1, 'rgba(120,140,175,0)'); g.fillStyle = fog; g.fillRect(0, hz - 16, W, 62);
  }
  function frame(force) {
    if (dead) return;
    if (host.isConnected) seen = true; else if (seen) { dead = true; return; } // the screen was replaced: stop the loop
    const now = performance.now(), calm = !!S.calm, t = calm ? 0 : (now - T0) / 1000;
    if (!W || !H) layout();
    bake();
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(ground, 0, 0);
    const hero = S.hero === 'elias' ? 'elias' : 'wren', fl = { glow: hexOr(S.flame && S.flame.glow, '#ffcf7a'), core: hexOr(S.flame && S.flame.core, '#fff1c8') };
    const portrait1 = H > W;
    const hx = W * 0.47, hy = H * (H < 420 ? 0.7 : 0.8), k = STAGE_SCALE * Math.min(1, H / 640) * DPR * (portrait1 ? Math.min(1.25, W / 390 * 1.1) * 0.86 : 1) * (H < 330 ? 0.7 : 1), sx = hx * DPR, sy = hy * DPR;
    const fk = 1 + (calm ? 0 : (Math.sin(t * 9) * 0.5 + Math.sin(t * 5.3) * 0.5) * 0.12 * 0.6);
    const lx = sx + (hero === 'wren' ? 33 : 52) * k * 0.5, ly = sy - 80 * k;
    cx.save(); cx.globalCompositeOperation = 'lighter'; glow(cx, sx, sy - 20 * k, 330 * k * 0.6 * fk, fl.glow, 0.26); glow(cx, lx, ly, 120 * k * fk, fl.glow, 0.3); cx.restore();
    cx.setTransform(k, 0, 0, k, sx, sy);
    cx.save(); cx.translate(hero === 'wren' ? 78 : 0, hero === 'wren' ? 2 : 6); cx.scale(hero === 'wren' ? 0.78 : 1, hero === 'wren' ? 0.78 : 1); drawCompanion(cx, hero, S.cost, { t, calm, flame: fl }); cx.restore();
    cx.save(); cx.beginPath(); drawHero(cx, hero, S.cost, { t, calm, flame: fl }); cx.restore();
    const bt = (now - bloomT) / 700;
    if (!calm && bt >= 0 && bt < 1) { cx.setTransform(1, 0, 0, 1, 0, 0); cx.save(); cx.globalCompositeOperation = 'lighter'; const rr = (40 + bt * 190) * k * 0.5, a = (1 - bt) * (1 - bt) * 0.5; cx.strokeStyle = rgba(fl.glow, a); cx.lineWidth = 10 * k * 0.4 * (1 - bt) + 2; cx.beginPath(); cx.ellipse(sx, sy - 40 * k, rr, rr * 0.5, 0, 0, TAU); cx.stroke(); glow(cx, sx, sy - 50 * k, rr * 1.1, fl.core, a * 0.6); cx.restore(); }
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!calm) { for (let i = 0; i < 14; i++) { const ph = (t * (0.04 + (i % 5) * 0.012) + i * 0.137) % 1, x = hx + Math.sin(i * 12.7 + t * 0.5) * W * 0.3 + (i * 97 % 200) - 100, y = H * 0.86 - ph * H * 0.6; cx.fillStyle = rgba(fl.core, Math.sin(ph * Math.PI) * 0.5); cx.beginPath(); cx.arc(x, y, 1 + (i % 3) * 0.6, 0, TAU); cx.fill(); } }
    const ts = S.trail && S.trail.style, tcol = hexOr(S.trail && S.trail.color, fl.glow);
    if (!calm && ts && ts !== 'thread') { for (let i = 0; i < 14; i++) { const ph = (t * 0.5 + i / 14) % 1, x = lx / DPR - ph * 120 * (k / DPR) * 0.6, y = ly / DPR + Math.sin(ph * 6 + i) * 10 * (k / DPR) * 0.5 + ph * 30; cx.fillStyle = rgba(tcol, (1 - ph) * 0.8); cx.beginPath(); if (ts === 'petal') cx.ellipse(x, y, 3.6, 1.8, ph * 5, 0, TAU); else cx.arc(x, y, ts === 'dots' ? 1.8 : 1.3, 0, TAU); cx.fill(); } }
    else if (!ts || ts === 'thread') { cx.strokeStyle = rgba(fl.glow, 0.55); cx.lineWidth = 2; cx.beginPath(); const x0 = lx / DPR, y0 = ly / DPR; cx.moveTo(x0, y0); for (let i = 1; i <= 24; i++) { const f = i / 24; cx.lineTo(x0 - f * 120 * (k / DPR) * 0.6, y0 + 30 * f + (calm ? 0 : Math.sin(t * 2 + f * 5) * 5 * f)); } cx.stroke(); }
    if (S.dim) { cx.fillStyle = 'rgba(8,10,20,.55)'; cx.fillRect(0, 0, W, H); }
    if (!calm && !force) raf = requestAnimationFrame(() => frame(false));
  }
  const onResize = () => { layout(); if (S.calm) frame(true); };
  window.addEventListener('resize', onResize);
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => onResize()); ro.observe(host); }
  layout(); frame(S.calm);
  return {
    set(next) { S = { ...S, ...next }; cancelAnimationFrame(raf); frame(!!S.calm); },
    bump() { bloomT = performance.now(); if (S.calm) frame(true); },
    destroy() { dead = true; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); if (ro) ro.disconnect(); if (cv.parentNode) cv.parentNode.removeChild(cv); },
  };
}
