import Phaser from 'phaser';
import './style.css';
import { app } from './app.js';
import { UI } from './ui/ui.js';
import { RunScene } from './scenes/RunScene.js';

app.ui = new UI(document.getElementById('ui'), app.data);
app.ui.setHandlers({
  pick: (k) => app.pick(k),
  reroll: () => app.reroll(),
  banish: (k) => app.banish(k),
  togglePause: () => app.togglePause(),
  menu: () => app.showMenu(),
  again: () => app.again(),
});

const { view } = app.data.balance;
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: view.w,
  height: view.h,
  backgroundColor: '#0b0f0c',
  pixelArt: true,
  render: { antialias: false, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [RunScene],
});

window.addEventListener('scene-ready', () => {
  if (app.params.auto && app.data.characters[app.params.auto]) app.startRun(app.params.auto);
  else app.showMenu();
});

// Handy for debugging and automated checks.
window.__app = app;
window.__game = game;
