// CHARACTER SYSTEM v2 Characters page ("Kindred") view model + copy (CH5). Pure, no DOM; every string is later set with textContent.
// Awake heroes show Bond (level, bar to the next level), their action skill, the shared body with the Bond share, the perk ladder and the kindred
// spirit; sleeping heroes show their keepsake (found / needed) and its hint with progress. Nothing here can change the save.
import { bondDef, levelOf, xpToLevel, levelCost, bondBonus } from '../meta/bond.js';
import { conditionProgress } from '../meta/tree.js';
import { splitName } from './titlecopy.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const CHARS = {
  open: 'Characters',
  openWhisper: 'Bond, keepsakes and skills',
  title: 'Kindred',
  whisper: 'Those who walk with the spirits',
  back: 'Back',
  skill: 'Action skill',
  stats: ['Lantern', 'Stride', 'Ward', 'Spirits'],
  bondNext: (lvl, xp, need) => `Bond ${lvl} · ${xp} / ${need} to the next`,
  bondMax: (lvl) => `Bond ${lvl} · the bond is complete`,
  bondShare: (pct) => (pct > 0 ? `+${pct}% Bond` : 'Bond grows with every run'),
  perks: 'Bond gifts',
  kindred: (w) => `Kindred spirit: ${w} (a suggested start; any awake spirit works)`,
  sleeping: 'Sleeping',
  keepsake: (name, n, need) => `${name} ${n}/${need}`,
  keepWhere: 'Found in chests and from the Elder Treant once the hint is met. At most one a night.',
  hint: (text, cur, goal, done) => (done ? `${text}: done, keepsakes can be found` : `${text}: ${cur}/${goal}`),
  banked: 'Bond is banked after a night, never during it.',
};
export const PERK_TEXT = {
  pickup: (p) => `+${p}% pickup range`,
  abilityCd: (p) => `-${p}% action skill cooldown`,
  xp: (p) => `+${p}% experience`,
  heartHeal: (p) => `+${p}% heart healing`,
  gold: (p) => `+${p}% gold`,
};
const pct1 = (x) => Math.round(x * 10) / 10;

export function charsView(save, data, def) {
  const D = bondDef(data.balance);
  const K = data.balance && isObj(data.balance.keepsake) ? data.balance.keepsake : { need: 5 };
  const chars = isObj(save && save.chars) ? save.chars : {};
  const body = data.balance.body || { hp: 100, speed: 92 };
  const out = [];
  for (const [id, c] of Object.entries(data.characters)) {
    const rec = isObj(chars[id]) ? chars[id] : { xp: 0, keep: 0, woke: false };
    const n = splitName(c.name);
    const awake = rec.woke === true;
    const v = { id, name: n.name, epithet: n.epithet, awake, color: typeof c.color === 'string' ? c.color : '#e8b86d' };
    if (awake && D) {
      const xp = Number.isFinite(rec.xp) ? rec.xp : 0;
      const lvl = levelOf(D, xp);
      const into = xp - xpToLevel(D, lvl);
      const need = lvl < D.cap ? levelCost(D, lvl + 1) : 0;
      const B = bondBonus(D, lvl);
      v.bond = { lvl, cap: D.cap, into, need, frac: need ? Math.max(0, Math.min(1, into / need)) : 1, line: need ? CHARS.bondNext(lvl, into, need) : CHARS.bondMax(lvl) };
      v.stats = [
        { label: CHARS.stats[0], value: String(Math.round(body.hp * B.hpMul)), note: CHARS.bondShare(pct1((B.hpMul - 1) * 100)) },
        { label: CHARS.stats[1], value: String(Math.round(body.speed * B.speedMul)), note: CHARS.bondShare(pct1((B.speedMul - 1) * 100)) },
        { label: CHARS.stats[2], value: `${pct1(B.ward * 100)}%`, note: 'less damage taken' },
        { label: CHARS.stats[3], value: `+${pct1((B.damageMul - 1) * 100)}%`, note: 'spirit damage' },
      ];
      const names = isObj(c.bondPerks) ? c.bondPerks : {};
      v.perks = D.perks.map((p) => ({ lvl: p.lvl, name: typeof names[p.id] === 'string' ? names[p.id] : `Bond ${p.lvl}`, text: PERK_TEXT[p.effect] ? PERK_TEXT[p.effect](p.pct) : '', lit: lvl >= p.lvl }));
      v.ability = { name: c.ability ? String(c.ability.name) : '', desc: c.ability ? String(c.ability.desc) : '', cd: c.ability ? Math.floor(Number(c.ability.cooldown) || 0) : 0 };
      v.kindred = data.weapons[c.kindred] ? CHARS.kindred(data.weapons[c.kindred].name) : '';
    } else {
      const ks = isObj(c.keepsake) ? c.keepsake : null;
      const got = Math.max(0, Math.min(K.need, Math.floor(Number(rec.keep) || 0)));
      let hint = '';
      if (ks && ks.hint) { try { const p = conditionProgress(ks.hint, save.stats, def, data); const L = p.lines[0]; if (L) hint = CHARS.hint(L.text, L.cur, L.goal, p.done); } catch { hint = ''; } }
      v.keep = { name: ks ? String(ks.name) : '', desc: ks ? String(ks.desc || '') : '', n: got, need: K.need, line: ks ? CHARS.keepsake(String(ks.name), got, K.need) : CHARS.sleeping, hint };
    }
    out.push(v);
  }
  return out;
}

// Results Bond beat (CH6): celebration items for the queue (src/ui/celebrateui.js). beat = store.bankRun().bond. A woken hero is the big moment;
// a Bond level-up and a keepsake found are medium cards. Bond levels are banked after the night, never during it.
export const BOND_CEL = {
  kinds: { bond: 'Bond deepens', keepsake: 'Keepsake found', wake: 'Hollowlighter awakes' },
  level: (name, lvl) => `Bond ${lvl} with ${name}`,
  gain: (xp) => `+${xp} Bond`,
  gift: (perk, text) => `New gift: ${perk} (${text})`,
  stat: (stat, pct) => `${stat} +${pct}%`,
  keep: (name, n, need) => `${name} ${n}/${need}`,
  keepSub: (hero) => `The Hollow remembers someone. ${hero ? `${hero} stirs.` : ''}`.trim(),
  wake: (name) => `${name} wakes`,
};
const STAT_WORD = { hp: 'Lantern', ward: 'Ward', speed: 'Stride', damage: 'Spirit damage' };
export function bondCelebration(beat, data) {
  const out = [];
  if (!isObj(beat)) return out;
  const D = bondDef(data.balance);
  const nm = (id) => (id && data.characters[id] ? splitName(data.characters[id].name).name : '');
  if (beat.keepsake && beat.keepsake.woke) {
    const c = data.characters[beat.keepsake.id];
    out.push({ key: `bond:wake:${beat.keepsake.id}`, size: 'big', kind: 'wake', title: BOND_CEL.wake(nm(beat.keepsake.id)), line: c && c.keepsake ? String(c.keepsake.desc || '') : '', pills: c && c.keepsake ? [String(c.keepsake.name)] : [], color: c && c.color ? c.color : '#ffd27a', cue: 'tree_whole', sr: BOND_CEL.wake(nm(beat.keepsake.id)) });
  } else if (beat.keepsake) {
    const c = data.characters[beat.keepsake.id];
    const t = BOND_CEL.keep(c && c.keepsake ? String(c.keepsake.name) : '', beat.keepsake.count, beat.keepsake.need);
    out.push({ key: `bond:keep:${beat.keepsake.id}`, size: 'medium', kind: 'keepsake', title: t, line: '', sub: BOND_CEL.keepSub(''), color: '#c9a0ff', cue: 'keepsake', sr: `${BOND_CEL.kinds.keepsake}: ${t}` });
  }
  if (D && beat.hero && Number.isInteger(beat.to) && beat.to > beat.from) {
    const c = data.characters[beat.hero];
    const bits = [BOND_CEL.gain(beat.gain)];
    for (let L = beat.from + 1; L <= beat.to; L++) {
      const s = D.cycle[(L - 1) % D.cycle.length];
      const p = D.perks.find((q) => q.lvl === L);
      if (p) bits.push(BOND_CEL.gift(c && isObj(c.bondPerks) && typeof c.bondPerks[p.id] === 'string' ? c.bondPerks[p.id] : `Bond ${L}`, PERK_TEXT[p.effect] ? PERK_TEXT[p.effect](p.pct) : ''));
      else if (L === beat.to) { const atCap = []; for (let k = 1; k <= D.cap; k++) if (D.cycle[(k - 1) % D.cycle.length] === s) atCap.push(k); bits.push(BOND_CEL.stat(STAT_WORD[s] || s, pct1(D.total[s] / atCap.length))); }
    }
    const title = BOND_CEL.level(nm(beat.hero), beat.to);
    out.push({ key: `bond:lvl:${beat.hero}:${beat.to}`, size: 'medium', kind: 'bond', title, line: '', sub: bits.join(' · '), weapon: c && data.weapons[c.kindred] ? c.kindred : null, color: c && c.color ? c.color : '#ffd27a', cue: 'bond_level', sr: `${BOND_CEL.kinds.bond}: ${title}. ${bits.join('. ')}` });
  }
  return out;
}

// Merge Bond items into the results queue (codex cards), keeping the cap: 1 big + 3 medium. Bond items go first; a woken hero yields to a codex big
// only if one is already showing (then it is shown as a medium card instead).
export function mergeBond(cards, bond) {
  const list = Array.isArray(cards) ? cards.slice() : [];
  const bigs = list.filter((i) => i.size === 'big');
  const meds = list.filter((i) => i.size !== 'big');
  for (const b of bond) {
    if (b.size === 'big' && !bigs.length) bigs.push(b);
    else meds.unshift(b.size === 'big' ? { ...b, size: 'medium' } : b);
  }
  return [...bigs.slice(0, 1), ...meds.slice(0, 3)];
}
