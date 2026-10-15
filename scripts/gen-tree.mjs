// Generates src/data/tree.json from a compact node table (BAL env scales combat percentages). The JSON is the source of truth once edited by hand.
import { writeFileSync } from 'node:fs';
const STEP = 110, LANE_PX = 62;
const BR = {
  spirit: { name: 'Spirit', angle: 90, color: '#6fd3c5', blurb: 'Rerolls, banishes and your ability. Small verbs that change how a run feels.' },
  summoner: { name: 'Summoner', angle: 180, color: '#8a5cff', blurb: 'Wolves, ravens and the pack. More spirits, hungrier spirits.' },
  magic: { name: 'Magic', angle: 0, color: '#b8f2ff', blurb: 'Bolts, lightning and holy orbit. Sharper, wider, faster light.' },
  light: { name: 'Light', angle: 270, color: '#ffd27a', blurb: 'Health, pickups, healing and fortune. Keep your own flame burning.' },
};
const nodes = [];
const N = (id, name, branch, ring, lane, o) => nodes.push({ id, name, branch, ring, lane, ...o });
const mod = (m, pct) => ({ mod: m, pct });
const wpn = (w, stat, kind, v) => ({ weapon: w, stat, [kind]: v });
const un = (u, extra) => ({ unlock: u, ...extra });
const kill = (id, n) => ({ t: 'killEnemy', id, n });
const evo = (id, n = 1) => ({ t: 'evolveWeapon', id, n });
const CF = 'cursed_forest';

// ------------------------------------------------------------ SPIRIT (bottom)
N('sp_reroll1', 'Second Glance', 'spirit', 1, -1, { desc: 'Unlocks Reroll: +1 per run. Redraw the three level-up cards (R).', flavour: 'The spirits offer again.', gold: 300, eff: [un('rerolls', { n: 1 })] });
N('sp_ban1', 'Let It Pass', 'spirit', 1, 1, { desc: 'Unlocks Banish: +1 per run. Remove a card from the pool for the rest of the run.', flavour: 'Some paths you will not walk.', gold: 450, eff: [un('banishes', { n: 1 })] });
N('sp_reroll2', 'Third Glance', 'spirit', 2, -2, { desc: '+1 reroll per run.', gold: 900, req: ['sp_reroll1'], eff: [un('rerolls', { n: 1 })] });
N('sp_reroll3', 'Clear Sight', 'spirit', 3, -2, { desc: '+1 reroll per run.', gold: 2000, req: ['sp_reroll2'], eff: [un('rerolls', { n: 1 })] });
N('sp_ban2', 'Let It Fade', 'spirit', 2, 2, { desc: '+1 banish per run.', gold: 1100, req: ['sp_ban1'], eff: [un('banishes', { n: 1 })] });
N('sp_ban3', 'Banish the Dusk', 'spirit', 3, 2, { desc: '+1 banish per run.', gold: 2400, req: ['sp_ban2'], eff: [un('banishes', { n: 1 })] });
N('sp_cd1', 'Steady Breath', 'spirit', 2, 0, { desc: 'Ability cooldown -10% (60s to 54s).', gold: 1000, req: ['sp_reroll1', 'sp_ban1'], eff: [mod('abilityCd', -10)] });
N('sp_cd2', 'Quickening Spirit', 'spirit', 3, 0, { desc: 'Ability cooldown -10% more.', gold: 2200, req: ['sp_cd1'], eff: [mod('abilityCd', -10)] });
N('sp_cd3', 'Hollow Rhythm', 'spirit', 4, 0, { desc: 'Ability cooldown -10% more.', gold: 4500, req: ['sp_cd2'], eff: [mod('abilityCd', -10)] });
N('sp_cd4', 'Unbroken Rhythm', 'spirit', 5, 0, { desc: 'Ability cooldown -15% more. With every cooldown node the ability returns in 33s; it can never be faster than 30s.', gold: 7000, shards: 2, req: ['sp_cd3'], eff: [mod('abilityCd', -15)] });
N('sp_dur', 'Long Howl', 'spirit', 4, -2, { desc: 'Pack Howl and Candle Wheel last 25% longer.', gold: 3000, req: ['sp_cd2'], eff: [{ ability: 'dur', pct: 25 }] });
N('sp_auto', 'Last Whistle', 'spirit', 4, 2, { desc: 'Unlocks auto-activate: your ability fires by itself when health falls below 30%.', flavour: 'The spirits answer before you call.', gold: 3500, req: ['sp_cd2'], eff: [un('autoAbility', { hp: 0.3 })] });
N('sp_edge', 'Edge of Dusk', 'spirit', 5, -2, { desc: 'All your spirits and spells deal +3% damage.', gold: 5000, req: ['sp_dur'], eff: [mod('damage', 3)] });
N('sp_mastery', 'Dusk Mastery', 'spirit', 6, -2, { desc: 'All damage +3%.', flavour: 'You have walked the whole night.', gold: 9000, shards: 2, req: ['sp_edge'], eff: [mod('damage', 3)], unlock: { t: 'all', of: [{ t: 'clearChapter', id: CF }, evo('any', 5)] } });

// ------------------------------------------------------------ SUMMONER (left)
N('su_bond', 'Bound Spirits', 'summoner', 1, 0, { desc: 'Summoned spirits (wolves, ravens) deal +3% damage per rank.', flavour: 'A promise made in lantern light.', gold: 400, rc: 2, max: 2, eff: [wpn('@summon', 'power', 'pct', 3)] });
N('su_call', "Pack's Calling", 'summoner', 2, -1, { desc: 'Ghost Wolves move 10% faster.', flavour: 'The pack answers faster.', gold: 1500, req: ['su_bond'], eff: [wpn('ghost_wolves', 'speed', 'pct', 10)] });
N('su_pot', 'Lantern-Fed', 'summoner', 2, 1, { desc: 'Summons deal +3% damage.', gold: 1300, req: ['su_bond'], eff: [wpn('@summon', 'power', 'pct', 3)] });
N('su_rush', 'Rousing Light', 'summoner', 3, 0, { desc: 'New verb: each time you level up your summons surge, +25% damage for 6 seconds.', flavour: 'Every spark of growth rouses the pack.', gold: 2500, req: ['su_bond'], eff: [{ perk: 'rush', pct: 25, secs: 6 }] });
N('su_swift', 'Swift Spirits', 'summoner', 3, -1, { desc: 'Wolves and ravens move 10% faster.', gold: 1800, req: ['su_call'], eff: [wpn('@summon', 'speed', 'pct', 10)] });
N('su_key', 'Bonded Pack', 'summoner', 5, 0, { desc: 'KEYSTONE: summons deal +20% damage, but magic deals -15%. Closes Unbound Light.', flavour: 'You are never alone. You are never a mage.', gold: 6000, shards: 3, key: true, req: ['su_rush'], ex: ['ma_key'], eff: [wpn('@summon', 'power', 'pct', 20), wpn('@magic', 'power', 'pct', -15)] });
N('wf_fang', 'Fang Sharpening', 'summoner', 3, -2, { desc: 'Ghost Wolves bite for +10% damage.', gold: 1600, req: ['su_call'], eff: [wpn('ghost_wolves', 'power', 'pct', 10)] });
N('wf_bleed', 'Deep Bite', 'summoner', 4, -2, { desc: 'Ghost Wolves bleed their prey +0.5s longer.', gold: 2200, req: ['wf_fang'], eff: [wpn('ghost_wolves', 'duration', 'add', 0.5)] });
N('wf_third', "Alpha's Calling", 'summoner', 5, -2, { desc: 'Ghost Wolves bite for +10% damage and bleed 0.5s longer.', flavour: 'A thousand fallen wolves whisper your name.', gold: 5000, req: ['wf_bleed'], eff: [wpn('ghost_wolves', 'power', 'pct', 10), wpn('ghost_wolves', 'duration', 'add', 0.5)], unlock: kill('wolf', 1000) });
N('rv_talon', 'Keen Talons', 'summoner', 3, 2, { desc: 'Raven Flock pecks for +10% damage.', gold: 1600, req: ['su_pot'], eff: [wpn('raven_flock', 'power', 'pct', 10)] });
N('rv_wide', 'Wider Murder', 'summoner', 4, 2, { desc: 'Raven Flock circles +7 wider per rank.', gold: 2000, rc: 1.8, max: 2, req: ['rv_talon'], eff: [wpn('raven_flock', 'range', 'add', 7)] });
N('rv_oath', 'Black Feather Oath', 'summoner', 5, 2, { desc: 'Raven Flock pecks for +10% damage and circles 7 wider.', flavour: 'The crows now count you as kin.', gold: 5000, req: ['rv_wide'], eff: [wpn('raven_flock', 'power', 'pct', 10), wpn('raven_flock', 'range', 'add', 7)], unlock: kill('crow', 1500) });
N('ch_wren', "Orphan's Instinct", 'summoner', 4, -1, { desc: 'Ghost Wolves bite for +8% damage.', flavour: 'Wren taught the pack to hunt.', gold: 2000, req: ['su_swift'], eff: [wpn('ghost_wolves', 'power', 'pct', 8)], unlock: { t: 'useCharacter', id: 'wren', n: 3 } });
N('tz_marsh', 'Marsh-Light', 'summoner', 7, 0, { desc: 'A spirit that waits beyond this forest.', teaser: true, gold: 0, req: ['su_key'], eff: [], unlock: { t: 'clearChapter', id: 'drowned_marsh' } });

// ------------------------------------------------------------ MAGIC (right)
N('ma_focus', 'Moon-Touched', 'magic', 1, 0, { desc: 'Magic weapons (bolts, lightning, orbit) deal +3% damage per rank.', flavour: 'Moonlight settles in your palms.', gold: 400, rc: 2, max: 2, eff: [wpn('@magic', 'power', 'pct', 3)] });
N('ma_cast', 'Quickened Casting', 'magic', 2, -1, { desc: 'Spirit Bolts and Chain Lightning cast 3% faster per rank.', gold: 1400, rc: 2, max: 2, req: ['ma_focus'], eff: [mod('cooldown', -3)] });
N('ma_area', 'Widening Light', 'magic', 2, 1, { desc: 'Areas and reach +8% per rank (orbit size, raven circle, lightning jumps).', gold: 1200, rc: 2, max: 2, req: ['ma_focus'], eff: [mod('area', 8)] });
N('ma_attune', 'Attuned Hands', 'magic', 4, -1, { desc: 'New verb: cards that complete an evolution pair appear 50% more often.', flavour: 'Your spells remember what they can become.', gold: 3500, req: ['ma_focus'], eff: [{ perk: 'evoLuck', pct: 50 }] });
N('ma_pow3', 'Dusk Lightning', 'magic', 5, -1, { desc: 'Magic deals +4% damage.', gold: 7000, shards: 1, req: ['ma_attune'], eff: [wpn('@magic', 'power', 'pct', 4)] });
N('ma_key', 'Unbound Light', 'magic', 5, 0, { desc: 'KEYSTONE: magic deals +20% damage, but summons deal -15%. Closes Bonded Pack.', flavour: 'You are never a mage. You are only light.', gold: 6000, shards: 3, key: true, req: ['ma_attune'], ex: ['su_key'], eff: [wpn('@magic', 'power', 'pct', 20), wpn('@summon', 'power', 'pct', -15)] });
N('ma_ascend', 'Convergence', 'magic', 6, -1, { desc: 'Areas and reach +8%.', flavour: 'Three evolutions, one light.', gold: 6000, req: ['ma_pow3'], eff: [mod('area', 8)], unlock: evo('any', 3) });
N('bo_pierce', 'Piercing Wisp', 'magic', 3, -3, { desc: 'Spirit Bolts pierce +1 enemy.', gold: 2000, req: ['ma_cast'], eff: [wpn('spirit_bolts', 'pierce', 'add', 1)] });
N('bo_swift', 'Swift Wisps', 'magic', 4, -3, { desc: 'Spirit Bolts fly 15% faster.', gold: 1800, req: ['bo_pierce'], eff: [wpn('spirit_bolts', 'speed', 'pct', 15)] });
N('bo_twin', 'Twin Wisps', 'magic', 5, -3, { desc: 'Spirit Bolts strike for +10% damage and fly 10% faster.', flavour: 'Evolve the bolts and the wisps answer in pairs.', gold: 5000, req: ['bo_swift'], eff: [wpn('spirit_bolts', 'power', 'pct', 10), wpn('spirit_bolts', 'speed', 'pct', 10)], unlock: evo('spirit_bolts') });
N('or_power', 'Burning Orbs', 'magic', 3, 1, { desc: 'Holy Orbit burns for +10% damage.', gold: 1600, req: ['ma_area'], eff: [wpn('holy_orbit', 'power', 'pct', 10)] });
N('or_wide', 'Wider Halo', 'magic', 4, 1, { desc: 'Holy Orbit circles +6 wider per rank.', gold: 2000, rc: 1.8, max: 2, req: ['or_power'], eff: [wpn('holy_orbit', 'radius', 'add', 6)] });
N('or_seventh', 'Seventh Light', 'magic', 5, 1, { desc: 'Holy Orbit burns for +10% damage and circles 6 wider.', flavour: 'Evolve the orbit and the circle widens.', gold: 5000, req: ['or_wide'], eff: [wpn('holy_orbit', 'power', 'pct', 10), wpn('holy_orbit', 'radius', 'add', 6)], unlock: evo('holy_orbit') });
N('ch_elias', 'Votive Flame', 'magic', 4, 0, { desc: 'Holy Orbit burns for +8% damage.', flavour: 'Elias never let the candle gutter.', gold: 2000, req: ['ma_focus'], eff: [wpn('holy_orbit', 'power', 'pct', 8)], unlock: { t: 'useCharacter', id: 'elias', n: 3 } });
N('cl_arc', 'Forked Arc', 'magic', 3, 3, { desc: 'Chain Lightning jumps +1 time.', gold: 2000, req: ['ma_area'], eff: [wpn('chain_lightning', 'chains', 'add', 1)] });
N('cl_power', 'Static Heart', 'magic', 4, 3, { desc: 'Chain Lightning strikes for +12% damage.', gold: 1900, req: ['cl_arc'], eff: [wpn('chain_lightning', 'power', 'pct', 12)] });
N('cl_storm', 'Storm Mantle', 'magic', 5, 3, { desc: 'Chain Lightning reaches 10% further.', gold: 5200, shards: 1, req: ['cl_power'], eff: [wpn('chain_lightning', 'area', 'pct', 10)] });
N('tz_witch', 'Witch-Fire', 'magic', 7, 0, { desc: 'A spell that waits beyond this forest.', teaser: true, gold: 0, req: ['ma_key'], eff: [], unlock: kill('bog_witch', 200) });

// ------------------------------------------------------------ LIGHT (top)
N('li_vigor', 'Warm Embers', 'light', 1, 0, { desc: 'Maximum health +3% per rank.', flavour: 'Your lantern burns a little warmer.', gold: 400, rc: 2, max: 2, eff: [{ player: 'maxHp', pct: 3 }] });
N('li_reach', 'Reaching Light', 'light', 2, -1, { desc: 'Pickup radius +8% per rank.', gold: 1000, rc: 2, max: 2, req: ['li_vigor'], eff: [mod('pickup', 8)] });
N('li_step', 'Light Step', 'light', 2, 0, { desc: 'Move speed +3% per rank.', gold: 900, rc: 2, max: 2, req: ['li_vigor'], eff: [mod('speed', 3)] });
N('li_study', 'Bright Memory', 'light', 2, 1, { desc: 'Experience gained +6% per rank.', gold: 1400, rc: 2, max: 2, req: ['li_vigor'], eff: [mod('xp', 6)] });
N('li_scav', "Scavenger's Eye", 'light', 3, -1, { desc: 'Pickup radius +8% more.', flavour: 'Wolves and crows leave much behind.', gold: 1500, req: ['li_reach'], eff: [mod('pickup', 8)], unlock: { t: 'any', of: [kill('wolf', 500), kill('crow', 800)] } });
N('li_oak', 'Steadfast Heart', 'light', 3, -2, { desc: 'Maximum health +4%.', gold: 2000, req: ['li_vigor'], eff: [{ player: 'maxHp', pct: 4 }] });
N('li_regen', 'Growing Warmth', 'light', 3, 0, { desc: 'Every level-up heals 2% of your maximum health per rank.', flavour: 'Each spark of growth warms you.', gold: 2200, rc: 2, max: 2, req: ['li_step'], eff: [{ player: 'levelHeal', pct: 2 }] });
N('li_coin', 'Grave Coins', 'light', 3, 2, { desc: 'Gold found +8% per rank.', gold: 1500, rc: 2, max: 2, req: ['li_study'], eff: [mod('gold', 8)] });
N('li_hearts', 'Bright Hearts', 'light', 4, -1, { desc: 'Hearts drop 30% more often.', gold: 2800, req: ['li_regen'], eff: [{ drop: 'heart', pct: 30 }] });
N('li_heal', 'Mending Light', 'light', 4, -2, { desc: 'Hearts heal 25% more.', gold: 3200, req: ['li_oak'], eff: [{ drop: 'heartHeal', pct: 25 }] });
N('li_magnet', 'Pull of the Moon', 'light', 4, 1, { desc: 'Soul Magnets drop 50% more often.', gold: 2500, req: ['li_study'], eff: [{ drop: 'magnet', pct: 50 }] });
N('li_root', 'Heartwood Ward', 'light', 4, -3, { desc: 'Maximum health +4%.', flavour: 'Root-crawler bark, worn as a charm.', gold: 2500, req: ['li_oak'], eff: [{ player: 'maxHp', pct: 4 }], unlock: kill('root_crawler', 400) });
N('li_vow', 'Vigil of the Night', 'light', 4, 2, { desc: 'Gold found +8%.', flavour: 'You saw the Treant wake.', gold: 3000, req: ['li_coin'], eff: [mod('gold', 8)], unlock: { t: 'surviveTime', chapter: CF, seconds: 600 } });
N('li_hoard', 'Grave Wealth', 'light', 4, 3, { desc: 'Gold found +10%.', gold: 3500, req: ['li_coin'], eff: [mod('gold', 10)], unlock: { t: 'totalGold', n: 20000 } });
N('li_lantern', 'Lantern-Bearer', 'light', 5, -1, { desc: 'KEYSTONE: maximum health +10% and level-ups heal 2% more, but damage -4%. Closes Glass Dusk.', flavour: 'Carry the light. Let others spend it.', gold: 6000, shards: 3, key: true, req: ['li_hearts'], ex: ['li_glass'], eff: [{ player: 'maxHp', pct: 10 }, { player: 'levelHeal', pct: 2 }, mod('damage', -4)] });
N('li_last', 'Last Light', 'light', 5, 0, { desc: 'New verb: once per run, a killing blow returns you at 20% health instead.', flavour: 'The forest cannot hold you.', gold: 3000, shards: 5, req: ['li_regen'], eff: [{ player: 'revive', frac: 0.2 }], unlock: { t: 'clearChapter', id: CF } });
N('li_glass', 'Glass Dusk', 'light', 5, 1, { desc: 'KEYSTONE: damage +6%, but maximum health -15%. Closes Lantern-Bearer.', flavour: 'Burn bright. Burn short.', gold: 6000, shards: 3, key: true, req: ['li_magnet'], ex: ['li_lantern'], eff: [mod('damage', 6), { player: 'maxHp', pct: -15 }] });
N('li_elder', "Elder's Marrow", 'light', 6, 0, { desc: 'Every level-up heals 2% of your maximum health.', flavour: 'Sap from the heart of the Treant.', gold: 4000, shards: 2, req: ['li_last'], eff: [{ player: 'levelHeal', pct: 2 }], unlock: { t: 'bossKill', id: 'elder_treant' } });
N('li_dawn', 'Dawnlight', 'light', 6, 2, { desc: 'All damage +3%.', flavour: 'A light you did not know you carried.', gold: 5000, req: ['li_vow'], eff: [mod('damage', 3)], hidden: true, unlock: { t: 'bestLevel', n: 50 } });
N('tz_crown', 'Drowned Crown', 'light', 7, 0, { desc: 'A light that waits beyond this forest.', teaser: true, gold: 0, req: ['li_elder'], eff: [], unlock: { t: 'bossKill', id: 'drowned_king' } });

// ------------------------------------------------------------ emit
const out = { version: 1, layout: { ringStep: STEP, minGap: 50 }, branches: BR, nodes: [] };
for (const n of nodes) {
  if (n.max === 2 && n.eff.every((e) => e.pct !== undefined)) {
    n.max = undefined;
    n.eff = n.eff.map((e) => ({ ...e, pct: e.pct * 2 }));
    n.desc = n.desc.replace(/(\+?-?\d+(?:\.\d+)?)%/g, (m, v) => (v.startsWith('+') ? '+' : '') + (Math.abs(Number(v)) * 2 * (v.startsWith('-') ? -1 : 1)) + '%').replace(' per rank', '');
    n.gold = Math.round(n.gold * 1.6);
    n.rc = undefined;
  }
  const b = BR[n.branch];
  const laneDeg = ((n.lane * LANE_PX) / (n.ring * STEP)) * (180 / Math.PI);
  const o = { id: n.id, name: n.name, branch: n.branch, ring: n.ring, ang: Math.round((b.angle + laneDeg) * 10) / 10, desc: n.desc };
  if (n.flavour) o.flavour = n.flavour;
  if (n.max) o.maxRank = n.max;
  o.cost = n.shards ? { gold: n.gold, shards: n.shards } : { gold: n.gold };
  if (n.rc) o.rankCost = n.rc;
  if (n.req) o.requires = n.req;
  if (n.ex) o.excludes = n.ex;
  // Balance scale (measured against the bot, see docs/design/skill-tree-v1.md): combat percentages are scaled by BAL.
  const BAL = Number(process.env.BAL || 0.6);
  const scalable = (e) => (e.mod && ['damage', 'cooldown', 'area', 'speed', 'xp'].includes(e.mod)) || e.player === 'maxHp' || (e.weapon && e.pct !== undefined && e.stat !== 'count') || e.player === 'levelHeal';
  const olds = [];
  const eff = n.eff.map((e) => {
    if (!scalable(e)) return e;
    const v = Math.max(1, Math.round(Math.abs(e.pct) * BAL * 2) / 2) * Math.sign(e.pct);
    olds.push([Math.abs(e.pct), Math.abs(v)]);
    return { ...e, pct: v };
  });
  for (const [ov, nv] of olds) if (ov !== nv) o.desc = o.desc.replace(new RegExp('([+-]?)' + ov + '%'), (m, sg) => sg + nv + '%');
  n.eff = eff;
  o.effects = n.eff;
  if (n.unlock) o.unlock = n.unlock;
  if (n.hidden) o.hidden = true;
  if (n.teaser) o.teaser = true;
  if (n.key) o.keystone = true;
  out.nodes.push(o);
  o.cost.gold = o.cost.gold === 0 ? 0 : Math.max(150, Math.round(o.cost.gold * 0.3 / 10) * 10);
  if (o.rankCost) o.rankCost = Math.min(o.rankCost, 1.6);
}
const head = JSON.stringify({ version: out.version, layout: out.layout, branches: out.branches }, null, 2).slice(0, -2);
const body = out.nodes.map((n) => '    ' + JSON.stringify(n)).join(',\n');
writeFileSync(new URL('../src/data/tree.json', import.meta.url), `${head},\n  "nodes": [\n${body}\n  ]\n}\n`);
console.log(out.nodes.length, 'nodes');
