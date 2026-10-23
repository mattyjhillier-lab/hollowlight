// DT2 Hollow marks, the look (render only; reads sim enemies / embers, never writes the sim). Spec: difficulty-tiers-economy-v1.md 3.2 +
// docs/mockups/difficulty-tiers/dt-affixes-desk.png: one mark per foe, read by SHAPE first, colour second.
//   Ironbark    pale bark plates over the mask (dark bark outline)          static
//   Swiftshade  cold violet motion streak behind the body, always on        static frame, flipped with the foe
//   Emberwake   ember cracks in the mask; on death the red-orange ring      ring = danger telegraph, above the vignette (D_VIG + 2, under the tells)
//   Hollowheart hollow chest glow + thin violet threads to its neighbours   threads capped at 6 lines, none on Low
// One pooled overlay image per marked foe from a small code-drawn sheet (4 frames); no per-frame allocation in the hot path.
// Readability: overlays sit inside the foe's own depth slot (never above numbers, tells or the hero outline); threads sit under the gems;
// Hunter's Eye bars sit under the damage numbers. Low tier = static shapes only (no pulse, no threads); Calm = no pulse.
import { MARKS, EMBER, HEART } from '../sim/marks.js';
import { HUSK_TYPES, wpd } from './husk/frames.js';

export const HM_KEY = 'hmarks';
const TX = 8; // sheet texels per world unit
const INK = 0x1a1020;
export const MARK_COL = Object.freeze({ bark: 0xd9cdb0, barkLine: 0x5a4a32, shade: 0x9a8cff, ember: 0xff8a4a, emberLine: 0x3a1a10, heart: 0xc9c2ff, ring: 0xff5a3c, bar: 0xfff3dc });
// frame boxes in world units [w, h] and the anchor inside the frame (0..1); where each sits on the foe
const LOOK = Object.freeze({
  ironbark: Object.freeze({ frame: 'ironbark', w: 20, h: 14, ox: 0.5, oy: 0.5, at: 'mask' }),
  swiftshade: Object.freeze({ frame: 'swiftshade', w: 22, h: 12, ox: 1, oy: 0.5, at: 'tail' }),
  emberwake: Object.freeze({ frame: 'emberwake', w: 16, h: 14, ox: 0.5, oy: 0.5, at: 'mask' }),
  hollowheart: Object.freeze({ frame: 'hollowheart', w: 14, h: 14, ox: 0.5, oy: 0.5, at: 'chest' }),
});
export const markLook = (k) => (typeof k === 'string' && Object.hasOwn(LOOK, k) ? LOOK[k] : null);

// Hollowheart threads: up to `cap` lines from each live heart to its nearest neighbours inside the aura (the boosted foes), total capped.
export function threadPairs(hearts, enemies, cap = 6, out = []) {
  out.length = 0;
  const R2 = HEART.r * HEART.r;
  for (const h of hearts) {
    if (out.length >= cap) break;
    for (const e of enemies) {
      if (out.length >= cap) break;
      if (e === h || e.dead || e.boss) continue;
      const dx = e.x - h.x, dy = e.y - h.y;
      if (dx * dx + dy * dy < R2) out.push([h, e]);
    }
  }
  return out;
}

// Ember ring phase: tell (0..0.6 s, dashed, growing in) / live (solid + faint fill) / null (gone).
export function emberDraw(z) {
  if (!z || !(z.t >= 0)) return null;
  if (z.t < EMBER.tell) return { phase: 'tell', k: z.t / EMBER.tell };
  if (z.t < EMBER.tell + EMBER.live) return { phase: 'live', k: (z.t - EMBER.tell) / EMBER.live };
  return null;
}

// Hunter's Eye: thin bar + mark name on marked foes only (never the boss; the miniboss keeps its own free bar, so it gets the name only).
export function barOf(e, on) {
  if (!on || !e || !e.hmark || e.boss || !Object.hasOwn(MARKS, e.hmark)) return null;
  const frac = Math.max(0, Math.min(1, e.maxHp > 0 ? e.hp / e.maxHp : 0));
  return e.mini ? { frac, name: MARKS[e.hmark].name, noBar: true } : { frac, name: MARKS[e.hmark].name };
}

// ---- the sheet (Canvas 2D, drawn once) ----
const hex = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
export function sheetBoxes() {
  let x = 0;
  const boxes = {};
  for (const k of Object.keys(LOOK)) { const L = LOOK[k]; boxes[k] = [x, 0, L.w * TX, L.h * TX]; x += L.w * TX + 4; }
  return { boxes, w: x, h: 16 * TX };
}
function drawSheet(g, boxes) {
  const at = (k, fn) => { const [bx, by, w, h] = boxes[k]; g.save(); g.translate(bx + w * LOOK[k].ox, by + h * LOOK[k].oy); g.scale(TX, TX); fn(); g.restore(); };
  const poly = (pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
  g.lineJoin = 'round'; g.lineCap = 'round';
  // Ironbark: two chunky pale bark plates over the mask, dark bark outline (L2 tinted line), a grain stroke each
  at('ironbark', () => {
    for (const P of [[-7.5, -3.5, -3, -6.5, 0.5, -5, 0, -1.5, -6, -0.8], [1.8, -5.5, 7, -4.8, 8, -1, 3.5, -0.5]]) { // brow plates: the eye sockets below stay clear
      poly(P); g.fillStyle = hex(MARK_COL.bark); g.fill(); g.lineWidth = 1.3; g.strokeStyle = hex(MARK_COL.barkLine); g.stroke();
    }
    g.lineWidth = 0.5; g.strokeStyle = hex(MARK_COL.barkLine, 0.7);
    g.beginPath(); g.moveTo(-5, -4.5); g.lineTo(-2.5, -2.5); g.moveTo(3.5, -4); g.lineTo(6, -2); g.stroke();
  });
  // Swiftshade: three cold violet speed strokes trailing behind (drawn for a right-facing foe: they run off to the left), dark under-stroke
  at('swiftshade', () => {
    const S = [[-20, -3, -12, -4.5, -3, -3], [-21, 1, -11, -0.5, -1, 0.5], [-18, 4.5, -10, 3.5, -4, 4]];
    for (const [w, c, a] of [[2.6, INK, 0.7], [1.3, MARK_COL.shade, 0.95]]) {
      g.lineWidth = w; g.strokeStyle = hex(c, a);
      for (const s of S) { g.beginPath(); g.moveTo(s[0], s[1]); g.quadraticCurveTo(s[2], s[3], s[4], s[5]); g.stroke(); }
    }
  });
  // Emberwake: jagged ember cracks across the mask with a dark rim and a hot core
  at('emberwake', () => {
    const C = [[-3.5, -4, -1.8, -1.2, -3, 1, -1.6, 3], [2.8, -3.5, 2, -0.5, 3.5, 2]];
    for (const [w, c] of [[2.6, MARK_COL.emberLine], [1.4, MARK_COL.ember], [0.5, 0xffe2b0]]) {
      g.lineWidth = w; g.strokeStyle = hex(c);
      for (const s of C) { g.beginPath(); g.moveTo(s[0], s[1]); for (let i = 2; i < s.length; i += 2) g.lineTo(s[i], s[i + 1]); g.stroke(); }
    }
  });
  // Hollowheart: a soft violet chest glow around a dark hollow (a ring, not a dot: the shape reads without colour)
  at('hollowheart', () => {
    const gr = g.createRadialGradient(0, 0, 1, 0, 0, 6.5);
    gr.addColorStop(0, hex(MARK_COL.heart, 0.65)); gr.addColorStop(1, hex(MARK_COL.heart, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 6.5, 0, Math.PI * 2); g.fill();
    g.lineWidth = 1.6; g.strokeStyle = hex(INK, 0.7); g.beginPath(); g.arc(0, 0, 2.9, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1.1; g.strokeStyle = hex(MARK_COL.heart); g.beginPath(); g.arc(0, 0, 2.9, 0, Math.PI * 2); g.stroke();
    g.fillStyle = hex(INK, 0.85); g.beginPath(); g.arc(0, 0, 1.5, 0, Math.PI * 2); g.fill();
  });
}

export class MarkLayer {
  // depths: { ember: D_VIG + 2, thread: D_LIT - 120, bar: D_PART + 5 }
  constructor(scene, depths) {
    this.scene = scene;
    this.d = depths;
    this.ok = false;
    this.pool = new Map(); this.free = []; this.stamp = 0;
    this.ringG = scene.add.graphics().setDepth(depths.ember);
    this.threadG = scene.add.graphics().setDepth(depths.thread);
    this.barG = scene.add.graphics().setDepth(depths.bar);
    this.labels = []; this.labelN = 0;
    this.hearts = []; this.pairs = [];
    this.bars = 0; this.drawn = 0; // readouts
    this.hide = false; // harness: measure the frame without marks
    this.make();
  }

  make() {
    const tex = this.scene.textures;
    if (tex.exists(HM_KEY)) { this.ok = true; return; }
    try {
      const { boxes, w, h } = sheetBoxes();
      const ct = tex.createCanvas(HM_KEY, Math.ceil(w), h);
      drawSheet(ct.getContext(), boxes);
      for (const [k, b] of Object.entries(boxes)) ct.add(k, 0, b[0], b[1], b[2], b[3]);
      ct.refresh();
      this.ok = true;
    } catch { this.ok = false; }
  }

  begin(sim, tier, calm) {
    this.stamp++; this.sim = sim; this.low = tier === 'low'; this.calm = calm; this.drawn = 0;
    this.barG.clear(); this.labelN = 0; this.bars = 0;
    this.hearts.length = 0;
  }

  img(id) {
    let s = this.pool.get(id);
    if (!s) {
      const im = this.free.pop() || this.scene.add.image(0, 0, HM_KEY, 'ironbark');
      im.setVisible(true);
      s = { im, stamp: 0 };
      this.pool.set(id, s);
    }
    s.stamp = this.stamp;
    return s.im;
  }

  // one marked foe drawn this frame. img = its body image (depth + flip), art = EnemyArt (null for flat sprites)
  foe(e, body, art, husk, bars) {
    if (e.hmark === 'hollowheart') this.hearts.push(e);
    const L = markLook(e.hmark);
    if (!L || !this.ok || this.hide) return;
    const fl = e.faceX < 0 ? -1 : 1;
    let x, y, k;
    const T = husk ? HUSK_TYPES[e.type] : null;
    if (T) {
      const u = wpd(e.type) * (body.js || 1), foot = e.y + T.foot;
      k = Math.max(0.6, Math.min(1.8, u / wpd('wolf')));
      if (L.at === 'mask') { x = e.x + fl * T.maskAt[0] * u; y = foot + T.maskAt[1] * u; }
      else if (L.at === 'chest') { x = e.x + fl * T.maskAt[0] * u * 0.25; y = foot + T.maskAt[1] * u * 0.55; }
      else { x = e.x - fl * e.r * 0.9; y = foot + T.maskAt[1] * u * 0.5; }
    } else {
      k = Math.max(0.75, Math.min(1.8, e.r / 6));
      x = L.at === 'tail' ? e.x - fl * e.r : e.x; y = e.y - e.r * (L.at === 'chest' ? 0.2 : 0.6);
    }
    const pulse = this.low || this.calm || L.at !== 'chest' ? 1 : 0.85 + 0.15 * Math.sin(this.sim.time * 4 + e.id);
    const im = this.img(e.id);
    if (im.frame.name !== L.frame) im.setFrame(L.frame);
    im.setOrigin(fl < 0 && L.ox !== 0.5 ? 1 - L.ox : L.ox, L.oy).setPosition(x, y).setFlipX(fl < 0).setScale((k * pulse) / TX)
      .setDepth(body.depth + (L.at === 'tail' ? -0.003 : 0.002)).setAlpha(Math.max(0.6, body.alpha));
    this.drawn++;
    if (bars) this.bar(e, x, T ? y - 7 * k : e.y - e.r - 6);
  }

  bar(e, x, y) {
    const b = barOf(e, true);
    if (!b) return;
    const g = this.barG;
    if (!b.noBar && this.bars < 40) {
      this.bars++;
      const w = 14, h = 2, x0 = Math.round(x - w / 2), y0 = Math.round(y);
      g.fillStyle(INK, 0.8).fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
      g.fillStyle(MARK_COL.bar, 0.95).fillRect(x0, y0, Math.max(1, Math.round(w * b.frac)), h);
    }
    if (this.labelN < 6) {
      let t = this.labels[this.labelN];
      if (!t) {
        t = this.labels[this.labelN] = this.scene.add.text(0, 0, '', { fontFamily: 'Georgia, serif', fontSize: '7px', color: '#fff3dc', stroke: '#1a1020', strokeThickness: 2, resolution: 4 })
          .setOrigin(0.5, 1).setDepth(this.d.bar);
      }
      if (t.text !== b.name) t.setText(b.name); // data string from MARKS (never from a save or URL)
      t.setPosition(Math.round(x), Math.round(y) - 1).setVisible(true);
      this.labelN++;
    }
  }

  // after the enemy loop: free unused overlays, threads, ember rings
  end(sim, p) {
    for (const [id, s] of this.pool) if (s.stamp !== this.stamp) { s.im.setVisible(false); this.free.push(s.im); this.pool.delete(id); }
    for (let i = this.labelN; i < this.labels.length; i++) this.labels[i].setVisible(false);
    const tg = this.threadG; tg.clear();
    if (!this.low && !this.hide && this.hearts.length) {
      const pairs = threadPairs(this.hearts, sim.enemies, 6, this.pairs);
      const a = this.calm ? 0.5 : 0.4 + 0.15 * Math.sin(sim.time * 3);
      for (const [h, e] of pairs) { tg.lineStyle(1.4, INK, a * 0.5).lineBetween(h.x, h.y - 3, e.x, e.y - 3); tg.lineStyle(0.7, MARK_COL.heart, a).lineBetween(h.x, h.y - 3, e.x, e.y - 3); }
    }
    const g = this.ringG; g.clear();
    for (const z of sim.embers) {
      const d = emberDraw(z);
      if (!d) continue;
      const near = Math.hypot(p.x - z.x, p.y - z.y) < EMBER.r + p.r + 30; // DR2: a ring that cannot reach the hero soon is drawn faint
      const f = near ? 1 : 0.28;
      if (d.phase === 'tell') {
        const r = EMBER.r * (this.low || this.calm ? 1 : 0.75 + 0.25 * d.k);
        g.lineStyle(3.6, INK, 0.85 * f).strokeCircle(z.x, z.y, r); // dark rim: carries the ring on the bright lantern pool (red vs lit grass is close in value)
        const n = 14, da = (Math.PI * 2) / n;
        g.lineStyle(1.8, MARK_COL.ring, (0.6 + 0.4 * d.k) * f);
        for (let i = 0; i < n; i++) { g.beginPath(); g.arc(z.x, z.y, r, i * da, i * da + da * 0.55); g.strokePath(); }
      } else {
        const fade = d.k > 0.8 ? (1 - d.k) / 0.2 : 1;
        tg.fillStyle(MARK_COL.ring, 0.2 * f * fade).fillCircle(z.x, z.y, EMBER.r); // the faint fill sits on the ground layer (under gems and pickups); only the rim is above the vignette
        g.lineStyle(3.6, INK, 0.85 * f * fade).strokeCircle(z.x, z.y, EMBER.r);
        g.lineStyle(2, MARK_COL.ring, 0.95 * f * fade).strokeCircle(z.x, z.y, EMBER.r);
      }
    }
  }

  clear() {
    for (const s of this.pool.values()) { s.im.setVisible(false); this.free.push(s.im); }
    this.pool.clear();
    for (const t of this.labels) t.setVisible(false);
    this.ringG.clear(); this.threadG.clear(); this.barG.clear();
  }
}
