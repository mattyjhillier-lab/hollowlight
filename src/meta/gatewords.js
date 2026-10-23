// Player-facing wording for tree gates (permanent weapon/evolution/hero unlock nodes). Pure: no DOM, no Phaser.
// Rules: an evolution gate never names its stat pair; its name + weapon show only once progress has begun.
const own = (o, k) => Object.hasOwn(o, k);

export const PERMANENT_NOTE = 'Permanent: not refunded by respec.';
export const GATE_KEY_TEXT = 'GATES unlock new weapons and evolutions';
export const FIRST_RUN_HINT = 'More weapons and evolutions unlock as you play: slay different enemies and try different heroes.';
export const RESPEC_ARMED = 'Refund spent nodes (gates stay). Click again';
export const RESPEC_DONE_SUFFIX = ' Gates stay unlocked.';
export const NEW_CARD_TOAST = 'Unlocked in the Skill Tree';

// The gate effect of a node, or null: { kind: 'weapon'|'evolution'|'hero'|'tier', id } (tier id = 'chapter:tier', the Night Gate).
export function gateOf(def, id) {
  const n = def && own(def.nodes, id) ? def.nodes[id] : null;
  if (!n || !n.permanent) return null;
  const e = n.effects.find((x) => x && ['weapon', 'evolution', 'hero', 'tier'].includes(x.unlock));
  if (!e) return null;
  return e.unlock === 'tier' ? { kind: 'tier', id: `${e.chapter}:${e.tier}` } : { kind: e.unlock, id: e.id };
}

// Display name for a node. Unmasked evolution gates read "Name (Weapon)"; masked ones read "???".
export function nodeTitle(def, id, data, masked = false) {
  const n = def.nodes[id];
  if (masked) return '???';
  const g = gateOf(def, id);
  if (g && g.kind === 'evolution' && def.evoWeapon && own(def.evoWeapon, g.id) && data.weapons && own(data.weapons, def.evoWeapon[g.id])) {
    return `${n.name} (${data.weapons[def.evoWeapon[g.id]].name})`;
  }
  return n.name;
}

// '(300 gold)'; a Night Gate lantern also names its shards / Dawnglass: '(1200 gold + 2 shards)'.
const goldText = (n) => {
  const c = n.cost || {};
  const p = [c.gold ? `${c.gold} gold` : '', c.shards ? `${c.shards} shard${c.shards === 1 ? '' : 's'}` : '', c.glass ? `${c.glass} Dawnglass` : ''].filter(Boolean);
  return p.length ? ` (${p.join(' + ')})` : '';
};

// Results-screen line for a node whose unlock condition was just met.
export function newlyLine(def, id, data) {
  const n = def.nodes[id];
  const g = gateOf(def, id);
  if (!g) return n.name;
  const what = nodeTitle(def, id, data);
  return `NEW: ${what} is ready to unlock in the Skill Tree${goldText(n)}.`;
}

// Gates first, then other nodes; capped.
export function newlyLines(def, ids, data, max = 6) {
  const rows = ids.filter((id) => own(def.nodes, id)).map((id) => ({ gate: !!gateOf(def, id), text: newlyLine(def, id, data) }));
  rows.sort((a, b) => Number(b.gate) - Number(a.gate));
  return rows.slice(0, max).map((r) => r.text);
}

// Short panel tag for a node: 'GATE' for permanent unlock nodes.
export const gateTag = (def, id) => (gateOf(def, id) ? 'GATE' : '');

// Should the in-run "Unlocked in the Skill Tree" toast fire for this offer? Returns the weapon ids (gated, NEW card), minus those already toasted.
export function toastWeapons(cards, data, seen) {
  const out = [];
  for (const c of cards) {
    if (c.kind !== 'weapon' || !c.weaponId || !own(data.weapons, c.weaponId)) continue;
    if (!data.weapons[c.weaponId].treeGate || seen.has(c.weaponId)) continue;
    out.push(c.weaponId);
  }
  return out;
}
