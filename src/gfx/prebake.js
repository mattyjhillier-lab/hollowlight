// FIX4 pre-bake: everything the run used to create lazily after t=0 is made here instead, in small time slices, behind a truthful loading bar.
// Render/audio only (nothing here touches src/sim or src/data). The work runs quietly in the background while the front door is up (5 ms a frame,
// never in a frame that is already slow); pressing Start brings it to the front (14 ms slices, loading bar) and the run begins only when it is done.
//   boot atlases (Husks, Reliquary, wolf) -> forest-floor tiles -> every summon / evolution frame -> Elder Treant frames -> pooled sprites
//   -> a dummy Storm Thread bolt (arcs, pillar, dome, braid, cracks: JIT + GPU paths) -> every audio cue once, near-silent.
import { SUM_ART, bakeWolfArt, bakeRavenArt, bakeOrbitArt, bakeBoltArt, bakeWolfEvo, EVO_KINDS, GLYPH_KINDS, RAVEN_KINDS, ORBIT_KINDS } from './summon/atlas.js';
import { makeGroundLazy } from './sprites.js';
import { drawArc, drawPillar, drawDome, drawBraid, CrackPool, pillarTop, chainCaps } from './summon/chain.js';
import { probe } from './probe.js';
import { LOWMEM } from './memprofile.js';

// Crash guard: a flag is set while the bake runs and cleared when it finishes. If the page is found with the flag still set (the browser died or was
// closed mid-bake, e.g. out of memory on a phone), the bake stays off on this device and the game falls back to its old lazy behaviour. ?prebake=1 re-enables it.
// The guard is per mode: 'full' (everything) and 'ground' (forest-floor tiles only, the default on iPhone / iPad / low-memory devices) have their own flags,
// so a crash in full mode never switches ground-only off (the legacy flag name is the full mode's).
const keyOf = (mode) => (mode === 'ground' ? 'hollowlight:pb:ground' : 'hollowlight:pb');
const pbGet = (mode) => { try { return localStorage.getItem(keyOf(mode)); } catch (e) { return null; } };
const pbSet = (mode, v) => { try { localStorage.setItem(keyOf(mode), v); } catch (e) { /* storage blocked: ignore */ } };
export function prebakeAllowed(mode = 'full', force = false) {
  if (force) { pbSet(mode, 'ok'); return true; }
  const v = pbGet(mode);
  if (v === 'run') { pbSet(mode, 'off'); return false; }
  return v !== 'off';
}
export const prebakeMark = (mode, done) => pbSet(mode, done ? 'ok' : 'run');
/** Which mode this device starts in: ground-only on low-memory devices, everything elsewhere; ?prebake=1 forces full. Returns null when both are off. */
export function pickPrebakeMode(lowMem, force) {
  if (force) { prebakeAllowed('full', true); return 'full'; }
  const want = lowMem ? ['ground'] : ['full', 'ground'];
  for (const m of want) if (prebakeAllowed(m)) return m;
  return null;
}

export const GROUND_STEPS = 140; // generator slices for both Deep Forest Floor tiles (progress denominator; the bar holds at 99% until really done)
const frame = () => new Promise((r) => { let d = false; const f = () => { if (!d) { d = true; r(); } }; if (typeof requestAnimationFrame === 'function') requestAnimationFrame(f); setTimeout(f, 80); });

export class Prebake {
  constructor(scene, owned = null, mode = 'full') {
    this.mode = mode; this.hold = mode === 'ground' ? 20 : 45;
    this.owned = owned; this.peakMB = 0; // owned(): weapon ids this lantern can be offered (null = all); only their art is baked
    this.s = scene; this.done = false; this.audioDone = false; this.p = 0; this.label = ''; this.budget = 5; this.fg = false;
    this.listeners = new Set(); this.main = null; this.cur = null; this.audioDone = mode === 'ground'; this.doneW = 0; this.total = 1; this.err = []; this.lazy = null;
  }

  setMode(mode) { this.mode = mode; this.hold = mode === 'ground' ? 20 : 45; this.audioDone = mode === 'ground'; }

  /** Bring the work to the front (Start was pressed): bigger slices, summon bakes yield by timer. */
  foreground() { this.fg = true; this.budget = 14; SUM_ART.fast = true; }

  onProgress(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  /** Estimated texture memory in MB: every texture source w*h*4, x2 (CPU canvas + GPU copy). Peak is kept in peakMB (probe / measurement). */
  estMB() {
    let b = 0;
    try { const L = this.s.textures.list; for (const k in L) for (const src of L[k].source || []) b += (src.width || 0) * (src.height || 0) * 4; } catch (e) { /* estimate only */ }
    const mb = (b * 2) / 1048576; if (mb > this.peakMB) this.peakMB = mb; return mb;
  }
  has(id) { let o = null; try { o = typeof this.owned === 'function' ? this.owned() : this.owned; } catch (e) { o = null; } return !Array.isArray(o) || o.includes(id); }
  emit() {
    this.estMB();
    let f = this.cur ? this.cur.frac() : 0; if (!(f >= 0)) f = 0;
    this.p = Math.min(this.done ? 1 : 0.99, (this.doneW + (this.cur ? this.cur.w * Math.min(1, f) : 0)) / this.total);
    for (const fn of this.listeners) fn(this.p, this.label);
  }

  // yield to the browser when this step's slice is used up (background: also skip frames that are already slow)
  async idle() {
    await frame();
    if (!this.fg && this.s.workMs > 12) await frame();
  }

  steps() {
    const s = this.s, self = this;
    const all = [
      { label: 'Waking the spirits', w: 8, frac: () => 0, run: async () => { if (s.bootBake) await s.bootBake; } },
      { id: 'ground', label: 'Painting the forest floor', w: 30, frac: () => (this.lazy ? Math.min(1, this.lazy.n / GROUND_STEPS) : 0), run: async () => {
        const b = s.bState;
        for (let i = 0; i < 40 && !s.gbOn && s.quality.tier !== 'low'; i++) await frame(); // the ground shader is built on the first frames
        if (!b || b.ready >= 1 || s.flatGround || !s.gbOn) return; // Low tier / flat ground never shows the Deep Forest tiles: no 2 x 4 MB canvases
        if (!b.lazy) b.lazy = makeGroundLazy(s);
        this.lazy = b.lazy;
        while (!b.lazy.done) { probe.span('prebake:ground-tile', () => b.lazy.step(self.budget)); self.emit(); await self.idle(); }
        b.fade = 0.8; // the tiles are ready before the run: no fade-in during the first seconds
        if (s.gbOn && s.gb && s.gb.setBReady) { b.ready = 1; s.gb.setBReady(1); }
      } },
      { label: 'Calling the summons', w: 32, frac: () => { const w = this.want(); return w.length ? w.filter((k) => SUM_ART.kinds.has(k)).length / w.length : 1; }, run: async () => {
        const sa = s.sumAtlas; if (!sa) return;
        await bakeWolfArt(sa);
        const one = async (kinds, go) => { // one weapon's frames at a time (a few SVG decodes in flight, not ten)
          if (kinds.every((k) => SUM_ART.kinds.has(k))) return;
          go(); const until = performance.now() + 20000;
          while (performance.now() < until && !SUM_ART.error && kinds.some((k) => !SUM_ART.kinds.has(k))) { self.emit(); await frame(); }
          await self.idle();
        };
        if (this.has('raven_flock')) await one(this.wantKinds('raven_flock'), () => bakeRavenArt(sa, true));
        if (this.has('holy_orbit')) await one(this.wantKinds('holy_orbit'), () => bakeOrbitArt(sa, true));
        if (this.has('spirit_bolts')) for (const e of [null, ...Object.keys(GLYPH_KINDS).filter((k) => k !== 'base')]) await one(e ? GLYPH_KINDS[e] : GLYPH_KINDS.base, () => bakeBoltArt(sa, e));
        if (this.has('ghost_wolves') && SUM_ART.wolf) for (const e of Object.keys(EVO_KINDS)) await one(EVO_KINDS[e], () => bakeWolfEvo(sa, e));
      } },
      { label: 'Waking the Elder Treant', w: 12, frac: () => 0, run: async () => { if (s.phone || s.quality.tier === 'low') return; if (s.bossView && s.bossView.bakeNow) await s.bossView.bakeNow(s.quality.tier); } /* phones / Low: the Treant bakes at 10:00 as before (7 MB atlas x2 stays out of the start-up peak) */ },
      { label: 'Gathering the spirits', w: 4, frac: () => 0, run: async () => {
        for (const p of Object.values(s.pools || {})) { if (p.reserve) { p.reserve(LOWMEM ? 0 : s.phone ? 3 : 6); await self.idle(); } }
        if (s.ribLayer && s.ribLayer.reserve) { s.ribLayer.reserve(LOWMEM ? 40 : s.phone ? 100 : 240); await self.idle(); }
      } },
      { label: 'Warming the lightning', w: 6, frac: () => 0, run: async () => { await this.warmFx(); } },
    ];
    return this.mode === 'ground' ? all.filter((x) => x.id === 'ground') : all;
  }

  wantKinds(w) {
    if (w === 'raven_flock') return Object.values(RAVEN_KINDS).flat();
    if (w === 'holy_orbit') return Object.values(ORBIT_KINDS).flat();
    if (w === 'spirit_bolts') return Object.values(GLYPH_KINDS).flat();
    return SUM_ART.wolf ? Object.values(EVO_KINDS).flat() : [];
  }
  want() { return ['raven_flock', 'holy_orbit', 'spirit_bolts', 'ghost_wolves'].filter((w) => this.has(w)).flatMap((w) => this.wantKinds(w)); }

  // a dummy Storm Thread bolt on a scratch Graphics (same blend as the fx layer), over two real frames, then removed
  async warmFx() {
    const s = this.s; if (!s.fxG || !s.add) return;
    const g = s.add.graphics().setBlendMode(s.fxG.blendMode).setDepth(s.fxG.depth);
    const cam = s.cameras.main, cx = cam.midPoint.x, cy = cam.midPoint.y, caps = chainCaps(s.quality.tier);
    try {
      const crk = new CrackPool(8);
      for (let pass = 0; pass < 2; pass++) {
        g.clear();
        for (let i = 0; i < 12; i++) drawArc(g, cx - 40, cy + i, cx + 30, cy - 20 + i, 977 * (i + 1) + pass, 0.02, caps);
        drawPillar(g, cx, cy + 30, pillarTop(cy + 30, cy - 90, 180, 31), 1234, 0.02, caps, 0.5);
        drawDome(g, cx, cy, 60, pass, 1, false, caps);
        drawBraid(g, cx - 30, cy, cx + 30, cy - 10, 2, 0.02, caps, false);
        crk.add(cx, cy, 0, 3, 13); crk.draw(g, 0.1, cx - 200, cy - 200, cx + 200, cy + 200);
        await frame();
      }
    } catch (e) { this.err.push('fx:' + String((e && e.message) || e)); } finally { g.destroy(); }
  }

  /** The audio step needs a running context (a user gesture); call after Start. Idempotent. */
  async primeAudio(eng) {
    if (this.audioDone || !eng || !eng.ctx || eng.ctx.state !== 'running') return;
    const ids = eng.primeIds(LOWMEM); // low memory: only the hot weapon / pickup cues, the rest build on first use
    let t0 = performance.now();
    for (let i = 0; i < ids.length; i++) {
      probe.span('prebake:audio-cue', () => eng.primeOne(ids[i]));
      this.cur = { w: 4, frac: () => i / ids.length }; this.label = 'Tuning the lanterns'; this.emit();
      if (performance.now() - t0 >= this.budget) { await frame(); t0 = performance.now(); }
    }
    this.audioDone = true;
  }

  /** Start (or join) the main pre-bake. Resolves when every step is finished; never rejects (a failed step is skipped and noted). */
  start() {
    if (this.main) return this.main;
    this.main = (async () => {
      prebakeMark(this.mode, false);
      const st = this.steps(); this.total = st.reduce((a, x) => a + x.w, 0) + 4;
      for (const step of st) {
        this.cur = step; this.label = step.label; this.emit();
        const t = performance.now();
        try { await step.run(); } catch (e) { this.err.push(step.label + ': ' + String((e && e.message) || e)); }
        probe.tag('prebake:' + step.label, performance.now() - t);
        this.doneW += step.w; this.cur = null; this.emit();
      }
      this.main.ok = true; this.mainDone = true; prebakeMark(this.mode, true);
      return true;
    })();
    return this.main;
  }

  /** Foreground (Start pressed): finish the main steps, then prime audio; reports progress along the way. Resolves when the run may begin. */
  async finish(eng, onProgress) {
    this.foreground();
    const off = onProgress ? this.onProgress(onProgress) : null;
    this.start();
    await this.main;
    await this.primeAudio(eng);
    this.done = true; this.cur = null; this.doneW = this.total; this.emit();
    if (off) off();
  }
}
