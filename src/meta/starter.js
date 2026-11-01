// CHARACTER SYSTEM v2 (LOCKED 2026-10-24): a NEW profile picks one hero + one weapon as its starter set; everything else starts locked
// (heroes wake with keepsakes, weapons with their tree heart). The starter weapon's grant = its heart (the weapon unlock) + the gate of its
// first evolution socket (if gated), so every starting weapon begins with exactly one evolution, as Wolves and Orbit always did.
// Pure; `info` = composeTree(...).info (clusters with heart + sockets), `def` = compileTree(...).
const own = (o, k) => o !== null && typeof o === 'object' && Object.hasOwn(o, k);

export function starterNodes(info, weaponId) {
  const c = info && own(info.clusters, weaponId) ? info.clusters[weaponId] : null;
  if (!c) return [];
  const out = [];
  if (typeof c.heart === 'string') out.push(c.heart);
  const a = c.sockets && c.sockets.a;
  if (a && typeof a.gate === 'string') out.push(a.gate);
  return out;
}

// Weapons the player may START a run with: every weapon whose heart is owned (gate-free weapons are always open).
export function startableWeapons(data, def, tree) {
  const hearts = (def && def.hearts) || {};
  return Object.keys(data.weapons).filter((id) => {
    if (!data.weapons[id].treeGate) return true;
    const h = own(hearts, id) ? hearts[id] : null;
    return !!(h && own(tree, h) && tree[h] >= 1);
  });
}

// Grants the starter set on a save (mutates; caller validates ids and saves). Returns false for an unknown hero/weapon.
export function grantStarter(save, data, info, def, heroId, weaponId) {
  if (!own(data.characters, heroId) || !own(data.weapons, weaponId)) return false;
  const ids = starterNodes(info, weaponId).filter((id) => def && own(def.nodes, id));
  if (!save.tree || typeof save.tree !== 'object') save.tree = {};
  for (const id of ids) save.tree[id] = 1;
  if (!save.chars || typeof save.chars !== 'object') save.chars = {};
  const c = own(save.chars, heroId) ? save.chars[heroId] : (save.chars[heroId] = { xp: 0, keep: 0, woke: false });
  c.woke = true;
  save.notes = { ...(save.notes || {}), starter: { hero: heroId, weapon: weaponId }, loadout: { hero: heroId, weapon: weaponId } };
  return true;
}

// The starter pick's offer (balance.starter = { heroes: ['*'] | [ids], weapons: ['*'] | [ids] }): DATA-driven, known ids only, data order.
// A missing / empty / junk list means "all" (never an empty pick).
export function starterPool(data) {
  const S = data && data.balance && data.balance.starter;
  const pick = (list, all) => {
    if (!Array.isArray(list) || !list.length || list.includes('*')) return all;
    const ok = all.filter((id) => list.includes(id));
    return ok.length ? ok : all;
  };
  return { heroes: pick(S && S.heroes, Object.keys(data.characters)), weapons: pick(S && S.weapons, Object.keys(data.weapons)) };
}
