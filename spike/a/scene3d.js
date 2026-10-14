// Spike A: real-time 3D (three.js) renderer driven by the real Sim state.
// Enemies = hand-rolled InstancedMesh + baked vertex-animation texture (VAT), one draw call per type.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { patch, U, gradientMap, groundTexture } from './look.js';

export const S = 0.1; // sim px -> world units
const asset = (p) => new URL('../assets/' + p, import.meta.url).href;
const loader = new GLTFLoader();
export const loadGlb = async (p) => loader.parseAsync(await (await fetch(asset(p))).arrayBuffer(), '');
export const loadGltf = (p) => loader.loadAsync(asset(p));

const MAXE = 520;
export const ENEMY_TYPES = {
  wolf: { glb: 'kaykit-skeletons/Skeleton_Minion.glb', clip: 'Walking_D_Skeletons', tint: 0xa9b4d8, rim: 0x5f6cff },
  crow: { glb: 'kaykit-skeletons/Skeleton_Rogue.glb', clip: 'Running_C', tint: 0x7a6aa8, rim: 0xb04bff },
  root_crawler: { glb: 'kaykit-skeletons/Skeleton_Warrior.glb', clip: 'Walking_D_Skeletons', tint: 0x9a7a4a, rim: 0x6fff7a },
  elder_treant: { glb: 'kaykit-skeletons/Skeleton_Warrior.glb', clip: 'Walking_D_Skeletons', tint: 0x4f8a3a, rim: 0x9dff4f },
};

async function bakeVat(gltf, clipName, frames, targetH) {
  const root = gltf.scene;
  const skinned = [];
  root.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  const clip = gltf.animations.find((a) => a.name === clipName);
  const mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(clip).play();
  const counts = skinned.map((m) => m.geometry.attributes.position.count);
  const V = counts.reduce((a, b) => a + b, 0);
  const pos = new Float32Array(frames * V * 4);
  const tmp = new THREE.Vector3();
  for (let f = 0; f < frames; f++) {
    mixer.setTime((clip.duration * f) / frames);
    root.updateMatrixWorld(true);
    let o = f * V * 4;
    for (const m of skinned) {
      m.skeleton.update();
      const n = m.geometry.attributes.position.count;
      for (let i = 0; i < n; i++) {
        m.getVertexPosition(i, tmp);
        tmp.applyMatrix4(m.matrixWorld);
        pos[o++] = tmp.x; pos[o++] = tmp.y; pos[o++] = tmp.z; pos[o++] = 1;
      }
    }
  }
  // normalise: feet on y=0, centred, scaled to targetH (using frame 0 extents)
  let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let i = 0; i < V; i++) {
    const x = pos[i * 4], y = pos[i * 4 + 1], z = pos[i * 4 + 2];
    minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  const sc = targetH / (maxY - minY), cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  for (let i = 0; i < frames * V; i++) {
    pos[i * 4] = (pos[i * 4] - cx) * sc; pos[i * 4 + 1] = (pos[i * 4 + 1] - minY) * sc; pos[i * 4 + 2] = (pos[i * 4 + 2] - cz) * sc;
  }
  // merged index + uv, smooth normals per frame from baked positions
  const idx = [], uv = new Float32Array(V * 2);
  let base = 0;
  for (const m of skinned) {
    const g = m.geometry, n = g.attributes.position.count;
    const ix = g.index;
    for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + base);
    uv.set(g.attributes.uv.array, base * 2);
    base += n;
  }
  const nrm = new Float32Array(frames * V * 4);
  for (let f = 0; f < frames; f++) {
    const ob = f * V * 4;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const ax = pos[ob + a * 4], ay = pos[ob + a * 4 + 1], az = pos[ob + a * 4 + 2];
      const ux = pos[ob + b * 4] - ax, uy = pos[ob + b * 4 + 1] - ay, uz = pos[ob + b * 4 + 2] - az;
      const vx = pos[ob + c * 4] - ax, vy = pos[ob + c * 4 + 1] - ay, vz = pos[ob + c * 4 + 2] - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { nrm[ob + k * 4] += nx; nrm[ob + k * 4 + 1] += ny; nrm[ob + k * 4 + 2] += nz; }
    }
    for (let k = 0; k < V; k++) {
      const x = nrm[ob + k * 4], y = nrm[ob + k * 4 + 1], z = nrm[ob + k * 4 + 2];
      const l = Math.hypot(x, y, z) || 1;
      nrm[ob + k * 4] = x / l; nrm[ob + k * 4 + 1] = y / l; nrm[ob + k * 4 + 2] = z / l; nrm[ob + k * 4 + 3] = 1;
    }
  }
  const W = 2048, H = Math.ceil((frames * V) / W);
  const mk = (arr) => {
    const full = new Float32Array(W * H * 4);
    full.set(arr);
    const t = new THREE.DataTexture(full, W, H, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(V * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(V * 3), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const map = skinned[0].material.map;
  return { geo, map, vat: { pos: mk(pos), nrm: mk(nrm), V, frames, fps: frames / clip.duration }, tris: idx.length / 3, V };
}

function instAttr(geo, name, max) {
  const a = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
  a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute(name, a);
  return a;
}

function prim(geo, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, wing = 0) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const g = geo.clone().applyMatrix4(m);
  g.deleteAttribute('uv');
  const n = g.attributes.position.count;
  const w = new Float32Array(n);
  if (wing) for (let i = 0; i < n; i++) w[i] = Math.abs(g.attributes.position.getX(i)) * wing;
  g.setAttribute('aWing', new THREE.BufferAttribute(w, 1));
  return g.toNonIndexed();
}

export function ghostWolfGeo() {
  const sph = new THREE.SphereGeometry(1, 8, 6), cyl = new THREE.CylinderGeometry(0.09, 0.07, 0.6, 5), cone = new THREE.ConeGeometry(0.1, 0.3, 5);
  const parts = [
    prim(sph, 0, 0.7, 0, 0.5, 0.42, 1.0), prim(sph, 0, 0.95, 0.9, 0.32, 0.3, 0.34), prim(new THREE.BoxGeometry(1, 1, 1), 0, 0.86, 1.22, 0.2, 0.16, 0.36),
    prim(cone, -0.15, 1.25, 0.85, 1, 1, 1), prim(cone, 0.15, 1.25, 0.85, 1, 1, 1),
    prim(cyl, -0.25, 0.3, 0.55), prim(cyl, 0.25, 0.3, 0.55), prim(cyl, -0.25, 0.3, -0.55), prim(cyl, 0.25, 0.3, -0.55),
    prim(cone, 0, 0.95, -1.05, 1.4, 2.4, 1.4, -2.0, 0, 0),
  ];
  return mergeGeometries(parts);
}

export function ravenGeo() {
  const sph = new THREE.SphereGeometry(1, 7, 5), cone = new THREE.ConeGeometry(0.08, 0.3, 4), box = new THREE.BoxGeometry(1, 1, 1);
  const wing = (s) => {
    const g = new THREE.BufferGeometry();
    const v = [s * 0.1, 0, 0.25, s * 0.1, 0, -0.2, s * 0.95, 0, -0.4, s * 0.1, 0, 0.25, s * 0.95, 0, -0.4, s * 0.65, 0, 0.12];
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0]), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(12), 2));
    return g;
  };
  const parts = [
    prim(sph, 0, 0, 0, 0.26, 0.22, 0.45), prim(sph, 0, 0.12, 0.42, 0.15, 0.15, 0.15), prim(cone, 0, 0.1, 0.65, 1, 1, 1, Math.PI / 2, 0, 0),
    prim(box, 0, 0, -0.55, 0.22, 0.04, 0.4),
    prim(wing(-1), 0, 0.02, 0, 1, 1, 1, 0, 0, 0, 1), prim(wing(1), 0, 0.02, 0, 1, 1, 1, 0, 0, 0, 1),
  ];
  return mergeGeometries(parts);
}

export function mergeScene(root) {
  root.updateMatrixWorld(true);
  const gs = [];
  root.traverse((o) => {
    if (o.isMesh) {
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      gs.push(g.index ? g.toNonIndexed() : g);
    }
  });
  const map = (() => { let m = null; root.traverse((o) => { if (o.isMesh && !m) m = o.material.map; }); return m; })();
  return { geo: mergeGeometries(gs), map };
}

// deterministic rng
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

export async function createA({ canvas, drive, life, quality = 'high', width, height, dpr = 1, phone = false, lifeOn = true, onProgress }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
  renderer.info.autoReset = false;
  renderer.setClearColor(0x14122a);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1c1838, 40, 120);
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.5, 400);
  const grad = gradientMap();
  const lifeTex = new THREE.DataTexture(life.data, life.n, life.n, THREE.RGBAFormat, THREE.UnsignedByteType);
  lifeTex.minFilter = lifeTex.magFilter = THREE.LinearFilter;
  lifeTex.needsUpdate = true;
  U.uLife.value = lifeTex;
  U.uWorld.value = drive.sim.balance.worldSize * S;
  U.uLifeOn.value = lifeOn ? 1 : 0;

  // ---- lights: cool moon + hemisphere fill + warm lantern
  scene.add(new THREE.HemisphereLight(0x7f8fe0, 0x35294a, 1.7));
  const moon = new THREE.DirectionalLight(0x93a8ff, 1.4);
  moon.position.set(-30, 50, -20);
  scene.add(moon);
  const lantern = new THREE.PointLight(0xffa24a, 45, 24, 1.7);
  scene.add(lantern);

  // ---- ground
  const gtex = groundTexture();
  const gsize = U.uWorld.value;
  gtex.repeat.set(gsize / 6, gsize / 6);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gsize, gsize).rotateX(-Math.PI / 2), patch(new THREE.MeshToonMaterial({ map: gtex, gradientMap: grad }), { life: true, rim: null }));
  ground.position.set(gsize / 2, 0, gsize / 2);
  scene.add(ground);

  // ---- enemies (VAT instancing)
  const enemyMeshes = {};
  let i0 = 0;
  for (const [id, T] of Object.entries(ENEMY_TYPES)) {
    const d = drive.sim.data.enemies[id];
    const h = d.r * S * 2 * (id === 'elder_treant' ? 1.7 : 2.1);
    const fresh = await loadGlb(T.glb); // own parse per type (bake mutates the pose)
    const b = await bakeVat(fresh, T.clip, 8, h);
    const geo = b.geo;
    const phase = instAttr(geo, 'aPhase', MAXE), flash = instAttr(geo, 'aFlash', MAXE);
    const mat = patch(new THREE.MeshToonMaterial({ map: b.map, gradientMap: grad, color: 0xffffff }), { vat: b.vat, rim: new THREE.Color(T.rim).multiplyScalar(0.4), rimPow: 2.2 });
    const m = new THREE.InstancedMesh(geo, mat, MAXE);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, new THREE.Color(T.tint));
    m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.count = 0;
    scene.add(m);
    enemyMeshes[id] = { m, phase, flash, tint: new THREE.Color(T.tint), tris: b.tris, verts: b.V };
    onProgress?.(++i0 / 6);
  }

  // ---- hero (single skinned mesh + mixer)
  const heroG = await loadGlb('kaykit-adventurers/Rogue_Hooded.glb');
  const hero = heroG.scene;
  const hb = new THREE.Box3().setFromObject(hero);
  const heroSc = (drive.sim.player.r * S * 2 * 2.3) / (hb.max.y - hb.min.y);
  hero.scale.setScalar(heroSc);
  hero.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      const old = o.material;
      o.material = patch(new THREE.MeshToonMaterial({ map: old.map, color: old.color, gradientMap: grad }), { rim: new THREE.Color(0x66e0ff).multiplyScalar(0.8), rimPow: 2.0 });
    }
  });
  scene.add(hero);
  const mixer = new THREE.AnimationMixer(hero);
  const actRun = mixer.clipAction(heroG.animations.find((a) => a.name === 'Running_A'));
  const actIdle = mixer.clipAction(heroG.animations.find((a) => a.name === 'Idle'));
  actRun.play(); actIdle.play(); actIdle.setEffectiveWeight(0);
  const lanternBall = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, 0.4), toneMapped: false }));
  scene.add(lanternBall);

  // ---- props
  const propSpecs = [
    ['tree_dead_large', 9, 0], ['tree_dead_medium', 7, 0], ['tree_dead_small', 4.5, 0], ['tree_pine_orange_large', 9, 0], ['tree_pine_orange_medium', 6.5, 0], ['tree_pine_yellow_small', 4.5, 0],
    ['gravestone', 2.2, 0], ['grave_A', 2, 0], ['skull', 1.1, 0], ['ribcage', 1.4, 0], ['fence_broken', 2.5, 0], ['shrine_candles', 3, 0],
    ['pumpkin_orange_jackolantern', 1.4, 1], ['candle_triple', 1.0, 1], ['lantern_standing', 2.4, 1],
  ];
  const R = rng(12345);
  const cx = drive.cx * S, cz = drive.cy * S;
  const place = {
    tree_dead_large: [0, 60], tree_dead_medium: [0, 70], tree_dead_small: [0, 50], tree_pine_orange_large: [0, 50], tree_pine_orange_medium: [0, 60], tree_pine_yellow_small: [0, 40],
    gravestone: [40, 6], grave_A: [20, 3], skull: [20, 2], ribcage: [10, 2], fence_broken: [30, 4], shrine_candles: [8, 0], pumpkin_orange_jackolantern: [22, 3], candle_triple: [16, 0], lantern_standing: [12, 4],
  };
  let propInst = 0, propTris = 0;
  for (const [name, targetH, glow] of propSpecs) {
    const g = await loadGltf('kaykit-halloween/' + name + '.gltf');
    const { geo, map } = mergeScene(g.scene);
    geo.computeBoundingBox();
    const nat = geo.boundingBox.max.y - geo.boundingBox.min.y;
    const sc0 = targetH / nat;
    const mat = patch(new THREE.MeshToonMaterial({ map, gradientMap: grad, emissive: glow ? new THREE.Color(0x7a3a08) : new THREE.Color(0) }), { life: true, rim: new THREE.Color(0x3a4a9a), rimPow: 3 });
    const [inner, outer] = place[name];
    const n = inner + outer;
    const m = new THREE.InstancedMesh(geo, mat, n);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sv = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      let x, z;
      if (i < inner) { x = cx + (R() - 0.5) * 100; z = cz + (R() - 0.5) * 100; } // sparse play-area dressing
      else { // dense forest ring outside the play area
        const a = R() * 6.283, d = 64 + R() * 30;
        x = cx + Math.cos(a) * d * 1.05; z = cz + Math.sin(a) * d * 1.05;
      }
      const s = sc0 * (0.85 + R() * 0.3);
      q.setFromEuler(new THREE.Euler(0, R() * 6.283, 0));
      p.set(x, 0, z);
      sv.set(s, s, s);
      mtx.compose(p, q, sv);
      m.setMatrixAt(i, mtx);
    }
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    scene.add(m);
    propInst += n; propTris += (geo.attributes.position.count / 3) * n;
  }

  // ---- summons / gems / projectiles / shadows
  const spiritMat = (c, e, op) => new THREE.MeshToonMaterial({ color: c, emissive: e, gradientMap: grad, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  const wolfG = ghostWolfGeo(); instAttr(wolfG, 'aPhase', 80);
  const wolfM = new THREE.InstancedMesh(wolfG, patch(spiritMat(0x78ecff, 0x1696c0, 0.82), { rim: new THREE.Color(0.2, 0.45, 0.5), rimPow: 2.0 }), 80);
  const ravenG = ravenGeo(); const ravenPh = instAttr(ravenG, 'aPhase', 80);
  const ravenM = new THREE.InstancedMesh(ravenG, patch(spiritMat(0x8a6bd8, 0x2a1070, 0.9), { flap: true, rim: new THREE.Color(0.25, 0.15, 0.5), rimPow: 2.0 }), 80);
  const orbM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.1, 0.55), toneMapped: false }), 40);
  const gemM = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.34), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.3, 1.3), toneMapped: false }), 700);
  const projM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.2, 1.5), toneMapped: false }), 300);
  const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const shadowM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), MAXE + 200);
  for (const m of [wolfM, ravenM, orbM, gemM, projM, shadowM]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; scene.add(m); }
  shadowM.renderOrder = 1;

  // ---- post (High only)
  let composer = null, bloom = null;
  const setupPost = () => {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.5, 0.6, 0.9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  };

  const camDist = () => {
    const aspect = width / height;
    const wd = phone || aspect < 1 ? 20 : 34;
    return (wd / 2) / (Math.tan((camera.fov * Math.PI) / 360) * aspect);
  };
  const state = { quality, camDist: camDist() };

  const setQuality = (q) => {
    state.quality = q;
    renderer.setPixelRatio(q === 'high' ? Math.min(dpr, 1.5) : 1);
    renderer.setSize(width, height, false);
    if (q === 'high') { if (!composer) setupPost(); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(width, height); }
  };
  setQuality(quality);

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color();
  const sim = drive.sim;
  let t = 0, lifeFrame = 0, heroYaw = 0, runW = 0;
  const camTarget = new THREE.Vector3();
  const stats = { drawn: {} };

  function frame(dtReal) {
    t += dtReal;
    U.uTime.value = t;
    const p = sim.player;
    const hx = p.x * S, hz = p.y * S;
    // hero
    const sp = Math.hypot(drive.vx, drive.vy);
    if (sp > 3) heroYaw = Math.atan2(drive.vx, drive.vy);
    runW += ((sp > 3 ? 1 : 0) - runW) * Math.min(1, dtReal * 8);
    actRun.setEffectiveWeight(runW); actIdle.setEffectiveWeight(1 - runW);
    mixer.update(dtReal * (0.6 + 0.8 * runW));
    hero.position.set(hx, 0, hz);
    hero.rotation.y = heroYaw;
    lantern.position.set(hx + 0.9, 2.6, hz + 0.4);
    lanternBall.position.set(hx + 0.9, 1.5, hz + 0.45);
    // enemies
    const cnt = {};
    for (const id in enemyMeshes) cnt[id] = 0;
    let shN = 0;
    P.y = 0;
    for (const e of sim.enemies) {
      if (e.dead) continue;
      const em = enemyMeshes[e.type];
      if (!em) continue;
      const i = cnt[e.type]++;
      if (i >= MAXE) continue;
      P.set(e.x * S, 0, e.y * S);
      Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(p.x - e.x, p.y - e.y));
      SC.set(1, 1, 1);
      M.compose(P, Q, SC);
      em.m.setMatrixAt(i, M);
      em.m.setColorAt(i, em.tint);
      em.phase.array[i] = (e.phase % 6.28) * 1.3 + (e.id * 0.37) % 8;
      em.flash.array[i] = e.flash > 0 ? Math.min(1, e.flash * 3) * 0.6 : 0;
      if (shN < MAXE + 190) {
        SC.set(e.r * S * 2.6, 1, e.r * S * 2.6);
        P.y = 0.03; M.compose(P, Q.identity(), SC); shadowM.setMatrixAt(shN++, M); P.y = 0;
      }
    }
    for (const id in enemyMeshes) {
      const em = enemyMeshes[id];
      em.m.count = Math.min(cnt[id], MAXE);
      em.m.instanceMatrix.needsUpdate = true; em.m.instanceColor.needsUpdate = true;
      em.phase.needsUpdate = true; em.flash.needsUpdate = true;
    }
    // hero shadow
    P.set(hx, 0.03, hz); SC.set(3.2, 1, 3.2); M.compose(P, Q.identity(), SC); shadowM.setMatrixAt(shN++, M);
    // summons
    let nw = 0, nr = 0, no = 0;
    for (const u of sim.units) {
      if (u.dead) continue;
      if (u.kind === 'wolf' && nw < 80) {
        const dir = u.faceX >= 0 ? Math.PI / 2 : -Math.PI / 2;
        P.set(u.x * S, 0.05 + Math.abs(Math.sin(t * 9 + nw)) * 0.12, u.y * S);
        Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, dir); SC.setScalar(1.5);
        M.compose(P, Q, SC); wolfM.setMatrixAt(nw++, M);
      } else if (u.kind === 'raven' && nr < 80) {
        P.set(u.x * S, 2.0 + Math.sin(t * 3 + nr) * 0.25, u.y * S);
        Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, u.faceX >= 0 ? Math.PI / 2 : -Math.PI / 2); SC.setScalar(1.5);
        ravenPh.array[nr] = nr * 0.31; M.compose(P, Q, SC); ravenM.setMatrixAt(nr++, M);
      } else if (u.kind === 'orb' && no < 40) {
        P.set(u.x * S, 1.4, u.y * S); Q.identity(); SC.setScalar(1); M.compose(P, Q, SC); orbM.setMatrixAt(no++, M);
      }
      if (shN < MAXE + 190) { P.set(u.x * S, 0.03, u.y * S); SC.set(2, 1, 2); M.compose(P, Q.identity(), SC); shadowM.setMatrixAt(shN++, M); }
    }
    wolfM.count = nw; ravenM.count = nr; orbM.count = no; ravenPh.needsUpdate = true;
    for (const m of [wolfM, ravenM, orbM]) m.instanceMatrix.needsUpdate = true;
    // gems
    let ng = 0;
    for (const g of sim.gems) {
      if (ng >= 700) break;
      P.set(g.x * S, 0.7 + Math.sin(t * 3 + g.x) * 0.12, g.y * S);
      Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t * 2 + g.x); SC.setScalar(1);
      M.compose(P, Q, SC); gemM.setMatrixAt(ng++, M);
    }
    gemM.count = ng; gemM.instanceMatrix.needsUpdate = true;
    // projectiles
    let np = 0;
    for (const b of sim.projectiles) {
      if (b.dead || np >= 300) continue;
      P.set(b.x * S, 1.2, b.y * S);
      Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(b.vx || 0, b.vy || 1)); SC.set(1, 1, 2.2);
      M.compose(P, Q, SC); projM.setMatrixAt(np++, M);
    }
    projM.count = np; projM.instanceMatrix.needsUpdate = true;
    shadowM.count = shN; shadowM.instanceMatrix.needsUpdate = true;
    // life map upload (every 3rd frame)
    if (lifeOn && lifeFrame++ % 3 === 0) { life.pack(); lifeTex.needsUpdate = true; }
    // camera: fixed ~48 deg, follows hero smoothly
    const D = state.camDist, el = (48 * Math.PI) / 180;
    camTarget.set(hx, 0, hz);
    camera.position.set(hx, Math.sin(el) * D, hz + Math.cos(el) * D);
    camera.lookAt(camTarget);
    scene.fog.near = D * 1.05; scene.fog.far = D * 2.7;
    renderer.info.reset();
    if (state.quality === 'high' && composer) composer.render(dtReal); else renderer.render(scene, camera);
    return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
  }

  const info = () => ({
    enemyVerts: Object.fromEntries(Object.entries(enemyMeshes).map(([k, v]) => [k, { tris: v.tris, verts: v.verts }])),
    propInstances: propInst, propTris: Math.round(propTris),
    gpu: (() => { const g = renderer.getContext(); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })(),
  });
  const resize = (w, h, d) => { width = w; height = h; dpr = d; camera.aspect = w / h; camera.updateProjectionMatrix(); state.camDist = camDist(); setQuality(state.quality); };
  return { frame, setQuality, info, resize, renderer, gl: renderer.getContext(), life: lifeTex };
}
