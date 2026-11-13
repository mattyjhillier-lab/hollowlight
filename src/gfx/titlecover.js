// Title cover "Lantern Vigil" (LOCKED 2026-11-12 picks, 2026-11-13 tune): a code-drawn picture behind the title menu. Seven parallax layers (sky and moon, far grey trees,
// mid trees whose colour blooms around the lantern, painted ground, last-played hero + companion + lantern, light and motes, foreground frame), colour spreading from the
// lantern through the grey Hollow, an entry bloom that any key or tap skips. Render only: it never touches the sim, the RNG or the save, and it never gates a button.
// Performance: every layer is baked once per size in small slices (the menu is live from the first frame), the hero rigs are baked to sprites once, a frame is ~8 draws;
// Calm (and a finished bloom under Calm) draws once and then idles; hidden tab / hidden layer stop the loop; Battery saver and Low tier cut motes and frame rate.
import * as WA from './wrenart.js';
import * as EA from './eliasart.js';
import { glow, PALS, paintGround, drawTree } from './titlepaint.js';
import { probe } from './probe.js'; // ?perf=1 real-device probe (a no-op unless the page was opened with it)
import { TUNE as T, coverMode, heroPos, horizonFrac, bakeMargin, bloomProgress, layerShift, driftTarget, moteCount, flicker, frameGapMs, clamp, mixc, rgba, coverFlame } from './titlelogic.js';

const TAU = Math.PI * 2;
const MODES = ['tc-m-desktop', 'tc-m-portrait', 'tc-m-landscape'];
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const seeded = (seed) => { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

export class TitleCover {
  /** Set once the entry bloom has played in this page load: coming back to the title (from Settings, the Tree, a run) shows the finished picture at once. */
  static seen = false;
  /** The last baked layers, kept for a minute (not on Low / Battery saver) so returning to the title does not bake again. */
  static keep = null; static keepT = 0;
  static supported() {
    try { if (typeof document === 'undefined') return false; const c = document.createElement('canvas'); return !!(c.getContext && c.getContext('2d') && typeof Path2D === 'function'); } catch { return false; }
  }

  /** host: the title overlay element (its first children become the canvas and the vignette). o: { hero, flame:{glow,core}, companion, isCalm(), isLow(), isSaver(), isBaking(), onReady() }. */
  constructor(host, o = {}) {
    this.host = host; this.o = o;
    this.hero = o.hero === 'elias' ? 'elias' : 'wren';
    this.flame = coverFlame(o.flame && o.flame.glow, o.flame && o.flame.core);
    this.companion = o.companion !== false;
    this.cv = document.createElement('canvas'); this.cv.className = 'tc-cv'; this.cv.setAttribute('aria-hidden', 'true');
    this.vig = document.createElement('div'); this.vig.className = 'tc-vig'; this.vig.setAttribute('aria-hidden', 'true'); this.vig.style.opacity = String(T.vig);
    this.cx = this.cv.getContext('2d', { alpha: false });
    host.insertBefore(this.vig, host.firstChild); host.insertBefore(this.cv, host.firstChild);
    this.W = 0; this.H = 0; this.DPR = 1; this.BK = 1; this.M = 0; this.mode = 'desktop'; this.kdu = 1; this.S = null;
    this.L = {}; this.steps = []; this.baked = false; this.bakeMs = 0; this.bakeStart = 0;
    this.T0 = performance.now(); this.bloomStart = 0; this.skipped = false; this.mouse = { x: 0, y: 0, tx: 0, ty: 0, last: -1e9 };
    this.raf = 0; this.timer = 0; this.started = false; this.dead = false; this.lastDraw = 0; this.calm = false; this.dirty = true;
    this.sumMs = 0; this.nMs = 0; this.maxMs = 0; this.frames = 0; this.low = false; this.saver = false;
    this.key = ''; // the bloom replays on every visit to the title (Matt, 2026-11-13); any key or tap skips it
    this.tick = (now) => this.frame(now);
    this.onMove = (e) => { const r = host.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { this.mouse.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1); this.mouse.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1); this.mouse.last = performance.now(); } };
    this.onSkip = () => this.skip();
    this.onVis = () => { if (document.hidden) this.halt(); else this.kick(); };
    host.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('keydown', this.onSkip, true); window.addEventListener('pointerdown', this.onSkip, true);
    document.addEventListener('visibilitychange', this.onVis);
    this.rt = 0; const later = () => { clearTimeout(this.rt); this.rt = setTimeout(() => this.layout(), 140); }; // a window drag rebakes once it settles
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(later) : null;
    if (this.ro) this.ro.observe(host); else { this.onResize = later; window.addEventListener('resize', this.onResize); }
    this.layout();
    this.kick();
  }

  /** Any key or tap finishes the entry bloom at once (Calm: the fade). Never swallows the event. */
  skip() { this.skipped = true; this.dirty = true; this.kick(); }
  destroy() {
    if (this.dead) return; this.dead = true; this.halt();
    this.host.removeEventListener('pointermove', this.onMove); window.removeEventListener('keydown', this.onSkip, true); window.removeEventListener('pointerdown', this.onSkip, true); document.removeEventListener('visibilitychange', this.onVis);
    clearTimeout(this.rt); if (this.ro) this.ro.disconnect(); if (this.onResize) window.removeEventListener('resize', this.onResize);
    if (this.baked && !this.low && this.key && this.S) { TitleCover.keep = { key: this.key, L: this.L, S: this.S, kdu: this.kdu }; clearTimeout(TitleCover.keepT); TitleCover.keepT = setTimeout(() => { TitleCover.keep = null; }, 60000); }
    this.cv.remove(); this.vig.remove(); this.L = {}; this.S = null; this.host.style.removeProperty('--tc-menu');
    for (const k of MODES) this.host.classList.remove(k);
    if (globalThis.__cover === this) globalThis.__cover = null;
  }
  halt() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; if (this.timer) clearTimeout(this.timer); this.timer = 0; }
  kick() { if (this.dead || this.raf || this.timer || document.hidden) return; this.raf = requestAnimationFrame(this.tick); }

  stats() { return { avgMs: +(this.sumMs / Math.max(1, this.nMs)).toFixed(2), maxMs: +this.maxMs.toFixed(2), bakeMs: Math.round(this.bakeMs), frames: this.frames, mode: this.mode, W: this.W, H: this.H, dpr: +this.DPR.toFixed(2), hero: this.hero, calm: this.calm, low: this.low, saver: this.saver, motes: moteCount({ calm: this.calm, low: this.low, saver: this.saver }), baked: this.baked }; }

  // ---- sizing + baking -------------------------------------------------------------------------------------------------------
  layout() {
    if (this.dead) return;
    const h = this.host; const W = h.clientWidth, H = h.clientHeight;
    if (!(W > 40 && H > 40)) return; // hidden layer: nothing to size yet
    const r = h.getBoundingClientRect(); const zoom = r.width > 0 && W > 0 ? clamp(r.width / W, 0.5, 3) : 1; // the desktop menu zoom (--uik) makes layout px differ from screen px
    this.saver = !!(this.o.isSaver && this.o.isSaver()); this.low = this.saver || !!(this.o.isLow && this.o.isLow());
    let dpr = Math.min((window.devicePixelRatio || 1) * zoom, this.low ? 1.5 : 2);
    while (W * H * dpr * dpr > 5e6 && dpr > 1) dpr = Math.max(1, dpr * 0.85);
    if (W === this.W && H === this.H && Math.abs(dpr - this.DPR) < 0.01 && (this.baked || this.steps.length)) return;
    this.W = W; this.H = H; this.DPR = dpr; this.BK = this.low ? 1 : Math.min(dpr, W * H > 1.2e6 ? 1 : 1.5); this.M = bakeMargin(W);
    this.mode = coverMode(W, H);
    for (const k of MODES) h.classList.toggle(k, k === 'tc-m-' + this.mode);
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
    this.key = `${W}x${H}@${dpr.toFixed(2)}|${this.mode}|${this.hero}|${this.low ? 'l' : 'n'}`;
    const k = TitleCover.keep;
    if (k && k.key === this.key) { // same size, hero and tier as the last title: adopt its baked layers, no bake at all
      TitleCover.keep = null; clearTimeout(TitleCover.keepT); this.L = k.L; this.S = k.S; this.kdu = k.kdu; this.steps = []; this.baked = true; this.bakeMs = 0;
      if (!this.started) { this.started = true; this.bloomStart = performance.now(); TitleCover.seen = true; }
      this.dirty = true; this.kick(); return;
    }
    this.baked = false; this.L = {}; this.queueBake(); this.dirty = true; this.kick();
  }
  horizon() { return this.H * horizonFrac(this.mode); }

  /** The bake is a list of small steps run a few ms per frame, so the menu is never blocked by it. */
  queueBake() {
    const { W, H, M, BK } = this; const LW = W + M * 2, LH = H + M * 2, hz = this.horizon(), n = T.night; const L = this.L;
    const mk = (w, h) => { const c = mkCanvas(w * BK, h * BK); const g = c.getContext('2d'); g.scale(BK, BK); return [c, g]; };
    const k0 = Math.max(0.7, Math.min(1.3, H / 720));
    const portrait = this.mode === 'portrait', landscape = this.mode === 'landscape';
    const trees = (count, s0, s1, base0, base1, seed, withColour) => {
      const out = [];
      for (const key of withColour ? ['grey', 'col'] : ['grey']) {
        const [c, g] = mk(LW, LH); const rr = seeded(seed); const P = PALS[key];
        for (let i = 0; i < count; i++) {
          const x = M * 0.3 + ((i + 0.2 + rr() * 0.6) * (LW - M * 0.6)) / count, s = s0 + rr() * (s1 - s0), y = M + hz + base0 + rr() * (base1 - base0);
          const dark = mixc(P.canopy, '#0d1424', n * 0.35 + rr() * 0.12);
          drawTree(g, x, y, s, key === 'grey' ? mixc(P.trunk, '#0a0f1c', n * 0.3) : P.trunk, key === 'grey' ? dark : mixc(dark, P.canopyF, 0.3 + rr() * 0.4), P.rim);
        }
        out.push(c);
      }
      return out;
    };
    this.steps = [
      () => { // sky + stars + moon
        const [c, g] = mk(LW, LH); const sky = g.createLinearGradient(0, 0, 0, hz + M + 30);
        sky.addColorStop(0, mixc('#0f1426', '#05070e', n * 0.7)); sky.addColorStop(0.7, mixc('#27324e', '#111828', n)); sky.addColorStop(1, mixc('#4a5a78', '#1c2538', n)); g.fillStyle = sky; g.fillRect(0, 0, LW, LH);
        const r = seeded(13);
        for (let i = 0; i < 90; i++) { const x = r() * LW, y = r() * (hz + M) * 0.8; g.fillStyle = `rgba(230,236,255,${0.2 + r() * 0.5})`; g.beginPath(); g.arc(x, y, 0.5 + r() * 1.1, 0, TAU); g.fill(); }
        const mx = M + W * (portrait ? 0.17 : landscape ? 0.9 : 0.8), my = M + H * (portrait ? 0.27 : landscape ? 0.2 : 0.17), mr = Math.min(W, H) * (landscape ? 0.055 : 0.05) + 8;
        glow(g, mx, my, mr * 7, '#cfd8f0', 0.22 * T.moon); glow(g, mx, my, mr * 2.6, '#e8eeff', 0.3 * T.moon);
        g.fillStyle = '#eef2ff'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,165,200,.35)';
        for (const [a, b, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.2, 0.17], [0.1, -0.4, 0.12]]) { g.beginPath(); g.arc(mx + a * mr, my + b * mr, rr * mr, 0, TAU); g.fill(); }
        L.sky = c;
      },
      () => { // far trees, grey and hazy
        const f = trees(Math.round(14 * (LW / 1280) * (portrait ? 1.4 : 1)), 0.62 * k0, 0.95 * k0, -4, 10, 3, false);
        const [c, g] = mk(LW, LH); g.drawImage(f[0], 0, 0, LW, LH); const fg = g.createLinearGradient(0, M + hz - 80, 0, M + hz + 30); fg.addColorStop(0, 'rgba(110,130,170,0)'); fg.addColorStop(1, 'rgba(110,130,170,.34)'); g.fillStyle = fg; g.fillRect(0, M + hz - 80, LW, 110); L.far = c;
      },
      () => { // mid trees: grey copy + colour copy
        const k = k0 * (portrait ? 0.95 : 1); const m = trees(Math.max(5, Math.round(8 * (LW / 1280) * (portrait ? 1.8 : 1))), 1.1 * k, 1.7 * k, 26 * k, 70 * k, 7, true); L.midG = m[0]; L.midC = m[1];
      },
      () => this.bakeGround('G'), () => this.bakeGround('C'),
      () => { // foreground frame: dark blades along the bottom, leaf boughs in the top corners
        const [c, g] = mk(LW, LH); if (!this.low) g.filter = 'blur(1.1px)'; const rr = seeded(77), col = mixc('#0c1220', '#05070d', n * 0.5); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
        const hk = H / 720 + 0.3;
        for (let i = 0; i < Math.round(LW / 9); i++) { const x = rr() * LW, hh = (24 + rr() * 80) * hk, bend = (rr() - 0.5) * 40; g.lineWidth = 3 + rr() * 4; g.beginPath(); g.moveTo(x, LH); g.quadraticCurveTo(x + bend * 0.4, LH - hh * 0.6, x + bend, LH - hh); g.stroke(); }
        for (const [sx, sy, dir] of [[0, 0, 1], [LW, 0, -1]]) for (let i = 0; i < 7; i++) {
          const a = (0.15 + i * 0.13) * dir, len = (110 + rr() * 170) * hk; const x = sx, y = sy - 10; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y);
          const ex = x + dir * len * Math.cos(a + 0.5), ey = y + len * Math.sin(a + 0.9) * 0.8; g.quadraticCurveTo(x + dir * len * 0.3, y + len * 0.2, ex, ey); g.stroke();
          for (let j = 0; j < 6; j++) { const t = (j + 1) / 7, lx = x + (ex - x) * t + dir * 4, ly = y + (ey - y) * t * (0.9 + t * 0.1); g.beginPath(); g.ellipse(lx, ly + 7, 7 + rr() * 5, 14 + rr() * 6, dir * (0.5 + rr() * 0.5), 0, TAU); g.fill(); }
        }
        L.fore = c;
      },
      () => { // calm-zone gradient on the menu side (the legibility layer), fog sprite, colour scratch canvas
        const c = mkCanvas(W, H); const g = c.getContext('2d'); const cz = T.calmZone; let gr;
        if (cz > 0) {
          if (this.mode === 'desktop') { gr = g.createLinearGradient(0, 0, W * 0.62, 0); gr.addColorStop(0, `rgba(6,9,18,${0.82 * cz})`); gr.addColorStop(0.55, `rgba(6,9,18,${0.4 * cz})`); gr.addColorStop(1, 'rgba(6,9,18,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); gr = g.createLinearGradient(0, H * 0.6, 0, H); gr.addColorStop(0, 'rgba(6,9,18,0)'); gr.addColorStop(1, `rgba(6,9,18,${0.55 * cz})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
          else if (portrait) { gr = g.createLinearGradient(0, H * 0.5, 0, H); gr.addColorStop(0, 'rgba(6,9,18,0)'); gr.addColorStop(0.35, `rgba(6,9,18,${0.62 * cz})`); gr.addColorStop(1, `rgba(6,9,18,${0.92 * cz})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); gr = g.createLinearGradient(0, 0, 0, H * 0.28); gr.addColorStop(0, `rgba(6,9,18,${0.6 * cz})`); gr.addColorStop(1, 'rgba(6,9,18,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
          else { gr = g.createLinearGradient(0, 0, W * 0.64, 0); gr.addColorStop(0, `rgba(6,9,18,${0.9 * cz})`); gr.addColorStop(0.7, `rgba(6,9,18,${0.62 * cz})`); gr.addColorStop(1, 'rgba(6,9,18,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
        }
        L.calm = c;
        const f = mkCanvas(256, 256); glow(f.getContext('2d'), 128, 128, 128, '#9aabc8', 0.1); L.fogSpr = f;
        L.tmp = mkCanvas(this.cv.width, this.cv.height);
      },
      () => this.bakeHero(),
    ];
    this.bakeStart = performance.now(); this.bakeMs = 0;
  }
  bakeGround(key) {
    const { W, H, M, BK } = this; const LW = W + M * 2, LH = H + M * 2, hz = this.horizon(); const gh = LH - (M + hz) + 40;
    const c = mkCanvas(LW * BK, LH * BK); const g = c.getContext('2d'); g.scale(BK, BK); g.translate(0, M + hz);
    paintGround(g, LW, gh, 31, T.night, key === 'G' ? 0 : 1);
    const fg = g.createLinearGradient(0, 0, 0, 40); fg.addColorStop(0, 'rgba(110,130,170,.35)'); fg.addColorStop(1, 'rgba(110,130,170,0)'); g.fillStyle = fg; g.fillRect(0, 0, LW, 40);
    if (key === 'C') { g.fillStyle = 'rgba(255,214,150,.14)'; g.fillRect(0, 0, LW, gh); }
    this.L['gr' + key] = c;
  }
  /** The hero rigs are the game's own drawing code; the expensive part (outlined gradient shapes) is baked once into sprites at the on-screen size, per frame only transforms. */
  bakeHero() {
    const hp = heroPos(this.mode); const kdu = (this.H * hp.s) / 142; const dpx = kdu * this.DPR; this.kdu = kdu;
    const sprite = (bb, fn) => { const c = mkCanvas(bb.w * dpx, bb.h * dpx); const g = c.getContext('2d'); g.scale(dpx, dpx); g.translate(-bb.x0, -bb.y0); fn(g); return { cv: c, ...bb }; };
    const S = {};
    if (this.hero === 'wren') {
      const bb = { x0: -72, y0: -142, w: 150, h: 156 };
      S.tail = sprite(bb, (g) => WA.drawWrenTail(g));
      S.main = sprite(bb, (g) => { for (const b of [WA.ANCHOR.bootFar, WA.ANCHOR.bootNear]) { g.save(); g.translate(b[0], b[1]); WA.drawWrenBoot(g); g.restore(); } WA.drawWrenBody(g); WA.drawWrenHead(g, 'neutral'); });
      S.blink = sprite(bb, (g) => WA.drawWrenHead(g, 'blink'));
      S.ember = sprite({ x0: -22, y0: -26, w: 44, h: 52 }, (g) => WA.drawEmber(g));
      S.pup = sprite({ x0: -48, y0: -62, w: 96, h: 80 }, (g) => WA.drawPupFlat(g, 'sit'));
    } else {
      const A = EA.E_ANCHOR; const bb = { x0: -62, y0: -164, w: 160, h: 182 };
      S.main = sprite(bb, (g) => { EA.drawStaffBack(g); for (const b of [A.bootFar, A.bootNear]) { g.save(); g.translate(b[0], b[1]); EA.drawEliasBoot(g); g.restore(); } EA.drawEliasBody(g); EA.drawEliasHead(g, 'kind'); EA.drawStaffFront(g); });
      S.blink = sprite(bb, (g) => EA.drawEliasHead(g, 'blink'));
    }
    this.S = S;
  }

  // ---- frame -----------------------------------------------------------------------------------------------------------------
  frame(now) {
    this.raf = 0; if (this.dead) return;
    const host = this.host;
    if (!host.isConnected || host.style.display === 'none' || !(host.clientWidth > 40)) { this.timer = setTimeout(() => { this.timer = 0; this.layout(); this.kick(); }, 300); return; } // layer hidden: re-check slowly
    const wasCalm = this.calm; this.calm = !!(this.o.isCalm && this.o.isCalm()); if (this.calm !== wasCalm) this.dirty = true;
    if (!this.baked) { // bake in slices; the entry bloom starts when the last one is done
      if (!this.steps.length) { this.layout(); this.kick(); return; }
      const t0 = performance.now();
      while (this.steps.length && performance.now() - t0 < 7) this.steps.shift()();
      if (!this.steps.length) { this.baked = true; this.bakeMs = performance.now() - this.bakeStart; if (!this.started) { this.started = true; this.bloomStart = performance.now(); TitleCover.seen = true; } this.dirty = true; probe.tag('title:bake', this.bakeMs); this.sumMs = 0; this.nMs = 0; this.maxMs = 0; if (this.o.onReady) try { this.o.onReady(); } catch { /* cosmetic */ } }
      this.kick(); return;
    }
    if (this.calm && !this.dirty && bloomProgress(now - this.bloomStart, { calm: true, skipped: this.skipped }) >= 1) { this.lastDraw = 0; this.timer = setTimeout(() => { this.timer = 0; this.kick(); }, 1000); return; } // Calm and finished: one still picture; poll slowly for a change
    const baking = !!(this.o.isBaking && this.o.isBaking());
    const gap = frameGapMs({ saver: this.saver, baking });
    if (gap && now - this.lastDraw < gap - 2) { this.kick(); return; }
    const dt = this.lastDraw ? Math.min(100, now - this.lastDraw) : 16; this.lastDraw = now;
    const p0 = performance.now(); this.draw(now, dt); const ms = performance.now() - p0;
    this.frames++; this.sumMs += ms; this.nMs++; if (ms > this.maxMs) this.maxMs = ms; if (this.nMs > 90) { this.sumMs *= 0.5; this.nMs = 45; }
    if (probe.on) { globalThis.__titlePerf = this.stats(); if (ms > 8) probe.tag('title:draw', ms); } // ?perf=1: draw ms of the title cover (budget 3 ms desktop), long ones tagged
    this.dirty = this.calm && bloomProgress(now - this.bloomStart, { calm: true, skipped: this.skipped }) < 1; // under Calm keep drawing only while the fade runs
    this.kick();
  }

  draw(now, dt) {
    const { W, H, DPR, M, L, cx: c } = this; const calm = this.calm; const t = calm ? 0 : (now - this.T0) / 1000;
    const b = bloomProgress(now - this.bloomStart, { calm, skipped: this.skipped }); const hp = heroPos(this.mode); const hz = this.horizon();
    const kdu = this.kdu, hx = W * hp.x, hy = H * hp.y; const fl = this.flame; const wren = this.hero === 'wren';
    // pointer parallax (desktop) or slow auto-drift (touch, or an idle pointer)
    const mo = this.mouse; const idle = now - mo.last > 3500; let tx = calm ? 0 : mo.tx, ty = calm ? 0 : mo.ty;
    if (!calm && idle) { const d = driftTarget(t); tx = d[0]; ty = d[1]; }
    const k = 1 - Math.pow(1 - 0.07, dt / 16.7); mo.x += (tx - mo.x) * k; mo.y += (ty - mo.y) * k;
    const sh = (i) => layerShift(i, mo.x, mo.y, { calm, margin: M });
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#05070d'; c.fillRect(0, 0, W, H);
    const ho = sh(4);
    const lamp = wren ? [33 * 0.95 * kdu, -80 * kdu] : [EA.E_ANCHOR.lantern[0] * kdu, EA.E_ANCHOR.lantern[1] * kdu];
    const br = 1 + (calm ? 0 : 0.03 * Math.sin((t / 2.4) * TAU)); if (!wren) lamp[1] *= br; // Elias's lantern rides the staff, which breathes with the sprite
    const lx = hx + ho[0] + lamp[0], ly = hy + ho[1] + lamp[1];
    const fk = flicker(t, { calm });
    const spreadR = Math.max(1, Math.min(W, H * 1.6) * 0.75 * T.spread * b * (1 + (calm ? 0 : Math.sin(t * 0.8) * T.breath)));
    const blit = (img, i) => { const o = sh(i); c.drawImage(img, o[0] - M, o[1] - M, W + 2 * M, H + 2 * M); };
    const cx0 = lx, cy0 = ly + 40 * kdu;
    const blitColour = (img, i) => { // the colour copy of a layer, masked by a soft circle round the lantern (only that box is touched)
      const tc = L.tmp.getContext('2d'); const tw = L.tmp.width, th = L.tmp.height;
      const bx = clamp(Math.floor((cx0 - spreadR) * DPR), 0, tw), by = clamp(Math.floor((cy0 - spreadR) * DPR), 0, th);
      const bw = clamp(Math.ceil((cx0 + spreadR) * DPR), 0, tw) - bx, bh = clamp(Math.ceil((cy0 + spreadR) * DPR), 0, th) - by; if (bw < 2 || bh < 2) return;
      const o = sh(i); tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.clearRect(bx, by, bw, bh);
      tc.save(); tc.beginPath(); tc.rect(bx, by, bw, bh); tc.clip(); tc.setTransform(DPR, 0, 0, DPR, 0, 0); tc.drawImage(img, o[0] - M, o[1] - M, W + 2 * M, H + 2 * M); tc.restore();
      tc.setTransform(DPR, 0, 0, DPR, 0, 0); tc.globalCompositeOperation = 'destination-in';
      const g = tc.createRadialGradient(cx0, cy0, 0, cx0, cy0, spreadR); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(Math.max(0, 1 - T.soft), 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      tc.fillStyle = g; tc.fillRect(bx / DPR, by / DPR, bw / DPR, bh / DPR); tc.globalCompositeOperation = 'source-over';
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(L.tmp, bx, by, bw, bh, bx, by, bw, bh); c.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    blit(L.sky, 0); blit(L.far, 1); blit(L.midG, 2); blitColour(L.midC, 2); blit(L.grG, 3); blitColour(L.grC, 3);
    if (T.fog > 0 && !this.low) { c.save(); c.globalAlpha = Math.min(1, T.fog); for (let i = 0; i < 6; i++) { const ph = (t * (0.006 + i * 0.002) + i * 0.21) % 1, x = ph * (W + 600) - 300, y = hz + 24 + (i % 3) * 30, rr = 260 + i * 40; c.drawImage(L.fogSpr, x - rr, y - rr * 0.22, rr * 2, rr * 0.44); } c.restore(); }
    // light pool on the ground, then companion + hero (baked rigs), then the additive lantern light
    const gl = T.glowA * b;
    c.save(); c.globalCompositeOperation = 'lighter'; c.save(); c.translate(hx + ho[0], hy + ho[1] - 6 * kdu); c.scale(1, 0.34); glow(c, 0, 0, 230 * kdu * T.glowR * Math.min(1, 0.25 + b) * fk, fl.glow, 0.42 * gl); c.restore(); c.restore();
    c.save(); c.globalAlpha = clamp(b * 2.2, 0, 1); c.translate(hx + ho[0], hy + ho[1]); c.scale(kdu, kdu);
    if (this.companion) this.drawCompanion(c, t, calm);
    this.drawHero(c, t, calm, br);
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, lx, ly, 150 * kdu * T.glowR * Math.min(1, 0.15 + b) * fk, fl.glow, 0.3 * gl); glow(c, lx, ly, 40 * kdu * fk, fl.core, 0.26 * gl); glow(c, hx + ho[0], hy + ho[1] - 60 * kdu, 300 * kdu * T.glowR * b, fl.glow, 0.045 * gl); c.restore();
    // motes: warm specks rising from the pool (none under Calm; fewer on Low / Battery saver)
    const n = moteCount({ calm, low: this.low, saver: this.saver });
    if (n) {
      const o = sh(5), sz = T.moteSz * (H / 720 + 0.3); c.save(); let last = '';
      for (let i = 0; i < n; i++) {
        const sp = 0.03 + (i % 7) * 0.006, ph = (t * sp + i * 0.137) % 1, rr = 40 + ((i * 53) % 260) * kdu * 0.6, ang = i * 2.399 + t * 0.1 * (i % 2 ? 1 : -1);
        const x = hx + o[0] + Math.cos(ang) * rr * 1.6, y = hy + o[1] - 10 * kdu - ph * H * 0.6 + Math.sin(ang) * rr * 0.3; const col = i % 5 ? fl.core : fl.glow;
        if (col !== last) { c.fillStyle = col; last = col; } c.globalAlpha = Math.sin(ph * Math.PI) * 0.75 * b; c.beginPath(); c.arc(x, y, sz * (0.6 + (i % 4) * 0.3), 0, TAU); c.fill();
      }
      c.restore();
    }
    blit(L.fore, 6);
    c.drawImage(L.calm, 0, 0, W, H);
    if (b < 1) { c.fillStyle = `rgba(4,6,12,${(1 - b) * (calm ? 1 : 0.9)})`; c.fillRect(0, 0, W, H); }
    this.host.style.setProperty('--tc-menu', String(calm ? 1 : clamp(0.3 + b * 3, 0, 1))); // the menu is live from frame one; this only eases its brightness in
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawSpr(c, s) { c.drawImage(s.cv, s.x0, s.y0, s.w, s.h); }
  drawHero(c, t, calm, br) {
    const S = this.S, fl = this.flame, k = calm ? 0 : 1; const blink = !calm && t % 4.3 > 3.9 && t % 4.3 < 4.02;
    if (this.hero === 'wren') {
      const A = WA.ANCHOR; const sway = Math.sin(t * 1.7) * 0.06 * k;
      c.save(); c.translate(A.tail[0], A.tail[1]); c.rotate(-0.05 + sway); c.translate(-A.tail[0], -A.tail[1]); this.drawSpr(c, S.tail); c.restore();
      c.save(); c.scale(1, br); this.drawSpr(c, S.main); if (blink) this.drawSpr(c, S.blink); c.restore();
      const bob = Math.sin(t * 2.1) * 1.6 * k, ex = A.ember[0], ey = A.ember[1] + bob;
      WA.glowAt(c, ex, ey, 70, fl.glow, 0.34 * 0.45); WA.glowAt(c, ex, ey, 22, fl.core, 0.5 * 0.45);
      c.save(); c.strokeStyle = '#ffb84a'; c.lineWidth = 1.2; c.lineCap = 'round'; c.setLineDash([1.2, 2.4]); c.beginPath(); c.moveTo(A.hand[0], A.hand[1]); c.quadraticCurveTo(ex * 0.9, (ey + A.hand[1]) / 2 + 4, ex, ey + 12); c.stroke(); c.restore();
      c.save(); c.translate(ex, ey); c.scale(0.95, 0.95); this.drawSpr(c, S.ember); c.restore();
    } else {
      const A = EA.E_ANCHOR;
      WA.glowAt(c, A.lantern[0], A.lantern[1], 60, fl.glow, 0.3 * 0.45);
      c.save(); c.scale(1, br); this.drawSpr(c, S.main); if (blink) this.drawSpr(c, S.blink); c.restore();
      WA.glowAt(c, A.crown[0], A.crown[1], 34, fl.glow, (0.26 + (calm ? 0 : 0.04 * Math.sin(t * 5))) * 0.45);
    }
  }
  drawCompanion(c, t, calm) {
    const fl = this.flame;
    if (this.hero === 'wren') {
      const bob = calm ? 0 : Math.sin(t * 2.6) * 0.8;
      c.save(); c.translate(74, 3); c.scale(0.78, 0.78); c.translate(0, bob); this.drawSpr(c, this.S.pup); c.restore();
    } else {
      const p = calm ? 0.3 : t * 0.8;
      c.save(); c.translate(0, 4); c.save(); c.scale(1, 0.28); c.strokeStyle = rgba(fl.glow, 0.85); c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.stroke(); c.strokeStyle = rgba(fl.core, 0.8); c.lineWidth = 1.8; c.stroke(); c.restore();
      for (let i = 0; i < 3; i++) { const a = p + (i * TAU) / 3, x = Math.cos(a) * 30, y = Math.sin(a) * 8.4; WA.glowAt(c, x, y, 8, fl.glow, 0.7); c.fillStyle = fl.core; c.beginPath(); c.arc(x, y, 2.1, 0, TAU); c.fill(); }
      c.restore();
    }
  }
}
