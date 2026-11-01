// node build.mjs [opts|anim|night|extras|world]  -> PNGs in this folder (local Chrome via CDP, Node built-ins only, no deps).
// World pages composite the code-drawn enemies onto REAL build plates (plates/*.jpg from plates.mjs) at true in-game scale.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { openChrome, savePng } from '../wren-sheet/render.mjs';
import { optionsPage, animPage, nightPage, extrasPage, worldPage, DESK_K, PHONE_K, FN, bloom, thorn, chest, TELE } from './sheets.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const what = process.argv[2] || '';
const c = await openChrome();
const out = async (name, html, w, h, dpr = 1, cap = 900) => { const buf = await c.shot(join(here, '_' + name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, cap); };
const OH = (n) => 80 + n * 266;
if (!what || what === 'opts') {
  await out('es1-reworks-options', optionsPage(['wolf', 'crow', 'root'], 'ENEMIES SHEET #4 / 1: THE THREE CHAPTER 1 ENEMIES REWORKED (three looks each)', 'Faceless, cold, eye-points only; L2 tinted outline + H2 soft gradient/rim + chibi round masses. Each card: big day, big night, true size desktop + phone (day top, night bottom), black silhouette (top right).'), 1700, OH(3));
  await out('es2-new-types-options', optionsPage(['spit', 'bulb', 'hart'], 'ENEMIES SHEET #4 / 2: THREE NEW CHAPTER 1 TYPES (ranged, area denial, the third verb)', 'Each new type adds ONE new thing to react to. Slot 3 options are different ROLES (heavy charger / support / spawner): picking it picks the verb.'), 1700, OH(3));
}
if (!what || what === 'anim') await out('es3-animation', animPage(), 1700, 104 + 7 * 150);
if (!what || what === 'night') await out('es4-night-eyes', nightPage(), 1700, 760);
if (!what || what === 'extras') await out('es5-miniboss-chest-bloom', extrasPage(), 1700, 1010);
if (!what || what === 'world') {
  // roster around the hero (world units relative to hero feet). Night: 0:30 dark start; day: 11:30 first grey light.
  const tele = `<path d="M40 -10 L420 -40" stroke="${TELE}" stroke-width="5" stroke-dasharray="14 9" opacity=".9"/>`;
  const ring = `<ellipse cx="0" cy="0" rx="144" ry="58" fill="${TELE}" opacity=".14"/><ellipse cx="0" cy="0" rx="144" ry="58" fill="none" stroke="${TELE}" stroke-width="4"/><ellipse cx="0" cy="0" rx="100" ry="40" fill="none" stroke="${TELE}" stroke-width="3" opacity=".6"/>`;
  const items = [
    ['wolf', -95, -20, { ph: 0.1 }, false, bloom('wolf', 'A', 1, 1)], ['wolf', -120, 10, { ph: 0.45 }, false], ['wolf', -150, -45, { ph: 0.7 }, false], ['wolf', 60, 40, { ph: 0.3, tele: 1 }, true],
    ['crow', 70, -70, { ph: 0.2 }, true], ['crow', -40, -95, { ph: 0.6 }, false], ['crow', 190, -40, { ph: 0.8 }, true],
    ['root', 160, 70, { ph: 0.3 }, true, bloom('root', 'A', 1, 2)], ['root', -200, 70, { ph: 0.7 }, false, bloom('root', 'A', 1, 4)],
    ['spit', 210, -105, { ph: 0, tele: 0.8 }, true, bloom('spit', 'A', 1, 2)], ['bulb', -45, 62, { ph: 0, tele: 0.6 }, false, ring], ['hart', 230, 20, { ph: 0, tele: 1 }, true, tele.replace('M-40 -10 L-420 -60', 'M-40 -10 L-420 -60')],
    ['alpha', -235, -15, { ph: 0.3 }, false, bloom('alpha', 'A', 0.7, 5)],
  ];
  const thornAt = (k, x, y) => `<g transform="translate(${x},${y}) scale(${(k * 1.4).toFixed(3)}) rotate(150)">${thorn()}</g>`;
  const chip = (w, k) => `<g transform="translate(${w / 2},${k > 0.5 ? 108 : 92})"><rect x="-120" y="-15" width="240" height="30" rx="15" fill="#1b1712" stroke="#c9a25a" stroke-opacity=".7"/><text x="0" y="5" text-anchor="middle" font-family="Georgia,serif" font-size="${k > 0.5 ? 14 : 11}" fill="#efe4cc" font-weight="700">The old alpha stirs  0:18</text></g>`;
  const chestAt = (k, x, y) => `<g transform="translate(${x},${y}) scale(${k.toFixed(3)})">${chest('A', 1, 0)}</g>`;
  for (const [name, plate, w, h, k, night, dpr] of [
    ['es6-world-desk-night-wren', 'plates/desk-night-wren.jpg', 1280, 720, DESK_K, true, 1],
    ['es6-world-desk-day-wren', 'plates/desk-day-wren.jpg', 1280, 720, DESK_K, false, 1],
    ['es6-world-desk-night-elias', 'plates/desk-night-elias.jpg', 1280, 720, DESK_K, true, 1],
    ['es6-world-desk-day-elias', 'plates/desk-day-elias.jpg', 1280, 720, DESK_K, false, 1],
    ['es7-world-phone-night-wren', 'plates/phone-night-wren.jpg', 844, 390, PHONE_K, true, 2],
    ['es7-world-phone-day-wren', 'plates/phone-day-wren.jpg', 844, 390, PHONE_K, false, 2],
  ]) {
    const cx = w / 2, cy = h / 2 + 22 * (k / DESK_K);
    const hud = () => thornAt(k, cx + 150 * 4 * k, cy - 85 * 4 * k) + chip(w, k) + chestAt(k, cx + 40 * 4 * k, cy + 95 * 4 * k);
    await out(name, worldPage(plate, w, h, k, night, items, hud), w, h, dpr, 700);
  }
}
c.close(); process.exit(0);
