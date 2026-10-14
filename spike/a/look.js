// Shader patches for MeshToonMaterial: VAT (baked vertex animation texture) instancing, rim light,
// hit flash, spirit flap and the "life map" ground/prop shading. Pure GLSL string edits, nothing evaluated from assets.
import * as THREE from 'three';

export const U = {
  uTime: { value: 0 },
  uLife: { value: null },
  uWorld: { value: 400 },
  uLifeOn: { value: 1 },
};

const NOISE = `
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x), mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0,1.0)),f.x), f.y); }
`;

// o: { vat:{pos,nrm,V,frames,fps}, rim:Color|null, rimPow, life:bool, flap:bool }
export function patch(mat, o = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uLife = U.uLife;
    sh.uniforms.uWorld = U.uWorld;
    sh.uniforms.uLifeOn = U.uLifeOn;
    sh.uniforms.uRimCol = { value: o.rim || new THREE.Color(0, 0, 0) };
    sh.uniforms.uRimPow = { value: o.rimPow ?? 2.5 };
    if (o.vat) {
      sh.uniforms.uVat = { value: o.vat.pos };
      sh.uniforms.uVatN = { value: o.vat.nrm };
      sh.uniforms.uV = { value: o.vat.V };
      sh.uniforms.uFrames = { value: o.vat.frames };
      sh.uniforms.uFps = { value: o.vat.fps };
    }
    let vs = sh.vertexShader;
    vs = vs.replace('#include <common>', `#include <common>
      varying float vFlash; varying vec2 vLifeXZ;
      attribute float aFlash; attribute float aPhase; attribute float aWing;
      uniform float uTime;
      ${o.vat ? `uniform highp sampler2D uVat; uniform highp sampler2D uVatN; uniform float uV; uniform float uFrames; uniform float uFps;
      ivec2 vatUV(float idx){ int i=int(idx); return ivec2(i & 2047, i >> 11); }` : ''}`);
    if (o.vat) {
      vs = vs.replace('#include <beginnormal_vertex>', `
        float vFr = mod(uTime*uFps + aPhase, uFrames);
        float vF0 = floor(vFr); float vF1 = mod(vF0+1.0, uFrames); float vK = vFr - vF0;
        float vId = float(gl_VertexID);
        vec3 vatP = mix(texelFetch(uVat, vatUV(vF0*uV+vId), 0).xyz, texelFetch(uVat, vatUV(vF1*uV+vId), 0).xyz, vK);
        vec3 vatN = normalize(mix(texelFetch(uVatN, vatUV(vF0*uV+vId), 0).xyz, texelFetch(uVatN, vatUV(vF1*uV+vId), 0).xyz, vK));
        vec3 objectNormal = vatN;`);
      vs = vs.replace('#include <begin_vertex>', 'vec3 transformed = vatP;');
    }
    if (o.flap) {
      vs = vs.replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
        transformed.y += aWing * sin(uTime*12.0 + aPhase*6.2831) * 0.3;`);
    }
    vs = vs.replace('#include <project_vertex>', `#include <project_vertex>
      vFlash = aFlash;
      { vec4 wp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
        #endif
        vLifeXZ = (modelMatrix * wp).xz; }`);
    sh.vertexShader = vs;

    let fs = sh.fragmentShader;
    fs = fs.replace('#include <common>', `#include <common>
      varying float vFlash; varying vec2 vLifeXZ;
      uniform sampler2D uLife; uniform float uWorld; uniform float uLifeOn; uniform float uTime;
      uniform vec3 uRimCol; uniform float uRimPow;
      ${NOISE}`);
    fs = fs.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float rimT = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), uRimPow);
        totalEmissiveRadiance += uRimCol * rimT + vec3(vFlash);
      }`);
    if (o.life) {
      fs = fs.replace('#include <map_fragment>', `#include <map_fragment>
        if (uLifeOn > 0.5) {
          vec4 lf = texture2D(uLife, vLifeXZ / uWorld);
          float nz = vnoise(vLifeXZ*0.7)*0.6 + vnoise(vLifeXZ*2.3)*0.4;
          float L = smoothstep(0.28, 0.62, lf.r + (nz-0.5)*0.45);
          float g = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114));
          vec3 hollow = vec3(g) * vec3(0.6,0.68,0.9) * 0.8;
          vec3 alive = diffuseColor.rgb * vec3(1.18,1.12,0.92);
          diffuseColor.rgb = mix(hollow, alive, L);
          float C = smoothstep(0.35, 0.8, lf.g + (nz-0.5)*0.35);
          float vn = vnoise(vLifeXZ*1.6) + 0.5*vnoise(vLifeXZ*4.1);
          float vein = 1.0 - smoothstep(0.0, 0.07, abs(fract(vn*1.7) - 0.5) - 0.38);
          vec3 cor = vec3(0.035,0.02,0.05) + vec3(0.4,0.04,0.55) * vein * 0.55;
          diffuseColor.rgb = mix(diffuseColor.rgb, cor, C);
        }`);
    }
    sh.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => 'sp' + (o.vat ? 'v' : '') + (o.flap ? 'f' : '') + (o.life ? 'l' : '');
  return mat;
}

export function gradientMap() {
  const t = new THREE.DataTexture(new Uint8Array([70, 130, 195, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

// mossy cursed-forest ground tile (canvas, seamless enough with wrap)
export function groundTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#3d5a3a';
  g.fillRect(0, 0, S, S);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cols = ['#4a6b3e', '#34502f', '#5a4a34', '#2f4a40', '#6b5a3a', '#456a46'];
  for (let i = 0; i < 520; i++) {
    const x = rnd() * S, y = rnd() * S, r = 6 + rnd() * 34;
    g.fillStyle = cols[(rnd() * cols.length) | 0];
    g.globalAlpha = 0.25 + rnd() * 0.3;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.beginPath(); g.ellipse(x + ox, y + oy, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, 6.3); g.fill();
    }
  }
  g.globalAlpha = 0.5;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * S, y = rnd() * S;
    g.fillStyle = rnd() < 0.5 ? '#c9893a' : '#8a3a2a';
    g.fillRect(x, y, 3 + rnd() * 4, 2 + rnd() * 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
