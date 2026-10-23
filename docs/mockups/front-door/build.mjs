// Front door mock-ups (design only, NOT game code). node build.mjs && node shoot.mjs
// Static HTML, code-drawn, Lantern Glass tokens (as in difficulty-tiers/build.mjs) and the game's own fonts + hero portraits.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const out = (f, html) => { writeFileSync(join(HERE, f), html); console.log('wrote', f); };

// ---- glyphs (shape carries meaning, never colour alone) ----
const G = {
  twilight: '<svg viewBox="0 0 24 24" class="gl"><path d="M5 16a7 7 0 0 1 14 0z" fill="currentColor"/><path d="M2 16.5h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  deep: '<svg viewBox="0 0 24 24" class="gl"><path d="M14.5 3.5a8.5 8.5 0 1 0 6 14.6A7 7 0 0 1 14.5 3.5z" fill="currentColor"/></svg>',
  long: '<svg viewBox="0 0 24 24" class="gl"><circle cx="11" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M19.5 2.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="currentColor"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="gl"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
  star: '<svg viewBox="0 0 24 24" class="gl"><path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z" fill="currentColor"/></svg>',
  lantern: (c = 'var(--gold)') => `<svg viewBox="0 0 40 52" class="lan"><path d="M14 8a6 6 0 0 1 12 0" fill="none" stroke="var(--brass)" stroke-width="2.5"/><rect x="9" y="9" width="22" height="5" rx="2" fill="var(--brass)"/><rect x="10" y="14" width="20" height="26" rx="5" fill="rgba(20,28,44,.85)" stroke="var(--brass)" stroke-width="2.5"/><path d="M20 20c4 5 4 9 0 13-4-4-4-8 0-13z" fill="${c}"/><rect x="9" y="40" width="22" height="5" rx="2" fill="var(--brass)"/></svg>`,
};
const tierGlyph = { twilight: G.twilight, deep: G.deep, long: G.long };
const stars = (n, of = 3) => Array.from({ length: of }, (_, i) => `<span class="st ${i < n ? 'on' : ''}">${G.star}</span>`).join('');
const key = (k) => `<span class="kb">${esc(k)}</span>`;

const CSS = `
@font-face{font-family:HLC;src:url(../../../src/assets/fonts/hollowlight-chancery.woff2) format('woff2')}
@font-face{font-family:HLCI;src:url(../../../src/assets/fonts/hollowlight-chancery-italic.woff2) format('woff2')}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-400.woff2) format('woff2');font-weight:400}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-700.woff2) format('woff2');font-weight:700}
:root{--ink:#140f0c;--brass:#d8b26a;--brassD:#8d6c34;--cream:#fff3dc;--dim:rgba(255,243,220,.82);--mute:#a8b0c4;--teal:#6fd3c5;--gold:#ffd36b;--lock:#6b7490;
 --glassA:#303c56;--glassB:#161c2a;--night:#0c1220;--twi:#ffb867;--deep:#9aa8ff;--long:#d4ccff;--dawn1:#ffd0b0;--dawn2:#bfeaf0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;color:var(--cream);font-family:AS,"Segoe UI",sans-serif;font-size:16px}
body{background:radial-gradient(ellipse 70% 60% at 50% 35%,#2a3550 0%,#141b2b 55%,#0a0f1a 100%)}
h1,h2,h3,.disp{font-family:HLC,Georgia,serif;font-weight:400}
.wh{font-family:HLCI,Georgia,serif}
.gl{width:1em;height:1em;vertical-align:-.14em;display:inline-block}
.lan{width:1.6em;height:2.1em}
.coin,.shard,.glass{display:inline-block;vertical-align:-.12em;margin-right:.25em}
.coin{width:.85em;height:.85em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff0b0,#d8b26a 60%,#8d6c34);box-shadow:0 0 0 1.5px var(--ink)}
.shard{width:.72em;height:.9em;background:linear-gradient(135deg,#e9ddff,#9d86ff);clip-path:polygon(50% 0,100% 40%,70% 100%,30% 100%,0 40%)}
.glass{width:.72em;height:.95em;background:linear-gradient(160deg,#fff7ee 0%,var(--dawn1) 45%,var(--dawn2) 100%);clip-path:polygon(50% 0,92% 34%,74% 100%,26% 100%,8% 34%)}
.pill{display:inline-flex;align-items:center;gap:.25em;padding:.2em .75em;border-radius:99px;border:1.5px solid var(--brassD);background:rgba(12,9,8,.6);font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.k{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);font-weight:700}
.new{display:inline-block;background:var(--teal);color:#06231f;font-weight:700;font-size:12px;letter-spacing:.1em;padding:2px 10px 2px 8px;clip-path:polygon(0 0,100% 0,90% 50%,100% 100%,0 100%)}
.panel{background:linear-gradient(180deg,var(--glassA),var(--glassB));border:2px solid var(--brass);border-radius:18px;box-shadow:inset 0 1px 0 rgba(255,236,190,.35),0 8px 30px rgba(0,0,0,.45)}
.btn{min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:0 22px;border-radius:99px;font-family:HLC,Georgia,serif;font-size:21px;border:2px solid var(--brass);color:var(--cream);background:linear-gradient(180deg,#2e3a55,#18203a);box-shadow:inset 0 1px 0 rgba(255,236,190,.35),0 4px 14px rgba(0,0,0,.4);white-space:nowrap}
.btn.pri{background:linear-gradient(180deg,#ffcf7a,#f19a3a);color:#2a1606;border-color:#ffe2a6;box-shadow:0 0 22px rgba(255,180,90,.45),inset 0 1px 0 #fff3cf}
.btn.q{background:transparent;border-color:var(--brassD);font-size:18px}
.btn .sub{display:block;font-family:HLCI,Georgia,serif;font-size:15px;opacity:.85}
.kb{display:inline-block;min-width:26px;padding:1px 7px;border-radius:7px;font:700 12px AS,sans-serif;border:1.5px solid currentColor;opacity:.8;text-align:center}
.focus{outline:3px solid var(--cream);outline-offset:4px}
.thread{height:0;border-top:2px dashed rgba(216,178,106,.6)}
.st{color:#8a93b0}.st.on{color:var(--gold)}.st:not(.on) path{fill:none;stroke:currentColor;stroke-width:1.8}
.note{position:fixed;left:50%;top:2px;transform:translateX(-50%);font-size:11px;color:var(--mute);opacity:.55;white-space:nowrap}
.touch .kb{display:none}
@media (max-height:480px){.btn{min-height:44px;font-size:18px;padding:0 16px}.btn .sub{font-size:13px}}
`;
const page = (title, body, extra = '', cls = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}${extra}</style><script>if(matchMedia('(pointer:coarse)').matches||innerWidth<900)document.documentElement.classList.add('touch')</script></head><body class="${cls}">${body}<div class="note">MOCK-UP · front-door-v1 · not game code</div></body></html>`;

const purses = (glass = true) => `<div class="purses"><span class="pill"><i class="coin"></i>2,410</span><span class="pill"><i class="shard"></i>6</span>${glass ? '<span class="pill" title="Dawnglass"><i class="glass"></i>4</span>' : ''}</div>`;

// ================= 1A TITLE (Lantern Hall: title is the cover, profile chip, no profile screen with one profile) =================
const TITLECSS = `
.top{position:fixed;top:14px;left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.chip{display:flex;align-items:center;gap:10px;min-height:48px;padding:4px 16px 4px 6px;border-radius:99px;border:1.5px solid var(--brassD);background:rgba(12,9,8,.55)}
.chip .lan{width:30px;height:40px}.chip b{font-family:HLC,Georgia,serif;font-weight:400;font-size:19px}.chip small{display:block;color:var(--mute);font-size:12px}
.purses{display:flex;gap:8px;font-size:15px}
.mid{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:70px 16px 40px}
.wm{font-size:96px;line-height:.9;background:linear-gradient(180deg,#fff3cf,#f3c56c 55%,#b9822f);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 #4a2f12) drop-shadow(0 0 18px rgba(255,190,100,.35))}
.tag{font-size:24px;color:var(--gold);margin-top:-4px}
.menu{display:flex;flex-direction:column;gap:12px;width:min(420px,100%);margin-top:10px}
.menu .btn{justify-content:space-between;text-align:left;border-radius:22px;padding:6px 18px;min-height:56px}
.menu .btn>span:first-child{display:flex;flex-direction:column}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--teal);margin-left:6px;vertical-align:.15em}
.row2{display:flex;gap:12px}.row2 .btn{flex:1}
.foot{position:fixed;bottom:12px;right:16px;font-size:13px;color:var(--dim);text-decoration:underline}
.ver{position:fixed;bottom:22px;left:16px;font-size:12px;color:var(--mute)}
@media (max-height:480px){.wm{font-size:58px}.tag{font-size:18px}.mid{padding:60px 16px 20px;gap:6px}.menu{width:min(560px,100%);margin-top:4px;gap:8px}.menu .btn{min-height:48px}.menu .btn .sub{display:none}.row2{gap:8px}}
@media (max-aspect-ratio:1/1){.wm{font-size:54px}.top .purses{font-size:13px;gap:4px}.chip{padding-right:10px}.mid{padding-bottom:56px}}
`;
const title = () => page('Front door 1A title', `
<div class="top"><div class="chip">${G.lantern('#ffb867')}<span><b>Matt</b><small>Switch lantern</small></span></div>${purses()}</div>
<div class="mid">
  <div class="k">Chapter 1 · The Cursed Forest</div>
  <h1 class="wm">Hollowlight</h1>
  <div class="tag wh">Spirits of the Dusk</div>
  <div class="menu">
    <div class="btn pri focus"><span>Continue<span class="sub">Wren · Deep Dusk is waiting</span></span>${key('Enter')}</div>
    <div class="row2">
      <div class="btn"><span><span>Skill Tree <i class="dot" aria-label="something to buy"></i></span><span class="sub">2,410 gold to spend</span></span>${key('T')}</div>
      <div class="btn"><span>Settings<span class="sub">Sound, motion, saves</span></span>${key('S')}</div>
    </div>
    <div class="btn q"><span>New game<span class="sub">Light a new lantern · 2 of 3 free</span></span>${key('N')}</div>
  </div>
</div>
<div class="ver">v0.5.0</div><a class="foot">Install / Full screen</a>`, TITLECSS);

// ================= 1A PROFILES (only when 2+ lanterns, or Switch / New game) =================
const PROFCSS = `
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:28px 16px 18px;gap:14px}
h2{font-size:44px}.sub2{color:var(--dim);font-size:18px;margin-top:-8px}
.row{display:flex;gap:22px;align-items:flex-start;position:relative;margin-top:auto}
.row:before{content:"";position:absolute;left:-30px;right:-30px;top:-14px;border-top:2px dashed rgba(216,178,106,.55)}
.slot{width:300px;position:relative;padding:18px 18px 16px;display:flex;flex-direction:column;gap:8px;border-radius:90px 90px 18px 18px;padding-top:44px}
.slot:before{content:"";position:absolute;top:-16px;left:50%;width:14px;height:16px;margin-left:-7px;border:2px solid var(--brass);border-bottom:0;border-radius:8px 8px 0 0}
.slot .face{display:flex;align-items:center;gap:12px}
.slot img{width:74px;height:74px;border-radius:50% 50% 12px 12px;border:2px solid var(--brass);object-fit:cover;background:#1b2336}
.slot h3{font-size:28px}.slot .meta{font-size:14px;color:var(--dim);line-height:1.35}
.slot .tiers{display:flex;gap:10px;font-size:14px;color:var(--mute)}
.slot .tiers span{display:inline-flex;align-items:center;gap:4px}
.slot .acts{display:flex;gap:8px;margin-top:4px}.slot .acts .btn{flex:1}.slot .acts .btn.q{flex:0 0 52px;padding:0}
.slot.empty{border-style:dashed;background:rgba(22,28,42,.55);align-items:center;justify-content:center;min-height:250px;text-align:center;color:var(--dim)}
.slot.empty .plus{font-size:44px;font-family:HLC,Georgia,serif;color:var(--brass)}
.foot2{margin-top:auto;display:flex;align-items:center;gap:16px;width:min(960px,100%);justify-content:space-between}
.foot2 p{font-size:14px;color:var(--mute)}
.tw{color:var(--twi)}.dd{color:var(--deep)}.ln{color:var(--long)}
@media (max-height:480px){.slot{border-radius:60px 60px 16px 16px}.wrap{padding:14px 16px 10px;gap:6px}h2{font-size:30px}.sub2{font-size:14px;margin-top:-4px}.row{gap:12px;margin-top:16px}.slot{width:250px;padding:26px 12px 10px;gap:5px}.slot img{width:48px;height:48px}.slot h3{font-size:22px}.slot .meta{font-size:12px}.slot.empty{min-height:190px}.foot2 p{display:none}}
@media (max-aspect-ratio:1/1){.row{flex-direction:column;gap:12px;width:100%;margin-top:8px}.row:before{display:none}.slot{width:100%;border-radius:18px;padding-top:14px}.slot:before{display:none}.slot.empty{min-height:84px;flex-direction:row;gap:12px}.slot img{width:56px;height:56px}h2{font-size:34px}.foot2{flex-direction:column-reverse;align-items:stretch}.foot2 .btn{width:100%}.slot .meta{font-size:13px}}
`;
const profiles = () => page('Front door 1A profiles', `
<div class="wrap">
  <h2>Whose lantern tonight?</h2>
  <div class="sub2 wh">Each lantern keeps its own tree, heroes and nights.</div>
  <div class="row">
    <div class="slot panel focus">
      <div class="face"><img src="../../../src/assets/heroes/wren.webp" alt=""><div><h3>Matt</h3><div class="meta">14 nights · last lit today<br>2,410 gold · 6 shards</div></div></div>
      <div class="tiers"><span class="tw">${G.twilight} ${stars(2)}</span><span class="dd">${G.deep} open</span></div>
      <div class="acts"><div class="btn pri">Light it ${key('Enter')}</div><div class="btn q" aria-label="Manage Matt">···</div></div>
    </div>
    <div class="slot panel">
      <div class="face"><img src="../../../src/assets/heroes/elias.webp" alt=""><div><h3>Sam</h3><div class="meta">3 nights · last lit 2 days ago<br>380 gold</div></div></div>
      <div class="tiers"><span class="tw">${G.twilight} ${stars(0)}</span></div>
      <div class="acts"><div class="btn">Light it</div><div class="btn q" aria-label="Manage Sam">···</div></div>
    </div>
    <div class="slot panel empty"><div class="plus">+</div><div><b class="disp" style="font-size:22px">New lantern</b><div class="meta">Start fresh. Others are kept.</div></div></div>
  </div>
  <div class="foot2"><div class="btn">Back ${key('Esc')}</div><p>Lanterns live in this browser only. Use ··· &gt; Export to keep a copy.</p></div>
</div>`, PROFCSS);

// ================= 2A MAP + TIER SELECT =================
const forest = `<svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMax slice" class="art"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2140"/><stop offset="1" stop-color="#4b4a78"/></linearGradient><radialGradient id="lp" cx=".7" cy=".86" r=".38"><stop offset="0" stop-color="#ffd38a" stop-opacity=".65"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></radialGradient></defs><rect width="640" height="300" fill="url(#sk)"/>${[40, 120, 210, 300, 380, 470, 560, 620].map((x, i) => `<path d="M${x - 40} 300 L${x} ${70 + (i * 37) % 80} L${x + 40} 300z" fill="#11162a"/>`).join('')}<rect width="640" height="300" fill="url(#lp)"/><circle cx="448" cy="262" r="10" fill="#fff0c0"/>${[[90, 40], [250, 60], [330, 30], [520, 50], [600, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#cfd6ff" opacity=".7"/>`).join('')}</svg>`;
const MAPCSS = `
.wrap{position:absolute;inset:0;display:grid;grid-template-columns:1.08fr 1fr;grid-template-rows:auto 1fr auto;gap:14px 22px;padding:18px 24px 18px}
.hd{grid-column:1/3;display:flex;align-items:center;gap:18px}
.hd h2{font-size:40px;white-space:nowrap}.crumb{font-size:14px;color:var(--mute)}.crumb b{color:var(--cream)}
.hd .purses{margin-left:auto;display:flex;gap:8px}
.chs{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--mute)}
.chs i{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1.5px dashed var(--lock);font-style:normal;font-size:12px}
.chs i.on{border:2px solid var(--brass);background:radial-gradient(#ffd38a,#b9822f);color:#2a1606;font-weight:700}
.chs .t{width:14px;border-top:1.5px dashed var(--lock)}
.map{position:relative;overflow:hidden;display:flex;flex-direction:column;padding:0}
.map .art{flex:1;width:100%;min-height:0;display:block;border-radius:16px 16px 0 0}
.map .nm{position:absolute;left:22px;top:14px}.map .nm h3{font-size:40px;text-shadow:0 2px 8px #000}
.tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:12px;background:rgba(10,14,24,.85);border-radius:0 0 16px 16px}
.tier{position:relative;min-height:72px;border-radius:14px;border:1.5px solid var(--brassD);background:rgba(24,30,46,.9);padding:8px 12px;display:flex;flex-direction:column;justify-content:center;gap:2px}
.tier .n{font-family:HLC,Georgia,serif;font-size:22px;display:flex;align-items:center;gap:7px}
.tier small{font-size:13px;color:var(--dim)}
.tier.tw .n{color:var(--twi)}.tier.dd .n{color:var(--deep)}.tier.ln .n{color:var(--lock)}
.tier.sel{border:2.5px solid var(--deep);box-shadow:0 0 0 3px rgba(154,168,255,.25),0 0 18px rgba(154,168,255,.35)}
.tier.lock{border-style:dashed;background:rgba(14,18,28,.85)}
.tier .new{position:absolute;top:-11px;right:10px}
.bar{height:6px;border-radius:9px;background:#0b0f18;border:1px solid #2c3550;overflow:hidden;margin-top:3px}.bar i{display:block;height:100%;background:var(--teal)}
.side{padding:16px 20px;display:flex;flex-direction:column;gap:8px}
.side h3{font-size:30px;color:var(--deep);line-height:1.05}
.side ul{list-style:none;display:flex;flex-direction:column;gap:5px;font-size:16px}
.side li{position:relative;padding-left:15px}.side li:before{content:"";position:absolute;left:0;top:8px;width:7px;height:7px;border-radius:50%;background:var(--deep)}
.side .nudge{margin-top:auto}.tier .n{white-space:nowrap}
.marks{display:inline-flex;gap:4px;vertical-align:-.15em}.marks b{display:inline-block;width:15px;height:15px;border:2px solid var(--deep);transform:rotate(45deg) scale(.8)}
.marks b:nth-child(2){border-radius:50%;transform:none}.marks b:nth-child(3){clip-path:polygon(50% 0,100% 100%,0 100%);background:var(--deep);border:0}
.earn{display:flex;flex-wrap:wrap;gap:8px;font-size:15px}.earn .pill.t{border-color:var(--teal);color:var(--teal)}
.tools{font-size:14px;color:var(--dim)}.tools b{color:var(--cream)}
.rec{display:flex;gap:16px;font-size:14px;color:var(--dim);align-items:center}
.nudge{font-size:15px;color:var(--dim)}.nudge b{color:var(--teal)}
.acts{grid-column:1/3;display:flex;gap:12px;align-items:center}
.acts .sp{flex:1}
.acts .btn.pri{min-width:300px}
@media (max-height:480px){.wrap{gap:8px 14px;padding:8px 16px 8px;grid-template-columns:1fr 1fr}.hd h2{font-size:26px}.chs,.crumb{display:none}.map .nm h3{font-size:26px}.map .nm{top:8px;left:14px}
 .tiers{gap:6px;padding:6px}.tier{min-height:52px;padding:4px 8px}.tier .n{font-size:17px}.tier small{font-size:12px}
 .side{padding:8px 14px;gap:4px}.side h3{font-size:20px}.side ul{font-size:13px;gap:2px}.side li:nth-child(n+3){display:none}.earn{font-size:12px;gap:4px}.tools,.rec{display:none}.nudge{font-size:12px}.side .k{font-size:11px}
 .acts .btn.pri{min-width:220px}.hd .purses{font-size:13px}}
@media (max-aspect-ratio:1/1){.wrap{grid-template-columns:1fr;grid-template-rows:auto auto auto 1fr auto;gap:10px;padding:12px 16px 14px}.hd{grid-column:1;flex-wrap:wrap;gap:6px 10px}.hd h2{font-size:30px}.crumb{order:3;width:100%}.chs{display:none}
 .hd h2{font-size:28px}.hd .purses{font-size:13px;gap:4px}.crumb{font-size:13px}.map{overflow:visible}.map .art{height:120px;flex:none}.map .nm h3{font-size:28px}.tiers{gap:6px;padding:8px}.tier{min-height:60px;padding:5px 7px}.tier .n{font-size:15px;gap:4px}.tier small{font-size:12px}.tier .bar{display:none}
 .side{padding:12px 14px;gap:6px}.side h3{font-size:22px}.side ul{font-size:14px}.side li:nth-child(n+3){display:none}.earn{font-size:13px;gap:5px}.rec,.tools{display:none}.nudge{font-size:14px}
 .acts{grid-column:1;flex-wrap:wrap;align-content:flex-end}.acts .btn.pri{order:-1;width:100%;min-width:0}.acts .sp{display:none}.acts .btn:not(.pri){flex:1}.nudge-p{display:block}}
`;
const chapterStrip = `<div class="chs" aria-label="Chapters"><i class="on">1</i>${Array.from({ length: 7 }, (_, i) => `<span class="t"></span><i title="Chapter ${i + 2} sleeps in the fog">?</i>`).join('')}</div>`;
const mapSelect = () => page('Front door 2A map + tier', `
<div class="wrap">
  <div class="hd"><h2>Choose your night</h2><span class="crumb"><b>Wren</b> › Cursed Forest › Deep Dusk</span>${chapterStrip}${purses()}</div>
  <div class="map panel">
    ${forest}
    <div class="nm"><div class="k">Chapter 1</div><h3>Cursed Forest</h3></div>
    <div class="tiers" role="radiogroup" aria-label="Night">
      <div class="tier tw" role="radio" aria-checked="false"><span class="n">${G.twilight} Twilight</span><small>${stars(2)} cleared 2x</small></div>
      <div class="tier dd sel focus" role="radio" aria-checked="true"><span class="new">NEW</span><span class="n">${G.deep} Deep Dusk</span><small>Recommended next</small></div>
      <div class="tier ln lock" role="radio" aria-disabled="true"><span class="n">${G.lock} Long Night</span><small>Clear Deep Dusk once · 0/1</small><div class="bar"><i style="width:0"></i></div></div>
    </div>
  </div>
  <div class="side panel">
    <div class="k">${G.deep} Deep Dusk · harder night</div>
    <h3>The Hollow presses closer</h3>
    <ul>
      <li>Foes are tougher and hit a little harder</li>
      <li>From 4:00 some foes bear a Hollow mark <span class="marks" aria-hidden="true"><b></b><b></b><b></b></span> (one rule each)</li>
      <li>The Elder Treant is stronger</li>
      <li>Blessings, hearts and your tree work as on Twilight</li>
    </ul>
    <div class="k">You earn</div>
    <div class="earn"><span class="pill"><i class="coin"></i>gold x1.5</span><span class="pill"><i class="shard"></i>7 from the boss</span><span class="pill"><i class="glass"></i>Dawnglass up to 6</span><span class="pill t">first dawn +6</span></div>
    <div class="tools">Night tools here: <b>Fourth Card</b> (owned) · Fifth Hook (not yet)</div>
    <div class="rec">Best — · Clears 0 · ${stars(0)}</div>
    <div class="nudge"><b>Next light:</b> clear Deep Dusk with Wren and with Elias to light the Fifth Hook.</div>
  </div>
  <div class="acts"><div class="btn">Back ${key('Esc')}</div><div class="btn q">Skill Tree ${key('T')}</div><span class="sp"></span><div class="btn pri">Begin with Wren ${key('Enter')}</div></div>
</div>`, MAPCSS);

// ================= 3A RESULTS (locked U6 layout + tier badge, Dawnglass tile, first dawn, stars) =================
const RESCSS = `
.wrap{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1.25fr;grid-template-rows:1fr auto;gap:14px 30px;padding:24px 30px 18px}
body.win{background:radial-gradient(ellipse 60% 55% at 25% 20%,#8a7650 0%,#3a3020 40%,#151209 100%)}
body.loss{background:radial-gradient(ellipse 50% 50% at 25% 40%,#3a2c18 0%,#15110b 60%,#0b0906 100%)}
.left{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px}
.left .lan{width:96px;height:126px}
.loss .left .lan{opacity:.65;width:80px;height:104px}
.badge{display:inline-flex;align-items:center;gap:8px;padding:5px 16px;border-radius:99px;border:2px solid var(--deep);color:var(--deep);font-weight:700;font-size:16px;background:rgba(20,24,44,.6)}
.left h1{font-size:64px;line-height:1;color:var(--gold);text-shadow:0 0 22px rgba(255,200,100,.4)}
.loss .left h1{color:var(--cream);text-shadow:none;font-size:52px}
.left p{font-size:20px;color:var(--dim);max-width:420px}
.card{padding:18px 22px;display:flex;flex-direction:column;gap:10px;align-self:center}
.win .card{border:4px solid transparent;background:linear-gradient(180deg,var(--glassA),var(--glassB)) padding-box,linear-gradient(90deg,#ffb867,#ffd36b,#9ee3a8,#7fc8e8,#9aa8ff,#d4a5ff,#ffb867) border-box}
.time{display:flex;align-items:baseline;gap:12px}.time b{font-family:HLC,Georgia,serif;font-weight:400;font-size:54px;line-height:1}
.prog{height:10px;border-radius:9px;background:#0b0f18;border:1px solid #3a3020;position:relative}.prog i{position:absolute;inset:0 auto 0 0;border-radius:9px;background:linear-gradient(90deg,#f19a3a,#ffe7b0)}
.prog u{position:absolute;left:66.6%;top:-4px;bottom:-4px;border-left:2px solid var(--brass)}
.cur{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tile{border:1.5px solid #4a4a5a;border-radius:12px;padding:8px 12px;background:rgba(10,12,20,.6)}
.tile b{font-size:28px;display:flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums}
.tile small{font-size:13px;color:var(--dim)}
.tile.g{border-color:var(--dawn1);box-shadow:0 0 14px rgba(255,208,176,.25)}
.first{display:flex;gap:10px;align-items:center;border:1.5px solid var(--dawn1);border-radius:12px;padding:8px 12px;font-size:15px;background:rgba(255,208,176,.08)}
.first .st{color:var(--dawn1)}
.srow{display:flex;gap:16px;flex-wrap:wrap;font-size:14px;color:var(--dim)}.srow span{display:inline-flex;gap:5px;align-items:center}
.srow .st{font-size:15px}
.nxt{font-size:15px;display:flex;gap:10px;align-items:center}
.stats{display:flex;gap:18px;font-size:14px;color:var(--dim)}.stats b{color:var(--cream);font-size:18px}
.acts{grid-column:1/3;display:flex;justify-content:center;gap:16px}
.acts .btn{min-width:200px}.acts .btn.pri{min-width:380px}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--teal)}
.kept{font-size:14px;color:var(--dawn1)}
@media (max-height:480px){.wrap{padding:8px 16px 8px;gap:6px 14px;grid-template-columns:.8fr 1.3fr}.left .lan{width:46px;height:60px}.left h1{font-size:36px}.loss .left h1{font-size:30px}.left p{font-size:13px}.badge{font-size:13px;padding:3px 10px}
 .card{padding:8px 12px;gap:5px}.time b{font-size:32px}.tile{padding:4px 8px}.tile b{font-size:19px}.tile small{font-size:12px}.first{font-size:12px;padding:4px 8px}.srow{font-size:12px;gap:8px}.nxt,.stats{font-size:12px}.stats b{font-size:14px}
 .acts .btn{min-width:150px}.acts .btn.pri{min-width:240px}.left .k{font-size:11px}}
@media (max-aspect-ratio:1/1){.wrap{grid-template-columns:1fr;grid-template-rows:auto 1fr auto;padding:14px 16px;gap:10px}.left{gap:4px}.left .lan{width:56px;height:72px}.left h1{font-size:44px}.loss .left h1{font-size:38px}.left p{font-size:15px}
 .card{align-self:start;padding:12px 14px}.time b{font-size:38px}.cur{gap:6px}.tile{padding:6px 8px}.tile b{font-size:21px}.tile small{font-size:12px}.first{font-size:13px}
 .acts{grid-column:1;display:grid;grid-template-columns:1fr 1fr;gap:10px}.acts .btn{min-width:0}.acts .btn.pri{grid-column:1/3;order:-1;min-width:0}}
`;
const resultsWin = () => page('Front door 3A results win', `
<div class="wrap">
  <div class="left">${G.lantern('#ffe7a0')}
    <div class="k">Night 1 · Cursed Forest · Wren</div>
    <span class="badge">${G.deep} Deep Dusk · first dawn</span>
    <h1>Dawn</h1><p class="wh">Even the deeper dark gives way. Colour floods back.</p>
  </div>
  <div class="card panel">
    <div class="time"><b>15:00</b><span class="k">Survived the night</span></div>
    <div class="prog"><i style="right:0"></i><u></u></div>
    <div class="stats"><span>Level <b>19</b></span><span>Slain <b>1,904</b></span><span>Evolved <b>1</b></span><span>Marked foes <b>2</b></span></div>
    <div class="cur">
      <div class="tile"><b><i class="coin"></i>+1,680</b><small>gold · x1.5 Deep Dusk</small></div>
      <div class="tile"><b><i class="shard"></i>+8</b><small>shards · 7 boss + 1 first dawn</small></div>
      <div class="tile g"><b><i class="glass"></i>+12</b><small>Dawnglass · 6 + 6 first dawn</small></div>
    </div>
    <div class="first"><span class="st on">${G.star}</span><span><b>First dawn with Wren on Deep Dusk.</b> Elias has not seen it yet (+6 waiting).</span></div>
    <div class="srow"><span><span class="st on">${G.star}</span>Cleared</span><span><span class="st">${G.star}</span>Both heroes</span><span><span class="st">${G.star}</span>Bright Dawn: 3 Alphas, no revive</span></div>
    <div class="nxt"><span class="new">NEW</span> Long Night can be opened in the Lantern Web (Night Gate).</div>
  </div>
  <div class="acts"><div class="btn">Main menu ${key('Esc')}</div><div class="btn pri focus">Again · Deep Dusk ${key('R')}</div><div class="btn">Tree <i class="dot" aria-label="new"></i> ${key('T')}</div></div>
</div>`, RESCSS, 'win');
const resultsLoss = () => page('Front door 3A results death', `
<div class="wrap">
  <div class="left">${G.lantern('#c98a3a')}
    <div class="k">Night 1 · Cursed Forest · Wren</div>
    <span class="badge">${G.deep} Deep Dusk</span>
    <h1>The light dwindles</h1><p class="wh">The Treant fell, but the dark held on. The lantern still burns, a little.</p>
  </div>
  <div class="card panel">
    <div class="time"><b>11:42</b><span class="k">Time survived</span></div>
    <div class="prog"><i style="right:22%"></i><u></u></div>
    <div class="stats"><span><b>3:18</b> short of dawn</span><span>Level <b>17</b></span><span>Slain <b>1,377</b></span></div>
    <div class="cur">
      <div class="tile"><b><i class="coin"></i>+1,120</b><small>gold · x1.5 Deep Dusk</small></div>
      <div class="tile"><b><i class="shard"></i>+7</b><small>shards · boss kept</small></div>
      <div class="tile g"><b><i class="glass"></i>+3</b><small>Dawnglass · 2 boss + 1 marked, kept</small></div>
    </div>
    <div class="kept">What you earned before the fall is always kept.</div>
    <div class="nxt"><span class="st on" style="color:var(--teal)">${G.star}</span> Next light: Fourth Card · 1,800 gold more</div>
  </div>
  <div class="acts"><div class="btn">Main menu ${key('Esc')}</div><div class="btn pri focus">Again · Deep Dusk ${key('R')}</div><div class="btn">Tree ${key('T')}</div></div>
</div>`, RESCSS, 'loss');

// ================= OPTION BOARDS (desktop) =================
const OPTCSS = `
.wrap{position:absolute;inset:0;padding:20px 26px;display:flex;flex-direction:column;gap:12px}
h2{font-size:34px}.wrap>p{color:var(--dim);font-size:15px;margin-top:-6px}
.cols{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;min-height:0}
.opt{padding:14px;display:flex;flex-direction:column;gap:8px}
.opt.rec{border-color:var(--gold);box-shadow:0 0 0 2px rgba(255,211,107,.3),0 8px 30px rgba(0,0,0,.45)}
.opt h3{font-size:24px}.opt .tag{font-size:12px;letter-spacing:.12em;color:var(--gold);font-weight:700}
.wf{height:250px;border-radius:12px;background:#0c111d;border:1px solid #2c3550;position:relative;overflow:hidden;flex:none}
.wf .b{position:absolute;border-radius:7px;border:1.5px solid var(--brassD);background:rgba(48,60,86,.6);font-size:11px;color:var(--dim);display:grid;place-items:center;text-align:center;line-height:1.15;padding:2px}
.wf .b.p{background:linear-gradient(180deg,#ffcf7a,#f19a3a);color:#2a1606;border-color:#ffe2a6;font-weight:700}
.wf .b.d{border-style:dashed;background:transparent}
.wf .b.tw{border-color:var(--twi);color:var(--twi)}.wf .b.dd{border-color:var(--deep);color:var(--deep)}.wf .b.ln{border-color:var(--lock);color:var(--lock);border-style:dashed}
.wf .t{position:absolute;font-family:HLC,Georgia,serif;color:var(--cream)}
.opt ul{font-size:13.5px;line-height:1.35;padding-left:16px;color:var(--dim)}.opt li b{color:var(--cream)}
`;
const box = (x, y, w, h, t, c = '') => `<div class="b ${c}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">${t}</div>`;
const txt = (x, y, s, t) => `<div class="t" style="left:${x}%;top:${y}%;font-size:${s}px">${t}</div>`;
const board = (file, h, sub, opts) => out(file, page(h, `<div class="wrap"><h2>${esc(h)}</h2><p>${esc(sub)}</p><div class="cols">${opts.map((o, i) => `<div class="opt panel ${i === 0 ? 'rec' : ''}"><div class="tag">${i === 0 ? 'A · RECOMMENDED' : i === 1 ? 'B' : 'C'}</div><h3>${esc(o.name)}</h3><div class="wf">${o.wf}</div><ul>${o.pts.map((p) => `<li>${p}</li>`).join('')}</ul></div>`).join('')}</div></div>`, OPTCSS));

board('fd-opt-title-desk.html', '1 · Title + profiles: three ways', 'Locked: max 3 lanterns per device, profile screen skipped when only one exists, Continue / New game, no accounts.', [
  { name: 'Lantern Hall', wf: box(3, 4, 22, 10, 'Matt · switch') + box(70, 4, 27, 10, 'gold shards glass') + txt(30, 20, 26, 'Hollowlight') + box(30, 44, 40, 12, 'Continue', 'p') + box(30, 60, 19, 11, 'Skill Tree') + box(51, 60, 19, 11, 'Settings') + box(30, 75, 40, 9, 'New game (2 of 3 free)', 'd'),
    pts: ['Title IS the cover (as built in U3); <b>no extra screen</b> for one player', 'Profile chip top-left: tap = Whose lantern? (3 hanging lanterns)', 'First launch: Begin, no name asked; rename later', 'Returning: Continue, Enter, Enter = run (3 taps)'] },
  { name: 'Three Lanterns Gate', wf: txt(28, 8, 24, 'Hollowlight') + box(8, 34, 26, 44, 'Matt<br>lit') + box(37, 34, 26, 44, 'Sam<br>lit') + box(66, 34, 26, 44, '+ new', 'd') + box(3, 86, 25, 10, 'Settings') + box(72, 86, 25, 10, 'Tree'),
    pts: ['The three lanterns ARE the title menu: tap your lantern to enter', 'Most diegetic and memorable', '<b>Shows empty slots to a first-timer</b> (research 27: avoid)', 'Conflicts with the lock "skip profile screen when only one"'] },
  { name: 'Cover, then Hub', wf: txt(26, 18, 26, 'Hollowlight') + txt(30, 48, 14, 'Press any key / tap') + box(56, 74, 40, 20, 'HUB: Quick Start · Play · Tree · Settings', 'p'),
    pts: ['Separate cover (audio unlock, colour floods out on press), then a hub', 'Quick Start = last hero + night in 1 tap', '<b>One more screen</b> every session; hub duplicates the title', 'More to build and test'] },
]);
board('fd-opt-map-desk.html', '2 · Map + night (tier) select: three ways', 'Locked: three nights per map (Twilight / Deep Dusk / Long Night), Deep Dusk and Long Night opened by Night Gate lanterns in the tree, chips default (e) A.', [
  { name: 'Map card + night chips', wf: box(3, 4, 50, 62, 'Cursed Forest art') + box(4, 70, 15, 18, 'Twilight ★★', 'tw') + box(21, 70, 15, 18, 'Deep Dusk NEW', 'dd') + box(38, 70, 15, 18, 'Long Night 0/1', 'ln') + box(57, 4, 40, 72, 'what changes · you earn · night tools · next light') + box(57, 80, 40, 14, 'Begin with Wren', 'p'),
    pts: ['As the locked tier mock (dt-mapselect), refined', 'Screen <b>appears only once there is a choice</b> (Deep Dusk seen or Chapter 2); before that hero select starts the run', 'Locked chip says the ONE thing to do; if it is a tree buy, it jumps to that lantern', 'Chapter thread: 1 lit + 7 fogged'] },
  { name: 'Hollow map path', wf: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="M8 85 C30 60 20 40 45 45 S70 20 92 15" fill="none" stroke="#8d6c34" stroke-dasharray="3 3"/></svg>` + box(4, 76, 12, 14, 'Ch1', 'p') + box(40, 38, 10, 12, '?', 'd') + box(86, 8, 10, 12, '?', 'd') + box(18, 40, 20, 34, 'Twilight<br>Deep Dusk<br>Long Night'),
    pts: ['Painted world map, 8 chapter lanterns on a thread; tap a chapter, a drawer of 3 nights opens', 'Strongest "more to come" promise', '<b>Mostly fog with one chapter</b>; big art job; drawer hides rewards on phones'] },
  { name: 'One "Set out" screen', wf: box(3, 6, 28, 70, 'Wren') + box(33, 6, 28, 70, 'Elias') + box(64, 6, 33, 40, 'Forest') + box(64, 48, 10, 14, 'Tw', 'tw') + box(75, 48, 10, 14, 'DD', 'dd') + box(86, 48, 11, 14, 'LN', 'ln') + box(64, 80, 33, 14, 'Begin', 'p'),
    pts: ['Hero + map + night on one screen: fewest taps', '<b>Reopens</b> the locked flow (hero then map) and the approved U3 hero screen', 'Phone portrait is crowded; rewards squeezed'] },
]);
board('fd-opt-results-desk.html', '3 · Results + way back: three ways', 'Locked: one-screen results, no scroll, Again big primary (R/Enter), Main menu Esc, Tree shortcut with dot; defeat lantern dims, not out.', [
  { name: 'Badge on the locked card', wf: box(4, 10, 36, 60, 'lantern · NIGHT BADGE · Dawn') + box(44, 6, 52, 70, 'time · gold/shards/<b>Dawnglass</b> · first dawn · stars') + box(4, 82, 26, 13, 'Menu') + box(33, 82, 34, 13, 'Again · Deep Dusk', 'p') + box(70, 82, 26, 13, 'Tree •'),
    pts: ['Adds to U6 only: night badge (shape + name), Dawnglass tile only on Deep Dusk+, first-dawn line, star row on wins', 'Death: same layout, dim lantern, "kept" line, ONE next light, no stars', 'Again replays the same hero + night; label says which'] },
  { name: 'Dawn beat, then ledger', wf: txt(22, 20, 26, 'Dawn breaks') + box(25, 46, 50, 12, 'stars stamp in, badge glows') + box(30, 70, 40, 12, 'tap to continue', 'd'),
    pts: ['Wins get a 2-3 s full-screen ceremony first (colour flood, stars stamp), then the locked card', 'Most emotional for first dawns', '<b>Slows the retry beat</b>; one more input every win'] },
  { name: 'Win leads to the map', wf: box(4, 10, 36, 60, 'Dawn') + box(44, 6, 52, 70, 'ledger') + box(4, 82, 26, 13, 'Menu') + box(33, 82, 34, 13, 'Next night ›', 'p') + box(70, 82, 26, 13, 'Again'),
    pts: ['After a win the big button is "Next night" (opens map select with the new chip lit); after a death it stays Again', 'Pushes players upward', '<b>Reopens</b> the locked "Again is the big primary"; buttons move = muscle-memory slips'] },
]);

// ================= FLOW (desktop) =================
const FLOWCSS = `
.wrap{position:absolute;inset:0;padding:20px 26px}
h2{font-size:34px;margin-bottom:6px}.wrap>p{color:var(--dim);font-size:15px}
svg.f{position:absolute;left:0;top:0;width:100%;height:100%}
.n{position:absolute;padding:8px 10px;border-radius:12px;border:2px solid var(--brass);background:linear-gradient(180deg,var(--glassA),var(--glassB));font-size:13px;color:var(--dim);line-height:1.25;text-align:center}
.n b{display:block;font-family:HLC,Georgia,serif;font-weight:400;font-size:20px;color:var(--cream)}
.n.opt{border-style:dashed}.n.run{border-color:var(--gold)}
.lg{position:absolute;left:26px;bottom:18px;font-size:13px;color:var(--mute)}
`;
const N = (x, y, w, t, s, c = '') => `<div class="n ${c}" style="left:${x}px;top:${y}px;width:${w}px"><b>${t}</b>${s}</div>`;
out('fd-flow-desk.html', page('Front door flow', `<div class="wrap"><h2>Front door flow (A + A + A)</h2><p>Dashed = shown only when needed. Esc always goes back one step; Esc on the title does nothing.</p>
<svg class="f" viewBox="0 0 1280 720"><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#d8b26a"/></marker></defs>
<g stroke="#d8b26a" stroke-width="2" fill="none" marker-end="url(#a)">
<path d="M250 250 H330"/><path d="M520 250 H600"/><path d="M790 250 H870"/><path d="M1040 290 V380"/><path d="M960 470 H850"/><path d="M660 470 H560"/>
<path d="M150 300 V390"/><path d="M200 210 C240 120 380 120 420 210" stroke-dasharray="6 5"/>
<path d="M790 430 C830 340 950 340 1000 386" stroke-dasharray="6 5"/><path d="M400 470 C250 470 170 380 170 300" stroke-dasharray="6 5"/>
</g></svg>
${N(60, 210, 190, 'Title', 'Continue · Tree · Settings · New game · lantern chip')}
${N(340, 210, 180, 'Whose lantern?', 'only with 2+ lanterns, or Switch / New game', 'opt')}
${N(610, 210, 180, 'Hero select', 'as built (U3). Primary: Next, or Walk with Wren while there is no night choice')}
${N(880, 210, 200, 'Map + night', 'appears once a 2nd night or chapter exists; remembers last pick', 'opt')}
${N(960, 390, 200, 'Run', '15 minutes; pause: Resume · Settings · Main menu', 'run')}
${N(670, 430, 180, 'Results', 'badge · Dawnglass · first dawn · stars · Main menu = Title')}
${N(400, 430, 160, 'Skill Tree', 'Back = where you came from; Night Gate lanterns')}
${N(60, 400, 180, 'Settings', 'per device: audio, touch, motion; saves tools')}
<div style="position:absolute;left:820px;top:322px;font-size:12px;color:var(--mute);width:180px">Again (R) = same hero + night</div>
<div style="position:absolute;left:150px;top:160px;font-size:12px;color:var(--mute);width:220px;left:250px">Switch lantern</div>
<div class="lg">Taps to a run: first time 2 (Begin, Walk with Wren) · returning one lantern 3 (Continue, Next, Begin) · after a run 1 (Again)</div></div>`, FLOWCSS));

out('fd-title.html', title());
out('fd-profiles.html', profiles());
out('fd-map.html', mapSelect());
out('fd-results-win.html', resultsWin());
out('fd-results-death.html', resultsLoss());
