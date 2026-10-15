// Phone board: landscape 844x390 + portrait 390x844 (both @2x scenes) with joystick zone, thumb reach, safe area, tap targets and measured checks.
import { page, banner, frame, DIRS, DIM, note, T, stFor } from './compose.mjs';
import { MEAS } from './measure.mjs';

export const SIM = { land: { l: 47, r: 47, t: 0, b: 21 }, port: { l: 0, r: 0, t: 47, b: 34 } };
export const JOY = { land: (W, H) => ({ x: 0, y: H * 0.3, w: W * 0.55, h: H * 0.7 }), port: (W, H) => ({ x: 0, y: H * 0.5, w: W * 0.6, h: H * 0.5 }) };
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// thumb-map overlay in the frame's own coordinates
export function touchOv(mode, zones, o = {}) {
  const [W, H] = DIM[mode], sim = SIM[mode], j = JOY[mode](W, H), cen = { x: W / 4, y: H / 4, w: W / 2, h: H / 2 };
  let s = `<defs><pattern id="hatch${mode}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="8" fill="#ff9a5a" opacity=".5"/></pattern></defs>`;
  s += `<rect x="${j.x}" y="${j.y}" width="${j.w}" height="${j.h}" fill="#5aa0ff" opacity=".13"/><rect x="${j.x + 1}" y="${j.y + 1}" width="${j.w - 2}" height="${j.h - 2}" fill="none" stroke="#8ac0ff" stroke-width="1.6" stroke-dasharray="6 4"/>`;
  const gx = mode === 'land' ? 150 : 112, gy = mode === 'land' ? 292 : 718;
  s += `<circle cx="${gx}" cy="${gy}" r="46" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.4"/><circle cx="${gx + 18}" cy="${gy - 12}" r="19" fill="#fff" opacity=".45"/>`;
  s += `<text x="${j.x + 8}" y="${j.y + 16}" font-family="Segoe UI,Arial" font-size="12" font-weight="800" fill="#bfdcff">JOYSTICK ZONE (floating)</text>`;
  const ab = zones.find((z) => z.n === 'ability'), acx = ab.x + ab.w / 2, acy = ab.y + 44;
  s += `<circle cx="${acx}" cy="${acy}" r="120" fill="#7fd68a" opacity=".12"/><circle cx="${acx}" cy="${acy}" r="120" fill="none" stroke="#7fd68a" stroke-width="1.6" stroke-dasharray="6 4"/>`;
  s += `<rect x="${cen.x}" y="${cen.y}" width="${cen.w}" height="${cen.h}" fill="none" stroke="#fff3dc" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="3 5"/><text x="${cen.x + 6}" y="${cen.y + 14}" font-family="Segoe UI,Arial" font-size="11" font-weight="800" fill="#fff3dc" opacity=".8">ACTION CENTRE: HUD-free</text>`;
  const corner = 0.14; s += `<rect x="0" y="${sim.t}" width="${W * corner}" height="${H * 0.1}" fill="url(#hatch${mode})"/><rect x="${W * (1 - corner)}" y="${sim.t}" width="${W * corner}" height="${H * 0.1}" fill="url(#hatch${mode})"/>`;
  s += `<rect x="${sim.l}" y="${sim.t}" width="${W - sim.l - sim.r}" height="${H - sim.t - sim.b}" fill="none" stroke="#ff6a6a" stroke-width="1.6" stroke-dasharray="2 4"/>`;
  if (mode === 'land') s += `<rect x="-14" y="${H * 0.34}" width="40" height="${H * 0.32}" rx="16" fill="#000" stroke="#444"/><rect x="${W / 2 - 60}" y="${H - 9}" width="120" height="5" rx="2.5" fill="#ddd" opacity=".6"/>`;
  else s += `<rect x="${W / 2 - 62}" y="10" width="124" height="34" rx="17" fill="#000" stroke="#444"/><rect x="${W / 2 - 66}" y="${H - 10}" width="132" height="5" rx="2.5" fill="#ddd" opacity=".6"/>`;
  for (const z of zones) {
    if (z.tap) s += `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="8" fill="none" stroke="#b8ff7a" stroke-width="2"/>`;
    else if (!o.noRO) s += `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="6" fill="none" stroke="#fff3dc" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  }
  return s;
}
export function checks(mode, zones) {
  const [W, H] = DIM[mode], j = JOY[mode](W, H), cen = { x: W / 4, y: H / 4, w: W / 2, h: H / 2 };
  const ro = zones.filter((z) => !z.tap), bad = ro.filter((z) => hit(z, j)).map((z) => z.n), inC = ro.filter((z) => hit(z, cen)).map((z) => z.n);
  const tapMin = Math.min(...zones.filter((z) => z.tap).map((z) => Math.min(z.w, z.h)));
  return { bad, inC, tapMin };
}

export function touchPage(key, sc) {
  const D = DIRS[key], st = stFor(key);
  const L = frame('land', key, st, sc, { x: 352, y: 88, s: 0.9 }), Pt = frame('port', key, st, sc, { x: 26, y: 90, s: 0.73 });
  const ovL = `<svg x="352" y="88" width="${844 * 0.9}" height="${390 * 0.9}" viewBox="0 0 844 390">${touchOv('land', L.zones)}</svg>`;
  const ovP = `<svg x="26" y="90" width="${390 * 0.73}" height="${844 * 0.73}" viewBox="0 0 390 844">${touchOv('port', Pt.zones)}</svg>`;
  const cL = checks('land', L.zones), cP = checks('port', Pt.zones), M = MEAS.v && MEAS.v[key];
  const cap = (x, y, t) => T(t, x, y, { s: 12, c: '#ffd98a', w: 800 });
  let b = cap(26, 82, 'PHONE PORTRAIT 390x844 @2x (shown 73%)') + cap(352, 82, 'PHONE LANDSCAPE 844x390 @2x (shown 90%), notch + home bar simulated');
  const y0 = 452, bw = 300;
  b += note(352, y0, bw, 252, 'THUMB MAP LEGEND', ['blue = floating joystick zone', 'green = ability thumb reach (120px)', 'lime box = tap target (>= 44px)', 'cream dash = read-only, not tappable', 'orange hatch = hard-reach top corners', 'red dots = safe area (notch / home bar)', 'dashed centre = action area, no HUD', 'white ring = joystick thumb base']);
  const lines = [`read-only under joystick: land ${cL.bad.join(',') || 'none'} / port ${cP.bad.join(',') || 'none'}`, `read-only in centre 50%: land ${cL.inC.join(',') || 'none'} / port ${cP.inC.join(',') || 'none'}`, `smallest tap target: ${Math.round(Math.min(cL.tapMin, cP.tapMin))}px (pause 48, ability 88)`];
  if (M) lines.push(`HUD footprint: land ${M.land.fp.toFixed(1)}%, port ${M.port.fp.toFixed(1)}%`, `smallest numeral ${Math.min(M.land.minNum, M.port.minNum).toFixed(1)}px; no HUD words < 14px`);
  lines.push('edge items padded: max(12px, env(safe-area-inset))');
  b += note(352 + bw + 10, y0, bw, 252, 'MEASURED CHECKS (this layout)', lines);
  const PH = { A: ['Weapon strip moves UP under the lantern plate', '(read-only 32-34px); bottom-left stays free.', 'Portrait: thread = full-width strip, coin chip', 'beside the weapon strip, timer = moon track', 'inside its pill. Pause stays 48px.'], B: ['Weapons move top-left (30-32px, fade after 8s).', 'HP ring follows the hero: it sits IN the action', 'centre by design (the weak spot at 40px).', 'Thread is the top edge (6px); knot under it.', 'Only the ability ring and pause are tappable.'], C: ['Frame thins to 10px; bottom-left rim is OPEN', 'under the joystick. Brackets stay for lantern,', 'timer, coin/pause and ability: more screen used.', 'Thread cannot fit the rim: it lives in the plate', '(landscape) or full-width under the top row.'] }[key];
  b += note(352 + 2 * (bw + 10), y0, bw - 18, 252, `${key}: PHONE LAYOUT RULES`, PH);
  return { html: page(`${L.svg}${Pt.svg}${ovP}${ovL}${b}${banner(D, D.META.tag)}`), w: 1280, h: 720, zonesL: L.zones, zonesP: Pt.zones };
}
