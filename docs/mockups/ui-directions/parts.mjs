// Modular UI parts: S style, C colour, T type, I icons, B bars, K cards, L logo. Mock-ups only.
import { icon, figure, scene } from './lib.mjs';
export const H = 604;
export const cm = (c, p) => `color-mix(in srgb,${c} ${p}%,transparent)`;

export const C = {
  1: { code: 'C1', name: 'Moonlit', sw: [['#0b1020', 'Night'], ['#6fe3d2', 'Cyan'], ['#9b7bff', 'Violet'], ['#ffd26a', 'Gold(rare)'], ['#e23a55', 'HP']],
    v: { a: '#6fe3d2', b: '#9b7bff', gold: '#ffd26a', text: '#e8ecff', mute: '#8f9bc4', panel: '#111c3c', panel2: '#0a1028', line: '#3a4a80', hp: '#d92f4d', hp2: '#ff7a8c', warm: '#ffd26a' },
    s: { sky1: '#15234a', sky2: '#0b1226', sky3: '#05070f', tree: '#0a1330', tree2: '#070d20', fog: '#26407a', moon: '#cfe9ff', enemy: '#1a1226', eye: '#ff6a6a', gem: '#6fe3d2', orb: '#e8e0ff', warm: '#ffd26a' } },
  2: { code: 'C2', name: 'Gold-bronze', sw: [['#0b0a0f', 'Soot'], ['#8a6a3a', 'Bronze'], ['#e9dfc6', 'Parchment'], ['#7fd6c6', 'Spirit'], ['#9e1f2b', 'Blood']],
    v: { a: '#7fd6c6', b: '#b6a2ea', gold: '#e8b84a', text: '#ece1c8', mute: '#a39a86', panel: '#16131a', panel2: '#0b0a0f', line: '#8a6a3a', hp: '#8f1a26', hp2: '#d2443f', warm: '#ffb050' },
    s: { sky1: '#1c1722', sky2: '#0f0d14', sky3: '#050407', tree: '#0b0911', tree2: '#07060b', fog: '#40302c', moon: '#f0e2c0', enemy: '#171018', eye: '#ff9a50', gem: '#7fd6c6', orb: '#f0e8d0', warm: '#ffb050' } },
  3: { code: 'C3', name: 'Neon', sw: [['#050a16', 'Void'], ['#19f0ff', 'Cyan'], ['#c45bff', 'Magenta'], ['#ffd23a', 'Gold(rare)'], ['#ff3b6b', 'HP']],
    v: { a: '#19f0ff', b: '#c45bff', gold: '#ffd23a', text: '#dffaff', mute: '#7fa6b8', panel: '#0a1830', panel2: '#050c1c', line: '#17b8c8', hp: '#ff2f64', hp2: '#ff8aa6', warm: '#ffd23a' },
    s: { sky1: '#0c1c36', sky2: '#060d1c', sky3: '#02050c', tree: '#071426', tree2: '#050d1b', fog: '#0c4463', moon: '#aaf8ff', enemy: '#0d1020', eye: '#ff3b6b', gem: '#19f0ff', orb: '#ffffff', warm: '#ffd23a' } },
  4: { code: 'C4', name: 'Ember & Ash', sw: [['#140d0c', 'Charcoal'], ['#ff8a2a', 'Ember'], ['#efe6d6', 'Bone'], ['#ffc46a', 'Glow gold'], ['#b3122a', 'Blood']],
    v: { a: '#ff8a2a', b: '#ffc46a', gold: '#fff0b8', text: '#efe6d6', mute: '#a8968a', panel: '#221816', panel2: '#120c0b', line: '#7a5238', hp: '#b3122a', hp2: '#f0452a', warm: '#ff9a3c' },
    s: { sky1: '#2c1613', sky2: '#170c0b', sky3: '#060303', tree: '#140a09', tree2: '#0c0605', fog: '#4a2418', moon: '#ff9a50', enemy: '#1c0e0d', eye: '#ffd08a', gem: '#ff9a3c', orb: '#ffe9b0', warm: '#ff9a3c' } },
};
export const T = {
  1: { code: 'T1', name: 'Soft serif + clean sans', hf: "Georgia,'Palatino Linotype',serif", bf: "'Segoe UI',system-ui,sans-serif" },
  2: { code: 'T2', name: 'Engraved serif caps', hf: "'Palatino Linotype','Book Antiqua',Georgia,serif", bf: "Georgia,'Palatino Linotype',serif" },
  3: { code: 'T3', name: 'Tech grotesque', hf: "Bahnschrift,'Segoe UI Semibold','Arial Narrow',sans-serif", bf: "Bahnschrift,'Segoe UI',sans-serif" },
  4: { code: 'T4', name: 'Heavy condensed', hf: "Impact,'Arial Narrow','Arial Black',sans-serif", bf: "'Segoe UI',Arial,sans-serif" },
};
export const NAMES = {
  S: { 1: 'Glass', 2: 'Reliquary frames', 3: 'Cut-corner', 4: 'Slab' }, I: { 1: 'Glow disc', 2: 'Medallion', 3: 'Hex line', 4: 'Solid chamfer' },
  B: { 1: 'Glow pill', 2: 'Embossed', 3: 'Segmented', 4: 'Slashed' }, K: { 1: 'Icon-top', 2: 'Tarot', 3: 'Data card', 4: 'Slab poster' }, L: { 1: 'Glow serif', 2: 'Engraved caps', 3: 'Line-tech', 4: 'Ember slash' },
};
export const varsOf = (c, t) => Object.entries(C[c].v).map(([k, v]) => `--${k}:${v}`).join(';') + `;--hf:${T[t].hf};--bf:${T[t].bf}`;

const abs = (x, y, w, h, extra = '') => `left:${x}px;top:${y}px;${w != null ? `width:${w}px;` : ''}${h != null ? `height:${h}px;` : ''}${extra}`;
const poly = (c) => `polygon(${c}px 0,100% 0,100% calc(100% - ${c}px),calc(100% - ${c}px) 100%,0 100%,0 ${c}px)`;
const jag = 'polygon(0 10px,12px 0,100% 0,100% calc(100% - 16px),calc(100% - 14px) 100%,0 100%)';
const jag2 = 'polygon(0 8px,10px 0,100% 0,100% calc(100% - 13px),calc(100% - 11px) 100%,0 100%)';

function frameSvg(w, h, rare) {
  const st = rare ? `stroke:${rare}` : 'stroke:var(--line)';
  const corner = (tx, ty, sx, sy) => `<g transform="translate(${tx} ${ty}) scale(${sx} ${sy})" fill="none" style="${st}" stroke-width="1.4"><path d="M3 34 V12 Q3 3 12 3 H34"/><path d="M9 26 V15 Q9 9 15 9 H26"/><path d="M16 3 Q22 14 10 20"/><path d="M3 16 Q14 22 20 10"/><circle cx="3" cy="3" r="2.6" style="fill:${rare || 'var(--line)'};stroke:none"/></g>`;
  const dia = (x, y) => `<path d="M${x - 9} ${y} L${x} ${y - 6} L${x + 9} ${y} L${x} ${y + 6}Z" style="fill:var(--panel2);${st}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1.8" style="fill:${rare || 'var(--line)'}"/>`;
  return `<svg class="abs" style="left:0;top:0;overflow:visible" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="2" y="2" width="${w - 4}" height="${h - 4}" style="fill:var(--panel);${st}" stroke-width="2.4"/>
  <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" style="${st}" stroke-width=".9" opacity=".7"/>${corner(0, 0, 1, 1)}${corner(w, 0, -1, 1)}${corner(0, h, 1, -1)}${corner(w, h, -1, -1)}${dia(w / 2, 2)}${dia(w / 2, h - 2)}</svg>`;
}

// PANEL (style S). inner uses absolute coords relative to the panel.
export function P(S, x, y, w, h, inner = '', o = {}) {
  const c1 = o.c1 || 'var(--a)', c2 = o.c2 || 'var(--b)', pos = abs(x, y, w, h, o.sty || '');
  if (S === 1) return `<div class="abs" style="${pos};border-radius:${o.r ?? 16}px;border:1.5px solid transparent;background:linear-gradient(165deg,var(--panel),var(--panel2)) padding-box,linear-gradient(135deg,${c1},${c2}) border-box;box-shadow:0 0 ${o.sel ? 34 : 18}px ${cm(c1, o.sel ? 45 : 22)},inset 0 1px 0 rgba(255,255,255,.08)"><div class="abs" style="inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.06) 48%,transparent 58%)"></div>${inner}</div>`;
  if (S === 2) return `<div class="abs" style="${pos};${o.sel ? `filter:drop-shadow(0 0 14px ${cm(c1, 55)})` : ''}">${frameSvg(w, h, o.rare)}<div class="abs" style="inset:0">${inner}</div></div>`;
  if (S === 3) return `<div class="abs" style="${pos};filter:drop-shadow(0 0 ${o.sel ? 12 : 5}px ${cm(c1, o.sel ? 80 : 45)})"><div class="abs" style="inset:0;clip-path:${poly(14)};background:linear-gradient(135deg,${c1},${c2})"><div class="abs" style="inset:1.5px;clip-path:${poly(13)};background:linear-gradient(170deg,var(--panel),var(--panel2))"></div><i class="abs" style="left:18px;top:0;width:46px;height:3px;background:${c1};box-shadow:0 0 8px ${c1}"></i><i class="abs" style="right:18px;bottom:0;width:46px;height:3px;background:${c2};box-shadow:0 0 8px ${c2}"></i></div>${inner}</div>`;
  return `<div class="abs" style="${pos};filter:drop-shadow(6px 6px 0 rgba(0,0,0,.85))${o.sel ? ` drop-shadow(0 0 16px ${cm(c1, 60)})` : ''}"><div class="abs" style="inset:0;clip-path:${jag};background:${o.rare || (o.sel ? c1 : 'var(--line)')}"><div class="abs" style="inset:3px;clip-path:${jag2};background:repeating-linear-gradient(135deg,rgba(255,240,220,.035) 0 3px,transparent 3px 9px),linear-gradient(170deg,var(--panel),var(--panel2))"></div><i class="abs" style="left:0;top:0;width:42%;height:5px;background:${c1}"></i></div>${inner}</div>`;
}

export function BTN(S, label, x, y, w, h, primary) {
  const tx = `display:flex;align-items:center;justify-content:center;font-family:var(--hf);`;
  if (S === 1) return primary
    ? `<div class="abs" style="${abs(x, y, w, h)};${tx}border-radius:99px;background:linear-gradient(90deg,var(--a),var(--b));color:#06101e;font-weight:800;font-size:${h * .38}px;letter-spacing:2px;box-shadow:0 0 30px ${cm('var(--a)', 55)},0 0 60px ${cm('var(--b)', 35)},inset 0 2px 0 rgba(255,255,255,.5)">${label}</div>`
    : P(1, x, y, w, h, `<div class="abs" style="inset:0;${tx}font-size:${h * .34}px;color:var(--text);letter-spacing:1px">${label}</div>`, { r: h / 2 });
  if (S === 2) { const pp = 'polygon(14px 0,calc(100% - 14px) 0,100% 50%,calc(100% - 14px) 100%,14px 100%,0 50%)'; return `<div class="abs" style="${abs(x, y, w, h)};filter:drop-shadow(0 4px 6px #000)"><div class="abs" style="inset:0;clip-path:${pp};background:${primary ? 'var(--gold)' : 'var(--line)'}"><div class="abs" style="inset:2px;clip-path:${pp};background:linear-gradient(180deg,${primary ? 'color-mix(in srgb,var(--gold) 30%,var(--panel))' : 'var(--panel)'},var(--panel2));${tx}font-size:${h * .34}px;letter-spacing:5px;text-transform:uppercase;color:${primary ? 'var(--text)' : 'var(--mute)'};text-shadow:0 1px 0 #000">${label}</div></div></div>`; }
  if (S === 3) { const pp = 'polygon(18px 0,100% 0,calc(100% - 18px) 100%,0 100%)'; return `<div class="abs" style="${abs(x, y, w, h)};filter:drop-shadow(0 0 ${primary ? 14 : 5}px ${cm('var(--a)', primary ? 70 : 40)})"><div class="abs" style="inset:0;clip-path:${pp};background:var(--a)"><div class="abs" style="inset:1.5px;clip-path:${pp};${primary ? 'background:linear-gradient(90deg,var(--a),color-mix(in srgb,var(--a) 55%,var(--b)));color:#02131a;font-weight:800' : 'background:var(--panel2);color:var(--a)'};${tx}font-size:${h * .36}px;letter-spacing:6px;text-transform:uppercase">${label}</div></div></div>`; }
  return `<div class="abs" style="${abs(x, y, w, h)};filter:drop-shadow(5px 5px 0 #000)"><div class="abs" style="inset:0;clip-path:${jag};background:${primary ? 'var(--text)' : 'var(--line)'}"><div class="abs" style="inset:3px;clip-path:${jag2};${primary ? 'background:linear-gradient(180deg,var(--b),var(--a));color:#1c0c04' : 'background:var(--panel2);color:var(--text)'};${tx}font-size:${h * .5}px;letter-spacing:3px;text-transform:uppercase">${label}</div></div></div>`;
}

export function BADGE(S, text, col, x, y, extra = '') {
  const base = `${x == null ? 'position:relative;display:inline-block;' : `position:absolute;left:${x}px;top:${y}px;`}${extra}font-family:var(--hf);font-weight:800;font-size:11px;letter-spacing:2.5px;color:#0a0a10;background:${col};white-space:nowrap;`;
  if (S === 1) return `<span style="${base}padding:3px 11px;border-radius:99px;box-shadow:0 0 14px ${cm(col, 70)}">${text}</span>`;
  if (S === 2) return `<span style="${base}padding:4px 20px;clip-path:polygon(0 0,100% 0,calc(100% - 9px) 50%,100% 100%,0 100%,9px 50%);background:linear-gradient(180deg,color-mix(in srgb,${col} 80%,#fff),${col});font-size:12px;letter-spacing:3px">${text}</span>`;
  if (S === 3) return `<span style="${base}padding:3px 16px;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);filter:drop-shadow(0 0 6px ${col})">${text}</span>`;
  return `<span style="${base}padding:2px 16px;transform:skewX(-14deg);font-size:15px;font-family:var(--hf);box-shadow:3px 3px 0 #000">${text}</span>`;
}
export function KEY(S, n, x, y) {
  const b = `position:absolute;left:${x}px;top:${y}px;display:flex;align-items:center;justify-content:center;font-family:var(--hf);font-weight:700;`;
  if (S === 1) return `<span style="${b}width:28px;height:28px;border-radius:8px;border:1px solid ${cm('var(--text)', 30)};background:${cm('var(--text)', 8)};color:var(--mute);font-size:14px">${n}</span>`;
  if (S === 2) return `<span style="${b}width:22px;height:22px;transform:rotate(45deg);border:1.5px solid var(--line);background:var(--panel2);color:var(--text);font-size:12px"><b style="transform:rotate(-45deg);font-weight:700">${n}</b></span>`;
  if (S === 3) return `<span style="${b}width:30px;height:32px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:var(--a);color:#02131a;font-size:14px">${n}</span>`;
  return `<span style="${b}width:28px;height:28px;background:var(--text);color:#150b07;font-size:18px;box-shadow:3px 3px 0 #000">${n}</span>`;
}

const MODE = { 1: 'glow', 2: 'engrave', 3: 'line', 4: 'solid' };
export const ico = (I, name, size, col) => icon(name, size, col, MODE[I]);
export function IF(I, name, col, size, x, y, extra = '') {
  const pos = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${extra}`;
  const gl = ico(I, name, Math.round(size * .56), col);
  if (I === 1) return `<div style="${pos};border-radius:50%;background:radial-gradient(circle at 50% 38%,${cm(col, 34)},${cm(col, 5)} 72%);border:1.5px solid ${cm(col, 70)};box-shadow:0 0 18px ${cm(col, 45)},inset 0 0 14px ${cm(col, 25)}">${gl}</div>`;
  if (I === 2) return `<div style="${pos}"><svg class="abs" style="left:0;top:0" width="${size}" height="${size}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" style="fill:var(--panel2);stroke:var(--line)" stroke-width="3.5"/><circle cx="50" cy="50" r="39" fill="none" stroke="${col}" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="2 4"/><circle cx="50" cy="50" r="33" fill="${col}" fill-opacity=".1"/>${[[50, 3], [97, 50], [50, 97], [3, 50]].map(([a, b]) => `<path d="M${a - 5} ${b} L${a} ${b - 5} L${a + 5} ${b} L${a} ${b + 5}Z" style="fill:var(--line)"/>`).join('')}</svg>${gl}</div>`;
  if (I === 3) return `<div style="${pos};filter:drop-shadow(0 0 7px ${col})"><svg class="abs" style="left:0;top:0" width="${size}" height="${size}" viewBox="0 0 100 100"><polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="${col}" fill-opacity=".08" stroke="${col}" stroke-width="2.4"/><polygon points="50,15 83,33 83,67 50,85 17,67 17,33" fill="none" stroke="${col}" stroke-opacity=".4" stroke-width="1"/></svg>${gl}</div>`;
  return `<div style="${pos};clip-path:polygon(20% 0,100% 0,100% 80%,80% 100%,0 100%,0 20%);background:${col};filter:drop-shadow(3px 3px 0 #000)"><div style="position:absolute;inset:3px;clip-path:polygon(20% 0,100% 0,100% 80%,80% 100%,0 100%,0 20%);background:radial-gradient(circle at 50% 30%,#2a1a14,#0c0706)"></div><div style="position:relative">${gl}</div></div>`;
}

export function BAR(B, o) {
  const { x, y, w, h, pct, trail = pct, kind = 'hp', label = '' } = o;
  const c1 = kind === 'hp' ? 'var(--hp)' : 'var(--a)', c2 = kind === 'hp' ? 'var(--hp2)' : 'var(--b)';
  const lab = label ? `<div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center;font:700 ${Math.round(h * .55)}px var(--hf);color:#fff;text-shadow:0 1px 3px #000,0 0 6px #000;letter-spacing:1px">${label}</div>` : '';
  const pos = abs(x, y, w, h);
  if (B === 1) return `<div class="abs" style="${pos};filter:drop-shadow(0 0 9px ${cm(c1, 55)})"><div class="abs" style="inset:0;border-radius:${h}px;background:rgba(3,5,12,.7);border:1px solid rgba(255,255,255,.16);overflow:hidden"><div class="abs" style="left:0;top:0;bottom:0;width:${trail}%;background:rgba(255,255,255,.62);border-radius:${h}px"></div><div class="abs" style="left:0;top:0;bottom:0;width:${pct}%;border-radius:${h}px;background:linear-gradient(90deg,${c1},${c2})"></div><div class="abs" style="left:0;top:0;width:${pct}%;height:46%;border-radius:${h}px;background:linear-gradient(180deg,rgba(255,255,255,.4),transparent)"></div></div>${lab}</div>`;
  if (B === 2) return `<div class="abs" style="${pos}"><div class="abs" style="inset:0;border:${Math.max(2, h * .12)}px solid var(--line);border-radius:4px;background:#050304;box-shadow:inset 0 4px 7px #000,0 0 0 1px #000,0 2px 6px #000;overflow:hidden"><div class="abs" style="left:0;top:0;bottom:0;width:${trail}%;background:${cm(c1, 40)}"></div><div class="abs" style="left:0;top:0;bottom:0;width:${pct}%;background:linear-gradient(180deg,color-mix(in srgb,${c2} 80%,#fff),${c1} 45%,color-mix(in srgb,${c1} 55%,#000));box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 3px rgba(0,0,0,.5)"></div><div class="abs" style="inset:0;background:repeating-linear-gradient(90deg,transparent 0 ${w / 10 - 1}px,rgba(0,0,0,.4) ${w / 10 - 1}px ${w / 10}px)"></div></div><i class="abs" style="left:-5px;top:${h / 2 - 5}px;width:10px;height:10px;transform:rotate(45deg);background:var(--line);box-shadow:0 0 0 1px #000"></i><i class="abs" style="right:-5px;top:${h / 2 - 5}px;width:10px;height:10px;transform:rotate(45deg);background:var(--line);box-shadow:0 0 0 1px #000"></i>${lab}</div>`;
  if (B === 3) { const m = '-webkit-mask-image:repeating-linear-gradient(90deg,#000 0 11px,transparent 11px 14px)'; return `<div class="abs" style="${pos};filter:drop-shadow(0 0 7px ${cm(c1, 60)})"><div class="abs" style="inset:0;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);${m};background:rgba(255,255,255,.09)"></div><div class="abs" style="left:0;top:0;bottom:0;width:${trail}%;clip-path:polygon(8px 0,100% 0,100% 100%,0 100%);${m};background:rgba(255,255,255,.6)"></div><div class="abs" style="left:0;top:0;bottom:0;width:${pct}%;clip-path:polygon(8px 0,100% 0,100% 100%,0 100%);${m};background:linear-gradient(90deg,${c1},${c2})"></div>${lab}</div>`; }
  return `<div class="abs" style="${pos}"><div class="abs" style="inset:0;transform:skewX(-20deg);background:#080403;border:2px solid ${cm('var(--text)', 55)};box-shadow:4px 4px 0 #000;overflow:hidden"><div class="abs" style="left:0;top:0;bottom:0;width:${trail}%;background:${cm('var(--text)', 60)}"></div><div class="abs" style="left:0;top:0;bottom:0;width:${pct}%;background:repeating-linear-gradient(135deg,rgba(0,0,0,.28) 0 3px,transparent 3px 8px),linear-gradient(90deg,${c1},${c2});border-right:4px solid var(--text)"></div></div>${lab}</div>`;
}

export const LOGO = (L) => {
  const wrap = (inner) => `<div class="abs" style="left:240px;top:0;width:800px;text-align:center">${inner}</div>`;
  if (L === 1) return wrap(`<div style="font:600 118px/1.05 var(--hf);letter-spacing:4px;background:linear-gradient(180deg,#fff 15%,var(--a) 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 20px ${cm('var(--a)', 60)}) drop-shadow(0 0 60px ${cm('var(--b)', 50)})">Hollowlight</div><div style="margin:4px auto 0;width:420px;height:2px;background:linear-gradient(90deg,transparent,var(--a),var(--b),transparent);box-shadow:0 0 12px var(--a)"></div><div style="margin-top:12px;font:600 19px var(--bf);letter-spacing:13px;color:var(--b);text-transform:uppercase;text-shadow:0 0 14px ${cm('var(--b)', 80)}">Spirits of the Dusk</div>`);
  if (L === 2) return wrap(`<div style="font:700 84px/1.1 var(--hf);letter-spacing:11px;background:linear-gradient(180deg,var(--text) 30%,color-mix(in srgb,var(--line) 75%,var(--text)) 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 #000) drop-shadow(0 0 30px ${cm('var(--warm)', 50)})">HOLLOWLIGHT</div><svg width="520" height="26" viewBox="0 0 520 26" style="margin-top:2px"><g style="stroke:var(--line)" fill="none" stroke-width="1.5"><path d="M10 13 H220 M300 13 H510"/><path d="M220 13 q14 -12 24 -2 q6 6 -2 8 M300 13 q-14 -12 -24 -2 q-6 6 2 8"/><path d="M60 13 q10 -8 20 0 q-10 8 -20 0"/><path d="M460 13 q-10 -8 -20 0 q10 8 20 0"/></g><path d="M260 3 L272 13 L260 23 L248 13Z" style="fill:var(--gold);stroke:var(--panel2)" stroke-width="1.5"/></svg><div style="margin-top:2px;font:italic 24px var(--bf);letter-spacing:7px;color:color-mix(in srgb,var(--text) 80%,transparent)">Spirits of the Dusk</div>`);
  if (L === 3) return wrap(`<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:6px"><i style="width:150px;height:2px;background:linear-gradient(90deg,transparent,var(--a));box-shadow:0 0 8px var(--a)"></i><i style="width:10px;height:10px;transform:rotate(45deg);border:2px solid var(--a)"></i><i style="width:150px;height:2px;background:linear-gradient(270deg,transparent,var(--a));box-shadow:0 0 8px var(--a)"></i></div><div style="font:300 92px/1.05 var(--hf);letter-spacing:15px;-webkit-text-stroke:1.6px var(--a);-webkit-text-fill-color:transparent;background:linear-gradient(180deg,${cm('var(--a)', 0)} 30%,${cm('var(--a)', 38)});-webkit-background-clip:text;filter:drop-shadow(0 0 14px var(--a)) drop-shadow(0 0 40px ${cm('var(--b)', 50)});text-transform:uppercase">Hollowlight</div><div style="margin-top:8px;font:600 17px var(--hf);letter-spacing:11px;color:var(--b);text-shadow:0 0 12px var(--b)">// SPIRITS OF THE DUSK //</div>`);
  return wrap(`<div style="font:400 128px/1 var(--hf);letter-spacing:3px;text-transform:uppercase;transform:skewX(-8deg);background:linear-gradient(180deg,var(--text) 25%,var(--b) 58%,var(--a) 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(5px 6px 0 #000) drop-shadow(0 0 28px ${cm('var(--a)', 55)})">Hollowlight</div><div style="display:inline-block;margin-top:8px;padding:2px 34px;transform:skewX(-8deg);background:linear-gradient(90deg,transparent,var(--line) 15%,var(--a) 50%,var(--line) 85%,transparent);font:400 22px var(--hf);letter-spacing:9px;color:#1a0c06;text-transform:uppercase">Spirits of the Dusk</div>`);
};

export function decor(S) {
  if (S === 1) return [380, 700, 930].map((x, i) => `<div class="abs" style="left:${x}px;top:-60px;width:${90 + i * 30}px;height:720px;background:linear-gradient(180deg,${cm('var(--a)', 16)},transparent 80%);transform:skewX(-22deg);filter:blur(12px)"></div>`).join('');
  if (S === 2) { const candle = (x, y) => `<div class="abs" style="left:${x - 90}px;top:${y - 150}px;width:180px;height:180px;background:radial-gradient(circle,${cm('var(--warm)', 40)},transparent 70%)"></div><svg class="abs" style="left:${x - 10}px;top:${y - 70}px" width="20" height="80" viewBox="0 0 20 80"><rect x="3" y="26" width="14" height="52" rx="2" fill="#d8c8a0"/><rect x="3" y="26" width="5" height="52" fill="#fff" opacity=".25"/><path d="M10 2 C17 12 16 22 10 25 C4 22 3 12 10 2Z" style="fill:var(--warm)"/><path d="M10 10 C13 15 12 20 10 22 C8 20 7 15 10 10Z" fill="#fff6d0"/></svg>`; return candle(70, 470) + candle(1210, 470) + candle(70, 330).replace(/left:-?\d+px;top:\d+px;width:180/, (m) => m) + `<div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 100%,${cm('var(--warm)', 10)},transparent 60%)"></div>`; }
  if (S === 3) return `<div class="abs" style="inset:0;background:repeating-linear-gradient(0deg,rgba(120,255,255,.035) 0 1px,transparent 1px 3px)"></div>` + [[8, 8, 1, 1], [1272, 8, -1, 1], [8, H - 8, 1, -1], [1272, H - 8, -1, -1]].map(([x, y, a, b]) => `<svg class="abs" style="left:${x - (a < 0 ? 60 : 0)}px;top:${y - (b < 0 ? 60 : 0)}px" width="60" height="60" viewBox="0 0 60 60"><path d="M${a > 0 ? 0 : 60} ${b > 0 ? 40 : 20} V${b > 0 ? 0 : 60} H${a > 0 ? 40 : 20}" fill="none" stroke="#19f0ff" stroke-width="2" style="filter:drop-shadow(0 0 5px #19f0ff)"/></svg>`).join('');
  let o = `<div class="abs" style="inset:0;background:linear-gradient(0deg,${cm('var(--b)', 22)},transparent 35%)"></div>`;
  for (let i = 0; i < 40; i++) { const x = (i * 337) % 1280, y = 40 + ((i * 211) % 540), r = 1.2 + (i % 4) * .7; o += `<i class="abs" style="left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:var(--${i % 3 ? 'a' : 'b'});box-shadow:0 0 ${r * 4}px var(--a);opacity:.85"></i>`; }
  for (let i = 0; i < 22; i++) { const x = (i * 571) % 1280, y = (i * 149) % 600; o += `<i class="abs" style="left:${x}px;top:${y}px;width:6px;height:3px;background:var(--text);opacity:.18;transform:rotate(${i * 37}deg)"></i>`; }
  return o;
}

export function sceneFor(c, S, opt) { return scene({ a: C[c].v.a, b: C[c].v.b, ...C[c].s, warm: C[c].s.warm }, opt) + decor(S); }
export { figure, icon, scene };
