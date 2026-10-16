// TAKE 2 "LEADLIGHT": every surface is a leaded window lit from behind by the lantern.
// Lead came = the L2 tinted outline; a border of glass pieces colours up near the light source and stays Hollow-grey far
// from it (the game's "colour returns" idea, made UI); a calm frosted pane carries the text. One small script draws each
// frame as an SVG sized to its element (in the build: once on open/resize, cached per size).
import { flame } from './lib.mjs';
const F = '../../../src/assets/fonts/';
export const head = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;0,800;1,500&display=block">
<style>@font-face{font-family:'Alegreya Sans';font-weight:400;src:url(${F}alegreya-sans-400.woff2) format('woff2')}@font-face{font-family:'Alegreya Sans';font-weight:700 800;src:url(${F}alegreya-sans-700.woff2) format('woff2')}</style>`;

const diamond = (c1, c2, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1 L13 7 L7 13 L1 7Z" fill="${c1}" stroke="#121318" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 3 L10 6" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>${c2 ? `<path d="M7 1 L7 13 M1 7 L13 7" stroke="#121318" stroke-width=".9" opacity=".6"/>` : ''}</svg>`;
const rose = (lit = 1, s = 54) => `<svg class="rose" width="${s}" height="${s}" viewBox="0 0 54 54" aria-hidden="true"><defs><radialGradient id="rg"><stop offset="0" stop-color="#fff4cf"/><stop offset=".5" stop-color="#ffb347"/><stop offset="1" stop-color="#b8661c"/></radialGradient></defs>
<circle cx="27" cy="27" r="26" fill="#ffb347" opacity="${0.35 * lit}" filter="url(#glow)"/><circle cx="27" cy="27" r="22" fill="url(#rg)" stroke="#121318" stroke-width="4.5"/>
${[0, 45, 90, 135].map((a) => `<path d="M27 5 V49" stroke="#121318" stroke-width="2.4" transform="rotate(${a} 27 27)"/>`).join('')}<circle cx="27" cy="27" r="8" fill="#fff4cf" stroke="#121318" stroke-width="2.6"/><path d="M12 16 Q17 9 25 8" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none"/></svg>`;
const wick = (s) => `<svg class="wick ${s}" width="22" height="30" viewBox="0 0 22 30" aria-hidden="true"><path d="M3 28 V11 A8 8 0 0 1 19 11 V28Z" fill="${s === 'lit' ? '#ffb347' : s === 'ember' ? '#8a5a3a' : '#4a5263'}" stroke="#121318" stroke-width="2.6"/>${s === 'lit' ? '<path d="M3 28 V11 A8 8 0 0 1 19 11 V28Z" fill="#ffd27a" opacity=".6" filter="url(#glow2)"/><path d="M11 9 C14 13 15 16 13 19 C12 21 10 21 9 19 C7 16 8 13 11 9Z" fill="#fff4cf"/>' : s === 'ember' ? '<circle cx="11" cy="20" r="2.5" fill="#ff8a3a"/>' : ''}<path d="M3 19 H19" stroke="#121318" stroke-width="1.8"/></svg>`;

export const O = {
  take: 't2',
  panelTop: () => `<span class="ptop">${rose(1, 54)}</span>`,
  cardTop: () => '',
  badgeEvo: (inline) => `<span class="seal${inline ? ' big' : ''}">${diamond('#ffd36b', 1, 26)}<b>Evolve</b></span>`,
  badgeNew: () => `<span class="flag">${diamond('#6fd3c5', 1, 22)}<b>New</b></span>`,
  pip: (on) => `<i class="pip${on ? ' on' : ''}">${diamond(on ? '#ffc35a' : '#5b6575', 0, 13)}</i>`,
  btnMark: (k) => k === 'quiet' || k === 'danger' ? '<span class="mk"></span>' : `<span class="mk">${flame(15, k === 'primary' ? 1 : 0)}</span>`,
  divider: (label, aside) => `<div class="div">${label ? `<span class="dl">${label}</span>` : ''}<i></i>${diamond('#ffc35a', 1, 16)}<i></i>${aside ? `<span class="da">${aside}</span>` : ''}</div>`,
  wick,
  toggle: (on) => `<span class="tog${on ? ' on' : ''}" role="switch" aria-checked="${on}"><i class="frame"></i><span class="pane l">${on ? '' : 'Off'}</span><span class="pane r">${on ? flame(12, 1) + 'On' : ''}</span></span>`,
  tab: (l, a, lock) => `<span class="tab${a ? ' a' : ''}${lock ? ' lk' : ''}"><i class="frame"></i><span>${l}</span></span>`,
  tooltip: () => `<div class="tip"><i class="frame"></i><b>Ghost Wolves</b><span>Wolves hunt separate foes.</span><small>Rank 2 of 5 · next: +1 wolf</small><em>The pack remembers you.</em></div>`,
};

export const script = `<script>
(()=>{const NS='http://www.w3.org/2000/svg';const PAL=['#ffb347','#86c9a4','#e9c46a','#8fb7e0','#e58e6a','#bba6ec'];const GOLD=['#ffd36b','#ffc14d','#ffe39a','#f0a838'];const TEAL=['#6fd3c5','#9fe0c8','#86c9a4','#8fb7e0'];
const hx=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'};
function rr(x,y,w,h,rt,rb,arch){if(arch){const ry=Math.min(w*.3,h*.3);return'M'+x+','+(y+ry)+'A'+(w/2)+','+ry+' 0 0 1 '+(x+w)+','+(y+ry)+'V'+(y+h-rb)+'Q'+(x+w)+','+(y+h)+' '+(x+w-rb)+','+(y+h)+'H'+(x+rb)+'Q'+x+','+(y+h)+' '+x+','+(y+h-rb)+'Z'}
return'M'+(x+rt)+','+y+'H'+(x+w-rt)+'Q'+(x+w)+','+y+' '+(x+w)+','+(y+rt)+'V'+(y+h-rb)+'Q'+(x+w)+','+(y+h)+' '+(x+w-rb)+','+(y+h)+'H'+(x+rb)+'Q'+x+','+(y+h)+' '+x+','+(y+h-rb)+'V'+(y+rt)+'Q'+x+','+y+' '+(x+rt)+','+y+'Z'}
function el(n,a,p){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
function lead(fr){const host=fr.parentElement;const W=host.offsetWidth,H=host.offsetHeight;if(!W)return;const c=host.classList;
const big=c.contains('panel')||c.contains('card')||c.contains('hcard')||c.contains('tip');const arch=(c.contains('card')||c.contains('hcard'))&&innerWidth>innerHeight;const b=c.contains('tip')?8:big?(innerHeight<460?10:15):0;const r=big?18:(c.contains('chip')?10:12);
const pal=c.contains('evo')?GOLD:c.contains('new')?TEAL:PAL;const lit=c.contains('hcard')&&!c.contains('sel')?.35:c.contains('evo')?1.2:1;
const svg=el('svg',{width:W,height:H,viewBox:'0 0 '+W+' '+H,class:'leadsvg'});fr.appendChild(svg);const d=rr(2,2,W-4,H-4,r,r,arch);
const g=el('radialGradient',{id:'p'+Math.random().toString(36).slice(2),cx:'.5',cy:'0',r:'1'},el('defs',{},svg));el('stop',{offset:0,'stop-color':c.contains('evo')?'#5a4420':'#2f3a52','stop-opacity':.96},g);el('stop',{offset:.7,'stop-color':'#1a2030','stop-opacity':.95},g);
if(!big){const prim=c.contains('primary');const foc=c.contains('focus')||(c.contains('bless')&&host.matches(':first-child'));
 el('path',{d,fill:prim?'#f0a040':c.contains('chip')?'rgba(14,18,28,.55)':'#3a4458'},svg);
 if(prim){el('path',{d,fill:'#ffd27a',opacity:.55,transform:'translate(0 0)'},svg)}
 if(c.contains('btn')||c.contains('bless')||c.contains('pill')){const jx=c.contains('btn')?52:c.contains('bless')?50:0;if(jx){el('rect',{x:2,y:2,width:jx-2,height:H-4,rx:r,fill:prim?'#fff0b8':foc?'#ffb347':'#5d6a80'},svg);el('path',{d:'M'+jx+' 2 V'+(H-2),stroke:'#121318','stroke-width':3.4},svg)}}
 el('path',{d:rr(4,4,W-8,(H-8)/2,r-2,2,false),fill:'#fff',opacity:prim?.12:.06},svg);el('path',{d:'M'+(r+4)+' 6 H'+(W-r-4),stroke:'#fff','stroke-opacity':prim?.55:.18,'stroke-width':2,'stroke-linecap':'round'},svg);
 el('path',{d,fill:'none',stroke:'#121318','stroke-width':c.contains('chip')?2.5:4.5},svg);el('path',{d:rr(4.5,4.5,W-9,H-9,r-2,r-2,false),fill:'none',stroke:foc?'#ffd27a':'#7a8296','stroke-opacity':foc?.9:.35,'stroke-width':foc?2:1},svg);return}
el('path',{d,fill:'url(#'+g.id+')'},svg);
const mid=el('path',{d:rr(2+b/2,2+b/2,W-4-b,H-4-b,Math.max(4,r-b/2),Math.max(4,r-b/2),arch),fill:'none'},svg);const L=mid.getTotalLength();const n=Math.max(8,Math.round(L/(big&&W>400?62:46)));const st=L/n;
for(let i=0;i<n;i++){const p=mid.getPointAtLength((i+.5)*st);const f=Math.max(0,Math.min(1,1-Math.hypot((p.x-W/2)/W,(p.y)/H*1.1)*1.1))*lit*(c.contains('panel')?1.35:1);const col=mix('#566173',pal[(i*5)%pal.length],Math.min(1,f));
 el('path',{d:mid.getAttribute('d'),fill:'none',stroke:col,'stroke-width':b,'stroke-dasharray':st+' '+(L-st),'stroke-dashoffset':-i*st},svg);
 if(f>.25)el('path',{d:mid.getAttribute('d'),fill:'none',stroke:'#fff6d8','stroke-opacity':(f-.25)*.5,'stroke-width':b*.35,'stroke-dasharray':st*.5+' '+(L-st*.5),'stroke-dashoffset':-i*st-st*.15},svg)}
for(let i=0;i<n;i++){const l=i*st;const a=mid.getPointAtLength(l),q=mid.getPointAtLength(Math.min(L,l+1));let nx=-(q.y-a.y),ny=q.x-a.x;const m=Math.hypot(nx,ny)||1;nx/=m;ny/=m;const h=b/2+2;el('path',{d:'M'+(a.x-nx*h)+' '+(a.y-ny*h)+'L'+(a.x+nx*h)+' '+(a.y+ny*h),stroke:'#121318','stroke-width':3.2},svg)}
el('path',{d,fill:'none',stroke:'#121318','stroke-width':5.5},svg);el('path',{d:rr(2+b,2+b,W-4-2*b,H-4-2*b,Math.max(4,r-b),Math.max(4,r-b),arch),fill:'none',stroke:'#121318','stroke-width':4.5},svg);
el('path',{d:rr(.8,.8,W-1.6,H-1.6,r+1,r+1,arch),fill:'none',stroke:'#9aa2b4','stroke-opacity':.35,'stroke-width':1},svg)}
document.fonts.ready.then(()=>document.querySelectorAll('.frame').forEach(lead))})();
</script>`;

export const css = `
.scr{--ink:#f7efe0;--ink2:#d8d4cc;--ink3:#b4b2ae;--kick:#e9c98a;--accent:#ffd08a;--gold:#ffd36b;--display:'Alegreya',serif;--dw:800;--whisper:'Alegreya',serif;--wst:italic;--body:'Alegreya Sans',sans-serif;--num:'Alegreya Sans',sans-serif}
.leadsvg{position:absolute;inset:0;overflow:visible}.frame{z-index:0}.pin,.btn>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.card>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.hcard>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.bless>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.pill>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.chip>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.tab>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.tip>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop),.tog>*:not(.frame):not(.seal):not(.flag):not(.ck):not(.ptop){position:relative;z-index:1}
.panel{position:relative;filter:drop-shadow(0 18px 30px rgba(0,0,0,.55))}.panel .pin{padding:24px}
.ptop{position:absolute;left:50%;top:-26px;transform:translateX(-50%);z-index:2}
.btn{border-radius:12px;padding-left:10px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}.btn .mk{width:34px;display:grid;place-items:center;flex:none;margin-right:8px}
.btn.primary{filter:drop-shadow(0 0 22px rgba(255,170,60,.55)) drop-shadow(0 6px 10px rgba(0,0,0,.4))}.btn.primary .lbl{color:#2a1406}.btn.primary .wh{color:#4a260c}
.btn.danger .lbl{color:#ffab9a}.btn.dis{opacity:.45}
kbd{background:#121318;color:#ffe0a0;box-shadow:inset 0 0 0 1px #6a6f80}.primary kbd{background:#3a1c08;color:#ffe7b0}
.card{padding-top:42px}.card,.hcard{filter:drop-shadow(0 16px 26px rgba(0,0,0,.55))}.card.evo{filter:drop-shadow(0 0 30px rgba(255,200,90,.45)) drop-shadow(0 16px 26px rgba(0,0,0,.5))}
.card .nm{font-size:25px}.evo .nm,.evo .big{color:#ffe6a0}.evo .ctype{color:#ffd36b}
.medal{background:radial-gradient(circle,#fff2c4 0 18%,transparent 19%),repeating-conic-gradient(from 22deg,#121318 0 3deg,transparent 3deg 45deg),radial-gradient(circle,#ffcf7a,#d98a2a 60%,#8a4e14);box-shadow:0 0 0 4px #121318,0 0 0 5px rgba(154,162,180,.4),0 0 24px rgba(255,170,60,.45)}
.medal .pic{position:relative;filter:drop-shadow(0 0 3px #121318) drop-shadow(0 0 1px #121318)}
.up .medal{background:radial-gradient(circle,#efe9ff 0 18%,transparent 19%),repeating-conic-gradient(from 22deg,#121318 0 3deg,transparent 3deg 45deg),radial-gradient(circle,#b9a8f0,#6d5bb0 70%)}
.new .medal{background:radial-gradient(circle,#e8fffa 0 18%,transparent 19%),repeating-conic-gradient(from 22deg,#121318 0 3deg,transparent 3deg 45deg),radial-gradient(circle,#9fe6dc,#3c8f86 70%)}
.seal{position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:6px;z-index:2}.seal b,.flag b{font:800 12px var(--body);letter-spacing:.16em;text-transform:uppercase;color:#ffd36b}.flag b{color:#8fe8dc}.seal.big{position:relative;top:0;left:0}
.flag{position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:6px;z-index:2}.k-row .flag{position:relative;top:0;left:0}
.ck{position:absolute;top:14px;right:16px;z-index:2}
.pip{display:block;line-height:0}.pip.on svg{filter:drop-shadow(0 0 5px #ffb347)}
.div{display:flex;align-items:center;gap:8px;width:100%;margin:6px 0}.div i{flex:1;height:5px;border-radius:3px;background:#121318;box-shadow:inset 0 1px 0 rgba(154,162,180,.45)}
.dl{font:700 13px var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--kick)}.da{font:italic 15px var(--whisper);color:var(--ink3)}.sh .div{width:340px}
.hcard{padding-top:34px}.hcard:not(.sel){opacity:.92}.hcard:not(.sel) .por{filter:saturate(.45) brightness(.8)}
.por{border-radius:50% 50% 10px 10px/26% 26% 10px 10px;background-color:#2a3246;box-shadow:inset 0 0 0 4px #121318,inset 0 0 40px rgba(255,180,80,.25)}
.bless{border-radius:12px;padding-left:8px}.bless .pic{width:34px;margin-right:12px}.pill b{color:#ffd08a}.pill{border-radius:12px}
.chip{border-radius:10px}.rp .pin{padding:22px 28px}
.rtime b{color:#fff3dc;text-shadow:0 0 22px rgba(255,180,80,.35)}.rnear b{color:#ffd08a}.rt{color:#f6ead2}
.arc{background:#121318;box-shadow:inset 0 0 0 1px #6a6f80}.arcfill{background:repeating-linear-gradient(90deg,#ffb347 0 30px,#121318 30px 33px,#ffd27a 33px 64px,#121318 64px 67px);box-shadow:0 0 12px rgba(255,170,60,.6)}
.arc .now{width:22px;height:22px;background:conic-gradient(#121318 0 4%,#fff4cf 4% 46%,#121318 46% 54%,#ffd27a 54% 96%,#121318 96%);border-radius:50%;box-shadow:0 0 0 3px #121318,0 0 14px #ffb347}.arc .boss{width:4px;height:18px;background:#9aa2b4}
.sr i,.unl i{background:#121318;box-shadow:inset 0 0 0 1px #6a6f80}.sr u{background:linear-gradient(90deg,#8a6a3a,#ffe0a0)}.unl u{background:linear-gradient(90deg,#3c8f86,#9fe6dc)}
.tog{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;width:96px;height:44px;border-radius:12px}.tog .pane{display:grid;place-items:center;font:700 12px var(--body);color:#c9ccd4;grid-auto-flow:column;gap:3px}
.tog.on .pane.r{color:#2a1406}.tog.on .pane.r::before{content:'';position:absolute;inset:4px 4px 4px 0;border-radius:0 9px 9px 0;background:#ffc35a;z-index:-1;box-shadow:0 0 14px #ffb347}.tog .pane.r::after{content:'';position:absolute;left:-2px;top:3px;bottom:3px;width:3px;background:#121318}
.tab{position:relative;display:inline-flex;align-items:center;min-height:44px;padding:6px 16px;border-radius:12px;font-family:var(--display);font-weight:700;font-size:19px;color:var(--ink2)}.tab.a{color:#2a1406}.tab.a::before{content:'';position:absolute;inset:4px;border-radius:9px;background:#ffc35a;box-shadow:0 0 12px #ffb347}.tab.lk{opacity:.5}
.tip{position:relative;display:flex;flex-direction:column;gap:2px;width:270px;padding:14px 16px;border-radius:12px;font-size:14px}.tip b{font-family:var(--display);font-size:20px}.tip small{color:var(--ink3);font-size:13px}.tip em{color:var(--accent)}
.k-tt{padding:18px 0 0 6px}
@media (max-height:460px){.card{padding-top:16px}.seal,.flag{top:8px;left:10px}.seal b,.flag b{display:none}.ptop{top:-18px}.ptop svg{width:38px;height:38px}.hcard{padding-top:16px}.rp .pin{padding:10px 16px}}
@media (max-aspect-ratio:3/4){.card{padding-top:16px}.seal,.flag{top:8px;left:auto;right:12px}.ptop{top:-24px}}
`;
