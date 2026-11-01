// Shared content + markup for both takes. Static mock-ups, NOT game code.
// Fonts are INSTALLED STAND-INS (see README); the real OFL fonts are spec only until Matt OKs the download.
export const ICON = {
  wolf: '<svg viewBox="0 0 24 24"><path d="M4.5 3.5l4.2 3.3h6.6l4.2-3.3v8.2c0 4.4-3.2 8.3-7.5 8.3s-7.5-3.9-7.5-8.3z"/><path class="ac" d="M9 12.5l1.5 1.2M15 12.5l-1.5 1.2M12 15.5v1.5"/></svg>',
  orbit: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="4.2"/><circle class="fl" cx="21" cy="12" r="1.9"/><circle class="fl" cx="6" cy="14.5" r="1.5"/><circle class="fl" cx="15.5" cy="8.3" r="1.5"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 13-3.5M19 12a7 7 0 0 1-13 3.5"/><path class="fl" d="M13 3.5L8 13h4l-1 7.5 5.500-9.800H12.500z"/></svg>',
  boots: '<svg viewBox="0 0 24 24"><path d="M8 4h6v8l5 2.5V19H5v-3.5L8 14z"/><path class="ac" d="M5 16.5h14M3 8.5h3M2 11.5h4"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path class="fl" d="M12 3c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.200 1-3.600 2-4.800.4 1.600 1.200 2.300 2 2.600C10.200 8.500 10.800 5.800 12 3z"/></svg>',
  seal: '<svg viewBox="0 0 24 24"><path class="fl" d="M12 2.5l2.6 5.200 5.800.8-4.200 4 1 5.700L12 15.500l-5.200 2.700 1-5.700-4.200-4 5.800-.8z"/></svg>',
  coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path class="ac" d="M12 7.5v9M9.500 10.500c0-1.500 5-1.500 5 0s-5 1.500-5 3 5 1.500 5 0"/></svg>',
  shard: '<svg viewBox="0 0 24 24"><path class="fl" d="M12 2.5l6 7.500-3.500 11.500h-5L6 10z"/></svg>',
};
export const ic = (k, cls = '') => `<span class="ico ${cls}">${ICON[k]}</span>`;

// Backdrop: hollow grey-blue dusk, a lantern pool, a thread curve. Placeholder for the frozen game frame.
export const BG = (warm = 1) => `<svg class="bgscene" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><radialGradient id="lp" cx="30%" cy="62%" r="50%"><stop offset="0" stop-color="#ffcf7a" stop-opacity="${0.5 * warm}"/><stop offset=".5" stop-color="#ffab3a" stop-opacity="${0.12 * warm}"/><stop offset="1" stop-color="#ffab3a" stop-opacity="0"/></radialGradient>
<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141b2c"/><stop offset="1" stop-color="#2a3550"/></linearGradient></defs>
<rect width="160" height="90" fill="url(#sk)"/><rect width="160" height="90" fill="url(#lp)"/>
<path d="M0 66 Q20 58 42 64 T90 62 T160 60 V90 H0z" fill="#1a2236"/><path d="M0 74 Q30 68 60 73 T120 72 T160 70 V90 H0z" fill="#121828"/>
<g fill="#0e1422"><path d="M118 74 l3-22 3 22z"/><path d="M130 76 l4-30 4 30z"/><path d="M144 75 l3-20 3 20z"/><path d="M8 76 l3-18 3 18z"/></g>
<path d="M48 70 C60 60 70 76 84 66 S112 60 126 52" fill="none" stroke="#ffe0a0" stroke-opacity=".35" stroke-width=".35" stroke-dasharray="1 .9"/>
<g fill="#ffe0a0"><circle cx="48" cy="70" r=".9" opacity=".9"/><circle cx="96" cy="64" r=".35" opacity=".6"/><circle cx="70" cy="50" r=".3" opacity=".5"/><circle cx="110" cy="40" r=".3" opacity=".5"/><circle cx="30" cy="40" r=".3" opacity=".5"/></g></svg>`;

// Placeholder hero bust (the real build uses the locked hero rigs).
export const HERO = (c1, c2, c3) => `<svg class="hero" viewBox="0 0 60 80"><ellipse cx="30" cy="74" rx="16" ry="3.5" fill="#000" opacity=".35"/><path d="M14 70 Q14 44 30 44 T46 70z" fill="${c1}"/><circle cx="30" cy="32" r="14" fill="#f6dfc0"/><path d="M15 30 Q30 8 45 30 Q38 20 30 21 Q22 20 15 30z" fill="${c2}"/><path d="M18 46 Q30 54 42 46" stroke="${c3}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="25" cy="33" r="1.5" fill="#2a1d3a"/><circle cx="35" cy="33" r="1.5" fill="#2a1d3a"/><g transform="translate(44 52)"><rect x="-1" y="-10" width="2" height="20" fill="#5a3e2a"/><circle cy="-12" r="5" fill="#ffcf7a" opacity=".5"/><circle cy="-12" r="2.6" fill="#fff1c8"/></g></svg>`;

const parts = '<i class="f tl"></i><i class="f tr"></i><i class="f bl"></i><i class="f br"></i><i class="stitch"></i><i class="leak"></i>';
const frame = (inner, cls = '') => `<div class="panel ${cls}">${parts}<i class="eye"></i><div class="in">${inner}</div></div>`;
const btn = (label, sub = '', cls = '', key = '') => `<button class="btn ${cls}"><i class="wk">${ICON.flame}</i><span class="bl"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span>${key ? `<kbd>${key}</kbd>` : ''}</button>`;
const rule = () => '<div class="rule"><i></i><u></u><i></i></div>';
const pips = (n, of) => `<span class="pips">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const wicks = (n, of) => `<span class="wicks">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

export const SCREENS = {
  title: () => `${BG()}<div class="center">
    <div class="kick">Chapter 1 &middot; The Cursed Forest</div>
    <h1 class="logo"><span>Hollowlight</span><em>${ICON.flame}</em></h1>
    <div class="tagline">Spirits of the Dusk</div>
    ${rule()}
    <nav class="menu">${btn('Begin the night', 'Pick a hero and walk the Hollow', 'primary', 'Enter')}${btn('The Thread', 'Spend what you carried home')}${btn('Lantern settings', 'Sound, motion, saves')}</nav>
    <div class="bank">${ic('coin', 'sm')}<b>120</b> gold <span class="sep">&middot;</span> ${ic('shard', 'sm')}<b>3</b> soul shards</div></div>
    <div class="foot">v0.4.0 &middot; Install / Full screen</div>`,

  hero: () => `${BG(0.8)}<div class="page"><header class="ph c"><div class="kick">Night 1 &middot; The Cursed Forest</div><h2>Who carries the lantern?</h2></header>
    <div class="row2">
    ${[
      ['Wren', 'the Orphan', 'Quick on her feet, with a pack at her heels.', 60, 96, 'Light-footed: +10% move speed', 'wolf', 'Ghost Wolves', 'Pack Howl', ['#b4643c', '#7a3f26', '#6fd3c5']],
      ['Elias', 'the Priest', 'Slow to move, and very hard to put out.', 130, 76, 'Steady hands: +15% holy damage', 'orbit', 'Holy Orbit', 'Candle Wheel', ['#e8e2d0', '#cfc6ad', '#8a5cff']],
    ].map(([n, ep, line, hp, sp, gift, wi, wn, ab, cols], i) => `<article class="panel hcard${i ? '' : ' sel'}" tabindex="0">${parts}<i class="eye"></i><div class="in">
      <div class="portrait">${HERO(...cols)}</div><div class="hbody"><h3>${n}<small>${ep}</small></h3><p class="line">${line}</p>
      <dl class="stats"><dt>Heart</dt><dd>${wicks(Math.round(hp / 26), 6)}<b>${hp}</b></dd><dt>Stride</dt><dd>${wicks(Math.round(sp / 20), 6)}<b>${sp}</b></dd></dl>
      <ul class="gifts"><li>${ic(wi, 'sm')}<span><small>Spirit</small>${wn}</span></li><li>${ic('flame', 'sm')}<span><small>Ability &middot; 60s</small>${ab}</span></li></ul>
      <p class="gift">${gift}</p></div></div></article>`).join('')}
    </div>
    <footer class="pf">${btn('Walk with Wren', '', 'primary', 'Enter')}${btn('Back', '', '', 'Esc')}</footer></div>`,

  levelup: () => `${BG(0.5)}<div class="dim"></div><div class="page lu"><header class="ph c"><h2>The light stirs</h2><div class="kick">Level 7 &middot; choose one gift</div></header>
    <div class="cards">
     <article class="card evo" tabindex="0">${parts}<i class="eye"></i><span class="badge b-evo">${ICON.seal}Evolve</span><kbd class="ck">1</kbd>
       <div class="in">${ic('wolf', 'lg gold')}<h3>Pouncing Pack</h3><div class="big">Leap</div><div class="unit">pin and maul</div>${pips(5, 5)}<p>Wolves leap onto a foe, pin it down and maul it.</p><small class="from">from Ghost Wolves</small></div></article>
     <article class="card" tabindex="0">${parts}<i class="eye"></i><kbd class="ck">2</kbd>
       <div class="in"><div class="own">Holy Orbit</div>${ic('orbit', 'lg')}<h3>Wider orbit</h3><div class="big">+12%</div><div class="unit">50 &rarr; 56 reach</div>${pips(3, 5)}<p class="hush">Something stirs&hellip;</p></div></article>
     <article class="card" tabindex="0">${parts}<i class="eye"></i><span class="badge b-new">New</span><kbd class="ck">3</kbd>
       <div class="in">${ic('bolt', 'lg')}<h3>Spirit Bolts</h3><div class="big">1</div><div class="unit">bolt at a time</div>${pips(0, 5)}<p>Homing orbs seek out the nearest foe.</p></div></article>
    </div>
    <section class="bless"><div class="bh"><span>Blessings</span><i></i><em>quiet gifts, never the main choice</em></div>
     <div class="brow"><button class="bcard">${ic('boots', 'sm')}<span><b>Dawnlit Soles</b><small>+2% move speed &middot; 1/2</small></span><kbd>4</kbd></button><button class="bcard">${ic('flame', 'sm')}<span><b>Wrapped Warmth</b><small>+4% max HP &middot; 2/3</small></span><kbd>5</kbd></button></div></section>
    <div class="lufoot"><button class="pill"><kbd>R</kbd>Reroll <b>&times;2</b></button><button class="pill"><kbd>B</kbd>Banish <b>&times;1</b></button></div></div>`,

  pause: () => `${BG(0.4)}<div class="dim"></div><div class="center small">
    ${frame(`<div class="kick">The night waits</div><h2>Paused</h2><p class="line c">The lantern holds its breath. Take your time.</p>${rule()}<nav class="menu">${btn('Keep walking', '', 'primary', 'Esc')}${btn('Lantern settings', '')}${btn('Leave the night', 'Back to the title; this run is lost')}</nav>`, 'pp')}</div>`,

  settings: () => `${BG(0.4)}<div class="dim"></div><div class="center small wide">
    ${frame(`<div class="kick">Lantern settings</div><h2>Settings</h2>${rule()}
    <div class="srows">
     <div class="sr"><label>Music</label><span class="slider"><i style="width:72%"></i><u style="left:72%"></u></span><b>72</b></div>
     <div class="sr"><label>Sounds</label><span class="slider"><i style="width:84%"></i><u style="left:84%"></u></span><b>84</b></div>
     <div class="sr"><label>Screen shake</label><span class="tog on"><u></u></span><b>On</b></div>
     <div class="sr"><label>Calm motion</label><span class="tog"><u></u></span><b>Off</b></div>
     <div class="sr"><label>Damage numbers</label><span class="tog on"><u></u></span><b>On</b></div>
     <div class="sr"><label>Picture quality</label><span class="dd">Auto<i></i></span><b></b></div></div>
     <div class="srow-b"><button class="btn sm"><span class="bl"><b>Save to file</b></span></button><button class="btn sm"><span class="bl"><b>Load from file</b></span></button><button class="btn sm danger"><span class="bl"><b>Forget everything</b></span></button></div>
     <div class="pf">${btn('Back', '', 'primary', 'Esc')}</div>`, 'sp')}</div>`,

  results: () => `${BG(0.9)}<div class="dim"></div><div class="res"><div class="rbody">
    <div class="rhero"><svg class="lamp" viewBox="0 0 60 90"><defs><radialGradient id="lg" cx="50%" cy="55%" r="50%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffab3a" stop-opacity="0"/></radialGradient></defs><circle cx="30" cy="56" r="30" fill="url(#lg)"/><path d="M30 6v10" stroke="#d8b26a" stroke-width="2"/><path d="M18 18h24l3 6H15z" fill="#8d6c34"/><path d="M17 24h26v34H17z" fill="#1c1714" stroke="#d8b26a" stroke-width="2"/><path d="M15 58h30l-3 8H18z" fill="#8d6c34"/><path d="M30 34c1.5 5 6 7 6 13a6 6 0 0 1-12 0c0-3 1.5-4.500 2.500-6 .5 2 1.500 3 2.500 3 .5-3 .8-6 1-10z" fill="#ffab3a"/><path d="M30 44c1 2.500 3 3.500 3 6a3 3 0 0 1-6 0c0-1.800 1.500-2.500 3-6z" fill="#fff1c8"/></svg>
     <div class="kick">Night 1 &middot; Cursed Forest &middot; Wren</div><h1>The light dwindles</h1><p class="line">The night is long. The lantern still burns, a little. Rest, then walk again.</p></div>
    ${frame(`<div class="timeblk"><div class="trow"><span class="big">11:42</span><span class="lab">survived</span></div><div class="near">3:18 short of dawn &middot; best <b>12:05</b></div>
      <div class="arc"><i style="width:78%"></i><em style="left:66%"></em><u style="left:78%"></u></div><div class="arcl"><span>dusk</span><span>the Treant, 10:00</span><span>dawn</span></div></div>
      <div class="chips"><div class="chip"><b>14</b><small>Level</small></div><div class="chip"><b>1,204</b><small>Slain</small></div><div class="chip"><b>1</b><small>Evolved</small></div></div>
      <div class="bank2"><div class="chip">${ic('coin', 'sm')}<b>+312</b><small>gold &middot; 432 kept</small></div><div class="chip">${ic('shard', 'sm')}<b>+2</b><small>soul shards &middot; 5 kept</small></div></div>
      <div class="pack"><div class="wr"><i>${ICON.wolf}</i><span>Pouncing Pack<em> &#9733;</em></span><span class="bar"><i style="width:64%"></i></span><b>64%</b></div><div class="wr"><i>${ICON.orbit}</i><span>Holy Orbit</span><span class="bar"><i style="width:22%"></i></span><b>22%</b></div></div>
      <div class="nudge"><span>Closest unlock: <b>Raven Flock</b></span><div class="arc thin"><i style="width:84%"></i></div><small>84% &middot; 120 crows slain</small></div>`, 'rp')}
    </div><div class="acts">${btn('Walk again', '', 'primary', 'R')}${btn('The Thread', 'Spend gold', '', 'T')}${btn('Title', '', '', 'Esc')}</div></div>`,
};
