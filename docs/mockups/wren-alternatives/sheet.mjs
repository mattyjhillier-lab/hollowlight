// Per-take design sheet (1280x720): turnaround, expressions, props, silhouettes, hex callouts, legend. Mock-up only.
import { begin, use, T, FONT, glow, nid, addDef, shp, circ } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { TAKES, knit, ribbonPts, lamp, pawPrint, wrenA, wrenB, wrenC } from './takes.mjs';

const CODE = 'STYLE CODE: L2 tinted outline + H2 soft gradient/rim + P1 chibi + W2 textured ground';
const CODE2 = 'G1 lantern pool + G2 glow trails | mood P1 Warm Lantern (golden light on cool grey-blue)';
const lbl = (s, x, y, o = {}) => T(s, x, y, { s: o.s || 11.5, c: o.c || '#e8edf3', w: 800, a: 'middle', f: FONT.ui, ls: 1 });
const clipRect = (x, y, w, h) => { const id = nid('cr'); addDef(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`); return id; };
// draw a crop of a figure: box (figure coords) centred at (cx,cy) in page, scale k
const crop = (fn, opts, box, cx, cy, k) => { const id = clipRect(box[0], box[1], box[2], box[3]); return `<g transform="translate(${cx - (box[0] + box[2] / 2) * k},${cy - (box[1] + box[3] / 2) * k}) scale(${k})"><g clip-path="url(#${id})">${fn(opts)}</g></g>`; };

export const META = {
  A: {
    concept: 'Taller chibi who keeps the light: patched trailing coat, lantern on a crook staff beside her head, open face.',
    sw: [['Hood / ears', '#7aa7a3'], ['Coat', '#46707a'], ['Cowl lining', '#efe2c8'], ['Scarf amber', '#f2a335'], ['Patch ochre', '#c9a066'], ['Staff wood', '#8a6a45'], ['Scarf stripe', '#fbe9bd'], ['Patch rose', '#d08f8c'], ['Patch sage', '#8fae7e'], ['Brass', '#d2a24c'], ['Skin', '#f6c9a6'], ['Boots', '#7a4e2e']],
    dots: [[1, 14, -104], [2, -20, -20], [3, 6, -91], [4, 9, -46], [5, -14, -28], [6, -24, -70]],
    legend: [['L2', 'tinted outline, no black'], ['H2', 'soft gradient + rim light'], ['P1+', 'chibi, leaning taller: head about 40% of height'], ['W2', 'painted ground'], ['G1+G2', 'lantern up on the staff, pool at feet, scarf and coat trail']],
    why: [['TELL @40px', 'a warm dot on a pole at ear height beside the head, over a tall bell coat'], ['FACE', 'no helmet ring: brim cap + two ear-flap lappets, chin and cheeks open'], ['SCARF', 'chunky knit: scalloped edge, V-stitch rows, 2 cream bands, fringe'], ['CHANGED', 'lantern moves from hand to staff; ears become floppy; coat is patched'], ['MOOD', 'she keeps a light lit for a pack that cannot answer: tender, upright']],
    props: ['LANTERN + STAFF', 'KNIT SCARF', 'FLOPPY-EAR COWL', 'PATCHED COAT'],
  },
  B: {
    concept: 'Small round pup-sized Wren: huge knit scarf, beanie with round ears, mittens, a ghost pup on her shoulder.',
    sw: [['Beanie / ears', '#a9bfd2'], ['Beanie cuff', '#7c95ad'], ['Parka', '#7d8fb8'], ['Scarf amber', '#f2a335'], ['Pup ghost', '#ffdf9a'], ['Mittens', '#f2a335'], ['Scarf stripe', '#fff0c4'], ['Pup shade', '#f3bf70'], ['Thread / collar', '#ffb84a'], ['Brass jar', '#d2a24c'], ['Skin', '#f6c9a6'], ['Boots', '#6a4a3a']],
    dots: [[1, -14, -88], [2, -22, -72], [3, -16, -18], [4, -16, -37], [5, 17, -49], [6, 25, -23]],
    legend: [['L2', 'tinted outline, no black'], ['H2', 'soft gradient + rim light'], ['P1++', 'extra chibi: head about 55% of height, round ball body'], ['W2', 'painted ground'], ['G1+G2', 'jar lantern pool at feet, pup glow, scarf trail']],
    why: [['TELL @40px', 'a round ball with a fat amber collar and a pale glowing bump on the shoulder'], ['FACE', 'beanie, not a hood: no ring around the face, big eyes, chin tucked in scarf'], ['SCARF', 'fat lumpy knit: big scallops, V-rows, cream bands, droopy fringed tail'], ['CHANGED', 'hood becomes beanie; lantern is a small jar; the pack is physically on her'], ['MOOD', 'the youngest, most hugged: cosy and heartbreaking beside the Hollow']],
    props: ['GHOST PUP', 'CHUNKY SCARF', 'BEANIE + EARS', 'MITTEN + JAR'],
  },
  C: {
    concept: 'BOLD DEPARTURE: wears the old alpha\'s pelt as wolf-head hood, face in shadow, amber glints, ember on a thread.',
    sw: [['Pelt', '#cdd9e2'], ['Pelt shade', '#8da3b7'], ['Cape lining', '#59708a'], ['Tunic', '#34506a'], ['Face void', '#141b27'], ['Amber thread', '#ffb84a'], ['Eye glint', '#ffd98a'], ['Bone cage', '#efe4cc'], ['Hand skin', '#e8c4a8'], ['Chin', '#8a6e66'], ['Nose', '#2a3140'], ['Boots', '#2b3441']],
    dots: [[1, -17, -96], [2, 14, -62], [3, 24, -30], [4, -4, -30], [5, 0, -76], [6, -21, -22]],
    legend: [['L2', 'tinted outline, no black'], ['H2', 'soft gradient + rim light'], ['P1', 'chibi but slender: dark vertical body, pale wolf-head hood'], ['W2', 'painted ground'], ['G1+G2', 'ember pool beside her, amber thread trails to her wolves']],
    why: [['TELL @40px', 'a pale wolf-muzzle head over a dark body, bushy pelt tail, floating ember dot'], ['FACE', 'void under the hood with two amber glints: no visor, no outline ring'], ['NO SCARF', 'the "scarf streak" becomes the pelt tail + amber threads; wolves unravel from them'], ['CHANGED', 'no ear hood, no scarf, no hand lantern; she wears the pack\'s alpha'], ['MOOD', 'quiet, a bit eerie, grieving: she is wearing her family so they stay close']],
    props: ['BONE EMBER LANTERN', 'PELT WOLF-HOOD', 'STITCHED PAW', 'AMBER THREADS'],
  },
};

export function banner(id, w = 700) {
  const t = TAKES[id], m = META[id];
  const sw = m.sw.slice(0, 6).map(([n, c], i) => `<circle cx="${22 + i * 112}" cy="80" r="9" fill="${c}" stroke="#fff" stroke-opacity=".75" stroke-width="1.6"/>${T(c + ' ' + n.split(' ')[0].toLowerCase(), 36 + i * 112, 84, { s: 10.5, f: FONT.mono, c: '#e8edf3', w: 600 })}`).join('');
  return `<rect width="${w}" height="92" fill="#07090d" opacity=".95"/><rect y="92" width="${w}" height="3" fill="#ffb84a"/>${T(`WREN TAKE ${id}: ${t.name}`, 12, 29, { s: 25, f: FONT.title, w: 900 })}${T(m.concept, 12, 45, { s: 9.6, f: FONT.mono, c: '#ffd98a', w: 700 })}${T(CODE, 12, 57, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${T(CODE2, 12, 68, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${sw}`;
}

export function tilePart(id, i, cx, cy) {
  const t = TAKES[id]; const F = t.fn;
  if (id === 'A') {
    if (i === 0) return `<g transform="translate(${cx - 6},${cy + 8})">${lamp(0, -48, 2.6, 'cage', { gr: 52 })}<path d="M6 -22 L9 66" stroke="#8a6a45" stroke-width="7" stroke-linecap="round"/></g>`;
    if (i === 1) return `<g transform="translate(${cx - 52},${cy - 6}) scale(1.1)">${knit(ribbonPts(0, 0, 100, 8, 0.6, 6, 0.05), 20, 17, '#f2a335', { bands: [[0.3, 0.42], [0.62, 0.74]], fringe: true })}</g><g transform="translate(${cx - 52},${cy + 40}) scale(1.1)">${knit(ribbonPts(0, 0, 100, 0, 0, 0, 0), 20, 20, '#f2a335', { bands: [[0.3, 0.42], [0.62, 0.74]], sc: 1.2 })}</g>`;
    if (i === 2) return crop(F, { view: '3q', expr: 'neutral', bare: true }, [-34, -128, 68, 72], cx, cy + 10, 1.75);
    return crop(F, { view: 'front' }, [-34, -70, 68, 74], cx, cy + 12, 1.6);
  }
  if (id === 'B') {
    if (i === 0) return `<g transform="translate(${cx},${cy + 24}) scale(3.8)">${shp('M-7 -2 C-16 -6 -16 -16 -9 -17 C-13 -12 -9 -8 -4 -6Z', '#f3bf70', { w: 0.7, spirit: true })}${shp('M-10.5 0 a10.5 7.5 0 1 0 21 0 a10.5 7.5 0 1 0 -21 0Z', '#ffdf9a', { spirit: true, so: 4 })}${shp(circ(7, 0, 6), '#ffdf9a', { spirit: true, w: 0.8 })}${shp('M3 -4 L2.4 -11.4 L7.4 -6.6Z', '#ffdf9a', { w: 0.6, spirit: true })}${shp('M8 -5.4 L11.6 -11 L12.4 -3.4Z', '#ffdf9a', { w: 0.6, spirit: true })}<path d="M3.6 -0.5 Q5.4 1.6 7.4 -0.5" fill="none" stroke="#7a3a12" stroke-width="1" stroke-linecap="round"/><ellipse cx="11" cy="2" rx="1.5" ry="1.1" fill="#3a2418"/><circle cx="-1" cy="4" r="1.6" fill="#ffb84a"/></g>`;
    if (i === 1) return `<g transform="translate(${cx - 50},${cy - 8}) scale(1.05)">${knit(ribbonPts(0, 0, 96, 7, 0.6, 6, 0.05), 26, 22, '#f2a335', { bands: [[0.25, 0.37], [0.6, 0.72]], sc: 1.3, fringe: true })}</g><g transform="translate(${cx - 50},${cy + 44}) scale(1.05)">${knit(ribbonPts(0, 0, 96, 0, 0, 0, 0), 22, 22, '#f2a335', { bands: [[0.25, 0.37], [0.6, 0.72]], sc: 1.3 })}</g>`;
    if (i === 2) return crop(F, { view: '3q', expr: 'smile', bare: true }, [-34, -104, 68, 70], cx, cy + 10, 1.8);
    return `<g transform="translate(${cx - 22},${cy + 30}) scale(2.2)">${lamp(0, 10, 1, 'round', { gr: 40 })}</g><g transform="translate(${cx + 22},${cy - 20}) scale(3.2)">${shp(circ(0, 0, 6.4), '#f2a335', { w: 0.8, x: '<path d="M-7 -2 h14 M-7 2.4 h14" stroke="#fff0c4" stroke-width="1.8"/>' })}${shp('M2 -3 a2.6 3.2 0 1 0 5.2 0 a2.6 3.2 0 1 0 -5.2 0Z', '#f2a335', { w: 0.6 })}</g><path d="M${cx + 22} ${cy - 12} Q${cx - 4} ${cy + 4} ${cx - 22} ${cy + 20}" fill="none" stroke="#5a3a1a" stroke-width="1.6"/>`;
  }
  if (i === 0) return `<g transform="translate(${cx},${cy + 12})">${lamp(0, 0, 3.1, 'bone', { gr: 56 })}<path d="M0 -50 L0 -86" stroke="#ffb84a" stroke-width="1.6" stroke-dasharray="1.4 3.2" stroke-linecap="round"/></g>`;
  if (i === 1) return crop(F, { view: '3q', expr: 'neutral', bare: true }, [-34, -128, 68, 62], cx, cy + 10, 1.9);
  if (i === 2) return crop(F, { view: 'back' }, [-34, -66, 68, 66], cx, cy + 12, 1.75);
  return `<g transform="translate(${cx - 52},${cy - 48})"><circle cx="8" cy="0" r="5.5" fill="#e8c4a8" stroke="#8d6a56" stroke-width="1.4"/>${[[40, 40], [70, 62], [56, 20]].map(([dx, dy]) => `<path d="M8 0 Q${8 + dx * 0.5} ${dy + 28} ${8 + dx} ${dy + 26}" fill="none" stroke="#ffb84a" stroke-width="1.8" stroke-dasharray="1.6 3.4" stroke-linecap="round"/>`).join('')}</g>` + glow(cx, cy + 30, 60, 42, '#ffb84a', 0.25);
}

export function sheetPage(id) {
  begin(); use(STYLES.S1);
  const t = TAKES[id], m = META[id], F = t.fn; let b = bg(1280, 720);
  b += card(8, 98, 664, 292, 'TURNAROUND', 'front / 3/4 / side / back');
  const views = [['front', 'FRONT'], ['3q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']];
  const k = Math.min(1.75, 226 / t.H), base = 366;
  views.forEach(([v, name], i) => {
    const cx = 94 + i * 162;
    b += stage(cx, base, 66, 14, i + 11) + shadow(cx, base + 2, 38);
    b += `<g transform="translate(${cx},${base}) scale(${k.toFixed(3)})">${F({ view: v, expr: t.exprs[0] })}</g>`;
    b += lbl(name, cx, 386);
  });
  for (const [n, x, y] of m.dots) { const px = 94 + x * k, py = base + y * k; b += `<circle cx="${px}" cy="${py}" r="7.2" fill="#0b1016" stroke="#ffd98a" stroke-width="1.4"/>` + T(String(n), px, py + 3.6, { s: 9.5, c: '#ffd98a', w: 900, a: 'middle', f: FONT.mono }); }

  b += card(708, 8, 564, 140, 'EXPRESSIONS', 'eyes, brows, mouth');
  const names = { neutral: 'NEUTRAL', determined: 'DETERMINED', smile: 'SMALL SMILE', sleepy: 'SLEEPY', worried: 'WORRIED', sorrow: 'SORROW' };
  t.exprs.forEach((e, i) => { const cx = 800 + i * 182; b += glow(cx, 78, 70, 44, '#ffc45a', 0.16) + crop(F, { view: 'front', expr: e, bare: true }, [t.head[0] - t.head[2] / 2, t.head[1] - t.head[3] / 2, t.head[2], t.head[3]], cx, 80, 98 / t.head[3]) + lbl(names[e], cx, 142, { s: 10 }); });

  b += card(680, 152, 592, 238, 'KEY PROPS', 'each is its own layer / sprite');
  m.props.forEach((p, i) => { const x = 690 + i * 144; b += `<rect x="${x}" y="176" width="136" height="168" rx="10" fill="#1d2733" stroke="#33414f"/>` + glow(x + 68, 258, 60, 60, '#ffc96b', i === 0 && id !== 'B' ? 0.35 : 0.08) + tilePart(id, i, x + 68, 262) + lbl(p, x + 68, 362, { s: 9.6 }); });
  // silhouettes
  b += card(8, 396, 664, 190, 'SILHOUETTES (black fill)', 'if it reads black, it reads at 40px');
  b += `<rect x="18" y="420" width="640" height="158" rx="8" fill="#d9e1e8"/>`;
  const sk = Math.min(1, 122 / t.H);
  views.forEach(([v], i) => { b += `<g transform="translate(${64 + i * 84},566) scale(${sk})">${F({ view: v, sil: true })}</g>`; });
  const run = { view: 'side', sil: true, run: true };
  b += `<g transform="translate(470,566) scale(${sk})">${F(run)}</g><g transform="translate(572,566) scale(0.536)">${F(run)}</g><g transform="translate(626,566) scale(0.357)">${F(run)}</g>`;
  b += T('RUN', 470, 438, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('60px', 572, 438, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('40px', 626, 438, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('front / 3/4 / side / back', 150, 438, { s: 10, c: '#445', w: 800, a: 'start' });
  // hex
  b += card(680, 396, 592, 190, 'COLOUR CALLOUTS (hex)', 'dots 1-6 match the front view');
  m.sw.forEach(([n, c], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 692 + col * 194, y = 424 + row * 39;
    b += `<rect x="${x}" y="${y}" width="186" height="35" rx="8" fill="#1d2733" stroke="#33414f"/><circle cx="${x + 20}" cy="${y + 18}" r="12.5" fill="${c}" stroke="#fff" stroke-opacity=".8" stroke-width="1.8"/>` + T(String(i + 1), x + 20, y + 22, { s: 10.5, w: 900, a: 'middle', c: '#10202a', f: FONT.mono }) + T(n, x + 40, y + 15, { s: 11, w: 800, c: '#fff' }) + T(c, x + 40, y + 29, { s: 11, f: FONT.mono, c: '#ffd98a', w: 700 });
  });
  b += card(8, 594, 1264, 118, 'CODE LEGEND + WHY THIS TAKE READS');
  m.legend.forEach(([c, tx], i) => { b += T(c, 22, 628 + i * 15.5, { s: 11, f: FONT.mono, c: '#ffd98a', w: 900 }) + T(tx, 78, 628 + i * 15.5, { s: 11, c: '#dfe7ef', w: 500 }); });
  m.why.forEach(([c, tx], i) => { b += T(c, 470, 628 + i * 15.5, { s: 11, f: FONT.mono, c: '#ffb84a', w: 900 }) + T(tx, 575, 628 + i * 15.5, { s: 10.4, c: '#dfe7ef', w: 500 }); });
  b += banner(id);
  return svgPage(1280, 720, b);
}
