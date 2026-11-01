// DESKTOP D5 (docs/design/desktop-v1.md B1.3/B1.4): menu-only keyboard shortcuts for desktop. Pure decision function + a small installer. Render/UI only.
//   1-6 jump between the six menu tabs (Home, Character, Tree, Goals, Almanac, Settings); F toggles full screen (menus and the pause menu).
// Both go through the player's key map (src/input/keymap.js): the tab keys are the "pick card 1-6" keys and F is the 'fullscreen' action, so a remap is honoured.
// Digits are NOT used for tabs where the screen already owns them (Character page and loadout pickers choose heroes with 1-9, the Almanac switches its four
// pages with 1-4), and never in a run (level-up cards own 1-6 there; F only exists on the pause menu).
import { actionOf } from '../input/keymap.js';

export const TAB_IDS = Object.freeze(['home', 'character', 'tree', 'goals', 'almanac', 'settings']);
export const NUMBER_SCREENS = Object.freeze(['home', 'tree', 'goals', 'settings']);

const TEXTY = /^(text|search|email|url|tel|password|number|)$/i;
/** Is the key event aimed at something the player types into? */
export function isTyping(t) {
  if (!t || typeof t !== 'object') return false;
  const tag = String(t.tagName || '').toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return TEXTY.test(String(t.type || ''));
  return !!t.isContentEditable;
}

/** Pure. ctx: { menu: tab row showing, pause: pause menu showing, active: current tab id | null, blocked: something modal is open or a key is being remapped }.
 *  -> { type: 'tab', id } | { type: 'fs' } | null. */
export function deskKeyAction(e, ctx = {}) {
  if (!e || e.repeat || ctx.blocked || isTyping(e.target)) return null;
  if (!ctx.menu && !ctx.pause) return null;
  const act = actionOf(e); // ignores Ctrl / Alt / Meta combos
  if (!act) return null;
  if (act === 'fullscreen') return { type: 'fs' };
  const m = /^pick([1-6])$/.exec(act);
  if (!m || !ctx.menu || !NUMBER_SCREENS.includes(ctx.active)) return null;
  const id = TAB_IDS[Number(m[1]) - 1];
  return id === ctx.active ? null : { type: 'tab', id };
}
