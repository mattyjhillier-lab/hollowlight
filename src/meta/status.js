// Status registry for skill-tree status power nodes (docs/design/skill-tree-v2.md C.10).
// A status node lives inside its OWNER weapon's constellation, so it stays dormant until that weapon is unlocked.
// All statuses share ONE budget category (cap 8, weight 0.15): a new status adds choices, not power.
// T1 only validates and budgets these; the sim hooks arrive in T3/T6.
export const STATUSES = Object.freeze({
  bleed: { owner: 'ghost_wolves', unit: 'pct' },
  burn: { owner: 'holy_orbit', unit: 'pct' },
  mark: { owner: 'raven_flock', unit: 'secs' },
  pin: { owner: null, unit: 'secs' }, // reserved: no node ships at launch (Pin is Rally's, boss-immune)
});
