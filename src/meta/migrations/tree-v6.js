// Tree migration step 6: the Meteor road hotfix (live bug 2026-11-16). In tree version 5 the Dragonfire Meteor road started AT the Chain
// Lightning heart (dm_way1 requires gt_chain_lightning), so every Meteor node had the Chain heart as a gate ancestor. A profile that picked
// Meteor as its starter owned gt_dragonfire_meteor + gt_wildfire without the Chain heart, and the first save reload dropped both
// (sanitizeTree drops nodes whose gate ancestors are not owned, refunding their 400 gold): the spirit step then offered nothing.
// Version 6 re-roots the road at cl_way7 (the last plain waypoint before the Chain heart), which changes only dm_way1's requires (a released
// id, hence this step). This step:
//   1. changes nothing about ownership or refunds of dm_way1 or any other bought node (no gold, shards or Dawnglass are ever added);
//   2. REPAIRS a save whose starter weapon's PERMANENT starter nodes (heart + first gated seal) are missing: they are granted again, free,
//      exactly as the starter pick granted them. Permanent nodes can never be removed legitimately (respec keeps them), so a missing one can
//      only be this bug. Non-permanent starter nodes (Holy Orbit's Halo) are not re-added: respec may have refunded them.
// Pure, idempotent (a repaired tree owns the nodes, so a second run adds nothing), untrusted-input safe (only ids of the frozen table).

// FROZEN: the permanent starter nodes per starter weapon at tree version 6. Never read live data here.
export const STARTER_REPAIR_V6 = Object.freeze({
  ghost_wolves: Object.freeze(['gt_ghost_wolves']),
  raven_flock: Object.freeze(['gt_raven_flock', 'gt_dive_bombers']),
  spirit_bolts: Object.freeze(['gt_spirit_bolts', 'gt_spirit_tempest']),
  chain_lightning: Object.freeze(['gt_chain_lightning', 'gt_thunder_judgment']),
  holy_orbit: Object.freeze(['gt_holy_orbit']),
  dragonfire_meteor: Object.freeze(['gt_dragonfire_meteor', 'gt_wildfire']),
});

const ID = /^[a-z0-9]{1,4}_[a-z0-9_]{1,40}$/;
const isObj =(v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const owned = (t, id) => Object.hasOwn(t, id) && ((typeof t[id] === 'number' && Number.isFinite(t[id]) && t[id] >= 1) || t[id] === true);

// rawTree: object-form { id: rank } (untrusted). ctx: { starter: the save's starter weapon id (untrusted), def: compiled live tree }.
// -> { tree, gold: 0, shards: 0, repaired: [ids re-granted] }
export function repairStarter(rawTree, ctx = {}) {
  const tree = {};
  // own keys with a node-id shape only (never __proto__ / constructor); values are sanitised later by sanitizeTree
  if (isObj(rawTree)) for (const id of Object.keys(rawTree)) if (ID.test(id)) tree[id] = rawTree[id];
  const starter = typeof ctx.starter === 'string' && Object.hasOwn(STARTER_REPAIR_V6, ctx.starter) ? ctx.starter : null;
  const repaired = [];
  if (starter) {
    for (const id of STARTER_REPAIR_V6[starter]) {
      if (ctx.def && isObj(ctx.def.nodes) && !Object.hasOwn(ctx.def.nodes, id)) continue; // a live tree without the node: nothing to grant
      if (owned(tree, id)) continue;
      tree[id] = 1;
      repaired.push(id);
    }
  }
  return { tree, gold: 0, shards: 0, repaired };
}
