// BL1 High-quality bloom 'B tuned' (Matt 2026-10-23, docs/design/bloom-contrast-options.md): bright-pass only.
// Threshold the frame (soft knee above THRESH luminance), blur that at half resolution, ADD it on top of the untouched sharp frame.
// Nothing is dimmed and small sprites stay sharp (the built-in Phaser bloom mixed the frame 50/50 with a darker blur).
// Render only, WebGL only; RunScene feature-detects and falls back to no bloom.
import Phaser from 'phaser';
import { BLOOM_DEF, bloomLevel } from './bloomlevel.js';

export const BLOOM_KEY = 'HLBloom';
const BRIGHT = `
#define SHADER_NAME HL_BLOOM_BRIGHT_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uThresh;
uniform float uKnee;
varying vec2 outTexCoord;
void main () {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float w = smoothstep(uThresh, uThresh + uKnee, l) * clamp((l - uThresh) / max(1.0 - uThresh, 0.001), 0.0, 1.0);
  gl_FragColor = vec4(c.rgb * w, 1.0);
}`;

const BLUR = `
#define SHADER_NAME HL_BLOOM_BLUR_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 offset;
varying vec2 outTexCoord;
void main () {
  vec4 s = texture2D(uMainSampler, outTexCoord) * 0.204164;
  s += texture2D(uMainSampler, outTexCoord + offset * 1.407333) * 0.304005;
  s += texture2D(uMainSampler, outTexCoord - offset * 1.407333) * 0.304005;
  s += texture2D(uMainSampler, outTexCoord + offset * 3.294215) * 0.093913;
  s += texture2D(uMainSampler, outTexCoord - offset * 3.294215) * 0.093913;
  gl_FragColor = s;
}`;

const ADD = `
#define SHADER_NAME HL_BLOOM_ADD_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform sampler2D uBloom;
uniform float uStrength;
varying vec2 outTexCoord;
void main () {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec3 b = texture2D(uBloom, outTexCoord).rgb * uStrength;
  gl_FragColor = vec4(c.rgb + b, c.a);
}`;

export class HLBloomFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({ game, name: BLOOM_KEY, shaders: [{ name: 'hlBright', fragShader: BRIGHT }, { name: 'hlBlur', fragShader: BLUR }, { name: 'hlAdd', fragShader: ADD }] });
    this.p = { ...BLOOM_DEF };
    this.day = 0; // RunScene sets this from the arc each frame (render only)
  }

  onDraw(target) {
    const p = this.p, lv = bloomLevel(p, this.day), sharp = this.fullFrame1, out = this.fullFrame2, h1 = this.halfFrame1, h2 = this.halfFrame2;
    this.copyFrame(target, sharp);
    this.bind(this.shaders[0]); this.set1f('uThresh', lv.thresh); this.set1f('uKnee', p.knee);
    this.bindAndDraw(target, h1, true, true, this.shaders[0]);
    this.bind(this.shaders[1]);
    const x = p.offset / h1.width, y = p.offset / h1.height;
    for (let i = 0; i < p.steps; i++) {
      this.set2f('offset', x, 0, this.shaders[1]); this.bindAndDraw(h1, h2, true, true, this.shaders[1]);
      this.set2f('offset', 0, y, this.shaders[1]); this.bindAndDraw(h2, h1, true, true, this.shaders[1]);
    }
    const gl = this.gl, sh = this.shaders[2];
    this.bind(sh); this.set1i('uBloom', 1, sh); this.set1f('uStrength', lv.strength, sh);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, h1.texture.webGLTexture);
    this.bindAndDraw(sharp, out, true, true, sh);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0);
    this.copyToGame(out);
  }
}
