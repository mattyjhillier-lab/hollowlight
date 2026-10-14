// Pooled floating damage numbers using a generated 3x5 pixel-digit bitmap font. No per-frame allocation.
import Phaser from 'phaser';

const GLYPHS = [
  '111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111',
];

export function makeDigitFont(scene) {
  if (scene.cache.bitmapFont.exists('digits')) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  GLYPHS.forEach((bits, i) => {
    for (let k = 0; k < 15; k++) if (bits[k] === '1') g.fillRect(i * 4 + (k % 3), Math.floor(k / 3) + 1, 1, 1);
  });
  g.generateTexture('digits', 40, 7);
  g.destroy();
  const data = Phaser.GameObjects.RetroFont.Parse(scene, { image: 'digits', width: 4, height: 7, chars: '0123456789', charsPerRow: 10, spacing: { x: 0, y: 0 }, offset: { x: 0, y: 0 } });
  scene.cache.bitmapFont.add('digits', data);
}

const LIFE = 0.6;

export class DamageNumbers {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.items = [];
    this.alive = 0;
    this.cap = 40;
    this.enabled = true;
  }

  setCap(n) { this.cap = Math.min(40, n); }

  clear() {
    for (const n of this.items) { n.t.setVisible(false); n.on = false; }
    this.alive = 0;
  }

  spawn(x, y, val, eid, big, tint) {
    if (!this.enabled || !(val >= 1)) return;
    const items = this.items;
    // merge into a recent number on the same enemy
    for (let i = 0; i < items.length; i++) {
      const n = items[i];
      if (n.on && n.eid === eid && n.age < 0.12) {
        n.val += val;
        n.age = 0.04;
        n.big = n.big || big;
        n.t.setText(String(Math.min(99999, n.val | 0)));
        return;
      }
    }
    if (this.alive >= this.cap) { if (!big) return; }
    else if (this.alive > this.cap * 0.6 && !big && val < 3) return; // crowded: skip small
    let n = null;
    for (let i = 0; i < items.length; i++) if (!items[i].on) { n = items[i]; break; }
    if (!n) {
      if (items.length >= 40) return;
      n = { t: this.scene.add.bitmapText(0, 0, 'digits', '0').setOrigin(0.5).setDepth(this.depth), on: false, age: 0, val: 0, eid: 0, big: false, x: 0, y: 0 };
      items.push(n);
    }
    n.on = true; n.age = 0; n.val = val; n.eid = eid; n.big = big; n.x = x + (Math.random() - 0.5) * 6; n.y = y - 8;
    n.t.setText(String(Math.min(99999, val | 0))).setTint(tint).setVisible(true).setPosition(n.x, n.y);
    this.alive++;
  }

  update(dt) {
    const items = this.items;
    for (let i = 0; i < items.length; i++) {
      const n = items[i];
      if (!n.on) continue;
      n.age += dt;
      if (n.age >= LIFE) { n.on = false; n.t.setVisible(false); this.alive--; continue; }
      const k = n.age / LIFE;
      const pop = k < 0.15 ? 1.6 - (k / 0.15) * 0.6 : 1;
      n.t.setPosition(n.x, n.y - 22 * k).setScale((n.big ? 2 : 1.5) * pop).setAlpha(k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4);
    }
  }
}
