// Pause + settings copy and the small pure helpers behind them (U4). Voice: plain label + a whisper line (docs/design/ui-identity-v1.md).
// No DOM here, so it is unit-tested in Node. Every string is later set with textContent, never as markup.
import { rankPips } from './hudmath.js';
import { splitName } from './titlecopy.js';

export const PAUSE = {
  title: 'Paused',
  whispers: ['The lantern holds its breath.', 'Nothing moves until you do.', 'Take a moment. The Hollow can wait.', 'Steady your light.'],
  resume: { label: 'Resume', hint: 'Esc' },
  settings: { label: 'Settings', whisper: 'Sound, motion, saves' },
  quit: { label: 'Quit to menu', whisper: 'Back to the title; this run is lost' },
  confirm: { title: 'Leave this run?', text: 'Everything earned in this run is lost. Gold and shards from earlier runs are safe.', stay: 'Stay', leave: 'Leave run' },
  level: (n) => `Level ${n}`,
  walked: (t) => `${t} walked`,
  weaponsLabel: 'Weapons in play',
  rank: 'Rank',
  update: 'New version ready',
};

export const SET = {
  title: 'Settings',
  whisper: 'Changes save as you make them.',
  back: 'Back',
  tabs: [
    { id: 'sound', label: 'Sound' },
    { id: 'picture', label: 'Picture' },
    { id: 'controls', label: 'Controls' },
    { id: 'saves', label: 'Saves' },
  ],
  tabsLabel: 'Settings sections',
  masterVol: { label: 'Master', help: 'How loud the whole game is.' },
  muted: { label: 'Mute all', help: 'Turn every sound off. M does the same.' },
  musicVol: { label: 'Music', help: 'How loud the music is.' },
  sfxVol: { label: 'Sound effects', help: 'How loud hits, spells and pickups are.' },
  quality: { label: 'Picture quality', help: 'Lower it if the game stutters. Auto decides for you.', opts: [['auto', 'Auto'], ['low', 'Low'], ['med', 'Medium'], ['high', 'High']] },
  brightness: { label: 'Brightness', help: 'Normal starts the night dark and brightens toward dawn. Brighter lifts it. Clear keeps the night light.', opts: [['normal', 'Normal'], ['brighter', 'Brighter'], ['clear', 'Clear']] },
  screenShake: { label: 'Screen shake', help: 'Shake the view when you are hurt or something big lands.' },
  reducedMotion: { label: 'Calm motion', help: 'Fewer flashes, no eye blinks and softer movement.' },
  damageNumbers: { label: 'Damage numbers', help: 'Show a number when a hit lands.' },
  touchMode: { label: 'Touch controls', help: 'Auto shows them on touch screens.', opts: [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']] },
  stickSize: { label: 'Joystick size', help: 'Size of the thumb stick on a touch screen.', opts: [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']] },
  autoRule: { label: 'Ability fires itself', help: 'Chosen Moment: below 30% or 50% health, or when 25+ foes are near.', opts: [['hp30', '30% HP'], ['hp50', '50% HP'], ['crowd25', '25+ foes'], ['off', 'Off']] },
  tips: { label: 'Tips', help: 'Small lantern whispers the first time something happens. Tab or a tap hides one.', again: 'Show tips again', againDone: 'Tips will show again on your next run.' },
  gentleLight: { label: 'Gentle Light', help: 'Twilight only: foes hit 15% softer, move a little slower, hearts come sooner. Stars and best times rest; gold, shards and Bond are earned as normal.' },
  vibration: { label: 'Vibration', help: 'A short buzz when you are hurt, level up or evolve (phones that support it; off with Calm motion).' },
  fullscreen: { label: 'Full screen', help: 'Play without the browser around the game.', on: 'Full screen', off: 'Exit full screen' },
  keys: 'Move: WASD or arrows. Ability: Space. Pause: Esc. Pick a card: 1 to 4. Reroll: R. Mute: M.',
  keysLabel: 'Keyboard',
  export: { label: 'Export save', whisper: 'Back up to a file' },
  import: { label: 'Import save', whisper: 'Load a backup' },
  reset: { label: 'Reset save', whisper: 'Erase everything', arm: 'Really reset? Press again' },
  confirmImport: { text: 'Replace your current save with this file?', yes: 'Replace save' },
  confirmReset: { text: 'This erases all gold, shards and stats. It cannot be undone.', yes: 'Erase everything' },
  cancel: 'Cancel',
  msg: { exported: 'Save exported.', exportFail: 'Could not export the save.', tooBig: 'Save file is too large.', unreadable: 'Could not read that file.', imported: 'Save imported.', reset: 'Save reset.' },
  on: 'On', off: 'Off',
};

const pad = (n) => String(n).padStart(2, '0');
const whole = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };
/** 462 s -> "7:42". Never throws; bad input gives "0:00". */
export function fmtWalked(s) { const t = whole(s); return `${Math.floor(t / 60)}:${pad(t % 60)}`; }

/** A calm line for the pause panel; stable within a minute of play so it never flickers between pauses. */
export function pauseWhisper(time) { const L = PAUSE.whispers; return L[Math.floor(whole(time) / 60) % L.length]; }

/** Everything the pause summary shows, from the sim and data. Names come from data and are always strings. */
export function pauseView(sim, data) {
  const max = (Number(sim && sim.balance && sim.balance.maxRank) || 5) * 4;
  const weapons = ((sim && sim.weapons) || []).slice(0, 8).map((w) => {
    const evo = w.evo && data.evolutions && data.evolutions[w.evo];
    const base = data.weapons && data.weapons[w.id];
    const total = Object.values(w.ranks || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    return { id: String(w.id), name: String((evo && evo.name) || (base && base.name) || w.id), evo: !!w.evo, pips: rankPips(total, max, 5, !!w.evo) };
  });
  const ch = data.characters && data.characters[sim && sim.characterId];
  return { time: fmtWalked(sim && sim.time), level: whole(sim && sim.level) || 1, hero: splitName(ch && ch.name).name, weapons, whisper: pauseWhisper(sim && sim.time) };
}
