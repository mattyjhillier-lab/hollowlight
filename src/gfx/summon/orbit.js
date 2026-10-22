// S4 Holy Orbit A "Candle Flames" (LOCKED Summons art #3 + the Elias v2 flame ring, docs/design/summons-art-v1.md 3.5): game port of the mock-up
// painter docs/mockups/summons-art/more.mjs flameA on the shared Husk paint engine. Pure JS: builds SVG strings only (no DOM); atlas.js rasterises
// them lazily (first time the run owns Holy Orbit; gold frames on its first evolution) into the flame frames of `sum_atlas`.
// Look: lilac-white teardrop flame, ink tinted outline, cream core, warm ember heart, a tiny wick and a cream wax bead; flicker x3 (three baked
// heights). Lean into the spin and the flare on hit are drawn by the scene (rotation / scale + self-light), not baked.
// Units: du (mock-up scale), origin = the flame base (wick top), y up negative. Frame box = FLAME_BOX (32 x 48 texels for 28 x 42 du).
import { part, glow, f, resetAll, defs, setGrainBox, lin, mix } from '../husk/paint.js';
import { RIM_DEFS } from './wolf.js';

export const WARM = '#fff1c8', EMBER = '#ffcf7a';
export const R = { lt: '#ffffff', c: '#e8e0ff', dk: '#a996e8', ink: '#5b4a9e', glow: '#d9ccff', burn: '#c79bff' };
export const WICK = '#4a3a5e', WAX = '#efe6d4';
export const FLAME_BOX = [-14, -29, 28, 42];
export const FLAME_LEN_DU = 32; // flame tip (-22) to the bead's lower edge (+10)
// world units per du: today's flame is 11.4 u drawn x0.8 with Elias (9.1 u); LOCKED 1.6x -> 14.6 u (~35 px tall on the 1280x720 desktop)
export const FLAME_WPD = (11.4 * 0.8 * 1.6) / FLAME_LEN_DU;
export const WHEEL_K = 1.45; // Judgement Wheel: the 4 big flames (gold frames drawn 1.45x)
export const HALO_K = 0.8; // Sanctum Halo: 12 small candles (gold frames drawn 0.8x)
export const OUTLINE = 1.4; // tinted ink outline width (du); 2 du measured no better in daylight (tried in S4)
export const FLICKER = [{ h: 0, w: 0, c: 0 }, { h: 1.8, w: -0.4, c: 0.6 }, { h: -1.4, w: 0.5, c: -0.5 }]; // three baked flicker shapes (du)

// one flame: outer teardrop (ink outline, white -> lilac -> deep lilac gradient, warm rim), lilac-white inner flame, cream core, ember heart
export function flameSvg(st = {}) {
  const fk = FLICKER[st.i || 0], h = 22 + fk.h, w = 8 + fk.w;
  const tear = (s, dy = 0) => { const hh = h * s, ww = w * s, y0 = 4 - (1 - s) * 2 + dy; return `M0 ${f(y0)} C${f(-ww * 1.3)} ${f(y0 - 2)} ${f(-ww)} ${f(y0 - hh * 0.55)} 0 ${f(y0 - hh)} C${f(ww)} ${f(y0 - hh * 0.55)} ${f(ww * 1.3)} ${f(y0 - 2)} 0 ${f(y0)}Z`; };
  let b = st.glow ? glow(0, -9, 12, 16, R.glow, 0.85) + glow(0, -6, 6, 7, EMBER, 0.4) : '';
  if (st.bead !== false) { // tiny wick and wax bead (the candle the light sits on)
    b += `<path d="M0 4 v3.2" stroke="${WICK}" stroke-width="1.5" stroke-linecap="round"/>`;
    b += part(`M-4.2 8.2 C-4.2 6.4 4.2 6.4 4.2 8.2 C4.2 10.4 -4.2 10.4 -4.2 8.2Z`, WAX, { lw: 1.2, ink: R.ink, lt: '#fffaf0', dk: '#d8ccb4', sh: 1, rim: 0, grain: 0, flat: true });
  }
  b += part(tear(1), R.c, { lw: OUTLINE, ink: R.ink, lt: R.lt, dk: R.dk, rim: 1.6, rimC: WARM, rimA: 0.9, sh: 2, shA: 0.25, grain: 0, dir: [0.5, 0, 0.5, 1] });
  b += `<path d="${tear(0.68, -0.5)}" fill="${mix(R.c, '#ffffff', 0.6)}"/>`;
  b += `<path d="${tear(0.4, -0.6 + fk.c)}" fill="url(#${lin([[0, '#ffffff'], [1, WARM]], [0.5, 0, 0.5, 1])})"/>`;
  b += `<ellipse cx="0" cy="1.6" rx="2" ry="1.6" fill="${EMBER}" opacity=".75"/>`; // warm heart at the root of the flame
  return b;
}
export const goldFlameSvg = (st = {}) => `<g filter="url(#grim)">${flameSvg(st)}</g>`;

// per bake kind: painter(index)
export const KIND = {
  fbase: (i) => flameSvg({ i }),
  fgold: (i) => goldFlameSvg({ i }),
  fpetal: () => goldFlameSvg({ i: 1, bead: false }),
  fflat: () => flameSvg({ i: 0, glow: 1 }),
  fflatg: () => `${glow(0, -9, 12, 16, R.glow, 0.85)}${goldFlameSvg({ i: 0 })}`,
};
// One SVG sheet holding the given flame frames (page coordinates relative to the sheet). frames: [{ x, y, w, h, kind, i }].
export function flameSheet(frames, pageW, pageH) {
  resetAll();
  setGrainBox(FLAME_BOX[0], FLAME_BOX[1], FLAME_BOX[2], FLAME_BOX[3]);
  let body = '';
  for (const fr of frames) body += `<svg x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" viewBox="${FLAME_BOX.join(' ')}" overflow="hidden">${KIND[fr.kind](fr.i)}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}" height="${pageH}" viewBox="0 0 ${pageW} ${pageH}">${defs()}<defs>${RIM_DEFS}</defs>${body}</svg>`;
}
