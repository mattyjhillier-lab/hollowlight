// S0: bakes the `sum_atlas` texture at boot from code (same pipeline as critteratlas / en_atlas). S1: the Ghost Wolf A frames (wolf.js SVG sheet)
// are rasterised once through an <img> from a Blob URL (our own code, no external references, no untrusted input) into their packed rects,
// then the texture is re-uploaded; until that lands (or on any failure) RunScene keeps today's wolf sprite (SUM_ART.wolf stays false).
// ?summons=0 skips the bake entirely and the game keeps today's sprites (sprites.js wolfU / raven / bolt / orb).
import { PACK, SUM_KEY, TEXELS_PER_UNIT, PAGE_W, FRAME_BY_NAME } from './frames.js';
import { paintAll } from './paint.js';
import { wolfSheet } from './wolf.js';
import { ravenSheet, POSES, GOLD_POSES } from './raven.js';

export { SUM_KEY };
export const SUM_ART = { wolf: false, wolfMs: 0, wolfMainMs: 0, error: '', promise: null }; // wolfMs = wall time incl. the async SVG decode; wolfMainMs = main-thread work only
export function drawSummonAtlas(cv, packed = PACK) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  return paintAll(c, packed);
}

// wolf frames to bake: [frame name, kind, index]
const SIX = [0, 1, 2, 3, 4, 5];
export const WOLF_BAKE = [
  ...SIX.map((i) => ['wolf_' + i, 'base', i]),
  ...[0, 1, 2].map((i) => ['wolf_ov' + i, 'ov', i]),
  ['flat_wolf', 'flat', 0],
  // S2 evolutions: gold-rimmed pack, Light Trails, The Alpha, Echo Pack, Low evolved flat
  ...SIX.map((i) => ['wolfg_' + i, 'gold', i]),
  ...SIX.map((i) => ['lfoot_' + i, 'lfoot', i]),
  ...SIX.map((i) => ['alpha_' + i, 'alpha', i]),
  ...SIX.map((i) => ['echo_' + i, 'echo', i]),
  ['flat_wolfg', 'flatg', 0],
];
export function wolfRects(packed = PACK) {
  return WOLF_BAKE.map(([name, kind, i]) => { const f = packed.frames[FRAME_BY_NAME[name].id]; return { name, kind, i, x: f.x, y: f.y, w: f.w, h: f.h }; });
}

// Registers the atlas as a Phaser texture with one named frame per sprite. Returns { inv, ms, tex, cv } (world units per texel, bake milliseconds)
// or null when disabled. `now` is injectable for tests.
export function makeSummonAtlas(scene, mkCanvas, { enabled = true, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) } = {}) {
  if (!enabled) return null;
  const t0 = now();
  const cv = mkCanvas(PAGE_W, PACK.h);
  drawSummonAtlas(cv);
  if (scene.textures.exists(SUM_KEY)) scene.textures.remove(SUM_KEY);
  const tex = scene.textures.addCanvas(SUM_KEY, cv);
  for (const f of PACK.frames) tex.add(f.name, 0, f.x, f.y, f.w, f.h);
  const ms = now() - t0;
  return { inv: 1 / TEXELS_PER_UNIT, ms, tex, cv };
}

// S1: async wolf art bake (browser only). Resolves true when the BASE wolf frames (lope/bite/sit, overlays, Low flat) are in the texture.
// S2: the evolution frames are NOT baked at boot (rasterising the filtered SVG is main-thread work: all 35 frames cost ~265 ms headless).
// bakeWolfEvo() bakes only the kinds the run's wolf evolution needs, one frame per task (yielding between frames), on first evolution.
export const BOOT_KINDS = ['base', 'ov', 'flat'];
export const EVO_KINDS = { howling_legion: ['gold', 'echo', 'flatg'], phantom_stampede: ['lfoot', 'flatg'], dire_alpha: ['alpha', 'flatg'] };
SUM_ART.kinds = new Set(); SUM_ART.evoMs = 0; SUM_ART.evoMaxStepMs = 0; SUM_ART.pending = new Set();
const KIND_OF = [['ravg_', 'rgold'], ['raven_flat1', 'rflatg'], ['raven_flat0', 'rflat'], ['raven_', 'rbase'], ['wolfg_', 'gold'], ['lfoot_', 'lfoot'], ['alpha_', 'alpha'], ['echo_', 'echo'], ['flat_wolfg', 'flatg'], ['wolf_ov', 'ov'], ['wolf_', 'base'], ['flat_wolf', 'flat']];
export const kindOf = (frame) => { for (const [p, k] of KIND_OF) if (frame.startsWith(p)) return k; return null; };
export const frameReady = (frame) => SUM_ART.kinds.has(kindOf(frame));

async function rasterise(rects, sa, sheet = wolfSheet) {
  // the sheet is only as big as the rects' bounding box (a single evolution frame rasterises 128 x 96, not the whole page)
  const x0 = Math.min(...rects.map((r) => r.x)), y0 = Math.min(...rects.map((r) => r.y));
  const W = Math.max(...rects.map((r) => r.x + r.w)) - x0, H = Math.max(...rects.map((r) => r.y + r.h)) - y0;
  const url = URL.createObjectURL(new Blob([sheet(rects.map((r) => ({ ...r, x: r.x - x0, y: r.y - y0 })), W, H)], { type: 'image/svg+xml' }));
  let img;
  try { img = new Image(); img.decoding = 'async'; img.src = url; await img.decode(); } finally { URL.revokeObjectURL(url); }
  const t = performance.now();
  const c = sa.cv.getContext('2d');
  for (const r of rects) c.clearRect(r.x, r.y, r.w, r.h);
  for (const r of rects) c.drawImage(img, r.x - x0, r.y - y0, r.w, r.h, r.x, r.y, r.w, r.h);
  return performance.now() - t;
}
const yieldTask = () => new Promise((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 0)));

export function bakeWolfArt(sa) {
  if (SUM_ART.promise) return SUM_ART.promise;
  SUM_ART.promise = (async () => {
    const t0 = performance.now();
    try {
      const rects = wolfRects().filter((r) => BOOT_KINDS.includes(r.kind));
      SUM_ART.wolfMainMs = await rasterise(rects, sa);
      const t = performance.now();
      if (sa.tex && sa.tex.refresh) sa.tex.refresh();
      SUM_ART.wolfMainMs += performance.now() - t;
      for (const k of BOOT_KINDS) SUM_ART.kinds.add(k);
      SUM_ART.wolf = true;
    } catch (e) { SUM_ART.error = String((e && e.message) || e); SUM_ART.wolf = false; }
    SUM_ART.wolfMs = performance.now() - t0;
    return SUM_ART.wolf;
  })();
  return SUM_ART.promise;
}

// S3 Letter Ravens: nothing at boot. The plain flock (7 poses + Low flat) bakes lazily the first time the run owns Raven Flock, the gold-rimmed
// evolved poses (+ Low gold flat) on its first evolution; one frame per idle task. Until a kind lands RunScene keeps today's raven sprite
// (plain) or the plain raven frame (gold). ?summons=0: never (no atlas).
export const RAVEN_BAKE = [
  ...POSES.map((p, i) => ['raven_' + p, 'rbase', i]), ['raven_flat0', 'rflat', 0],
  ...GOLD_POSES.map((p, i) => ['ravg_' + p, 'rgold', i]), ['raven_flat1', 'rflatg', 0],
];
export const RAVEN_KINDS = { base: ['rbase', 'rflat'], gold: ['rgold', 'rflatg'] };
export function ravenRects(packed = PACK) {
  return RAVEN_BAKE.map(([name, kind, i]) => { const f = packed.frames[FRAME_BY_NAME[name].id]; return { name, kind, i, x: f.x, y: f.y, w: f.w, h: f.h }; });
}
SUM_ART.raven = false;
export const ravenReady = () => SUM_ART.raven;
// Bakes the given kinds one frame per task (idempotent: kinds already baked or pending are skipped). Resolves true when all landed.
function bakeKinds(sa, need, rectsOf, sheet, onDone) {
  need = need.filter((k) => !SUM_ART.kinds.has(k) && !SUM_ART.pending.has(k));
  if (!need.length || !sa) return Promise.resolve(false);
  for (const k of need) SUM_ART.pending.add(k);
  return (async () => {
    try {
      if (SUM_ART.promise) await SUM_ART.promise; // never alongside the boot bake
      for (const k of need) {
        for (const r of rectsOf().filter((x) => x.kind === k)) {
          await yieldTask();
          const ms = await rasterise([r], sa, sheet);
          SUM_ART.evoMs += ms; SUM_ART.evoMaxStepMs = Math.max(SUM_ART.evoMaxStepMs, ms);
        }
        await yieldTask();
        const t = performance.now();
        if (sa.tex && sa.tex.refresh) sa.tex.refresh();
        const ms = performance.now() - t; SUM_ART.evoMs += ms; SUM_ART.evoMaxStepMs = Math.max(SUM_ART.evoMaxStepMs, ms);
        SUM_ART.kinds.add(k); SUM_ART.pending.delete(k);
      }
      if (onDone) onDone();
      return true;
    } catch (e) { SUM_ART.error = String((e && e.message) || e); for (const k of need) SUM_ART.pending.delete(k); return false; }
  })();
}
export function bakeRavenArt(sa, evolved = false) {
  if (SUM_ART.raven && (!evolved || SUM_ART.kinds.has('rflatg'))) return null; // fast path: called every frame while the flock is owned
  const p = bakeKinds(sa, RAVEN_KINDS.base, ravenRects, ravenSheet, () => { SUM_ART.raven = true; });
  if (evolved) bakeKinds(sa, RAVEN_KINDS.gold, ravenRects, ravenSheet);
  return p;
}

// S2: bake one evolution's frames lazily (idempotent). One frame per task; the texture is re-uploaded once per kind. Until a kind lands
// RunScene draws the base wolf in its place (frameReady).
export function bakeWolfEvo(sa, evo) {
  const need = (EVO_KINDS[evo] || []).filter((k) => !SUM_ART.kinds.has(k) && !SUM_ART.pending.has(k));
  if (!need.length || !sa) return Promise.resolve(false);
  for (const k of need) SUM_ART.pending.add(k);
  return (async () => {
    try {
      if (SUM_ART.promise) await SUM_ART.promise;
      if (!SUM_ART.wolf) return false;
      for (const k of need) {
        for (const r of wolfRects().filter((x) => x.kind === k)) {
          await yieldTask();
          const ms = await rasterise([r], sa);
          SUM_ART.evoMs += ms; SUM_ART.evoMaxStepMs = Math.max(SUM_ART.evoMaxStepMs, ms);
        }
        await yieldTask();
        const t = performance.now();
        if (sa.tex && sa.tex.refresh) sa.tex.refresh();
        const ms = performance.now() - t; SUM_ART.evoMs += ms; SUM_ART.evoMaxStepMs = Math.max(SUM_ART.evoMaxStepMs, ms);
        SUM_ART.kinds.add(k); SUM_ART.pending.delete(k);
      }
      return true;
    } catch (e) { SUM_ART.error = String((e && e.message) || e); for (const k of need) SUM_ART.pending.delete(k); return false; }
  })();
}
