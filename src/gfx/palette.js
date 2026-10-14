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

// Dusk-to-dawn colour grade (multiply). Keyframes at fraction of the run.
// Deep dusk violet -> night blue -> rose pre-dawn -> warm dawn.
const GRADE = [
  [0.0, 0x7d68c8],
  [0.3, 0x5a6cc0],
  [0.6, 0x4f68b0],
  [0.85, 0xc09aa8],
  [1.0, 0xffe2b0],
];

const ch = (c, s) => (c >> s) & 255;
// No allocation: returns a packed 0xRRGGBB int.
export function gradeAt(f) {
  if (!(f > 0)) f = 0;
  if (f > 1) f = 1;
  let i = 1;
  while (i < GRADE.length - 1 && f > GRADE[i][0]) i++;
  const a = GRADE[i - 1];
  const b = GRADE[i];
  const t = (f - a[0]) / (b[0] - a[0]);
  const r = (ch(a[1], 16) + (ch(b[1], 16) - ch(a[1], 16)) * t) | 0;
  const g = (ch(a[1], 8) + (ch(b[1], 8) - ch(a[1], 8)) * t) | 0;
  const bl = (ch(a[1], 0) + (ch(b[1], 0) - ch(a[1], 0)) * t) | 0;
  return (r << 16) | (g << 8) | bl;
}
