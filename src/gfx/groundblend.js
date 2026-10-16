// Ground blend (W0 spike): one world-space quad whose fragment shader mixes the Hollow tile and the restored
// tile by the life map. Med/High only. Any failure (no WebGL, compile error, GL error) sets `ok = false`
// and the scene falls back to the flat Hollow tileSprite + warm pool sprites (Low look). Visual only.
import Phaser from 'phaser';

const TILE_UNITS = 512; // world units per tile repeat (1024 px tile at 2 texels/unit)

const VERT = `
precision highp float;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform float uWorld;
attribute vec2 inPosition;
varying vec2 vTile;
varying vec2 vLife;
varying vec2 vWorld;
void main () {
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(inPosition, 1.0, 1.0);
  vTile = inPosition / ${TILE_UNITS}.0;
  vLife = inPosition / uWorld;
  vWorld = inPosition;
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D iChannel0; // Hollow tile
uniform sampler2D iChannel1; // restored tile
uniform sampler2D iChannel2; // life map: R = life, G = ground zone weight (0 set A .. 1 set B), B = corruption (W3)
uniform sampler2D iChannel3; // set B Hollow tile (Deep Forest Floor)
uniform sampler2D iChannel4; // set B restored tile
uniform vec3 uTint;
uniform float uTime;
uniform float uBReady; // 0 until the set B tiles are painted, then fades to 1 (no pop)
uniform vec2 uHero; // hero world position (AL-1: baked ground flowers/tufts calm down near the hero)
varying vec2 vTile;
varying vec2 vLife;
varying vec2 vWorld;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main () {
  vec2 t = fract(vTile);
  vec4 lz = texture2D(iChannel2, vLife);
  float l = lz.r;
  float zb = lz.g;
  vec3 hol = texture2D(iChannel0, t).rgb;
  vec3 res = texture2D(iChannel1, t).rgb;
  zb *= uBReady;
  if (zb > 0.004) { // zone set B: only pay for the extra reads inside / near B zones
    hol = mix(hol, texture2D(iChannel3, t).rgb, zb);
    res = mix(res, texture2D(iChannel4, t).rgb, zb);
  }
  // AL-1 clear zone: within ~78 units of the hero the restored tile is blurred toward its local mean (flowers lose most of their
  // contrast, no hard disc), fully back to normal by ~125 units. Only pixels near the hero pay for the 4 extra taps.
  float hd = distance(vWorld, uHero);
  float hc = 1.0 - smoothstep(78.0, 125.0, hd);
  if (hc > 0.004) {
    float s = 6.0 / 1024.0;
    vec3 bl = texture2D(iChannel1, t + vec2(s, s)).rgb + texture2D(iChannel1, t + vec2(-s, s)).rgb + texture2D(iChannel1, t + vec2(s, -s)).rgb + texture2D(iChannel1, t + vec2(-s, -s)).rgb;
    bl *= 0.25;
    if (zb > 0.004) {
      vec3 b2 = texture2D(iChannel4, t + vec2(s, s)).rgb + texture2D(iChannel4, t + vec2(-s, s)).rgb + texture2D(iChannel4, t + vec2(s, -s)).rgb + texture2D(iChannel4, t + vec2(-s, -s)).rgb;
      bl = mix(bl, b2 * 0.25, zb);
    }
    res = mix(res, mix(res, bl, 0.85), hc);
  }
  float n = vn(vTile * 14.0) * 0.6 + vn(vTile * 33.0) * 0.4 - 0.5;
  float m = smoothstep(0.14, 0.72, l + n * 0.3);
  float rim = smoothstep(0.0, 0.5, m) * (1.0 - smoothstep(0.5, 1.0, m));
  vec3 col = mix(hol, res, m) + rim * vec3(0.10, 0.08, 0.02);
  // very low-frequency value drift (+-4%) hides the 512-unit tile repeat; never touches hue
  col *= 0.96 + 0.08 * vn(vTile * 1.7 + 11.0);
  // W1b: a second, much larger low-contrast value layer (periods ~1300 and ~600 world units, +-5%) so the 512-unit tile repeat does not read
  col *= 0.95 + 0.10 * (0.65 * vn(vLife * 3.1 + 5.0) + 0.35 * vn(vLife * 6.7 + 17.0));
  // W3 corruption: ink-dark ground with faint cold-violet cracks, grown from the B channel; restored ground (life) pushes it back.
  // Static (no flashing), never red; crack detail kept low contrast so enemies, pickups and numbers stay readable on top.
  float cc = lz.b * (1.0 - smoothstep(0.35, 0.75, l));
  if (cc > 0.02) {
    float nn = vn(vTile * 22.0) * 0.55 + vn(vTile * 57.0) * 0.45;
    float cm = smoothstep(0.16, 0.5, cc + (nn - 0.5) * 0.3) * smoothstep(0.02, 0.1, cc);
    float v1 = abs(vn(vTile * 38.0 + 3.0 + nn * 1.5) - 0.5);
    float v2 = abs(vn(vTile * 91.0 + 7.0) - 0.5);
    float vein = (1.0 - smoothstep(0.0, 0.03, v1)) + 0.5 * (1.0 - smoothstep(0.0, 0.045, v2));
    vein = min(vein, 1.0) * smoothstep(0.3, 0.8, cc);
    vec3 ink = vec3(0.085, 0.090, 0.150) * (0.92 + 0.16 * nn);
    vec3 crk = vec3(0.225, 0.195, 0.335);
    float rim = cm * (1.0 - cm) * 4.0;
    col = mix(col, ink + vein * (crk - ink) + rim * vec3(0.045, 0.030, 0.085), cm * 0.94);
  }
  gl_FragColor = vec4(col * uTint, 1.0);
}`;

export class GroundBlend {
  constructor(scene) {
    this.scene = scene;
    this.sh = null;
    this.ok = false;
    this.lifeTex = null;
    this.ver = -1;
    this.failed = false; // sticky: once a compile/GL failure happens we stop trying this session
  }

  // size = world units. Returns true when the shader object exists and compiled.
  build(size, lifeMap) {
    this.destroy();
    if (this.failed) return false;
    const scene = this.scene;
    try {
      if (scene.renderer.type !== Phaser.WEBGL) return false;
      const gl = scene.renderer.gl;
      const base = new Phaser.Display.BaseShader('groundblend', FRAG, VERT, {
        uWorld: { type: '1f', value: size },
        uHero: { type: '2f', value: { x: -9999, y: -9999 } },
        uBReady: { type: '1f', value: (scene.bState && scene.bState.ready) || 0 },
        uTint: { type: '3f', value: { x: 1, y: 1, z: 1 } },
        iChannel4: { type: 'sampler2D', value: null, textureData: { repeat: true } },
      });
      const sh = scene.add.shader(base, size / 2, size / 2, size, size, ['ground', 'groundR', null, 'groundBH']);
      sh.setSampler2D('iChannel4', 'groundBR', 4, { repeat: true });
      if (!sh.program) throw new Error('groundblend: no program');
      sh.setDepth(-1000);
      // life map: 256x256 RGBA, clamped, linear; re-uploaded from the CPU array at ~10 Hz
      const blank = new Uint8Array(lifeMap.rgba.length);
      const wrapper = sh.renderer.createTexture2D(0, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.RGBA, blank, lifeMap.n, lifeMap.n);
      sh.uniforms.iChannel2.value = wrapper;
      sh.uniforms.iChannel2.textureData = {};
      this.lifeTex = wrapper;
      this.gl = gl;
      this.sh = sh;
      this.n = lifeMap.n;
      this.ver = -1;
      this.fullDone = false;
      this.upload(lifeMap);
      this.ok = true;
      if (gl.getError() !== gl.NO_ERROR) throw new Error('groundblend: GL error after build');
      return true;
    } catch (err) {
      console.warn('[groundblend] disabled, falling back to flat ground:', err && err.message);
      this.failed = true;
      this.destroy();
      return false;
    }
  }

  // Perf: after the first full upload only the rows the life map touched this step are sent (texSubImage2D); the texture has no
  // mipmaps and is never filtered below LINEAR, so Phaser's per-upload texImage2D + generateMipmap was wasted work.
  upload(lifeMap) {
    if (!this.ok && !this.lifeTex) return;
    if (lifeMap.version === this.ver) return;
    this.ver = lifeMap.version;
    const gl = this.gl;
    const w = this.lifeTex;
    const first = !this.fullDone || lifeMap.n !== this.n;
    if (first || !w.webGLTexture) {
      w.update(lifeMap.rgba, lifeMap.n, lifeMap.n, false, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR, gl.RGBA);
      this.fullDone = true;
      return;
    }
    const y0 = lifeMap.dy0;
    const h = lifeMap.dy1 - y0 + 1;
    if (h <= 0) return;
    const n = lifeMap.n;
    gl.activeTexture(gl.TEXTURE0);
    const cur = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, w.webGLTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, n, h, gl.RGBA, gl.UNSIGNED_BYTE, lifeMap.rgba.subarray(y0 * n * 4, (y0 + h) * n * 4));
    gl.bindTexture(gl.TEXTURE_2D, cur || null);
  }

  setTint(col) {
    if (!this.sh) return;
    const u = this.sh.uniforms.uTint.value;
    u.x = ((col >> 16) & 255) / 255; u.y = ((col >> 8) & 255) / 255; u.z = (col & 255) / 255;
  }

  setHero(x, y) { if (this.sh) { const u = this.sh.uniforms.uHero.value; u.x = x; u.y = y; } }

  setBReady(v) { if (this.sh) this.sh.uniforms.uBReady.value = v; }

  setVisible(v) { if (this.sh) this.sh.setVisible(v); }

  // Called when the runtime reports a problem: stop using the shader for good.
  fail() { this.failed = true; this.destroy(); }

  destroy() {
    if (this.sh) { try { this.sh.destroy(); } catch (err) { /* ignore */ } }
    this.sh = null;
    this.lifeTex = null;
    this.ok = false;
  }
}
