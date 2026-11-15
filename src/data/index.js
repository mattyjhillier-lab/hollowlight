import balance from './balance.json';
import weapons from './weapons.json';
import evolutions from './evolutions.json';
import allCharacters from './characters.json';
import enemies from './enemies.json';
import chapters from './chapters.json';
import blessings from './blessings.json';
import tiers from './tiers.json';
import cosmetics from './cosmetics.json';
import { validateCosmetics } from '../meta/cosmetics.js';
import { validateTiers } from '../sim/tiers.js';
import { treeFiles } from './tree/index.js';
import { composeTree } from '../meta/treedata.js';

// HIDDEN heroes (characters.json "unreleased": true, e.g. Lucinda before her release switch) are split out here: `data.characters` (what the app,
// the tree, the codex and the saves iterate) never lists them, so a player can neither pick nor start one (not even by URL). Only the sim looks in
// `data.hiddenCharacters` (tests and balance scripts). Release = drop the flag.
const characters = {}, hiddenCharacters = {};
for (const [id, c] of Object.entries(allCharacters)) (c && c.unreleased === true ? hiddenCharacters : characters)[id] = c;

// The skill tree is composed from the fragment files in ./tree/ (core, emblems, clusters, heroes, chapters).
// Constellations of STAGED weapons (weapons.json `unreleased`) are left out (composeTree opts.unreleased). DEV-ONLY review build: setting the
// build-time env VITE_TREE_UNRELEASED=1 composes them too; a normal build has no such switch (the constant folds to false, no URL or save toggles it).
const TREE_UNRELEASED = import.meta.env && import.meta.env.VITE_TREE_UNRELEASED === '1';
const composed = composeTree(treeFiles(), { weapons, evolutions, characters, chapters }, { unreleased: TREE_UNRELEASED });
const tree = composed.live;
// Layout info (constellations, emblems, tool groups, ring radii) for the tree screen's view regions (src/meta/treeview.js).
export const treeInfo = composed.info;

validateTiers(tiers); // throws at boot on bad tier data (multipliers 1..4, Twilight exactly 1, registered marks)
validateCosmetics(cosmetics, characters); // EXTRAS v1: colours inside the lantern band, no reserved colours, one default each

export const data = { balance, weapons, evolutions, characters, hiddenCharacters, enemies, chapters, tree, blessings, tiers, cosmetics };
export default data;
