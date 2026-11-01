// TAKE 3 "STITCHWORK": the UI is sewn from the heroes' own cloth (Wren's indigo tunic, cream pelt, amber paw stitches,
// Elias's patched coat) with brass buttons; the amber thread glows like the in-game trails. Same lantern/thread/brass
// world as round 1, but the material is cloth instead of glass.
import { FELT, FELTDK } from './lib.mjs';
const F = '../../../src/assets/fonts/';
export const head = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..800,0..100,0..1;1,9..144,400..800,0..100,0..1&display=block">
<style>@font-face{font-family:'Alegreya Sans';font-weight:400;src:url(${F}alegreya-sans-400.woff2) format('woff2')}@font-face{font-family:'Alegreya Sans';font-weight:700 800;src:url(${F}alegreya-sans-700.woff2) format('woff2')}</style>`;

const button = (lit, s = 30) => `<svg class="sbtn" width="${s}" height="${s}" viewBox="0 0 30 30" aria-hidden="true">${lit ? '<circle cx="15" cy="15" r="14" fill="#ffb347" opacity=".55" filter="url(#glow2)"/>' : ''}<circle cx="15" cy="15" r="12" fill="${lit ? '#f2c063' : '#8a6a3e'}" stroke="#3a2610" stroke-width="2.4"/><circle cx="15" cy="15" r="8" fill="none" stroke="${lit ? '#fff0c0' : '#c9a46a'}" stroke-width="1.3" opacity=".8"/>
${[[12, 12], [18, 12], [12, 18], [18, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#3a2610"/>`).join('')}<path d="M12 12 L18 18 M18 12 L12 18" stroke="${lit ? '#fff4d0' : '#e9d8b8'}" stroke-width="1.4"/><path d="M7 10 Q9 5 14 4" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
const pin = `<svg class="spin" width="54" height="26" viewBox="0 0 54 26" aria-hidden="true"><path d="M8 13 H46" stroke="#3a2610" stroke-width="5" stroke-linecap="round"/><path d="M8 13 H46" stroke="#e2b866" stroke-width="2.4" stroke-linecap="round"/><path d="M8 8 Q2 13 8 18" fill="none" stroke="#3a2610" stroke-width="4"/><path d="M8 8 Q2 13 8 18" fill="none" stroke="#e2b866" stroke-width="2"/><rect x="40" y="6" width="12" height="14" rx="3" fill="#d9ab5c" stroke="#3a2610" stroke-width="2"/><path d="M12 11 H38" stroke="#fff" stroke-opacity=".6" stroke-width="1"/></svg>`;
const xs = (on) => `<svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true"><path d="M2 2 L11 11 M11 2 L2 11" stroke="${on ? '#ffb84a' : '#8b97ad'}" stroke-width="${on ? 2.8 : 1.6}" stroke-linecap="round" ${on ? '' : 'stroke-dasharray="2 2.2"'}/></svg>`;
const wick = (s) => `<svg class="wick ${s}" width="22" height="30" viewBox="0 0 22 30" aria-hidden="true">${s === 'lit' ? '<circle cx="11" cy="13" r="9" fill="#ffab3a" opacity=".45" filter="url(#glow2)"/>' : ''}<path d="M11 2 C16 8 18 12 17 16 C16 21 13 23 11 23 C9 23 6 21 5 16 C4 12 7 8 11 2Z" fill="${s === 'lit' ? '#ffab3a' : s === 'ember' ? '#6a3a20' : 'none'}" stroke="${s === 'dark' ? '#8b97ad' : '#ffcf86'}" stroke-width="1.8" stroke-dasharray="${s === 'lit' ? '0' : '3 2.5'}"/>${s === 'lit' ? '<path d="M11 8 L11 20 M8 12 L11 16 M14 12 L11 16" stroke="#ffe7b0" stroke-width="1.2" opacity=".8"/>' : s === 'ember' ? '<circle cx="11" cy="18" r="2.5" fill="#ff8a3a"/>' : ''}<path d="M11 23 V29" stroke="#ffcf86" stroke-width="1.6" stroke-dasharray="2 2"/></svg>`;

export const O = {
  take: 't3',
  panelTop: () => `<span class="ptop"><i class="g l"></i><i class="g r"></i></span>`,
  cardTop: () => `<span class="pinw">${pin}</span>`,
  badgeEvo: (inline) => `<span class="seal${inline ? ' big' : ''}"><b>Evolve</b></span>`,
  badgeNew: () => `<span class="flag"><b>New</b></span>`,
  pip: (on) => `<i class="pip${on ? ' on' : ''}">${xs(on)}</i>`,
  btnMark: (k) => k === 'quiet' || k === 'danger' ? '' : `<span class="mk">${button(k === 'primary', 30)}</span>`,
  divider: (label, aside) => `<div class="div">${label ? `<span class="dl">${label}</span>` : ''}<i></i><b></b><i></i>${aside ? `<span class="da">${aside}</span>` : ''}</div>`,
  wick,
  toggle: (on) => `<span class="tog${on ? ' on' : ''}" role="switch" aria-checked="${on}"><i class="frame"></i><span class="th">${button(on, 30)}</span><em>${on ? 'On' : 'Off'}</em></span>`,
  tab: (l, a, lock) => `<span class="tab${a ? ' a' : ''}${lock ? ' lk' : ''}"><i class="frame"></i><span>${l}</span></span>`,
  tooltip: () => `<div class="tip"><i class="frame"></i><span class="eye"></span><b>Ghost Wolves</b><span>Wolves hunt separate foes.</span><small>Rank 2 of 5 · next: +1 wolf</small><em>The pack remembers you.</em></div>`,
};

const indigo = `radial-gradient(90% 60% at 50% 0,rgba(255,186,96,.22),transparent 70%),${FELT},linear-gradient(180deg,#34496c,#233250)`;
const stitch = (inset, col = '#ffb84a', w = 2.5, r = '14px') => `content:'';position:absolute;inset:${inset};border:${w}px dashed ${col};border-radius:${r};filter:drop-shadow(0 0 3px rgba(255,170,60,.55))`;
export const css = `
.scr{--ink:#fbf1de;--ink2:#e3d8c4;--ink3:#bdb6a8;--kick:#ffcf86;--accent:#ffcf86;--gold:#ffd36b;--display:'Fraunces',serif;--dw:700;--whisper:'Fraunces',serif;--wst:italic;--body:'Alegreya Sans',sans-serif;--num:'Alegreya Sans',sans-serif}
.h1,.h2,.btn .lbl,.nm,.bn,.tab,.tip b,.chip b.none{font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 72}
.lead,.wh,.stir,.tag,.ep,.gift,.da,.tip em{font-variation-settings:'SOFT' 100,'WONK' 1;font-weight:400}
.frame{z-index:0;background:${indigo};background-size:auto,180px,auto;filter:url(#olfelt)}
.frame::after{${stitch('8px')}}
.pin,.btn>*:not(.frame),.card>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.pinw),.hcard>*:not(.frame):not(.pinw),.bless>*:not(.frame),.pill>*:not(.frame),.chip>*:not(.frame),.tab>*:not(.frame),.tip>*:not(.frame):not(.eye),.tog>*:not(.frame){position:relative;z-index:1}
.panel{position:relative;border-radius:26px;filter:drop-shadow(0 16px 26px rgba(0,0,0,.55))}.panel>.frame{border-radius:26px}.panel>.frame::after{border-radius:18px;inset:10px}
.ptop .g{position:absolute;top:10px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#1a2236 0 35%,#e2b866 38% 70%,#3a2610 72%);z-index:2;box-shadow:0 1px 0 rgba(255,255,255,.3)}
.ptop .g.l{left:22px}.ptop .g.r{right:22px}.ptop .g::after{content:'';position:absolute;left:7px;bottom:12px;width:2px;height:120px;background:linear-gradient(transparent,#ffcf86);box-shadow:0 0 5px #ffb347}
.ptop{position:absolute;inset:0;pointer-events:none}
.btn{border-radius:18px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45))}.btn>.frame{border-radius:18px}.btn>.frame::after{inset:6px;border-radius:13px;border-width:2px}
.btn.primary>.frame{background:radial-gradient(100% 120% at 20% 30%,rgba(255,240,200,.45),transparent 60%),${FELTDK},linear-gradient(180deg,#f2a84a,#d97f26);filter:url(#olfelt) drop-shadow(0 0 16px rgba(255,170,60,.5))}
.btn.primary>.frame::after{border-color:#fff1cf;filter:none}.btn.primary .lbl{color:#2a1406}.btn.primary .wh{color:#4a240a}
.btn.focus>.frame::after{border-color:#ffe0a0;border-width:3px}.btn.focus>.frame{background:radial-gradient(100% 100% at 50% 0,rgba(255,186,96,.4),transparent 70%),${FELT},linear-gradient(180deg,#3a5078,#273859)}
.btn.quiet>.frame{background:${FELT},linear-gradient(180deg,#2a3448,#1c2436)}.btn.quiet>.frame::after{border-color:#8b97ad;filter:none}
.btn.danger .lbl{color:#ffb0a0}.btn.danger>.frame::after{border-color:#e08a7a;filter:none}
.mk{flex:none;display:grid;place-items:center}
kbd{background:#1a2236;color:#ffe0a0;border:1.5px dashed #ffcf86}.primary kbd{background:#5a2e0e;border-color:#ffe7b0;color:#fff0cf}
.card,.hcard{border-radius:22px;filter:drop-shadow(0 14px 20px rgba(0,0,0,.55))}.card>.frame,.hcard>.frame{border-radius:22px}.card>.frame::after,.hcard>.frame::after{border-radius:15px;inset:9px}
.cards .card:nth-child(1){transform:rotate(-1.4deg)}.cards .card:nth-child(2){transform:rotate(.8deg) translateY(4px)}.cards .card:nth-child(3){transform:rotate(1.6deg)}
.card{padding-top:38px}
.card.evo>.frame{background:radial-gradient(100% 70% at 50% 0,rgba(255,250,220,.55),transparent 70%),${FELTDK},linear-gradient(180deg,#f3c25e,#d18f2e);filter:url(#olfelt) drop-shadow(0 0 22px rgba(255,200,90,.5))}
.card.evo>.frame::after{border-color:#fff4d6;filter:none}.card.evo{color:#2a1406}.evo .unit,.evo .from,.evo .desc{color:#3a2208}.evo .ctype{color:#6a3a08}.evo .nm,.evo .big{color:#2a1406}
.card.new>.frame{background:radial-gradient(90% 60% at 50% 0,rgba(111,211,197,.25),transparent 70%),${FELT},linear-gradient(180deg,#34496c,#233250)}
.pinw{position:absolute;left:50%;top:-12px;transform:translateX(-50%) rotate(-4deg);z-index:3;filter:drop-shadow(0 3px 2px rgba(0,0,0,.5))}
.medal{background:radial-gradient(circle,#2a3a58 0 58%,transparent 59%),repeating-conic-gradient(from 0deg,#ffb84a 0 5deg,#b8742a 5deg 9deg);box-shadow:0 0 0 3px #141c2b,0 0 18px rgba(255,170,60,.35)}
.evo .medal{background:radial-gradient(circle,#fff2d0 0 58%,transparent 59%),repeating-conic-gradient(from 0deg,#fff4d6 0 5deg,#e0b060 5deg 9deg);box-shadow:0 0 0 3px #6a3a08}
.seal{position:absolute;top:14px;left:-8px;z-index:3;transform:rotate(-6deg)}.seal b,.flag b{display:block;font:800 12px var(--body);letter-spacing:.16em;text-transform:uppercase;padding:5px 12px;border-radius:4px}
.seal b{background:${FELTDK},#7a3d10;color:#ffe7b0;box-shadow:0 0 0 2px #3a1a06,inset 0 0 0 3px #7a3d10,inset 0 0 0 4.5px #ffcf86}
.flag{position:absolute;top:14px;left:-8px;z-index:3;transform:rotate(-5deg)}.flag b{background:${FELTDK},#5fc4b6;color:#0d332e;box-shadow:0 0 0 2px #14423c,inset 0 0 0 3px #5fc4b6,inset 0 0 0 4.5px #e8fffb;clip-path:polygon(0 0,100% 0,90% 50%,100% 100%,0 100%);padding-right:20px}
.seal.big,.k-row .flag{position:relative;top:0;left:0}
.ck{position:absolute;top:14px;right:16px;z-index:2}
.pip{display:block;line-height:0}.pip.on svg{filter:drop-shadow(0 0 4px #ffb347)}
.evo .pip.on svg path{stroke:#7a3d10}.evo .pip.on svg{filter:none}
.div{display:flex;align-items:center;gap:8px;width:100%;margin:6px 0}.div i{flex:1;height:0;border-top:2.5px dashed #ffb84a;filter:drop-shadow(0 0 3px #ffb347)}.div b{width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe7b0,#d98a2a);box-shadow:0 0 0 2px #3a2610}
.dl{font:700 13px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick)}.da{font:italic 15px var(--whisper);color:var(--ink3)}.sh .div{width:320px}
.hcard{padding-top:34px}.hcard.sel>.frame::after{border-color:#ffe0a0;border-width:3px}.hcard.sel{filter:drop-shadow(0 0 22px rgba(255,170,60,.35)) drop-shadow(0 14px 20px rgba(0,0,0,.55))}
.hcard:not(.sel)>.frame{background:${FELT},linear-gradient(180deg,#2c3a55,#1e2940)}.hcard:not(.sel)>.frame::after{border-color:#8b97ad;filter:none}.hcard:not(.sel) .por{filter:saturate(.5) brightness(.8)}
.heroes .hcard:nth-child(1){transform:rotate(-.8deg)}.heroes .hcard:nth-child(2){transform:rotate(.9deg)}
.por{border-radius:16px;background-color:#efe2c6;box-shadow:0 0 0 3px #141c2b,inset 0 0 0 4px #c9a46a}
.bless,.pill,.chip{border-radius:16px}.bless>.frame,.pill>.frame{border-radius:16px}.bless>.frame::after,.pill>.frame::after{inset:5px;border-radius:12px;border-width:2px}
.bless:first-child>.frame::after{border-color:#ffe0a0;border-width:3px}
.chip>.frame{border-radius:12px;background:${FELTDK},rgba(18,26,44,.7);filter:none;box-shadow:inset 0 2px 8px rgba(0,0,0,.45)}.chip>.frame::after{inset:4px;border-radius:9px;border-width:1.5px;border-color:rgba(255,207,134,.55);filter:none}
.pill b{color:#ffcf86}
.rtime b{color:#fff3dc;text-shadow:0 2px 0 #141c2b}.rnear b{color:#ffcf86}.rt{color:#fbf1de}
.arc{background:#141c2b;box-shadow:inset 0 0 0 1.5px #3a4a68}.arcfill{background:#141c2b;border-top:3px dashed #ffb84a;top:4px;bottom:auto;height:0;filter:drop-shadow(0 0 4px #ffb347)}
.arc .now{width:24px;height:24px;background:none}.arc .now::before{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,#3a2610 0 12%,#f2c063 14% 64%,#3a2610 66%);box-shadow:0 0 12px #ffb347}.arc .boss{width:4px;height:18px;background:#8b97ad}
.sr i,.unl i{background:#141c2b;box-shadow:inset 0 0 0 1.5px #3a4a68;overflow:visible}.sr u,.unl u{top:50%;bottom:auto;height:0;border-top:3px dashed #e9c98a}.unl u{border-top-color:#ffb84a;filter:drop-shadow(0 0 3px #ffb347)}
.tog{position:relative;display:inline-flex;align-items:center;width:86px;height:44px;border-radius:22px}.tog>.frame{border-radius:22px;background:${FELT},linear-gradient(180deg,#1f2a40,#141c2b)}.tog>.frame::after{inset:5px;border-radius:17px;border-width:1.5px;border-color:#8b97ad;filter:none}
.tog.on>.frame{background:${FELTDK},linear-gradient(180deg,#f2a84a,#d97f26)}.tog.on>.frame::after{border-color:#fff1cf}
.tog .th{position:absolute!important;left:7px;top:7px}.tog.on .th{left:49px}.tog em{position:absolute!important;left:46px;top:14px;font:700 12px var(--body);font-style:normal;color:#c9ccd4}.tog.on em{left:13px;color:#2a1406}
.tabs{gap:6px}.tab{position:relative;display:inline-flex;align-items:center;min-height:44px;padding:6px 16px;border-radius:14px 14px 6px 6px;font-family:var(--display);font-weight:600;font-size:19px;color:var(--ink2)}.tab>.frame{border-radius:14px 14px 6px 6px}.tab>.frame::after{inset:5px;border-radius:10px 10px 3px 3px;border-width:1.5px;filter:none;border-color:#8b97ad}
.tab.a>.frame{background:${FELTDK},linear-gradient(180deg,#f3e6c9,#d9c49c)}.tab.a{color:#2a1406}.tab.a>.frame::after{border-color:#c97a26}.tab.lk{opacity:.5}
.tip{position:relative;display:flex;flex-direction:column;gap:2px;width:270px;padding:18px 18px 14px;border-radius:12px 12px 22px 22px;font-size:14px;transform:rotate(-1.5deg)}.tip>.frame{border-radius:12px 12px 22px 22px}.tip b{font-family:var(--display);font-size:21px}.tip small{color:var(--ink3);font-size:13px}.tip em{font-family:var(--whisper);font-style:italic;color:var(--accent)}
.tip .eye{position:absolute;top:8px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#1a2236;box-shadow:0 0 0 3px #e2b866,0 0 0 5px #3a2610;z-index:2}.tip .eye::after{content:'';position:absolute;left:5px;bottom:8px;width:2px;height:44px;background:linear-gradient(transparent,#ffcf86)}
.k-tt{padding:40px 0 0 10px}.lay-kit .ptop .g::after{height:20px}
@media (max-height:460px){.card{padding-top:20px}.pinw{top:-12px}.pinw svg{width:40px}.seal,.flag{top:6px}.ptop .g::after{height:60px}.hcard{padding-top:18px}.frame::after{inset:6px}.cards .card{transform:none!important}}
@media (max-aspect-ratio:3/4){.card{padding-top:16px}.pinw{display:none}.seal,.flag{top:-10px;left:auto;right:-6px}.cards .card:nth-child(n){transform:rotate(0)}.cards .card:nth-child(2){transform:rotate(.6deg)}.heroes .hcard:nth-child(n){transform:none}.hcard{padding-top:22px}}
`;
