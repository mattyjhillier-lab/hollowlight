// Skill tree: huge glowing node web, radial from a hub, three branches. Owned lit, buyable pulsing, locked grey with padlock + progress.
import { rnd, T, FONT, lin, rad, nid } from './core.mjs';
import { ic, orbit, lock } from './icons.mjs';

const HUB = [450, 420];
const RINGS = [88, 148, 210, 276, 344, 414, 486, 560];
const COUNTS = [4, 5, 6, 8, 9, 11, 13, 14];
const poly = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + (i / n) * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
const star = (n, ro, ri, rot = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i / (n * 2)) * Math.PI * 2, r = i % 2 ? ri : ro; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');

export function tree(K) {
  const BR = K.id === 'P1' ? ['#ff9f55', '#c79bff', '#a8e6c4'] : ['#b79cff', '#7ff0ff', '#ffc46b'];
  const BN = ['SUMMONER', 'MAGIC', 'LIGHT'];
  const ICONS = [['wolf', 'raven', 'paw', 'heart', 'shield', 'boot'], ['bolt', 'star', 'book', 'zap', 'eye', 'shard'], ['flame', 'moon', 'orbit', 'bell', 'leaf', 'magnet']];
  const CENTRE = [150, 30, 270].map((d) => (d * Math.PI) / 180); // down-left, down-right, up
  const r = rnd(77);
  const nodes = [], edges = [];
  // build nodes
  RINGS.forEach((R, k) => {
    const n = COUNTS[k];
    for (let b = 0; b < 3; b++) {
      for (let i = 0; i < n; i++) {
        const span = (108 * Math.PI) / 180;
        const a = CENTRE[b] - span / 2 * 0.92 + ((i + 0.5) / n) * span * 0.92 + (r() - 0.5) * 0.05;
        const rr = R + (r() - 0.5) * 10;
        const mid = i === Math.floor(n / 2);
        let type = 'small';
        if (k >= 1 && r() < 0.22) type = 'med';
        if (k >= 2 && mid && k % 2 === 0) type = 'large';
        if ((k === 3 || k === 6) && mid) type = 'key';
        nodes.push({ b, k, i, n, x: HUB[0] + Math.cos(a) * rr, y: HUB[1] + Math.sin(a) * rr, type, ic: ICONS[b][(i + k * 2) % 6], a });
      }
    }
  });
  const at = (b, k, i) => nodes.find((q) => q.b === b && q.k === k && q.i === i);
  nodes.forEach((q) => {
    if (q.k === 0) { edges.push({ from: 'hub', to: q }); }
    else {
      const prev = nodes.filter((p) => p.b === q.b && p.k === q.k - 1).sort((p1, p2) => Math.abs(p1.a - q.a) - Math.abs(p2.a - q.a));
      edges.push({ from: prev[0], to: q });
      if (prev[1] && Math.abs(prev[1].a - q.a) < 0.2) edges.push({ from: prev[1], to: q });
    }
    const nx = at(q.b, q.k, q.i + 1);
    if (nx && r() < 0.3) edges.push({ from: q, to: nx });
  });
  // ownership
  const ownProb = [[1, 1, 1], [1, 0.9, 0.8], [0.9, 0.65, 0.45], [0.6, 0.35, 0.15], [0.25, 0, 0]];
  nodes.forEach((q) => { q.own = q.k <= 4 && r() < ownProb[q.k][q.b]; });
  // owned nodes must connect to owned parent chain; enforce via edges
  const parentOwn = (q) => edges.filter((e) => e.to === q).some((e) => e.from === 'hub' || e.from.own);
  nodes.forEach((q) => { if (q.own && !parentOwn(q)) q.own = false; });
  nodes.forEach((q) => { if (!q.own) q.buy = edges.some((e) => (e.to === q && (e.from === 'hub' || e.from.own)) || (e.from === q && e.to.own)); });
  // conditional locked nodes with progress
  const conds = ['340/1000', '12/50', '87/200', '3/10', '1/5', '640/1500'];
  const condNodes = nodes.filter((q) => !q.own && !q.buy && q.k >= 3 && q.k <= 6 && (q.type === 'large' || q.type === 'med' || q.type === 'key' || q.i % 4 === 0));
  condNodes.forEach((q, i) => { q.cond = conds[i % conds.length]; });
  const sel = nodes.filter((q) => q.b === 0 && q.buy && q.k >= 2 && q.x > 150 && q.y > 330 && q.y < 540)[0] || nodes.find((q) => q.buy);
  sel.type = 'large'; sel.ic = 'wolf';
  const cnt = { own: nodes.filter((q) => q.own).length, total: nodes.length };

  // ---------- defs ----------
  let d = BR.map((c, b) => rad(`tO${b}`, [[0, '#fff', 1], [0.35, c, 1], [1, c, 1]], [0.4, 0.35, 0.75])).join('');
  d += rad('tHalo', glowStops2(K.warm, 0.9)) + rad('tLock', [[0, '#3a4350'], [1, '#1c222b']], [0.4, 0.35, 0.8]) + rad('tBuy', [[0, '#2a3342'], [1, '#10151d']], [0.4, 0.35, 0.8]);
  d += rad('tBg', [[0, K.id === 'P1' ? '#2a2630' : '#1b2446'], [0.5, K.night], [1, '#05070b']], [HUB[0], HUB[1], 760], true);
  const bgRings = RINGS.map((R) => `<circle cx="${HUB[0]}" cy="${HUB[1]}" r="${R}" fill="none" stroke="${K.edge}" stroke-opacity=".08" stroke-width="1.4"/>`).join('');
  const dust = Array.from({ length: 50 }, () => `<circle cx="${(r() * 1280).toFixed(0)}" cy="${(64 + r() * 656).toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.08 + r() * 0.3).toFixed(2)}"/>`).join('');
  let out = `<defs>${d}</defs><rect width="1280" height="720" fill="url(#tBg)"/>${dust}${bgRings}`;
  // branch sector glows
  CENTRE.forEach((a, b) => { const x = HUB[0] + Math.cos(a) * 300, y = HUB[1] + Math.sin(a) * 300; out += `<circle cx="${x}" cy="${y}" r="260" fill="${BR[b]}" opacity=".07" filter="url(#b30)"/>`; });
  // ---------- edges ----------
  const pos = (e) => (e === 'hub' ? { x: HUB[0], y: HUB[1], b: -1 } : e);
  edges.forEach(({ from, to }) => {
    const f = pos(from), c = BR[to.b];
    const mx = (f.x + to.x) / 2, my = (f.y + to.y) / 2, dx = to.x - f.x, dy = to.y - f.y;
    const cx = mx - dy * 0.06, cy = my + dx * 0.06;
    const dpath = `M${f.x.toFixed(1)} ${f.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    const fo = from === 'hub' || from.own;
    if (fo && to.own) out += `<path d="${dpath}" fill="none" stroke="#000" stroke-width="9" opacity=".5"/><path d="${dpath}" fill="none" stroke="${c}" stroke-width="5" filter="url(#glowS)"/><path d="${dpath}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".85"/>`;
    else if ((fo && to.buy) || (to.own && from.buy)) out += `<path d="${dpath}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="6 6" opacity=".75"/>`;
    else out += `<path d="${dpath}" fill="none" stroke="#5a6678" stroke-width="2.2" opacity=".38"/>`;
  });
  // ---------- nodes ----------
  const RD = { small: 13, med: 19, large: 27, key: 37 };
  const nodeSvg = (q) => {
    const c = BR[q.b], rd = RD[q.type], isel = q === sel;
    let g = `<g transform="translate(${q.x.toFixed(1)},${q.y.toFixed(1)})">`;
    const shapeP = q.type === 'small' ? null : q.type === 'med' ? poly(6, rd, Math.PI / 6) : q.type === 'large' ? poly(8, rd, Math.PI / 8) : star(8, rd, rd * 0.78);
    const body = (fill, stroke, sw) => (shapeP ? `<polygon points="${shapeP}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>` : `<circle r="${rd}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
    const iconScale = { small: 0.4, med: 0.55, large: 0.78, key: 1.0 }[q.type];
    const iconSvg = (cc, hi, ol) => (iconScale ? `<g transform="scale(${iconScale})">${q.ic === 'orbit' ? orbit({ c: hi, hi: cc }) : ic(q.ic, { c: cc, hi, ol })}</g>` : `<circle r="3.6" fill="${hi}" opacity=".9"/>`);
    if (q.own) {
      g += `<circle r="${rd * 2.4}" fill="url(#tHalo)" opacity="${q.type === 'key' ? 0.9 : 0.55}"/>`;
      g += `<g filter="url(#glowS)">${body('#1a1018', '#1a1018', 6)}${body(`url(#tO${q.b})`, '#fff', 2)}</g>`;
      if (q.type === 'key') g += `<circle r="${rd + 9}" fill="none" stroke="${c}" stroke-width="2" opacity=".8"/><circle r="${rd + 15}" fill="none" stroke="${K.warmHi}" stroke-width="1" stroke-dasharray="3 5" opacity=".7"/>`;
      g += iconSvg('#2a1d14', '#fff7e0', '#fff');
      if (iconScale) g = g.replace(/<\/g>$/, '</g>');
    } else if (q.buy) {
      g += `<circle r="${rd + 14}" fill="none" stroke="${c}" stroke-width="2" opacity=".35"/><circle r="${rd + 8}" fill="none" stroke="${c}" stroke-width="2.4" opacity=".6"/>`;
      g += `<g filter="url(#glowS)">${body('url(#tBuy)', c, 3.4)}</g>`;
      g += `<g opacity=".95">${iconSvg(c, '#fff', '#10151d')}</g>`;
      g += `<g transform="translate(0,${rd + 15})"><rect x="-17" y="-8" width="34" height="15" rx="7.5" fill="#0a0d13" stroke="${c}" stroke-width="1.4"/>${T(String(120 + (q.k + 1) * 90 + q.i * 30), 0, 3.5, { s: 10.5, a: 'middle', f: FONT.num, c: '#fff' })}</g>`;
      if (isel) g += `<circle r="${rd + 20}" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M${rd + 22} 0 H${944 - q.x}" stroke="#fff" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity=".7"/>`;
    } else {
      g += body('url(#tLock)', '#4a5568', 2.6) + `<g opacity=".45" style="filter:grayscale(1)">${iconSvg('#7a8696', '#aab4c2', '#10151d')}</g>`;
      if (q.cond) {
        g += `<g transform="translate(${rd * 0.55},${rd * 0.55}) scale(.62)">${lock({ c: '#c9d2de' })}</g>`;
        g += `<g transform="translate(0,${rd + 15})"><rect x="-27" y="-8.5" width="54" height="16" rx="8" fill="#0a0d13" stroke="#6a7688" stroke-width="1.3"/>${T(q.cond, 0, 3.4, { s: 10, a: 'middle', f: FONT.mono, c: '#c9d2de', w: 700 })}</g>`;
      }
    }
    return g + '</g>';
  };
  // draw back (far) to near so overlap is clean
  const plateXY = [0, 1, 2].map((b) => [HUB[0] + Math.cos(CENTRE[b]) * 118, HUB[1] + Math.sin(CENTRE[b]) * 118]);
  out += nodes.filter((q) => !plateXY.some(([x, y]) => Math.hypot(q.x - x, q.y - y) < 52)).sort((p, q) => q.k - p.k).map(nodeSvg).join('');
  // ---------- hub ----------
  out += `<g transform="translate(${HUB[0]},${HUB[1]})"><circle r="96" fill="url(#tHalo)" opacity=".7"/>${Array.from({ length: 16 }, (_, i) => `<path d="M0 -50 L4 -62 L-4 -62Z" fill="${K.warmHi}" opacity=".7" transform="rotate(${i * 22.5})"/>`).join('')}<circle r="46" fill="#1a1018" stroke="#1a1018" stroke-width="6"/><circle r="46" fill="${K.plate}" stroke="${K.edge}" stroke-width="4"/><circle r="38" fill="none" stroke="${K.edgeD}" stroke-width="1.6" stroke-dasharray="3 5"/><g filter="url(#glow)"><g transform="scale(1.3)">${ic('flame', { c: K.warm, hi: '#fff', ol: '#3a2410' })}</g></g></g>`;
  // branch plates
  const bl = [[1, 'SUMMONER', 0], [1, 'MAGIC', 1], [1, 'LIGHT', 2]].map(([, n, b]) => [HUB[0] + Math.cos(CENTRE[b]) * 118, HUB[1] + Math.sin(CENTRE[b]) * 118, n, b]);
  bl.forEach(([x, y, n, b]) => { out += `<g transform="translate(${x},${y})"><rect x="-76" y="-17" width="152" height="34" rx="17" fill="${K.plate}" fill-opacity=".92" stroke="${BR[b]}" stroke-width="2.4"/><g transform="translate(-52,0) scale(.5)">${ic(ICONS[b][0], { c: BR[b], hi: '#fff' })}</g>${T(n, 12, 6, { s: 14, f: FONT.title, c: '#fff', a: 'middle', w: 900, ls: 1.2 })}</g>`; });

  // ---------- top bar ----------
  out += `<g><rect x="0" y="64" width="1280" height="46" fill="#07090d" opacity=".72"/>${T('THE LANTERN WEB', 22, 96, { s: 24, f: FONT.title, c: K.warmHi, w: 900, ls: 1 })}
<g transform="translate(330,87)"><rect x="0" y="-12" width="120" height="30" rx="15" fill="${K.plate}" stroke="${K.edge}" stroke-width="2"/><g transform="translate(18,3) scale(.46)">${ic('coin', { c: '#d8b26a', hi: '#fff0c0' })}</g>${T('48,210', 36, 9, { s: 16, f: FONT.num })}</g>
<g transform="translate(466,87)"><rect x="0" y="-12" width="86" height="30" rx="15" fill="${K.plate}" stroke="${K.edge}" stroke-width="2"/><g transform="translate(18,3) scale(.46)">${ic('shard', { c: K.sp, hi: '#fff' })}</g>${T('27', 36, 9, { s: 16, f: FONT.num })}</g>
${T(`NODES  ${cnt.own} / ${cnt.total}  (500+ planned)`, 580, 94, { s: 14, c: K.txt, ls: 1.5, w: 700 })}${T('drag to pan · wheel to zoom · tap a node', 580, 107, { s: 10.5, c: K.txtD, w: 500 })}
<g transform="translate(850,87)"><rect x="0" y="-13" width="64" height="30" rx="15" fill="${K.plate}" stroke="${K.edgeD}" stroke-width="1.6"/>${T('ESC  Back', 32, 7, { s: 11, a: 'middle', c: K.txt })}</g></g>`;

  // ---------- minimap ----------
  const mm = [92, 646];
  out += `<g transform="translate(${mm[0]},${mm[1]})"><circle r="60" fill="${K.plate}" fill-opacity=".9" stroke="${K.edge}" stroke-width="2.4"/><circle r="52" fill="none" stroke="${K.edge}" stroke-opacity=".2"/>` + nodes.map((q) => `<circle cx="${((q.x - HUB[0]) * 0.1).toFixed(1)}" cy="${((q.y - HUB[1]) * 0.1).toFixed(1)}" r="${q.own ? 1.8 : 1.1}" fill="${q.own ? BR[q.b] : '#5a6678'}"/>`).join('') + `<rect x="-26" y="-18" width="52" height="30" rx="3" fill="none" stroke="#fff" stroke-width="1.6" transform="translate(4,2)"/><circle r="4" fill="${K.warm}"/></g>`;

  // ---------- detail panel ----------
  const pc = BR[0], px = 944, py = 124, pw = 322, ph = 552;
  out += `<g><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="22" fill="#05070b" opacity=".35" transform="translate(5,7)" filter="url(#b8)"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="22" fill="${K.plate}" fill-opacity=".96" stroke="${K.edge}" stroke-width="3"/><rect x="${px + 4}" y="${py + 4}" width="${pw - 8}" height="${ph - 8}" rx="19" fill="none" stroke="${pc}" stroke-opacity=".35" stroke-width="1.5"/>`;
  out += `<circle cx="${px + 70}" cy="${py + 74}" r="60" fill="url(#tHalo)"/><g transform="translate(${px + 70},${py + 74})"><polygon points="${poly(8, 38, Math.PI / 8)}" fill="#1a1018" stroke="#1a1018" stroke-width="7"/><polygon points="${poly(8, 38, Math.PI / 8)}" fill="url(#tBuy)" stroke="${pc}" stroke-width="3.4"/><g transform="scale(1.35)">${ic('wolf', { c: pc, hi: '#fff', ol: '#10151d' })}</g></g>`;
  out += T('Pack Instinct', px + 126, py + 62, { s: 25, f: FONT.title, w: 900, c: '#fff' }) + T('SUMMONER  ·  LARGE NODE', px + 126, py + 84, { s: 11, c: pc, ls: 1.4 }) + T('Tier III  ·  Ghost Wolves', px + 126, py + 104, { s: 13, c: K.txtD, i: 1, w: 500 });
  out += `<path d="M${px + 22} ${py + 150} H${px + pw - 22}" stroke="${K.edge}" stroke-opacity=".35"/>`;
  out += T('The pack hunts as one. Wolves lunge at the', px + 24, py + 180, { s: 15, c: K.txt, w: 500 }) + T('nearest enemy twice as often before turning', px + 24, py + 200, { s: 15, c: K.txt, w: 500 }) + T('back to circle you.', px + 24, py + 220, { s: 15, c: K.txt, w: 500 });
  out += `<rect x="${px + 22}" y="${py + 242}" width="${pw - 44}" height="92" rx="14" fill="#0a0d13" stroke="${K.edgeD}" stroke-width="1.5"/>` + T('EFFECT', px + 38, py + 264, { s: 11, c: K.txtD, ls: 2 }) + T('+12%', px + 38, py + 302, { s: 34, f: FONT.num, c: K.warmHi }) + T('wolf bite damage', px + 150, py + 290, { s: 14, c: K.txt, w: 600 }) + T('next tier  +18%', px + 150, py + 312, { s: 12, c: K.txtD, w: 500 }) + `<path d="M${px + 190} ${py + 270} l12 0 l-4 -4 m4 4 l-4 4" stroke="${pc}" stroke-width="2" fill="none" opacity="0"/>`;
  out += T('REQUIRES', px + 24, py + 354, { s: 11, c: K.txtD, ls: 2 }) + `<g transform="translate(${px + 24},${py + 362})"><rect width="${pw - 48}" height="18" rx="9" fill="#0a0d13" stroke="${K.edgeD}" stroke-width="1.5"/><rect x="2" y="2" width="${(pw - 52) * 0.34}" height="14" rx="7" fill="${pc}" opacity=".9"/>${T('340 / 1000  hollow wolves released', (pw - 48) / 2, 13, { s: 10.5, a: 'middle', c: '#fff', st: '#0a0d13', sw: 3 })}</g>`;
  out += T('OPENS', px + 24, py + 402, { s: 11, c: K.txtD, ls: 2 });
  [['paw', 'Pounce'], ['raven', 'Feather'], ['heart', 'Bond']].forEach(([n, l], i) => { out += `<g transform="translate(${px + 54 + i * 100},${py + 436})"><circle r="21" fill="#0a0d13" stroke="#5a6678" stroke-width="2" stroke-dasharray="4 3"/><g opacity=".45" transform="scale(.6)">${ic(n, { c: '#9aa6b3', hi: '#fff' })}</g>${T(l, 0, 38, { s: 10.5, a: 'middle', c: K.txtD })}</g>`; });
  out += `<g transform="translate(${px + 22},${py + ph - 66})"><rect width="${pw - 44}" height="48" rx="24" fill="#1a1018" transform="translate(0,3)"/><rect width="${pw - 44}" height="48" rx="24" fill="${K.warm}" stroke="#fff4d2" stroke-width="2.4"/><rect x="4" y="3" width="${pw - 52}" height="18" rx="9" fill="#fff" opacity=".35"/>${T('BUY', 74, 32, { s: 22, f: FONT.num, c: '#3a2410', w: 900 })}<g transform="translate(${pw - 44 - 92},24)">${ic('coin', { c: '#d8b26a', hi: '#fff0c0', s: 0.5 })}</g>${T('450', pw - 44 - 70, 31, { s: 20, f: FONT.num, c: '#3a2410', w: 900 })}</g></g>`;
  return out;
}
function glowStops2(c, a) { return [[0, c, a], [0.2, c, a * 0.55], [0.45, c, a * 0.2], [0.75, c, a * 0.05], [1, c, 0]]; }
