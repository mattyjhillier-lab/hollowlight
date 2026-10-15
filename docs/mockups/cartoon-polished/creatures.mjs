// Hand-authored creature drawings (feet at origin, y negative = up). Each is one bespoke drawing, not a recolour.
// Outline language: heroes = warm brown 2.4px, spirits = no outline but white-hot rim + glow, enemies = near-black 3.4px, bold.
import { shape, sh, hl, eye, ground, epoint, veins, circ, ell, nid } from './core.mjs';

const HO = '#33241f'; // hero outline
const EO = '#0d0a14'; // enemy outline

// ---- spirit body helper: outer glow, gradient body, white-hot core, thin white rim ----
function spirit(d, grad, K, o = {}) {
  const glow = o.glow || 'gGlowW';
  const mask = o.mask ? ` mask="url(#${o.mask})"` : '';
  const id = nid('s');
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>
<g${mask}><path d="${d}" fill="${o.gc || K.wolf[1]}" opacity=".45" filter="url(#b8)"/>
<path d="${d}" fill="url(#${grad})"/>
<g clip-path="url(#${id})">${o.x || ''}<ellipse cx="${o.cx ?? 0}" cy="${o.cy ?? -30}" rx="${o.cr ?? 30}" ry="${o.cry ?? 12}" fill="#fff" opacity=".6" filter="url(#b8)"/></g>
<path d="${d}" fill="none" stroke="${o.rim || '#fff'}" stroke-width="1.6" opacity=".8" stroke-linejoin="round"/></g>`;
}

// ===================== WREN =====================
export function wren(K) {
  const scarfTail = 'M-14 -42 C-34 -52 -56 -40 -80 -56 C-92 -64 -104 -62 -114 -70 C-108 -54 -100 -46 -92 -42 L-102 -34 L-88 -33 L-94 -24 C-74 -22 -52 -28 -34 -33 C-26 -34 -20 -36 -14 -36Z';
  const scarfKnit = [-96, -80, -64, -48].map((x, i) => `<path d="M${x} ${-60 + i * 3} l8 ${16 - i}" stroke="#a5561a" stroke-width="2" opacity=".45" fill="none" stroke-linecap="round"/>`).join('');
  return `${ground(34, 7, 0.45, 1)}
<g transform="translate(0,0)">
<!-- scarf tail behind -->
${shape(scarfTail, { f: 'url(#gScarf)', rim: '#ffe7a8', ol: '#6b3a12', w: 2.2, x: scarfKnit + sh('M-60 -38 L-100 -30 L-100 -22 L-60 -26Z', '#7a3a08', 0.4) })}
<!-- boots -->
${shape(ell(-10, -3, 10, 6), { f: 'url(#gLeather)', ol: HO, w: 2 })}${shape(ell(12, -3, 10, 6), { f: 'url(#gLeather)', ol: HO, w: 2 })}
<!-- oversized hand-me-down coat -->
${shape('M-27 -4 C-34 -22 -30 -44 -18 -56 C-8 -62 8 -62 18 -56 C30 -44 34 -22 27 -4 C14 3 -14 3 -27 -4Z', { f: 'url(#gCoat)', rim: K.warmHi, ol: HO, x: sh('M10 -60 C34 -44 36 -10 20 2 L40 2 L40 -60Z', '#10222a', 0.35, 'b4') + hl('M-22 -52 C-30 -34 -28 -20 -26 -12 L-18 -14 C-18 -28 -16 -42 -10 -54Z', '#fff', 0.35) + `<path d="M0 -50 V-6" stroke="#244a52" stroke-width="2" opacity=".5"/><circle cx="0" cy="-34" r="2.2" fill="#d8b26a"/><circle cx="0" cy="-22" r="2.2" fill="#d8b26a"/>` })}
<!-- left arm + rolled cuff -->
${shape('M-17 -50 C-30 -46 -37 -34 -36 -20 C-32 -16 -25 -16 -22 -20 C-22 -30 -18 -37 -10 -42Z', { f: 'url(#gCoat)', rim: K.warmHi, ol: HO, w: 2.2 })}
${shape(ell(-29, -20, 8, 5.5), { f: 'url(#gHood)', ol: HO, w: 1.8 })}${shape(circ(-29, -14, 4.6), { f: 'url(#gSkin)', ol: HO, w: 1.6 })}
<!-- whistle on cord -->
<path d="M-12 -48 C-12 -40 -6 -36 0 -34" stroke="#e9dfc6" stroke-width="1.4" fill="none"/><path d="M-3 -35 l6 -1 l-1 5 l-5 -1Z" fill="#f4ecd6" stroke="${HO}" stroke-width="1.2" stroke-linejoin="round"/>
<!-- scarf collar -->
${shape('M-22 -52 C-10 -44 10 -44 22 -52 L24 -43 C10 -35 -10 -35 -24 -43Z', { f: 'url(#gScarf)', rim: '#ffe7a8', ol: '#6b3a12', w: 2.2, x: `<path d="M-14 -50 l2 14 M-4 -48 l2 14 M8 -48 l1 14 M18 -50 l0 12" stroke="#a5561a" stroke-width="1.8" opacity=".45"/>` })}
<!-- right arm holding lantern -->
${shape('M17 -50 C30 -46 38 -34 37 -22 C33 -18 26 -18 23 -22 C23 -32 20 -38 11 -42Z', { f: 'url(#gCoat)', rim: K.warmHi, ol: HO, w: 2.2 })}
${shape(ell(30, -21, 8, 5.5), { f: 'url(#gHood)', ol: HO, w: 1.8 })}${shape(circ(30, -15, 4.8), { f: 'url(#gSkin)', ol: HO, w: 1.6 })}
<!-- ears (wolf-ear hood) -->
${shape('M-25 -86 L-30 -113 L-9 -97Z', { f: 'url(#gHood)', rim: K.warmHi, ol: HO })}${shape('M25 -86 L30 -113 L9 -97Z', { f: 'url(#gHood)', rim: K.warmHi, ol: HO })}
<path d="M-24 -92 L-26 -106 L-15 -97Z M24 -92 L26 -106 L15 -97Z" fill="${K.scarf[0]}" opacity=".85"/>
<!-- hood back -->
${shape('M-29 -64 C-33 -92 -14 -102 0 -102 C14 -102 33 -92 29 -64 C27 -50 14 -46 0 -46 C-14 -46 -27 -50 -29 -64Z', { f: 'url(#gHood)', rim: K.warmHi, ol: HO, x: sh('M14 -100 C36 -90 34 -50 10 -44 L40 -44 L40 -100Z', '#12303a', 0.3, 'b4') + hl('M-24 -88 C-30 -76 -30 -64 -27 -56 L-20 -60 C-22 -72 -20 -82 -12 -92Z', '#fff', 0.4) })}
<!-- face -->
${shape('M-18 -66 C-18 -82 18 -82 18 -66 C18 -52 8 -46 0 -46 C-8 -46 -18 -52 -18 -66Z', { f: 'url(#gSkin)', ol: HO, w: 1.8, x: `<ellipse cx="-11" cy="-52" rx="5" ry="3" fill="#ff8f8f" opacity=".5" filter="url(#b2)"/><ellipse cx="11" cy="-52" rx="5" ry="3" fill="#ff8f8f" opacity=".5" filter="url(#b2)"/>` })}
<!-- fur trim -->
<path d="M-20 -62 C-24 -90 24 -90 20 -62" fill="none" stroke="#f4ecd6" stroke-width="5.5" stroke-linecap="round"/><path d="M-20 -62 C-24 -90 24 -90 20 -62" fill="none" stroke="${HO}" stroke-width="1.4" opacity=".5" transform="translate(0,-3)"/>
<!-- bangs -->
<path d="M-17 -69 C-14 -82 14 -82 17 -69 C10 -72 6 -70 2 -64 C-2 -70 -8 -72 -17 -69Z" fill="#4a2f26" stroke="${HO}" stroke-width="1.4" stroke-linejoin="round"/>
${eye(-7.5, -58, 3.7, 4.8)}${eye(7.5, -58, 3.7, 4.8)}
<path d="M-11 -65 q4 -3 7 -1 M11 -65 q-4 -3 -7 -1" stroke="#4a2f26" stroke-width="1.5" fill="none" stroke-linecap="round" transform="translate(0,1)"/>
<path d="M-3 -50 q3 2.4 6 0" stroke="#8a4a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<!-- lantern (the light source) -->
<circle cx="32" cy="-6" r="46" fill="url(#gGlowWarm)" opacity=".7"/>
<path d="M32 -16 V-22" stroke="${HO}" stroke-width="1.8"/>
${shape('M25 -14 L39 -14 L41 -3 L23 -3Z', { f: K.warm, ol: '#4a3220', w: 1.8, x: `<rect x="26" y="-13" width="12" height="9" fill="${K.warmHi}" opacity=".85" filter="url(#b2)"/>` })}
<path d="M32 -12 C29 -9 30 -6 32 -5 C34 -6 35 -9 32 -12Z" fill="#fff" opacity=".95"/>
<path d="M22 -3 H42 V-1 H22Z" fill="#4a3220"/><path d="M26 -14 L32 -19 L38 -14Z" fill="#4a3220"/>
</g>`;
}

// ===================== ELIAS =====================
export function elias(K) {
  const flame = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="16" cy="-3" fill="url(#gGlowWarm)"/><path d="M0 -14 C-5 -8 -6 -2 0 2 C6 -2 5 -8 0 -14Z" fill="${K.warm}" stroke="#fff" stroke-width=".8"/><path d="M0 -8 C-2 -5 -2 -2 0 0 C2 -2 2 -5 0 -8Z" fill="#fff"/></g>`;
  let sockets = '';
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; const x = Math.cos(a) * 50, y = -80 + Math.sin(a) * 50; sockets += `<rect x="${x - 3.5}" y="${y - 4}" width="7" height="8" rx="1.5" fill="#d9d2bd" stroke="${HO}" stroke-width="1.4"/>`; }
  return `${ground(46, 8, 0.45, 1)}
<!-- candle-wheel on his back: a circle behind a square -->
<circle cx="0" cy="-80" r="50" fill="url(#gGlowWarm)" opacity=".35"/>
<circle cx="0" cy="-80" r="50" fill="none" stroke="${HO}" stroke-width="9"/><circle cx="0" cy="-80" r="50" fill="none" stroke="url(#gIron)" stroke-width="6"/><circle cx="0" cy="-80" r="50" fill="none" stroke="#a7aebb" stroke-width="1.4" opacity=".6" transform="translate(-1,-1)"/>
<path d="M0 -130 V-30 M-50 -80 H50" stroke="${HO}" stroke-width="3" opacity=".7"/>
${sockets}
${flame(0, -130, 1)}${flame(43, -105, 0.8)}${flame(-43, -105, 0.8)}
<!-- robe -->
${shape('M-34 -2 C-40 -22 -38 -46 -28 -62 C-16 -72 16 -72 28 -62 C38 -46 40 -22 34 -2 C20 4 -20 4 -34 -2Z', { f: 'url(#gRobe)', rim: K.warmHi, ol: HO, x: sh('M14 -70 C44 -54 44 -10 26 4 L50 4 L50 -70Z', '#6a5a50', 0.35, 'b4') + hl('M-28 -62 C-34 -40 -32 -20 -30 -8 L-22 -10 C-22 -30 -20 -46 -14 -62Z', '#fff', 0.55) + `<path d="M-30 -14 C-10 -9 10 -9 30 -14 L31 -4 C10 1 -10 1 -31 -4Z" fill="${K.stole[1]}" opacity=".9"/><path d="M-14 -50 C-12 -30 -13 -14 -14 0 M14 -50 C12 -30 13 -14 14 0" stroke="#a89c78" stroke-width="1.6" fill="none" opacity=".6"/>` })}
<!-- stole -->
${shape('M-9 -66 L-14 -6 L0 -2 L14 -6 L9 -66Z', { f: 'url(#gStole)', rim: K.warmHi, ol: HO, w: 2, x: `<path d="M0 -66 V-4" stroke="#fff" stroke-width="1.6" opacity=".35"/><path d="M-5 -40 h10 M0 -45 v10" stroke="${K.warmHi}" stroke-width="2.4" opacity=".85" stroke-linecap="round"/>` })}
<!-- folded sleeves/hands -->
${shape('M-30 -46 C-22 -36 -8 -34 0 -36 C8 -34 22 -36 30 -46 C36 -38 34 -30 26 -26 C12 -22 -12 -22 -26 -26 C-34 -30 -36 -38 -30 -46Z', { f: 'url(#gRobe)', rim: K.warmHi, ol: HO, w: 2.2, x: sh('M-30 -30 C-10 -24 10 -24 30 -30 L30 -20 L-30 -20Z', '#6a5a50', 0.3) })}
${shape(ell(0, -36, 9, 6), { f: 'url(#gSkin)', ol: HO, w: 1.8 })}
<!-- head -->
${shape(circ(0, -88, 21), { f: 'url(#gSkin)', rim: K.warmHi, ol: HO, x: `<ellipse cx="-12" cy="-80" rx="5" ry="3" fill="#ff8f8f" opacity=".45" filter="url(#b2)"/><ellipse cx="12" cy="-80" rx="5" ry="3" fill="#ff8f8f" opacity=".45" filter="url(#b2)"/>${hl('M-14 -104 C-4 -110 8 -108 14 -100 L4 -98Z', '#fff', 0.5)}` })}
<!-- side hair + beard -->
${shape('M-21 -92 C-26 -90 -26 -80 -22 -74 C-22 -82 -20 -88 -17 -92Z M21 -92 C26 -90 26 -80 22 -74 C22 -82 20 -88 17 -92Z', { f: '#e9e6ee', ol: HO, w: 1.6 })}
${shape('M-17 -80 C-16 -66 -8 -60 0 -58 C8 -60 16 -66 17 -80 C12 -76 8 -77 4 -77 C2 -75 -2 -75 -4 -77 C-8 -77 -12 -76 -17 -80Z', { f: '#f2f0f8', rim: '#d6d4e4', ol: HO, w: 1.8 })}
<path d="M-12 -92 q4 -3 9 -1.5 M12 -92 q-4 -3 -9 -1.5" stroke="#c9c6d4" stroke-width="3.4" fill="none" stroke-linecap="round"/>
<path d="M-12 -86 q4 3 8 0 M4 -86 q4 3 8 0" stroke="${HO}" stroke-width="2" fill="none" stroke-linecap="round"/>
<ellipse cx="0" cy="-82" rx="3" ry="2.4" fill="#e0a283" stroke="${HO}" stroke-width="1.2"/>
<path d="M-4 -74 q4 3 8 0" stroke="#8a4a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<!-- tiny halo tuft of light above the head -->
<ellipse cx="0" cy="-114" rx="13" ry="3.4" fill="none" stroke="${K.warmHi}" stroke-width="2.4" opacity=".9" filter="url(#glowS)"/>
${flame(-44, -50, 0.7)}${flame(46, -62, 0.7)}`;
}

// ===================== GHOST WOLF (summon) =====================
export function wolf(K, o = {}) {
  const body = 'M-42 -38 C-34 -50 -12 -52 6 -50 C16 -50 24 -56 30 -64 L30 -80 L38 -72 C40 -73 44 -73 46 -72 L52 -80 L52 -64 C58 -62 66 -58 72 -52 C74 -48 70 -45 64 -45 C58 -44 54 -42 50 -40 C46 -36 44 -32 44 -26 L46 -4 C46 -1 40 1 36 0 L32 -24 C26 -22 20 -22 14 -24 L12 -4 C12 -1 6 1 2 0 L-2 -26 C-10 -24 -18 -24 -24 -26 L-26 -4 C-26 -1 -32 1 -36 0 L-38 -26 C-42 -28 -44 -34 -42 -38Z';
  const tail = 'M-40 -44 C-62 -44 -80 -56 -100 -84 C-90 -58 -70 -34 -40 -32Z';
  const tuft = 'M30 -64 C34 -56 40 -52 50 -52 C44 -58 40 -62 38 -68Z';
  return `${ground(54, 8, 0.32, 1)}
<!-- amber neck-thread back to Wren -->
<path d="M30 -60 C-10 -96 -60 -96 -120 -70" fill="none" stroke="#ffc766" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 0" opacity=".9" filter="url(#glowS)"/>
${spirit(tail, 'gWolf', K, { cx: -70, cy: -60, cr: 22, cry: 6, rim: K.wolfRim })}
${spirit(body, 'gWolf', K, { mask: 'mLegs', cx: 14, cy: -46, cr: 38, cry: 8, rim: K.wolfRim, x: `<path d="${tuft}" fill="#fff" opacity=".55" filter="url(#b2)"/><path d="M-30 -38 C-10 -30 10 -30 30 -36" stroke="${K.wolf[3]}" stroke-width="5" opacity=".28" fill="none" filter="url(#b2)"/>` })}
<!-- face -->
<path d="M60 -48 q5 1 8 -1" stroke="#7a4a1a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
<ellipse cx="72" cy="-50" rx="3" ry="2.4" fill="#2b1c20"/>
<path d="M50 -62 C52 -57 57 -56 60 -58" stroke="#2b1c20" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<circle cx="54" cy="-58" r="3.4" fill="#ffb12a"/><circle cx="53.2" cy="-59" r="1.3" fill="#fff"/>
<path d="M36 -76 L38 -70 L44 -72Z" fill="${K.wolf[2]}" opacity=".5"/>`;
}
export const wolfMask = `<mask id="mLegs" maskUnits="userSpaceOnUse" x="-200" y="-200" width="400" height="260"><rect x="-200" y="-200" width="400" height="260" fill="url(#gLegFade)"/></mask>`;

// ===================== RAVEN (summon) =====================
export function raven(K) {
  const wingF = 'M-4 -38 C-10 -64 -36 -92 -70 -88 C-58 -80 -52 -70 -52 -62 C-46 -70 -36 -70 -30 -62 C-26 -56 -22 -50 -14 -44Z';
  const wingB = 'M2 -40 C4 -66 22 -92 52 -94 C42 -84 40 -76 42 -68 C48 -72 56 -70 60 -62 C54 -58 48 -52 40 -46Z';
  const body = 'M-24 -22 C-24 -40 -8 -50 6 -45 C10 -56 24 -60 32 -52 L50 -46 L32 -42 C34 -30 22 -14 6 -12 L12 -2 L2 -8 L-6 0 L-8 -12 C-18 -12 -26 -14 -24 -22Z';
  const paper = (x, y, r) => `<rect x="${x}" y="${y}" width="10" height="7" rx="1" fill="#fff8ea" stroke="#d9c7a0" stroke-width="1" transform="rotate(${r} ${x + 5} ${y + 3.5})"/><path d="M${x + 2} ${y + 2.5} h6 M${x + 2} ${y + 4.5} h4" stroke="#b69a6a" stroke-width=".8" transform="rotate(${r} ${x + 5} ${y + 3.5})"/>`;
  return `${ground(30, 5, 0.22, 0)}
<g transform="translate(0,-18)">
${spirit(wingB, 'gRaven', K, { glow: 'gGlowR', gc: K.raven[1], cx: 40, cy: -70, cr: 14, cry: 18, rim: K.ravenRim })}${paper(46, -66, -30)}${paper(30, -92, 10)}
${spirit(body, 'gRaven', K, { gc: K.raven[1], cx: 8, cy: -30, cr: 16, cry: 14, rim: K.ravenRim })}
${spirit(wingF, 'gRaven', K, { gc: K.raven[1], cx: -40, cy: -70, cr: 18, cry: 16, rim: K.ravenRim })}${paper(-70, -92, -20)}${paper(-62, -78, 25)}
<path d="M-3 -34 L-12 -30 L-4 -28Z" fill="#fff" opacity=".4"/>
<path d="M32 -52 L52 -46 L34 -44Z" fill="#ffd27a" stroke="#8a5a1a" stroke-width="1.2" stroke-linejoin="round"/>
<circle cx="25" cy="-49" r="3.6" fill="#2b1c20"/><circle cx="24" cy="-50.4" r="1.4" fill="#fff"/>
<path d="M-4 -12 L-14 6 L0 -4 L10 6 L8 -10Z" fill="url(#gRaven)" stroke="${K.ravenRim}" stroke-width="1.2" opacity=".9"/>
</g>`;
}

// ===================== FELL / HOLLOW WOLF (enemy) =====================
export function fellwolf(K) {
  const body = 'M-44 -30 L-50 -18 L-44 -10 C-48 -8 -52 -4 -52 0 L-44 -2 L-40 -14 C-34 -10 -26 -12 -22 -14 L-18 -2 L-12 -2 C-10 -10 -8 -14 -6 -16 C4 -14 14 -14 24 -17 L28 -2 L36 -2 L34 -22 C38 -22 40 -24 42 -26 L50 -22 C58 -22 64 -26 70 -28 C74 -26 76 -22 74 -18 L70 -14 L62 -18 L58 -12 L54 -17 C48 -14 42 -12 38 -12 L40 -2 L34 -2 L30 -16 C26 -14 18 -12 14 -12 L10 -26 L-8 -30 L-12 -42 L-18 -48 L-28 -50 L-36 -46 L-40 -38Z';
  const body2 = 'M-36 -36 C-34 -48 -16 -54 2 -52 C14 -52 24 -50 30 -44 C38 -48 46 -44 50 -38 C60 -34 70 -36 76 -30 C78 -24 72 -18 66 -20 C60 -16 52 -16 46 -18 C38 -14 24 -14 14 -16 C2 -12 -14 -12 -24 -16 C-32 -18 -38 -26 -36 -36Z';
  return `${ground(54, 7, 0.5, 0)}
<!-- thin ribby hollow wolf: head low and long, tail hanging straight -->
<path d="M-36 -34 L-70 -10 L-66 -6 L-34 -24Z" fill="${EO}" stroke="${EO}" stroke-width="5" stroke-linejoin="round"/>
<path d="M-36 -34 L-70 -10 L-66 -6 L-34 -24Z" fill="url(#gHolD)"/>
<!-- back legs -->
${shape('M-26 -22 L-20 0 L-10 0 L-8 -22Z', { f: 'url(#gHolD)', rim: K.hLight, ol: EO, w: 3.2 })}
${shape('M28 -20 L32 0 L42 0 L40 -22Z', { f: 'url(#gHolD)', rim: K.hLight, ol: EO, w: 3.2 })}
${shape(body2, { f: 'url(#gHol)', rim: K.hLight, ol: EO, w: 3.6, x:
    sh('M-40 -20 C-20 -8 30 -8 60 -22 L60 0 L-40 0Z', '#000', 0.4, 'b4') + hl('M-30 -48 C-10 -54 16 -54 30 -46 L10 -42 C-6 -44 -20 -42 -30 -40Z', '#fff', 0.35)
    + [-24, -14, -4, 8, 18].map((x, i) => `<path d="M${x} ${-34 + (i % 2)} C${x + 4} ${-26} ${x + 4} ${-20} ${x} ${-16}" stroke="${K.hG3}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`).join('')
    + `<path d="M-30 -48 L-22 -58 L-14 -49 L-4 -60 L4 -50 L14 -58 L20 -48" fill="${K.hG2}" stroke="${EO}" stroke-width="2.4" stroke-linejoin="round"/>` + veins(K, -6, -40, 36, 4, 2.2, 3) })}
<!-- head -->
${shape('M30 -48 L34 -64 L42 -52 L52 -52 C62 -52 74 -48 80 -40 C82 -34 76 -30 70 -32 L56 -30 C46 -28 36 -30 30 -36Z', { f: 'url(#gHol)', rim: K.hLight, ol: EO, w: 3.6, x: sh('M40 -34 L80 -34 L80 -26 L40 -26Z', '#000', 0.35) })}
<path d="M50 -35 L82 -35" stroke="${EO}" stroke-width="2.6"/>
<path d="M56 -35 l2 6 l3 -6 M66 -35 l2 6 l3 -6" fill="${K.hFog}" stroke="${EO}" stroke-width="1.4" stroke-linejoin="round"/>
${epoint(K, 49, -46, 2.8)}
<ellipse cx="78" cy="-41" rx="3.4" ry="2.6" fill="${EO}"/>
<!-- front legs -->
${shape('M-4 -22 L0 0 L10 0 L10 -22Z', { f: 'url(#gHol)', rim: K.hLight, ol: EO, w: 3.2 })}
${shape('M38 -20 L42 0 L52 0 L50 -24Z', { f: 'url(#gHol)', rim: K.hLight, ol: EO, w: 3.2 })}`;
}

// ===================== ASH CROW (enemy) =====================
export function crow(K) {
  const wingL = 'M-6 -38 C-26 -56 -52 -62 -82 -52 L-70 -46 L-84 -38 L-66 -36 L-74 -26 L-50 -28 L-52 -18 L-30 -24 L-20 -18 L-12 -26Z';
  const wingR = 'M6 -38 C26 -64 50 -76 84 -72 L70 -64 L88 -58 L68 -54 L78 -44 L52 -48 L52 -36 L30 -42 L22 -34 L12 -40Z';
  const body = 'M-22 -22 C-22 -40 -6 -48 6 -44 C10 -52 22 -56 30 -50 L46 -42 L30 -38 C32 -28 24 -12 6 -10 L12 2 L2 -6 L-6 4 L-8 -10 C-18 -10 -24 -14 -22 -22Z';
  const flakes = [[-60, -14], [-20, -2], [30, -6], [-84, -30], [50, -22]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="${4 + (i % 2) * 2}" height="3" rx="1" fill="${K.hLight}" stroke="${EO}" stroke-width="1" transform="rotate(${20 + i * 40} ${x} ${y})" opacity=".85"/>`).join('');
  return `${ground(36, 6, 0.4, 2)}${flakes}
<g transform="translate(0,-14)">
${shape(wingR, { f: 'url(#gHolD)', rim: K.hLight, ol: EO, w: 3.2, x: sh('M0 -50 L90 -50 L90 -30 L0 -30Z', '#000', 0.3, 'b4') + `<path d="M30 -44 L70 -64 M22 -40 L56 -50" stroke="${K.hG3}" stroke-width="2" opacity=".7"/>` })}
${shape(body, { f: 'url(#gHol)', rim: K.hLight, ol: EO, w: 3.6, x: sh('M-26 -20 C0 -8 20 -10 36 -26 L36 6 L-26 6Z', '#000', 0.4, 'b4') + hl('M-14 -42 C0 -50 14 -48 20 -42 L0 -34Z', '#fff', 0.4) + veins(K, -6, -24, 18, 7, 2, 2) })}
${shape(wingL, { f: 'url(#gHol)', rim: K.hLight, ol: EO, w: 3.2, x: sh('M-90 -30 L0 -30 L0 -14 L-90 -14Z', '#000', 0.35, 'b4') + `<path d="M-14 -34 L-60 -50 M-20 -28 L-66 -34" stroke="${K.hG3}" stroke-width="2" opacity=".8"/>` })}
<path d="M30 -50 L48 -42 L36 -44 L32 -38Z" fill="${K.hLight}" stroke="${EO}" stroke-width="2.4" stroke-linejoin="round"/>
${epoint(K, 22, -46, 2.6)}
</g>`;
}

// ===================== ROOT CRAWLER (enemy) =====================
export function crawler(K) {
  const legs = [[-34, -10, -66, -26, -76, 0], [-20, -6, -44, -4, -56, 4], [-10, -4, -22, 4, -30, 6], [34, -10, 66, -26, 76, 0], [20, -6, 44, -4, 56, 4], [10, -4, 22, 4, 30, 6]];
  const leg = ([x0, y0, cx, cy, x1, y1]) => `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="${EO}" stroke-width="12" stroke-linecap="round"/><path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="url(#gBark)" stroke-width="7" stroke-linecap="round"/><path d="M${x0} ${y0 - 1} Q${cx} ${cy - 1} ${x1} ${y1 - 1}" fill="none" stroke="${K.hLight}" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>`;
  const rootsBack = legs.slice(0, 3).map(leg).join('') + legs.slice(3).map(leg).join('');
  return `${ground(64, 9, 0.5, 2)}
${veins(K, 0, 2, 54, 12, 3, 5)}
${rootsBack}
<!-- tangled hunched mass -->
${shape('M-44 -6 C-52 -26 -38 -50 -16 -58 C-6 -66 10 -66 20 -58 C42 -52 54 -28 44 -6 C28 6 -28 6 -44 -6Z', { f: 'url(#gHolD)', rim: K.hLight, ol: EO, w: 4, x: sh('M18 -60 C56 -44 56 -6 30 6 L60 6 L60 -60Z', '#000', 0.4, 'b4') + hl('M-34 -42 C-24 -56 -4 -62 8 -62 L-6 -50 C-20 -48 -28 -42 -34 -34Z', '#fff', 0.35)
    + `<path d="M-40 -14 C-20 -34 -4 -20 10 -40 C20 -50 34 -42 44 -30 M-30 -30 C-10 -46 8 -34 22 -52 M-26 -6 C-8 -22 16 -8 34 -22" fill="none" stroke="${K.hG3}" stroke-width="4.5" stroke-linecap="round" opacity=".85"/><path d="M-30 -30 C-10 -46 8 -34 22 -52" fill="none" stroke="${K.hLight}" stroke-width="1.2" opacity=".5" transform="translate(0,-2)"/>` })}
<!-- hollow maw + eyes -->
<path d="M-18 -26 C-12 -36 12 -36 18 -26 C14 -14 -14 -14 -18 -26Z" fill="#0a0710" stroke="${EO}" stroke-width="2.4"/>
<path d="M-10 -30 l3 6 l3 -6 M-1 -30 l3 6 l3 -6" fill="${K.hFog}" opacity=".85"/>
${epoint(K, -12, -45, 2.6)}${epoint(K, 0, -50, 2.2)}${epoint(K, 12, -45, 2.6)}
<!-- thorn-root spikes -->
<path d="M-30 -48 L-40 -70 L-22 -56Z M34 -46 L48 -66 L26 -54Z" fill="url(#gBark)" stroke="${EO}" stroke-width="2.6" stroke-linejoin="round"/>`;
}

// ===================== BLIGHTBULB (new, suicider) =====================
export function blightbulb(K) {
  return `${ground(34, 6, 0.45, 1)}
${shape('M-14 -14 L-10 0 L0 0 L0 -14Z', { f: 'url(#gHolD)', ol: EO, w: 3 })}${shape('M4 -14 L6 0 L16 0 L14 -14Z', { f: 'url(#gHolD)', ol: EO, w: 3 })}
${shape('M-34 -40 C-34 -66 -14 -80 2 -80 C22 -80 38 -66 36 -42 C34 -22 14 -10 0 -10 C-18 -10 -34 -22 -34 -40Z', { f: 'url(#gHolL)', rim: K.hFog, ol: EO, w: 3.8, x:
    sh('M18 -78 C48 -66 46 -20 10 -8 L46 -8 L46 -80Z', '#000', 0.35, 'b4') + hl('M-26 -66 C-20 -76 -6 -78 4 -76 L-10 -64 C-20 -60 -26 -54 -28 -46Z', '#fff', 0.55)
    + [[-14, -50, 7], [12, -62, 5], [14, -28, 6], [-18, -26, 4.4], [2, -72, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.hG1}" opacity=".7"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.4}" fill="${K.hFog}" opacity=".6"/>`).join('')
    + veins(K, 0, -44, 26, 21, 2.2, 4) })}
<ellipse cx="0" cy="-86" rx="8" ry="3" fill="${K.hG2}" stroke="${EO}" stroke-width="2.6"/>
<!-- swelling dread: cold glow seeps through the cracks -->
<circle cx="0" cy="-44" r="40" fill="url(#gGlowBad)" opacity=".35"/>
${epoint(K, -10, -44, 2.8)}${epoint(K, 10, -44, 2.8)}
<path d="M-8 -30 q8 -5 16 0" stroke="${EO}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M-36 -60 l-6 -4 M38 -62 l6 -5 M-38 -40 l-8 0 M40 -40 l8 0" stroke="${K.hLight}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`;
}

// ===================== THORNSPITTER (new, ranged) =====================
export function thornspitter(K) {
  return `${ground(30, 5, 0.45, 1)}
${veins(K, 0, 0, 40, 33, 2.6, 4)}
<!-- roots -->
<path d="M-4 -6 L-24 4 M4 -6 L26 4 M0 -6 L0 6" stroke="${EO}" stroke-width="9" stroke-linecap="round"/><path d="M-4 -6 L-24 4 M4 -6 L26 4 M0 -6 L0 6" stroke="url(#gBark)" stroke-width="5" stroke-linecap="round"/>
<!-- twig arms splayed -->
<path d="M-4 -46 L-34 -62 L-46 -56 M-34 -62 L-40 -78 M4 -46 L34 -62 L48 -54 M34 -62 L42 -80" fill="none" stroke="${EO}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-4 -46 L-34 -62 L-46 -56 M-34 -62 L-40 -78 M4 -46 L34 -62 L48 -54 M34 -62 L42 -80" fill="none" stroke="url(#gBark)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<!-- thin upright stick body -->
${shape('M-7 -2 C-8 -28 -9 -50 -7 -78 L7 -78 C9 -50 8 -28 7 -2Z', { f: 'url(#gBark)', rim: K.hLight, ol: EO, w: 3.2, x: `<path d="M-2 -70 C2 -56 -2 -40 2 -20" stroke="${K.hG3}" stroke-width="2.4" fill="none" opacity=".8"/>` })}
<path d="M7 -58 L18 -62 L8 -50Z M-7 -38 L-18 -44 L-8 -30Z M7 -24 L16 -26 L8 -16Z" fill="${K.hG2}" stroke="${EO}" stroke-width="2.2" stroke-linejoin="round"/>
<!-- bulb head: swells and glows cold before a shot -->
<circle cx="0" cy="-92" r="30" fill="url(#gGlowBad)" opacity=".5"/>
${shape(circ(0, -92, 17), { f: 'url(#gHolL)', rim: K.hFog, ol: EO, w: 3.6, x: hl('M-12 -102 C-8 -108 2 -108 6 -106 L-6 -96Z', '#fff', 0.6) + veins(K, 0, -90, 14, 5, 2, 3) })}
<path d="M-8 -108 L-12 -122 L-2 -112 L2 -124 L6 -112 L14 -120 L9 -106Z" fill="url(#gBark)" stroke="${EO}" stroke-width="2.4" stroke-linejoin="round"/>
${epoint(K, -6, -93, 2.4)}${epoint(K, 6, -93, 2.4)}
<path d="M-5 -85 L0 -81 L5 -85" stroke="${EO}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17 -90 L34 -92 L18 -86Z" fill="${K.hLight}" stroke="${EO}" stroke-width="1.8" stroke-linejoin="round"/>`;
}

// ===================== MOSS MOURNER (new, healer) =====================
export function mourner(K) {
  const drip = (x, y, l) => `<path d="M${x} ${y} q-3 ${l * 0.5} 0 ${l} q3 ${-l * 0.5} 0 ${-l}Z" fill="#6f8a6a" stroke="${EO}" stroke-width="2"/>`;
  return `${ground(46, 7, 0.45, 1)}
<!-- grey tether strands to allies -->
<path d="M30 -40 C60 -60 80 -50 100 -64" fill="none" stroke="${K.hLight}" stroke-width="1.6" opacity=".6" stroke-dasharray="3 3"/>
${shape('M-40 -2 C-48 -24 -40 -52 -22 -66 C-10 -76 14 -76 24 -66 C42 -52 48 -24 40 -2 C20 6 -20 6 -40 -2Z', { f: 'url(#gMoss)', rim: '#cfe0bf', ol: EO, w: 3.8, x:
    sh('M18 -72 C54 -56 50 -10 24 4 L56 4 L56 -72Z', '#000', 0.38, 'b4') + hl('M-34 -56 C-24 -68 -6 -72 6 -72 L-8 -60 C-20 -56 -30 -48 -34 -36Z', '#fff', 0.35)
    + [[-26, -24, 9], [-8, -12, 7], [18, -18, 10], [28, -40, 6], [-22, -48, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#516b4e" opacity=".75"/><circle cx="${x - 2}" cy="${y - 2}" r="${r * 0.4}" fill="#b4cca4" opacity=".6"/>`).join('') })}
<!-- hood and sorrowful face -->
${shape('M-22 -62 C-24 -84 -8 -96 4 -96 C20 -96 30 -82 26 -62 C20 -50 -16 -50 -22 -62Z', { f: 'url(#gMoss)', rim: '#cfe0bf', ol: EO, w: 3.6, x: sh('M8 -96 C34 -84 30 -56 10 -50 L36 -50 L36 -96Z', '#000', 0.35, 'b4') + hl('M-16 -86 C-8 -94 4 -94 10 -92 L-4 -82Z', '#fff', 0.4) })}
${shape('M-12 -64 C-14 -76 -2 -82 4 -82 C14 -82 18 -74 14 -64 C10 -56 -8 -56 -12 -64Z', { f: '#1b1722', ol: EO, w: 1.6 })}
<path d="M-6 -70 L-2 -66 M12 -70 L8 -66" stroke="${K.hLight}" stroke-width="1.4" opacity="0"/>
${epoint(K, -3, -68, 2)}${epoint(K, 9, -68, 2)}
<path d="M-6 -61 q6 -3 12 0" stroke="${K.hLight}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
<!-- tear drips + dangling moss sleeves -->
<path d="M-3 -64 q-1 6 -1 10" stroke="${K.hFog}" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>
<path d="M-38 -44 C-52 -36 -50 -16 -46 2 L-36 -4 C-38 -16 -34 -28 -30 -36Z" fill="url(#gMoss)" stroke="${EO}" stroke-width="3" stroke-linejoin="round"/>
<path d="M40 -44 C54 -36 52 -16 48 2 L38 -4 C40 -16 36 -28 32 -36Z" fill="url(#gMoss)" stroke="${EO}" stroke-width="3" stroke-linejoin="round"/>
${drip(-44, -6, 14)}${drip(-38, 0, 10)}${drip(46, -6, 14)}${drip(40, 0, 10)}
<path d="M-8 -50 q0 14 -3 26 M10 -50 q0 12 3 24" stroke="#4a6648" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}

// ===================== ELDER TREANT (boss) =====================
export function treant(K) {
  const crown = 'M-34 -224 L-52 -262 L-40 -254 L-44 -292 L-28 -262 L-22 -300 L-10 -262 L0 -310 L10 -262 L22 -300 L28 -262 L44 -292 L40 -254 L52 -262 L34 -224Z';
  const armL = 'M-52 -170 C-90 -190 -120 -180 -140 -230 L-150 -262 L-138 -246 L-136 -280 L-124 -250 L-114 -272 L-112 -236 C-100 -210 -82 -198 -60 -196Z';
  const armR = 'M52 -170 C90 -190 120 -180 140 -230 L150 -262 L138 -246 L136 -280 L124 -250 L114 -272 L112 -236 C100 -210 82 -198 60 -196Z';
  const trunk = 'M-50 -2 C-58 -40 -66 -100 -58 -160 C-62 -186 -48 -218 -34 -228 C-12 -238 12 -238 34 -228 C48 -218 62 -186 58 -160 C66 -100 58 -40 50 -2 L36 8 L20 -4 L8 8 L-8 -4 L-20 8 L-36 -4Z';
  const roots = 'M-50 -2 L-92 6 L-70 -14 M50 -2 L92 6 L70 -14 M-30 4 L-50 20 M30 4 L50 20';
  return `${ground(120, 16, 0.5, 6)}
${veins(K, 0, 10, 120, 41, 5, 7)}
<path d="${roots}" fill="none" stroke="${EO}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="${roots}" fill="none" stroke="url(#gBark)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
${shape(armL, { f: 'url(#gBark)', rim: K.hLight, ol: EO, w: 5, x: sh('M-150 -190 L-60 -190 L-60 -160 L-150 -160Z', '#000', 0.3, 'b8') })}
${shape(armR, { f: 'url(#gBark)', rim: K.hLight, ol: EO, w: 5, x: sh('M60 -190 L150 -190 L150 -160 L60 -160Z', '#000', 0.4, 'b8') })}
${shape(trunk, { f: 'url(#gBark)', rim: K.hLight, ol: EO, w: 6, x:
    sh('M20 -240 C70 -200 70 -60 40 10 L90 10 L90 -240Z', '#000', 0.4, 'b8') + hl('M-52 -214 C-64 -170 -62 -100 -52 -40 L-40 -50 C-48 -100 -48 -170 -38 -214Z', '#fff', 0.3, 'b4')
    + `<path d="M-30 -230 C-36 -180 -28 -120 -34 -60 M-8 -236 C-4 -170 -14 -110 -8 -40 M22 -232 C28 -180 20 -120 26 -50" fill="none" stroke="${K.hG3}" stroke-width="3" opacity=".75"/>`
    + `<path d="M-52 -150 C-30 -140 -20 -120 -26 -90 M52 -120 C30 -112 22 -96 28 -64" fill="none" stroke="${K.vein}" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`
    + `<ellipse cx="-34" cy="-176" rx="16" ry="10" fill="#6f8a6a" opacity=".7"/><ellipse cx="38" cy="-100" rx="12" ry="8" fill="#6f8a6a" opacity=".6"/>` })}
<!-- hollow chest cavity: the Hollow inside, glowing coldly -->
<path d="M-24 -150 C-30 -122 -22 -84 0 -74 C22 -84 30 -122 24 -150 C14 -162 -14 -162 -24 -150Z" fill="#0a0710" stroke="${EO}" stroke-width="4"/>
<ellipse cx="0" cy="-116" rx="22" ry="38" fill="url(#gGlowBad)" opacity=".55"/>
<path d="M-12 -144 C-16 -120 -10 -98 0 -92 C10 -98 16 -120 12 -144Z" fill="#2a1520" opacity=".8"/>
<!-- crown (dead antlers, a few green memories) -->
${shape(crown, { f: 'url(#gBark)', rim: K.hLight, ol: EO, w: 5 })}
<g fill="#78a068" stroke="${EO}" stroke-width="2.4"><path d="M-44 -292 q-8 -8 -2 -16 q8 4 2 16Z"/><path d="M-22 -300 q-2 -10 6 -14 q4 8 -6 14Z"/><path d="M44 -292 q8 -8 2 -16 q-8 4 -2 16Z"/></g>
<!-- sad hollow face -->
<path d="M-26 -214 C-26 -228 -8 -228 -6 -214 C-6 -200 -20 -198 -26 -214Z" fill="#0a0710" stroke="${EO}" stroke-width="3"/>
<path d="M26 -214 C26 -228 8 -228 6 -214 C6 -200 20 -198 26 -214Z" fill="#0a0710" stroke="${EO}" stroke-width="3"/>
${epoint(K, -16, -213, 4.2)}${epoint(K, 16, -213, 4.2)}
<path d="M-32 -232 L-6 -224 M32 -232 L6 -224" stroke="${EO}" stroke-width="5" stroke-linecap="round"/>
<path d="M-14 -188 C-6 -194 6 -194 14 -188" stroke="${EO}" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M-18 -204 q-2 12 -1 22" stroke="${K.hFog}" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/>`;
}
