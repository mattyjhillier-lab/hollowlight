import Phaser from 'phaser';
import './style.css';
import './hud.css';
import { app } from './app.js';
import { UI } from './ui/ui.js';
import './ui/fitaudit.js'; // debug aid: __fitAudit() with ?debug=1 (never runs by itself)
import { RunScene } from './scenes/RunScene.js';
import { applyCssPalette } from './gfx/palette.js';
import { TouchControls } from './input/touch.js';
import { STYLE, parseDpr } from './gfx/style.js';
import './pwa/pwa.css';
import { createPwa } from './pwa/index.js';
import { Lanterns } from './save/lanterns.js';
import { createAudio } from './audio/index.js';
import { Vibe } from './gfx/feel.js';
import { prebakeAllowed } from './gfx/prebake.js';

applyCssPalette(document.documentElement);
app.ui = new UI(document.getElementById('ui'), app.data);
app.pwa = createPwa(window);
app.ui.pwa = app.pwa;
if (import.meta.env.PROD) app.pwa.registerServiceWorker(); // never in vite dev
// FD1: one save per lantern (profile); the first boot copies the legacy single save into lantern 1.
try { app.lanterns = new Lanterns().init(); app.save = app.lanterns.openActive(); } catch { // A1: storage that misbehaves never stops the boot (memory-only session)
  app.lanterns = new Lanterns(null).init(); app.save = app.lanterns.openActive();
}
app.save.load(); // never throws (A1): a damaged save falls back to a fresh one and keeps a bounded copy
if (app.lanterns.note && !app.save.loadNote) app.save.loadNote = app.lanterns.note;
app.touch = new TouchControls(document.getElementById('touch'), { pause: () => app.togglePause(), autoPause: () => app.autoPause(), tapAt: (x, y) => app.ui.hudTapAt(x, y) });
app.audio = createAudio(window, document, { onMute: (m) => { app.save.setSettings({ muted: m }); app.applySettings(); if (app.sim && app.ui.toast) app.ui.toast(m ? 'Sound off (M)' : 'Sound on'); } });
app.ui.audio = app.audio; // AU6: tree / results sounds
// AU1: a tiny tick when the pointer moves onto a button (one per button, never on touch)
{ let last = null; document.getElementById('ui').addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; const b = e.target && e.target.closest ? e.target.closest('button') : null; if (b && b !== last && !b.disabled) app.audio.play('ui_tick'); last = b; }); }
app.applySettings();
app.vibe = new Vibe(navigator, () => app.save.data.settings, () => document.hidden); // FM5 phone buzz (guarded; Android only in practice)
app.trackInput(window); // FM1: whispers speak in the input you used last
app.ui.setHandlers({
  ...app.settingsHandlers(),
  pick: (k) => app.pick(k),
  reroll: () => app.reroll(),
  banish: (k) => app.banish(k),
  togglePause: () => app.togglePause(),
  menu: () => app.showMenu(),
  again: () => app.again(),
});

// Native-resolution rendering. Phaser 3.90 has no `resolution` option, so the canvas itself is
// stage size x min(devicePixelRatio, 2); RunScene maps the 640x360 logical world onto it with camera zoom.
document.documentElement.dataset.style = STYLE;
const stage = document.getElementById('stage');
const renderSize = () => {
  const r = stage.getBoundingClientRect();
  const d = parseDpr(window.devicePixelRatio);
  return { w: Math.max(320, Math.round(r.width * d)), h: Math.max(180, Math.round(r.height * d)) };
};
const first = renderSize();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: first.w,
  height: first.h,
  backgroundColor: '#07070d',
  pixelArt: false,
  render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
  // Raw vsync-aligned rAF deltas: Phaser's 10-frame delta smoothing made a dropped frame play as a slow-motion hiccup
  // followed by a catch-up (world speed wobble); raw deltas keep on-screen speed true to the clock (RunScene still clamps 100 ms).
  fps: { smoothStep: false },
  scale: { mode: Phaser.Scale.NONE, zoom: 1 },
  scene: [RunScene],
  audio: { noAudio: true }, // AU0: one AudioContext, ours (src/audio), made on the first gesture
});
let resizeRaf = 0;
const onResize = () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    const n = renderSize();
    if (n.w !== game.scale.width || n.h !== game.scale.height) game.scale.resize(n.w, n.h);
  });
};
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onResize).observe(stage);
window.addEventListener('resize', onResize);

window.addEventListener('pagehide', () => app.save.flush());
window.addEventListener('scene-ready', () => {
  if (app.scene && app.scene.prebake && !prebakeAllowed(new URLSearchParams(location.search).get('prebake') === '1')) app.scene.prebake = null; // crashed mid-bake last time: old lazy behaviour
  if (app.scene && app.scene.prebake && (!app.params.auto || app.params.perf)) app.scene.prebake.start(); // FIX4: bake quietly while the front door is up
  if (app.params.auto && Object.hasOwn(app.data.characters, app.params.auto)) app.startRun(app.params.auto);
  else app.showMenu();
});

// Handy for debugging and automated checks.
window.__app = app;
window.__game = game;
