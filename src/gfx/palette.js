// Single source of colours: "Moonlit Spirit-Glow" (docs/research/06). Pure JS, no DOM.
// Gold is reserved for evolutions/rare things; red only for danger.
export const PAL = {
  ink: 0x07070d,
  deep: 0x12182b,
  slate: 0x1d2b3a,
  moss: 0x2f4a4a,
  teal: 0x6fd3c5,
  ice: 0xb8f2ff,
  violet: 0x8a5cff,
  gold: 0xffd27a,
  lavender: 0xe8e0ff,
  danger: 0xd9534f, // not in 06; the one warning colour
};

export const hexStr = (n) => `#${n.toString(16).padStart(6, '0')}`;

// CSS variable name -> palette colour. style.css :root must match (tests/palette.test.mjs).
export const CSS_VARS = {
  '--ink': PAL.ink,
  '--bg': PAL.ink,
  '--panel-solid': PAL.deep,
  '--line': PAL.moss,
  '--slate': PAL.slate,
  '--text': PAL.lavender,
  '--muted': 0x9fb3c8,
  '--teal': PAL.teal,
  '--ice': PAL.ice,
  '--violet': PAL.violet,
  '--gold': PAL.gold,
  '--hp': PAL.danger,
  '--xp': PAL.teal,
  '--good': PAL.teal,
};

export function applyCssPalette(root) {
  for (const k of Object.keys(CSS_VARS)) root.style.setProperty(k, hexStr(CSS_VARS[k]));
}

// Dusk-to-dawn arc (docs/research/15 s2). Keyframes at fraction of the run:
// [f, lightmap ambient (Med/High), Low-tier multiply tint, fog tint].
// Violet dusk -> blue evening -> deep night (darkest) -> rose pre-dawn -> first light -> dawn.
export const ARC = [
  [0.0, 0x6a5a9a, 0xc0b0f0, 0x4a6a9a],
  [0.25, 0x44507e, 0x98a4e0, 0x4a6a9a],
  [0.55, 0x33406c, 0x8a98d6, 0x4a6a9a],
  [0.8, 0x5a4a78, 0xb8a0c8, 0x8a6a9a],
  [0.95, 0xb08a8a, 0xe8c0b8, 0xc88a9a],
  [1.0, 0xffe2c4, 0xfff0dc, 0xc88a9a],
];

const ch = (c, s) => (c >> s) & 255;
// No allocation: returns a packed 0xRRGGBB int. col: 1 = ambient, 2 = low multiply, 3 = fog.
function arcAt(f, col) {
  if (!(f > 0)) f = 0;
  if (f > 1) f = 1;
  let i = 1;
  while (i < ARC.length - 1 && f > ARC[i][0]) i++;
  const a = ARC[i - 1];
  const b = ARC[i];
  const t = (f - a[0]) / (b[0] - a[0]);
  const ca = a[col];
  const cb = b[col];
  const r = (ch(ca, 16) + (ch(cb, 16) - ch(ca, 16)) * t) | 0;
  const g = (ch(ca, 8) + (ch(cb, 8) - ch(ca, 8)) * t) | 0;
  const bl = (ch(ca, 0) + (ch(cb, 0) - ch(ca, 0)) * t) | 0;
  return (r << 16) | (g << 8) | bl;
}
// Low-tier multiply tint (same API as before).
export const gradeAt = (f) => arcAt(f, 2);
// Lightmap ambient fill (Med/High).
export const ambientAt = (f) => arcAt(f, 1);
export const fogAt = (f) => arcAt(f, 3);
