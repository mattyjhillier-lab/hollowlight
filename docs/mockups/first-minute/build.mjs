// First-minute mock-ups (design only, NOT game code). node build.mjs && node shoot.mjs
// Static HTML over REAL in-game captures (docs/screenshots/dr/dr1, 0:40 into a Twilight run, true size), game fonts + Lantern Glass tokens.
// Device copy is picked by width (< 900 px = touch copy), as the game will pick it by input method.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const out = (f, html) => { writeFileSync(join(HERE, f), html); console.log('wrote', f); };
const SS = '../../screenshots/dr/dr1/';

const CSS = `
@font-face{font-family:HLC;src:url(../../../src/assets/fonts/hollowlight-chancery.woff2) format('woff2')}
@font-face{font-family:HLCI;src:url(../../../src/assets/fonts/hollowlight-chancery-italic.woff2) format('woff2')}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-400.woff2) format('woff2');font-weight:400}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-700.woff2) format('woff2');font-weight:700}
:root{--ink:#140f0c;--brass:#d8b26a;--brassD:#8d6c34;--cream:#fff3dc;--dim:rgba(255,243,220,.84);--mute:#a8b0c4;--gold:#ffd36b;--glassA:#303c56;--glassB:#161c2a;--wolf:#9fd8ff}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;color:var(--cream);font-family:AS,"Segoe UI",sans-serif;font-size:16px;background:#0c1220}
.bg{position:fixed;inset:0;background:url(${SS}m1-dark-0m40-desk-hit-300ms.jpg) center/cover no-repeat}
@media (max-width:899px) and (orientation:landscape){.bg{background-image:url(${SS}m1-dark-0m40-land-hit-60ms.jpg)}}
@media (orientation:portrait){.bg{background-image:url(${SS}m1-dark-0m40-port-hit-60ms.jpg)}}
.disp{font-family:HLC,Georgia,serif}.wh{font-family:HLCI,Georgia,serif}
.plate{position:fixed;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:10px 18px;border-radius:14px;
 background:linear-gradient(180deg,rgba(48,60,86,.92),rgba(22,28,42,.92));border:1.5px solid var(--brass);box-shadow:0 4px 18px rgba(0,0,0,.5),0 0 22px rgba(255,211,107,.18);max-width:calc(100vw - 32px)}
.plate .t{font-size:18px;font-weight:700;line-height:1.2}.plate .w{font-size:15px;color:var(--dim);line-height:1.25}
.kb{display:inline-block;min-width:26px;padding:2px 7px;border-radius:6px;background:#efe4cc;color:var(--ink);font-weight:700;font-size:14px;text-align:center;box-shadow:0 2px 0 var(--brassD);margin:0 2px}
.thread{position:absolute;left:14px;right:14px;bottom:5px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--gold) 62%,rgba(255,243,220,.18) 62%)}
.skip{font-size:13px;color:var(--mute);white-space:nowrap}
.desk{display:inline}.touch{display:none}
@media (max-width:899px){.desk{display:none}.touch{display:inline}.plate{padding:8px 14px}.plate .t{font-size:16px}.plate .w{font-size:14px}}
.pos-move{bottom:112px}
@media (orientation:portrait){.pos-ab{left:16px!important;right:120px!important}}
@media (max-width:899px){.note.desk{display:none}}
@media (max-width:899px) and (orientation:landscape){.whisper{top:58px!important}.cards{top:128px!important}}
@media (orientation:portrait){.whisper{top:150px!important}.cards{top:250px!important}}
@media (max-width:899px) and (orientation:landscape){.pos-move{bottom:auto;top:84px}}
@media (orientation:portrait){.pos-move{bottom:auto;top:150px}}
.ring{position:fixed;border:2.5px solid var(--gold);border-radius:50%;box-shadow:0 0 16px var(--gold)}
.ghost{position:fixed;width:74px;height:74px;border-radius:50%;border:2px dashed rgba(255,243,220,.55);background:rgba(255,243,220,.08)}
.veil{position:fixed;inset:0;background:rgba(8,12,22,.62)}
.whisper{position:fixed;left:50%;transform:translateX(-50%);text-align:center;width:min(92vw,720px)}
.whisper .h{font-size:30px;color:var(--gold)}.whisper .w{font-size:17px;color:var(--dim);margin-top:4px}
.cards{position:fixed;left:50%;transform:translateX(-50%);display:flex;gap:18px}
.card{width:200px;height:250px;border-radius:100px 100px 14px 14px;padding:56px 16px 14px;text-align:center;position:relative;
 background:linear-gradient(180deg,#3a4866,#1a2234);border:2px solid var(--brass);box-shadow:0 6px 20px rgba(0,0,0,.55)}
.card .ic{width:58px;height:58px;border-radius:50%;margin:0 auto 10px;background:radial-gradient(circle at 40% 35%,#e8f6ff,var(--wolf) 55%,#3d6f9a);box-shadow:0 0 14px var(--wolf)}
.card.orb .ic{background:radial-gradient(circle at 40% 35%,#fff,#e8e0ff 50%,#7f6cc8);box-shadow:0 0 14px #c9bdff}
.card .n{font-size:19px;font-weight:700}.card .d{font-size:14px;color:var(--dim);margin-top:6px;line-height:1.25}
.card .pips{margin-top:10px;letter-spacing:4px;color:var(--gold);font-size:13px}
.card .new{position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:700;color:var(--ink);background:var(--gold);border-radius:8px;padding:1px 8px}
.card .k{position:absolute;bottom:-14px;left:50%;transform:translateX(-50%)}
.card.hl{outline:3px solid rgba(255,211,107,.55);outline-offset:4px}
.note{position:fixed;font-size:14px;color:var(--gold);display:flex;align-items:center;gap:6px}
.note i{display:block;width:40px;height:2px;background:var(--gold)}
@media (max-width:899px) and (orientation:landscape){.card{width:170px;height:200px;padding-top:44px}.card .ic{width:44px;height:44px}.card .d{font-size:13px}.whisper .h{font-size:24px}.whisper .w{font-size:15px}}
@media (orientation:portrait){.cards{flex-direction:column;gap:12px}.card{width:320px;height:auto;border-radius:16px;padding:12px 14px 12px 82px;text-align:left}
 .card .ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);margin:0}.card .new{left:auto;right:12px;transform:none}.card .k{display:none}.card .pips{margin-top:4px}.whisper .h{font-size:24px}}
.res{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100vw - 32px));padding:22px 24px;border-radius:18px;
 background:linear-gradient(180deg,rgba(48,60,86,.97),rgba(22,28,42,.97));border:2px solid var(--brass);box-shadow:0 10px 40px rgba(0,0,0,.6)}
.res .k{font-size:13px;color:var(--mute);letter-spacing:.06em;text-transform:uppercase}.res h2{font-size:34px;font-weight:400;margin:4px 0 2px}
.res .cause{font-size:16px;color:var(--dim)}.tiles{display:flex;gap:10px;margin:14px 0}.tile{flex:1;padding:10px;border-radius:12px;background:rgba(255,243,220,.07);text-align:center}
.tile b{display:block;font-size:22px}.tile span{font-size:13px;color:var(--mute)}
.learn{border-left:3px solid var(--gold);padding:8px 12px;background:rgba(255,211,107,.08);border-radius:0 10px 10px 0;margin:6px 0 14px}
.learn .t{font-size:15px;font-weight:700;color:var(--gold)}.learn .w{font-size:15px;color:var(--dim);line-height:1.3}
.btns{display:flex;gap:10px}.btn{flex:1;text-align:center;padding:11px;border-radius:12px;font-weight:700;border:1.5px solid var(--brass);font-size:16px}
.btn.p{background:linear-gradient(180deg,#ffe09a,#d8b26a);color:var(--ink);box-shadow:0 0 18px rgba(255,211,107,.4)}
@media (max-height:420px){.res{padding:12px 18px}.res h2{font-size:26px}.tiles{margin:8px 0}.learn{margin:4px 0 8px}.tile b{font-size:18px}}
`;
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${CSS}</style></head><body><div class="bg"></div>${body}</body></html>`;

// 1. Movement whisper at 0:01 (hint 1 of the first-run ladder). Ghost stick shows where the thumb goes on touch.
out('fm-move.html', page('First minute: move', `
<div class="plate pos-move"><div>
 <div class="t"><span class="desk"><span class="kb">W</span><span class="kb">A</span><span class="kb">S</span><span class="kb">D</span> or arrows to walk</span><span class="touch">Drag anywhere to walk</span></div>
 <div class="w wh">Your spirits fight for you. Keep moving.</div></div>
 <span class="skip desk">Tab: hide tips</span><div class="thread"></div></div>
<div class="ghost touch" style="left:9%;bottom:12%"></div>`));

// 2. Ability ready at 0:10: ring on the ability button + plate beside it.
out('fm-ability.html', page('First minute: ability', `
<div class="ring desk" style="right:28px;bottom:42px;width:100px;height:100px"></div>
<div class="plate pos-ab" style="left:auto;right:140px;transform:none;bottom:60px"><div>
 <div class="t"><span class="desk">Press <span class="kb">SPACE</span>: Pack Howl</span><span class="touch">Tap the wolf: Pack Howl</span></div>
 <div class="w wh">Your wolves rush in together. It recharges.</div></div><div class="thread"></div></div>`));

// 3. First level-up offer: whisper line + one-time 'new' tag + rank pips explained by one note.
out('fm-levelup.html', page('First minute: first level-up', `<div class="veil"></div>
<div class="whisper" style="top:7%"><div class="h disp">Your light grows</div><div class="w wh">Pick one. Each card makes a spirit stronger.</div></div>
<div class="cards" style="top:30%">
 <div class="card hl"><div class="ic"></div><div class="n">Pack size</div><div class="d">+1 wolf runs with you</div><div class="pips">● ○ ○ ○ ○</div><span class="kb k desk">1</span></div>
 <div class="card"><div class="ic"></div><div class="n">Bite power</div><div class="d">Each bite hits 20% harder</div><div class="pips">● ○ ○ ○ ○</div><span class="kb k desk">2</span></div>
 <div class="card orb"><span class="new">NEW</span><div class="ic"></div><div class="n">Holy Orbit</div><div class="d">A second spirit: flames circle you</div><div class="pips">new weapon</div><span class="kb k desk">3</span></div>
</div>
<div class="note desk" style="left:calc(50% - 330px);top:calc(30% + 290px)"><i></i>dots = rank, 5 is the most</div>`));

// 4. First death results: the locked one-screen card + ONE 'what this run taught' line + the Lantern Web as the main button.
out('fm-results.html', page('First minute: first death', `<div class="veil"></div>
<div class="res"><div class="k">Night 1 · Cursed Forest · Wren</div><h2 class="disp">The lantern gutters</h2>
<div class="cause">Struck down by a Fell Wolf's lunge at 6:12</div>
<div class="tiles"><div class="tile"><b>412</b><span>gold kept</span></div><div class="tile"><b>Lv 14</b><span>reached</span></div><div class="tile"><b>1</b><span>evolution</span></div></div>
<div class="learn"><div class="t">Your gold is safe</div><div class="w">Spend it in the Lantern Web: every lantern you light makes the next night easier.</div></div>
<div class="btns"><div class="btn p">Lantern Web</div><div class="btn">Again</div></div></div>`));

// 5. Options board (desktop only): the three questions side by side.
const col = (h, a, b, c) => `<div class="oc"><h3 class="disp">${h}</h3><div class="o r"><b>A (Recommended)</b>${a}</div><div class="o"><b>B</b>${b}</div><div class="o"><b>C</b>${c}</div></div>`;
out('fm-opt-desk.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>First minute options</title><style>${CSS}
body{background:radial-gradient(ellipse 70% 60% at 50% 35%,#2a3550,#0a0f1a)}.wrap{display:flex;gap:16px;padding:24px}.oc{flex:1}
.oc h3{font-size:24px;font-weight:400;color:var(--gold);margin-bottom:10px}.o{padding:10px 12px;border-radius:12px;background:rgba(255,243,220,.06);border:1px solid rgba(216,178,106,.35);margin-bottom:10px;font-size:14.5px;line-height:1.3;color:var(--dim)}
.o b{display:block;color:var(--cream);font-size:15px;margin-bottom:3px}.o.r{border:2px solid var(--brass);background:rgba(255,211,107,.09)}h1{font-size:30px;font-weight:400;padding:20px 24px 0}</style></head><body>
<h1 class="disp">First minute: three questions</h1><div class="wrap">
${col('1. How we teach', 'Lantern whispers: one small plate at a time, triggered by what you do, fades by itself, first time only, never pauses.', 'Guided first night: run 1 is scripted for 60 s (few foes, one step at a time, waits for you to move / pick / press).', 'Practice dusk: a safe 90 s clearing before the real first run, then the real night starts.')}
${col('2. First cards and first evolution', 'One line above the first offer, NEW tags, rank dots named once; the first gold "stirs" edge gets one line; the first evolution card says what just happened.', 'Card anatomy: the first offer slows in with three labelled callouts (spirit, effect, rank) you tap away.', 'Codex first: nothing extra in the run; the results screen and codex explain cards and recipes afterwards.')}
${col('3. Game-feel pass', 'Sharp small set (8 items): pops, kick, flourish, hit-stop only on big moments, phone buzz, all bounded and Calm-aware.', 'Big juice pass: squash/stretch on every hit, knockback, slow-mo on level-up, flashes and trails everywhere.', 'Tune only: no new effects; measure and re-tune what is built (shake, stop, numbers, sounds).')}
</div></body></html>`);
