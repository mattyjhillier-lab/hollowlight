// Spike B: pre-rendered 8-direction sprites (baked from the same 3D models) drawn with Phaser 3 WebGL,
// driven by the same Sim state. Ground = one fragment shader (procedural moss + life map + lantern).
import Phaser from 'phaser';
import { S } from '../a/scene3d.js';

const url = (p) => new URL('../assets-b/' + p, import.meta.url).href;
const TILT = Math.sin((48 * Math.PI) / 180); // ground foreshortening, same camera pitch as A

const GROUND_FS = `
precision highp float;
uniform vec2 resolution; uniform vec2 uCam; uniform vec2 uHero; uniform float uP; uniform float uWorld; uniform float uLifeOn; uniform float uLight;
uniform sampler2D iChannel0;
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x), mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0,1.0)),f.x), f.y); }
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 w = vec2(uCam.x + (fc.x - resolution.x*0.5)/uP, uCam.y - (fc.y - resolution.y*0.5)/(uP*${TILT.toFixed(4)}));
  float n1 = vnoise(w*0.9), n2 = vnoise(w*2.7+7.0), n3 = vnoise(w*0.25);
  vec3 moss = mix(vec3(0.20,0.31,0.19), vec3(0.29,0.42,0.24), n1);
  moss = mix(moss, vec3(0.34,0.29,0.20), smoothstep(0.55,0.8,n3));
  moss *= 0.85 + 0.3*n2;
  float leaf = smoothstep(0.82, 0.9, vnoise(w*7.0));
  moss = mix(moss, vec3(0.75,0.5,0.2), leaf*0.18);
  vec3 col = moss;
  vec4 lf = texture2D(iChannel0, w / uWorld);
  if (uLifeOn > 0.5) {
    float nz = vnoise(w*0.7)*0.6 + vnoise(w*2.3)*0.4;
    float L = smoothstep(0.28, 0.62, lf.r + (nz-0.5)*0.45);
    float g = dot(col, vec3(0.299,0.587,0.114));
    vec3 hollow = vec3(g) * vec3(0.6,0.68,0.9) * 0.8;
    col = mix(hollow, col*vec3(1.05,1.04,0.95), L);
    float C = smoothstep(0.35, 0.8, lf.g + (nz-0.5)*0.35);
    float vn = vnoise(w*1.6) + 0.5*vnoise(w*4.1);
    float vein = 1.0 - smoothstep(0.0, 0.07, abs(fract(vn*1.7) - 0.5) - 0.38);
    col = mix(col, vec3(0.035,0.02,0.05) + vec3(0.4,0.04,0.55)*vein*0.55, C);
  }
  float d = length(w - uHero);
  float lit = 0.8 + 0.6*uLight*exp(-d*d/220.0);
  lit = floor(lit*5.0)/5.0 * 0.5 + lit*0.5;
  col *= lit * mix(vec3(0.85,0.9,1.1), vec3(1.12,1.0,0.8), clamp(exp(-d*d/60.0),0.0,1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

function glowTex(scene, key, size, stops) {
  const c = scene.textures.createCanvas(key, size, size);
  const g = c.getContext();
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  c.refresh();
}
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

export async function createB({ stage, canvas, drive, life, quality = 'high', width, height, dpr = 1, phone = false, lifeOn = true }) {
  const meta = await (await fetch(url('atlas-meta.json'))).json();
  const imgs = await Promise.all(['chars', 'spirits', 'props'].map((k) => loadImg(url(`atlas-${k}.png`))));
  const dprEff = quality === 'high' ? Math.min(dpr, 1.5) : 1;
  const W = Math.round(width * dprEff), H = Math.round(height * dprEff);
  const wUnits = phone || width < height ? 20 : 34;
  const P = W / wUnits; // device px per world unit (horizontal)
  const k = P / meta.pxPerUnit; // sprite scale so a baked unit matches the world unit
  const sim = drive.sim;

  // draw-call / triangle counter (wraps the GL entry points once)
  const cnt = { calls: 0, tris: 0 };
  let game, scene;
  await new Promise((resolve) => {
    game = new Phaser.Game({
      type: Phaser.WEBGL, canvas, width: W, height: H, backgroundColor: '#14122a', banner: false, audio: { noAudio: true },
      scale: { mode: Phaser.Scale.NONE }, render: { antialias: true, powerPreference: 'high-performance', roundPixels: false },
      scene: { create() { scene = this; resolve(); } },
    });
  });
  game.loop.stop(); // we step the game ourselves from the shared rAF loop
  canvas.style.width = '100%'; canvas.style.height = '100%';
  const gl = game.renderer.gl;
  const de = gl.drawElements.bind(gl), da = gl.drawArrays.bind(gl);
  gl.drawElements = (m, c, t, o) => { cnt.calls++; cnt.tris += c / 3; de(m, c, t, o); };
  gl.drawArrays = (m, f, c) => { cnt.calls++; cnt.tris += m === gl.TRIANGLE_STRIP ? c - 2 : c / 3; da(m, f, c); };

  // textures + frames
  const tm = scene.textures;
  tm.addImage('chars', imgs[0]); tm.addImage('spirits', imgs[1]); tm.addImage('props', imgs[2]);
  const C = meta.cell;
  const ct = tm.get('chars');
  for (const cr of meta.creatures) for (let d = 0; d < 8; d++) for (let f = 0; f < 6; f++) { const i = cr.first + d * 6 + f; ct.add(`${cr.name}_${d}_${f}`, 0, (i % meta.chars.cols) * C, Math.floor(i / meta.chars.cols) * C, C, C); }
  const st = tm.get('spirits');
  for (let d = 0; d < 8; d++) { st.add(`wolf_${d}`, 0, (d % 8) * C, 0, C, C); for (let f = 0; f < 4; f++) { const i = 8 + d * 4 + f; st.add(`raven_${d}_${f}`, 0, (i % 8) * C, Math.floor(i / 8) * C, C, C); } }
  const pt = tm.get('props');
  for (const [name, p] of Object.entries(meta.props)) pt.add(name, 0, p.x, p.y, p.cell, p.cell);
  glowTex(scene, 'glow', 64, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
  glowTex(scene, 'blob', 64, [[0, 'rgba(0,0,0,0.7)'], [1, 'rgba(0,0,0,0)']]);
  glowTex(scene, 'vig', 256, [[0.45, 'rgba(10,8,34,0)'], [1, 'rgba(10,8,34,0.5)']]);
  const lifeCv = scene.textures.createCanvas('life', life.n, life.n);
  lifeCv.setFilter(Phaser.Textures.FilterMode.LINEAR);
  const lifeCtx = lifeCv.getContext();
  const lifeImg = lifeCtx.createImageData(life.n, life.n);

  // ground shader
  const bs = new Phaser.Display.BaseShader('ground', GROUND_FS, undefined, {
    uCam: { type: '2f', value: { x: 0, y: 0 } }, uHero: { type: '2f', value: { x: 0, y: 0 } },
    uP: { type: '1f', value: P }, uWorld: { type: '1f', value: sim.balance.worldSize * S }, uLifeOn: { type: '1f', value: lifeOn ? 1 : 0 }, uLight: { type: '1f', value: quality === 'high' ? 1 : 0.7 },
  });
  const ground = scene.add.shader(bs, 0, 0, W, H).setOrigin(0, 0).setDepth(-10);
  ground.setChannel0('life');

  const originY = meta.originY / C;
  const mk = (tex, frame) => { const im = scene.add.image(0, 0, tex, frame); im.setOrigin(0.5, originY); return im; };
  const pool = (n, fn) => Array.from({ length: n }, () => { const o = fn(); o.setVisible(false); return o; });

  // props (static ring forest + dressing), same placement idea as A
  const R = rng(12345), cx = drive.cx * S, cz = drive.cy * S;
  const propDefs = { tree_dead_large: [60, 9], tree_pine_orange_large: [50, 9], gravestone: [40, 2.2], pumpkin_orange_jackolantern: [22, 1.4], lantern_standing: [12, 2.4] };
  const props = [];
  for (const [name, [n, h]] of Object.entries(propDefs)) {
    const cell = meta.props[name].cell;
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283, d = name.startsWith('tree') ? 64 + R() * 30 : (i % 3 === 0 ? 64 + R() * 30 : R() * 55);
      const x = cx + Math.cos(a) * d * 1.05, z = cz + Math.sin(a) * d * 1.05;
      const im = scene.add.image(0, 0, 'props', name).setOrigin(0.5, originY);
      props.push({ im, x, z, sc: (k * (h / meta.targetH) * (0.85 + R() * 0.3) * C) / cell });
    }
  }
  const shadows = pool(700, () => scene.add.image(0, 0, 'blob').setDepth(1));
  const sp = {
    hero: mk('chars', 'hero_0_0'),
  };
  const enemyPool = pool(560, () => mk('chars', 'wolf_0_0'));
  const wolfPool = pool(80, () => mk('spirits', 'wolf_0'));
  const ravenPool = pool(80, () => mk('spirits', 'raven_0_0'));
  const gemPool = pool(700, () => scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0x55ffee).setDepth(900));
  const glowPool = pool(360, () => scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(901));
  const lanternGlow = scene.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff9a3a).setAlpha(0.18).setDepth(899);
  const vig = scene.add.image(W / 2, H / 2, 'vig').setDisplaySize(W, H).setDepth(1000);
  const heroH = sim.player.r * S * 2 * 2.3;
  const hmap = { wolf: 'wolf', crow: 'crow', root_crawler: 'root_crawler', elder_treant: 'elder_treant' };
  const eh = (id, r) => r * S * 2 * (id === 'elder_treant' ? 1.7 : 2.1);
  const dirOf = (dx, dz) => ((Math.round(Math.atan2(dx, dz) / (Math.PI / 4)) % 8) + 8) % 8;

  let t = 0, fi = 0, lifeFrame = 0;
  function frame(dtReal) {
    t += dtReal;
    cnt.calls = 0; cnt.tris = 0;
    const p = sim.player, hx = p.x * S, hz = p.y * S;
    const SX = (x) => (x - hx) * P + W / 2, SY = (z) => (z - hz) * P * TILT + H / 2;
    ground.setUniform('uCam.value.x', hx); ground.setUniform('uCam.value.y', hz);
    ground.setUniform('uHero.value.x', hx); ground.setUniform('uHero.value.y', hz);
    if (lifeOn && lifeFrame++ % 3 === 0) {
      const d = life.pack(); lifeImg.data.set(d); lifeCtx.putImageData(lifeImg, 0, 0); lifeCv.refresh();
    }
    // hero
    const sp0 = Math.hypot(drive.vx, drive.vy);
    if (sp0 > 3) sp.dir = dirOf(drive.vx, drive.vy);
    const hf = Math.floor((t * 8) % 6);
    const hsx = SX(hx), hsy = SY(hz);
    sp.hero.setFrame(`hero_${sp.dir ?? 0}_${sp0 > 3 ? hf : 0}`).setPosition(hsx, hsy).setScale(k * (heroH / meta.targetH)).setDepth(hsy);
    lanternGlow.setPosition(hsx, hsy - 30 * k).setScale(k * 9).setVisible(quality === 'high');
    // props, with life-tinted colour (updated every 6th frame)
    const retint = fi++ % 6 === 0;
    const lifeAt = (x, z) => { const i = Math.min(life.n - 1, Math.max(0, Math.floor((x / (sim.balance.worldSize * S)) * life.n))), j = Math.min(life.n - 1, Math.max(0, Math.floor((z / (sim.balance.worldSize * S)) * life.n))); return j * life.n + i; };
    for (const pr of props) {
      const sx = SX(pr.x), sy = SY(pr.z);
      const on = sx > -150 && sx < W + 150 && sy > -200 && sy < H + 250;
      pr.im.setVisible(on);
      if (!on) continue;
      pr.im.setPosition(sx, sy).setScale(pr.sc).setDepth(sy);
      if (retint && lifeOn) {
        const k0 = lifeAt(pr.x, pr.z), L = Math.min(1, Math.max(0, (life.life[k0] - 0.28) / 0.34)), Cc = Math.min(1, life.corr[k0] * 1.5);
        const r = (0.5 + 0.5 * L) * (1 - 0.7 * Cc), g = (0.55 + 0.45 * L) * (1 - 0.8 * Cc), b = (0.7 + 0.3 * L) * (1 - 0.35 * Cc);
        pr.im.setTint(Phaser.Display.Color.GetColor(r * 255, g * 255, b * 255));
      }
    }
    // enemies
    let ne = 0, ns = 0;
    for (const e of sim.enemies) {
      if (e.dead || ne >= 560) continue;
      const im = enemyPool[ne++];
      const ex = e.x * S, ez = e.y * S, sx = SX(ex), sy = SY(ez);
      if (sx < -150 || sx > W + 150 || sy < -200 || sy > H + 200) { im.setVisible(false); continue; }
      const f = Math.floor((t * 7 + e.id * 0.37) % 6);
      im.setVisible(true).setFrame(`${hmap[e.type]}_${dirOf(p.x - e.x, p.y - e.y)}_${f}`).setPosition(sx, sy).setScale(k * (eh(e.type, e.r) / meta.targetH)).setDepth(sy);
      
      if (ns < 700) { shadows[ns++].setVisible(true).setPosition(sx, sy).setScale((e.r * S * 2.6 * P) / 64, (e.r * S * 2.6 * P * TILT) / 64); }
    }
    for (let i = ne; i < enemyPool.length; i++) enemyPool[i].setVisible(false);
    shadows[ns++]?.setVisible(true).setPosition(hsx, hsy).setScale((3.2 * P) / 64, (3.2 * P * TILT) / 64);
    // summons
    let nw = 0, nr = 0, ng = 0;
    for (const u of sim.units) {
      if (u.dead) continue;
      const sx = SX(u.x * S), sy = SY(u.y * S);
      if (u.kind === 'wolf' && nw < 80) {
        const im = wolfPool[nw++];
        im.setVisible(true).setFrame(`wolf_${u.faceX >= 0 ? 2 : 6}`).setPosition(sx, sy - Math.abs(Math.sin(t * 9 + nw)) * 4).setScale(k).setDepth(sy).setAlpha(0.85);
      } else if (u.kind === 'raven' && nr < 80) {
        const im = ravenPool[nr++];
        im.setVisible(true).setFrame(`raven_${u.faceX >= 0 ? 2 : 6}_${Math.floor(((t * 12 + nr) % 4))}`).setPosition(sx, sy - 1.5 * P * 0.669).setScale(k).setDepth(sy + 500);
      } else if (u.kind === 'orb' && ng < 360) {
        glowPool[ng++].setVisible(true).setTint(0xffd070).setPosition(sx, sy - 1.4 * P * 0.669).setScale(k * 0.7);
      }
      if (ns < 700) shadows[ns++].setVisible(true).setPosition(sx, sy).setScale((2 * P) / 64, (2 * P * TILT) / 64);
    }
    for (let i = nw; i < 80; i++) wolfPool[i].setVisible(false);
    for (let i = nr; i < 80; i++) ravenPool[i].setVisible(false);
    for (const b of sim.projectiles) {
      if (b.dead || ng >= 360) continue;
      glowPool[ng++].setVisible(true).setTint(0x66e0ff).setPosition(SX(b.x * S), SY(b.y * S) - 1.2 * P * 0.669).setScale(k * 0.45);
    }
    for (let i = ng; i < 360; i++) glowPool[i].setVisible(false);
    for (let i = ns; i < 700; i++) shadows[i].setVisible(false);
    let nG = 0;
    for (const g of sim.gems) {
      if (nG >= 700) break;
      const im = gemPool[nG++];
      im.setVisible(true).setPosition(SX(g.x * S), SY(g.y * S) - 0.7 * P * 0.669).setScale(k * 0.55 * (0.9 + 0.1 * Math.sin(t * 5 + g.x)));
    }
    for (let i = nG; i < 700; i++) gemPool[i].setVisible(false);
    vig.setVisible(quality === 'high');
    game.step(performance.now(), dtReal * 1000);
    return { calls: cnt.calls, tris: cnt.tris, sprites: ne + nw + nr + nG + ng + props.length };
  }
  const info = () => ({ sprites: props.length, gpu: (() => { const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })(), canvas: [W, H], P: +P.toFixed(2) });
  return { frame, info, gl, setQuality() {}, resize() {}, game };
}
