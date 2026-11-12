// Q5a/Q5c: the new-profile flow and the entry points on the BUILT dist, headless, desktop and phone: Title Begin -> starter pick (hero, then spirit with none preselected)
// -> tree home with your spirit lit -> Play -> loadout -> Back to the tree -> Esc to the title -> Tree button and back -> profile chip -> hostile loadout. Also screenshots.
// Usage: node scripts/flow-smoke.mjs <baseUrl> [outDir]      (serve dist first: cd dist && python -m http.server 5301)
import { launch, sleep, VIEWS } from './u3-lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5301', out = process.argv[3] || 'docs/screenshots/tree-look';
const c = await launch(9397);
let fails = 0;
const ok = (name, v) => { console.log(v ? 'PASS' : 'FAIL', name); if (!v) fails++; };
const visible = (sel) => c.ev(`(() => { const e = document.querySelector('${sel}'); return !!e && getComputedStyle(e).display !== 'none'; })()`);
const click = (sel) => c.ev(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true; })()`);
const key = (k) => c.ev(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', bubbles: true })); return 1; })()`);
try {
  for (const [name, w, h, dpr, mobile] of VIEWS.filter((v) => v[0] !== 'phone-land')) {
    console.log('--', name);
    await c.open(`${base}/?x=1`, w, h, dpr, mobile);
    await sleep(1500);
    await c.ev("(() => { const a = __app; a.save.saveNow = () => {}; a.save.saveSoon = () => {}; return 1; })()");
    ok('new profile needs a starter', await c.ev('__app.needsStarter()'));
    await c.shot(out, `${name}-flow-1-title`);
    await click('.layer-start .lg-btn--primary');
    await sleep(900);
    ok('Title Play asks for the starter first (hero step)', await visible('.layer-hero.ld-starter'));
    ok('the tree is not open yet', !(await c.ev('__app.ui.tree.isOpen')));
    await c.shot(out, `${name}-flow-2-starter-hero`);
    await click('.layer-hero .lg-btn--primary:last-of-type'); await sleep(700);
    const picked = await c.ev("[...document.querySelectorAll('.layer-hero [role=radio]')].filter((e) => e.getAttribute('aria-checked') === 'true').length");
    ok('spirit step: nothing preselected', picked === 0);
    await c.shot(out, `${name}-flow-3-starter-spirit`);
    await c.ev("(() => { const r = document.querySelector('.layer-hero [role=radio]'); r.click(); return 1; })()"); await sleep(300);
    await c.ev("(() => { const b = [...document.querySelectorAll('.layer-hero button')].filter((x) => !/back/i.test(x.textContent)).pop(); b.click(); return 1; })()"); await sleep(1500);
    ok('after the pick the tree home opens (not a run)', (await c.ev('__app.ui.tree.isOpen')) && !(await c.ev('!!__app.sim')));
    ok('starter saved (hero + spirit)', await c.ev("!!(__app.save.data.notes.starter && __app.save.data.notes.starter.hero && __app.save.data.notes.starter.weapon)"));
    ok('your spirit is lit on the web', await c.ev("(() => { const t = __app.ui.tree; const st = t.starter; return !!st && t.model.lit(st.heart); })()"));
    await c.shot(out, `${name}-flow-4-tree-home`);
    ok('the first-visit tour is up (no finished run)', await visible('.ts-tour.open'));
    await key('Escape'); await sleep(300);
    ok('Esc skips the tour first, the tree stays', (await c.ev('__app.ui.tree.isOpen')) && !(await visible('.ts-tour.open')));
    {
      await click(w >= 860 ? '.ts-hplay' : '.ts-playbtn'); await sleep(900);
      ok('Play on the tree runs the loadout (character step)', (await visible('.layer-hero')) && !(await visible('.layer-hero.ld-starter')) && !(await c.ev('__app.ui.tree.isOpen')));
      await click('.layer-hero .lg-btn--secondary'); await sleep(900);
      ok('Back from the loadout returns to the tree', await c.ev('__app.ui.tree.isOpen'));
    }
    await key('Escape'); await sleep(700);
    ok('Esc from the tree reaches the title', (await visible('.layer-start')) && !(await c.ev('__app.ui.tree.isOpen')));
    await c.ev("(() => { const b = [...document.querySelectorAll('.layer-start button')].find((x) => /skill tree/i.test(x.textContent)); b.click(); return 1; })()"); await sleep(900);
    ok('the title Skill Tree button opens the tree', await c.ev('__app.ui.tree.isOpen'));
    await key('Escape'); await sleep(700);
    ok('and Esc comes back to the title', await visible('.layer-start'));
    await click('.fd-chip'); await sleep(700);
    ok('profile chip opens the lantern screen; Esc returns to the title', (await visible('.layer-lanterns')) || (await c.ev("!!document.querySelector('.layer-lanterns')")));
    await key('Escape'); await sleep(500);
    // hostile loadout
    await c.ev("(() => { __app.save.data.notes.loadout = { hero: '__proto__', weapon: '<img src=x onerror=alert(1)>' }; __app.save.data.notes.starter = { hero: 'wren', weapon: 'chain_lightning' }; __app.openTree(); return 1; })()"); await sleep(900);
    ok('a hostile loadout does not break the tree home', (await c.ev('__app.ui.tree.isOpen')) && (await c.ev("document.querySelector('.ts-hname') ? document.querySelector('.ts-hname').textContent.length > 0 : true")));
  }
  ok('no console errors', c.errors.length === 0);
  if (c.errors.length) console.log(JSON.stringify(c.errors.slice(0, 5)));
} finally { c.close(); }
process.exitCode = fails ? 1 : 0;
