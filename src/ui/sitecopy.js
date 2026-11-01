// Map events v1 'Hollow Places' copy (toasts + results line). Plain strings only; the UI sets them with textContent.
export const SITE_EVENTS = new Set(['lampLit', 'roadLit', 'siteDone', 'knotWake', 'knotPulse', 'siteWake', 'roadFail', 'sitesSleep']);
const n0 = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
export const SITE_TOAST = {
  lampLit: (ev) => (ev.reward === 'gold' ? `Lamp lit: +${n0(ev.amt)} gold` : ev.reward === 'heart' ? 'Lamp lit: warmth returns' : 'Lamp lit: the light remembers'),
  roadLit: (ev) => (ev.n < 3 ? `Lantern Road ${n0(ev.n)} of 3` : null),
  siteDone: (ev) => (ev.kind === 'road' ? 'The old road is lit' : ev.kind === 'knot' ? (ev.shard ? 'The root is clean (+1 soul shard)' : 'The root is clean') : null),
  siteWake: (ev) => (ev.kind === 'road' ? 'An old lantern road stirs' : ev.kind === 'knot' ? 'A Hollow Knot festers' : null),
  knotWake: 'The Hollow Knot wakes: burn it out',
  roadFail: 'The road goes quiet',
  sitesSleep: 'The Hollow takes back what is left',
};
// results: "Hollow Places restored: 9 of 16 (lamps 6/12, roads 2/2, knots 1/2)"; null when the run had no sites
export function sitesLine(s) {
  if (!s || typeof s !== 'object') return null;
  const pair = (k) => (Array.isArray(s[k]) && s[k].length === 2 ? [n0(s[k][0]), n0(s[k][1])] : [0, 0]);
  const L = pair('lamp'), R = pair('road'), K = pair('knot'), done = L[0] + R[0] + K[0], all = L[1] + R[1] + K[1];
  if (!all) return null;
  return `Hollow Places restored: ${done} of ${all} (lamps ${L[0]}/${L[1]}, roads ${R[0]}/${R[1]}, knots ${K[0]}/${K[1]})`;
}
