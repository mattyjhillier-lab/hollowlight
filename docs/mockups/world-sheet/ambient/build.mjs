// node build.mjs [frames|pages]  -> PNGs in this folder. Own headless Chrome via CDP (spawns and closes only its own process). Mock-ups only.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../../wren-sheet/render.mjs';
import { svgPage } from '../../wren-sheet/common.mjs';
import { img, crop } from '../../wren-alternatives/actual.mjs';
import { begin, use, T, FONT, glow, mix, wolf, crawler, gem, raven } from '../../style-lab/lab.mjs';
import { STYLES } from '../../style-lab/scene.mjs';
import { worldFrame, lifeAt } from '../world.mjs';
import { cfgFor, HERO_DESK, HERO_PHONE, BATTLE } from '../scenes.mjs';
import { builder, wind, tuft, bloom, sparrow, hare, moth, butterfly, birdV, pollen, firefly, petal, keepClear, pushLean, ALIVE } from './ambient.mjs';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url)), tmp = process.env.WS_TMP || tmpdir();
const what = process.argv[2] || '';
const c = await openChrome();

// ---------------- frames ----------------
const FR = {};
if (what === 'pages') { const j = JSON.parse(readFileSync(join(tmp, 'am-frames.json'), 'utf8')); for (const [k, v] of Object.entries(j)) FR[k] = { buf: Buffer.from(v, 'base64'), src: img(Buffer.from(v, 'base64')), cfg: null }; }
const OPT = {
  base: null, // "today": W0 look = existing fog + 22 fireflies, nothing else
  sway: { tufts: true, nTufts: 90 },
  motes: { motes: true, flies: true, nMotes: 30, nFlies: 12 },
  critters: { critters: true },
  reactive: { tufts: true, reactive: true, nTufts: 120, seed: 9 },
  bloom: { flowers: true, bloomEdge: true, nFlowers: 44 },
  rec: { tufts: true, nTufts: 70, flowers: true, bloomEdge: true, nFlowers: 34, motes: true, flies: true, nMotes: 18, nFlies: 10, critters: true, petals: true, reactive: true },
};
async function render(name, mom, dev, optKey, t = 3.2, extra = {}) {
  const phone = dev === 'phone', native = dev === 'native';
  const w = phone ? 390 : native ? 640 : 1280, h = phone ? 844 : native ? 360 : 720, u = phone ? 2 / 3 : native ? 0.5 : 1;
  const hero = phone ? HERO_PHONE : native ? [320, 198] : HERO_DESK;
  const o = OPT[optKey];
  const over = { hero, fx: o ? { fogA: mom === 'dawn' ? 0.08 : 0.16, nFly: 0, flies: false } : undefined, ...extra };
  if (!o) delete over.fx;
  const cfg = cfgFor('A', mom, phone ? 'phone' : 'desk', over);
  if (o) {
    const b = builder(cfg.scene, cfg.life, { ...o, dawnChorus: extra.dawnChorus }, t);
    cfg.ambGround = (X, Y) => b.ground(X, Y, u);
    cfg.debugLife = (X, Y) => b.top(X, Y, u);
  }
  const body = worldFrame(w, h, u, cfg);
  const dpr = phone ? 2 : 1;
  const buf = await c.shot(join(tmp, `am-${name}.html`), svgPage(w, h, body), w, h, dpr);
  const r = { buf, src: img(buf), w: w * dpr, h: h * dpr, cfg };
  FR[name] = r;
  return r;
}

if (!what || what === 'frames') {
  for (const k of Object.keys(OPT)) await render(k, 'night', 'desk', k);
  await render('dawn', 'dawn', 'desk', 'rec', 3.2, { dawnChorus: true });
  await render('rec-phone', 'night', 'phone', 'rec');
  await render('rec-native', 'night', 'native', 'rec');
  await render('base-native', 'night', 'native', 'base');
  savePng(join(here, 'frame-recommended-1280x720.png'), FR.rec.buf, 700);
  savePng(join(here, 'frame-recommended-640x360-native.png'), FR['rec-native'].buf, 400);
  savePng(join(here, 'frame-recommended-phone-390x844@2x.png'), FR['rec-phone'].buf, 600);
  savePng(join(here, 'frame-dawn-chorus-1280x720.png'), FR.dawn.buf, 700);
  writeFileSync(join(tmp, 'am-frames.json'), JSON.stringify(Object.fromEntries(Object.entries(FR).map(([k, v]) => [k, v.buf.toString('base64')]))));
}
await import('./pages.mjs').then((m) => m.run({ c, tmp, here, FR, what, img, savePng }));
c.close(); process.exit(0);
