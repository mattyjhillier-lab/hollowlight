// FIX3 new-feature cards (LOCKED 2026-10-29 'PLAYTEST PICKS' pick 3): the game pauses once, the first time a new thing appears, and a full-screen
// card says what it is in plain words. Pure JS, no DOM. The 'seen' bits live in the lantern's save (save.intros, a small integer);
// unknown bits are dropped by cleanIntros. Copy is plain text; the card draws it with textContent.
export const INTRO_IDS = ['lamp', 'road', 'knot', 'blessing', 'evolution', 'shard', 'ability'];
export const INTRO_MASK = (1 << INTRO_IDS.length) - 1;
const bit = (id) => INTRO_IDS.indexOf(id);
/** Validated bits from untrusted save data: a non-negative safe integer, masked to the known ids; anything else is 0. */
export function cleanIntros(v) { return Number.isSafeInteger(v) && v >= 0 ? (v & INTRO_MASK) : 0; }
export const hasIntro = (bits, id) => bit(id) >= 0 && ((cleanIntros(bits) >>> bit(id)) & 1) === 1;
export const withIntro = (bits, id) => (bit(id) >= 0 ? (cleanIntros(bits) | (1 << bit(id))) & INTRO_MASK : cleanIntros(bits));
/** A lantern that already finished runs before cards existed knows its own ability: that card is marked seen for it. */
export const VETERAN_SEEN = ['ability'];

export const INTRO = Object.freeze({
  gotIt: 'Got it',
  hint: 'Enter',
  almanacBtn: 'How things work',
  almanacHint: 'Read the new-thing cards again',
  replay: (n, total) => `${n} of ${total}`,
});

const dflt = { abilityName: 'Your ability', key: 'Space', touch: false };
export const CARDS = Object.freeze({
  lamp: { glyph: 'lamp', title: 'Lamp Post', lines: () => ['A lamp post has woken in the dark.', 'Walk up to it to light it. It gives you gold, warmth or light.'] },
  road: { glyph: 'road', title: 'Lantern Road', lines: () => ['Three old lanterns glow in a line.', 'Walk to each one to light it. Once the first is lit, the others fade soon, so be quick.', 'Light all three for a big reward.'] },
  knot: { glyph: 'knot', title: 'Hollow Knot', lines: () => ['A knot of dark roots has woken.', 'Stay near it and let your spirits burn it out. It spits roots, so step out of its ring when it glows.', 'Burn it out for a reward.'] },
  blessing: { glyph: 'blessing', title: 'Blessings', lines: () => ['A Blessing is a quiet gift that lasts the whole night.', 'Pick one. It makes you stronger in a small way, like a wider glow or more health.'] },
  evolution: { glyph: 'evolution', title: 'Evolution', lines: () => ['A gold card means a spirit can change its nature.', 'It becomes much stronger and fights in a new way. Each spirit can change once a night.'] },
  shard: { glyph: 'shard', title: 'Soul Shard', lines: () => ['When all your spirits are fully grown, spare cards turn into gifts.', 'A soul shard is kept after the night and spent in the Lantern Web. You can only take two a night.'] },
  ability: {
    glyph: 'ability',
    title: 'Your Ability',
    lines: (c = dflt) => ['Every hero has one special move.', c.touch ? `Tap the glowing button for ${c.abilityName}.` : `Press ${c.key} for ${c.abilityName}.`, 'It needs a moment to recharge, so use it whenever you are in trouble.'],
  },
});

const clip = (s, n) => { s = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
/** Safe card model for an id; null for an unknown id. ctx: { abilityName, key, touch } (all optional, clipped). */
export function cardFor(id, ctx = {}) {
  if (typeof id !== 'string' || !Object.hasOwn(CARDS, id)) return null;
  const c = CARDS[id];
  const k = { abilityName: clip(ctx.abilityName, 28) || dflt.abilityName, key: clip(ctx.key, 12) || dflt.key, touch: ctx.touch === true };
  return { id, glyph: c.glyph, title: c.title, lines: c.lines(k) };
}

/**
 * Which cards a level-up offer calls for. offer = sim.offer ({gold, cards, start}); returns ids in teaching order.
 * Reads the offer only (never the sim's RNG).
 */
export function introsForOffer(offer) {
  const out = [];
  if (!offer || typeof offer !== 'object') return out;
  const all = [...(Array.isArray(offer.gold) ? offer.gold : []), ...(Array.isArray(offer.cards) ? offer.cards : [])];
  const start = typeof offer.start === 'string' ? offer.start : '';
  if (all.some((c) => c && c.kind === 'evolution')) out.push('evolution');
  if (start === 'blessing' || start === 'chestBless' || start === 'siteBless' || all.some((c) => c && c.kind === 'blessing')) out.push('blessing');
  if (all.some((c) => c && c.kind === 'fallback' && c.fallback === 'shard')) out.push('shard');
  return out;
}
