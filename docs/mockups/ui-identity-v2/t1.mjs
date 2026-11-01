// TAKE 1 "LANTERN GLASS, LIT": round-1 skeleton (glass, brass, thread, wick) re-painted in Style v1.
// Changes vs round 1: chunky rounded lantern-window shapes, L2 tinted outline + brass band + top rim light (H2),
// cool Hollow-blue glass lit warm from a lantern cap (the game's P1 split), hand-wobbled frames, grain + glass streaks,
// glowing thread with knots (like the in-game trails), painted icons, drawn wordmark, mixed-case display type.
import { GRAIN, STREAK, flame } from './lib.mjs';
const F = '../../../src/assets/fonts/';
export const head = `<style>@font-face{font-family:'Hollowlight Chancery';src:url(${F}hollowlight-chancery.woff2) format('woff2')}
@font-face{font-family:'Hollowlight Chancery';font-style:italic;src:url(${F}hollowlight-chancery-italic.woff2) format('woff2')}
@font-face{font-family:'Alegreya Sans';font-weight:400;src:url(${F}alegreya-sans-400.woff2) format('woff2')}
@font-face{font-family:'Alegreya Sans';font-weight:700 800;src:url(${F}alegreya-sans-700.woff2) format('woff2')}</style>`;

const cap = `<svg class="cap" width="74" height="46" viewBox="0 0 74 46" aria-hidden="true"><defs><linearGradient id="cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c4"/><stop offset=".5" stop-color="#d9ab5c"/><stop offset="1" stop-color="#8a5d27"/></linearGradient><radialGradient id="cw"><stop offset="0" stop-color="#fff2c8"/><stop offset="1" stop-color="#ff9a2e"/></radialGradient></defs>
<circle cx="37" cy="9" r="6" fill="none" stroke="#3a2412" stroke-width="6"/><circle cx="37" cy="9" r="6" fill="none" stroke="url(#cb)" stroke-width="2.6"/>
<path d="M10 40 Q37 4 64 40Z" fill="url(#cb)" stroke="#3a2412" stroke-width="3" stroke-linejoin="round"/><rect x="29" y="27" width="16" height="11" rx="5" fill="url(#cw)" stroke="#3a2412" stroke-width="2"/><path d="M18 30 Q37 12 56 30" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/></svg>`;
const seal = (big) => `<span class="seal${big ? ' big' : ''}"><svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><defs><radialGradient id="sg" cx=".35" cy=".3"><stop offset="0" stop-color="#fff2b8"/><stop offset=".55" stop-color="#ffcf5a"/><stop offset="1" stop-color="#b47c1e"/></radialGradient></defs><path d="M22 2 C27 4 30 2 33 6 C36 9 41 10 40 15 C39 19 43 23 40 27 C37 31 39 36 34 38 C30 40 27 43 22 41 C17 43 13 40 10 38 C5 36 6 31 4 27 C1 23 5 19 4 15 C3 10 8 9 11 6 C14 2 17 4 22 2Z" fill="url(#sg)" stroke="#6b4512" stroke-width="2.2"/><circle cx="22" cy="22" r="11" fill="none" stroke="#a8741e" stroke-width="1.6"/><path d="M22 13 L24.6 19.5 L31 20 L26 24.2 L27.6 31 L22 27.3 L16.4 31 L18 24.2 L13 20 L19.4 19.5Z" fill="#8a5d18"/><path d="M10 13 Q14 6 21 5" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/></svg><b>Evolve</b></span>`;
const flag = () => `<span class="flag"><svg width="64" height="30" viewBox="0 0 64 30" aria-hidden="true"><path d="M2 3 H62 L54 15 L62 27 H2Z" fill="#6fd3c5" stroke="#1f5a52" stroke-width="2.4" stroke-linejoin="round"/><path d="M5 6 H54" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></svg><b>New</b></span>`;
const wick = (s) => `<svg class="wick ${s}" width="22" height="30" viewBox="0 0 22 30" aria-hidden="true">${s === 'lit' ? '<circle cx="11" cy="11" r="10" fill="#ffab3a" opacity=".35" filter="url(#glow2)"/><path d="M11 1 C16 7 18 11 17 15 C16 19 13 21 11 21 C9 21 6 19 5 15 C4 11 7 7 11 1Z" fill="#ffab3a" stroke="#8a3f10" stroke-width="1.6"/><path d="M11 10 C13 12 13 15 11 17 C9 15 9 12 11 10Z" fill="#fff4d0"/>' : s === 'ember' ? '<circle cx="11" cy="19" r="4" fill="#ff7a2a" opacity=".5" filter="url(#glow2)"/><circle cx="11" cy="19" r="2.6" fill="#ff8a3a" stroke="#6b2a0c" stroke-width="1.2"/>' : '<path d="M11 13 C13 15 12 18 11 20" stroke="#4a3a2e" stroke-width="2" fill="none"/>'}<rect x="9.6" y="20" width="2.8" height="8" rx="1" fill="#2a1d14"/></svg>`;

export const O = {
  take: 't1',
  panelTop: () => `<span class="ptop">${cap}</span>`,
  cardTop: (k) => `<span class="hang"><i></i>${cap}</span>`,
  badgeEvo: (inline) => seal(inline), badgeNew: () => flag(),
  pip: (on) => `<i class="pip${on ? ' on' : ''}"></i>`,
  btnMark: (k) => k === 'primary' ? `<span class="mk">${flame(16, 1)}</span>` : k === 'danger' || k === 'quiet' ? '' : `<span class="mk off">${flame(14, 0)}</span>`,
  divider: (label, aside) => `<div class="div">${label ? `<span class="dl">${label}</span>` : ''}<i></i><b></b><i></i>${aside ? `<span class="da">${aside}</span>` : ''}</div>`,
  wick,
  toggle: (on) => `<span class="tog${on ? ' on' : ''}" role="switch" aria-checked="${on}"><i class="frame"></i><span class="th">${on ? flame(12, 1) : ''}</span><em>${on ? 'On' : 'Off'}</em></span>`,
  tab: (l, a, lock) => `<span class="tab${a ? ' a' : ''}${lock ? ' lk' : ''}"><i class="frame"></i>${a ? flame(11, 1) : ''}${l}</span>`,
  tooltip: () => `<div class="tip"><i class="frame"></i><span class="eye"></span><b>Ghost Wolves</b><span>Wolves hunt separate foes.</span><small>Rank 2 of 5 · next: +1 wolf</small><em>The pack remembers you.</em></div>`,
};

const glass = `radial-gradient(110% 70% at 50% -6%,rgba(255,190,110,.30),rgba(255,160,70,.08) 45%,transparent 70%),linear-gradient(180deg,rgba(46,58,82,.90),rgba(22,28,42,.94))`;
const band = (r, p) => `content:'';position:absolute;inset:0;border-radius:${r};padding:${p};background:linear-gradient(180deg,#fff0c4,#e2b866 22%,#b07c35 60%,#6e4a1f);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude`;
export const css = `
.scr{--ink:#fff3dc;--ink2:#e9d8b8;--ink3:#c6b498;--kick:#e7c98c;--accent:#ffd08a;--gold:#ffd36b;--display:'Hollowlight Chancery',serif;--dw:400;--whisper:'Hollowlight Chancery',serif;--wst:italic;--body:'Alegreya Sans',sans-serif;--num:'Alegreya Sans',sans-serif}
.frame{filter:url(#ol1)}
.panel,.card,.hcard,.btn,.bless,.pill,.chip,.tip,.tog,.tab{isolation:isolate}
.panel{position:relative;border-radius:28px;background:${glass};box-shadow:inset 0 3px 0 -1px rgba(255,240,200,.30),inset 0 -14px 34px rgba(0,0,0,.28),0 20px 44px rgba(0,0,0,.5),0 0 70px rgba(255,170,80,.12)}
.panel::after,.card::after,.hcard::after{content:'';position:absolute;inset:6px;border-radius:inherit;background:${GRAIN},${STREAK};background-size:160px,240px;opacity:.9;pointer-events:none;mix-blend-mode:screen;z-index:-1}
.panel>.frame::before{${band('28px', '6px')}}
.ptop{position:absolute;left:50%;top:-30px;transform:translateX(-50%);z-index:2;filter:drop-shadow(0 0 10px rgba(255,170,60,.5))}
.ptop::after{content:'';position:absolute;left:50%;top:38px;width:260px;height:150px;transform:translateX(-50%);background:radial-gradient(ellipse at 50% 0,rgba(255,186,96,.26),transparent 70%);pointer-events:none}
.hang{position:absolute;left:50%;top:-36px;transform:translateX(-50%);z-index:2;display:flex;flex-direction:column;align-items:center}.hang .cap{width:58px;height:36px;filter:drop-shadow(0 0 8px rgba(255,170,60,.5))}
.hang i{position:absolute;bottom:30px;width:2px;height:14px;background:linear-gradient(transparent,#ffe0a0);box-shadow:0 0 6px #ffb347}
/* buttons: lantern-glass lozenges */
.btn{border-radius:20px;background:linear-gradient(180deg,rgba(56,68,92,.92),rgba(28,35,52,.95));box-shadow:inset 0 3px 0 -1px rgba(255,240,200,.25),0 8px 18px rgba(0,0,0,.4)}
.btn>.frame::before{${band('20px', '4px')}}
.btn .lbl{color:var(--ink)}.btn .wh{color:var(--ink2)}
.btn.primary{background:radial-gradient(130% 160% at 10% 50%,#ffe3a0,#ffb04a 40%,#d97a22 75%,#9a5418);box-shadow:inset 0 3px 0 -1px rgba(255,250,230,.8),inset 0 -8px 18px rgba(120,50,10,.35),0 0 34px rgba(255,166,60,.5),0 10px 20px rgba(0,0,0,.4)}
.btn.primary .lbl{color:#2a1608}.btn.primary .wh{color:#4a2810}
.btn.focus,.bless:first-child{box-shadow:inset 0 0 26px rgba(255,170,70,.35),inset 0 3px 0 -1px rgba(255,240,200,.35),0 0 0 3px rgba(255,214,140,.55),0 0 26px rgba(255,170,60,.45)}
.btn.focus .mk.off .fl path{fill:#ffab3a}
.btn.quiet{background:rgba(24,30,44,.72)}.btn.quiet>.frame::before{background:linear-gradient(180deg,#c9a46a,#6e4a1f)}
.btn.danger .lbl{color:#ffa391}.btn.danger>.frame::before{background:linear-gradient(180deg,#d9a08a,#7a3a2a)}
.mk{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;flex:none;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.55),rgba(255,180,80,.25) 50%,rgba(60,30,10,.3));box-shadow:0 0 0 2px #3a2412,inset 0 0 0 1.5px #e2b866}
.primary .mk{background:radial-gradient(circle at 45% 40%,#fff6d8,#ffcf7a 55%,#e08a2a);box-shadow:0 0 0 2px #5a2e0e,0 0 14px #fff0b0}
.mk.off{background:radial-gradient(circle at 40% 35%,rgba(160,180,210,.35),rgba(30,40,60,.6))}
kbd{background:linear-gradient(#3a2c1e,#21170f);color:#ffe0a0;box-shadow:0 0 0 1.5px #c99a4e,0 0 0 3px #2a1a0c}
.primary kbd{background:#5a2e0e;color:#ffe7b0;box-shadow:0 0 0 1.5px #3a1a06}
/* cards: arched lantern windows hanging from a glowing thread */
.cards{position:relative}.cards::before{content:'';position:absolute;left:-6%;right:-6%;top:4px;height:2px;background:repeating-linear-gradient(90deg,#ffe0a0 0 8px,transparent 8px 13px);box-shadow:0 0 8px #ffb347;opacity:.8}
.card,.hcard{border-radius:130px 130px 24px 24px/70px 70px 24px 24px;background:${glass};box-shadow:inset 0 3px 0 -1px rgba(255,240,200,.3),inset 0 -14px 30px rgba(0,0,0,.3),0 18px 36px rgba(0,0,0,.5)}
.card>.frame::before,.hcard>.frame::before{${band('inherit', '5px')}}
.card{padding-top:40px}
.card.evo{background:radial-gradient(100% 60% at 50% 0,rgba(255,215,110,.55),rgba(255,180,60,.12) 60%,transparent),linear-gradient(180deg,rgba(84,62,30,.94),rgba(40,28,16,.95));box-shadow:inset 0 3px 0 -1px rgba(255,250,210,.6),0 0 46px rgba(255,200,90,.38),0 18px 36px rgba(0,0,0,.5)}
.card.evo>.frame::before{background:linear-gradient(180deg,#fffbe0,#ffd36b 25%,#d39a2c 60%,#7a5212)}
.card.new{background:radial-gradient(100% 50% at 50% 0,rgba(111,211,197,.28),transparent 70%),${glass}}
.card.stirs{box-shadow:inset 0 0 30px rgba(255,211,107,.18),0 18px 36px rgba(0,0,0,.5)}
.medal{background:radial-gradient(circle at 50% 42%,rgba(255,214,140,.55),rgba(255,160,60,.12) 55%,rgba(20,26,40,.6));box-shadow:0 0 0 3px #3a2412,inset 0 0 0 3px #d9ab5c,inset 0 0 0 5px #3a2412,inset 0 4px 10px rgba(255,255,255,.25)}
.evo .medal{background:radial-gradient(circle at 50% 42%,#fff2c0,rgba(255,200,90,.5) 55%,rgba(60,40,10,.6));box-shadow:0 0 0 3px #3a2412,inset 0 0 0 3px #ffd36b,inset 0 0 0 5px #6b4512,0 0 26px rgba(255,210,100,.6)}
.evo .big,.evo .nm{color:#ffe7a0}.evo .big{text-shadow:0 0 18px rgba(255,200,90,.6)}.evo .ctype{color:var(--gold)}
.seal{position:absolute;top:-6px;left:-12px;z-index:3;display:flex;align-items:center;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}.seal b{font:800 12px var(--body);letter-spacing:.16em;text-transform:uppercase;color:#2a1608;background:linear-gradient(#ffe7a0,#e0a840);padding:3px 9px 3px 14px;margin-left:-12px;border-radius:0 8px 8px 0;box-shadow:0 0 0 2px #6b4512}
.seal.big{position:relative;top:0;left:0}
.flag{position:absolute;top:22px;left:-10px;z-index:3;filter:drop-shadow(0 3px 3px rgba(0,0,0,.5))}.flag b{position:absolute;left:10px;top:6px;font:800 12px var(--body);letter-spacing:.16em;text-transform:uppercase;color:#0f3a34}
.k-row .flag{position:relative;top:0;left:0}
.ck{z-index:3}
/* pips: knotted beads on a thread */
.pips::before{content:'';position:absolute;left:-6px;right:-6px;top:50%;height:1.5px;background:#ffe0a0;opacity:.6}
.pip{position:relative;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#5a6884,#1d2536);box-shadow:0 0 0 1.5px #c99a4e,0 0 0 3px #2a1a0c}
.pip.on{background:radial-gradient(circle at 35% 30%,#fff6d8,#ffb347 60%,#c46a18);box-shadow:0 0 0 1.5px #5a2e0e,0 0 8px #ffb347}
/* divider: glowing thread + knot */
.div{display:flex;align-items:center;gap:8px;width:100%;margin:4px 0}.div i{flex:1;height:2px;background:repeating-linear-gradient(90deg,#ffe0a0 0 7px,transparent 7px 12px);filter:drop-shadow(0 0 3px #ffb347);opacity:.85}
.div b{width:11px;height:11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6d8,#ffb347);box-shadow:0 0 0 2px #5a2e0e,0 0 10px #ffb347}
.dl{font:700 13px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick)}.da{font:italic 15px var(--whisper);color:var(--ink3)}
.sh .div{width:320px}
/* hero cards */
.hcard{padding-top:34px}.hcard.sel{background:radial-gradient(100% 60% at 50% 0,rgba(255,190,100,.42),transparent 70%),${glass};box-shadow:inset 0 3px 0 -1px rgba(255,240,200,.4),0 0 0 3px rgba(255,214,140,.5),0 0 46px rgba(255,170,60,.35),0 18px 36px rgba(0,0,0,.5)}
.hcard:not(.sel){filter:saturate(.75) brightness(.86)}
.por{border-radius:50% 50% 18px 18px/30% 30% 18px 18px;background-color:rgba(20,26,40,.6);box-shadow:inset 0 0 0 3px #3a2412,inset 0 0 0 5px #b07c35,inset 0 0 30px rgba(255,180,80,.25)}
/* blessings, pills, chips */
.bless,.pill,.chip{border-radius:16px;background:linear-gradient(180deg,rgba(46,58,82,.86),rgba(24,30,44,.92));box-shadow:inset 0 2px 0 -1px rgba(255,240,200,.25)}
.bless>.frame::before,.pill>.frame::before{${band('16px', '3px')};background:linear-gradient(180deg,#e9cf98,#a07034 60%,#5e3e18)}
.chip{background:rgba(14,18,30,.45);box-shadow:inset 0 2px 8px rgba(0,0,0,.4),inset 0 -1px 0 rgba(255,224,160,.18)}
.chip>.frame::before{${band('16px', '1.5px')};background:linear-gradient(180deg,rgba(226,184,102,.7),rgba(110,74,31,.6))}
.chip>.frame{filter:none}
.pill b{color:#ffd08a}
/* results */
.rp .pin{position:relative}.rtime b{color:#fff3dc;text-shadow:0 2px 0 #3a2412,0 0 24px rgba(255,180,80,.35)}.rnear b{color:#ffd08a}
.arc{background:rgba(10,14,24,.7);box-shadow:inset 0 0 0 1.5px rgba(201,154,78,.6)}.arcfill{background:linear-gradient(90deg,#c46a18,#ffb347 70%,#ffe7a0);box-shadow:0 0 10px #ffb347}
.arc .now{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff6d8,#ffb347);box-shadow:0 0 0 2px #5a2e0e,0 0 14px #ffb347}.arc .boss{width:3px;height:18px;background:#e7c98c}
.sr i,.unl i{background:rgba(10,14,24,.7);box-shadow:inset 0 0 0 1px rgba(201,154,78,.5)}.sr u{background:linear-gradient(90deg,#9a6a2c,#ffe0a0)}.unl u{background:linear-gradient(90deg,#c46a18,#ffd08a)}
.rt{color:#f3e2c2;text-shadow:0 0 30px rgba(255,170,80,.2)}
/* kit-only parts */
.tog{position:relative;display:inline-flex;align-items:center;width:84px;height:44px;border-radius:22px;background:linear-gradient(180deg,rgba(30,38,56,.95),rgba(16,20,32,.95));box-shadow:inset 0 3px 8px rgba(0,0,0,.5)}
.tog>.frame::before{${band('22px', '3px')}}
.tog .th{position:absolute;left:6px;top:6px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 40% 35%,#6a7894,#232c40);box-shadow:0 0 0 2px #3a2412}
.tog.on{background:linear-gradient(90deg,rgba(255,170,70,.55),rgba(120,60,20,.6))}.tog.on .th{left:46px;background:radial-gradient(circle at 45% 40%,#fff6d8,#ffcf7a 55%,#e08a2a);box-shadow:0 0 0 2px #5a2e0e,0 0 12px #ffb347}
.tog em{position:absolute;font:700 12px var(--body);font-style:normal;left:${'46px'};top:14px;color:#c6b498}.tog.on em{left:12px;color:#fff3dc}
.tabs{gap:6px}.tab{position:relative;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:6px 14px;border-radius:6px 6px 16px 16px;font-family:var(--display);font-size:20px;color:var(--ink2);background:rgba(24,30,44,.7)}
.tab>.frame::before{${band('6px 6px 16px 16px', '2px')};background:linear-gradient(180deg,#c9a46a,#5e3e18)}
.tab.a{color:var(--ink);background:radial-gradient(100% 120% at 50% 0,rgba(255,190,100,.4),rgba(30,38,56,.9))}.tab.lk{opacity:.5}
.tip{position:relative;display:flex;flex-direction:column;gap:2px;width:270px;padding:16px 16px 12px;border-radius:14px 14px 22px 22px;background:${glass};box-shadow:0 12px 24px rgba(0,0,0,.5);font-size:14px}
.tip>.frame::before{${band('14px 14px 22px 22px', '3px')}}.tip b{font-family:var(--display);font-weight:400;font-size:21px}.tip small{color:var(--ink3);font-size:13px}.tip em{font-family:var(--whisper);color:var(--accent)}
.tip .eye{position:absolute;top:-22px;left:30px;width:12px;height:12px;border-radius:50%;box-shadow:0 0 0 3px #d9ab5c,0 0 0 5px #3a2412}.tip .eye::after{content:'';position:absolute;left:5px;top:-40px;width:2px;height:40px;background:linear-gradient(transparent,#ffe0a0)}
.k-tt{padding:28px 0 0 10px}
@media (max-height:460px){.cards::before{display:none}.hang{top:-26px}.hang .cap{width:44px;height:28px}.hang i{display:none}.card{padding-top:26px}.ptop{top:-22px}.ptop .cap{width:56px;height:35px}.seal svg{width:34px;height:34px}.flag{top:12px}.hcard{padding-top:22px}.card,.hcard{border-radius:100px 100px 20px 20px/44px 44px 20px 20px}}
@media (max-aspect-ratio:3/4){.cards::before,.hang i{display:none}.card{border-radius:44px 22px 22px 44px;padding-top:14px}.hang{display:none}.hcard{border-radius:90px 90px 22px 22px/40px 40px 22px 22px}.flag{top:-8px;left:auto;right:-6px}.seal{top:-10px;left:-8px}.ptop{top:-28px}}
`;
