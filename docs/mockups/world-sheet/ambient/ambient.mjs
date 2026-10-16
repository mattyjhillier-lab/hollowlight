// Ambient-life mock-up primitives (design only, nothing in src/). Overlays for the world-sheet frame engine (../world.mjs).
// Coordinates are world units relative to the hero at 1280x720 (1 unit = 1 px there); X/Y map them to the frame, u scales sizes.
import { glow, rnd, mix } from '../../style-lab/lab.mjs';
import { blade, flower, sparkle } from '../../style-lab/scene.mjs';
import { lifeAt } from '../world.mjs';

const f1 = (n) => (+n).toFixed(1);
export const ALIVE = ['#b8e878', '#7cc25c', '#d6f59a', '#4a9a50'];
const HOLLOW = ['#7d8a9a', '#6a7686'];
const out = (c, k = 0.42) => mix(c, '#24402c', k);

// one shared wind (the whole point: tufts, crowns, motes and petals all read the same function)
export const wind = (x, y, t) => {
  const gust = Math.max(0, Math.sin((x * 0.5 + y * 0.2) * 0.004 - t * 0.9)) ** 6; // a band that travels across the screen
  return Math.max(-1, Math.min(1, Math.sin(t * 0.9 + x * 0.006 + y * 0.003) * 0.5 + Math.sin(t * 2.1 + x * 0.013) * 0.2 + gust * 0.7));
};

// what is on screen (relative to hero), used for the keep-clear rule
export const keepClear = (scene, extra = [], heroR = 78, foeR = 46) => {
  const pts = [[0, 4, heroR], [88, 0, 40]];
  for (const [x, y] of scene.ghost || []) pts.push([x, y, 44]);
  for (const [x, y] of scene.fell || []) pts.push([x, y, foeR]);
  for (const [x, y] of scene.crawlers || []) pts.push([x, y, 40]);
  for (const [x, y] of scene.gems || []) pts.push([x, y, 26]);
  return (x, y) => [...pts, ...extra].every(([px, py, r]) => Math.hypot(px - x, (py - y) * 1.25) > r);
};

// ---- ground tuft (alive = three-tone blades, hollow = still grey) ----
export function tuft(sx, sy, s, lean, alive, seed) {
  const r = rnd(Math.abs(seed) + 1); let o = '';
  const n = alive ? 5 : 4;
  for (let i = 0; i < n; i++) {
    const c = alive ? ALIVE[Math.abs(i + seed) % 4] : HOLLOW[i % 2];
    const h = (9 + r() * 9) * s, lx = lean * (0.5 + r() * 0.5) + (r() - 0.5) * 3 * s;
    o += `<path d="${blade(sx + (i - n / 2) * 2.4 * s, sy, h, lx * (h / 14), 1.5 * s)}" fill="${c}" stroke="${out(c)}" stroke-width=".8" stroke-linejoin="round"/>`;
  }
  return o;
}

export function bloom(sx, sy, s, stage, col, seed = 1) { // stage 0 bud, .5 half, 1 open
  const stem = `<path d="M${f1(sx)} ${f1(sy)} q${(seed % 3) - 1} ${-5 * s} 0 ${-8 * s}" stroke="#4a8a4a" stroke-width="${f1(1.2 * s)}" fill="none" stroke-linecap="round"/>`;
  if (stage < 0.25) return stem + `<ellipse cx="${f1(sx)}" cy="${f1(sy - 9 * s)}" rx="${f1(1.7 * s)}" ry="${f1(2.6 * s)}" fill="${mix(col, '#4a8a4a', 0.45)}" stroke="${out(col, 0.5)}" stroke-width=".7"/>`;
  if (stage < 0.75) return stem + `<g transform="translate(${f1(sx)},${f1(sy - 9 * s)}) scale(${f1(0.62)})">${flower(0, 0, s * 0.9, col)}</g>`;
  return stem + flower(sx, sy - 9 * s, s, col);
}

// ---- motes / fireflies ----
export const pollen = (x, y, u, warm = true, a = 1) => (warm
  ? glow(f1(x), f1(y), 7 * u, 7 * u, '#ffd88a', 0.55 * a) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.1 * u + 0.5)}" fill="#fff3c8" opacity="${a}"/>`
  : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.9 * u + 0.4)}" fill="#cfe6f2" opacity="${(0.42 * a).toFixed(2)}"/>`);
export const firefly = (x, y, u, warm = true) => glow(f1(x), f1(y), 9 * u, 9 * u, warm ? '#ffd88a' : '#bfe0ee', warm ? 0.8 : 0.5) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.5 * u + 0.4)}" fill="${warm ? '#fff3c8' : '#eaf6ff'}"/>`;
export const petal = (x, y, u, ang, col = '#ffd9cf') => `<g opacity=".85"><path d="M${f1(x - Math.cos(ang) * 16 * u)} ${f1(y - Math.sin(ang) * 16 * u)} L${f1(x)} ${f1(y)}" stroke="${col}" stroke-width="${f1(0.8 * u + 0.3)}" stroke-dasharray="1 3" opacity=".5"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(2.8 * u)}" ry="${f1(1.7 * u)}" transform="rotate(${f1(ang * 57)} ${f1(x)} ${f1(y)})" fill="${col}" stroke="${mix(col, '#7a3a3a', 0.45)}" stroke-width=".6"/></g>`;

// ---- critters (ambient only: warm cream/tan, dark round eye, NO glowing eye-points, never cold) ----
const OL = '#3a2a20';
export function sparrow(x, y, u, pose = 'perch', dir = 1) {
  const k = u * 1.15, body = '#c9a679', belly = '#f1e3c4';
  if (pose === 'fly') return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(dir * k)},${f1(k)})"><path d="M-3 -2 Q-9 -9 -13 -4 Q-8 -3 -4 0Z" fill="${body}" stroke="${mix(body, OL, .5)}" stroke-width=".7"/><ellipse cx="0" cy="0" rx="6" ry="3.6" fill="${body}" stroke="${mix(body, OL, .5)}" stroke-width=".8"/><ellipse cx="1" cy="1.2" rx="3.6" ry="2" fill="${belly}"/><circle cx="4.2" cy="-1" r="2.6" fill="${body}" stroke="${mix(body, OL, .5)}" stroke-width=".7"/><circle cx="5.1" cy="-1.4" r=".8" fill="#2a1c14"/><path d="M6.4 -.8 l2.2 .5 l-2.2 .7Z" fill="#e8a24a"/><path d="M-5 1 l-6 2 l5 .6Z" fill="${mix(body, OL, .3)}"/></g>`;
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(dir * k)},${f1(k)})"><path d="M-5 0 l-7 2.5 l6 .8Z" fill="${mix(body, OL, .3)}" stroke="${mix(body, OL, .5)}" stroke-width=".6"/><ellipse cx="0" cy="-3" rx="6.4" ry="5" fill="${body}" stroke="${mix(body, OL, .5)}" stroke-width=".8"/><ellipse cx="1.4" cy="-1.6" rx="4" ry="3" fill="${belly}"/><circle cx="4" cy="-7" r="3.2" fill="${body}" stroke="${mix(body, OL, .5)}" stroke-width=".8"/><circle cx="5" cy="-7.4" r="1" fill="#2a1c14"/><circle cx="5.3" cy="-7.7" r=".35" fill="#fff"/><path d="M6.9 -6.8 l2.3 .5 l-2.3 .8Z" fill="#e8a24a"/><path d="M-1 2 v2.4 M2 2 v2.4" stroke="#8a5a30" stroke-width=".8" stroke-linecap="round"/></g>`;
}
export function hare(x, y, u, hop = 0, dir = 1) {
  const k = u * 1.2, c = '#d9cdb4';
  return `<g transform="translate(${f1(x)},${f1(y - hop * 5 * u)}) scale(${f1(dir * k)},${f1(k)})"><ellipse cx="0" cy="-1" rx="10" ry="3" fill="#000" opacity=".0"/><ellipse cx="-1" cy="-5" rx="8.6" ry="6" fill="${c}" stroke="${mix(c, OL, .45)}" stroke-width=".9"/><circle cx="-9" cy="-5.5" r="2.4" fill="#fffaf0" stroke="${mix(c, OL, .3)}" stroke-width=".6"/><ellipse cx="7" cy="-8.6" rx="4.6" ry="4" fill="${c}" stroke="${mix(c, OL, .45)}" stroke-width=".9"/><path d="M5.2 -12 q-1.2 -9 1 -10.4 q2.2 1.2 1.2 10.4Z M8.6 -11.6 q1.6 -8.6 4 -8.4 q1.2 2.2 -1.6 8.6Z" fill="${c}" stroke="${mix(c, OL, .45)}" stroke-width=".8"/><path d="M6.4 -12 q.4 -6 .8 -7 M10.4 -12 q1 -5 1.8 -6" stroke="#e9b8a8" stroke-width="1.1" stroke-linecap="round" fill="none"/><circle cx="9.6" cy="-9.4" r="1.05" fill="#2a1c14"/><circle cx="9.9" cy="-9.7" r=".38" fill="#fff"/><circle cx="11.7" cy="-7.6" r=".8" fill="#e9a89a"/></g>`;
}
export function moth(x, y, u, flap = 1) {
  const w = 3.4 * u * (0.55 + 0.45 * flap);
  return glow(f1(x), f1(y), 8 * u, 8 * u, '#ffe3a6', 0.45) + `<g transform="translate(${f1(x)},${f1(y)})"><ellipse cx="${f1(-w)}" cy="${f1(-.6 * u)}" rx="${f1(w)}" ry="${f1(2.1 * u)}" fill="#fff0c8" stroke="${mix('#fff0c8', OL, .45)}" stroke-width=".5"/><ellipse cx="${f1(w)}" cy="${f1(-.6 * u)}" rx="${f1(w)}" ry="${f1(2.1 * u)}" fill="#fff0c8" stroke="${mix('#fff0c8', OL, .45)}" stroke-width=".5"/><ellipse cx="0" cy="0" rx="${f1(.7 * u + .2)}" ry="${f1(2 * u)}" fill="#a98b66"/></g>`;
}
export function butterfly(x, y, u, col = '#ffb15a') {
  const w = 4.2 * u;
  return `<g transform="translate(${f1(x)},${f1(y)})"><ellipse cx="${f1(-w * .8)}" cy="${f1(-1.4 * u)}" rx="${f1(w)}" ry="${f1(2.8 * u)}" fill="${col}" stroke="${mix(col, OL, .5)}" stroke-width=".6" transform="rotate(-18 ${f1(-w * .8)} 0)"/><ellipse cx="${f1(w * .8)}" cy="${f1(-1.4 * u)}" rx="${f1(w)}" ry="${f1(2.8 * u)}" fill="${col}" stroke="${mix(col, OL, .5)}" stroke-width=".6" transform="rotate(18 ${f1(w * .8)} 0)"/><circle cx="${f1(-w * .8)}" cy="${f1(-1.6 * u)}" r="${f1(.9 * u)}" fill="#fff3c8"/><circle cx="${f1(w * .8)}" cy="${f1(-1.6 * u)}" r="${f1(.9 * u)}" fill="#fff3c8"/><rect x="${f1(-.5 * u)}" y="${f1(-3 * u)}" width="${f1(1 * u)}" height="${f1(5 * u)}" rx=".5" fill="#6a4a30"/></g>`;
}
export const birdV = (x, y, u, s = 1) => { const d = 'M-9 -2 Q-4.5 -7 0 0 Q4.5 -7 9 -2'; return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(u * s)})"><path d="${d}" stroke="#6a5030" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/><path d="${d}" stroke="#fff3d6" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`; };

// ---- the shared overlay builder: which layers are on decides the frame ----
// opts: {tufts, bloomRing, reactive, motes, flies, critters, petals, dawnChorus, label}
export function builder(cfgScene, life, opts, t = 3.2) {
  const clear = keepClear(cfgScene, [], opts.reactive ? 40 : 78, opts.reactive ? 34 : 46);
  const aliveAt = (x, y) => (life.all ? 1 : Math.max(0, lifeAt(life, x, y)));
  const ground = (X, Y, u) => {
    let o = '';
    const r = rnd(opts.seed || 5);
    // ground tufts: alive = swaying (amount follows the wind AND the life value), hollow = a few still grey tufts
    if (opts.tufts) {
      let n = 0;
      for (let i = 0; i < 1400 && n < (opts.nTufts || 80); i++) {
        const x = (r() - 0.5) * 1500, y = (r() - 0.5) * 840;
        if (!clear(x, y)) continue;
        const lv = aliveAt(x, y);
        if (lv < 0.5) continue;
        const sc = 0.8 + r() * 0.5, w = wind(x, y, t) * lv;
        let lean = w * 6 * sc;
        if (opts.reactive) lean += pushLean(x, y, cfgScene, sc);
        o += tuft(X(x), Y(y), sc * u, lean * u, true, (i * 7) | 0);
        n++;
      }
      for (let i = 0, m = 0; i < 400 && m < 12; i++) { // the Hollow stays still
        const x = (r() - 0.5) * 1500, y = (r() - 0.5) * 840;
        if (!clear(x, y) || aliveAt(x, y) > 0.1 || x > -140) continue;
        o += tuft(X(x), Y(y), (0.8 + r() * 0.3) * u, 0, false, i + 3); m++;
      }
    }
    if (opts.flowers) {
      const cols = ['#ff9eb5', '#ffe08a', '#c8b4ff', '#ffffff'];
      for (let i = 0, n = 0; i < 1600 && n < (opts.nFlowers || 38); i++) {
        const cx = Math.floor(i / 12), x = ((cx * 97.3) % 1400) - 700 + (r() - 0.5) * 70, y = ((cx * 61.7) % 760) - 380 + (r() - 0.5) * 50;
        if (!clear(x, y) || Math.hypot(x, y) < 95) continue;
        const lv = aliveAt(x, y);
        if (lv < 0.5) continue;
        // restore-bloom: flowers nearest the restore edge are still opening (stage by life value)
        const stage = opts.bloomEdge ? Math.min(1, Math.max(0, (lv - 0.5) / 0.35)) : 1;
        o += bloom(X(x), Y(y), (0.85 + r() * 0.3) * u, stage, cols[(cx + i) % 4], i);
        n++;
      }
    }
    return o;
  };
  const top = (X, Y, u) => {
    let o = '';
    const r = rnd((opts.seed || 5) + 40);
    if (opts.motes) {
      for (let i = 0; i < (opts.nMotes || 26); i++) {
        const x = (r() - 0.5) * 1300 + wind(0, 0, t) * 12, y = (r() - 0.5) * 760;
        if (!clear(x, y) && Math.hypot(x, y) < 60) continue;
        const al = aliveAt(x, y) > 0.35;
        o += pollen(X(x), Y(y), u, al, al ? 0.8 : 1);
      }
    }
    if (opts.flies) {
      for (let i = 0; i < (opts.nFlies || 12); i++) {
        const x = (r() - 0.5) * 1100, y = (r() - 0.5) * 640 - 40;
        if (Math.hypot(x, y) < 70) continue;
        o += firefly(X(x), Y(y), u, aliveAt(x, y) > 0.3);
      }
    }
    if (opts.petals) { for (const [x, y, a] of [[-40, -190, 0.5], [160, -150, 0.3], [330, -30, 0.45], [250, 190, 0.6], [-120, 190, 0.35]]) o += petal(X(x), Y(y), u, a); }
    if (opts.critters) {
      o += `<g style="filter:brightness(.88)">${sparrow(X(210), Y(-118) - 30 * u, u, 'perch', -1)}${hare(X(330), Y(25), u, 1, -1)}${sparrow(X(470), Y(-70) - 70 * u, u, 'fly', 1)}</g>`;
      o += moth(X(452), Y(-112), u, 1) + moth(X(488), Y(-92), u, 0.4);
    }
    if (opts.dawnChorus) {
      for (const [x, y, s] of [[-300, -150, 1.5], [-240, -185, 1.3], [-180, -140, 1.6], [-120, -175, 1.2], [-60, -215, 1.4], [0, -160, 1.1], [60, -195, 1.3], [130, -145, 1.0]]) o += birdV(X(x), Y(y), u, s);
      o += butterfly(X(260), Y(40), u) + butterfly(X(-210), Y(110), u, '#7fd6c8') + butterfly(X(380), Y(-100), u, '#ffcf6a');
      for (let i = 0; i < 20; i++) { const x = (r() - 0.5) * 1200, y = (r() - 0.5) * 640; o += pollen(X(x), Y(y), u, true, 0.9); }
    }
    return o;
  };
  return { ground, top };
}

// foliage parts as the hero, spirits and enemies pass: lean away from every pusher inside 74 units
export function pushLean(x, y, scene, sc = 1) {
  const pushers = [[0, 4, 1], ...(scene.ghost || []).map(([a, b]) => [a, b, 0.8]), ...(scene.fell || []).map(([a, b]) => [a, b, 0.5])];
  let l = 0;
  for (const [px, py, k] of pushers) {
    const d = Math.hypot(x - px, (y - py) * 1.2);
    if (d < 74) l += Math.sign(x - px || 1) * k * (1 - d / 74) * 12 * sc;
  }
  return Math.max(-13, Math.min(13, l));
}
