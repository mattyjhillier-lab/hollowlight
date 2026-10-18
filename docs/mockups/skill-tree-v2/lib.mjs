// Skill tree v2 mock-up renderer: static SVG/HTML strings (no runtime JS in the pages). Design-only; not game code.
import { CLUSTERS, CLUSTER_R, EMBLEMS, buildList, EVO_NAMES } from './inventory.mjs';

export const FONTS = `
@font-face{font-family:HLC;src:url(../../../src/assets/fonts/hollowlight-chancery.woff2) format('woff2')}
@font-face{font-family:HLCI;src:url(../../../src/assets/fonts/hollowlight-chancery-italic.woff2) format('woff2')}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-400.woff2) format('woff2');font-weight:400}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-700.woff2) format('woff2');font-weight:700}`;
export const C = { brass: '#d8b26a', brassD: '#8d6c34', ink: '#3a2412', cream: '#fff3dc', dim: 'rgba(255,243,220,.82)', mute: '#9aa4bc', glassA: '#303c56', glassB: '#161c2a', night: '#0c1220', gold: '#ffd36b', goldHot: '#fff3c4', teal: '#6fd3c5', lock: '#59627a', thread: '#ffe6b0' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export { esc };

// ---------------------------------------------------------------- layout (world coordinates)
export const ES = 1.4;
const RING_R = { hearth: 150, wick: 300, dusk: 960, fog: 1180 };
const L = buildList();
export const NODES = L;
const ringAng = {};
for (const r of ['hearth', 'wick', 'dusk', 'fog']) {
  const ns = L.filter((n) => n.ring === r);
  ns.forEach((n, i) => {
    let a;
    if (r === 'dusk') a = [126, 198, 270, 342, 54, 234, 306, 18, 90][i] ?? i * 40; // between/beside constellations
    else if (r === 'fog') a = [198, 342, 90][i];
    else a = (360 / ns.length) * i + (r === 'wick' ? 7 : -90);
    ringAng[n.id] = a;
  });
}
const rad = (d) => (d * Math.PI) / 180;
export function worldPos(n) {
  if (n.ring) { const a = rad(ringAng[n.id]); const R = RING_R[n.ring]; return [Math.cos(a) * R, Math.sin(a) * R]; }
  const c = CLUSTERS[n.cluster]; const a = rad(c.ang);
  if (n.hero) { const i = ['ch_', 'wr_', 'el_'].findIndex(() => true); const k = L.filter((x) => x.hero === n.hero).indexOf(n); const R = 390; const off = (k - 1) * 110; return [Math.cos(a) * R + Math.cos(a + Math.PI / 2) * off, Math.sin(a) * R + Math.sin(a + Math.PI / 2) * off]; }
  const cx = Math.cos(a) * CLUSTER_R, cy = Math.sin(a) * CLUSTER_R;
  return [cx + n.pos[0] * ES, cy + n.pos[1] * ES];
}
export function clusterCentre(wid) { const a = rad(CLUSTERS[wid].ang); return [Math.cos(a) * CLUSTER_R, Math.sin(a) * CLUSTER_R]; }

// ---------------------------------------------------------------- a mid-game save (about 8 runs in), shared by every page
export const SAVE = {
  owned: new Set(['sp_reroll1', 'sp_ban1', 'li_vigor', 'su_bond', 'ma_focus', 'li_step', 'li_reach', 'su_pot', 'sp_reroll2', 'sp_cd1',
    'su_call', 'wf_fang', 'wf_lope', 'wf_bite', 'wf_bleed', 'or_power', 'or_spin', 'or_wick', 'gt_phantom_stampede', 'gt_judgement_wheel', 'ch_wren', 'ch_elias']),
  clusterOpen: { ghost_wolves: true, holy_orbit: true, raven_flock: false, spirit_bolts: false, chain_lightning: false },
  progress: { gt_raven_flock: 0.87, gt_spirit_bolts: 0.6, gt_chain_lightning: 0.43, gt_dire_alpha: 0.76, gt_vesper_tide: 0.52, gt_dive_bombers: 1, wf_rend: 0.9, wf_coat: 1, wr_grip: 0.83, sp_auto: 1, li_last: 0, li_scav: 1, li_root: 1, li_vow: 1, ma_ascend: 1 },
  ready: new Set(['gt_dive_bombers']),
  gold: 2400, shards: 3,
};
export function nodeState(n, save = SAVE) {
  if (n.display) return 'lit';
  if (save.owned.has(n.id)) return 'lit';
  if (n.kind === 'teaser') return 'fog';
  if (n.cluster && !n.hero && !save.clusterOpen[n.cluster] && n.kind !== 'heart') return 'dormant';
  const p = save.progress[n.id];
  if ((n.unlock || n.cond) && !(p >= 1)) return p > 0 || n.kind !== 'socket' ? 'cond' : 'hidden';
  return 'avail';
}

// ---------------------------------------------------------------- defs
export function defs() {
  const roleGlow = Object.entries(CLUSTERS).map(([w, c]) => `<radialGradient id="glow-${w}"><stop offset="0" stop-color="${c.col}" stop-opacity=".55"/><stop offset="1" stop-color="${c.col}" stop-opacity="0"/></radialGradient>`).join('');
  return `<defs>
  <radialGradient id="bgPool" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffb35a" stop-opacity=".22"/><stop offset=".35" stop-color="#ff9a3a" stop-opacity=".07"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="warm"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <radialGradient id="goldGlow"><stop offset="0" stop-color="#ffd36b" stop-opacity=".75"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
  <radialGradient id="tealGlow"><stop offset="0" stop-color="#6fd3c5" stop-opacity=".7"/><stop offset="1" stop-color="#6fd3c5" stop-opacity="0"/></radialGradient>
  <radialGradient id="fog" cx=".5" cy=".5" r=".5"><stop offset=".8" stop-color="#050810" stop-opacity="0"/><stop offset="1" stop-color="#050810" stop-opacity=".55"/></radialGradient>
  <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c4"/><stop offset=".45" stop-color="#d9ab5c"/><stop offset="1" stop-color="#8a5d27"/></linearGradient>
  <radialGradient id="seal" cx=".35" cy=".3"><stop offset="0" stop-color="#fff2b8"/><stop offset=".55" stop-color="#ffcf5a"/><stop offset="1" stop-color="#b47c1e"/></radialGradient>
  <radialGradient id="wax" cx=".35" cy=".3"><stop offset="0" stop-color="#7c8398"/><stop offset="1" stop-color="#363b4c"/></radialGradient>
  <radialGradient id="glass" cx=".4" cy=".3"><stop offset="0" stop-color="#3a4866"/><stop offset="1" stop-color="#141a28"/></radialGradient>
  <radialGradient id="flame" cx=".5" cy=".7"><stop offset="0" stop-color="#fff4d0"/><stop offset=".5" stop-color="#ffc766"/><stop offset="1" stop-color="#ff9a2e"/></radialGradient>
  ${roleGlow}
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>`;
}

// tiny glyphs (local, ~1 unit = 1px at r 10)
const GLYPH = {
  wolf: 'M-6 -7 L-3 -3 C-1 -4 1 -4 3 -3 L6 -7 L7 -1 L9 1 L6 3 L4 6 L0 8 L-4 6 L-6 3 L-9 1 L-7 -1Z',
  raven: 'M-8 3 C-8 -1 -3 -4 1 -4 C2 -6 5 -7 7 -5 L9 -4 L7 -3 C7 1 4 5 -1 5 L-3 8 L-4 4 C-6 4 -8 4 -8 3Z',
  bolt: 'M2 -9 L-5 1 L-1 1 L-3 9 L5 -2 L1 -2Z',
  chain: 'M-1 -9 L-6 1 H-1 L-3 9 L6 -2 H1 L4 -9Z',
  orbit: 'M0 -8 C-3 -3 -3 2 0 3 C3 2 3 -3 0 -8Z',
  drop: 'M0 -7 C3 -2 5 1 5 3 C5 6 3 8 0 8 C-3 8 -5 6 -5 3 C-5 1 -3 -2 0 -7Z',
  lick: 'M0 -8 C4 -3 5 1 3 5 C2 7 -2 7 -3 5 C-5 1 -2 -2 -1 -5 C0 -3 1 -2 2 -2 C2 -4 1 -6 0 -8Z',
  chevron: 'M-6 -4 L0 2 L6 -4 L6 1 L0 7 L-6 1Z',
  star: 'M0 -7 L2 -2 L7 -2 L3 1 L4.5 6.5 L0 3.3 L-4.5 6.5 L-3 1 L-7 -2 L-2 -2Z',
  flame: 'M0 -9 C5 -3 6 1 5 4 C4 7 2 9 0 9 C-2 9 -4 7 -5 4 C-6 1 -3 -2 -1 -5 C0 -2 1 -1 2 -1 C2 -4 1 -6 0 -9Z',
  key: 'M-2 -8 H2 V2 L5 5 L0 9 L-5 5 L-2 2Z',
  lock: 'M-5 -1 H5 V7 H-5Z M-3 -1 V-4 A3 3 0 0 1 3 -4 V-1',
  hero: 'M0 -8 C4 -8 6 -5 6 -2 C6 2 3 4 0 4 C-3 4 -6 2 -6 -2 C-6 -5 -4 -8 0 -8Z M-8 9 C-6 4 6 4 8 9Z',
  q: 'M-3 -3 C-3 -7 3 -7 3 -3 C3 0 0 0 0 3 M0 6 V6.5',
};
export function glyph(name, x, y, s, fill, stroke = C.ink, sw = 1.2) {
  if (name === 'q') return `<path d="${GLYPH.q}" transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${fill}" stroke-width="${2 / s}" stroke-linecap="round"/>`;
  if (name === 'lock') return `<path d="${GLYPH.lock}" transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${stroke}" stroke-width="${sw / s}" stroke-linejoin="round"/>`;
  return `<path d="${GLYPH[name]}" transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${stroke}" stroke-width="${sw / s}" stroke-linejoin="round"/>`;
}
const statusGlyph = (n) => (n.id === 'rv_eye' ? 'chevron' : n.cluster === 'holy_orbit' && n.cat === 'status' ? 'lick' : n.cluster === 'ghost_wolves' && n.cat === 'status' ? 'drop' : null);

// ---------------------------------------------------------------- one node, in SCREEN space. z = zoom-level size factor
export function nodeSVG(n, x, y, z, st, opts = {}) {
  const c = n.cluster ? CLUSTERS[n.cluster] : null;
  const role = c ? c.col : '#ffd9a0';
  const out = [];
  const R = { knot: 7, bead: 10, mastery: 12, heart: 20, socket: 16, key: 14, ring: 8, hero: 11, teaser: 9 }[n.kind] * z;
  const lit = st === 'lit', avail = st === 'avail', cond = st === 'cond', dormant = st === 'dormant' || st === 'hidden', fog = st === 'fog';
  if (opts.sel) out.push(`<circle cx="${x}" cy="${y}" r="${R + 9 * z}" fill="none" stroke="${C.cream}" stroke-width="${1.6 * z}" stroke-dasharray="${3 * z} ${3 * z}"/>`);
  if (n.kind === 'socket') {
    if (lit) out.push(`<circle cx="${x}" cy="${y}" r="${R * 2.6}" fill="url(#goldGlow)"/>`);
    if (st === 'ready' || (avail && n.id && SAVEREADY.has(n.id))) out.push(`<circle cx="${x}" cy="${y}" r="${R * 2.4}" fill="url(#tealGlow)"/>`);
    // brass socket ring
    out.push(`<circle cx="${x}" cy="${y}" r="${R + 3.5 * z}" fill="${C.ink}"/><circle cx="${x}" cy="${y}" r="${R + 2 * z}" fill="url(#brass)"/>`);
    if (lit) {
      const d = 'M0 -1C.23 -.9 .36 -1 .5 -.82C.64 -.68 .86 -.64 .82 -.42C.78 -.24 .96 -.06 .82 .14C.68 .32 .76 .56 .54 .64C.36 .74 .22 .9 0 .82C-.22 .9 -.4 .74 -.54 .64C-.76 .56 -.7 .32 -.82 .14C-.96 -.06 -.78 -.24 -.82 -.42C-.86 -.64 -.64 -.68 -.5 -.82C-.36 -1 -.23 -.9 0 -1Z';
      out.push(`<path d="${d}" transform="translate(${x} ${y}) scale(${R})" fill="url(#seal)" stroke="#6b4512" stroke-width="${2 / R}"/>`, glyph('star', x, y + 0.5 * z, 0.95 * z * (R / 16) , '#8a5d18', '#8a5d18', 0.4));
    } else {
      out.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="url(#glass)" stroke="${C.ink}" stroke-width="${1.2 * z}"/>`);
      if (cond || st === 'ready' || avail) {
        const p = Math.min(0.999, opts.progress ?? 0.5);
        const a1 = -Math.PI / 2, a2 = a1 + p * Math.PI * 2, rr = R + 6.5 * z;
        out.push(`<circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="#2a3346" stroke-width="${3 * z}"/>`);
        out.push(`<path d="M${x + Math.cos(a1) * rr} ${y + Math.sin(a1) * rr} A${rr} ${rr} 0 ${p > 0.5 ? 1 : 0} 1 ${x + Math.cos(a2) * rr} ${y + Math.sin(a2) * rr}" fill="none" stroke="${C.teal}" stroke-width="${3 * z}" stroke-linecap="round"/>`);
      }
      out.push(glyph(dormant ? 'lock' : 'q', x, y, 1.05 * z, dormant ? '#8a93aa' : '#c9d2e4', C.ink, 0.8));
    }
    return out.join('');
  }
  if (n.kind === 'heart') {
    const em = c.emblem;
    if (lit) out.push(`<circle cx="${x}" cy="${y}" r="${R * 2.4}" fill="url(#glow-${n.cluster})"/>`);
    out.push(`<circle cx="${x}" cy="${y}" r="${R + 4 * z}" fill="${C.ink}"/><circle cx="${x}" cy="${y}" r="${R + 2.4 * z}" fill="url(#brass)"/><circle cx="${x}" cy="${y}" r="${R}" fill="${lit ? c.deep : '#1a2030'}"/>`);
    if (!lit && opts.progress) {
      const p = opts.progress, a1 = -Math.PI / 2, a2 = a1 + p * Math.PI * 2, rr = R + 7.5 * z;
      out.push(`<circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="#2a3346" stroke-width="${3.2 * z}"/><path d="M${x + Math.cos(a1) * rr} ${y + Math.sin(a1) * rr} A${rr} ${rr} 0 ${p > 0.5 ? 1 : 0} 1 ${x + Math.cos(a2) * rr} ${y + Math.sin(a2) * rr}" fill="none" stroke="${C.teal}" stroke-width="${3.2 * z}" stroke-linecap="round"/>`);
    }
    out.push(glyph(em === 'orbit' ? 'orbit' : em, x, y, 1.45 * z, lit ? c.col : '#6c7590', lit ? c.deep : '#2a3044', 1.4));
    return out.join('');
  }
  if (n.kind === 'teaser') {
    out.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="#1a2030" stroke="#6c7590" stroke-width="${1.4 * z}" stroke-dasharray="${2.5 * z} ${2.5 * z}"/>`, glyph('q', x, y, 0.9 * z, '#7c86a0'));
    return out.join('');
  }
  // knots, beads, mastery, ring, hero, key
  const fill = lit ? role : avail ? '#20283a' : '#151a26';
  const ringCol = lit ? 'url(#brass)' : avail ? 'url(#brass)' : (cond ? '#6a7390' : C.lock);
  if (lit) out.push(`<circle cx="${x}" cy="${y}" r="${R * 2.6}" fill="${c ? `url(#glow-${n.cluster})` : 'url(#warm)'}"/>`);
  if (n.kind === 'key') {
    const d = `M0 -1.25 C.7 -.5 1 0 .95 .45 C.9 .95 .45 1.15 0 1.15 C-.45 1.15 -.9 .95 -.95 .45 C-1 0 -.7 -.5 0 -1.25Z`;
    out.push(`<path d="${d}" transform="translate(${x} ${y}) scale(${R + 3 * z})" fill="${C.ink}"/><path d="${d}" transform="translate(${x} ${y}) scale(${R + 1.5 * z})" fill="${lit || avail ? 'url(#brass)' : C.lock}"/><path d="${d}" transform="translate(${x} ${y + 1 * z}) scale(${R - 1 * z})" fill="${lit ? 'url(#flame)' : '#1a2030'}"/>`);
    return out.join('');
  }
  out.push(`<circle cx="${x}" cy="${y}" r="${R + 2.6 * z}" fill="${C.ink}"/><circle cx="${x}" cy="${y}" r="${R + 1.4 * z}" fill="${ringCol}"/><circle cx="${x}" cy="${y}" r="${R - 0.6 * z}" fill="${fill}"/>`);
  if (lit) out.push(`<circle cx="${x - R * 0.3}" cy="${y - R * 0.35}" r="${R * 0.32}" fill="#fff" opacity=".65"/>`);
  if (cond && opts.progress) { const p = opts.progress, rr = R + 4.6 * z, a1 = -Math.PI / 2, a2 = a1 + p * Math.PI * 2; out.push(`<path d="M${x + Math.cos(a1) * rr} ${y + Math.sin(a1) * rr} A${rr} ${rr} 0 ${p > 0.5 ? 1 : 0} 1 ${x + Math.cos(a2) * rr} ${y + Math.sin(a2) * rr}" fill="none" stroke="${C.teal}" stroke-width="${2.2 * z}" stroke-linecap="round"/>`); }
  const sg = statusGlyph(n);
  const gcol = lit ? (c ? c.deep : '#5a3d1a') : avail ? '#c9b48a' : '#59627a';
  if (n.kind === 'mastery') out.push(glyph('star', x, y, 0.95 * z, lit ? '#fff8dc' : avail ? '#e8cf96' : '#59627a', C.ink, 0.8));
  else if (n.kind === 'hero') out.push(glyph('hero', x, y, 0.75 * z, lit ? '#fff3dc' : '#59627a', C.ink, 0.6));
  else if (sg) out.push(glyph(sg, x, y, 0.85 * z, sg === 'drop' ? (lit ? '#e5484d' : '#7a4a52') : sg === 'lick' ? (lit ? '#c79bff' : '#5e5476') : (lit ? '#9b7dff' : '#5e5476'), C.ink, 0.7));
  else if (n.kind === 'bead') out.push(`<circle cx="${x}" cy="${y}" r="${2.6 * z}" fill="${gcol}"/>`);
  return out.join('');
}
const SAVEREADY = SAVE.ready;

// ---------------------------------------------------------------- whole map in screen space
// view: { w, h, cx, cy, s } world point (cx,cy) at screen centre, s = px per world unit. lod: 'far' | 'mid' | 'near'
export function mapSVG(view, o = {}) {
  const { w, h, cx, cy, s } = view;
  const save = o.save || SAVE;
  const X = (wx) => +((wx - cx) * s + w / 2).toFixed(1), Y = (wy) => +((wy - cy) * s + h / 2).toFixed(1);
  const lod = o.lod || (s < 0.5 ? 'far' : s < 1.1 ? 'mid' : 'near');
  const z = lod === 'far' ? 0.42 : lod === 'mid' ? 0.75 : Math.min(1.6, s * 1.05);
  const g = [];
  // stars (seeded) + lantern pool + fog
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) { const sx = rnd() * w, sy = rnd() * h, r = rnd() * 1.1 + 0.25; g.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${r.toFixed(2)}" fill="#cfd8ff" opacity="${(0.12 + rnd() * 0.35).toFixed(2)}"/>`); }
  g.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${900 * s + 120}" fill="url(#bgPool)"/>`);
  g.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${1320 * s}" fill="url(#fog)"/>`);
  // rings (thread circles)
  for (const [r, R] of [['hearth', 150], ['wick', 300], ['dusk', 960]]) {
    g.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${R * s}" fill="none" stroke="${C.thread}" stroke-opacity="${r === 'dusk' ? 0.16 : 0.32}" stroke-width="${(r === 'dusk' ? 1.2 : 1.8) * Math.max(0.6, z)}" ${r === 'dusk' ? `stroke-dasharray="${4 * z} ${6 * z}"` : ''}/>`);
  }
  g.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${1180 * s}" fill="none" stroke="#8e9ab8" stroke-opacity=".18" stroke-width="1" stroke-dasharray="2 7"/>`);
  // constellations: watermark, spoke, outline thread
  for (const [wid, c] of Object.entries(CLUSTERS)) {
    const [ccx, ccy] = clusterCentre(wid);
    const em = EMBLEMS[c.emblem];
    const open = save.clusterOpen[wid];
    const ang = rad(c.ang);
    // spoke thread hub -> heart (through the hero lantern for starters)
    const hp = [ccx + em.heart[0] * ES, ccy + em.heart[1] * ES];
    g.push(`<line x1="${X(Math.cos(ang) * 300)}" y1="${Y(Math.sin(ang) * 300)}" x2="${X(hp[0])}" y2="${Y(hp[1])}" stroke="${open ? C.thread : '#5a6480'}" stroke-opacity="${open ? 0.55 : 0.35}" stroke-width="${2.2 * z}" ${open ? '' : `stroke-dasharray="${3 * z} ${5 * z}"`}/>`);
    // emblem watermark silhouette
    const isLine = c.emblem === 'chain';
    const wm = `transform="translate(${X(ccx)} ${Y(ccy)}) scale(${s * ES})"`;
    if (open) {
      g.push(`<circle cx="${X(ccx)}" cy="${Y(ccy)}" r="${230 * s}" fill="url(#glow-${wid})" opacity=".35"/>`);
      g.push(`<path d="${em.silhouette}" ${wm} fill="${isLine ? 'none' : c.col}" fill-opacity=".1" stroke="${c.col}" stroke-opacity=".3" stroke-width="${(isLine ? 26 : 3) / 1}" stroke-linejoin="round" stroke-linecap="round" filter="url(#softer)"/>`);
      g.push(`<path d="${em.silhouette}" ${wm} fill="none" stroke="${c.col}" stroke-opacity=".18" stroke-width="${1.5 / s / ES}" stroke-linejoin="round"/>`);
    } else {
      g.push(`<path d="${em.silhouette}" ${wm} fill="${isLine ? 'none' : '#8e9ab8'}" fill-opacity=".08" stroke="#a8b2cc" stroke-opacity=".38" stroke-width="${(isLine ? 2 : 1.4) / s}" stroke-dasharray="${4 / s} ${5 / s}" stroke-linejoin="round"/>`);
    }
    // outline thread through the slots
    const pts = em.outline.map((k) => [ccx + em.slots[k][0] * ES, ccy + em.slots[k][1] * ES]);
    const ids = L.filter((n) => n.cluster === wid && n.slot).sort((a, b) => a.order - b.order);
    const segs = [];
    const heartLink = c.emblem === 'wolf' ? [0, 10] : c.emblem === 'orbit' ? [9, 10] : [0];
    for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1], ids[i], ids[i + 1]]);
    if (em.closed) segs.push([pts[8], pts[0], ids[8], ids[0]]);
    if (c.emblem === 'orbit') { segs.length = 0; for (let i = 0; i < 9; i++) segs.push([pts[i], pts[(i + 1) % 9], ids[i], ids[(i + 1) % 9]]); }
    for (const hi of heartLink) segs.push([hp, pts[hi], { id: 'heart', display: !c.heart }, ids[hi]]);
    if (c.emblem === 'orbit') { segs.push([hp, pts[9], { display: true }, ids[9]], [hp, pts[10], { display: true }, ids[10]]); }
    for (const [a, b, na, nb] of segs) {
      const la = na.display || save.owned.has(na.id) || (na.id === 'heart' && save.owned.has(c.heart)); const lb = nb && (nb.display || save.owned.has(nb.id));
      const both = la && lb;
      g.push(`<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${both ? C.thread : open ? '#7a84a0' : '#566078'}" stroke-opacity="${both ? 0.9 : open ? 0.45 : 0.3}" stroke-width="${(both ? 2.6 : 1.5) * z}" ${both ? '' : `stroke-dasharray="${3 * z} ${4 * z}"`}/>`);
      if (both) g.push(`<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${c.col}" stroke-opacity=".45" stroke-width="${7 * z}" filter="url(#soft)"/>`);
    }
    // socket tethers (faint)
    for (const n of L.filter((x) => x.cluster === wid && x.kind === 'socket')) {
      const [sx, sy] = worldPos(n);
      g.push(`<line x1="${X(hp[0])}" y1="${Y(hp[1])}" x2="${X(sx)}" y2="${Y(sy)}" stroke="${C.gold}" stroke-opacity="${nodeState(n, save) === 'lit' ? 0.35 : 0.12}" stroke-width="${1.2 * z}" stroke-dasharray="${1.5 * z} ${3 * z}"/>`);
    }
  }
  // hero lantern threads
  for (const hid of ['wren', 'elias']) { const ns = L.filter((n) => n.hero === hid); for (let i = 0; i + 1 < ns.length; i++) { const [a, b] = [worldPos(ns[i]), worldPos(ns[i + 1])]; g.push(`<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${C.thread}" stroke-opacity=".35" stroke-width="${1.4 * z}"/>`); } }
  // hub spokes to hearth
  for (const n of L.filter((x) => x.ring === 'hearth')) { const [a, b] = worldPos(n); g.push(`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(a)}" y2="${Y(b)}" stroke="${C.thread}" stroke-opacity="${save.owned.has(n.id) ? 0.7 : 0.22}" stroke-width="${1.6 * z}"/>`); }
  // nodes
  const labels = [];
  for (const n of L) {
    const [wx, wy] = n.display && n.kind === 'heart' ? [clusterCentre(n.cluster)[0] + EMBLEMS[CLUSTERS[n.cluster].emblem].heart[0] * ES, clusterCentre(n.cluster)[1] + EMBLEMS[CLUSTERS[n.cluster].emblem].heart[1] * ES] : worldPos(n);
    const x = X(wx), y = Y(wy);
    if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue; // culled (the real screen culls the same way)
    let st = nodeState(n, save);
    if (save.ready.has(n.id)) st = 'ready';
    if (n.kind === 'heart' && n.cluster && !save.clusterOpen[n.cluster]) st = 'cond';
    if (n.kind === 'socket' && n.cluster && !save.clusterOpen[n.cluster]) st = 'dormant';
    g.push(nodeSVG(n, x, y, z, st, { progress: save.progress[n.id], sel: o.sel === n.id }));
    if (lod === 'near' && o.labels !== false && n.kind !== 'heart') labels.push([n, x, y, st]);
  }
  // hub lantern
  const hz = lod === 'far' ? 0.55 : lod === 'mid' ? 0.8 : 1.2;
  g.push(`<circle cx="${X(0)}" cy="${Y(0)}" r="${70 * hz}" fill="url(#warm)"/>`);
  g.push(hubLantern(X(0), Y(0), hz));
  // labels (collision avoidance: a label that would overlap an earlier one, or clip the top edge, is skipped; selected wins)
  const boxes = [];
  labels.sort((a, b) => (b[0].id === o.sel) - (a[0].id === o.sel) || ({ socket: 0, mastery: 1 }[a[0].kind] ?? 2) - ({ socket: 0, mastery: 1 }[b[0].kind] ?? 2));
  for (const [n, x, y, st] of labels) {
    const name = st === 'hidden' || st === 'dormant' ? (n.kind === 'socket' ? '???' : '') : n.name;
    if (!name) continue;
    const off = ({ socket: 30, knot: 16, bead: 19, mastery: 21, key: 24, ring: 16, hero: 20 }[n.kind] || 18) * z;
    const fsz = (n.kind === 'socket' ? 15 : 12.5) * Math.min(1.15, Math.max(0.95, z * 0.8)); const ly = y + off + 9 * Math.min(z, 1.2); const bw = name.length * fsz * 0.52 + 6;
    const bx = [x - bw / 2, ly - fsz, x + bw / 2, ly + 3];
    if (bx[1] < 6 || bx[3] > h - 4 || boxes.some((b) => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1])) continue;
    boxes.push(bx);
    const col = n.kind === 'socket' && st === 'lit' ? C.gold : st === 'lit' ? C.cream : st === 'avail' ? '#e9dcc0' : '#9aa4bc';
    g.push(`<text x="${x}" y="${y + off + 9 * Math.min(z, 1.2)}" text-anchor="middle" font-family="${n.kind === 'socket' ? 'HLC' : 'AS'}" font-size="${(n.kind === 'socket' ? 15 : 12.5) * Math.min(1.15, Math.max(0.95, z * 0.8))}" fill="${col}" stroke="#0c1220" stroke-width="3.2" paint-order="stroke">${esc(name)}</text>`);
  }
  // constellation names
  if (o.names !== false) for (const [wid, c] of Object.entries(CLUSTERS)) {
    const [ccx, ccy] = clusterCentre(wid);
    const open = save.clusterOpen[wid];
    const up = ccy < -100 && lod !== 'near'; const ny = up ? Y(ccy) - 190 * ES * s - 6 : Y(ccy) + 205 * ES * s + (lod === 'far' ? 4 : 16);
    const fs = lod === 'far' ? 15 : lod === 'mid' ? 19 : 22;
    g.push(`<text x="${X(ccx)}" y="${ny}" text-anchor="middle" font-family="HLC" font-size="${fs}" fill="${open ? c.col : '#8e98b2'}" stroke="#0c1220" stroke-width="4" paint-order="stroke">${esc(open ? c.name : 'An unwoken spirit')}</text>`);
  }
  return g.join('\n');
}

export function hubLantern(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <circle r="30" fill="${C.ink}"/><circle r="27.5" fill="url(#brass)"/><circle r="22" fill="#241a12"/>
  <path d="M-12 -14 Q0 -30 12 -14 Z" fill="url(#brass)" stroke="${C.ink}" stroke-width="2"/>
  <rect x="-11" y="-12" width="22" height="26" rx="8" fill="#ffcf7a" opacity=".25"/>
  <path d="M0 -12 C7 -3 9 3 7 8 C5 12 3 14 0 14 C-3 14 -5 12 -7 8 C-9 3 -5 -3 -2 -6 C-1 -2 1 -1 2 -1 C2 -5 1 -8 0 -12Z" fill="url(#flame)" stroke="#7a3510" stroke-width="1.6"/>
  <path d="M0 2 C3 5 3 9 0 11 C-3 9 -3 5 0 2Z" fill="#fff4d0"/>
  <path d="M-19 -12 Q-22 -2 -19 8" stroke="#fffbe8" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
}

// ---------------------------------------------------------------- UI chrome (Lantern Glass, Lit)
export const CSS = `${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:${C.night};color:${C.cream};font-family:AS,sans-serif}
.stage{position:relative;width:100vw;height:100vh;overflow:hidden;background:radial-gradient(120% 90% at 50% 45%,#1a2338 0,#0f1626 55%,#090d18 100%)}
svg.map{position:absolute;inset:0;width:100%;height:100%}
.glass{background:linear-gradient(180deg,rgba(48,60,86,.97),rgba(22,28,42,.97));border:3px solid #c99a4e;border-radius:18px;box-shadow:0 0 0 2px ${C.ink},inset 0 3px 0 -1px rgba(255,240,200,.35),0 10px 30px rgba(0,0,0,.5),inset 0 22px 40px -20px rgba(255,190,110,.28)}
.top{position:absolute;left:12px;right:12px;top:10px;display:flex;align-items:center;gap:10px;height:52px}
.btn{height:44px;min-width:44px;padding:0 16px;border-radius:22px;display:flex;align-items:center;gap:8px;font-family:HLC;font-size:19px;color:${C.cream};background:linear-gradient(180deg,#3a4866,#1b2232);border:2.5px solid #c99a4e;box-shadow:0 0 0 2px ${C.ink},inset 0 2px 0 rgba(255,240,200,.3)}
.btn.round{width:44px;padding:0;justify-content:center;font-family:AS;font-weight:700;font-size:22px}
.btn.primary{background:linear-gradient(180deg,#ffd27a,#e89a3a);color:#3a1d08;border-color:#fff0c4}
.key{font-family:AS;font-weight:700;font-size:12px;color:#3a2412;background:url(#);background:linear-gradient(180deg,#f5dfae,#c99a4e);border-radius:6px;padding:2px 6px;border:1.5px solid ${C.ink}}
.pill{height:40px;padding:0 14px;border-radius:20px;display:flex;align-items:center;gap:8px;font-weight:700;font-size:18px;background:linear-gradient(180deg,#2a3348,#141a28);border:2px solid #c99a4e;box-shadow:0 0 0 2px ${C.ink}}
.coin{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff0c4,#d9ab5c 50%,#8a5d27);border:2px solid #5a3d1a}
.shard{width:14px;height:18px;background:linear-gradient(180deg,#d8c4ff,#8a5cff);clip-path:polygon(50% 0,100% 42%,50% 100%,0 42%);}
.title{font-family:HLC;font-size:28px;color:${C.cream};text-shadow:0 2px 0 #000}
.whisper{font-family:HLCI;color:${C.dim};font-size:16px}
.spacer{flex:1}
.panel{position:absolute;padding:16px 18px}
.kick{font-family:AS;font-weight:700;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:#f5dfae}
.h{font-family:HLC;font-size:26px;line-height:1.1;margin:4px 0 2px}
.eff{font-size:16px;line-height:1.35;color:${C.cream}}
.big{font-family:AS;font-weight:700;font-size:30px;color:${C.cream}}
.thread{height:2px;margin:12px 0;background:repeating-linear-gradient(90deg,#ffe6b0 0 7px,transparent 7px 12px);opacity:.6}
.cond{font-size:15px;margin:6px 0 2px;display:flex;justify-content:space-between;gap:8px}
.bar{height:8px;border-radius:5px;background:#202839;border:1.5px solid ${C.ink};overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#4fb3a4,#9fe9dd);border-radius:5px}
.bar.done i{background:linear-gradient(90deg,#9fe9dd,#e8fff9)}
.flag{display:inline-block;font-weight:700;font-size:12px;letter-spacing:.08em;color:#14201e;background:${C.teal};padding:3px 14px 3px 8px;clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)}
.sealb{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12px;letter-spacing:.1em;color:#3a2412;background:linear-gradient(180deg,#fff2b8,#ffcf5a);border:1.5px solid #6b4512;border-radius:12px;padding:3px 10px}
.mute{color:${C.mute}}
.small{font-size:13px}
.legend{position:absolute;font-size:13px;color:${C.dim}}
.help{position:absolute;left:16px;bottom:10px;font-size:13px;color:${C.mute}}
.cap{position:absolute;font-family:AS;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#f5dfae;opacity:.85}
`;

export function page(title, body, extraCss = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}${extraCss}</style></head><body>${body}</body></html>`;
}
export { EVO_NAMES };
