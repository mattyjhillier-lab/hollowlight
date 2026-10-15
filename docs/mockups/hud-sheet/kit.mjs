// HUD sheet #1 shared kit: tokens, emblems, and HUD components (static SVG mock-ups, NOT game code).
// Reuses ../cartoon-polished (core.mjs T/rnd/nid, icons.mjs ic/orbit, creatures.mjs art) read-only.
import { T, FONT, rnd, nid } from '../cartoon-polished/core.mjs';
import { ic, orbit } from '../cartoon-polished/icons.mjs';
export { T, FONT, rnd, nid, ic, orbit };

// ---------- tokens (shared Warm Lantern base) ----------
export const K = {
  plate: '#1c1714', plate2: '#2b231d', brass: '#d8b26a', brassD: '#8d6c34', cream: '#fff3dc', creamD: '#cdbf9f', muted: '#b9ab92',
  flame: ['#fff3b0', '#ffab3a', '#e0601b'], thread: ['#fff8e6', '#ffe0a0', '#ffb55a'], ink: '#140f0c',
  gold: '#ffd36b', goldD: '#8a5a12', danger: '#ff5a3c', rose: '#ffb8c6', roseD: '#3a1520', lilac: '#b79cff', frost: '#dff1fa', frostD: '#8fb6c9',
  bless: '#efe2c0', blessD: '#7d725a', stirs: '#c9a24a',
};
export const REC = { on: false, list: [] };
export const num = (s, x, y, size, o = {}) => (REC.on && REC.list.push(['num', size, s]), 0) || T(s, x, y, { s: size, f: FONT.num, c: o.c || K.cream, st: o.st || K.ink, sw: o.sw ?? Math.max(3, size * 0.16), a: o.a, op: o.op, ls: o.ls });
export const txt = (s, x, y, size, o = {}) => (REC.on && REC.list.push(['word', size, s]), 0) || T(s, x, y, { s: size, f: o.f || FONT.ui, w: o.w || 700, c: o.c || K.cream, st: o.noStroke ? undefined : K.ink, sw: o.sw ?? 2.6, a: o.a, op: o.op, i: o.i, ls: o.ls });

// contrast helpers (WCAG)
const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = h2r(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const blend = (fg, bg, a) => { const f = h2r(fg), b = h2r(bg); return '#' + f.map((v, i) => Math.round(v * a + b[i] * (1 - a)).toString(16).padStart(2, '0')).join(''); };

// ---------- shared defs (fixed ids, prefix h) ----------
export const HDEFS = `<defs>
<linearGradient id="hPlate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d2520"/><stop offset="1" stop-color="#17120f"/></linearGradient>
<linearGradient id="hBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d99a"/><stop offset=".5" stop-color="#c79a4c"/><stop offset="1" stop-color="#7a5a28"/></linearGradient>
<linearGradient id="hFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e0601b"/><stop offset=".55" stop-color="#ffab3a"/><stop offset="1" stop-color="#fff0a0"/></linearGradient>
<linearGradient id="hEmber" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8f2a14"/><stop offset=".6" stop-color="#e8561f"/><stop offset="1" stop-color="#ff9a5a"/></linearGradient>
<linearGradient id="hThread" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb55a"/><stop offset=".6" stop-color="#ffe0a0"/><stop offset="1" stop-color="#fff8e6"/></linearGradient>
<linearGradient id="hGoldCard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43361d"/><stop offset=".5" stop-color="#2a2014"/><stop offset="1" stop-color="#17110a"/></linearGradient>
<linearGradient id="hCard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34302e"/><stop offset=".5" stop-color="#241f1c"/><stop offset="1" stop-color="#16120f"/></linearGradient>
<linearGradient id="hBless" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2820"/><stop offset="1" stop-color="#1a1713"/></linearGradient>
<linearGradient id="hBark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f2a1d"/><stop offset=".6" stop-color="#d9482f"/><stop offset="1" stop-color="#ff8a5a"/></linearGradient>
<linearGradient id="hTopFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0a08" stop-opacity=".55"/><stop offset="1" stop-color="#0d0a08" stop-opacity="0"/></linearGradient>
<linearGradient id="hBotFade" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0d0a08" stop-opacity=".5"/><stop offset="1" stop-color="#0d0a08" stop-opacity="0"/></linearGradient>
<radialGradient id="hGlowF"><stop offset="0" stop-color="#ffb23a" stop-opacity=".95"/><stop offset=".25" stop-color="#ffb23a" stop-opacity=".5"/><stop offset=".55" stop-color="#ffb23a" stop-opacity=".14"/><stop offset="1" stop-color="#ffb23a" stop-opacity="0"/></radialGradient>
<radialGradient id="hGlowC"><stop offset="0" stop-color="#fff3dc" stop-opacity=".9"/><stop offset=".3" stop-color="#ffe0a0" stop-opacity=".4"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
<radialGradient id="hGlowG"><stop offset="0" stop-color="#ffd36b" stop-opacity=".95"/><stop offset=".3" stop-color="#ffd36b" stop-opacity=".45"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
<radialGradient id="hGlowR"><stop offset="0" stop-color="#ff8aa0" stop-opacity=".85"/><stop offset=".35" stop-color="#ff8aa0" stop-opacity=".3"/><stop offset="1" stop-color="#ff8aa0" stop-opacity="0"/></radialGradient>
<radialGradient id="hGlowCy"><stop offset="0" stop-color="#7ff0ff" stop-opacity=".85"/><stop offset=".35" stop-color="#7ff0ff" stop-opacity=".3"/><stop offset="1" stop-color="#7ff0ff" stop-opacity="0"/></radialGradient>
<radialGradient id="hGlowL"><stop offset="0" stop-color="#b79cff" stop-opacity=".85"/><stop offset=".35" stop-color="#b79cff" stop-opacity=".3"/><stop offset="1" stop-color="#b79cff" stop-opacity="0"/></radialGradient>
<radialGradient id="hFrostV" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></radialGradient>
<filter id="hSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="hSoft6" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="hDrop" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="2.4" flood-color="#000" flood-opacity=".55"/></filter>
<filter id="hGlowFx" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="hFrostN" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".022 .03" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .87  0 0 0 0 .95  0 0 0 0 .98  0 0 0 3.2 -1.15"/></filter>
</defs>`;

// ---------- primitives ----------
export const shade = (hex, f) => '#' + h2r(hex).map((v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('');
export function plate(x, y, w, h, r = 14, o = {}) {
  const op = o.op ?? 0.8, edge = o.edge || K.brass;
  return `<g><rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="${r}" fill="#000" opacity=".35" filter="url(#hSoft)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#hPlate)" fill-opacity="${op}" stroke="${edge}" stroke-opacity="${o.eo ?? 0.85}" stroke-width="${o.sw ?? 2}"/><path d="M${x + r} ${y + 2.4} H${x + w - r}" stroke="#fff" stroke-opacity=".14" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
const gradIn = (stops, vertical = true) => { const id = nid('gr'); return [id, `<linearGradient id="${id}" x1="${vertical ? 0 : 0.1}" y1="0" x2="${vertical ? 0.3 : 0.9}" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`]; };
// outlined, gradient-filled path with tinted outline (L2) and rim light (H2)
function body(d, stops, ol, o = {}) {
  const [id, def] = gradIn(stops);
  return `${def}<path d="${d}" fill="${ol}" stroke="${ol}" stroke-width="${o.w ?? 7}" stroke-linejoin="round"/><path d="${d}" fill="url(#${id})"/>${o.x || ''}<path d="${d}" fill="none" stroke="${o.rim || '#fff'}" stroke-width="1.5" stroke-opacity=".5" stroke-linejoin="round"/>`;
}

// ---------- emblems in a -24..24 box (L2 outline, H2 gradient, rim) ----------
export function emblem(kind, size = 48, o = {}) {
  const s = size / 48; let g = '';
  if (kind === 'wolf') {
    const d = 'M-19 -25 L-8 -12 C-4 -14 4 -14 8 -12 L19 -25 L22 0 C22 10 13 18 5 22 L0 26 L-5 22 C-13 18 -22 10 -22 0Z';
    g = body(d, ['#fffaf0', '#ffd99a', '#f09a40'], '#8a4a18', { x: `<path d="M-17 -19 L-10 -11 L-17 -6Z M17 -19 L10 -11 L17 -6Z" fill="#e8894a" opacity=".9"/><ellipse cx="0" cy="13" rx="8.5" ry="9.5" fill="#fff8e8"/><path d="M-9 -4 q4 -4 8 0 M1 -4 q4 -4 8 0" stroke="#8a4a18" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0"/><ellipse cx="-9.5" cy="1" rx="3.6" ry="3.2" fill="#3a2418"/><ellipse cx="9.5" cy="1" rx="3.6" ry="3.2" fill="#3a2418"/><circle cx="-10.6" cy="-0.2" r="1.2" fill="#fff"/><circle cx="8.4" cy="-0.2" r="1.2" fill="#fff"/><ellipse cx="0" cy="19.5" rx="3.6" ry="2.6" fill="#3a2418"/><path d="M0 22 V25" stroke="#3a2418" stroke-width="1.6"/>` });
  } else if (kind === 'raven') {
    const d = 'M-23 8 C-23 -4 -10 -13 3 -11 C7 -17 14 -20 20 -16 L27 -13 L20 -9 C20 2 11 14 -2 14 L-9 23 L-12 12 C-18 12 -23 12 -23 8Z';
    g = body(d, ['#ffe8f0', '#d894c0', '#7a45a8'], '#432a72', { x: `<path d="M-14 4 C-10 -12 4 -24 14 -28 C12 -14 6 -2 -4 8Z" fill="#a867c8" stroke="#432a72" stroke-width="1.6" stroke-linejoin="round"/><path d="M26 -13 L14 -16 L14 -9Z" fill="#ffb84a" stroke="#8a5a1a" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9" cy="-12" r="3" fill="#2b1c20"/><circle cx="8" cy="-13" r="1.1" fill="#fff"/>` });
  } else if (kind === 'orb') g = orbit({ c: '#fff4d2', hi: '#ffc766', ol: '#6a4a1a' }).replace('<ellipse rx="19" ry="8"', '<ellipse rx="20" ry="9"');
  else if (kind === 'bolt') g = ic('bolt', { c: '#7ff0ff', hi: '#eaffff', ol: '#1f5f80', s: 1.1 });
  else if (kind === 'chain') g = ic('zap', { c: '#e8f4ff', hi: '#ffffff', ol: '#3a5a8a', s: 1.0 }) + `<circle cx="-14" cy="-14" r="3.6" fill="#eaf6ff" stroke="#3a5a8a" stroke-width="1.6"/><circle cx="14" cy="14" r="3.6" fill="#eaf6ff" stroke="#3a5a8a" stroke-width="1.6"/>`;
  else if (kind === 'heart') g = ic('heart', { c: '#ff8fa3', hi: '#fff', ol: '#6a2434' });
  else if (kind === 'magnet') g = ic('magnet', { c: '#b79cff', hi: '#f0eaff', ol: '#4a3a8a' });
  else if (kind === 'coin') g = ic('coin', { c: '#d8b26a', hi: '#fff0c0', ol: '#5a3d1a' });
  else if (kind === 'gem') g = `<path d="M0 -20 L14 -4 L0 22 L-14 -4Z" fill="#6a3a10" stroke="#6a3a10" stroke-width="6" stroke-linejoin="round"/><path d="M0 -20 L14 -4 L0 22 L-14 -4Z" fill="#ffc35c"/><path d="M0 -20 L14 -4 L0 -4Z" fill="#fff6d8"/><path d="M0 -4 L14 -4 L0 22Z" fill="#e8892c"/>`;
  return `<g transform="translate(${o.x || 0},${o.y || 0}) scale(${s})"${o.op != null ? ` opacity="${o.op}"` : ''}>${g}</g>`;
}
export const ROLE = { wolf: '#ffb457', raven: '#d894c0', orb: '#ffc766', bolt: '#7ff0ff', chain: '#e8f4ff' };
export const NAMES = { wolf: 'Ghost Wolves', raven: 'Raven Flock', orb: 'Holy Orbit', bolt: 'Spirit Bolts', chain: 'Chain Lightning' };

// ---------- lantern flame HP: the flame IS the HP ----------
export function lantern(x, y, s, hp, o = {}) {
  const low = hp < 0.35, k = 0.7 * (0.42 + 0.58 * hp);
  const fl = 'M0 -44 C-6 -28 -15 -20 -14 -8 C-13 -2 -7 2 0 2 C7 2 13 -2 14 -8 C15 -20 6 -28 0 -44Z', core = 'M0 -22 C-4 -14 -8 -10 -7 -4 C-6 0 -3 1 0 1 C3 1 6 0 7 -4 C8 -10 4 -14 0 -22Z';
  const frost = low ? `<path d="M-14 -14 l5 6 l-4 1 l5 7 M14 -14 l-5 6 l4 1 l-5 7 M-12 12 l6 -4 M12 12 l-6 -4" stroke="#eaf8ff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/><path d="M-15 -16 L15 -16 L13 14" fill="none" stroke="${K.frost}" stroke-width="1.4" opacity=".55"/>` : '';
  return `<g transform="translate(${x},${y}) scale(${s})"><circle r="${30 * (0.5 + 0.5 * hp) + 14}" fill="url(#hGlowF)" opacity="${low ? 0.5 : o.glow ?? 0.9}"/>
<path d="M-8 -27 C-8 -36 8 -36 8 -27" fill="none" stroke="#5a3d1a" stroke-width="5" stroke-linecap="round"/><path d="M-8 -27 C-8 -36 8 -36 8 -27" fill="none" stroke="url(#hBrass)" stroke-width="2.4" stroke-linecap="round"/>
<path d="M-13 -23 L13 -23 L17 -16 L-17 -16Z" fill="url(#hBrass)" stroke="#5a3d1a" stroke-width="2" stroke-linejoin="round"/>
<path d="M-15 -16 L15 -16 L13 14 C13 18 -13 18 -13 14Z" fill="#ffd98a" fill-opacity=".3" stroke="#5a3d1a" stroke-width="2.4" stroke-linejoin="round"/>
<g transform="translate(0,13) scale(${k.toFixed(3)})"><path d="${fl}" fill="url(#${low ? 'hEmber' : 'hFlame'})" stroke="${low ? '#5a1a0c' : '#9a3a0c'}" stroke-width="2.6" stroke-linejoin="round"/><path d="${core}" fill="${low ? '#ffb48a' : '#fff6c8'}" opacity=".95"/></g>
<path d="M-15 -16 L15 -16 L13 14 C13 18 -13 18 -13 14Z" fill="none" stroke="url(#hBrass)" stroke-width="1.4" stroke-opacity=".9" stroke-linejoin="round"/>
<path d="M-14 17 L14 17 L12 23 L-12 23Z" fill="url(#hBrass)" stroke="#5a3d1a" stroke-width="2" stroke-linejoin="round"/>${frost}</g>`;
}

// ---------- spirit thread (XP): rail + thread + bead + notches (+ knot cap) ----------
export function thread(x, y, w, frac, h = 6, o = {}) {
  const fw = Math.max(h, w * frac), id = nid('tc');
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#0c0908" fill-opacity="${o.railOp ?? 0.8}" stroke="${K.brassD}" stroke-opacity=".7" stroke-width="1.2"/>`;
  s += `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath>`;
  s += `<g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${fw}" height="${h}" fill="url(#hThread)"/><rect x="${x}" y="${y}" width="${fw}" height="${Math.max(1, h * 0.34)}" fill="#fff" opacity=".5"/>`;
  for (let i = 1; i < 10; i++) { const tx = x + (w * i) / 10; s += `<rect x="${tx - 0.6}" y="${y + h * 0.55}" width="1.2" height="${h * 0.45}" fill="${tx < x + fw ? '#8a5a1a' : K.creamD}" opacity=".5"/>`; }
  s += '</g>';
  const bx = x + fw - h * 0.2;
  if (o.bead !== false) s += `<circle cx="${bx}" cy="${y + h / 2}" r="${h * 2.6}" fill="url(#hGlowC)" opacity=".9"/><circle cx="${bx}" cy="${y + h / 2}" r="${h * 0.68}" fill="#fff" stroke="#ffb55a" stroke-width="1.4"/>`;
  return s;
}
export function knot(x, y, r, lv, o = {}) {
  return `<g transform="translate(${x},${y})"><circle r="${r + 3}" fill="url(#hGlowC)" opacity="${o.flare ? 1 : 0.35}"/><circle r="${r}" fill="url(#hPlate)" stroke="${K.brass}" stroke-width="2.2"/><circle r="${r - 3.4}" fill="none" stroke="${K.brassD}" stroke-width="1"/>${num(String(lv), 0, Math.max(16, r * 1.05) * 0.34, Math.max(16, r * 1.05), { a: 'middle', sw: 3 })}</g>`;
}

// ---------- moon arc timer ----------
export function moonArc(cx, y0, w, rise, frac, o = {}) {
  const R = (w * w / 4 + rise * rise) / (2 * rise), ccy = y0 - rise + R, th0 = Math.asin(w / 2 / R);
  const pt = (t) => { const a = -th0 + 2 * th0 * t; return [cx + R * Math.sin(a), ccy - R * Math.cos(a)]; };
  const [x0, ya] = pt(0), [x1, yb] = pt(1), [mx, my] = pt(frac), [px, py] = pt(frac);
  const dim = o.dim ? 0.55 : 1;
  let s = `<g opacity="${dim}"><path d="M${x0} ${ya} A${R} ${R} 0 0 1 ${x1} ${yb}" fill="none" stroke="#0c0908" stroke-opacity=".7" stroke-width="${o.tk ?? 9}" stroke-linecap="round"/><path d="M${x0} ${ya} A${R} ${R} 0 0 1 ${x1} ${yb}" fill="none" stroke="${K.brassD}" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round"/><path d="M${x0} ${ya} A${R} ${R} 0 0 1 ${px.toFixed(1)} ${py.toFixed(1)}" fill="none" stroke="#ffd7a0" stroke-opacity=".9" stroke-width="3" stroke-linecap="round"/>`;
  // dawn sun at the right end (gold reserved for the dawn sun)
  s += `<g transform="translate(${x1},${yb + 1})"><circle r="${o.sr ?? 15}" fill="url(#hGlowG)" opacity=".8"/><path d="M-9 4 A9 9 0 0 1 9 4Z" fill="${K.gold}" stroke="#8a5a12" stroke-width="1.6"/><path d="M-14 4 H14" stroke="${K.gold}" stroke-width="2" stroke-linecap="round"/></g>`;
  const mr = o.mr ?? 12;
  s += `<g transform="translate(${mx.toFixed(1)},${my.toFixed(1)})"><circle r="${mr * 2.6}" fill="url(#hGlowC)" opacity=".8"/><circle r="${mr}" fill="#fff3d2" stroke="#8d6c34" stroke-width="2"/><circle cx="${mr * 0.38}" cy="${-mr * 0.25}" r="${mr * 0.82}" fill="#2a2320" opacity="0"/><circle cx="${-mr * 0.3}" cy="${mr * 0.15}" r="${mr * 0.3}" fill="#e6d4a6"/><circle cx="${mr * 0.3}" cy="${-mr * 0.4}" r="${mr * 0.2}" fill="#e6d4a6"/></g></g>`;
  return s;
}
export const digits = (s, cx, y, size) => num(s, cx, y, size, { a: 'middle', sw: Math.max(3.4, size * 0.16) });

// ---------- coin chip ----------
export function coinChip(x, y, w, h, val, o = {}) {
  const sz = o.size ?? 20;
  return `${o.noPlate ? '' : plate(x, y, w, h, h / 2, { op: o.op ?? 0.8 })}${emblem('coin', h * 0.62, { x: x + h * 0.52, y: y + h / 2 })}${num(val, x + h * 0.95, y + h / 2 + sz * 0.35, sz, { sw: 3.4 })}`;
}
export function pauseBtn(x, y, s, o = {}) {
  return `${o.noPlate ? '' : plate(x, y, s, s, s * 0.28, { op: 0.82 })}<rect x="${x + s * 0.34}" y="${y + s * 0.28}" width="${s * 0.11}" height="${s * 0.44}" rx="2" fill="${K.cream}"/><rect x="${x + s * 0.55}" y="${y + s * 0.28}" width="${s * 0.11}" height="${s * 0.44}" rx="2" fill="${K.cream}"/>`;
}

// ---------- weapon tile ----------
export function tile(x, y, s, kind, rank, o = {}) {
  const max = o.max ?? 5, evo = !!o.evo, op = o.op ?? 1, e = evo ? K.gold : K.brass;
  if (kind == null) return `<rect x="${x + 1.5}" y="${y + 1.5}" width="${s - 3}" height="${s - 3}" rx="${s * 0.26}" fill="#0c0908" fill-opacity=".28" stroke="${K.creamD}" stroke-opacity=".35" stroke-width="1.6" stroke-dasharray="4 5"/>`;
  let g = `<g opacity="${op}">${plate(x, y, s, s, s * 0.26, { op: 0.86, edge: e, sw: evo ? 3 : 2, eo: evo ? 1 : 0.85 })}`;
  g += `<circle cx="${x + s / 2}" cy="${y + s * 0.46}" r="${s * 0.42}" fill="${ROLE[kind]}" opacity=".16"/>`;
  g += emblem(kind, s * 0.58, { x: x + s / 2, y: y + s * 0.44 });
  const pr = Math.max(2.2, s * 0.045), gap = pr * 3.1, px0 = x + s / 2 - (gap * (max - 1)) / 2;
  for (let i = 0; i < max; i++) g += `<circle cx="${px0 + i * gap}" cy="${y + s - pr * 2.1}" r="${pr}" fill="${evo || i < rank ? (evo ? K.gold : K.cream) : '#0c0908'}" stroke="${evo ? '#8a5a12' : K.brassD}" stroke-width="1"/>`;
  if (o.cd != null) g += `<rect x="${x - 2}" y="${y - 2}" width="${s + 4}" height="${s + 4}" rx="${s * 0.3}" fill="none" stroke="${ROLE[kind]}" stroke-width="3" pathLength="100" stroke-dasharray="${o.cd} ${100 - o.cd}" stroke-linecap="round" opacity=".9"/>`;
  if (evo) g += `<path d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4Z" fill="#fff6d0" transform="translate(${x + s - 5},${y + 5})" filter="url(#hGlowFx)"/>`;
  if (o.pulse) g += `<rect x="${x - 3}" y="${y - 3}" width="${s + 6}" height="${s + 6}" rx="${s * 0.3}" fill="none" stroke="${K.cream}" stroke-opacity=".7" stroke-width="2"/>`;
  return g + '</g>';
}

// ---------- ability button ----------
export function ability(cx, cy, r, st, o = {}) {
  const ready = st.ready, p = st.frac ?? 1; // frac 0..1 filled (1 = ready)
  let g = ready ? `<circle cx="${cx}" cy="${cy}" r="${r * 1.55}" fill="url(#hGlowF)" opacity=".75"/>` : '';
  g += `<circle cx="${cx}" cy="${cy + 2}" r="${r + 4}" fill="#000" opacity=".35" filter="url(#hSoft)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#hPlate)" fill-opacity=".9" stroke="${K.brassD}" stroke-width="2"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="${ready ? '#ffc766' : '#ffb55a'}" stroke-width="5" pathLength="100" stroke-dasharray="${p * 100} ${100 - p * 100}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" ${ready ? 'filter="url(#hGlowFx)"' : ''}/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="5"/>`;
  g += emblem('wolf', r * 1.0, { x: cx, y: cy - (st.label ? 2 : 0), op: ready ? 1 : 0.4 });
  if (!ready && st.sec) g += num(st.sec + 's', cx, cy + r * 0.2, r * 0.46, { a: 'middle', sw: 3.6 });
  if (o.key) g += `<g transform="translate(${cx - r * 0.1},${cy + r + 12})"><rect x="-34" y="-12" width="68" height="24" rx="12" fill="url(#hPlate)" fill-opacity=".88" stroke="${K.brassD}" stroke-width="1.6"/>${txt('SPACE', 0, 5, 14, { a: 'middle', noStroke: true, c: K.cream, ls: 1 })}</g>`;
  return g;
}

// ---------- boss bar ----------
export function bossBar(cx, y, w, frac, o = {}) {
  const x = cx - w / 2, h = o.h ?? 18;
  let s = o.noName ? '' : `${txt('Elder Treant', cx, y - 8, o.ns ?? 20, { a: 'middle', f: FONT.title, w: 800, i: true })}`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#0c0908" fill-opacity=".85" stroke="${K.brass}" stroke-width="2"/><clipPath id="bb${Math.round(x + w)}"><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="${h / 2 - 2}"/></clipPath><g clip-path="url(#bb${Math.round(x + w)})"><rect x="${x + 2}" y="${y + 2}" width="${(w - 4) * frac}" height="${h - 4}" fill="url(#hBark)"/><rect x="${x + 2}" y="${y + 2}" width="${(w - 4) * frac}" height="${(h - 4) * 0.35}" fill="#fff" opacity=".28"/></g>`;
  [0.66, 0.33].forEach((t) => { s += `<path d="M${x + w * t} ${y - 3} L${x + w * t - 4} ${y + h / 2} L${x + w * t} ${y + h + 3} L${x + w * t + 4} ${y + h / 2}Z" fill="${K.cream}" stroke="${K.ink}" stroke-width="1.4"/>`; });
  return s;
}

// ---------- frost edge (low HP): thresholded noise masked to the outer edge, plus shards in the corners ----------
export function frost(w, h, amt = 1) {
  const r = rnd(41), sh = [];
  const crystal = (x, y, a, l) => { const wd = l * 0.18; return `<path d="M${x} ${y} L${(x + Math.cos(a - 0.2) * l * 0.5 + Math.cos(a + 1.57) * wd).toFixed(1)} ${(y + Math.sin(a - 0.2) * l * 0.5 + Math.sin(a + 1.57) * wd).toFixed(1)} L${(x + Math.cos(a) * l).toFixed(1)} ${(y + Math.sin(a) * l).toFixed(1)} L${(x + Math.cos(a + 0.2) * l * 0.5 - Math.cos(a + 1.57) * wd).toFixed(1)} ${(y + Math.sin(a + 0.2) * l * 0.5 - Math.sin(a + 1.57) * wd).toFixed(1)}Z" fill="#e8f6ff" fill-opacity=".8" stroke="#9fc4d6" stroke-width="1.4" stroke-linejoin="round"/>`; };
  const u = Math.min(w, h) / 360;
  for (const [cx, cy, a0] of [[0, 0, 0.78], [w, 0, 2.36], [0, h, -0.78], [w, h, -2.36]]) for (let i = 0; i < 9; i++) sh.push(crystal(cx + (r() - 0.5) * 20 * u, cy + (r() - 0.5) * 20 * u, a0 + (r() - 0.5) * 1.3, (40 + r() * 70) * u));
  const sd = (r2) => r2; void sd;
  const mid = nid('fm');
  return `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#hFrostV)"/></mask><g opacity="${amt}"><g mask="url(#${mid})"><rect width="${w}" height="${h}" filter="url(#hFrostN)" opacity=".9"/></g><rect width="${w}" height="${h}" fill="url(#hFrostV)" opacity=".16"/>${sh.join('')}</g>`;
}

// ---------- damage numbers (canvas BitmapText in the build; mock-up uses SVG text) ----------
export function dmg(x, y, t, kind = 'hit', o = {}) {
  const sc = o.sc ?? 1, sl = o.slim ? 0.85 : 1;
  if (kind === 'taken') return `<g transform="translate(${x},${y})">${num(t, 0, 0, 17 * sc, { c: K.rose, st: K.roseD, a: 'middle', sw: 4 })}</g>`;
  if (kind === 'heal') return `<g transform="translate(${x},${y})">${num(t, 0, 0, 19 * sc, { c: K.rose, st: K.roseD, a: 'middle', sw: 4.4 })}</g>`;
  if (kind === 'crit') {
    const fs = 40 * sc * sl, rays = Array.from({ length: 10 }, (_, i) => `<path d="M0 ${-fs * 0.6} L${fs * 0.07} ${-fs * 0.82} L${-fs * 0.07} ${-fs * 0.82}Z" fill="${K.cream}" opacity=".75" transform="rotate(${i * 36 - 90 + 18})"/>`).join('');
    return `<g transform="translate(${x},${y}) rotate(${o.rot ?? -5})" filter="url(#hDrop)"><g transform="translate(0,${-fs * 0.3}) scale(1,.8)">${rays}</g>${T(t, 0, 0, { s: fs, f: FONT.num, c: K.cream, a: 'middle', st: K.brassD, sw: fs * 0.3 })}${T(t, 0, 0, { s: fs, f: FONT.num, c: K.cream, a: 'middle', st: K.ink, sw: fs * 0.13 })}</g>`;
  }
  const fs = (kind === 'big' ? 29 : 21) * sc * sl;
  return `<g transform="translate(${x},${y}) rotate(${o.rot ?? 0})" filter="url(#hDrop)">${T(t, 0, 0, { s: fs, f: FONT.num, c: o.white ? '#fff' : K.cream, a: 'middle', st: kind === 'big' ? K.brassD : K.ink, sw: fs * 0.3 })}${kind === 'big' ? T(t, 0, 0, { s: fs, f: FONT.num, c: K.cream, a: 'middle', st: K.ink, sw: fs * 0.12 }) : ''}</g>`;
}

// ---------- world-space overlay shared by every direction: Holy Orbit lights, pickups, numbers, gem arc ----------
export function worldOverlay(hero, u, o = {}) {
  const [hx, hy] = hero, kx = u;
  let s = '';
  // Holy Orbit: three cream lights circling the hero
  const orb = (a, rr) => { const x = hx + Math.cos(a) * 46 * kx, y = hy - 22 * kx + Math.sin(a) * 18 * kx; return `<circle cx="${x}" cy="${y}" r="${12 * kx}" fill="url(#hGlowF)"/><circle cx="${x}" cy="${y}" r="${4 * kx}" fill="#fff6d8" stroke="#ffb23a" stroke-width="${1.4 * kx}"/>`; };
  s += `<ellipse cx="${hx}" cy="${hy - 22 * kx}" rx="${46 * kx}" ry="${18 * kx}" fill="none" stroke="#ffe0a0" stroke-opacity=".28" stroke-width="${1.2 * kx}"/>` + orb(0.3) + orb(2.4) + orb(4.4);
  return s;
}
