// Hero outline (cream DR3 outline + light-red DR1 hit outline), rebuilt every frame from the hero's OWN transformed parts.
// The old outline was one baked ring of the flat rest pose, placed at the feet: it ignored the walk lean/bob/squash, the swinging
// boots, head tilt and ember spring, and (a canvas texture without a custom pivot) Phaser flipped it about the texture centre instead
// of the soles, so it slid off the hero when she faced left (Elias by ~7 world units). Here each visible part (rig parts, or the flat
// sprite on Low / iframes / death) is stamped into a small dynamic texture with exactly its own frame, origin, rotation, scale and
// flip: silhouettes at 8 offsets, then the parts themselves erased, leaving only the ring. Display only, no allocation per frame.

export const OL_RES = 4; // texels per world unit (the old bake was ~7; the ring is soft anyway)
export const OL_SIZE = 72; // world units square around the hero (Elias + staff + lantern swing fit with margin)
export const OL_UP = 18; // the square's centre sits this far above the soles
export const OL_W = 1.1; // ring width, world units (as the old bake)
const TEXN = OL_SIZE * OL_RES;
const HALF = TEXN / 2;
const DIRS = 8;
const OFF_X = []; const OFF_Y = [];
for (let a = 0; a < DIRS; a++) { OFF_X.push(Math.cos((a * Math.PI * 2) / DIRS) * OL_W * OL_RES); OFF_Y.push(Math.sin((a * Math.PI * 2) / DIRS) * OL_W * OL_RES); }

// Pure: outline square centre for soles at (fx, fy), snapped to whole world units so every stamp keeps its exact sub-pixel offset.
export function olCentre(fx, fy, out) { out.x = Math.round(fx); out.y = Math.round(fy - OL_UP); return out; }
// Pure: a world point -> texel inside the outline texture (stamp position), and back (where the displayed outline puts that texel).
export const toTex = (wx, wy, c, out) => { out.x = (wx - c.x) * OL_RES + HALF; out.y = (wy - c.y) * OL_RES + HALF; return out; };
export const toWorld = (tx, ty, c, out) => { out.x = c.x + (tx - HALF) / OL_RES; out.y = c.y + (ty - HALF) / OL_RES; return out; };

// Pure: copy a part's transform onto its stamp (any objects with Phaser-like fields; used by the tests with plain objects).
export function stampOf(part, c, s, tmp) {
  toTex(part.x, part.y, c, tmp);
  s.x = tmp.x; s.y = tmp.y;
  s.rotation = part.rotation;
  s.scaleX = part.scaleX * OL_RES; s.scaleY = part.scaleY * OL_RES;
  s.flipX = !!part.flipX; s.flipY = !!part.flipY;
  if (s.originX !== part.originX || s.originY !== part.originY) { if (s.setOrigin) s.setOrigin(part.originX, part.originY); else { s.originX = part.originX; s.originY = part.originY; } }
  return s;
}

export class HeroLine {
  // colour: the ring colour (cream); the hit outline tints the same texture light red at display time
  constructor(scene, key, colour, maxParts = 8) {
    this.scene = scene;
    this.key = key;
    this.colour = colour;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.tex = scene.textures.addDynamicTexture(key, TEXN, TEXN);
    this.box = scene.make.container({ x: 0, y: 0 }, false);
    this.stamps = [];
    for (let i = 0; i < maxParts; i++) {
      const s = scene.make.image({ x: 0, y: 0, key: '__WHITE' }, false);
      s.setVisible(false); s.tk = ''; s.tf = '';
      this.stamps.push(s);
      this.box.add(s);
    }
    this.c = { x: 0, y: 0 }; this.tmp = { x: 0, y: 0 };
    this.n = 0;
  }

  // parts: visible Images to outline (the rig's own parts this frame). fx, fy: the soles. Returns the display centre {x, y}.
  build(parts, n, fx, fy) {
    const c = olCentre(fx, fy, this.c);
    const st = this.stamps;
    let k = 0;
    for (let i = 0; i < n && k < st.length; i++) {
      const p = parts[i];
      if (!p || !p.visible || !p.frame) continue;
      const s = st[k++];
      const tk = p.texture.key, tf = p.frame.name;
      if (s.tk !== tk || s.tf !== tf) { s.setTexture(tk, tf); s.tk = tk; s.tf = tf; }
      stampOf(p, c, s, this.tmp);
      s.setVisible(true);
    }
    for (let i = k; i < st.length; i++) if (st[i].visible) st[i].setVisible(false);
    this.n = k;
    const T = this.tex;
    T.clear();
    if (!k) return c;
    for (let i = 0; i < k; i++) st[i].setTintFill(this.colour).setAlpha(1);
    T.beginDraw();
    for (let d = 0; d < DIRS; d++) T.batchDraw(this.box, OFF_X[d], OFF_Y[d]);
    T.endDraw();
    for (let i = 0; i < k; i++) st[i].clearTint();
    T.erase(this.box, 0, 0); // the parts themselves: leaves only the ring outside the silhouette
    return c;
  }

  destroy() { this.box.destroy(); if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key); }
}
