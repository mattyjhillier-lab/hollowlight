// U5 check: node scripts/u5-shots.mjs <outDir> <before|after> [baseUrl]   (serve a build first: npx vite preview --port 4189)
// Own headless Chrome on port 9395 (kills only that PID). Offers are STAGED in a debug run (never touches the real save): the sim is paused in
// 'levelup', sim.offer is replaced with hand-built cards (same shapes the Sim produces) and the REAL ui.showLevelUp renders them.
// Screenshots every card type at 1280x720, 844x390@2x, 390x844@2x. 'after' also measures (overflow, tap targets, text floor, scroll) and walks the keyboard.
import { launch, VIEWS, sleep } from './u3-lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const out = process.argv[2]; const mode = process.argv[3] || 'after'; const base = process.argv[4] || 'http://localhost:4189';
const c = await launch(9395);
// JPEG keeps the committed screenshots small (45 images)
const shot = async (dir, name) => { mkdirSync(dir, { recursive: true }); const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); writeFileSync(join(dir, name + '.jpg'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
const ok = (name, cond, extra = '') => { if (!cond) fail(`${name} ${extra}`); else console.log('PASS', name, extra); };

const STAGE = (which) => `(() => {
  const a = window.__app, s = a.sim, d = a.data || s.data;
  const st = (weaponId, stat, rank, extra = {}) => ({ key: 's:' + weaponId + ':' + stat, kind: 'stat', weaponId, stat, rank, nextRank: rank + 1, maxRank: 5, title: '', desc: '', color: '#fff', ...extra });
  const evo = (weaponId, evoId) => ({ key: 'e:' + evoId, kind: 'evolution', weaponId, evoId, title: d.evolutions[evoId].name, desc: d.evolutions[evoId].desc, badge: 'EVOLVE', from: d.weapons[weaponId].name });
  const wpn = (id) => ({ key: 'w:' + id, kind: 'weapon', weaponId: id, title: d.weapons[id].name, desc: d.weapons[id].desc, badge: 'NEW' });
  const bl = (id, rank) => { const b = d.blessings.items[id]; return { key: 'b:' + id, kind: 'blessing', blessId: id, effect: b.effect, title: b.name, desc: b.desc, rank, nextRank: rank + 1, maxRank: b.ranks, color: '#e8d9a8' }; };
  const fb = (k) => ({ key: 'f:' + k, kind: 'fallback', fallback: k, title: d.balance.fallback[k].name, desc: d.balance.fallback[k].desc, color: '#cfcfcf' });
  const sets = {
    mock: { gold: [evo('ghost_wolves', 'phantom_stampede')], cards: [st('holy_orbit', 'radius', 2, { stirs: true }), wpn('spirit_bolts'), bl('dawnlit_soles', 0), bl('wrapped_warmth', 1)] },
    stats: { gold: [], cards: [st('holy_orbit', 'radius', 2), st('ghost_wolves', 'speed', 1), st('chain_lightning', 'cooldown', 4)] },
    full: { gold: [evo('ghost_wolves', 'phantom_stampede')], cards: [st('holy_orbit', 'radius', 2, { stirs: true }), st('ghost_wolves', 'speed', 1), wpn('spirit_bolts'), bl('dawnlit_soles', 0), bl('wrapped_warmth', 1)] },
    quiet3: { gold: [], cards: [fb('heal'), fb('gold'), fb('xp'), bl('wider_glow', 0), bl('kindled_spirits', 1), bl('kind_fortune', 2)] },
    six: { gold: [evo('ghost_wolves', 'howling_legion'), evo('holy_orbit', 'sanctum_halo'), evo('spirit_bolts', 'soul_lance')], cards: [st('chain_lightning', 'cooldown', 1), st('ghost_wolves', 'count', 2), st('raven_flock', 'range', 0)] },
    hostile: { gold: [], cards: [{ key: 'x1', kind: 'stat', weaponId: 'ghost_wolves', stat: 'power', rank: 0, nextRank: 1, maxRank: 5, title: 'T'.repeat(200), desc: 'D'.repeat(400) }, { key: 'x2', kind: 'weapon', weaponId: 'holy_orbit', title: '<img src=x onerror=alert(1)> ' + 'W'.repeat(80), desc: 'M '.repeat(120) }, { key: 'x3', kind: 'fallback', fallback: 'gold', title: '"><script>1</script>', desc: '+99999999999 gold ' + 'x'.repeat(300) }] },
  };
  s.pending = 1; s.xp = 0;
  if (s.state !== 'levelup') s.beginLevelUp();
  s.offer = sets[${JSON.stringify(which)}];
  a.ui.showLevelUp(s);
  return 1;
})()`;

const MEASURE = `(async () => { await document.fonts.ready;
  const lay = document.querySelector('.layer-levelup');
  const R = (e) => e.getBoundingClientRect();
  const vis = (e) => { const r = R(e), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const q = (sel) => [...lay.querySelectorAll(sel)];
  const cards = q('.card'), btns = q('.lu-btn');
  const taps = [...cards, ...btns].filter(vis).map((e) => { const r = R(e); return [e.className.split(' ')[0], Math.round(r.width), Math.round(r.height)]; });
  let minF = 99; const tw = document.createTreeWalker(lay, NodeFilter.SHOW_TEXT); let n; const small = [];
  while ((n = tw.nextNode())) { if (!n.textContent.trim()) continue; const p = n.parentElement; if (!vis(p)) continue; const f = parseFloat(getComputedStyle(p).fontSize); if (f < minF) minF = f; if (f < 12) small.push(p.className + ':' + f); }
  const inCard = []; for (const cd of cards) { const cr = R(cd); for (const e of cd.querySelectorAll('.c-icon,.c-title,.c-num,.c-unit,.c-desc,.c-pips,.c-stirs,.c-from,.c-kicker')) { if (!vis(e)) continue; const r = R(e); if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) inCard.push(cd.className.split(' ')[0] + '>' + e.className); } }
  const out = []; for (const e of lay.querySelectorAll('*')) { if (!vis(e) || (e.closest('svg') && e.tagName !== 'svg')) continue; const r = R(e); if (r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1 || r.top < -1) out.push(e.className + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom)); }
  const txtOver = []; for (const e of q('.c-title,.c-unit,.c-num,.c-desc,.c-tag,.c-from')) if (vis(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' && getComputedStyle(e).textOverflow === 'clip' && !(getComputedStyle(e).webkitLineClamp > 0)) txtOver.push(e.className + ':' + e.textContent.slice(0, 20));
  const cs = getComputedStyle(lay);
  return { n: cards.length, taps: taps.length, small: taps.filter((t) => t[1] < 44 || t[2] < 44), minF, smallText: small, inCard, out, txtOver,
    scroll: lay.scrollHeight > lay.clientHeight + 1 || lay.scrollWidth > lay.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1,
    backdrop: cs.backdropFilter || 'none', eyelets: q('.lu-eyelet').filter(vis).length, ext: performance.getEntriesByType('resource').map((r) => r.name).filter((u) => !u.startsWith(location.origin) && !u.startsWith('data:')) };
})()`;

const start = async (url, w, h, d, m) => { await c.open(url, w, h, d, m); for (let i = 0; i < 60; i++) { if (await c.ev('!!(window.__app && window.__app.sim)')) break; await sleep(250); } await sleep(1200); };
const sets = mode === 'before' ? ['mock', 'stats', 'quiet3', 'six', 'hostile'] : ['mock', 'stats', 'quiet3', 'six', 'hostile', 'full'];
for (const [n, w, h, d, m] of VIEWS) {
  console.log(n);
  const touch = m ? '&touch=1' : '';
  await start(`${base}/?auto=wren&seed=1&god=1&rr=2&ban=1${touch}`, w, h, d, m);
  for (const set of sets) {
    await c.ev(STAGE(set)); await sleep(900);
    await shot(out, `${mode}-${set}-${n}`);
    if (mode === 'after') {
      const r = await c.ev(MEASURE);
      console.log(' ', set, JSON.stringify({ n: r.n, minF: r.minF, small: r.small, inCard: r.inCard, out: r.out, txtOver: r.txtOver, scroll: r.scroll, eyelets: r.eyelets }));
      if (r.small.length) fail(`${n}/${set} taps < 44: ${JSON.stringify(r.small)}`);
      if (r.minF < 12) fail(`${n}/${set} text < 12px: ${r.smallText}`);
      if (r.inCard.length) fail(`${n}/${set} child outside card: ${r.inCard.slice(0, 3)}`);
      if (r.out.length) fail(`${n}/${set} outside viewport: ${r.out.slice(0, 3)}`);
      if (r.scroll) fail(`${n}/${set} scrolls`);
      if (r.backdrop !== 'none') fail(`${n}/${set} backdrop-filter ${r.backdrop}`);
      if (r.ext.length) fail(`${n}/${set} external requests ${r.ext}`);
    }
  }
  // banish mode on the real handlers (B key), the lock, and a natural unstaged offer
  await c.ev(STAGE('mock')); await sleep(500);
  await c.ev("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))"); await sleep(250);
  await shot(out, `${mode}-banish-${n}`);
  await start(`${base}/?auto=wren&seed=1&god=1&rr=2&ban=1&t=240&grant=${encodeURIComponent('raven_flock;spirit_bolts;holy_orbit')}${touch}`, w, h, d, m);
  let seen = false; for (let i = 0; i < 400 && !seen; i++) { await sleep(250); seen = await c.ev("window.__app.sim.state === 'levelup' && !!document.querySelector('.layer-levelup .card')"); }
  ok(`${n}: natural offer rendered`, seen); await sleep(800);
  await shot(out, `${mode}-natural-${n}`);
  if (mode === 'after' && seen) { const r = await c.ev(MEASURE); if (r.small.length || r.minF < 12 || r.scroll || r.inCard.length) fail(`${n}/natural ${JSON.stringify([r.small, r.minF, r.scroll, r.inCard])}`); }
}
if (mode === 'after') {
  // keyboard-only walkthrough (desktop)
  await start(`${base}/?auto=wren&seed=1&god=1&rr=2&ban=1`, 1280, 720, 1, false);
  await c.ev(STAGE('mock')); await sleep(500);
  const act = `(() => { const e = document.activeElement; return e ? (e.getAttribute('data-act') || e.getAttribute('data-key') || e.tagName) : 'none'; })()`;
  const order = [];
  await c.ev("document.activeElement && document.activeElement.blur()");
  const rings = [];
  for (let i = 0; i < 9; i++) { await c.key('Tab', 'Tab', 9); await sleep(60); order.push(await c.ev(act)); rings.push(await c.ev(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== 'none' && e.classList.contains('sel')); })()`)); }
  ok('every Tab stop shows a focus mark', rings.slice(0, 7).every(Boolean), rings.join(','));
  console.log('  tab order', order.join(' | '));
  ok('tab order: 3 main cards, then 2 blessings, then reroll, banish (HUD under the offer is skipped)', order.slice(0, 3).every((x) => /^(e|s|w):/.test(x)) && /^b:/.test(order[3]) && /^b:/.test(order[4]) && order[5] === 'reroll' && order[6] === 'banish', order.join(','));
  await c.key('Tab', 'Tab', 9, 8); await c.key('Tab', 'Tab', 9, 8); // shift+Tab twice walks back: banish -> reroll

  await c.key('b', 'KeyB', 66); await sleep(150);
  ok('B toggles banish mode', await c.ev("document.querySelector('.layer-levelup').classList.contains('banishing') && document.querySelector('[data-act=banish]').getAttribute('aria-pressed') === 'true'"));
  await c.key('b', 'KeyB', 66); await sleep(100);
  const before = await c.ev("window.__app.sim.state");
  await c.key('2', 'Digit2', 50); await sleep(150); // inside the 250ms lock? staged render was > 500ms ago, so this picks
  const after = await c.ev("window.__app.sim.state");
  console.log('  state', before, '->', after);
  ok('key 2 picks and the offer closes', before === 'levelup' && after !== 'levelup');
  // reduced motion
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await start(`${base}/?auto=wren&seed=1&god=1&rr=2&ban=1`, 1280, 720, 1, false);
  await c.ev(STAGE('mock')); await sleep(300);
  const an = await c.ev("[...document.querySelectorAll('.layer-levelup .card, .layer-levelup .lu-title, .layer-levelup .lu-eyelet')].map((e) => getComputedStyle(e).animationName).join(',')");
  ok('reduced motion: no card animation', !/[a-z]/i.test(an.replace(/none/g, '')), an);
}
c.close();
console.log(fails ? `${fails} FAILED` : 'ALL OK');
process.exit(fails ? 1 : 0);
