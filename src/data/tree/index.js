// Skill tree fragment registry for the game bundle (Vite). Adding a cluster / emblem / hero / chapter = dropping a JSON file here.
// Node tests and scripts use src/meta/treefs.mjs (same files, same composer).
import { filesFromGlob } from '../../meta/treedata.js';

const mods = import.meta.glob('./**/*.json', { eager: true, import: 'default' });
export const treeFiles = () => filesFromGlob(mods);
