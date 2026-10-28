// A3 key remap shots + live checks (called by scripts/a11y-shots.mjs 3 <outDir>): the Keyboard list in Settings > Controls at desktop /
// game / phone sizes, a real remap through the UI (CDP key presses), then a run where the new keys move, fire the ability and pick a card.
export async function run3({ ev, go, size, seed, shot, check, noOverflow, sleep, base, SIZES, played, send }) {
  const ready = async (expr) => { for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev(expr)) return true; } catch { /* loading */ } } return false; };
  const key = async (code, k, type = 'both') => {
    const p = { code, key: k, windowsVirtualKeyCode: k.length === 1 ? k.toUpperCase().charCodeAt(0) : ({ Escape: 27, ' ': 32 }[k] || 0) };
    if (type !== 'up') await send('Input.dispatchKeyEvent', { type: 'keyDown', ...p });
    if (type !== 'down') await send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
  };
  const openControls = async () => {
    await ev("[...document.querySelectorAll('button')].find(b=>/Settings/.test(b.textContent)).click(); true"); await sleep(500);
    await ev("document.getElementById('u4-tab-controls').click(); true"); await sleep(250);
  };
  for (const k of ['desktop', 'game', 'phoneP']) {
    await size(k); await seed(played); await go(base + '/');
    await ready("!!document.querySelector('.u3-title')");
    await openControls();
    await ev("document.querySelector('.a3-keys').scrollIntoView({block:'start'}); true"); await sleep(200);
    check(`${k}: Keyboard list shows every control`, (await ev("document.querySelectorAll('.a3-key').length")) === 30);
    await noOverflow(`${k} controls keys`);
    const small = await ev("[...document.querySelectorAll('.a3-key')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&(r.height<44||r.width<44)}).length");
    check(`${k}: key buttons are 44 px targets`, small === 0, String(small));
    await shot(`a3-controls-keys-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
  }
  // a real remap through the UI: Ability -> E (swap check with Reroll on R later), Move up -> I, Pick card 1 -> Q
  await size('desktop'); await seed(played); await go(base + '/'); await ready("!!document.querySelector('.u3-title')");
  await openControls();
  const slot = (label, i) => ev(`(()=>{const b=[...document.querySelectorAll('.a3-key')].filter(x=>x.getAttribute('aria-label').startsWith(${JSON.stringify(label + ', key ')}))[${i}];b.focus();b.click();return !!b})()`);
  await slot('Ability', 0); await sleep(100); await key('KeyE', 'e'); await sleep(150);
  await slot('Move up', 0); await sleep(100); await key('KeyI', 'i'); await sleep(150);
  await slot('Pick card 1', 0); await sleep(100); await key('KeyQ', 'q'); await sleep(150);
  await slot('Reroll', 0); await sleep(100); await key('Escape', 'Escape'); await sleep(150);
  check('Esc while waiting cancels and keeps Settings open', await ev("!!window.__app.ui.settingsOpen && /No change/.test(document.querySelector('.a3-keys__msg').textContent)"));
  await slot('Reroll', 0); await sleep(100); await key('KeyE', 'e'); await sleep(150);
  const msg = await ev("document.querySelector('.a3-keys__msg').textContent");
  check('conflict swaps and says so', /Reroll: E\. Ability now uses R\./.test(msg), msg);
  await slot('Reroll', 0); await sleep(100); await key('KeyR', 'r'); await sleep(150); // swap back: Ability E, Reroll R
  await shot('a3-remapped-controls-desktop-1280x720');
  const km = await ev('JSON.stringify(window.__app.save.data.settings.keys)');
  const K = JSON.parse(km);
  check('saved map', K.ability[0] === 'KeyE' && K.up[0] === 'KeyI' && K.pick1[0] === 'KeyQ' && K.reroll[0] === 'KeyR', km);
  await ev("window.__app.save.flush(); window.__app.ui.hideSettings(); true"); await sleep(300);
  // reload: the map persists; start a run and use the new keys
  await go(base + '/?auto=wren&seed=3&god=1&tips=0'); await ready('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.held)');
  check('remap persists across reload', await ev("window.__app.save.data.settings.keys.ability[0]==='KeyE'"));
  check('HUD ability pill shows E', await ev("document.querySelector('.h-abkey') && document.querySelector('.h-abkey').textContent==='E'"));
  await key('KeyI', 'i', 'down'); await sleep(120);
  const held = await ev("window.__app.scene.held.describe()");
  await key('KeyI', 'i', 'up');
  check('I walks up (held tracker)', /dir N/.test(held), held);
  await key('KeyW', 'w', 'down'); await sleep(120);
  const heldW = await ev("window.__app.scene.held.describe()"); await key('KeyW', 'w', 'up');
  check('W no longer walks', /dir -/.test(heldW), heldW);
  await ev("(()=>{const s=window.__app.sim;s.ability.cdLeft=0;return true})()");
  await key('KeyE', 'e'); await sleep(400);
  check('E fires the ability', await ev("window.__app.sim.ability.cdLeft>0"));
  await ev("(()=>{const s=window.__app.sim;s.xp=s.xpNeeded+1;return true})()");
  await ready("document.querySelectorAll('.layer-levelup .card').length>0 && document.querySelector('.layer-levelup').style.display!=='none'");
  await sleep(900);
  check('card 1 badge shows Q', await ev("document.querySelector('.layer-levelup .card .c-key').textContent==='Q'"));
  await shot('a3-levelup-remapped-keys-desktop-1280x720');
  const lvl = await ev('window.__app.sim.level');
  await key('KeyQ', 'q'); await sleep(600);
  check('Q picks card 1', await ev("document.querySelector('.layer-levelup').style.display==='none'"), `level ${lvl}`);
  await shot('a3-hud-remapped-ability-desktop-1280x720');
}
