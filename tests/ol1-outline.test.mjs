// OL1: the hero outline must sit exactly on the hero for every facing, flip frame, walk phase, lean/bob and the flat (Low/iframe) sprite,
// for Wren and Elias. Runs the real rigs against stub images, then pushes every visible part through Phaser 3.90's own sprite vertex
// maths (MultiPipeline.batchSprite: flip without a custom pivot mirrors about the frame centre) twice: as drawn on screen, and as stamped
// into the outline texture and shown by the outline image. Every frame corner must land on the same world point (< 0.5 px at zoom 4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HeroRig } from '../src/gfx/herorig.js';
import { EliasRig } from '../src/gfx/eliasrig.js';
import { FLAT, FEET } from '../src/gfx/wrenart.js';
import { E_FLAT } from '../src/gfx/eliasart.js';
import { OL_RES, OL_SIZE, olCentre, toTex, toWorld, stampOf } from '../src/gfx/heroline.js';

const ZOOM = 4; // device px per world unit (high-DPI); 0.5 px = 0.125 world units
const TOL = 0.5 / ZOOM;

// ---- stub Phaser Image: records what the rig sets; frames carry a custom pivot like the real atlas (flat: see flatPivot below)
class Img {
  constructor(name, pivot) {
    this.x = 0; this.y = 0; this.rotation = 0; this.scaleX = 1; this.scaleY = 1; this.flipX = false; this.flipY = false;
    this.visible = true; this.alpha = 1; this.depth = 0; this.depthSet = false;
    this.frame = { name, width: 50, height: 70, customPivot: pivot !== null, pivotX: 0.42, pivotY: 0.86 };
    if (pivot) { this.frame.pivotX = pivot[0]; this.frame.pivotY = pivot[1]; }
    this.originX = this.frame.customPivot ? this.frame.pivotX : 0.5; this.originY = this.frame.customPivot ? this.frame.pivotY : 0.5;
    this.texture = { key: 'tex' };
  }
  setVisible(v) { this.visible = v; return this; }
  setPosition(x, y) { this.x = x; this.y = y; return this; }
  setRotation(r) { this.rotation = r; return this; }
  setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; }
  setFlipX(f) { this.flipX = f; return this; }
  setDepth(d) { this.depth = d; this.depthSet = true; return this; }
  setFrame(n) { this.frame = { ...this.frame, name: n }; return this; }
  setTexture(k) { this.texture = { key: k }; return this; }
  setAlpha(a) { this.alpha = a; return this; }
  setOrigin(x, y = x) { this.originX = x; this.originY = y; return this; }
  setTint() { return this; } clearTint() { return this; } setTintFill() { return this; } setBlendMode() { return this; }
}
const scene = { add: { image: (x, y, key, frame) => new Img(frame || key, undefined) }, textures: { exists: () => true } };

// Phaser 3.90 MultiPipeline.batchSprite: world position of texel (u, v) of an image
function texelWorld(img, u, v) {
  const f = img.frame, w = f.width, h = f.height;
  const dox = img.originX * w, doy = img.originY * h;
  let x = -dox, y = -doy;
  let fx = 1, fy = 1;
  if (img.flipX) { if (!f.customPivot) x += -w + dox * 2; fx = -1; }
  if (img.flipY) { if (!f.customPivot) y += -h + doy * 2; fy = -1; }
  const lx = (x + u) * img.scaleX * fx, ly = (y + v) * img.scaleY * fy;
  const c = Math.cos(img.rotation), s = Math.sin(img.rotation);
  return [img.x + lx * c - ly * s, img.y + lx * s + ly * c];
}

// the outline path: part -> stamp in the outline texture -> outline image (origin 0.5, scale 1/RES) in the world
function viaOutline(part, fxW, fyW, u, v) {
  const c = olCentre(fxW, fyW, { x: 0, y: 0 });
  const st = stampOf(part, c, { frame: part.frame }, { x: 0, y: 0 });
  const t = texelWorld(st, u, v); // texel position inside the outline texture
  return [c.x + (t[0] - (OL_SIZE * OL_RES) / 2) / OL_RES, c.y + (t[1] - (OL_SIZE * OL_RES) / 2) / OL_RES];
}

function worstGap(parts, fxW, fyW) {
  let worst = 0;
  for (const p of parts) {
    if (!p.visible) continue;
    const { width: w, height: h } = p.frame;
    for (const [u, v] of [[0, 0], [w, 0], [0, h], [w, h], [p.originX * w, p.originY * h]]) {
      const a = texelWorld(p, u, v), b = viaOutline(p, fxW, fyW, u, v);
      worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1]));
    }
  }
  return worst;
}

function makeSim(id) {
  return { characterId: id, time: 0, state: 'running', zones: [], player: { x: 2000, y: 2000, faceX: 1, hp: 100, maxHp: 100, iframes: 0, speed: 100 } };
}

// Walk a scripted path: right, flip left (squeeze frames), up, down, stop; each frame checks the rig parts and the outline agree.
function drive(Rig, id, tier, onFrame) {
  const flat = new Img('flat', id === 'wren' ? [-FLAT.x0 / FLAT.w, -FLAT.y0 / FLAT.h] : [-E_FLAT.x0 / E_FLAT.w, -E_FLAT.y0 / E_FLAT.h]);
  const rig = new Rig(scene, { depth: 1000, glowKey: 'glow', glowInv: 1, blendAdd: 1, flat });
  const sim = makeSim(id);
  rig.bind(sim);
  const parts = [...rig.parts, flat];
  const legs = [[1, 0, 40], [-1, 0, 40], [0, -1, 30], [0, 1, 30], [1, 1, 20], [0, 0, 30]]; // [mx, my, frames]
  const p = sim.player;
  for (const [mx, my, n] of legs) {
    for (let i = 0; i < n; i++) {
      sim.time += 1 / 60;
      p.x += mx * 100 / 60; p.y += my * 100 / 60;
      if (Math.abs(mx) > 0.1) p.faceX = mx > 0 ? 1 : -1;
      rig.update(sim, tier, false, 1 / 60, { trails: 0 }, null);
      onFrame(rig, parts, p, mx, my);
    }
  }
}

for (const [Rig, id] of [[HeroRig, 'wren'], [EliasRig, 'elias']]) {
  for (const tier of ['high', 'low']) {
    test(`OL1 ${id} (${tier}): outline matches the drawn parts on every facing, flip, walk and stop frame`, () => {
      let worst = 0, frames = 0, leftFrames = 0;
      drive(Rig, id, tier, (rig, parts, p) => {
        worst = Math.max(worst, worstGap(parts, p.x, p.y + FEET));
        frames++; if (rig.dir < 0) leftFrames++;
      });
      assert.ok(frames > 150 && leftFrames > 30);
      assert.ok(worst < TOL, `worst gap ${worst.toFixed(3)} world units`);
    });
  }
  test(`OL1 ${id}: every rig part (head included) faces the way the hero faces and has its depth set`, () => {
    drive(Rig, id, 'high', (rig) => {
      for (const q of rig.parts) {
        if (!q.visible || q === rig.ember) continue; // Wren's ember cage hangs from a spring and is symmetric (never flipped)
        assert.equal(q.flipX, rig.dir < 0, `${q.frame.name} flip`);
        assert.ok(q.depthSet && q.depth > 900, `${q.frame.name} depth`);
      }
    });
  });
}

test('OL1 before/after: the old baked ring (flat pose, flipped without a custom pivot) slid off the hero facing left', () => {
  // the old heroOut: flat texture, origin at the soles, flipX for left, Phaser flips about the texture centre
  for (const [box, name, min] of [[FLAT, 'wren', 0.4], [E_FLAT, 'elias', 6]]) {
    const old = new Img('o', null); old.frame = { ...old.frame, width: box.w, height: box.h, customPivot: false };
    old.setOrigin(-box.x0 / box.w, -box.y0 / box.h).setPosition(100, 100).setScale(0.211).setFlipX(true);
    const fixed = new Img('o', [-box.x0 / box.w, -box.y0 / box.h]); fixed.frame = { ...fixed.frame, width: box.w, height: box.h };
    fixed.setOrigin(-box.x0 / box.w, -box.y0 / box.h).setPosition(100, 100).setScale(0.211).setFlipX(true);
    const u = -box.x0, v = -box.y0; // the soles texel
    const a = texelWorld(old, u, v), b = texelWorld(fixed, u, v);
    assert.ok(Math.abs(a[0] - 100) > min, `${name} old offset ${(a[0] - 100).toFixed(2)}`);
    assert.ok(Math.abs(b[0] - 100) < 1e-9 && Math.abs(b[1] - 100) < 1e-9);
  }
});

test('OL1 outline maths: texel <-> world round trip and centre snapping', () => {
  const c = olCentre(1234.37, 987.6, { x: 0, y: 0 });
  assert.ok(Number.isInteger(c.x) && Number.isInteger(c.y));
  const t = toTex(1240.125, 970.5, c, { x: 0, y: 0 });
  const w = toWorld(t.x, t.y, c, { x: 0, y: 0 });
  assert.ok(Math.abs(w.x - 1240.125) < 1e-9 && Math.abs(w.y - 970.5) < 1e-9);
  // the whole hero (Elias with staff and lantern swing) fits inside the outline square
  assert.ok(OL_SIZE / 2 + 18 > -E_FLAT.y0 * 0.211 + 6 && OL_SIZE / 2 - 18 > (E_FLAT.y0 + E_FLAT.h) * 0.211 + 2);
});

test('OL1 source: flat hero textures get a custom pivot; the scene outlines the rig parts every frame (no static baked ring)', () => {
  const tex = readFileSync(new URL('../src/gfx/rigtex.js', import.meta.url), 'utf8');
  assert.ok(/flatPivot\(put\(scene, 'hero_wren', fcv\), FLAT\)/.test(tex) && /flatPivot\(put\(scene, 'hero_elias', fcv\), E_FLAT\)/.test(tex));
  assert.ok(/f\.customPivot = true/.test(tex));
  const sc = readFileSync(new URL('../src/scenes/RunScene.js', import.meta.url), 'utf8');
  assert.ok(/this\.heroLine\.build\(this\.olParts/.test(sc));
  assert.ok(!/heroOut[^\n]*setFlipX/.test(sc) && !/heroHit[^\n]*setFlipX/.test(sc));
  const hr = readFileSync(new URL('../src/gfx/herorig.js', import.meta.url), 'utf8');
  assert.ok(!/\/\/[^\n]*\.setFlipX\(fl\)/.test(hr), 'no rig call hidden inside a comment');
});
