// States board per direction: low-HP frost, HP widget at 100/50/18%, ability cooldown/ready/used, level-up burst, pickup feedback, boss intro + bar.
import { page, banner, DIRS, crop, stFor, T, FONT, K } from './compose.mjs';
import { ability, bossBar } from './kit.mjs';
import { HERO } from './scenes.mjs';

export const lab = (s, x, y, o = {}) => T(s, x, y, { s: o.s || 11.5, c: o.c || '#d8cfc0', w: o.w || 600, a: o.a, st: '#0b0907', sw: 3 });
export const box = (x, y, w, h, title, cap) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#15110e" stroke="#4a3d2c"/>${T(title, x + 10, y + 19, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a', ls: 0.8 })}${cap ? T(cap, x + 10, y + h - 9, { s: 10.8, c: '#bfb4a2', w: 500 }) : ''}`;
const HPCROP = (key) => (key === 'B' ? [HERO.desk[0] - 100, HERO.desk[1] - 16, 200, 66] : [0, 0, 290, 92]);
const KNOT = { A: [270, 51], B: [28, 30], C: [244, 44] };

export function statesPage(key, sc) {
  const D = DIRS[key], X = [12, 432, 852], Y = [76, 380], TW = 416, TH = 296;
  let b = '';
  const base = (o = {}) => stFor(key, o);
  // 1 low HP frost edge
  b += box(X[0], Y[0], TW, TH, 'LOW HP: FROST AT THE EDGES', 'HP 18%: frost on the outer 8% only; the centre stays clear.');
  b += crop(key, 'desk', base({ hp: 0.18, frost: 1 }), [0, 0, 1280, 720], X[0] + 16, Y[0] + 28, 0.3, {});
  b += lab('frost = shape + texture cue (not hue only); flame shrinks to an ember', X[0] + 14, Y[0] + 28 + 216 + 18, { s: 11 });
    // 2 HP widget 100/50/18
  b += box(X[1], Y[0], TW, TH, key === 'B' ? 'HP RING: 100% / 50% / 18%' : 'HP WIDGET: 100% / 50% / 18%', 'flame height IS the HP; under 35% it turns ember and flickers.');
  const rc = HPCROP(key), horiz = false, sc2 = key === 'B' ? 1.15 : 0.8;
  [[1, 0], [0.5, 0], [0.18, 1]].forEach(([hp, fr], i) => {
    const px = horiz ? X[1] + 10 + i * ((rc[2] * sc2) + 8) : X[1] + 14, py = horiz ? Y[0] + 44 : Y[0] + 28 + i * (rc[3] * sc2 + 6);
    b += crop(key, 'desk', base({ hp, frost: 0, noFade: true }), rc, px, py, sc2, { noItems: true });
    b += lab(Math.round(hp * 100) + '%', horiz ? px + 6 : px + rc[2] * sc2 + 8, horiz ? py + 14 : py + 20, { s: 13, c: '#ffd98a', w: 800 });
  });
  // 3 ability states
  b += box(X[2], Y[0], TW, TH, 'ABILITY: COOLING / READY / USED', 'ready = soft pulse + glow, never a flash; the ring refills as it cools.');
  const abs = [[{ ready: false, frac: 0.72, sec: 17 }, 'cooling 17s'], [{ ready: true, frac: 1 }, 'READY'], [{ ready: false, frac: 0.02, sec: 60 }, 'just used']];
  b += `<rect x="${X[2] + 8}" y="${Y[0] + 28}" width="${TW - 16}" height="${TH - 60}" rx="8" fill="#46526a"/>`;
  abs.forEach(([st, t], i) => {
    const cx = X[2] + 8 + 66 + i * 132, cy = Y[0] + 28 + 90;
    b += `<g transform="translate(${cx},${cy}) scale(1.3)">${ability(0, 0, 42, st, {})}${i === 2 ? '<circle r="50" fill="none" stroke="#ffd7a0" stroke-opacity=".55" stroke-width="2"/><circle r="58" fill="none" stroke="#ffd7a0" stroke-opacity=".28" stroke-width="2"/>' : ''}</g>`;
    b += lab(t, cx, cy + 84, { a: 'middle', s: 12, c: i === 1 ? '#ffd98a' : '#e8dfcf', w: 800 });
  });
  b += lab('desktop adds a [SPACE] key chip; touch hides it (88px target)', X[2] + 16, Y[0] + 28 + 206, { s: 11 });
  // 4 level-up burst
  b += box(X[0], Y[1], TW, TH, 'LEVEL-UP BURST', 'no text banner: the card screen is the banner. Under 350ms.');
  const kn = KNOT[key], r4 = key === 'B' ? [0, 0, 410, 68] : [0, 16, 410, 68], ky = 0;
  [[{ xp: 0.97 }, 't=0  gem lands, thread pulses', null], [{ xp: 1, lv: 7, flare: true }, 't=0.15s  knot ties and flares', true], [{ xp: 0.03, lv: 8, flare: true }, 't=0.25s  warm bloom, then cards deal in', 'fade']].forEach(([st, t, bl], i) => {
    const py = Y[1] + 28 + i * 80, kx = kn[0], kyy = kn[1];
    const bloom = bl === true ? `<circle cx="${kx}" cy="${kyy}" r="86" fill="url(#hGlowF)" opacity=".95"/><circle cx="${kx}" cy="${kyy}" r="38" fill="none" stroke="#fff3dc" stroke-width="3" opacity=".8"/>` + Array.from({ length: 10 }, (_, q) => `<path d="M${kx} ${kyy - 30} L${kx} ${kyy - 46}" stroke="#fff3dc" stroke-width="2.4" stroke-linecap="round" transform="rotate(${q * 36} ${kx} ${kyy})"/>`).join('') : bl === 'fade' ? `<circle cx="${kx}" cy="${kyy}" r="110" fill="url(#hGlowF)" opacity=".5"/><circle cx="${kx}" cy="${kyy}" r="62" fill="none" stroke="#fff3dc" stroke-width="2" opacity=".35"/>` : '';
    b += crop(key, 'desk', base({ ...st, noFade: true }), r4, X[0] + 3, py, 1, { noItems: true, extra: bloom });
    b += lab(t, X[0] + 12, py + 78, { s: 11 });
  });
  void ky;
  // 5 pickup feedback
  b += box(X[1], Y[1], TW, TH, 'PICKUP FEEDBACK', 'one short trail per gem; thread pulses at most once per 150ms.');
  b += crop(key, 'desk', base({}), [470, 290, 420, 244], X[1] + 4, Y[1] + 28, 0.98, {});
  b += lab('gem: thread trail', X[1] + 262, Y[1] + 28 + 96, { s: 10.8, c: '#ffe0a0' }) + lab('heart +30: rose lane', X[1] + 66, Y[1] + 28 + 226, { s: 10.8, c: '#ffb8c6' }) + lab('magnet: lilac ripple', X[1] + 280, Y[1] + 28 + 226, { s: 10.8, c: '#cbb8ff' });
  // 6 boss intro + bar
  b += box(X[2], Y[1], TW, TH, 'BOSS: INTRO + BAR', 'bar under the timer; 3 phase notches; red = danger, allowed here.');
  const bc = [330, 0, 620, 130], bs = 0.66;
  const intro = `<rect x="330" y="0" width="620" height="150" fill="#07060a" opacity=".86"/>${T('THE ELDER TREANT', 640, 58, { s: 50, f: FONT.title, w: 800, c: K.cream, a: 'middle', st: K.ink, sw: 8, ls: 3 })}${T('Guardian of the Cursed Forest', 640, 90, { s: 20, f: FONT.title, i: 1, c: K.creamD, a: 'middle', st: K.ink, sw: 4 })}${bossBar(640, 108, 470, 0.8, { noName: true, h: 14 })}`;
  b += crop(key, 'desk', base({}), bc, X[2] + 4, Y[1] + 28, bs, { noItems: true, extra: intro });
  b += lab('1  intro: title, bar fills over 1.5s (play keeps running)', X[2] + 12, Y[1] + 28 + 86 + 14, { s: 11 });
  b += crop(key, 'desk', base({ boss: { frac: 0.55 } }), bc, X[2] + 4, Y[1] + 28 + 120, bs, { noItems: true });
  b += lab('2  in the fight: 55%, phase 2 of 3 at the notch', X[2] + 12, Y[1] + 28 + 120 + 86 + 14, { s: 11 });
  return { html: page(`${b}${banner(D, 'STATES: ' + D.META.tag)}`), w: 1280, h: 720 };
}
