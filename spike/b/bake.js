// Spike B bake: renders the same 3D models offscreen (three.js, headless Chrome) into 8-direction sprite atlases.
// Result lands in window.__bake (data URLs + meta); spike/tools/measure.mjs bake <outDir> writes the PNGs.
import * as THREE from 'three';
import { patch, U, gradientMap } from '../a/look.js';
import { loadGlb, loadGltf, ENEMY_TYPES, ghostWolfGeo, ravenGeo, mergeScene } from '../a/scene3d.js';

const CELL = 128, DIRS = 8, FR = 6, FRUST = 3.4, EL = (48 * Math.PI) / 180, TARGET_H = 2.4;

function setup(cell) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(cell, cell, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0x7f8fe0, 0x35294a, 1.9));
  const moon = new THREE.DirectionalLight(0x93a8ff, 1.5); moon.position.set(-30, 50, -20); scene.add(moon);
  const back = new THREE.DirectionalLight(0x58d8ff, 0.7); back.position.set(10, 14, -30); scene.add(back); // cool rim from behind
  const warm = new THREE.PointLight(0xffa24a, 16, 14, 1.6); warm.position.set(2.2, 2.8, 2.4); scene.add(warm);
  const f = FRUST;
  const cam = new THREE.OrthographicCamera(-f / 2, f / 2, f / 2, -f / 2, 0.1, 60);
  cam.position.set(0, 1.2 + Math.sin(EL) * 20, Math.cos(EL) * 20);
  cam.lookAt(0, 1.2, 0);
  cam.updateMatrixWorld(true);
  const o = new THREE.Vector3(0, 0, 0).project(cam);
  return { canvas, renderer, scene, cam, originY: ((1 - o.y) / 2) * cell };
}

// mount: THREE.Object3D (already normalised to feet at y=0, height TARGET_H), draw(t) updates pose
function bakeCells(env, atlasCtx, cell, cols, firstIdx, mount, dirs, frames, poseAt) {
  env.scene.add(mount);
  for (let d = 0; d < dirs; d++) {
    for (let f = 0; f < frames; f++) {
      mount.rotation.y = (d * Math.PI * 2) / DIRS;
      poseAt(f);
      env.renderer.render(env.scene, env.cam);
      const idx = firstIdx + d * frames + f;
      atlasCtx.drawImage(env.canvas, (idx % cols) * cell, Math.floor(idx / cols) * cell);
    }
  }
  env.scene.remove(mount);
}

function toonize(root, grad, tint, rim) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      const old = o.material;
      o.material = patch(new THREE.MeshToonMaterial({ map: old.map, color: tint ?? old.color, gradientMap: grad }), { rim: rim ?? new THREE.Color(0x66e0ff).multiplyScalar(0.8), rimPow: 2.2 });
    }
  });
}

function normalise(root, h = TARGET_H) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root, true);
  const s = h / (b.max.y - b.min.y);
  const holder = new THREE.Group();
  root.scale.multiplyScalar(s);
  root.position.set(-((b.min.x + b.max.x) / 2) * s, -b.min.y * s, -((b.min.z + b.max.z) / 2) * s);
  holder.add(root);
  return holder;
}

export async function runBake(stage) {
  const grad = gradientMap();
  const env = setup(CELL);
  stage.appendChild(env.canvas);
  const meta = { cell: CELL, dirs: DIRS, frames: FR, frust: FRUST, originY: env.originY, pxPerUnit: CELL / FRUST, targetH: TARGET_H, creatures: [], spirits: {}, props: {} };

  // ---- characters atlas: hero + 4 enemy looks (6 walk frames x 8 dirs)
  const COLS = 16, N = 5 * DIRS * FR;
  const atlas = document.createElement('canvas'); atlas.width = COLS * CELL; atlas.height = Math.ceil(N / COLS) * CELL;
  const ac = atlas.getContext('2d');
  const list = [
    { name: 'hero', glb: 'kaykit-adventurers/Rogue_Hooded.glb', clip: 'Running_A', tint: null, rim: new THREE.Color(0x66e0ff).multiplyScalar(0.8) },
    ...['wolf', 'crow', 'root_crawler', 'elder_treant'].map((k) => ({ name: k, glb: ENEMY_TYPES[k].glb, clip: ENEMY_TYPES[k].clip, tint: new THREE.Color(ENEMY_TYPES[k].tint), rim: new THREE.Color(ENEMY_TYPES[k].rim).multiplyScalar(0.4) })),
  ];
  let first = 0;
  for (const c of list) {
    const g = await loadGlb(c.glb);
    toonize(g.scene, grad, c.tint, c.rim);
    const mount = normalise(g.scene);
    const mixer = new THREE.AnimationMixer(g.scene);
    const clip = g.animations.find((a) => a.name === c.clip);
    mixer.clipAction(clip).play();
    bakeCells(env, ac, CELL, COLS, first, mount, DIRS, FR, (f) => { mixer.setTime((clip.duration * f) / FR); });
    meta.creatures.push({ name: c.name, first });
    first += DIRS * FR;
  }
  meta.chars = { cols: COLS };

  // ---- spirits atlas: ghost wolf (1 frame) + raven (4 flap frames), 8 dirs
  const SC = 8, spirits = document.createElement('canvas'); spirits.width = SC * CELL; spirits.height = 5 * CELL;
  const sc = spirits.getContext('2d');
  const wolf = new THREE.Mesh(ghostWolfGeo(), patch(new THREE.MeshToonMaterial({ color: 0x78ecff, emissive: 0x1696c0, gradientMap: grad, transparent: true, opacity: 0.85 }), { rim: new THREE.Color(0.2, 0.45, 0.5) }));
  const wm = new THREE.Group(); wolf.scale.setScalar(1.5); wm.add(wolf);
  bakeCells(env, sc, CELL, SC, 0, wm, DIRS, 1, () => {});
  const raven = new THREE.Mesh(ravenGeo(), patch(new THREE.MeshToonMaterial({ color: 0x8a6bd8, emissive: 0x2a1070, gradientMap: grad, side: THREE.DoubleSide }), { flap: true, rim: new THREE.Color(0.25, 0.15, 0.5) }));
  const rm = new THREE.Group(); raven.scale.setScalar(1.5); raven.position.y = 0.5; rm.add(raven);
  bakeCells(env, sc, CELL, SC, 8, rm, DIRS, 4, (f) => { U.uTime.value = (f / 4) * (Math.PI * 2 / 12); });
  meta.spirits = { cols: SC, wolf: 0, raven: 8, ravenFrames: 4, ravenLift: 0.5 };

  // ---- props atlas: 2 trees at 256 px, 3 small props at 128 px
  const props = document.createElement('canvas'); props.width = 1024; props.height = 256;
  const pc = props.getContext('2d');
  const penv = setup(256);
  penv.cam.updateProjectionMatrix();
  const defs = [['tree_dead_large', 256, 0, 0], ['tree_pine_orange_large', 256, 256, 0], ['gravestone', 128, 512, 0], ['pumpkin_orange_jackolantern', 128, 640, 0], ['lantern_standing', 128, 768, 0]];
  for (const [name, cell, x, y] of defs) {
    const g = await loadGltf('kaykit-halloween/' + name + '.gltf');
    const { geo, map } = mergeScene(g.scene);
    const mesh = new THREE.Mesh(geo, patch(new THREE.MeshToonMaterial({ map, gradientMap: grad, emissive: name.includes('pumpkin') || name.includes('lantern') ? new THREE.Color(0x7a3a08) : new THREE.Color(0) }), { rim: new THREE.Color(0x3a4a9a), rimPow: 3 }));
    const holder = normalise(mesh, TARGET_H);
    const e = cell === 256 ? penv : env;
    e.scene.add(holder);
    holder.rotation.y = 0.4;
    e.renderer.render(e.scene, e.cam);
    pc.drawImage(e.canvas, x, y);
    e.scene.remove(holder);
    meta.props[name] = { x, y, cell };
    // native height of the unnormalised model, needed to scale to runtime target heights
  }
  window.__bake = {
    meta,
    chars: atlas.toDataURL('image/png'),
    spirits: spirits.toDataURL('image/png'),
    props: props.toDataURL('image/png'),
  };
  window.__spikeReady = true;
}
