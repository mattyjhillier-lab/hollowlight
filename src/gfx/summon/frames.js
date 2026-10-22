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

// wolves (S1): 128x96 texels = the wolf.js du box at 1 texel per du (drawn at WOLF_WPD world units per du, ~16 u long = 39 px desktop);
// feet line at 90/96 down (du y = 0 in the [-90, 6] box)
const WOLF_AY = 90 / 96;
seq('wolf', 'wolf_', 6, 128, 96, 0.5, WOLF_AY, 'wolf'); // lope x4, bite, sit
seq('wolf', 'wolf_ov', 3, 128, 96, 0.5, WOLF_AY, 'wolf'); // notched ear, chest tuft, curl tail
// S2 wolf evolutions: The Alpha (frost mane, amber eyes, gold rim baked) at 1 texel per du in its 132 x 96 du box, drawn 1.7x (S0 baked 176 x 128;
// 1 texel per du keeps the page inside the 2.5 MB budget and is still ~0.65 device px per texel at 1.7x on the desktop)
seq('alpha', 'alpha_', 6, 132, 96, 0.5, WOLF_AY, 'wolf');
seq('echo', 'echo_', 6, 128, 96, 0.5, WOLF_AY, 'wolf'); // Echo Pack: hollow outline wolf
seq('wolfg', 'wolfg_', 6, 128, 96, 0.5, WOLF_AY, 'wolf'); // evolved pack (Howling Legion): the wolf with the gold rim baked in
seq('lfoot', 'lfoot_', 6, 128, 96, 72 / 128, WOLF_AY, 'wolf'); // Light Trails: streaming ears/tail + gold rim (box 8 du back)
// ravens (centre-anchored flyers)
// S3 Letter Ravens: 64 texels for the 88 du box (raven.js RAVEN_BOX); gold-rimmed evolved poses (ravg_, no peck); Low flats 0 = plain, 1 = gold
['perch', 'up', 'down', 'swoop', 'peck', 'spread', 'dive'].forEach((n) => add('raven', 'raven_' + n, 64, 64, 0.5, 0.5, 'raven'));
['perch', 'up', 'down', 'swoop', 'spread', 'dive'].forEach((n) => add('ravg', 'ravg_' + n, 64, 64, 0.5, 0.5, 'raven'));
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
add('low', 'flat_wolf', 96, 72, 0.5, WOLF_AY, 'wolf'); // S1: Low-tier wolf (same du box at 0.75 texel per du)
add('low', 'flat_raven', 48, 48, 0.5, 0.5, 'raven');
add('low', 'flat_glyph', 48, 48, 0.5, 0.5, 'bolt');
add('low', 'flat_flame', 48, 48, 0.5, 0.78, 'orbit');
add('low', 'flat_wolfg', 96, 72, 0.5, WOLF_AY, 'wolf'); // S2: Low-tier evolved wolf (gold rim baked; the Alpha uses it at 1.7x)

export const FRAMES = F.map((f) => Object.freeze(f));
export const FRAME_COUNT = FRAMES.length;
export const FRAME_BY_NAME = Object.freeze(Object.fromEntries(FRAMES.map((f) => [f.name, f])));
export const PAD = 2; // transparent gutter between frames (stops bilinear bleed)

// Shelf packer: tall frames first, rows left to right; S3: first fit (a frame goes into the first earlier row with room at its right end, so the
// tall rows' leftover gaps are used and the page stays inside the 2.5 MB budget). Returns { frames: [{...f, x, y}], w, h, used }, h a multiple of 16.
export function packFrames(frames = FRAMES, pageW = PAGE_W) {
  const order = [...frames].sort((a, b) => b.h - a.h || b.w - a.w || a.id - b.id);
  const rows = []; // { y, h, x }
  const out = new Array(frames.length);
  for (const f of order) {
    let r = rows.find((q) => f.h <= q.h && q.x + f.w <= pageW);
    if (!r) { const last = rows[rows.length - 1]; r = { y: last ? last.y + last.h + PAD : 0, h: f.h, x: 0 }; rows.push(r); }
    out[f.id] = { ...f, x: r.x, y: r.y };
    r.x += f.w + PAD;
  }
  const last = rows[rows.length - 1];
  const need = last ? last.y + last.h : 0;
  const h = Math.ceil(need / 16) * 16; // NPOT height is fine for a clamped, non-mipmapped WebGL texture; saves ~1.7 MB vs a power of two
  return { frames: out, w: pageW, h, used: need };
}
export const PACK = packFrames();
export const texelsTotal = () => FRAMES.reduce((s, f) => s + f.w * f.h, 0);
