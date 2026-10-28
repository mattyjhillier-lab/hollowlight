// Map events v1 bot steering (docs/design/map-events-v1.md section 7). Shared by scripts/bot.mjs.
// SITES_BOT=calm (default, human-like) | greedy (always goes, ignores HP) | never (ignores sites; they still exist).
//  calm: an awake site within REACH and HP above HP_GO pulls at weight 0.7 (gems 0.6, chest 0.8 for scale);
//        lamp / road lantern = walk onto it; road = the nearest unlit lantern once started (never abandons a running road above HP_GO);
//        knot = close to weapon reach (Orbit ring or ~140 u), hold 120-160 u, step out of a pulse tell; leave if own HP < 35% while the knot is above 50%.
export const SITES_BOT = ['greedy', 'never'].includes(process.env.SITES_BOT) ? process.env.SITES_BOT : 'calm';
const num = (k, d) => (Number.isFinite(Number(process.env[k])) && process.env[k] !== undefined && process.env[k] !== "" ? Number(process.env[k]) : d); // probe knobs (defaults = the calm bot)
const REACH = num("SB_REACH", 900), HP_GO = 0.5, PULL = num("SB_PULL", 0.7), CROWD_R = 110, CROWD_N = 8, GEM_R = num("SB_GEM_R", 300), GEM_N = num("SB_GEM_N", 12), NEAR = num("SB_NEAR", 350), ROAD_W = num("SB_ROAD_W", 1.5);
// a calm player does not wander off while boxed in: the pull fades when CROWD_N+ foes are within CROWD_R
function crowd(sim) { const p = sim.player; let n = 0; for (const e of sim.enemies) if (!e.dead && Math.abs(e.x - p.x) < CROWD_R && Math.abs(e.y - p.y) < CROWD_R && ++n >= CROWD_N * 2) break; return n; }

// returns the target point + weight, or null. orbitReach: the bot's Orbit ring reach (0 = not an Orbit kit)
export function siteGoal(sim, orbitReach = 0) {
  const S = sim.sites;
  if (!S || SITES_BOT === 'never' || sim.fight) return null;
  const p = sim.player, hpF = p.hp / p.maxHp, greedy = SITES_BOT === 'greedy';
  const g = goal(sim, S, p, hpF, greedy, orbitReach);
  if (!g || greedy) return g;
  const n = crowd(sim);
  if (n >= CROWD_N) g.w *= g.urgent ? 0.75 : n >= CROWD_N * 2 ? 0.15 : 0.4;
  return g;
}

function goal(sim, S, p, hpF, greedy, orbitReach) {
  const act = S.active;
  if (act && act.kind === 'road') { // a running road: the nearest unlit lantern (the timer is the risk)
    let best = null, bd = Infinity;
    for (const L of act.lanterns) if (!L.lit) { const d = Math.hypot(L.x - p.x, L.y - p.y); if (d < bd) { bd = d; best = L; } }
    if (best && (greedy || hpF > 0.3)) return { x: best.x, y: best.y, w: ROAD_W, hold: 0, urgent: true };
  }
  if (act && act.kind === 'knot') { const g = knotGoal(sim, act, hpF, greedy, orbitReach); if (g) return g; }
  if (!greedy && sim.mini && !sim.mini.dead) return null; // a Branch-Mane is out: deal with it first
  let swept = true; // a calm player sweeps up the gems around them before setting off far (leaving a field of gems behind costs more than a lamp pays)
  if (!greedy) { let n = 0; for (const g of sim.gems) if (!g.mag && Math.abs(g.x - p.x) < GEM_R && Math.abs(g.y - p.y) < GEM_R && ++n >= GEM_N) { swept = false; break; } }
  if (!greedy && hpF <= HP_GO) {
    // hurt: only a heart lamp close by is worth it
    let h = null, hd = 500;
    for (const s of S.list) if (s.kind === 'lamp' && s.state === 'awake' && s.reward === 'heart') { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < hd) { hd = d; h = s; } }
    return h ? { x: h.x, y: h.y, w: 1.0, hold: 0 } : null;
  }
  let best = null, bd = greedy ? Infinity : REACH;
  for (const s of S.list) {
    if (s.state !== 'awake' && !(s.kind === 'knot' && s.state === 'calm')) continue;
    if (s.kind === 'lamp' && s.reward === 'heart' && hpF > 0.85) continue; // a full-HP player leaves the heart lamp for later
    let tx = s.x, ty = s.y;
    if (s.kind === 'road') { let ld = Infinity; for (const L of s.lanterns) { const d = Math.hypot(L.x - p.x, L.y - p.y); if (d < ld) { ld = d; tx = L.x; ty = L.y; } } }
    const d = Math.hypot(tx - p.x, ty - p.y);
    if (!swept && d > NEAR) continue; // only close sites while gems lie around
    if (d < bd) { bd = d; best = { s, tx, ty }; }
  }
  if (!best) return null;
  if (best.s.kind === 'knot') return knotGoal(sim, best.s, hpF, greedy, orbitReach);
  return { x: best.tx, y: best.ty, w: PULL, hold: 0 };
}

function knotGoal(sim, s, hpF, greedy, orbitReach) {
  const p = sim.player, K = sim.sites.def.knots;
  const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
  const hpK = s.maxHp > 0 ? s.hp / s.maxHp : 1;
  if (!greedy && hpF < 0.35 && hpK > 0.5) return null; // leave it (the leash heals it back; retry later)
  const out = K.pulse.r + p.r + 12;
  if (s.tell > 0 && d < out + 4) return { x: s.x + (dx / d) * (out + 20), y: s.y + (dy / d) * (out + 20), w: 1.6, hold: 0, urgent: true }; // step out of the pulse ring
  const want = orbitReach ? Math.max(K.r + orbitReach - 8, 20) : 130;
  if (orbitReach && s.pulseT > 1.2) return { x: s.x + (dx / d) * want, y: s.y + (dy / d) * want, w: 0.9, hold: 0 }; // an Orbit ring grazes between pulses
  const hold = orbitReach ? out + 10 : Math.max(want, out + 10);
  return { x: s.x + (dx / d) * hold, y: s.y + (dy / d) * hold, w: 0.8, hold: 0 };
}
