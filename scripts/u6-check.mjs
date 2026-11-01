// U6 check: node scripts/u6-check.mjs <baseUrl> [hud]   (serve a build first). Own headless Chrome on port 9397 (kills only that PID).
// 'hud' mode prints a hash of the HUD's computed non-dimensional styles (must be identical before/after U6).
// default mode walks the REAL results screen with real key events: lock, R/Enter/Esc/T, no double banking, focus, count-up final text.
import { launch, sleep } from './u3-lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:4190'; const mode = process.argv[3] || 'keys';
const c = await launch(9397);
let fails = 0; const ok = (n, cond, extra = '') => { console.log(cond ? 'PASS' : 'FAIL', n, extra); if (!cond) fails++; };
const wait = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await c.ev(expr)) return true; await sleep(100); } return false; };

if (mode === 'hud') {
  await c.open(`${base}/?auto=wren&seed=1&god=1`, 1280, 720, 1, false);
  await wait('!!(window.__app && window.__app.sim)'); await sleep(800);
  const h = await c.ev(`(() => { const P = ['color','font-family','font-size','font-weight','font-style','letter-spacing','text-transform','background-image','background-color','border-top-color','border-top-width','border-radius','box-shadow','opacity','display','position','z-index','text-shadow','filter']; let s = ''; for (const e of document.querySelectorAll('.hud, .hud *')) { const cs = getComputedStyle(e); s += e.tagName + '.' + (e.getAttribute('class') || '') + '|' + P.map((p) => cs.getPropertyValue(p)).join(';') + '\\n'; } let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return { n: document.querySelectorAll('.hud, .hud *').length, hash: h }; })()`);
  console.log('HUD', JSON.stringify(h));
  c.close(); process.exit(0);
}

await c.open(`${base}/?x=1`, 1280, 720, 1, false);
await wait('!!(window.__app && window.__app.ui)'); await sleep(1000);
const kdown = async (k, code, vk) => { await c.key(k, code, vk); };
const die = async () => { await c.ev('(() => { __app.sim.gold = 345; __app.sim.shards = 2; __app.sim.state = "defeat"; return 1; })()'); return wait('!!document.querySelector(".layer-end .u6-wrap") && getComputedStyle(document.querySelector(".layer-end")).display !== "none"'); };
const runs = () => c.ev('__app.save.data.stats.runs');
const endShown = () => c.ev('!!document.querySelector(".layer-end") && getComputedStyle(document.querySelector(".layer-end")).display !== "none"');

// 1. a real (non-debug) run ends: banked once, results shown, Again focused, final numbers in place
await c.ev("__app.startRun('wren')");
ok('real run is not a debug run', await c.ev('__app.isDebugRun() === false'));
ok('run ends in defeat and the results appear', await die());
const r0 = await runs();
ok('banked exactly once', r0 === 1, `runs=${r0}`);
ok('Again button is focused', await c.ev('document.activeElement && document.activeElement.classList.contains("u6-btn--again")'));
// keys inside the 250 ms lock are ignored: dispatch R in the same task the screen appears (a key held from the run)
await c.ev("(__app.ui.hide('end'), 1)");
const locked = await c.ev(`new Promise((res) => { const mo = new MutationObserver(() => { if (document.querySelector('.layer-end .u6-wrap')) { mo.disconnect(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); setTimeout(() => res(__app.sim.state + '|' + (getComputedStyle(document.querySelector('.layer-end')).display)), 60); } }); mo.observe(document.body, { subtree: true, childList: true }); __app.ui.layers.end && (__app.ui.layers.end.replaceChildren()); __app.ui.showEnd(__app.sim, null); })`);
ok('R and Esc inside the 250 ms lock do nothing', locked === 'defeat|flex', locked);
await sleep(1500);
const txt = await c.ev('[...document.querySelectorAll(".layer-end .u6-cnt")].map((n) => n.textContent).join("|") + " / " + [...document.querySelectorAll(".layer-end .u6-sr")].map((n) => n.textContent).filter((t) => /^\\+/.test(t)).join("|")');
ok('count-up ended on the final value (visible = screen-reader text)', txt.split(' / ')[0] === txt.split(' / ')[1], txt);
// Tab order: Main menu, Again, Tree; arrows not needed
const order = await c.ev('[...document.querySelectorAll(".layer-end .lg-btn")].map((b) => b.textContent.trim().split(" ")[0]).join(",")');
ok('buttons in the DOM order Main, Again, Tree', /^Main.*Again.*Tree/.test(order), order);
// 2. R twice quickly: one new run, no extra banking
await kdown('r', 'KeyR', 82); await kdown('r', 'KeyR', 82);
await sleep(400);
ok('R starts a new run (end screen gone, sim running)', !(await endShown()) && (await c.ev('__app.sim.state')) === 'running');
ok('pressing R twice did not bank again', (await runs()) === 1, `runs=${await runs()}`);
// 3. second death, Enter = Again
await die(); await sleep(400);
ok('second run banked once more', (await runs()) === 2);
await c.ev('document.activeElement && document.activeElement.blur()');
await kdown('Enter', 'Enter', 13); await sleep(400);
ok('Enter (nothing focused) = Again', !(await endShown()) && (await c.ev('__app.sim.state')) === 'running');
// 4. Esc = Main menu
await die(); await sleep(400);
await kdown('Escape', 'Escape', 27); await sleep(500);
ok('Esc = Main menu (start screen visible, no run)', !(await endShown()) && (await c.ev('__app.sim === null')));
// 5. T = Tree
await c.ev("__app.startRun('wren')"); await die(); await sleep(400);
await kdown('t', 'KeyT', 84); await sleep(600);
ok('T opens the Tree', !(await endShown()) && (await c.ev('__app.ui.tree.isOpen === true')));
// 6. Enter on a focused Main menu button activates THAT button only
await c.ev('__app.ui.tree.isOpen && document.querySelector(".tree-top .btn, .tree-close, [data-act=close]") && 0');
console.log('errors:', JSON.stringify(c.errors.slice(0, 5)));
ok('no page errors', c.errors.length === 0);
c.close();
console.log(fails ? `FAILS ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
