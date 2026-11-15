// Ophimber, Lucinda's baby dragon (a SHE; option 1 Hatchling, LOCKED 2026-11-13): coral-ember body, cream belly plates, big glossy eye, two curled ridged horns, cheek frill,
// rose-gold back spines, glowing ember spots, a flame-leaf tail tip and a pair of proper bat wings. Same real helpers and style as the heroes; baked once into ONE atlas
// ('ophimber_pet') of poses: trot (4 frames), stand, perched (2 wing frames + asleep), fly (2 frames, bigger wings, used by Ophimber's Rise). Origin = her feet, faces +x.
import { shape, S, E, C, CAP, stroke, fillP, glowAt, dot, mix } from './wrenart.js';
import { F, INK, ink, taper, spikesAlong, tailTip } from './lucindaart.js';

export const OP = { body: '#e07c5e', belly: '#f6dca6', wing: '#f3ab8e', horn: '#ead2a8', spot: '#ffb45a', eye: '#2e1426', spine: '#ef8a5a' };
const P = OP;

// bat wing: shoulder at the origin; arm to the wrist, three finger ribs, scalloped membrane. open 0..1 (folded..spread)
function wing(c, open, far, big = 1) {
  const col = far ? mix(P.wing, INK, 0.22) : P.wing; const bone = far ? mix(P.body, INK, 0.25) : P.body;
  const o = Math.max(0, Math.min(1.2, open)); const k = big;
  c.save(); c.rotate((o - 0.45) * 0.9); c.scale(1, 0.75 + 0.3 * Math.min(1, o));
  const wr = [(-5 - 3 * o) * k, (-22 - 3 * o) * k];
  const tips = [[(-17 - 7 * o) * k, (-30 - 4 * o) * k], [(-27 - 7 * o) * k, (-20 - 2 * o) * k], [(-27 - 4 * o) * k, (-7 - 1 * o) * k]];
  const root = [-12 * k, -1 * k];
  const cc = (a, b, s = 0.52) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return `${F(m[0] + (wr[0] - m[0]) * s)} ${F(m[1] + (wr[1] - m[1]) * s)}`; };
  const d = `M0 0 L${F(wr[0])} ${F(wr[1])} L${F(tips[0][0])} ${F(tips[0][1])} Q${cc(tips[0], tips[1])} ${F(tips[1][0])} ${F(tips[1][1])} Q${cc(tips[1], tips[2])} ${F(tips[2][0])} ${F(tips[2][1])} Q${cc(tips[2], root, 0.25)} ${F(root[0])} ${F(root[1])}Z`;
  shape(c, S(d), col, {
    w: 0.75, x: (q) => {
      const g = q.createLinearGradient(wr[0], wr[1], tips[1][0], tips[1][1]); g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(1, 'rgba(255,240,210,0.25)'); q.fillStyle = g; q.fill(new Path2D(d));
      for (const tp of tips) stroke(q, `M${F(wr[0])} ${F(wr[1])} L${F(tp[0])} ${F(tp[1])}`, mix(bone, INK, 0.2), 1.9 * Math.min(1.2, k));
    },
  });
  stroke(c, `M0 0 L${F(wr[0])} ${F(wr[1])}`, ink(bone), 2.8 * Math.min(1.2, k)); stroke(c, `M0 0 L${F(wr[0])} ${F(wr[1])}`, bone, 1.6 * Math.min(1.2, k));
  c.save(); c.translate(wr[0], wr[1]); shape(c, S('M-0.6 -1 L2.8 -3.8 L1.6 0.8Z'), P.horn, { w: 0.35 }); c.restore();
  c.restore();
}

function horns(c, x, y, s = 1) {
  for (const [dx, dy, far] of [[-2.5, 0.6, true], [2.5, -0.6, false]]) {
    const p = [x + dx, y + dy, x + dx - 1 * s, y + dy - 8 * s, x + dx - 9 * s, y + dy - 11 * s, x + dx - 10 * s, y + dy - 5 * s];
    const tp = taper(p, 2.8 * s, 0.5);
    const col = far ? mix(P.horn, INK, 0.2) : P.horn;
    shape(c, tp, col, { w: 0.6, x: (k) => { for (let i = 4; i < 19; i += 4) stroke(k, `M${F(tp.L[i][0])} ${F(tp.L[i][1])} L${F(tp.R[i][0])} ${F(tp.R[i][1])}`, mix(col, INK, 0.35), 0.7, { a: 0.7 }); } });
  }
}

function head(c, x, y, r, asleep) {
  c.save(); c.translate(x - r * 0.78, y + r * 0.32); c.scale(0.55 * r / 10, 0.55 * r / 10);
  shape(c, S('M2 -5 L-14 -12 Q-9 -5 -16 -2 Q-9 1 -12 7 Q-5 5 2 5Z'), P.wing, { w: 0.7, x: (k) => { for (const tp of [[-14, -12], [-16, -2], [-12, 7]]) stroke(k, `M1 0 L${tp[0]} ${tp[1]}`, mix(P.body, INK, 0.2), 1.4); } });
  c.restore();
  horns(c, x - r * 0.2, y - r * 0.82, r / 10);
  shape(c, C(x, y, r), P.body, { w: 0.9 });
  const sx = x + r * 0.8; const sy = y + r * 0.34;
  shape(c, E(sx, sy, r * 0.56, r * 0.44), P.body, { w: 0.8, x: (k) => fillP(k, `M${F(sx - r * 0.7)} ${F(sy + r * 0.12)} Q${F(sx)} ${F(sy + r * 0.05)} ${F(sx + r * 0.7)} ${F(sy + r * 0.05)} L${F(sx + r * 0.7)} ${F(sy + r)} L${F(sx - r * 0.7)} ${F(sy + r)}Z`, P.belly, 0.95) });
  dot(c, sx + r * 0.42, sy - r * 0.16, r * 0.075, ink(P.body));
  stroke(c, `M${F(sx - r * 0.45)} ${F(sy + r * 0.14)} Q${F(sx + r * 0.05)} ${F(sy + r * 0.3)} ${F(sx + r * 0.5)} ${F(sy + r * 0.1)}`, ink(P.body), r * 0.1);
  if (!asleep) fillP(c, `M${F(sx + r * 0.08)} ${F(sy + r * 0.2)} L${F(sx + r * 0.24)} ${F(sy + r * 0.18)} L${F(sx + r * 0.16)} ${F(sy + r * 0.42)}Z`, '#ffffff'); // the tiny fang
  c.save(); c.translate(x + r * 0.3, y + r * 0.42); c.scale(1, 0.6); fillP(c, `M${F(-r * 0.28)} 0 A${F(r * 0.28)} ${F(r * 0.28)} 0 1 0 ${F(r * 0.28)} 0 A${F(r * 0.28)} ${F(r * 0.28)} 0 1 0 ${F(-r * 0.28)} 0Z`, '#ff9a8a', 0.5); c.restore();
  const ex = x + r * 0.32; const ey = y - r * 0.12;
  if (asleep) stroke(c, `M${F(ex - r * 0.3)} ${F(ey)} Q${F(ex)} ${F(ey + r * 0.25)} ${F(ex + r * 0.3)} ${F(ey)}`, P.eye, r * 0.14);
  else {
    c.save(); c.beginPath(); c.ellipse(ex, ey, r * 0.34, r * 0.44, 0, 0, Math.PI * 2); c.fillStyle = P.eye; c.fill();
    const g = c.createLinearGradient(ex, ey, ex, ey + r * 0.44); g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(1, 'rgba(255,200,100,0.95)');
    c.beginPath(); c.ellipse(ex, ey + r * 0.1, r * 0.28, r * 0.32, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill(); c.restore();
    dot(c, ex - r * 0.1, ey - r * 0.18, r * 0.15, '#ffffff'); dot(c, ex + r * 0.12, ey + r * 0.18, r * 0.07, '#ffffff', 0.9);
    stroke(c, `M${F(ex - r * 0.36)} ${F(ey - r * 0.3)} Q${F(ex)} ${F(ey - r * 0.6)} ${F(ex + r * 0.38)} ${F(ey - r * 0.32)}`, P.eye, r * 0.12);
  }
}

function tail(c, p, tipWob = 0) {
  const tl = taper(p, 6, 1.6);
  shape(c, tl, P.body, { w: 0.8, x: (q) => { for (let i = 3; i < 19; i += 3) stroke(q, `M${F(tl.R[i][0] * 0.55 + tl.L[i][0] * 0.45)} ${F(tl.R[i][1] * 0.55 + tl.L[i][1] * 0.45)} L${F(tl.R[i][0])} ${F(tl.R[i][1])}`, P.belly, 1.6, { a: 0.85 }); } });
  spikesAlong(c, p, 0.15, 0.75, 3, 3, 2, P.spine, 1);
  tailTip(c, p, 0.72, P.spine, tipWob);
}
const spots = (c, pts) => { for (const [x, y, r] of pts) { glowAt(c, x, y, r * 3, '#ffc96b', 0.4); dot(c, x, y, r, P.spot); dot(c, x - r * 0.3, y - r * 0.3, r * 0.45, '#fff0c0'); } };
function paw(c, col, x, y, s = 1) {
  shape(c, E(x, y - 1.8 * s, 3.8 * s, 2.5 * s), col, { w: 0.6 });
  for (const dy of [-2.6, -1.4, -0.2]) { c.save(); c.translate(x + 3.3 * s, y + dy * s); c.scale(s, s); shape(c, S('M0 -0.6 L2 0.1 L0 0.7Z'), P.horn, { w: 0.25 }); c.restore(); }
}

// pose: { mode 'walk' | 'sit' | 'fly', lg: leg swing -1..1, fl: wing flap -1..1, tw: tail wag -1..1, asleep }. Origin = feet, faces +x.
export function drawOphimber(c, pose) {
  const m = pose.mode; const lgv = pose.lg || 0; const fl = pose.fl || 0; const tw = (pose.tw || 0) * 3;
  const run = m === 'walk'; const fly = m === 'fly'; const sit = m === 'sit';
  const wk = fly ? 1.25 : 1;
  const open = fly ? 0.8 + fl * 0.4 : run ? 0.45 + fl * 0.35 : pose.asleep ? 0.12 : 0.3 + fl * 0.04;
  c.save();
  if (sit) { c.translate(-4, 0); c.rotate(-0.22); c.translate(4, 0); }
  tail(c, sit ? [-10, -10, -20, -2, -8, 2, 6, 0] : [-10, -12, -24, -6, -38, -14 + tw * 0.3, -36 + tw, -28], pose.asleep ? 0 : tw * 0.04);
  const lg = (ph) => (run ? lgv * ph * 3 : 0);
  for (const [x, ph] of [[-6, 1], [7, -1]]) { shape(c, CAP(x, -9, x + lg(ph), -2.5, 3, 2.8), mix(P.body, INK, 0.2), { w: 0.6 }); paw(c, mix(P.body, INK, 0.2), x + lg(ph), 0, 0.85); }
  c.save(); c.translate(3, -24); c.rotate(0.4); wing(c, open, true, wk * 1.05); c.restore();
  shape(c, E(0, -13, 12.5, 9.5), P.body, { w: 0.9, x: (k) => fillP(k, 'M-6 -6 Q6 -4 14 -12 L16 0 L-8 0Z', P.belly, 0.95) });
  for (const x of [-1, 3, 7]) stroke(c, `M${x} -7 Q${x + 1.5} -5 ${x + 3} -7`, mix(P.belly, INK, 0.3), 0.8, { a: 0.6 });
  spikesAlong(c, [-10, -18, -6, -23, 2, -24, 6, -23], 0, 1, 4, 3.6, 3, P.spine, 1);
  spots(c, [[-6, -15, 1.4], [-2, -18, 1.1], [-8.5, -11, 1]]);
  for (const [x, ph] of [[-5, -1], [8, 1]]) { shape(c, CAP(x, -8, x + lg(ph) + 0.5, -2.5, 3.3, 3), P.body, { w: 0.7 }); paw(c, P.body, x + lg(ph) + 0.5, 0, 0.95); }
  head(c, 13, -28, 11, !!pose.asleep);
  c.save(); c.translate(-2, -21); wing(c, open, false, wk * 1.15); c.restore();
  c.restore();
}

export const O_BB = [-70, -78, 38, 8];
export const O_PIVOT = [0, 0];
const of = (name, pose) => ({ name, bb: O_BB, pv: O_PIVOT, draw: (c) => drawOphimber(c, pose) });
// trot cycle (4), stand, perched (two wing positions), asleep (Calm), fly (Ophimber's Rise: bigger wings, two beats)
export const OPHIMBER_FRAMES = [
  of('o_walk0', { mode: 'walk', lg: 1, fl: 1, tw: 1 }), of('o_walk1', { mode: 'walk', lg: 0, fl: 0, tw: 0 }),
  of('o_walk2', { mode: 'walk', lg: -1, fl: -1, tw: -1 }), of('o_walk3', { mode: 'walk', lg: 0, fl: 0.2, tw: 0 }),
  of('o_stand', { mode: 'walk', lg: 0, fl: 0, tw: 0.3 }),
  of('o_sit0', { mode: 'sit', fl: 0 }), of('o_sit1', { mode: 'sit', fl: 1 }), of('o_sleep', { mode: 'sit', fl: 0, asleep: true }),
  of('o_fly0', { mode: 'fly', fl: 1, tw: 0.5 }), of('o_fly1', { mode: 'fly', fl: -1, tw: -0.5 }),
];
export const OPHIMBER_ATLAS = 'ophimber_pet';
export const OPHIMBER_K = 1; // sprite scale in hero design units (she is about 50 du tall: a third of Lucinda)
export const OPH_BODY_COLOURS = ['body', 'belly', 'wing', 'horn'];
