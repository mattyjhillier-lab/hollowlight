// Extra specimen screens for the font proofs (wordmark + type ladder, HUD numerals + damage numbers). Static mock-up markup, NOT game code.
import { ICON, ic, BG } from '../ui-identity/shared.mjs';

export const EXTRA = {
  wordmark: () => `${BG(0.9)}<div class="center wm">
    <div class="kick">Chapter 1 &middot; The Cursed Forest</div>
    <h1 class="logo xl"><span>Hollowlight</span><em>${ICON.flame}</em></h1>
    <div class="tagline">Spirits of the Dusk</div>
    <div class="ladder">
      <div class="lr"><small>Screen title</small><h2>Who carries the lantern?</h2></div>
      <div class="lr"><small>Card title</small><h3>Pouncing Pack</h3></div>
      <div class="lr"><small>Body 14</small><p class="b14">Wolves leap onto a foe, pin it down and maul it. Wider orbit +12%, 50 &rarr; 56 reach.</p></div>
      <div class="lr"><small>Body 12</small><p class="b12">Slow to move, and very hard to put out. Heart 130, Stride 76, Cooldown 60s. 0123456789</p></div>
      <div class="lr"><small>Whisper</small><p class="whisper">The trees remember being green.</p></div>
    </div></div>`,

  hud: () => `${BG(1)}<div class="hudw">
    <div class="hl plate"><div class="lvl"><small>Level</small><b class="num">14</b></div><div class="hp"><i style="width:68%"></i></div><span class="num hpn">82 / 120</span></div>
    <div class="hc plate"><div class="moon"><i style="width:56%"></i></div><b class="num clock">05:42</b></div>
    <div class="hr plate"><span class="cur">${ic('coin', 'sm')}<b class="num">1,284</b></span><span class="cur">${ic('shard', 'sm')}<b class="num">3</b></span></div>
    <div class="dmgfield"><span class="dn d1">14</span><span class="dn d2">37</span><span class="dn d3 crit">128</span><span class="dn d4">9</span><span class="dn d5 heal">+30</span><span class="dn d6">52</span></div>
    <div class="abil plate"><small>Pack Howl</small><b class="num">0:42</b></div>
    <div class="toast plate"><span class="whisper">Something stirs&hellip; the lantern burns brighter.</span></div>
    <div class="xp"><i style="width:44%"></i></div></div>`,
};
