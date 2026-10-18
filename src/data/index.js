import balance from './balance.json';
import weapons from './weapons.json';
import evolutions from './evolutions.json';
import characters from './characters.json';
import enemies from './enemies.json';
import chapters from './chapters.json';
import blessings from './blessings.json';
import { treeFiles } from './tree/index.js';
import { composeTree } from '../meta/treedata.js';

// The skill tree is composed from the fragment files in ./tree/ (core, emblems, clusters, heroes, chapters).
const tree = composeTree(treeFiles(), { weapons, evolutions, characters, chapters }).live;

export const data = { balance, weapons, evolutions, characters, enemies, chapters, tree, blessings };
export default data;
