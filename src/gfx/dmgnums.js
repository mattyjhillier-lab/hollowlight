// Pooled floating numbers drawn with generated bitmap fonts (textures built in gfx/sprites.js). Logic lives in numpool.js (pure).
// Two fonts: 'digits' (dark outline) for normal numbers, 'digitsB' (dark + brass outline) for big hits. No per-frame allocation:
// text is rewritten only when a number is spawned or merged.
import Phaser from 'phaser';
import { inv } from './style.js';
import { NumPool, KIND, fmtSigned } from './numpool.js';
import { PAL, ROLE } from './palette.js';

export const GLYPHS = '0123456789k+-.M';
const TINT = [PAL.cream, 0xffdcae, 0x8fe3c8, 0xff8078, ROLE.bleed, ROLE.burn]; // normal, big (warmer, never gold), heal (soft teal), taken (light red), bleed tick (blood red), burn tick (lilac)

export function makeDigitFont(scene) {
  for (const key of ['digits', 'digitsB']) {
    if (scene.cache.bitmapFont.exists(key)) continue;
    // The texture (5x7-unit cells, one per glyph) is drawn by gfx/sprites.js at 1/INV[key] texels per unit.
    const k = 1 / inv(key);
    const data = Phaser.GameObjects.RetroFont.Parse(scene, { image: key, width: 5 * k, height: 7 * k, chars: GLYPHS, charsPerRow: GLYPHS.length, spacing: { x: 0, y: 0 }, offset: { x: 0, y: 0 } });
    scene.cache.bitmapFont.add(key, data);
  }
}

export class DamageNumbers {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.pool = new NumPool(24);
    this.texts = new Array(this.pool.slots.length).fill(null);
    this.big = new Array(this.pool.slots.length).fill(false); // which font each text currently uses
  }

  get enabled() { return this.pool.enabled; }
  set enabled(v) { if (this.pool.enabled && !v) this.clear(); this.pool.enabled = !!v; }
  get alive() { return this.pool.alive; }
  get cap() { return this.pool.cap; }
  setCap(n) { this.pool.setCap(n); }
  set reduced(v) { this.pool.reduced = !!v; }

  clear() {
    this.pool.clear();
    for (const t of this.texts) if (t) t.setVisible(false);
  }

  // kind: KIND.*; ref: typical hit; force: boss hits are always "big".
  spawn(x, y, val, eid, kind, ref, force) { return this.pool.spawn(x, y, val, eid, kind, ref, force); }

  update(dt) {
    const P = this.pool;
    P.update(dt);
    const S = P.slots;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      let t = this.texts[i];
      if (!s.on) { if (t && t.visible) t.setVisible(false); continue; }
      const big = s.kind === KIND.BIG;
      if (!t) {
        t = this.scene.add.bitmapText(0, 0, 'digits', '0').setLetterSpacing(-1 / inv('digits')).setOrigin(0.5).setDepth(this.depth);
        this.texts[i] = t; this.big[i] = false;
      }
      if (s.dirty) {
        s.dirty = false;
        if (this.big[i] !== big) { this.big[i] = big; t.setFont(big ? 'digitsB' : 'digits'); t.setLetterSpacing(-1 / inv('digits')); }
        t.setText(fmtSigned(s.val, s.sign)).setTint(TINT[s.kind]);
      }
      const o = P.poseOf(s);
      t.setVisible(true).setPosition(s.x, s.y + o.dy).setScale(2 * o.scale * inv('digits')).setAlpha(o.alpha);
    }
  }
}
