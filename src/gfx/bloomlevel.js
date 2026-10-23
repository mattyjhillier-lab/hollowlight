// BL1 High bloom tuning (pure, no Phaser): see src/gfx/bloompipe.js.
// BL1 light re-tune of the prototype (0.78 / 0.5): plain add (a screen-style add measured worse: it flattened the spirits' glow at night) and a mild
// daylight ease (dayThresh / dayStrength at full daylight, bodyK 0.72) so the cream day pool does not glare; night keeps the full glow.
export const BLOOM_DEF = Object.freeze({ thresh: 0.78, knee: 0.16, strength: 0.5, offset: 1.25, steps: 2, dayThresh: 0.82, dayStrength: 0.42 });

// day 0..1 (0 = night, 1 = full daylight): the live threshold / strength
export function bloomLevel(p, day) {
  const d = Math.min(1, Math.max(0, day || 0));
  return { thresh: p.thresh + (p.dayThresh - p.thresh) * d, strength: p.strength + (p.dayStrength - p.strength) * d };
}
