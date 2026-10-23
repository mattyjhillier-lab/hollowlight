// Results screen copy + the pure view model behind it (U6). No DOM here, so it is unit-tested in Node. Every string is later set with textContent, never as markup.
// Voice: docs/design/ui-identity-v1.md (plain label + a quiet line). Defeat is a dimmed-but-lit lantern, never "out" (LOCKED 2026-10-16).
import { splitName } from './titlecopy.js';

export const RES = {
  defeat: {
    title: 'The light dwindles',
    // Picked by how long the night lasted, so a retry never reads the same line twice in a row of short runs.
    lines: ['The Hollow was quicker this time. The lantern still burns, a little.', 'The night is long. The lantern still burns, a little. Rest, then walk again.', 'You carried the light far. It will wait for you.'],
  },
  victory: {
    title: 'Dawn',
    line: 'The sun is generous. Every grey thing wakes.',
    lineBoss: 'The sun is generous. Every grey thing wakes. The Treant sleeps at last.',
  },
  // 3-6 word hero barks at victory (BIBLE section 8). Placeholder wording until Matt writes his own; unknown heroes simply get none.
  barks: { wren: 'Still here. Still lit.', elias: 'The flame held. So did we.' },
  timeSurvived: 'Time survived',
  timeWon: 'Survived the night',
  shortOfDawn: 'short of dawn',
  fellInFight: 'Fell in the final fight',
  phases: { awakening: 'Awakening', blight: 'Blight', wrath: 'Wrath' },
  best: 'best',
  newBest: 'New best',
  slain: 'slain',
  dusk: 'Dusk',
  dawn: 'Dawn',
  arcLabel: 'Progress through the night',
  chips: { level: 'Level', slain: 'Slain', evolved: 'Evolved', none: 'none' },
  bank: { gold: 'Gold banked', shards: 'Soul shards', total: 'total', bossBonus: 'boss bonus included' },
  weaponsLabel: 'Where the damage came from',
  hurt: {
    label: 'What hurt you',
    struck: 'Struck down by',
    at: 'at',
    // possessive tails by hit kind: "a Fell Wolf's lunge". contact has no tail (just the name).
    kinds: { lunge: "'s lunge", charge: "'s charge", slam: "'s slam", burst: "'s burst", thorn: "'s thorn", ember: "'s Emberwake ring" },
    // boss moves (Elder Treant, boss-treant-v1 (f)): named moves; the time is fight time ('1:21 into the fight') because the clock holds at 14:00
    bossKinds: { slam: "'s Bark Slam,", roots: "'s Root Eruption,", sweep: "'s Vine Sweep,", thorn: "'s Thorn Volley,", nova: "'s Ring of Thorns,", lanes: "'s Root Lanes,", contact: ',' },
    intoFight: 'into the fight',
    bossAt: '{name} was at {pct}% ({phase})',
    lungeMost: 'Most of the {name} hits were lunges',
    lungeHalf: 'About half of the {name} hits were lunges',
  },
  nudge: { closest: 'Closest unlock' },
  debug: 'Debug run: not saved.',
  again: { label: 'Again', hint: 'R' },
  menu: { label: 'Main menu', hint: 'Esc' },
  tree: { label: 'Tree', hint: 'T', newSr: 'something new to unlock' },
  region: 'Run results',
  // FD5 (front-door-v1 3A): the night badge, Dawnglass tile, first-dawn line, stars and the kept line
  night: {
    firstDawn: 'first dawn',
    glass: 'Dawnglass',
    firstLine: (hero, night) => `First dawn with ${hero} on ${night}.`,
    waiting: (names, n) => `${names} ${names.includes(' and ') ? 'have' : 'has'} not seen it yet (+${n} waiting).`,
    goldMul: (mul, night) => `x${mul} ${night}`,
    firstShard: (n) => `+${n} first dawn`,
    boss: 'boss',
    stars: ['Cleared', 'Both heroes', 'Bright Dawn'],
    starsLabel: 'Night stars',
    kept: 'What you earned before the fall is always kept.',
    again: (night) => `Again · ${night}`,
  },
};

const fin = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const whole = (v) => Math.max(0, Math.floor(fin(v)));
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

/** 462 -> "7:42". Never throws; bad input gives "0:00". */
export function clock(s) { const t = whole(s); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }

/** 1840 -> "1,840" (locale independent). */
export function group(n) { return String(whole(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/** Fixed pick of the defeat line by how long the run lasted. */
export function defeatLine(time) {
  const t = whole(time);
  return RES.defeat.lines[t < 180 ? 0 : t < 600 ? 1 : 2];
}

const KIND_IDS = ['contact', 'lunge', 'charge', 'slam', 'burst', 'thorn', 'ember'];
const BOSS_KINDS = ['contact', 'slam', 'roots', 'sweep', 'thorn', 'nova', 'lanes'];
const article = (name) => (/^[aeiou]/i.test(name) ? 'an' : 'a');

/** DR4 recap: who struck you down + the top sources of damage taken. r.hurt comes from the sim's counters (ids only); names come from data, never from the run. */
export function hurtRecap(r, data, won) {
  const h = r && r.hurt && typeof r.hurt === 'object' ? r.hurt : null;
  const out = { struck: null, rows: [], note: '', boss: '' };
  if (!h) return out;
  const nameOf = (id) => (data && data.enemies && typeof id === 'string' && Object.hasOwn(data.enemies, id) ? clip(data.enemies[id].name, 40) : '');
  if (!won && h.last && typeof h.last === 'object') {
    const nm = nameOf(h.last.src);
    const F = r.fight && typeof r.fight === 'object' ? r.fight : null;
    const isBoss = !!(nm && F && data.enemies[h.last.src] && data.enemies[h.last.src].boss);
    if (nm && isBoss) { // 'Struck down by the Elder Treant's Vine Sweep, 1:21 into the fight'
      const kind = BOSS_KINDS.includes(h.last.kind) ? h.last.kind : 'contact';
      out.struck = { lead: RES.hurt.struck, art: 'the', name: nm, tail: RES.hurt.bossKinds[kind], at: `${clock(fin(h.last.t) - fin(F.start))} ${RES.hurt.intoFight}`, src: clip(h.last.src, 40) };
    } else if (nm) {
      const kind = KIND_IDS.includes(h.last.kind) ? h.last.kind : 'contact';
      out.struck = { lead: RES.hurt.struck, art: article(nm), name: nm, tail: RES.hurt.kinds[kind] || '', at: `${RES.hurt.at} ${clock(h.last.t)}`, src: clip(h.last.src, 40) };
    }
  }
  // progress = hope: how close the boss was (only when it was hit at all)
  const Fb = r.fight && typeof r.fight === 'object' ? r.fight : null;
  const bid = data && data.chapters && Object.hasOwn(data.chapters, r.chapter) ? data.chapters[r.chapter].bossId : null;
  if (!won && Fb && fin(Fb.hpFrac) < 1 && nameOf(bid)) {
    const pct = Math.max(1, Math.min(99, Math.ceil(100 * fin(Fb.hpFrac))));
    const ph = typeof Fb.phaseId === 'string' && Object.hasOwn(RES.phases, Fb.phaseId) ? RES.phases[Fb.phaseId] : '';
    out.boss = RES.hurt.bossAt.replace('{name}', `The ${nameOf(bid)}`).replace('{pct}', String(pct)).replace(' ({phase})', ph ? ` (${ph})` : '');
  }
  const by = h.by && typeof h.by === 'object' ? h.by : {};
  const ids = Object.keys(by).filter((k) => nameOf(k) && whole(by[k]) > 0);
  const total = ids.reduce((a, k) => a + whole(by[k]), 0);
  if (total > 0) {
    ids.sort((a, b) => whole(by[b]) - whole(by[a]) || (a < b ? -1 : 1));
    out.rows = ids.slice(0, 3).map((k) => ({ id: clip(k, 40), name: nameOf(k), pct: Math.max(1, Math.min(100, Math.round((100 * whole(by[k])) / total))) }));
    const wh = h.hits && typeof h.hits === 'object' ? whole(h.hits.wolf) : 0, lg = whole(h.lunge);
    if (wh >= 4 && lg > 0 && nameOf('wolf')) { const s = lg / wh; const tpl = s >= 0.6 ? RES.hurt.lungeMost : s >= 0.35 ? RES.hurt.lungeHalf : ''; out.note = tpl.replace('{name}', nameOf('wolf')); }
  }
  return out;
}

/** Top-3 weapons by damage share. Shares are of the damage the weapons themselves dealt; a weapon that did none shows 0%. */
export function weaponShares(weapons, data, max = 3) {
  const list = (Array.isArray(weapons) ? weapons : []).filter((w) => w && typeof w.id === 'string');
  const total = list.reduce((a, w) => a + whole(w.damage), 0);
  if (!list.length) return [];
  const rows = list.map((w, i) => {
    const evo = w.evo && data.evolutions && Object.hasOwn(data.evolutions, w.evo) ? data.evolutions[w.evo] : null;
    const base = data.weapons && Object.hasOwn(data.weapons, w.id) ? data.weapons[w.id] : null;
    const dmg = whole(w.damage);
    return { id: clip(w.id, 40), name: clip((evo && evo.name) || (base && base.name) || w.id, 40), evo: !!evo, dmg, i };
  });
  rows.sort((a, b) => b.dmg - a.dmg || a.i - b.i);
  return rows.slice(0, max).map((r) => ({ id: r.id, name: r.name, evo: r.evo, pct: total > 0 ? Math.min(100, Math.round((100 * r.dmg) / total)) : 0 }));
}

/**
 * Everything the results screen shows. r = sim.result(); bank = the app's bankRun summary or null (debug run);
 * data = game data. All names are real data (weapon, evolution, boss, hero, tree node) clipped and coerced to strings.
 */
export function resultsView(r, bank, data) {
  r = r || {};
  data = data || {};
  const won = r.outcome === 'victory';
  const chap = (data.chapters && Object.hasOwn(data.chapters, r.chapter) && data.chapters[r.chapter]) || null;
  const chapIds = Object.keys(data.chapters || {});
  const night = Math.max(1, chapIds.indexOf(r.chapter) + 1);
  const hero = (data.characters && Object.hasOwn(data.characters, r.character) && splitName(data.characters[r.character].name).name) || '';
  const dawnAt = Math.max(1, fin(data.balance && data.balance.runSeconds) || 900);
  const bossAt = fin(chap && chap.bossAt);
  const bossId = chap && chap.bossId;
  const bossName = clip((bossId && data.enemies && Object.hasOwn(data.enemies, bossId) && data.enemies[bossId].name) || 'the boss', 40);
  const time = Math.max(0, fin(r.time));
  const evoNames = (Array.isArray(r.weapons) ? r.weapons : []).filter((w) => w && w.evo && data.evolutions && Object.hasOwn(data.evolutions, w.evo)).map((w) => clip(data.evolutions[w.evo].name, 40));

  const near = [];
  const seg = (t, b) => near.push({ t, b: !!b });
  if (won) {
    if (bank && bank.newBest) { seg(RES.newBest, true); seg(' · '); } 
    if (r.bossKilled) { seg(bossName, true); seg(` ${RES.slain}`); } else seg(RES.timeWon);
    if (bank && !bank.newBest) { seg(` · ${RES.best} `); seg(clock(bank.bestTime), true); }
  } else if (r.fight && typeof r.fight === 'object') {
    seg(RES.fellInFight, true); // the clock held at 14:00: 'short of dawn' would always read 1:00
  } else {
    seg(clock(dawnAt - Math.min(time, fin(r.clock) || time)), true); seg(` ${RES.shortOfDawn}`);
    if (bank) { if (bank.newBest) { seg(' · '); seg(RES.newBest.toLowerCase(), true); } else { seg(` · ${RES.best} `); seg(clock(bank.bestTime), true); } }
  }

  const newly = bank && Array.isArray(bank.newly) ? bank.newly.filter((s) => typeof s === 'string' && s) : [];
  const closest = bank && Array.isArray(bank.closest) ? bank.closest.filter((c) => c && typeof c.name === 'string') : [];
  let nudge = null;
  if (newly.length) nudge = { kind: 'new', text: clip(newly[0].replace(/^NEW:\s*/, ''), 110), more: newly.length - 1 };
  else if (closest.length) {
    const c = closest[0];
    nudge = { kind: 'closest', gate: !!c.gate, name: clip(c.name, 40), text: clip(c.text, 80), frac: Math.max(0, Math.min(1, fin(c.frac))) };
  }

  return {
    won, debug: !bank,
    kicker: [`Night ${night}`, chap ? clip(chap.name, 40) : '', hero ? clip(hero, 30) : ''].filter(Boolean).join(' · '),
    title: won ? RES.victory.title : RES.defeat.title,
    line: won ? (r.bossKilled ? RES.victory.lineBoss : RES.victory.line) : defeatLine(time),
    bark: won && hero && Object.hasOwn(RES.barks, r.character) ? RES.barks[r.character] : '',
    heroName: clip(hero, 30),
    time: clock(time), timeLabel: won ? RES.timeWon : RES.timeSurvived,
    near,
    arc: { frac: won ? 1 : Math.max(0, Math.min(1, (r.clock != null ? fin(r.clock) : time) / dawnAt)), boss: bossAt > 0 ? Math.min(1, bossAt / dawnAt) : null, bossLabel: `${bossName} ${clock(bossAt)}`, dawnLabel: `${RES.dawn} ${clock(dawnAt)}` },
    chips: { level: whole(r.level) || 1, slain: whole(r.kills), evolved: evoNames.length ? evoNames.length : 0, evolvedNames: evoNames.join(', ') },
    bank: bank ? {
      gold: bank.runGold != null ? whole(bank.runGold) : whole(r.gold), goldTotal: whole(bank.gold), shards: whole(r.shards) + (won && bank.tier && bank.tier.firstDawn ? whole(bank.tier.shards) : 0), shardsTotal: whole(bank.shards), glassTotal: whole(bank.dawnglass), bossBonus: !!r.bossKilled, // runGold includes the tier gold bonus
      note: typeof bank.note === 'string' ? clip(bank.note, 140) : '',
    } : { gold: whole(r.gold), shards: whole(r.shards) },
    weapons: weaponShares(r.weapons, data),
    recap: hurtRecap(r, data, won),
    nudge,
    treeDot: newly.length > 0,
    night: nightBlock(r, bank, hero, won),
  };
}

/** FD5: the night's badge, Dawnglass tile, first-dawn line, stars, kept line and Again label. Only for banked runs (bank.night from the app);
 *  everything is clamped / whitelisted. Twilight: badge only (layout as before, plus the night name on Again once there is a night choice). */
export function nightBlock(r, bank, hero, won) {
  const n = bank && bank.night && typeof bank.night === 'object' ? bank.night : null;
  if (!n) return null;
  const id = ['normal', 'hard', 'expert'].includes(n.id) ? n.id : 'normal';
  const name = clip(n.name || 'Twilight', 24);
  const t = bank.tier && typeof bank.tier === 'object' ? bank.tier : {};
  const harder = id !== 'normal';
  const first = !!(won && t.firstDawn);
  const glass = whole(t.glass);
  const waiting = Array.isArray(n.waiting) ? n.waiting.filter((x) => typeof x === 'string' && x && x !== hero).map((x) => clip(x, 24)).slice(0, 3) : [];
  const names = waiting.length > 1 ? `${waiting.slice(0, -1).join(', ')} and ${waiting[waiting.length - 1]}` : waiting[0] || '';
  const bits = whole(t.stars) & 7;
  const mul = Math.round(fin(n.goldMul) * 100) / 100;
  return {
    id, name, harder,
    badge: first ? `${name} · ${RES.night.firstDawn}` : name,
    goldLine: harder && whole(t.goldBonus) > 0 && mul > 1 ? RES.night.goldMul(mul, name) : '',
    shardsExtra: first ? whole(t.shards) : 0,
    glass: harder ? { n: glass, sub: glassSub(t, glass, first) } : null,
    firstLine: first && hero ? `${RES.night.firstLine(clip(hero, 24), name)}${names && whole(n.firstGlass) ? ` ${RES.night.waiting(names, whole(n.firstGlass))}` : ''}` : '',
    stars: won && harder ? RES.night.stars.map((label, i) => ({ label, on: !!(bits & (1 << i)) })) : null,
    kept: !won && harder ? RES.night.kept : '',
    again: harder || n.choice === true ? RES.night.again(name) : '',
  };
}

// Dawnglass breakdown under the tile: '2 + 6 first dawn' when both were paid, 'first dawn' when only the bounty was (sheet 7.2).
function glassSub(t, glass, first) {
  if (!(glass > 0) || !first) return '';
  const run = Math.min(glass, whole(t.glassRun));
  return run > 0 && glass - run > 0 ? `${group(run)} + ${group(glass - run)} ${RES.night.firstDawn}` : RES.night.firstDawn;
}

/** Screen-reader sentence for the whole summary (the visual count-up never reaches assistive tech). */
export function resultsSummary(v) {
  const b = v.bank;
  const st = v.recap && v.recap.struck;
  const parts = [v.title, st ? `${st.lead} ${st.art} ${st.name}${st.tail} ${st.at}` : '', `${v.timeLabel} ${v.time}`, v.near.map((s) => s.t).join('').trim(), `Level ${v.chips.level}`, `${v.chips.slain} slain`];
  parts.push(`${group(b.gold)} gold${b.goldTotal != null ? ` banked, total ${group(b.goldTotal)}` : ''}`, `${group(b.shards)} soul shards${b.shardsTotal != null ? `, total ${group(b.shardsTotal)}` : ''}`);
  const nb = v.night;
  if (nb) {
    parts.splice(1, 0, nb.badge);
    if (nb.glass) parts.push(`${group(nb.glass.n)} ${RES.night.glass}${b.glassTotal != null ? `, total ${group(b.glassTotal)}` : ''}`);
    if (nb.firstLine) parts.push(nb.firstLine);
    if (nb.stars) parts.push(`${RES.night.starsLabel}: ${nb.stars.filter((x) => x.on).map((x) => x.label).join(', ') || 'none'}`);
    if (nb.kept) parts.push(nb.kept);
  }
  return parts.filter(Boolean).join('. ') + '.';
}

/** Count-up value at progress k (0..1), eased out. Always an integer; k >= 1 gives exactly the target. */
export function countAt(target, k) {
  const t = whole(target);
  if (!(k < 1)) return t;
  if (!(k > 0)) return 0;
  return Math.min(t, Math.round(t * (1 - (1 - k) ** 3)));
}
