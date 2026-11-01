// Difficulty tiers + economy mock-ups: static HTML pages (no runtime JS), NOT game code.
// node build.mjs && node shoot.mjs   -> dt-*.html + PNGs (1280x720, 844x390@2x, 390x844@2x; *-desk pages desktop only)
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIERS, GROUPS } from './inventory.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `
@font-face{font-family:HLC;src:url(../../../src/assets/fonts/hollowlight-chancery.woff2) format('woff2')}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-400.woff2) format('woff2');font-weight:400}
@font-face{font-family:AS;src:url(../../../src/assets/fonts/alegreya-sans-700.woff2) format('woff2');font-weight:700}
:root{--ink:#140f0c;--brass:#d8b26a;--brassD:#8d6c34;--cream:#fff3dc;--dim:rgba(255,243,220,.82);--mute:#a8b0c4;--teal:#6fd3c5;--gold:#ffd36b;--lock:#6b7490;
 --glassA:#303c56;--glassB:#161c2a;--night:#0c1220;--dusk:#ffb867;--deep:#9aa8ff;--long:#c9c2ff;--dawn1:#ffd0b0;--dawn2:#bfeaf0;--danger:#ff5a3c;
 --u:min(1vw,1.78vh)}
*{box-sizing:border-box;margin:0}
html,body{height:100%;overflow:hidden;background:var(--night);color:var(--cream);font-family:AS,"Segoe UI",sans-serif}
h1,h2,.title{font-family:HLC,Georgia,serif;font-weight:400}
.coin,.shard,.glass{display:inline-block;vertical-align:-.12em;margin-right:.22em}
.coin{width:.85em;height:.85em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff0b0,#d8b26a 60%,#8d6c34);box-shadow:0 0 0 1.5px var(--ink)}
.shard{width:.72em;height:.9em;background:linear-gradient(135deg,#e9ddff,#9d86ff);clip-path:polygon(50% 0,100% 40%,70% 100%,30% 100%,0 40%)}
.glass{width:.72em;height:.95em;background:linear-gradient(160deg,#fff7ee 0%,var(--dawn1) 45%,var(--dawn2) 100%);clip-path:polygon(50% 0,92% 34%,74% 100%,26% 100%,8% 34%);filter:drop-shadow(0 0 3px rgba(255,208,176,.7))}
.pill{display:inline-flex;align-items:center;gap:.3em;padding:.18em .7em;border-radius:99px;border:1.5px solid var(--brassD);background:rgba(12,9,8,.6);font-weight:700;font-variant-numeric:tabular-nums}
.k{font-size:max(12px,calc(var(--u)*1.25));letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.new{color:var(--teal);font-weight:700;letter-spacing:.08em}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 calc(var(--u)*3);border-radius:calc(var(--u)*1.4);font-weight:700;font-size:max(15px,calc(var(--u)*2));color:#2a1a08;background:linear-gradient(#ffe7b0,#e6b862);border:2px solid #6b4a1c;box-shadow:0 3px 0 #4a3210,0 0 18px rgba(255,190,100,.35)}
.btn.ghost{color:var(--cream);background:rgba(20,26,40,.8);border-color:var(--brassD);box-shadow:none}
.bar{position:relative;height:max(8px,calc(var(--u)*.9));border-radius:99px;background:#0b0f18;border:1.5px solid rgba(111,211,197,.45);overflow:hidden}
.bar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#2f8f86,var(--teal))}
.star{display:inline-block;width:1em;height:1em;vertical-align:-.15em;background:var(--brass);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.star.off{background:#3a4258}
.star.dawn{background:linear-gradient(160deg,#fff7ee,var(--dawn1) 55%,var(--dawn2))}
`;

const page = (title, body, extra = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}${extra}</style></head><body>${body}</body></html>`;
const out = (f, html) => { writeFileSync(join(HERE, f), html); console.log('wrote', f); };

// ----------------------------------------------------------------------------- shared forest header art (code-drawn)
const forestSVG = (mood) => {
  const sky = { dusk: ['#3b2a3a', '#a8664a', '#f0b070'], deep: ['#141a34', '#3a3f6e', '#7c6f9e'], long: ['#05070f', '#0f1430', '#252a52'] }[mood];
  let trees = '';
  for (let i = 0; i < 14; i++) { const x = i * 30 - 10 + ((i * 37) % 13); const h = 60 + ((i * 53) % 40); trees += `<path d="M${x} 150 L${x + 14} ${150 - h} L${x + 28} 150Z" fill="${mood === 'dusk' ? '#2a2620' : '#0d1020'}" opacity=".95"/>`; }
  let stars = ''; if (mood !== 'dusk') for (let i = 0; i < 26; i++) stars += `<circle cx="${(i * 71) % 400}" cy="${(i * 29) % 70 + 6}" r="${i % 3 ? 0.9 : 1.5}" fill="#dfe6ff" opacity="${mood === 'long' ? 0.9 : 0.5}"/>`;
  return `<svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="s${mood}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient><radialGradient id="l${mood}"><stop offset="0" stop-color="#ffcf80" stop-opacity=".75"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient></defs>
  <rect width="400" height="150" fill="url(#s${mood})"/>${stars}<circle cx="${mood === 'dusk' ? 300 : 320}" cy="${mood === 'dusk' ? 104 : 34}" r="${mood === 'dusk' ? 26 : 12}" fill="${mood === 'dusk' ? '#ffd9a0' : '#e8ecff'}" opacity="${mood === 'long' ? 0.35 : 0.8}"/>${trees}
  <ellipse cx="250" cy="142" rx="60" ry="20" fill="url(#l${mood})"/><circle cx="250" cy="132" r="4" fill="#ffe7b0"/></svg>`;
};

// ----------------------------------------------------------------------------- 1. MAP SELECT
const MAPCSS = `
.ms{position:fixed;inset:0;display:flex;flex-direction:column;gap:calc(var(--u)*1.6);padding:max(2.2vh,env(safe-area-inset-top)) 3vw 2.2vh;
 background:radial-gradient(ellipse 60% 50% at 20% 0%,rgba(255,184,103,.14),transparent 70%),radial-gradient(ellipse 100% 90% at 50% 100%,#1a2238,#0c1220 75%)}
.top{display:flex;align-items:center;gap:calc(var(--u)*1.6)}
.top h1{font-size:max(22px,calc(var(--u)*3.6));flex:1;text-shadow:0 2px 0 var(--ink)}
.purse{display:flex;gap:calc(var(--u)*.8);font-size:max(13px,calc(var(--u)*1.6))}
.main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:calc(var(--u)*2)}
.mapc{position:relative;border-radius:calc(var(--u)*1.8);overflow:hidden;border:2px solid var(--brass);box-shadow:0 10px 30px rgba(0,0,0,.5);display:flex;flex-direction:column;min-height:0}
.art{position:relative;flex:1;min-height:calc(var(--u)*10)}
.art .nm{position:absolute;left:calc(var(--u)*2);bottom:calc(var(--u)*1.4);font-family:HLC,Georgia,serif;font-size:max(22px,calc(var(--u)*4));text-shadow:0 2px 0 var(--ink),0 0 18px rgba(0,0,0,.8)}
.art .ch{position:absolute;left:calc(var(--u)*2);top:calc(var(--u)*1.4)}
.tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:calc(var(--u)*1);padding:calc(var(--u)*1.2);background:linear-gradient(rgba(48,60,86,.95),rgba(22,28,42,.98))}
.tc{position:relative;min-height:max(52px,calc(var(--u)*7.2));border-radius:calc(var(--u)*1.2);border:1.5px solid rgba(141,108,52,.7);background:rgba(12,18,32,.75);padding:calc(var(--u)*.8) calc(var(--u)*1);display:flex;flex-direction:column;justify-content:center;gap:calc(var(--u)*.3)}
.tc .tn{font-family:HLC,Georgia,serif;font-size:max(15px,calc(var(--u)*2.1))}
.tc .ts{font-size:max(12px,calc(var(--u)*1.3));color:var(--dim)}
.tc.dusk .tn{color:var(--dusk)} .tc.deep .tn{color:var(--deep)} .tc.long .tn{color:var(--long)}
.tc.sel{border:2.5px solid var(--brass);background:linear-gradient(rgba(70,80,130,.55),rgba(18,22,40,.9));box-shadow:0 0 0 3px rgba(216,178,106,.25),0 0 22px rgba(154,168,255,.25)}
.tc.locked{border-style:dashed;border-color:var(--lock);background:rgba(10,12,20,.8)}
.tc.locked .tn{color:#8b93ad}
.tag{position:absolute;top:calc(var(--u)*-1.1);right:calc(var(--u)*.8);font-size:max(11px,calc(var(--u)*1.15));font-weight:700;letter-spacing:.06em;padding:.1em .6em;border-radius:99px;background:#16352f;color:var(--teal);border:1.5px solid var(--teal)}
.lockg{display:inline-block;width:.75em;height:.85em;margin-right:.3em;vertical-align:-.1em;background:#8b93ad;clip-path:polygon(15% 45%,15% 100%,85% 100%,85% 45%,75% 45%,75% 25%,62% 8%,38% 8%,25% 25%,25% 45%,35% 45%,35% 28%,42% 20%,58% 20%,65% 28%,65% 45%)}
.side{display:flex;flex-direction:column;gap:calc(var(--u)*1.2);min-height:0}
.card{border-radius:calc(var(--u)*1.6);border:2px solid rgba(216,178,106,.85);background:linear-gradient(rgba(48,60,86,.9),rgba(22,28,42,.94));padding:calc(var(--u)*1.4) calc(var(--u)*1.8);display:flex;flex-direction:column;gap:calc(var(--u)*.9)}
.card h2{font-size:max(18px,calc(var(--u)*2.8));color:var(--deep)}
.chg{display:flex;flex-direction:column;gap:calc(var(--u)*.45);font-size:max(13px,calc(var(--u)*1.55))}
.chg div::before{content:"";display:inline-block;width:.45em;height:.45em;border-radius:50%;background:var(--deep);margin-right:.5em;vertical-align:.12em}
.rw{display:flex;flex-wrap:wrap;gap:calc(var(--u)*.7);font-size:max(13px,calc(var(--u)*1.55))}
.rec{display:flex;gap:calc(var(--u)*2);font-size:max(13px,calc(var(--u)*1.5));color:var(--dim);flex-wrap:wrap}
.rec b{color:var(--cream);font-variant-numeric:tabular-nums}
.nudge{font-size:max(13px,calc(var(--u)*1.5));color:var(--dim);display:flex;flex-direction:column;gap:calc(var(--u)*.4)}
.nudge b{color:var(--teal)}
.acts{display:flex;gap:calc(var(--u)*1.2);justify-content:flex-end;margin-top:auto}
.fog{display:flex;align-items:center;gap:calc(var(--u)*1);font-size:max(12px,calc(var(--u)*1.4));color:#8b93ad;border:1.5px dashed var(--lock);border-radius:calc(var(--u)*1.2);padding:calc(var(--u)*.7) calc(var(--u)*1.2)}
@media (max-aspect-ratio:1/1){
 .ms{gap:10px;padding:max(14px,env(safe-area-inset-top)) 16px 14px}
 .main{grid-template-columns:1fr;grid-template-rows:auto 1fr;gap:12px}
 .art{min-height:150px;flex:none;height:150px}
 .tiers{gap:8px;padding:10px}
 .tc{padding:8px}
 .card{padding:14px 16px;gap:10px}
 .acts .btn{flex:1}
 .purse{font-size:13px}
}
@media (max-height:420px) and (min-aspect-ratio:1/1){
 .ms{padding:10px 16px;gap:8px}.top h1{font-size:20px}.main{gap:12px}.card{padding:10px 14px;gap:6px}.chg{gap:2px}.fog{display:none}.side{gap:8px}
 .chg div:nth-child(n+3){display:none}.nudge span{display:none}
}`;
const mapSelect = () => {
  const H = TIERS.hard;
  const body = `<div class="ms">
  <div class="top"><h1>Choose your road</h1><div class="purse"><span class="pill"><i class="coin"></i>2,410</span><span class="pill"><i class="shard"></i>6</span><span class="pill"><i class="glass"></i>0</span></div></div>
  <div class="main">
    <div class="mapc">
      <div class="art">${forestSVG('deep')}<div class="ch k">Chapter 1</div><div class="nm">Cursed Forest</div></div>
      <div class="tiers" role="radiogroup" aria-label="Difficulty">
        <div class="tc dusk" role="radio" aria-checked="false"><div class="tn">Twilight</div><div class="ts"><i class="star"></i><i class="star"></i><i class="star off"></i> cleared 2x</div></div>
        <div class="tc deep sel" role="radio" aria-checked="true"><span class="tag">NEW</span><div class="tn">Deep Dusk</div><div class="ts">Recommended next</div></div>
        <div class="tc long locked" role="radio" aria-disabled="true"><div class="tn"><i class="lockg"></i>Long Night</div><div class="ts">Clear Deep Dusk once</div><div class="bar" aria-label="0 of 1"><i style="width:0%"></i></div></div>
      </div>
    </div>
    <div class="side">
      <div class="card">
        <div class="k">Deep Dusk - harder night</div>
        <h2>The Hollow presses closer</h2>
        <div class="chg"><div>Foes are tougher (+45% health) and hit a little harder</div><div>From 4:00 some foes bear a Hollow mark (you can read each one)</div><div>The Elder Treant is stronger</div><div>Blessings, hearts and your tree are unchanged</div></div>
        <div class="k">You earn</div>
        <div class="rw"><span class="pill"><i class="coin"></i>gold x${H.rewards.gold}</span><span class="pill"><i class="shard"></i>${H.rewards.bossShards} from the boss</span><span class="pill"><i class="glass"></i>dawnglass up to ${H.rewards.glass.runCap}</span><span class="pill new">first dawn +${H.rewards.glass.firstClear}</span></div>
        <div class="rec"><span>Best <b>-</b></span><span>Clears <b>0</b></span><span>Stars <i class="star off"></i><i class="star off"></i><i class="star off"></i></span></div>
      </div>
      <div class="nudge"><b>Next light: first dawn on Deep Dusk</b><span>Clear it with Wren and with Elias to light the Fifth Hook.</span></div>
      <div class="fog">Chapter 2 sleeps in the fog. Clear Cursed Forest on Long Night to see it.</div>
      <div class="acts"><span class="btn ghost">Back</span><span class="btn">Begin with Wren</span></div>
    </div>
  </div></div>`;
  out('dt-mapselect.html', page('Map select tiers', body, MAPCSS));
};

// ----------------------------------------------------------------------------- 2. RESULTS (victory on Deep Dusk, first clear)
const RESCSS = `
.rs{position:fixed;inset:0;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.2fr);gap:calc(var(--u)*2.4);align-items:center;padding:2.4vh 3vw;
 background:radial-gradient(ellipse 80% 60% at 28% 8%,rgba(255,208,176,.38),transparent 65%),radial-gradient(ellipse 100% 70% at 50% 100%,rgba(154,168,255,.18),transparent 70%),linear-gradient(#2a2440,#121426 75%)}
.hero{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*1);text-align:center}
.hero h1{font-size:max(28px,calc(var(--u)*5.2));color:var(--gold);text-shadow:0 2px 0 #4a2f08,0 0 30px rgba(255,211,107,.55)}
.badge{display:inline-flex;gap:.5em;align-items:center;padding:.25em .9em;border-radius:99px;border:2px solid var(--deep);color:var(--deep);font-weight:700;background:rgba(20,24,48,.8);font-size:max(13px,calc(var(--u)*1.6))}
.line{font-family:HLC,Georgia,serif;font-size:max(14px,calc(var(--u)*2));color:#efe2c6}
.lamp{width:calc(var(--u)*12);height:calc(var(--u)*16);min-width:70px;min-height:94px}
.card{border-radius:calc(var(--u)*1.6);border:2px solid rgba(216,178,106,.85);background:linear-gradient(rgba(48,60,86,.9),rgba(22,28,42,.94));padding:calc(var(--u)*1.6) calc(var(--u)*2);display:flex;flex-direction:column;gap:calc(var(--u)*1.1)}
.bank{display:grid;grid-template-columns:repeat(3,1fr);gap:calc(var(--u)*1)}
.ch{background:rgba(12,9,8,.5);border:1.5px solid rgba(141,108,52,.55);border-radius:calc(var(--u)*1.1);padding:calc(var(--u)*.8) calc(var(--u)*1);display:flex;flex-direction:column;gap:calc(var(--u)*.3)}
.ch .n{font-weight:700;font-size:max(20px,calc(var(--u)*3.2));font-variant-numeric:tabular-nums}
.ch .s{font-size:max(12px,calc(var(--u)*1.25));color:var(--dim)}
.ch.dawn{border-color:rgba(255,208,176,.8);box-shadow:0 0 16px rgba(255,208,176,.25)}
.first{display:flex;align-items:center;gap:calc(var(--u)*1);font-size:max(13px,calc(var(--u)*1.6));padding:calc(var(--u)*.8) calc(var(--u)*1.2);border-radius:calc(var(--u)*1.1);background:rgba(255,208,176,.12);border:1.5px solid rgba(255,208,176,.6)}
.stars{display:flex;gap:calc(var(--u)*1.2);font-size:max(13px,calc(var(--u)*1.5));color:var(--dim);flex-wrap:wrap}
.nx{display:flex;flex-direction:column;gap:calc(var(--u)*.5);font-size:max(13px,calc(var(--u)*1.5))}
.acts{display:flex;gap:calc(var(--u)*1.2)}
@media (max-aspect-ratio:1/1){.rs{grid-template-columns:1fr;align-content:start;gap:14px;padding:18px 16px;overflow:hidden}.lamp{display:none}.card{padding:14px 16px;gap:10px}.acts .btn{flex:1}}
@media (max-height:420px) and (min-aspect-ratio:1/1){.rs{padding:10px 16px;gap:16px}.card{padding:10px 14px;gap:7px}.line,.stars{display:none}.lamp{min-height:70px;min-width:52px}}`;
const results = () => {
  const lamp = `<svg class="lamp" viewBox="0 0 60 80"><defs><radialGradient id="lg"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#ffd0b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd0b0" stop-opacity="0"/></radialGradient></defs><circle cx="30" cy="44" r="30" fill="url(#lg)"/><rect x="18" y="26" width="24" height="34" rx="6" fill="rgba(255,240,210,.25)" stroke="#d8b26a" stroke-width="3"/><path d="M30 32 C36 40 36 48 30 54 C24 48 24 40 30 32Z" fill="#ffe7b0"/><path d="M22 26 Q30 14 38 26" fill="none" stroke="#d8b26a" stroke-width="3"/></svg>`;
  const body = `<div class="rs">
  <div class="hero">${lamp}<span class="badge"><i class="star dawn"></i>Deep Dusk - first dawn</span><h1>Dawn breaks</h1><div class="line">"Even here, the light holds." - Wren</div></div>
  <div class="card">
    <div class="k">Brought home</div>
    <div class="bank">
      <div class="ch"><div class="n"><i class="coin"></i>4,290</div><div class="s">gold (x1.5 Deep Dusk)</div></div>
      <div class="ch"><div class="n"><i class="shard"></i>7</div><div class="s">soul shards</div></div>
      <div class="ch dawn"><div class="n"><i class="glass"></i>12</div><div class="s">dawnglass: 6 + 6 first dawn</div></div>
    </div>
    <div class="first"><i class="star dawn"></i><span><b>First dawn with Wren on Deep Dusk.</b> Elias has not seen it yet (+6 waiting).</span></div>
    <div class="stars"><span><i class="star"></i> Cleared</span><span><i class="star off"></i> Clear with both heroes</span><span><i class="star off"></i> All three Alphas + no revive</span></div>
    <div class="nx"><div class="k">Next lights</div><div>Long Night: ready to wake <span class="new">READY</span> (2,500 gold, 4 shards, 10 dawnglass)</div><div>Fifth Hook: clear Deep Dusk with Elias</div><div class="bar"><i style="width:50%"></i></div></div>
    <div class="acts"><span class="btn ghost">Skill tree</span><span class="btn">Again</span></div>
  </div></div>`;
  out('dt-results.html', page('Tier results', body, RESCSS));
};

// ----------------------------------------------------------------------------- 3. TREE LAYOUT (desktop): tool clusters in the gaps
const treeLayout = () => {
  const W = 1280, H = 720, cx = 640, cy = 392, s = 0.205;
  const P = (r, a) => [cx + Math.cos((a * Math.PI) / 180) * r * s, cy + Math.sin((a * Math.PI) / 180) * r * s];
  const cons = [['Ghost Wolves', 162, '#9fd7ff'], ['Raven Flock', 234, '#b9a7ff'], ['Spirit Bolts', 306, '#8ff0e0'], ['Chain Lightning', 18, '#a8c8ff'], ['Holy Orbit', 90, '#ffd9a0']];
  let g = '';
  g += `<circle cx="${cx}" cy="${cy}" r="${1600 * s}" fill="none" stroke="#1c2238" stroke-width="10" opacity=".6"/><circle cx="${cx}" cy="${cy}" r="${960 * s}" fill="none" stroke="#5a5070" stroke-dasharray="6 6" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${1180 * s}" fill="none" stroke="#2c3350" stroke-dasharray="2 8" stroke-width="2"/>`;
  for (const r of [150, 300]) g += `<circle cx="${cx}" cy="${cy}" r="${r * s}" fill="none" stroke="#d8b26a" stroke-opacity=".55" stroke-width="2"/>`;
  g += `<circle cx="${cx}" cy="${cy}" r="18" fill="#ffe7b0"/><circle cx="${cx}" cy="${cy}" r="40" fill="#ffcf80" opacity=".18"/>`;
  for (const [n, a, c] of cons) { const [x, y] = P(600, a); g += `<circle cx="${x}" cy="${y}" r="${280 * s}" fill="${c}" fill-opacity=".08" stroke="${c}" stroke-opacity=".6" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="${c}" font-size="15" font-family="HLC,Georgia">${n}</text>`; }
  const tools = Object.entries(GROUPS).map(([k, gr]) => [gr.title.replace(/ \(.*/, ''), gr.title.match(/\((.*)\)/)[1], gr.bearing, gr.nodes.length, k]);
  for (const [n, sub, a, cnt, k] of tools) {
    const [x, y] = P(1280, a); const R = 200 * s; const col = k === 'nightgate' ? '#c9c2ff' : '#ffe7b0';
    g += `<circle cx="${x}" cy="${y}" r="${R}" fill="#0c1220" stroke="${col}" stroke-width="2.5"/>`;
    const m = Math.min(cnt, 12); for (let i = 0; i < m; i++) { const b = (i / m) * Math.PI * 2; g += `<circle cx="${x + Math.cos(b) * R * 0.66}" cy="${y + Math.sin(b) * R * 0.66}" r="3.2" fill="${col}" opacity=".85"/>`; }
    const [lx, ly] = P(800 + (a === 270 ? -230 : 0), a);
    const top = a === 270; const ty = top ? y - 4 : y + R + 18; const tx = top ? x + R + 14 : x; const an = top ? 'start' : 'middle';
    g += `<text x="${tx}" y="${ty}" text-anchor="${an}" fill="${col}" font-size="15" font-family="HLC,Georgia">${esc(n)}</text><text x="${tx}" y="${ty + 16}" text-anchor="${an}" fill="#a8b0c4" font-size="12.5" font-family="AS,sans-serif">${esc(sub)} - ${cnt} lanterns</text>`;
    void lx; void ly;
  }
  // Daybreak lanterns on the Dusk ring (tier-scoped), shown as dawn beads near the Dusk Gate
  for (const a of [252, 288]) { const [x, y] = P(960, a); g += `<circle cx="${x}" cy="${y}" r="6" fill="url(#dg)" stroke="#ffd0b0" stroke-width="1.5"/>`; }
  const body = `<div style="position:fixed;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 52%,#18203a,#0a0e1a 80%)">
  <svg viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7ee"/><stop offset=".5" stop-color="#ffd0b0"/><stop offset="1" stop-color="#bfeaf0"/></linearGradient></defs>${g}
  <text x="24" y="40" fill="#fff3dc" font-size="26" font-family="HLC,Georgia">Lantern Web + the five tool clusters</text>
  <text x="24" y="60" fill="#a8b0c4" font-size="14" font-family="AS,sans-serif">L-A: tool clusters on the five gap-bearing FAR slots (r 1280), radius up to 200.</text>
  <text x="24" y="80" fill="#a8b0c4" font-size="14" font-family="AS,sans-serif">Dashed: Dusk ring r 960; dotted: fog r 1180; faint band: chapter 2 (r 1600). Schematic.</text></svg></div>`;
  out('dt-tree-desk.html', page('Tree tool clusters', body));
};

// ----------------------------------------------------------------------------- 4. OPTIONS BOARD (desktop): the three first decisions
const OPTCSS = `
.ob{position:fixed;inset:0;padding:18px 24px;display:flex;flex-direction:column;gap:10px;background:radial-gradient(ellipse 100% 80% at 50% 0%,#1a2238,#0c1220 75%)}
.ob h1{font-size:26px}
.row{display:grid;grid-template-columns:150px repeat(3,1fr);gap:10px;flex:1;min-height:0}
.q{font-family:HLC,Georgia,serif;font-size:17px;color:var(--brass);display:flex;align-items:center}
.o{border-radius:12px;border:1.5px solid rgba(141,108,52,.7);background:rgba(22,28,42,.9);padding:9px 12px;display:flex;flex-direction:column;gap:4px;font-size:13.5px;color:var(--dim);overflow:hidden}
.o.rec{border:2.5px solid var(--brass);box-shadow:0 0 18px rgba(216,178,106,.2)}
.o b{color:var(--cream);font-size:15px}
.o .tg{font-size:12px;color:var(--teal);font-weight:700;letter-spacing:.06em}
.mini{display:flex;gap:5px;align-items:center;margin-top:auto}
.mini i{display:inline-block;height:14px;border-radius:4px}
`;
const options = () => {
  const o = (rec, title, lines, mini = '') => `<div class="o${rec ? ' rec' : ''}">${rec ? '<span class="tg">RECOMMENDED</span>' : ''}<b>${esc(title)}</b>${lines.map((l) => `<div>${esc(l)}</div>`).join('')}<div class="mini">${mini}</div></div>`;
  const chips = (cols) => cols.map((c) => `<i style="width:46px;background:${c}"></i>`).join('');
  const body = `<div class="ob"><h1>Difficulty tiers: the three first decisions</h1>
  <div class="row"><div class="q">1. How tiers work</div>
   ${o(1, 'A. Three nights per map', ['Twilight / Deep Dusk / Long Night (names provisional).', 'Each = a data block: tougher foes + ONE readable new rule (Hollow-marked foes; then less heart luck + a 4th mark).', 'Easy to read, phone friendly, bot-measurable.'], chips(['#ffb867', '#9aa8ff', '#c9c2ff']))}
   ${o(0, 'B. The Gloom dial (Hades-style)', ['Players switch on Omens (8-10 toggles, each worth points).', 'Deep Dusk = 5+ points, Long Night = 10+.', 'Experts love it; much more UI and a huge balance matrix.'], chips(['#9aa8ff', '#9aa8ff', '#6b7490', '#9aa8ff', '#6b7490']))}
   ${o(0, 'C. Ascending nights 1-10', ['Slay the Spire ladder per map: each night adds one rule.', 'Win night N to open N+1. Deep = 1-5, Long = 6-10.', 'Clear goal, but ten steps to balance and a long climb.'], chips(['#3a4258', '#4a5478', '#5a66a0', '#7a86c8', '#9aa8ff']))}
  </div>
  <div class="row"><div class="q">2. New resource</div>
   ${o(1, 'A. One: Dawnglass', ['Morning light caught in glass; drops ONLY on Deep Dusk / Long Night (boss, dawn, first dawns, a few marked foes).', 'Buys the Daybreak lanterns (Fourth Card, Fifth Hook, Long Night gate, keystones) + cosmetic tints.', 'Never on Twilight, no conversion, capped per run.'], '<span class="pill"><i class="glass"></i>dawnglass</span>')}
   ${o(0, 'B. Two: Wax + Dawnglass', ['Candle wax on Deep Dusk, dawnglass on Long Night, each with its own ring.', 'More to collect, more identity.', 'Two new purses on screen; harder to balance; risk of a dead currency.'], '<span class="pill">wax</span><span class="pill"><i class="glass"></i></span>')}
   ${o(0, 'C. None: bigger gold and shards', ['Harder tiers pay x1.5 / x2 gold and more shards; tier clears are only conditions.', 'Simplest, no new purse.', 'Weakest pull to play harder: gold already buys everything.'], '<span class="pill"><i class="coin"></i>x1.5</span><span class="pill"><i class="shard"></i>+2</span>')}
  </div>
  <div class="row"><div class="q">3. Where tier power works</div>
   ${o(1, 'A. Only on the tiers that pay it', ['Fourth Card, Fifth Hook and the Long Night keystones work on Deep Dusk / Long Night only.', 'Twilight balance never moves (the locked ceiling holds); QoL and info nodes work everywhere.', 'Odd at first: "why only 3 cards on Twilight?"'], chips(['#3a4258', '#9aa8ff', '#c9c2ff']))}
   ${o(0, 'B. Everywhere, inside one ceiling', ['Everything works on every tier; to fit, knots and tags are trimmed harder and the 4th card / 5th slot become exclusive keystones (pick one).', 'Simple rule; weaker nodes.'], chips(['#ffb867', '#ffb867', '#ffb867']))}
   ${o(0, 'C. Everywhere, ceiling raised', ['Everything works everywhere and the ceiling rises +2.5 by rule.', 'Feels best to own; Twilight gets easier for veterans.', 'Needs a reopen of "the ceiling still holds".'], chips(['#ffd36b', '#ffb867', '#ffb867']))}
  </div></div>`;
  out('dt-options-desk.html', page('Tier decisions', body, OPTCSS));
};

// ----------------------------------------------------------------------------- 5. AFFIXES (desktop): the Hollow marks, one verb each
const affixes = () => {
  const husk = (x, y, mark) => {
    let m = '';
    if (mark === 'ironbark') m = `<path d="M${x - 16} ${y - 10} l10 -6 l8 4 l-2 10 l-12 2Z M${x + 4} ${y - 14} l12 2 l2 10 l-10 2Z" fill="#d9cdb0" stroke="#6b5a40" stroke-width="2"/>`;
    if (mark === 'swiftshade') m = `<path d="M${x - 60} ${y - 4} q30 -10 40 -2 M${x - 70} ${y + 6} q34 -8 46 0 M${x - 56} ${y + 14} q26 -6 34 0" stroke="#9a8cff" stroke-width="3" fill="none" opacity=".8"/>`;
    if (mark === 'emberwake') m = `<path d="M${x - 8} ${y - 16} l4 6 l-3 5 M${x + 6} ${y - 14} l-2 7" stroke="#ff8a4a" stroke-width="2.5" fill="none"/><ellipse cx="${x}" cy="${y + 30}" rx="34" ry="10" fill="none" stroke="#ff5a3c" stroke-width="3" stroke-dasharray="6 4"/>`;
    if (mark === 'hollowheart') m = `<circle cx="${x}" cy="${y + 4}" r="6" fill="#c9c2ff" opacity=".9"/><path d="M${x} ${y + 4} L${x + 60} ${y - 20} M${x} ${y + 4} L${x - 58} ${y + 26}" stroke="#c9c2ff" stroke-width="1.5" opacity=".6"/><circle cx="${x + 62}" cy="${y - 21}" r="9" fill="#2a2a3a"/><circle cx="${x - 60}" cy="${y + 27}" r="9" fill="#2a2a3a"/>`;
    return `<ellipse cx="${x}" cy="${y + 26}" rx="26" ry="6" fill="#000" opacity=".35"/><path d="M${x - 24} ${y + 20} q-4 -30 24 -38 q28 8 24 38Z" fill="#3a3a48" stroke="#565a70" stroke-width="2.5"/><ellipse cx="${x}" cy="${y - 6}" rx="16" ry="13" fill="#cfc6ae" stroke="#8a8068" stroke-width="2"/><circle cx="${x - 6}" cy="${y - 6}" r="2.6" fill="#ffb84a"/><circle cx="${x + 6}" cy="${y - 6}" r="2.6" fill="#ffb84a"/>${m}`;
  };
  const list = [['ironbark', 'Ironbark', 'Outlast it', 'hp x1.8, speed x0.85', 'bark plates over the mask (shape, not colour)'], ['swiftshade', 'Swiftshade', 'Out-turn it', 'speed x1.3, hp x0.8', 'cold violet streak, always on'], ['emberwake', 'Emberwake', 'Step out of it', 'death leaves a 28 px ring for 1.2 s', 'ember cracks; red-orange = danger only'], ['hollowheart', 'Hollowheart', 'Kill it first', 'neighbours within 60 px +15% speed', 'chest glow + thin threads (Long Night only)']];
  let svg = '';
  list.forEach(([k, n, v, e, l], i) => { const x = 170 + i * 310; svg += `<rect x="${x - 140}" y="120" width="280" height="470" rx="16" fill="#161c2a" stroke="#8d6c34" stroke-width="2"/>${husk(x, 290, k)}<text x="${x}" y="190" text-anchor="middle" fill="#fff3dc" font-size="26" font-family="HLC,Georgia">${n}</text><text x="${x}" y="420" text-anchor="middle" fill="#6fd3c5" font-size="18" font-family="AS" font-weight="700">${v}</text><text x="${x}" y="450" text-anchor="middle" fill="#fff3dcd0" font-size="15" font-family="AS">${e}</text><text x="${x}" y="476" text-anchor="middle" fill="#a8b0c4" font-size="13.5" font-family="AS">${l}</text>`; });
  const body = `<div style="position:fixed;inset:0;background:radial-gradient(ellipse 90% 80% at 50% 40%,#1a2238,#0b0f1a 80%)"><svg viewBox="0 0 1280 720" style="position:absolute;inset:0;width:100%;height:100%"><text x="40" y="60" fill="#fff3dc" font-size="30" font-family="HLC,Georgia">Hollow marks (affixes) on Deep Dusk / Long Night</text><text x="40" y="88" fill="#a8b0c4" font-size="15" font-family="AS">Schematic husk, not final art. One mark per foe, one verb each, readable by SHAPE first (colour-blind safe); 5% of spawns from 4:00 (Deep Dusk), 10% from 2:30 (Long Night).</text>${svg}<text x="40" y="640" fill="#a8b0c4" font-size="14" font-family="AS">Marked foes drop x5 gold and (Deep Dusk / Long Night only) 1 dawnglass each, capped 2 / 3 per run. Never on bosses; Alphas get at most Ironbark on Long Night.</text></svg></div>`;
  out('dt-affixes-desk.html', page('Hollow marks', body));
};

mapSelect(); results(); treeLayout(); options(); affixes();
