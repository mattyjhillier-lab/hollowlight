import Phaser from 'phaser';
import './style.css';
import './hud.css';
import { app } from './app.js';
import { UI } from './ui/ui.js';
import { RunScene } from './scenes/RunScene.js';
import { applyCssPalette } from './gfx/palette.js';
import { TouchControls } from './input/touch.js';
import { STYLE, parseDpr } from './gfx/style.js';

applyCssPalette(document.documentElement);
app.ui = new UI(document.getElementById('ui'), app.data);
app.save.load();
app.touch = new TouchControls(document.getElementById('touch'), { pause: () => app.togglePause(), autoPause: () => app.autoPause(), tapAt: (x, y) => app.ui.hudTapAt(x, y) });
app.applySettings();
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
  scale: { mode: Phaser.Scale.NONE, zoom: 1 },
  scene: [RunScene],
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
  if (app.params.auto && app.data.characters[app.params.auto]) app.startRun(app.params.auto);
  else app.showMenu();
});

// Handy for debugging and automated checks.
window.__app = app;
window.__game = game;
