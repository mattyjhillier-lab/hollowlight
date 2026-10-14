// Half-resolution lightmap (Med/High). A render texture is filled with the ambient colour each frame, then
// pooled light images are batch-drawn into it; the result is MULTIPLY-blended over the world, so lit
// areas keep their painted colour and unlit areas fall to the ambient. Pooled, no per-frame allocation.
// Feature-detected: any failure sets `ok = false` and the scene falls back to the Low-tier tinted look.
import Phaser from 'phaser';

const LIGHT_PX = 64; // texels across the 'light' texture (see sprites.js)
const RES = 0.5; // render texture scale vs the canvas

export class Lightmap {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.rt = null;
    this.tex = null;
    this.imgs = [];
    this.n = 0;
    this.cap = 40;
    this.ok = false;
    this.cx = 0; this.cy = 0; this.zoom = 1;
    this.w = 0; this.h = 0;
  }

  // W,H = canvas px; vw,vh = world units the layer must cover (view + margin).
  build(W, H, zoom) {
    this.destroy();
    try {
      if (this.scene.renderer.type !== Phaser.WEBGL) return false;
      this.w = Math.max(32, Math.round(W * 1.06 * RES));
      this.h = Math.max(32, Math.round(H * 1.06 * RES));
      const rt = this.scene.add.renderTexture(W / 2, H / 2, this.w, this.h);
      rt.setOrigin(0.5).setScrollFactor(0).setDepth(this.depth).setBlendMode(Phaser.BlendModes.MULTIPLY);
      // one texel = 2 canvas px = 2/zoom world units: size it to cover the view with margin
      rt.setDisplaySize((this.w / RES) / zoom, (this.h / RES) / zoom);
      this.rt = rt;
      this.tex = rt.texture;
      this.zoom = zoom;
      this.ok = true;
      return true;
    } catch (err) {
      this.ok = false;
      return false;
    }
  }

  destroy() {
    if (this.rt) { try { this.rt.destroy(); } catch (err) { /* ignore */ } }
    this.rt = null; this.tex = null; this.ok = false;
  }

  setVisible(v) { if (this.rt) this.rt.setVisible(v); }

  // Start a frame: view centre in world units + current zoom, ambient colour, stamp cap.
  begin(cx, cy, zoom, cap) {
    this.n = 0;
    this.cx = cx; this.cy = cy; this.zoom = zoom; this.cap = cap;
  }

  // Add a light. radius in world units, col packed RGB, a = intensity 0..1.
  add(x, y, radius, col, a) {
    if (this.n >= this.cap) return;
    let img = this.imgs[this.n];
    if (!img) {
      img = this.scene.make.image({ x: 0, y: 0, key: 'light', add: false });
      img.setBlendMode(Phaser.BlendModes.NORMAL); // ADD inside the capture buffer left square quads (alpha sums in the blit); NORMAL accumulates cleanly
      this.imgs.push(img);
    }
    this.n++;
    const k = this.zoom * RES;
    img.x = this.w * 0.5 + (x - this.cx) * k;
    img.y = this.h * 0.5 + (y - this.cy) * k;
    img.setScale((radius * 2 * k) / LIGHT_PX).setTint(col).setAlpha(a);
  }

  // Fill with ambient and draw all lights added this frame.
  flush(ambient) {
    if (!this.ok) return;
    try {
      const t = this.tex;
      this.rt.fill(ambient, 1);
      if (this.n > 0) {
        t.beginDraw();
        for (let i = 0; i < this.n; i++) {
          const im = this.imgs[i];
          t.batchGameObject(im, im.x, im.y);
        }
        t.endDraw();
      }
    } catch (err) {
      this.ok = false;
      this.setVisible(false);
    }
  }
}
