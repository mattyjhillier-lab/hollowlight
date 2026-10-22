// Difficulty tiers (DT0/DT1 data plumbing; docs/design/difficulty-tiers-economy-v1.md). Pure JS, no DOM.
// A tier is a DATA block per chapter (src/data/tiers.json: a template every chapter inherits + optional per-chapter overrides).
// The sim only reads the multipliers resolved here; an unknown / forged tier id ALWAYS resolves to Twilight ('normal', every multiplier 1),
// so a URL param or a save value can never reach another code path. Tier display names are provisional (Twilight / Deep Dusk / Long Night).

// The registry of tier ids. A 4th tier = one id here + one block in tiers.json (tests fail if the two disagree).
export const TIER_IDS = Object.freeze(['normal', 'hard', 'expert']);
// Hollow-mark kinds a tier may list (the marks themselves are built in DT2; here they are names only, so a typo fails validation).
export const MARK_IDS = Object.freeze(['ironbark', 'swiftshade', 'emberwake', 'hollowheart']);

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ID_RE = /^[a-z][a-z0-9_]{0,31}$/;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fin = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const own = (o, k) => Object.hasOwn(o, k);

// Multiplier knobs (all within [1, 4]; Twilight is exactly 1) and their identity values.
const MULS = ['enemyHp', 'enemyDmg', 'density', 'bossHp', 'heartPity'];
export const IDENTITY = Object.freeze({
  id: 'normal', idx: 0, name: 'Twilight', enemyHp: 1, enemyDmg: 1, density: 1, bossHp: 1, heartPity: 1,
  goldMul: 1, shards: 5, glass: Object.freeze({ boss: 0, dawn: 0, first: 0, marked: 0, markedCap: 0, runCap: 0 }), firstShards: 0,
  marks: Object.freeze({ share: 0, from: 0, max: 1, kinds: Object.freeze([]) }),
  // EN6-EN8 miniboss / chest tier knobs (difficulty-tiers-economy-v1 tables): +N howl wolves per howl, extra Branch-Mane times (s), Large chest odds +pts
  miniHowl: 0, miniExtra: Object.freeze([]), chestLarge: 0,
});

function checkBlock(b, where) {
  if (!isObj(b)) throw new Error(`tiers: ${where} must be an object`);
  for (const k of MULS) if (b[k] !== undefined && !fin(b[k], 1, 4)) throw new Error(`tiers: ${where}.${k} must be 1..4`);
  if (b.name !== undefined && !(typeof b.name === 'string' && /^[A-Za-z' -]{1,24}$/.test(b.name))) throw new Error(`tiers: ${where}.name`);
  if (b.goldMul !== undefined && !fin(b.goldMul, 1, 5)) throw new Error(`tiers: ${where}.goldMul`);
  if (b.shards !== undefined && !(Number.isInteger(b.shards) && b.shards >= 0 && b.shards <= 50)) throw new Error(`tiers: ${where}.shards`);
  if (b.firstShards !== undefined && !(Number.isInteger(b.firstShards) && b.firstShards >= 0 && b.firstShards <= 10)) throw new Error(`tiers: ${where}.firstShards`);
  if (b.glass !== undefined) {
    if (!isObj(b.glass)) throw new Error(`tiers: ${where}.glass`);
    for (const [k, v] of Object.entries(b.glass)) if (!own(IDENTITY.glass, k) || !(Number.isInteger(v) && v >= 0 && v <= 100)) throw new Error(`tiers: ${where}.glass.${k}`);
  }
  if (b.miniHowl !== undefined && !(Number.isInteger(b.miniHowl) && b.miniHowl >= 0 && b.miniHowl <= 3)) throw new Error(`tiers: ${where}.miniHowl must be 0..3`);
  if (b.chestLarge !== undefined && !(Number.isInteger(b.chestLarge) && b.chestLarge >= 0 && b.chestLarge <= 30)) throw new Error(`tiers: ${where}.chestLarge must be 0..30`);
  if (b.miniExtra !== undefined && !(Array.isArray(b.miniExtra) && b.miniExtra.length <= 2 && b.miniExtra.every((t) => fin(t, 30, 1200)))) throw new Error(`tiers: ${where}.miniExtra must be up to 2 times in 30..1200 s`);
  if (b.marks !== undefined) {
    const m = b.marks;
    if (!isObj(m)) throw new Error(`tiers: ${where}.marks`);
    for (const k of Object.keys(m)) if (!own(IDENTITY.marks, k)) throw new Error(`tiers: ${where}.marks.${k} is not a known field`);
    if (m.share !== undefined && !fin(m.share, 0, 0.3)) throw new Error(`tiers: ${where}.marks.share must be 0..0.3`);
    if (m.from !== undefined && !fin(m.from, 0, 1200)) throw new Error(`tiers: ${where}.marks.from must be 0..1200 s`);
    if (m.max !== undefined && !(Number.isInteger(m.max) && m.max >= 1 && m.max <= 3)) throw new Error(`tiers: ${where}.marks.max`);
    if (m.kinds !== undefined && !(Array.isArray(m.kinds) && m.kinds.length <= 8 && m.kinds.every((k) => MARK_IDS.includes(k)))) throw new Error(`tiers: ${where}.marks.kinds must be registered mark ids`);
  }
}

// Validates tiers.json and returns { order, template, chapters } (throws a readable error on bad data; the game then refuses to boot the data).
export function validateTiers(raw) {
  if (!isObj(raw) || !isObj(raw.template)) throw new Error('tiers: missing template');
  if (JSON.stringify(Object.keys(raw.template)) !== JSON.stringify(TIER_IDS)) throw new Error(`tiers: template must define exactly ${TIER_IDS.join(', ')} in order`);
  if (!Array.isArray(raw.order) || JSON.stringify(raw.order) !== JSON.stringify(TIER_IDS)) throw new Error('tiers: order must equal the registered tier ids');
  for (const id of TIER_IDS) checkBlock(raw.template[id], `template.${id}`);
  const n = raw.template.normal;
  for (const k of MULS) if (n[k] !== undefined && n[k] !== 1) throw new Error(`tiers: Twilight (normal) ${k} must be exactly 1`);
  if (n.goldMul !== undefined && n.goldMul !== 1) throw new Error('tiers: Twilight goldMul must be 1');
  if (n.marks && n.marks.share) throw new Error('tiers: Twilight has no marks');
  if (n.glass && Object.values(n.glass).some((v) => v !== 0)) throw new Error('tiers: Twilight pays no Dawnglass');
  if (n.miniHowl || n.chestLarge || (n.miniExtra && n.miniExtra.length)) throw new Error('tiers: Twilight keeps the locked miniboss and chest');
  // each harder tier is at least as hard as the one below it (a data typo cannot make Long Night easier than Deep Dusk)
  for (let i = 1; i < TIER_IDS.length; i++) for (const k of MULS) if ((raw.template[TIER_IDS[i]][k] ?? 1) < (raw.template[TIER_IDS[i - 1]][k] ?? 1)) throw new Error(`tiers: ${TIER_IDS[i]}.${k} is below the tier under it`);
  const chapters = isObj(raw.chapters) ? raw.chapters : {};
  if (Object.keys(chapters).length > 32) throw new Error('tiers: too many chapters');
  for (const [cid, c] of Object.entries(chapters)) {
    if (!ID_RE.test(cid) || BAD_KEYS.has(cid) || !isObj(c)) throw new Error(`tiers: bad chapter key ${cid}`);
    for (const [tid, b] of Object.entries(c)) {
      if (!TIER_IDS.includes(tid)) throw new Error(`tiers: chapter ${cid} has unknown tier ${tid}`);
      checkBlock(b, `chapters.${cid}.${tid}`);
      if (tid === 'normal') for (const k of MULS) if (b[k] !== undefined && b[k] !== 1) throw new Error(`tiers: chapter ${cid} Twilight ${k} must be 1`);
    }
  }
  return raw;
}

// -> the resolved tier for a run. Anything unknown (null data, bad chapter, forged id, prototype keys) resolves to Twilight.
export function resolveTier(tiers, chapterId, tierId) {
  if (!isObj(tiers) || !isObj(tiers.template) || typeof tierId !== 'string' || !TIER_IDS.includes(tierId)) return IDENTITY;
  const base = tiers.template[tierId];
  const over = isObj(tiers.chapters) && typeof chapterId === 'string' && own(tiers.chapters, chapterId) && isObj(tiers.chapters[chapterId]) && own(tiers.chapters[chapterId], tierId) ? tiers.chapters[chapterId][tierId] : null;
  const t = { ...IDENTITY, ...base, ...(over || {}) };
  t.id = tierId;
  t.idx = TIER_IDS.indexOf(tierId);
  t.glass = { ...IDENTITY.glass, ...(base.glass || {}), ...((over && over.glass) || {}) };
  t.marks = { ...IDENTITY.marks, ...(base.marks || {}), ...((over && over.marks) || {}) };
  for (const k of MULS) t[k] = fin(t[k], 1, 4) ? t[k] : 1;
  t.miniExtra = Object.freeze(Array.isArray(t.miniExtra) ? t.miniExtra.filter((v) => fin(v, 30, 1200)).slice(0, 2) : []);
  if (!(Number.isInteger(t.miniHowl) && t.miniHowl >= 0 && t.miniHowl <= 3)) t.miniHowl = 0;
  if (!(Number.isInteger(t.chestLarge) && t.chestLarge >= 0 && t.chestLarge <= 30)) t.chestLarge = 0;
  return Object.freeze(t);
}

// Tier index (0 = Twilight) for aggregateMods' tier scope.
export const tierIndex = (tierId) => { const i = TIER_IDS.indexOf(tierId); return i < 0 ? 0 : i; };
