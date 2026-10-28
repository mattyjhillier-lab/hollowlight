// About tab copy (Settings > About). Plain strings only: the screen renders them with textContent. Placeholders marked TODO Matt are for Matt to fill or edit.
export const ABOUT = Object.freeze({
  tab: 'About',
  blurb: 'Wispwick: Spirits of the Dusk is a small survivors-like about a lantern-bearer and the spirits who follow them. Walk the grey Hollow, let your spirits fight for you, and bring the colour back until dawn.',
  howTitle: 'How to play',
  how: Object.freeze([
    'Move with WASD or the arrow keys (or the on-screen stick). Your spirits attack on their own.',
    'Collect glowing gems to level up, then pick one of three cards.',
    'Space uses your hero\'s ability. Esc pauses. 1 to 4 pick a card, R rerolls once unlocked. (Default keys: change them in Settings > Controls.)',
    'Survive until dawn. Gold and shards you earn grow your skill tree for the next night.',
  ]),
  creditsTitle: 'Credits',
  credits: Object.freeze([
    'Game, design and direction: Matt Hillier.',
    'Engine: Phaser 3 (MIT licence).',
    'Fonts: Fondamento and Alegreya Sans (subsets), both SIL Open Font License 1.1.',
    'Art: drawn by code in this project. Sound: synthesised in the browser. No third-party sprite packs or audio files.',
  ]),
  madeBy: 'Made by Matt Hillier.',
  versionLabel: 'Version',
  feedbackLabel: 'Feedback',
  feedback: 'TODO Matt: add the feedback channel (itch.io page, email or form).',
  aiTitle: 'How AI was used',
  ai: 'Draft for Matt to edit: Wispwick was made by one developer working with an AI coding assistant (Claude). The code, game systems, art-drawing code and sound synthesis were written with its help, directed and playtested by the developer. All design decisions were made or approved by the developer. The game makes no network calls and sends no data anywhere; saves stay in your browser.',
});
