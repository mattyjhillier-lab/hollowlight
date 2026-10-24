// Title + hero-select copy and the small pure helpers behind them (U3). Voice: plain label + a whisper line (docs/design/ui-identity-v1.md).
// No DOM here, so it is unit-tested in Node. Every string is later set with textContent, never as markup.
export const TITLE = {
  kicker: 'Chapter 1 · The Cursed Forest',
  tagline: 'Spirits of the Dusk',
  begin: { label: 'Begin', whisper: 'Pick a hero and walk the Hollow' },
  continue: { label: 'Continue', whisper: 'Pick a hero and walk back in' },
  tree: { label: 'Skill Tree', whisper: 'Spend what you carried home', firstRun: 'New spirits wake as you play' },
  settings: { label: 'Settings', whisper: 'Sound, motion, saves' },
  hint: 'More weapons and evolutions unlock as you play: slay different enemies and try different heroes.',
  orient: 'Landscape recommended',
};

export const HERO = {
  kicker: 'Chapter 1 · Cursed Forest',
  title: 'Who carries the lantern?',
  whisper: 'Hold the light till 14:00. Then the Elder Treant wakes.',
  back: 'Back',
  chosen: 'Chosen',
  ready: 'Ready',
  health: 'Health',
  speed: 'Speed',
  walk: (name) => `Walk with ${name}`,
  keys: 'to move · weapons fire on their own · Space ability · Esc pause · 1-4 pick cards',
  touch: 'Left thumb: move · weapons fire on their own · right button: ability · II: pause · tap cards to pick',
};

// One whisper line per launch hero (what they are like to play). Unknown future heroes fall back to the data blurb.
export const HERO_LINES = {
  // CHARACTER SYSTEM v2: same body for all; the line + gift speak of the ability (the one thing that differs) and the look
  wren: { line: 'Quick and forward, a ghost pup at her heels.', gift: 'Darts out of trouble' },
  elias: { line: 'Still and tall, a lamplighter who stands his ground.', gift: 'Shelters in candlelight' },
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const num = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0; };

/** Primary button copy: Begin on a fresh save, Continue once the player has run at least once or owns anything. */
export function primaryCopy(hasProgress) { return hasProgress ? TITLE.continue : TITLE.begin; }

/** Whisper under Skill Tree: first run hints that things unlock; later it names what the player can spend. */
export function treeWhisper(bank, firstRun) {
  const gold = num(bank && bank.gold);
  const shards = num(bank && bank.shards);
  if (gold || shards) return `${[gold && plural(gold, 'gold', 'gold'), shards && plural(shards, 'soul shard', 'soul shards')].filter(Boolean).join(' · ')} to spend`;
  return firstRun ? TITLE.tree.firstRun : TITLE.tree.whisper;
}

/** "Wren, the Orphan" -> { name: 'Wren', epithet: 'the Orphan' }. Never throws; non-strings give a safe fallback. */
export function splitName(full) {
  const s = typeof full === 'string' ? full.slice(0, 80) : '';
  const i = s.indexOf(', ');
  return i > 0 ? { name: s.slice(0, i), epithet: s.slice(i + 2) } : { name: s || 'Hero', epithet: '' };
}

const clampPips = (v) => Math.max(1, Math.min(5, Math.round(v)));
/** Health 60..130+ -> 2..5 pips (150 clamps to 5); speed 76..96 -> 2..5 pips (fixed scales so a future hero lands on the same ruler). */
export function heroPips(c) {
  // CHARACTER SYSTEM v2: every hero has the same body (balance.body 100 HP / 92 speed), so a row without hp/speed reads as that body
  const hp = Number(c && c.hp) || 100, sp = Number(c && c.speed) || 92;
  return { health: clampPips(hp / 26), speed: clampPips((sp - 60) / 7.5) };
}

/** Everything a hero card shows, from the data row; strings only. */
export function heroView(id, c, weaponName) {
  const n = splitName(c && c.name);
  const copy = HERO_LINES[id] || null;
  const trait = typeof (c && c.traitText) === 'string' ? c.traitText : '';
  const cd = c && c.ability && Number(c.ability.cooldown) > 0 ? ` · ${Math.floor(Number(c.ability.cooldown))}s` : '';
  return {
    id, name: n.name, epithet: n.epithet,
    line: copy ? copy.line : (c && typeof c.blurb === 'string' ? c.blurb : ''),
    gift: trait ? (copy ? `${copy.gift}: ${trait}` : trait) : copy ? copy.gift : '',
    weapon: typeof weaponName === 'string' ? weaponName : '',
    ability: c && c.ability && typeof c.ability.name === 'string' ? `${c.ability.name}${cd}` : '',
    pips: heroPips(c),
  };
}
