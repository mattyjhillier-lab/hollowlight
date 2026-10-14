import { H, C, T, NAMES, cm, P, BTN, BADGE, KEY, IF, ico, BAR, LOGO, sceneFor, figure, icon, varsOf } from './parts.mjs';

const WEAP = [['wolf', 'Ghost Wolves', 'var(--a)', 3], ['raven', 'Raven Flock', 'var(--b)', 2], ['bolt', 'Spirit Bolts', 'var(--orb2)', 3], ['orb', 'Holy Orbit', 'var(--a)', 1]];
const D = [
  { k: 'stat', icon: 'wolf', title: 'Wolf Speed', cat: 'GHOST WOLVES · STAT', desc: 'Your wolves lunge faster at their prey.', read: '90 → 104  (+14 speed)', rank: 1, max: 5 },
  { k: 'new', icon: 'lightning', title: 'Chain Lightning', cat: 'NEW WEAPON', desc: 'Lightning strikes the nearest enemy and jumps between foes.', read: 'Damage 12 · Jumps 3', rank: 0, max: 5 },
  { k: 'evolve', icon: 'wolf', title: 'Pouncing Pack', cat: 'EVOLUTION · GHOST WOLVES', desc: 'Wolves leap, pin and maul their prey.', read: 'Speed MAX + Bite MAX', rank: 5, max: 5 },
];
const colOf = (k) => (k === 'evolve' ? 'var(--gold)' : k === 'new' ? 'var(--b)' : 'var(--a)');

function pips(K, n, max, col) {
  const sty = { 1: 'width:26px;height:7px;border-radius:9px', 2: 'width:10px;height:10px;transform:rotate(45deg);margin:0 4px', 3: 'width:34px;height:8px;clip-path:polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)', 4: 'width:28px;height:13px;transform:skewX(-20deg);box-shadow:2px 2px 0 #000' }[K];
  return `<div style="display:flex;gap:${K === 2 ? 3 : 6}px;align-items:center">${Array.from({ length: max }, (_, i) => `<i style="${sty};background:${i < n ? col : 'rgba(255,255,255,.13)'};${i < n && K !== 4 ? `box-shadow:0 0 8px ${col}` : ''}"></i>`).join('')}</div>`;
}
const ctr = (top, w, inner, extra = '') => `<div class="abs" style="left:0;top:${top}px;width:${w}px;display:flex;justify-content:center;text-align:center;${extra}">${inner}</div>`;

export function card(cb, d, i, x, y, sel = false, w = 290, h = 380) {
  const { S, I, K } = cb, col = colOf(d.k), rare = d.k === 'evolve';
  const o = { sel, c1: col, c2: rare ? 'var(--gold)' : d.k === 'new' ? 'var(--a)' : 'var(--b)', rare: rare ? 'var(--gold)' : undefined };
  const badge = d.k === 'stat' ? '' : BADGE(S, d.k === 'new' ? 'NEW' : 'EVOLVE', col, null, null);
  const titleC = rare ? 'var(--gold)' : 'var(--text)';
  const descC = 'color-mix(in srgb,var(--text) 78%,transparent)';
  let inner;
  if (K === 1) inner = `<div class="abs" style="left:0;top:0;width:${w}px;height:190px;background:radial-gradient(ellipse at 50% 35%,${cm(col, 30)},transparent 70%)"></div>
    <div class="abs" style="left:14px;top:14px">${d.k === 'stat' ? '' : badge.replace('position:relative;display:inline-block;', 'position:relative;display:inline-block;')}</div>${KEY(S, i + 1, w - 44, 12)}${IF(I, d.icon, col, 100, (w - 100) / 2, 36)}
    ${ctr(158, w, `<span style="font:600 27px var(--hf);color:${titleC};${rare ? `text-shadow:0 0 16px ${cm(col, 70)}` : ''}">${d.title}</span>`)}
    ${ctr(204, w, `<span style="font:400 15px/1.4 var(--bf);color:${descC};padding:0 26px">${d.desc}</span>`)}
    ${ctr(272, w, `<span style="font:600 14px var(--hf);color:${col}">${d.read}</span>`)}
    ${ctr(h - 74, w, pips(1, d.rank, d.max, col))}${ctr(h - 36, w, `<span style="font:600 11px var(--bf);letter-spacing:2.5px;color:var(--mute)">${d.cat}</span>`)}`;
  else if (K === 2) inner = `<div class="abs" style="left:0;top:0;width:${w}px;height:200px;background:radial-gradient(ellipse at 50% 38%,${cm(col, 20)},transparent 68%)"></div>
    ${KEY(S, i + 1, w / 2 - 11, 20)}${IF(I, d.icon, col, 112, (w - 112) / 2, 52)}
    <svg class="abs" style="left:${(w - 220) / 2}px;top:176px" width="220" height="16" viewBox="0 0 220 16"><g fill="none" style="stroke:${rare ? 'var(--gold)' : 'var(--line)'}" stroke-width="1.3"><path d="M4 8 H90 M130 8 H216"/><path d="M90 8 q8 -8 14 -1 M130 8 q-8 -8 -14 -1"/></g><path d="M110 2 L116 8 L110 14 L104 8Z" style="fill:${rare ? 'var(--gold)' : 'var(--line)'}"/></svg>
    ${ctr(196, w, `<span style="font:700 21px var(--hf);letter-spacing:3px;text-transform:uppercase;color:${titleC};text-shadow:0 2px 0 #000">${d.title}</span>`)}
    ${ctr(228, w, `<span style="font:italic 15px/1.4 var(--bf);color:${descC};padding:0 28px">${d.desc}</span>`)}
    ${ctr(h - 90, w, `<span style="font:600 13px var(--hf);letter-spacing:1px;color:${col}">${d.read}</span>`)}
    ${ctr(h - 66, w, pips(2, d.rank, d.max, col))}${ctr(h - 38, w, d.k === 'stat' ? `<span style="font:600 11px var(--bf);letter-spacing:3px;color:var(--mute)">${d.cat}</span>` : badge)}`;
  else if (K === 3) inner = `<div class="abs" style="left:18px;top:14px;font:600 11px Consolas,monospace;letter-spacing:2px;color:${col}">UPGRADE // 0${i + 1}</div>${KEY(S, i + 1, w - 48, 10)}
    <div class="abs" style="left:14px;top:46px;width:${w - 28}px;height:1px;background:linear-gradient(90deg,${col},transparent)"></div>
    ${IF(I, d.icon, col, 90, 18, 62)}
    <div class="abs" style="left:122px;top:70px;width:${w - 134}px;font:600 24px/1.1 var(--hf);text-transform:uppercase;letter-spacing:1px;color:${titleC}">${d.title}</div>
    <div class="abs" style="left:122px;top:128px;font:600 11px Consolas,monospace;letter-spacing:1.5px;color:var(--mute)">${d.cat}</div>
    <div class="abs" style="left:18px;top:172px;width:${w - 36}px;font:400 15px/1.45 var(--bf);color:${descC}">${d.desc}</div>
    <div class="abs" style="left:18px;top:252px;width:${w - 36}px;padding:7px 10px;border:1px solid ${cm(col, 45)};background:${cm(col, 9)};font:600 13px Consolas,monospace;color:${col}">&gt; ${d.read}</div>
    <div class="abs" style="left:18px;top:${h - 78}px;font:600 10px Consolas,monospace;letter-spacing:2px;color:var(--mute)">RANK ${d.rank}/${d.max}</div>
    <div class="abs" style="left:18px;top:${h - 58}px">${pips(3, d.rank, d.max, col)}</div><div class="abs" style="left:${w - 90}px;top:${h - 44}px">${d.k === 'stat' ? '' : badge}</div>`;
  else inner = `<div class="abs" style="left:0;top:0;width:${w}px;height:160px;background:repeating-linear-gradient(135deg,${cm(col, 22)} 0 14px,transparent 14px 28px),linear-gradient(180deg,${cm(col, 24)},transparent)"></div>
    ${IF(I, d.icon, col, 112, 22, 22)}${d.k === 'stat' ? '' : `<div class="abs" style="right:14px;top:18px">${badge.replace('position:relative', 'position:relative;transform:skewX(-14deg) scale(1.15)')}</div>`}
    <div class="abs" style="left:22px;top:150px;width:${w - 44}px;font:400 33px/1 var(--hf);text-transform:uppercase;letter-spacing:1px;color:${titleC};text-shadow:3px 3px 0 #000">${d.title}</div>
    <div class="abs" style="left:22px;top:214px;width:${w - 44}px;font:400 15px/1.4 var(--bf);color:${descC}">${d.desc}</div>
    <div class="abs" style="left:22px;top:276px;font:400 18px var(--hf);letter-spacing:1px;color:${col}">${d.read}</div>
    <div class="abs" style="left:22px;top:${h - 50}px">${pips(4, d.rank, d.max, col)}</div>${KEY(S, i + 1, w - 48, h - 52)}`;
  return P(S, x, y - (sel ? 14 : 0), w, h, inner, o);
}

export function title(cb) {
  const { S, C: c, I, L } = cb;
  const v = C[c].v;
  let h = sceneFor(c, S, { seed: 3, moon: { x: 640, y: 100 }, id: 't' });
  h += `<div class="abs" style="left:0;top:14px;width:1280px;height:200px">${LOGO(L)}</div>`;
  const chars = [{ n: 'Wren', f: 'wren', col: v.a, w: ['wolf', 'Ghost Wolves'], ab: 'Pack Howl', sel: true, x: 350 }, { n: 'Elias', f: 'elias', col: v.b, w: ['orb', 'Holy Orbit'], ab: 'Sanctuary', sel: false, x: 650 }];
  for (const ch of chars) {
    h += `<div style="opacity:${ch.sel ? 1 : .72}">` + P(S, ch.x, 232, 280, 262, `${IF(I, ch.w[0], ch.col, 46, 12, 12)}${ch.sel ? `<div class="abs" style="right:14px;top:18px;font:700 10px var(--bf);letter-spacing:3px;color:var(--a)">SELECTED</div>` : ''}
      <div class="abs" style="left:95px;top:30px">${figure(ch.f, ch.col, 140, 'fg' + ch.f)}</div>
      ${ctr(184, 280, `<span style="font:600 27px var(--hf);letter-spacing:3px;text-transform:uppercase;color:var(--text);text-shadow:0 0 12px ${cm(ch.col, 60)}">${ch.n}</span>`)}
      ${ctr(222, 280, `<span style="font:400 14px var(--bf);color:var(--mute)">${ch.w[1]} · ${ch.ab}</span>`)}`, { sel: ch.sel, c1: ch.col }) + '</div>';
  }
  h += BTN(S, 'PLAY', 420, 520, 260, 62, true) + BTN(S, 'SETTINGS', 700, 520, 170, 62, false);
  h += `<div class="abs" style="right:20px;bottom:12px;font:600 14px var(--bf);color:var(--mute);letter-spacing:1px">v0.3.0</div><div class="abs" style="left:20px;bottom:12px;font:400 12px var(--bf);color:var(--mute)">[ A / D ] choose · [ Enter ] play</div>`;
  return h;
}

export function hud(cb) {
  const { S, C: c, I, B } = cb;
  let h = sceneFor(c, S, { seed: 11, actors: true, id: 'h', grid: S === 3 });
  const g = ico(I, 'heart', 30, 'var(--hp2)');
  h += IF(I, 'heart', 'var(--hp2)', 58, 16, 12);
  h += BAR(B, { x: 86, y: 14, w: 400, h: 30, pct: 77, trail: 90, kind: 'hp', label: '46 / 60' });
  h += BAR(B, { x: 86, y: 52, w: 400, h: 13, pct: 62, kind: 'xp' });
  h += `<div class="abs" style="left:496px;top:46px;font:700 18px var(--hf);color:var(--text);letter-spacing:1px;text-shadow:0 0 8px var(--a)">LV 7</div>`;
  h += P(S, 560, 12, 160, 56, `<div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center;gap:10px;font:600 32px var(--hf);color:var(--text);letter-spacing:2px">${ico(I, 'clock', 24, 'var(--mute)')}04:27</div>`, { r: 28 });
  h += P(S, 1030, 12, 112, 42, `<div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center;gap:8px;font:600 20px var(--hf);color:var(--text)">${ico(I, 'skull', 22, 'var(--text)')}214</div>`, { r: 21 });
  h += P(S, 1152, 12, 112, 42, `<div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center;gap:8px;font:600 20px var(--hf);color:var(--text)">${ico(I, 'coin', 22, 'var(--text)')}138</div>`, { r: 21 });
  WEAP.forEach(([n, , col, rank], i) => {
    h += P(S, 18 + i * 98, H - 108, 88, 90, `${IF(I, n, col.replace('--orb2', '--text'), 50, 19, 9)}<div class="abs" style="left:6px;top:4px;font:700 11px var(--bf);color:var(--mute)">${i + 1}</div><div class="abs" style="left:0;top:66px;width:88px;display:flex;justify-content:center;gap:4px">${Array.from({ length: 5 }, (_, k) => `<i style="width:9px;height:5px;border-radius:2px;background:${k < rank ? col.replace('--orb2', '--text') : 'rgba(255,255,255,.14)'}"></i>`).join('')}</div>`, { r: 14, c1: col.replace('--orb2', '--text') });
  });
  const cx = 1146, cy = H - 128, R = 56;
  h += `<div class="abs" style="left:880px;top:${H - 100}px;width:250px;text-align:right"><div style="font:600 19px var(--hf);letter-spacing:2px;color:var(--text);text-transform:uppercase">Pack Howl</div><div style="margin-top:4px;font:600 12px var(--bf);color:var(--mute)">[ SPACE ] · ready in 18s</div></div>`;
  h += IF(I, 'wolf', 'var(--b)', 90, cx + 11, cy + 11) + `<div class="abs" style="left:${cx + 11}px;top:${cy + 11}px;width:90px;height:90px;border-radius:50%;background:rgba(2,3,8,.55);display:flex;align-items:center;justify-content:center;font:700 30px var(--hf);color:#fff;text-shadow:0 0 8px #000">18</div>
  <svg class="abs" style="left:${cx}px;top:${cy}px" width="112" height="112" viewBox="0 0 112 112"><circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="5"/><circle cx="56" cy="56" r="52" fill="none" style="stroke:var(--b);filter:drop-shadow(0 0 6px var(--b))" stroke-width="5" stroke-linecap="${S === 4 || S === 3 ? 'butt' : 'round'}" stroke-dasharray="${(2 * Math.PI * 52 * .68).toFixed(1)} 400" transform="rotate(-90 56 56)"/></svg>`;
  return h;
}

export function levelup(cb) {
  const { S, C: c } = cb;
  let h = `<div class="abs" style="inset:0;filter:blur(5px) brightness(.5);transform:scale(1.03)">${sceneFor(c, S, { seed: 11, actors: true, id: 'l' })}</div><div class="abs" style="inset:0;background:rgba(2,3,8,.45)"></div>`;
  h += `<div class="abs" style="left:0;top:22px;width:1280px;text-align:center"><div style="font:600 46px var(--hf);letter-spacing:6px;text-transform:uppercase;color:var(--text);text-shadow:0 0 24px ${cm('var(--a)', 70)}">Level Up</div><div style="margin-top:4px;font:600 15px var(--bf);letter-spacing:7px;color:var(--a)">LEVEL 8 · CHOOSE ONE</div></div>`;
  D.forEach((d, i) => { h += card(cb, d, i, 169 + i * 326, 124, i === 0); });
  h += BTN(S, 'REROLL (R) · 2', 390, 536, 250, 48, false) + BTN(S, 'BANISH (B) · 2', 660, 536, 250, 48, false);
  return h;
}

// ---- parts sheet ----
function cell(i, code, ttl, inner) {
  const x = 16 + (i % 4) * 313, y = 12 + Math.floor(i / 4) * 296;
  return `<div class="abs" style="left:${x}px;top:${y}px;width:301px;height:284px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.34)"><div class="abs" style="left:0;top:0;width:100%;padding:6px 10px;background:rgba(255,255,255,.1);font:700 12px Consolas,monospace;letter-spacing:.5px;color:#fff;white-space:nowrap"><span style="color:var(--a)">${code}</span> · ${ttl}</div>${inner}</div>`;
}
export function parts(cb) {
  const { S, C: c, T: t, I, B, K, L } = cb;
  const v = C[c].v;
  let h = `<div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 40%,${C[c].s.sky1},${C[c].s.sky3})"></div>`;
  h += cell(0, 'L' + L, 'LOGO · ' + NAMES.L[L], `<div class="abs" style="left:${-240 * .37 + 8}px;top:70px;width:1280px;transform:scale(.37);transform-origin:0 0">${LOGO(L)}</div>`);
  h += cell(1, 'C' + c, 'COLOUR · ' + C[c].name, C[c].sw.map(([hex, n], k) => `<div class="abs" style="left:14px;top:${38 + k * 48}px;width:44px;height:40px;border-radius:6px;background:${hex};border:1px solid rgba(255,255,255,.4)"></div><div class="abs" style="left:70px;top:${40 + k * 48}px;font:700 15px 'Segoe UI';color:#fff">${n}</div><div class="abs" style="left:70px;top:${60 + k * 48}px;font:12px Consolas,monospace;color:#aab">${hex}</div>`).join(''));
  h += cell(2, 'T' + t, 'TYPE · ' + T[t].name, `<div class="abs" style="left:14px;top:44px;font:600 36px var(--hf);color:var(--text)">Level Up</div><div class="abs" style="left:14px;top:96px;font:600 21px var(--hf);color:var(--a);letter-spacing:2px">GHOST WOLVES</div><div class="abs" style="left:14px;top:136px;width:270px;font:400 15px/1.4 var(--bf);color:var(--text)">Lightning strikes the nearest enemy and jumps between foes.</div><div class="abs" style="left:14px;top:206px;font:600 30px var(--hf);color:var(--text);letter-spacing:2px">04:27 · 214 · 138</div><div class="abs" style="left:14px;top:254px;font:10px Consolas,monospace;color:#889">${T[t].hf.split(',')[0]} / ${T[t].bf.split(',')[0]}</div>`);
  h += cell(3, 'S' + S, 'STYLE · ' + NAMES.S[S] + ' (panel/button/badge/key)', `${P(S, 16, 40, 268, 84, `<div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center;font:600 20px var(--hf);color:var(--text)">Panel</div>`, { sel: true })}${BTN(S, 'PLAY', 16, 146, 150, 46, true)}${BTN(S, 'MENU', 178, 146, 108, 46, false)}${BADGE(S, 'NEW', 'var(--b)', 20, 216)}${BADGE(S, 'EVOLVE', 'var(--gold)', 100, 216)}${KEY(S, 1, 214, 214)}${KEY(S, 2, 250, 214)}`);
  h += cell(4, 'B' + B, 'BARS · ' + NAMES.B[B], `${BAR(B, { x: 20, y: 52, w: 260, h: 28, pct: 76, trail: 90, label: '46 / 60' })}<div class="abs" style="left:20px;top:88px;font:11px Consolas,monospace;color:#aab">HP + damage trail</div>${BAR(B, { x: 20, y: 130, w: 260, h: 28, pct: 28, trail: 28, label: '17 / 60' })}<div class="abs" style="left:20px;top:166px;font:11px Consolas,monospace;color:#aab">HP low</div>${BAR(B, { x: 20, y: 206, w: 260, h: 13, pct: 62, kind: 'xp' })}<div class="abs" style="left:20px;top:228px;font:11px Consolas,monospace;color:#aab">XP</div>`);
  h += cell(5, 'I' + I, 'ICONS · ' + NAMES.I[I], ['wolf', 'raven', 'bolt', 'lightning', 'orb'].map((n, k) => IF(I, n, k % 2 ? 'var(--b)' : 'var(--a)', 50, 12 + k * 57, 44)).join('') + ['heart', 'skull', 'coin', 'clock'].map((n, k) => `<div class="abs" style="left:${22 + k * 60}px;top:130px">${ico(I, n, 34, 'var(--text)')}</div>`).join('') + `<div class="abs" style="left:14px;top:180px;font:11px Consolas,monospace;color:#aab">frames + 5 weapons / 4 HUD glyphs</div>`);
  h += cell(6, 'K' + K, 'CARDS · ' + NAMES.K[K], `<div class="abs" style="left:50px;top:30px;width:290px;height:380px;transform:scale(.66);transform-origin:0 0">${card(cb, D[2], 2, 0, 0, false)}</div>`);
  const cx = 150;
  h += cell(7, 'S' + S + '+I' + I, 'HUD pieces: slot, timer, ability', `${P(S, 16, 44, 88, 90, `${IF(I, 'wolf', 'var(--a)', 50, 19, 9)}<div class="abs" style="left:0;top:66px;width:88px;display:flex;justify-content:center;gap:4px">${[1, 1, 1, 0, 0].map((x) => `<i style="width:9px;height:5px;border-radius:2px;background:${x ? 'var(--a)' : 'rgba(255,255,255,.14)'}"></i>`).join('')}</div>`, { r: 14 })}${P(S, 120, 44, 150, 50, `<div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center;font:600 28px var(--hf);color:var(--text)">04:27</div>`, { r: 25 })}${IF(I, 'wolf', 'var(--b)', 80, 150, 130)}<svg class="abs" style="left:144px;top:124px" width="92" height="92" viewBox="0 0 112 112"><circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="5"/><circle cx="56" cy="56" r="52" fill="none" style="stroke:var(--b)" stroke-width="5" stroke-dasharray="222 400" transform="rotate(-90 56 56)"/></svg><div class="abs" style="left:16px;top:160px;font:11px Consolas,monospace;color:#aab;width:110px">weapon slot<br>+ ability cooldown ring</div>`);
  return h;
}

export const DIRS = [
  { n: 1, name: 'MOONLIT GLASS PLUS', line: 'Evolution of the current glass UI: icon-led cards, glow borders, rounded glowing bars, modern mobile polish.', cb: { S: 1, C: 1, T: 1, I: 1, B: 1, K: 1, L: 1 } },
  { n: 2, name: 'GOTHIC RELIQUARY', line: 'Ornate dark fantasy: filigree frames, engraved serif, bronze trim, gold only for evolutions, candle-glow.', cb: { S: 2, C: 2, T: 2, I: 2, B: 2, K: 2, L: 2 } },
  { n: 3, name: 'NEON SPIRIT HUD', line: 'Sleek futuristic-arcane: cut-corner panels, thin neon line-work, segmented bars, hex icons, holo glow.', cb: { S: 3, C: 3, T: 3, I: 3, B: 3, K: 3, L: 3 } },
  { n: 4, name: 'EMBER & ASH', line: 'Brutal warm look: charcoal slabs, bone-white type, ember orange glow, heavy condensed caps, hard shadows.', cb: { S: 4, C: 4, T: 4, I: 4, B: 4, K: 4, L: 4 } },
];
export const legendOf = (cb) => `S${cb.S} ${NAMES.S[cb.S]} + C${cb.C} ${C[cb.C].name} + T${cb.T} + I${cb.I} ${NAMES.I[cb.I]} + B${cb.B} ${NAMES.B[cb.B]} + K${cb.K} ${NAMES.K[cb.K]} + L${cb.L} ${NAMES.L[cb.L]}`;
export const metaOf = (label, line, legend, cb) => ({ label, line, legend, cb, palette: C[cb.C].sw, pal0: C[cb.C].v.a, bg: '#05060b', vars: varsOf(cb.C, cb.T), css: '' });
