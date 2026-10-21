import balance from './balance.json';
import weapons from './weapons.json';
import evolutions from './evolutions.json';
import characters from './characters.json';
import enemies from './enemies.json';
import chapters from './chapters.json';
import blessings from './blessings.json';
import tiers from './tiers.json';
import { validateTiers } from '../sim/tiers.js';
import { treeFiles } from './tree/index.js';
import { composeTree } from '../meta/treedata.js';

// The skill tree is composed from the fragment files in ./tree/ (core, emblems, clusters, heroes, chapters).
const composed = composeTree(treeFiles(), { weapons, evolutions, characters, chapters });
const tree = composed.live;
// Layout info (constellations, emblems, tool groups, ring radii) for the tree screen's view regions (src/meta/treeview.js).
export const treeInfo = composed.info;

validateTiers(tiers); // throws at boot on bad tier data (multipliers 1..4, Twilight exactly 1, registered marks)

export const data = { balance, weapons, evolutions, characters, enemies, chapters, tree, blessings, tiers };
export default data;
