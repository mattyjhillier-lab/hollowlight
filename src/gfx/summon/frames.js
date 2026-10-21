// S0 summon atlas: frame list, sizes, anchors and the shelf packer (pure data, no DOM). docs/design/summons-art-v1.md sections 2, 5, 6.
// Frame budget (section 5): wolf 6 + 3 overlays + Alpha 6 + hollow echo 6; raven 7 + Low 2; glyph 5 + page 2; flame 3 + big flame 3 + bead;
// decals 10; Low flats 4. Sizes are texels; TEXELS_PER_UNIT converts to world units. Anchor (ax, ay) = ground point / centre as a 0..1 fraction of the frame.
// Wolf world size 36-42 u (LOCKED Summons art #3); Alpha is 1.7x the wolf.
export const SUM_KEY = 'sum_atlas';
export const TEXELS_PER_UNIT = 3;
export const PAGE_W = 1024;
export const MAX_PAGE_H = 1024;

const F = [];
const add = (group, name, w, h, ax, ay, role) => F.push({ id: F.length, name, group, w, h, ax, ay, role });
const seq = (group, prefix, n, w, h, ax, ay, role) => { for (let i = 0; i < n; i++) add(group, `${prefix}${i}`, w, h, ax, ay, role); };

// wolves: 128x96 texels = 42.7 x 32 u; feet line at 86% down, body centred
seq('wolf', 'wolf_', 6, 128, 96, 0.5, 0.86, 'wolf'); // lope x4, bite, sit
seq('wolf', 'wolf_ov', 3, 128, 96, 0.5, 0.86, 'wolf'); // notched ear, chest tuft, curl tail
seq('alpha', 'alpha_', 6, 176, 128, 0.5, 0.86, 'wolf'); // 1.7x, gold rim added at use time
seq('echo', 'echo_', 6, 128, 96, 0.5, 0.86, 'wolf'); // hollow outline wolf
// ravens (centre-anchored flyers)
['perch', 'up', 'down', 'swoop', 'peck', 'spread', 'dive'].forEach((n) => add('raven', 'raven_' + n, 64, 64, 0.5, 0.5, 'raven'));
seq('low', 'raven_flat', 2, 48, 48, 0.5, 0.5, 'raven');
// spirit bolts
seq('glyph', 'glyph_', 5, 64, 64, 0.5, 0.5, 'bolt');
seq('glyph', 'page_', 2, 64, 64, 0.5, 0.5, 'bolt');
// holy orbit flames
seq('flame', 'flame_', 3, 48, 64, 0.5, 0.78, 'orbit');
seq('flame', 'flame_big', 3, 64, 80, 0.5, 0.78, 'orbit');
add('flame', 'wax_bead', 24, 24, 0.5, 0.5, 'orbit');
// impact / hit decals
['crescent', 'crackstar', 'ink', 'star', 'feather', 'waxseal', 'paw', 'petal', 'mote', 'crescent2'].forEach((n) => add('decal', 'decal_' + n, 48, 48, 0.5, 0.5, 'fx'));
// Low-tier flats (glow baked in, no halo)
add('low', 'flat_wolf', 96, 72, 0.5, 0.86, 'wolf');
add('low', 'flat_raven', 48, 48, 0.5, 0.5, 'raven');
add('low', 'flat_glyph', 48, 48, 0.5, 0.5, 'bolt');
add('low', 'flat_flame', 48, 48, 0.5, 0.78, 'orbit');

export const FRAMES = F.map((f) => Object.freeze(f));
export const FRAME_COUNT = FRAMES.length;
export const FRAME_BY_NAME = Object.freeze(Object.fromEntries(FRAMES.map((f) => [f.name, f])));
export const PAD = 2; // transparent gutter between frames (stops bilinear bleed)

// Shelf packer: tall frames first, rows left to right. Returns { frames: [{...f, x, y}], w, h, used } with h rounded up to a multiple of 16.
export function packFrames(frames = FRAMES, pageW = PAGE_W) {
  const order = [...frames].sort((a, b) => b.h - a.h || b.w - a.w || a.id - b.id);
  let x = 0, y = 0, rowH = 0;
  const out = new Array(frames.length);
  for (const f of order) {
    if (x + f.w + PAD > pageW) { x = 0; y += rowH + PAD; rowH = 0; }
    out[f.id] = { ...f, x, y };
    x += f.w + PAD; rowH = Math.max(rowH, f.h);
  }
  const need = y + rowH;
  const h = Math.ceil(need / 16) * 16; // NPOT height is fine for a clamped, non-mipmapped WebGL texture; saves ~1.7 MB vs a power of two
  return { frames: out, w: pageW, h, used: need };
}
export const PACK = packFrames();
export const texelsTotal = () => FRAMES.reduce((s, f) => s + f.w * f.h, 0);
