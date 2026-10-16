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
  // HUD-1 Warm Lantern roles (docs/mockups/hud-sheet): brass plates/currency, cream thread/text, lantern flame (HP), frost (low HP).
  // NOT the evolution gold: gold stays reserved for evolutions and the dawn sun.
  plate: 0x1c1714,
  brass: 0xd8b26a,
  brassDark: 0x8d6c34,
  cream: 0xfff3dc,
  thread: 0xffe0a0,
  flame: 0xffab3a,
  frost: 0xdff1fa,
  frostDark: 0x8fb6c9,
  // UI IDENTITY v1 / U1 Lantern Glass roles (docs/design/ui-identity-v1.md). Evolution gold #ffd36b is ROLE.evo; ember = flame at ~55% on plate.
  ember: 0x996829,
  wickDark: 0x3a2d24,
};

// Role tokens (docs/research/15 s2): world art, effects and sprites ask for a ROLE, never a hex, so a palette
// swap (per chapter later) is one object. Cool light = friend, ember = enemy eyes/danger, gold = evolutions only.
export const ROLE = {
  void: 0x0d1426, ground: 0x3a4a66, groundLow: 0x24304a, treeCanopy: 0x1f3048, treeRim: 0x6a8ab0,
  enemyBody: 0x5b4f63, enemyTop: 0x8a7d92, enemyUnder: 0x2e2838, enemyRim: 0xff9a6a, eye: 0xff4a2a, eyeCore: 0xffe6b8,
  crowBody: 0x3e3a58, crowTop: 0x6c6890, beak: 0xb0703a,
  rootBody: 0x4e3b34, rootTop: 0x8a6a52, rootCrack: 0xff8a3a, moss: 0x2f4a3a,
  bark: 0x5a3e2a, barkRim: 0x8a6448, canopy: 0x2f6a3a, bossEye: 0xffb84a,
  hero: 0xb4643c, heroLit: 0xffb27a, heroBack: 0x6a3a24, heroLining: 0x2a1d3a, face: 0xf6dfc0, scarf: 0x6fd3c5, staff: 0x5a3e2a,
  eliasRobe: 0xe8e2d0, eliasSash: 0x8a5cff, eliasTrim: 0xd8d0ff,
  lantern: 0xffcf7a, lanternCore: 0xfff1c8,
  spiritA: 0x9fe8ff, spiritA2: 0x4ab8e0, spiritB: 0x8a6fe0, spiritB2: 0xc9b8ff, spiritC: 0xb8f2ff, bolt: 0x7ff0ff, lightning: 0xe8f4ff,
  pickup: 0x7dffc4, heart: 0xff6f86, magnet: 0xa98aff,
  bleed: 0x9fd8ff, bleedTint: 0xb0d8ff, // wolf light (weapons.json #9fd8ff): bleed marks, never red (red = danger only)
  evo: 0xffd36b, evoHot: 0xfff3c4, danger: 0xff4a3a,
  uiA: 0x5ee6ff, uiB: 0x8b6cff, uiText: 0xe8e0ff, uiMuted: 0x9fb3c8,
};

const ROLE_EVO = ROLE.evo;
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
  '--plate': PAL.plate,
  '--brass': PAL.brass,
  '--brass-d': PAL.brassDark,
  '--cream': PAL.cream,
  '--thread': PAL.thread,
  '--flame': PAL.flame,
  '--frost': PAL.frost,
  '--frost-d': PAL.frostDark,
  '--lg-evo': ROLE_EVO,
  '--lg-ember': PAL.ember,
  '--lg-wick-dark': PAL.wickDark,
  '--lg-danger': PAL.danger,
  '--lg-glass-solid': PAL.plate,
  '--lg-text': PAL.cream,
};

export function applyCssPalette(root) {
  for (const k of Object.keys(CSS_VARS)) root.style.setProperty(k, hexStr(CSS_VARS[k]));
}

// Dusk-to-dawn arc (docs/research/15 s2). Keyframes at fraction of the run:
// [f, lightmap ambient (Med/High), Low-tier multiply tint, fog tint].
// Violet dusk -> blue evening -> deep night (darkest) -> rose pre-dawn -> first light -> dawn.
export const ARC = [
  [0.0, 0x7f6cb9, 0xc0b0f0, 0x4a6a9a],
  [0.25, 0x526097, 0x98a4e0, 0x4a6a9a],
  [0.55, 0x3d4d82, 0x8a98d6, 0x4a6a9a],
  [0.8, 0x6c5990, 0xb8a0c8, 0x8a6a9a],
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
