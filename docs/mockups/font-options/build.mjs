// node build.mjs [u1|a|b|c] [screen]   -> <opt>-<screen>.html + PNGs at 1280x720, 844x390@2x, 390x844@2x + measured.txt
// Same Lantern Glass skeleton as docs/mockups/ui-identity (B take) with ONLY the type changed per option. Proof pages load fonts from fonts.googleapis.com (needs internet to re-render; nothing is shipped).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SCREENS } from '../ui-identity/shared.mjs';
import { COMMON, B, FLOOR } from '../ui-identity/css.mjs';
import { EXTRA } from './spec.mjs';
import { link } from './fonts.mjs';
import { chrome } from './lib.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const ALL = { title: SCREENS.title, hero: SCREENS.hero, levelup: SCREENS.levelup, results: SCREENS.results, wordmark: EXTRA.wordmark, hud: EXTRA.hud };
const SIZES = [['1280x720', 1280, 720, 1], ['844x390', 844, 390, 2], ['390x844', 390, 844, 2]];

// Base skeleton: swap the stand-in font names in B for variables, then each option sets the variables + case/weight rules.
const SKEL = B.replace(/Garamond,Georgia,serif|Garamond,serif/g, 'var(--fd)').replace(/Corbel,"Segoe UI",sans-serif|Corbel,sans-serif/g, 'var(--fb)');
const WHISPER = '.line,.tagline,.hush,.gift,.bh em,.near,.hcard h3 small,.rhero .line,.card .hush,.nudge>span';
const NEW = `
.scr{font-synthesis:none}
body{font-family:var(--fb)}
kbd,.badge,.pill,.chip small,.btn small,.own,.unit,.from,.arcl,.sr label,.sr b,.stats dt,.stats b,.gifts li,.bank,.foot{font-family:var(--fb)}
${WHISPER}{font-family:var(--fw);}
/* wordmark + ladder + hud specimen */
.logo.xl{font-size:min(8.2em,15vw)}.wm .kick{margin-bottom:1em}
.ladder{display:grid;gap:.5em;margin-top:1.2em;text-align:left;width:min(38em,92vw);border-top:1px dashed rgba(255,224,160,.35);padding-top:.9em}
.lr{display:grid;grid-template-columns:7em 1fr;gap:.9em;align-items:baseline}.lr small{opacity:.6;letter-spacing:.1em;text-transform:uppercase;font-family:var(--fb);font-style:normal}
.lr h2{font-size:2em}.lr h3{font-size:1.3em}.b14{font-size:max(14px,1.04em);font-family:var(--fb)}.b12{font-size:max(12px,.92em);font-family:var(--fb)}.whisper{font-style:var(--wst,normal);font-family:var(--fw);font-size:var(--wsz,1.15em);color:var(--thread)}
@media (max-aspect-ratio:1/1){.lr{grid-template-columns:1fr;gap:0}.logo.xl{font-size:min(3.5em,9vw)}.wm .tagline{font-size:1.15em}.ladder{gap:.3em}}
@media (max-height:420px){.wm .ladder{display:none}.logo.xl{font-size:min(4.6em,12vw)}}
.hudw{position:absolute;inset:0}.plate{position:absolute;background:var(--lg-glass,rgba(28,23,20,.78));border:1px solid rgba(216,178,106,.45);padding:.45em .8em;display:flex;align-items:center;gap:.7em;border-radius:2px}
.num{font-family:var(--fnum,var(--fb));font-feature-settings:"tnum" 1,"lnum" 1;font-variant-numeric:tabular-nums lining-nums}
.hl{left:2.5%;top:3%}.hl .lvl{display:flex;flex-direction:column;line-height:1}.hl small{font-size:max(11px,.7em);letter-spacing:.14em;text-transform:uppercase;color:var(--brass)}.hl .lvl b{font-size:1.9em;color:var(--cream)}
.hp{width:8em;height:.7em;border:1px solid rgba(216,178,106,.5);background:rgba(0,0,0,.4)}.hp i{display:block;height:100%;background:linear-gradient(90deg,#d9534f,var(--flame));box-shadow:0 0 .6em var(--flame)}.hpn{font-size:.95em}
.hc{left:50%;top:3%;transform:translateX(-50%);flex-direction:column;gap:.2em;padding:.4em 1.2em}.clock{font-size:1.9em;line-height:1;color:var(--thread)}.moon{width:7em;height:.35em;background:rgba(216,178,106,.25)}.moon i{display:block;height:100%;background:var(--brass)}
.hr{right:2.5%;top:3%;gap:1.2em}.cur{display:flex;align-items:center;gap:.4em;color:var(--brass)}.cur b{font-size:1.25em;color:var(--cream)}
.abil{left:2.5%;bottom:5%;flex-direction:column;align-items:flex-start;gap:0}.abil small{font-size:max(11px,.75em);letter-spacing:.12em;text-transform:uppercase;color:var(--brass)}.abil b{font-size:1.4em}
.toast{left:50%;bottom:5%;transform:translateX(-50%);white-space:nowrap}
.xp{position:absolute;left:0;right:0;bottom:0;height:.45em;background:rgba(0,0,0,.5)}.xp i{display:block;height:100%;background:var(--thread);box-shadow:0 0 .8em var(--flame)}
.dmgfield{position:absolute;inset:0;pointer-events:none}.dn{position:absolute;font-family:var(--fdmg,var(--fb));font-weight:var(--wdmg,800);color:#fff3dc;font-size:1.5em;paint-order:stroke fill;-webkit-text-stroke:.14em #2a1810;text-shadow:0 .08em .15em rgba(0,0,0,.5)}
.d1{left:36%;top:46%}.d2{left:52%;top:40%;font-size:1.8em}.d3{left:44%;top:56%;font-size:2.8em;color:#ffd36b}.d4{left:60%;top:52%;font-size:1.2em;opacity:.85}.d5{left:30%;top:60%;color:#7ee0b9}.d6{left:64%;top:62%}
.dn.crit{font-family:var(--fd);font-weight:var(--wcrit,700)}
@media (max-aspect-ratio:1/1){.hp{width:5em}.hc{top:9%}.hl{top:3%}.hr{top:3%;gap:.8em}.d1{left:18%}.d2{left:50%}.d3{left:30%}.d6{left:55%}.toast{white-space:normal;width:88%;text-align:center}}
`;

const OPTS = {
  u1: {
    name: 'U1 current (Cormorant Garamond / Figtree / Caveat)', keys: ['cormorant', 'figtree', 'caveat'],
    css: `:root{--fd:"Cormorant Garamond",Georgia,serif;--fb:Figtree,"Segoe UI",sans-serif;--fw:Caveat,cursive;--wsz:1.25em}
${WHISPER}{font-style:normal;font-size:1.15em;font-weight:500}.hcard h3 small{font-size:.75em}h1,h2,h3{font-weight:700}`,
  },
  a: {
    name: 'A Chancery Storybook (Fondamento / Alegreya Sans / Fondamento Italic)', keys: ['fondamento', 'alegreyasans'],
    css: `:root{--fd:Fondamento,Georgia,serif;--fb:"Alegreya Sans","Segoe UI",sans-serif;--fw:Fondamento,cursive;--wst:italic;--fnum:"Alegreya Sans",sans-serif;--fdmg:"Alegreya Sans",sans-serif;--wdmg:800;--wcrit:400;--wsz:1.1em}
body{font-size:calc(var(--b) * 1.06)}
h1,h2,h3{font-weight:400;letter-spacing:.01em;text-transform:none}h2{font-size:2.3em}.logo{letter-spacing:.015em;font-weight:400}
.kick{font-family:var(--fb);font-weight:700;font-size:.9em;letter-spacing:.24em}
.btn{font-size:1.16em;letter-spacing:.02em;text-transform:none}.btn b{font-weight:400}.btn small{font-size:.74em}
.card .big,.card.evo .big,.rp .big,.chip b{font-weight:400}.card.evo .big{text-transform:none;letter-spacing:.04em;font-size:2.3em}
.bh span{font-family:var(--fb);font-weight:700}.bcard b{font-family:var(--fd);font-weight:400}
${WHISPER}{font-style:italic;font-size:1.08em;font-weight:400}.hcard h3 small{font-style:italic;font-size:.62em}
.tagline{font-size:1.6em;letter-spacing:.03em}.pill{font-weight:700;text-transform:none;font-size:1em}`,
  },
  b: {
    name: 'B Soft Wonk Cosy (Fraunces / Nunito / Kalam)', keys: ['fraunces', 'nunito', 'kalam'],
    css: `:root{--fd:Fraunces,Georgia,serif;--fb:Nunito,"Segoe UI",sans-serif;--fw:Kalam,cursive;--fdmg:Nunito,sans-serif;--wdmg:800;--wcrit:800;--wsz:1.05em}
h1,h2,h3,.logo,.big,.btn b,.chip b,.bcard b{font-variation-settings:"SOFT" 100,"WONK" 1,"opsz" 72}
h1,h2,h3{font-weight:700;letter-spacing:.005em;text-transform:none}h2{font-size:2.15em}.logo{font-weight:800;letter-spacing:-.005em}
.kick{font-family:var(--fb);font-weight:800;font-size:.88em;letter-spacing:.22em}
.btn{font-size:1.08em;letter-spacing:.01em;text-transform:none}.btn b{font-weight:700}.btn small{font-size:.76em}
.card .big,.rp .big,.chip b{font-weight:700}.card.evo .big{text-transform:none;letter-spacing:.02em;font-size:2.3em;font-weight:800}
.bh span{font-family:var(--fb);font-weight:800}.bcard b{font-weight:700}.pill{font-weight:800;text-transform:none}
${WHISPER}{font-style:normal;font-size:1.02em;font-weight:400}.hcard h3 small{font-size:.58em;font-weight:400}
.tagline{font-size:1.4em;letter-spacing:.02em}`,
  },
  c: {
    name: 'C Old Print, Haunted (IM Fell English SC / Alegreya / IM Fell English Italic)', keys: ['fellsc', 'fell', 'alegreya'],
    css: `:root{--fd:"IM Fell English SC",Georgia,serif;--fb:Alegreya,Georgia,serif;--fw:"IM Fell English",Georgia,serif;--wst:italic;--fnum:Alegreya,serif;--fdmg:Alegreya,serif;--wdmg:800;--wcrit:400;--wsz:1.2em}
body{font-size:calc(var(--b) * 1.07)}
h1,h2,h3{font-weight:400;letter-spacing:.05em;text-transform:none}h2{font-size:2.2em}.logo{letter-spacing:.06em;font-weight:400}
.kick{font-family:var(--fb);font-weight:700;font-size:.9em;letter-spacing:.22em}
.btn{font-size:1.1em;letter-spacing:.08em;text-transform:none}.btn b{font-weight:400}.btn small{font-size:.8em;letter-spacing:0}
.card .big,.rp .big,.chip b{font-weight:400}.card.evo .big{text-transform:none;letter-spacing:.08em;font-size:2.2em}
.bh span{font-family:var(--fb);font-weight:700}.bcard b{font-family:var(--fd);font-weight:400;letter-spacing:.04em}.pill{font-weight:700;text-transform:none;letter-spacing:.03em}
${WHISPER}{font-style:italic;font-size:1.16em;font-weight:400}.hcard h3 small{font-size:.66em;font-style:italic}
.tagline{font-size:1.6em;letter-spacing:.04em}`,
  },
};

const only = process.argv.slice(2);
const c = await chrome();
const lines = [];
for (const [oid, o] of Object.entries(OPTS)) for (const [sname, fn] of Object.entries(ALL)) {
  if (only.length && !only.includes(oid) && !only.includes(sname)) continue;
  const f = join(HERE, `${oid}-${sname}.html`);
  writeFileSync(f, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hollowlight font option ${oid.toUpperCase()}: ${sname}</title>${link(o.keys)}<style>${COMMON}${SKEL}${NEW}${o.css}${FLOOR}</style></head><body><div class="scr" data-s="${sname}">${fn()}</div></body></html>`);
  for (const [sz, w, h, dpr] of SIZES) {
    await c.shot(f, join(HERE, `${oid}-${sname}-${sz}.png`), w, h, dpr);
    const m = await c.ev(`(()=>{const vw=innerWidth,vh=innerHeight;const bad=[];for(const e of document.querySelectorAll('.scr *')){if(e.closest('svg')||e.classList.contains('eye')||e.classList.contains('f')||e.classList.contains('bgscene')||e.classList.contains('dim')||e.classList.contains('badge')||e.closest('.badge')||e.classList.contains('stitch')||e.classList.contains('leak')||e.tagName==='I'||e.tagName==='U'||e.classList.contains('dmgfield')||e.classList.contains('dn'))continue;const r=e.getBoundingClientRect();if(!r.width)continue;if(r.bottom>vh+1||r.right>vw+1||r.left<-1||r.top<-1)bad.push(e.className||e.tagName);}const small=[];for(const e of document.querySelectorAll('.scr *')){if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<10.9)small.push(e.tagName+'.'+e.className+':'+fs.toFixed(1));}const fam=[...new Set([...document.querySelectorAll('.scr *')].map(e=>getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g,'')))];const loaded=[...document.fonts].filter(x=>x.status==='loaded').map(x=>x.family.replace(/"/g,'')).filter((v,i,a)=>a.indexOf(v)===i);return JSON.stringify({overflow:[...new Set(bad)].slice(0,6),small:[...new Set(small)].slice(0,5),loaded})})()`);
    lines.push(`${oid}-${sname}-${sz} ${m}`);
  }
}
if (!only.length) writeFileSync(join(HERE, 'measured.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
c.close();
