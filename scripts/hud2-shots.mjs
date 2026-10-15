// HUD-2 check: node scripts/hud2-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// Headless Chrome over CDP. Offers are STAGED in a debug run (?debug params never touch the real save): the sim is paused in
// 'levelup', sim.offer is replaced with hand-built cards of every kind (same shapes the Sim produces) and the REAL ui.showLevelUp
// renders them. One natural, unstaged offer per viewport is also captured. Measures overflow, hit targets, text sizes, row layout.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9347;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-hud2-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
};
const [out, base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  const kb = Math.round(statSync(f).size / 1024);
  console.log(`  shot ${name}.jpg ${kb}KB`);
  if (kb > 300) check(`size ${name}`, false, kb + 'KB');
};

async function load(w, h, mobile, query) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  await sleep(600);
}

// Staged offers (hand-built cards in the exact shapes src/sim/cards.js and blessings.js produce).
const STAGE = `(() => {
  const a = window.__app, s = a.sim, d = a.data || s.data;
  const st = (weaponId, stat, rank, extra = {}) => ({ key: 's:' + weaponId + ':' + stat, kind: 'stat', weaponId, stat, rank, nextRank: rank + 1, maxRank: 5, title: '', desc: '', color: '#fff', ...extra });
  const evo = (weaponId, evoId) => ({ key: 'e:' + evoId, kind: 'evolution', weaponId, evoId, title: d.evolutions[evoId].name, desc: d.evolutions[evoId].desc, badge: 'EVOLVE', from: d.weapons[weaponId].name });
  const wpn = (id) => ({ key: 'w:' + id, kind: 'weapon', weaponId: id, title: d.weapons[id].name, desc: d.weapons[id].desc, badge: 'NEW' });
  const bl = (id, rank) => { const b = d.blessings.items[id]; return { key: 'b:' + id, kind: 'blessing', blessId: id, effect: b.effect, title: b.name, desc: b.desc, rank, nextRank: rank + 1, maxRank: b.ranks, color: '#e8d9a8' }; };
  const fb = (k) => ({ key: 'f:' + k, kind: 'fallback', fallback: k, title: d.balance.fallback[k].name, desc: d.balance.fallback[k].desc, color: '#cfcfcf' });
  const sets = {
    full: { gold: [evo('ghost_wolves', 'phantom_stampede')], cards: [st('holy_orbit', 'radius', 2, { stirs: true }), st('ghost_wolves', 'speed', 1), wpn('spirit_bolts'), bl('dawnlit_soles', 0), bl('wrapped_warmth', 1)] },
    quiet3: { gold: [], cards: [fb('heal'), fb('gold'), fb('xp'), bl('wider_glow', 0), bl('kindled_spirits', 1), bl('kind_fortune', 2)] },
    six: { gold: [evo('ghost_wolves', 'howling_legion'), evo('holy_orbit', 'sanctum_halo'), evo('spirit_bolts', 'soul_lance')], cards: [st('chain_lightning', 'cooldown', 1), st('ghost_wolves', 'count', 2), st('raven_flock', 'range', 0)] },
  };
  const which = %WHICH%;
  s.pending = 1; s.xp = 0;
  if (s.state !== 'levelup') s.beginLevelUp();
  s.offer = sets[which];
  a.ui.showLevelUp(s);
  return which;
})()`;

// Layout / size / overflow measurements of what is on screen right now.
const MEASURE = `(() => {
  const q = (sel) => [...document.querySelectorAll(sel)];
  const R = (e) => e.getBoundingClientRect();
  const lay = document.querySelector('.layer-levelup');
  const vw = innerWidth, vh = innerHeight;
  const cards = q('.layer-levelup .card'), main = q('.lu-main .card'), quiet = q('.lu-quiet .card');
  const fs = (sel) => Math.min(...q(sel).map((e) => parseFloat(getComputedStyle(e).fontSize)).concat([999]));
  const clipped = [];
  for (const c of cards) { const cr = R(c); for (const e of c.querySelectorAll('*')) { if (e.closest('svg')) continue; const r = R(e); if (r.width && (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1)) clipped.push(c.className + ' > ' + e.className); } }
  const over = []; for (const e of q('.layer-levelup .c-title, .layer-levelup .c-unit, .layer-levelup .c-num, .layer-levelup .c-desc, .layer-levelup .c-tag')) if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow === 'clip' && !/^\d/.test(getComputedStyle(e).webkitLineClamp)) over.push(e.className + ':' + e.textContent);
  const btn = q('.lu-btn').map((b) => R(b));
  const foot = document.querySelector('.lu-foot'), head = document.querySelector('.lu-head');
  const rows = new Set(main.map((c) => Math.round(R(c).top / 40)));
  const ml = main.length ? Math.max(...main.map((c) => R(c).bottom)) : 0, qt = quiet.length ? Math.min(...quiet.map((c) => R(c).top)) : 1e9;
  const cs = getComputedStyle(lay);
  return {
    vw, vh, n: cards.length, mainN: main.length, quietN: quiet.length,
    minHit: Math.min(...cards.map((c) => Math.min(R(c).width, R(c).height)), ...btn.map((b) => Math.min(b.width, b.height))),
    titleFs: fs('.layer-levelup .card:not(.quiet) .c-title'), numFs: fs('.layer-levelup .c-num'), descFs: fs('.layer-levelup .c-desc'), unitFs: fs('.layer-levelup .c-unit'), tagFs: fs('.layer-levelup .c-tag'), btnFs: fs('.lu-btn'),
    clipped, over,
    mainOneRow: main.length === 0 || (main.length < 2) || main.every((c) => Math.abs(R(c).top - R(main[0]).top) < 30 || R(c).top > 0) && rows.size <= 2,
    quietBelowMain: !quiet.length || !main.length || qt >= ml - 1,
    inside: R(lay).width > 0 && (!foot || R(foot).bottom <= vh + 1) && R(head).top >= -1 && main.every((c) => R(c).left >= -1 && R(c).right <= vw + 1),
    footBottom: foot ? Math.round(R(foot).bottom) : 0, backdrop: cs.backdropFilter || cs.webkitBackdropFilter || 'none', filter: cs.filter,
    anim: cards.length ? getComputedStyle(cards[0]).animationName : '', keys: q('.c-key').map((k) => getComputedStyle(k).display).join(','),
  };
})()`;

async function scene(tag, w, h, mobile) {
  console.log(`== ${tag} ${w}x${h}`);
  const touch = mobile ? '&touch=1' : '';
  await load(w, h, mobile, `?auto=wren&seed=1&god=1&rr=2&ban=1${touch}`);
  for (const which of ['full', 'quiet3', 'six']) {
    await ev(STAGE.replace('%WHICH%', JSON.stringify(which)));
    await sleep(900);
    const m = await ev(MEASURE);
    if (process.env.DBG) console.log(await ev(process.env.DBG));
    const t = `${tag}/${which}`;
    check(`${t}: layout`, m.n > 0 && m.inside, `cards=${m.n} footBottom=${m.footBottom}/${m.vh}`);
    check(`${t}: NO clipped badge/child (all inside its card)`, m.clipped.length === 0, JSON.stringify(m.clipped.slice(0, 3)));
    check(`${t}: no text overflow`, m.over.length === 0, JSON.stringify(m.over.slice(0, 3)));
    check(`${t}: hit targets >= 44px`, m.minHit >= 44, `min ${m.minHit.toFixed(0)}`);
    check(`${t}: text sizes (title>=18 num>=28 words>=14)`, m.titleFs >= 18 && m.numFs >= 28 && m.unitFs >= 14 && m.tagFs >= 14 && m.btnFs >= 14 && (m.descFs === 999 || m.descFs >= 14), `title ${m.titleFs} num ${m.numFs} unit ${m.unitFs} tag ${m.tagFs} desc ${m.descFs} btn ${m.btnFs}`);
    check(`${t}: quiet row below main row`, m.quietBelowMain);
    check(`${t}: no backdrop-filter / filter`, m.backdrop === 'none' && (m.filter === 'none' || m.filter === ''), m.backdrop);
    await shot(`${tag}-${which}`);
  }
  // natural (unstaged) offer from the real Sim
  await load(w, h, mobile, `?auto=wren&seed=1&god=1&rr=2&ban=1&t=240&grant=${encodeURIComponent('raven_flock;spirit_bolts;holy_orbit')}${touch}`);
  let ok = false;
  for (let i = 0; i < 400 && !ok; i++) { await sleep(250); ok = await ev("window.__app.sim.state === 'levelup' && !!document.querySelector('.layer-levelup .card')"); }
  check(`${tag}/natural: a real-run offer rendered`, ok);
  await sleep(800);
  await shot(`${tag}-natural`);
}

const only = process.env.ONLY || '';
try {
  if (!only || only === 'desk') await scene('desktop-1280x720', 1280, 720, false);
  if (!only || only === 'land') await scene('phone-land-844x390', 844, 390, true);
  if (!only || only === 'port') await scene('phone-port-390x844', 390, 844, true);
  // reduced motion: no deal-in animation
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load(1280, 720, false, '?auto=wren&seed=1&god=1&rr=2&ban=1');
  await ev(STAGE.replace('%WHICH%', JSON.stringify('full')));
  await sleep(300);
  const an = await ev("getComputedStyle(document.querySelector('.layer-levelup .card')).animationName");
  check('reduced-motion: deal-in animation is off', an === 'none', an);
  // keyboard + banish mode on the real handlers (staged offer; picks wait out the 250ms lock)
  await send('Emulation.setEmulatedMedia', { features: [] });
  await load(1280, 720, false, '?auto=wren&seed=1&god=1&rr=2&ban=1');
  await ev(STAGE.replace('%WHICH%', JSON.stringify('full')));
  await sleep(100);
  const early = await ev("(() => { const a = window.__app; const k = document.querySelector('.layer-levelup .c-key'); window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' })); return a.sim.state; })()");
  check('input lock: a pick inside 250ms is ignored', early === 'levelup', early);
  await sleep(400);
  await ev("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))");
  check('B key enters banish mode', await ev("document.querySelector('.layer-levelup').classList.contains('banishing')"));
  await shot('desktop-1280x720-banish-mode');
} finally {
  try { ws.close(); } catch { /* ignore */ }
  try { proc.kill(); } catch { /* ignore */ }
}
console.log(fails ? `${fails} FAILED` : 'ALL OK');
process.exit(fails ? 1 : 0);
