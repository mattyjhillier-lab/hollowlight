// The whole game simulation, with no Phaser or DOM in it.
// The scene feeds it input each frame and draws whatever state it holds.
import { createRng } from './rng.js';
import { Grid } from './grid.js';
import {
  newWeapon,
  generateOffer,
  rerollOffer,
  banishCard,
  applyCard,
  computeStats,
  xpForLevel,
  fallbackCard,
  BURN_RATE,
  BURN_TIME,
} from './cards.js';
import { validateBlessings, blessingCount, blessTotals, healSwap } from './blessings.js';
import { resolveTier } from './tiers.js';
import { WEAPON_BEHAVIOURS, boltSeek, boltRetarget, pagesStep } from './weapons.js';
import { aiStep, aiInterrupt, updateEnemyShots } from './enemyai.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// MARK (W8b): +15% damage taken from ALL sources for 3 s, refresh only (re-marking resets the timer, never stacks), bosses included.
// TOTAL DAMAGE-AMP CAP (Matt 2026-10-16): the product of every temporary damage amp (Mark, a source amp such as Rally the Pack +50%)
// is capped at x1.75; applied in exactly one place (Sim.damageAmp, used by Sim.hurt).
export const MARK_AMP = 0.15;
export const MARK_TIME = 3;
export const AMP_CAP = 1.75;

export class Sim {
  constructor({ data, characterId = 'wren', chapterId = 'cursed_forest', seed = 1, meta = {}, tree = null, startTime = 0, godMode = false, tier = 'normal' }) {
    this.data = data;
    this.balance = data.balance;
    this.chapterId = chapterId;
    this.chapter = data.chapters[chapterId];
    // Difficulty tier (src/sim/tiers.js): an unknown or forged id resolves to Twilight (every multiplier 1), so the param can never reach another path.
    this.tier = resolveTier(data.tiers, chapterId, tier);
    this.character = data.characters[characterId];
    this.characterId = characterId;
    this.seed = seed;
    this.rng = createRng(seed);
    this.godMode = godMode;

    this.time = startTime;
    this.state = 'running'; // running | levelup | victory | defeat
    this.nextId = 1;
    this.events = [];
    // Preallocated ring of hit/kill records for the renderer (no per-hit allocation). Not part of the sim state.
    this.hitBuf = Array.from({ length: 64 }, () => ({ x: 0, y: 0, a: 0, id: 0, mx: 0, boss: false, kill: false }));
    this.hitN = 0;

    const size = this.balance.worldSize;
    this.player = {
      x: size / 2, y: size / 2, r: 6,
      hp: this.character.hp, maxHp: this.character.hp,
      speed: this.character.speed, iframes: 0, faceX: 1,
    };

    // Skill-tree effects (src/meta/tree.js aggregate). Absent = a fresh, tree-less run.
    this.mods = { damage: 1, area: 1, cooldown: 1, speed: 1, pickup: 1, xp: 1, gold: 1, abilityCd: 1 };
    const T = tree || {};
    if (T.mods) for (const k of Object.keys(this.mods)) if (Number.isFinite(T.mods[k])) this.mods[k] = T.mods[k];
    this.tfx = {
      regen: T.player?.regen || 0,
      revive: T.player?.revive || 0,
      levelHeal: T.player?.levelHeal || 0,
      heart: T.drops?.heart ?? 1,
      magnet: T.drops?.magnet ?? 1,
      heartHeal: T.drops?.heartHeal ?? 1,
      abilityDur: T.ability?.dur ?? 1,
      autoHp: T.ability?.autoHp || 0,
      evoLuck: T.evoLuck ?? 1,
      rush: T.rush || null, // { pct, secs }: summons surge on level-up
      // Status power nodes (T3): potency multipliers on the existing Rend / Burn paths, extra Mark seconds, Rally and Candle Wheel tuning. 1 / 0 when absent.
      bleedMul: 1 + (T.status?.bleed || 0) / 100,
      burnMul: 1 + (T.status?.burn || 0) / 100,
      markAdd: T.status?.mark || 0,
      rallyAdd: T.ability?.rallySecs || 0,
      wheelMul: 1 + (T.ability?.wheel || 0) / 100,
      // Satchel (DT5a): gems fly to you faster / on level-up; seconds taken off the heart and magnet pity timers
      gemPull: 1 + (T.perks?.gemPull || 0) / 100,
      gemCall: !!T.perks?.gemCall,
      heartPity: T.drops?.heartPity || 0,
      magnetPity: T.drops?.magnetPity || 0,
    };
    this.reviveLeft = this.tfx.revive > 0 ? 1 : 0;
    this.weaponBonus = T.weaponBonus || {};
    this.unlockedWeapons = new Set(T.unlocks?.weapons || []);
    this.unlockedEvolutions = new Set(T.unlocks?.evolutions || []); // tree-derived only, never from save.unlocks
    this.buffs = { rally: 0, speedBoost: 0, speedMult: 1, rush: 0 };
    if (T.player?.maxHp && T.player.maxHp !== 1) {
      this.player.maxHp = Math.round(this.player.maxHp * T.player.maxHp);
      this.player.hp = this.player.maxHp;
    }
    this.baseMaxHp = this.player.maxHp;
    // The tree's own multiplier for each Blessing effect: Blessings are clamped so tree x Blessing stays under the combined cap (blessings.js).
    this.treeMul = { damage: this.mods.damage, maxHp: T.player?.maxHp ?? 1, speed: this.mods.speed, pickup: this.mods.pickup, gold: this.mods.gold };
    // Blessings (run-only). Validated here so absent/tampered data fails closed to "none".
    const bdef = validateBlessings(data.blessings);
    this.blessDef = blessingCount(bdef) ? bdef : null;
    this.blessRanks = Object.create(null);
    this._bless = {};
    this.healSwapReady = 0;
    this.killsByEnemy = {};
    this.gemsTaken = 0; this.abilityUses = 0; this.blessingsTaken = 0; // counters for the tool-cluster unlock conditions (never read by the sim)

    this.enemies = [];
    // EN3-EN5 telegraph enemies: enemy projectiles (hit the player only), live tells per type (recounted every frame), live count per type
    // (spawn caps), the view the tells must sit inside (half extents in world units; the scene feeds the real camera view each frame).
    this.eshots = [];
    this.tells = {};
    this.alive = {};
    const tv = this.balance.tellView || { hw: 266, hh: 150 };
    this.view = { hw: tv.hw, hh: tv.hh };
    this.hurtBy = {}; // damage taken by source (counter only)
    this.hitsBy = {}; // hits taken by source (counter only; DR4 recap)
    this.lungeHits = 0; // hits taken from a wolf lunge (counter only)
    this.lastHit = null; // DR1/DR4: { src, kind, id, t, amt, x, y } of the latest hit that landed (counter only, never read by the sim)
    this._v = [0, 0];
    this.gems = [];
    this.pickups = [];
    this.sinceHeart = 0;
    this.sinceMagnet = 0;
    this.projectiles = [];
    this.units = [];
    this.zones = [];
    this.fx = [];
    this.weapons = [];
    this.grid = new Grid(24);

    this.level = 1;
    this.xp = 0;
    this.pending = 0;
    this.kills = 0;
    this.gold = 0;
    this.shards = 0;
    this.damageDealt = 0;
    // R2 counters (read-only stats for the results screen; never feed back into the sim).
    this._src = null;
    this.fallen = []; // W6: prey felled by the pack, consumed by Howling Legion (empty unless it is owned)
    this.dmgBy = {};
    this.dotBy = {}; // damage-over-time by source weapon (counter only, never read by the sim)
    this.burnBy = {}; // the Burn part of dotBy (counter only)
    this.srcAmps = {}; // temporary damage amps by SOURCE weapon id (Rally the Pack sets srcAmps.ghost_wolves = 1.5 while active); joins Mark in the capped product
    this.ampBonus = 0; // extra damage dealt because of temporary amps (counter only)
    this.markBy = {}; // the Mark part of ampBonus by the weapon that applied it (counter only)
    this.killsBy = {};
    this.boss = null;
    this.bossSpawned = false;
    this.bossKilled = false;

    this.offer = null;
    this.banished = new Set();
    this.rerollsLeft = (meta.rerolls || 0) + (T.meta?.rerolls || 0);
    this.banishesLeft = (meta.banishes || 0) + (T.meta?.banishes || 0);

    this.spawnAcc = this.chapter.waves.map(() => 0);
    this.eventsDone = new Set();
    this.chapter.events.forEach((ev, i) => { if (ev.t < startTime) this.eventsDone.add(i); });

    const ab = this.character.ability;
    this.ability = { id: ab.id, name: ab.name, cooldown: ab.cooldown, cdLeft: 10, bonus: ab.bonus ?? 0 };
    this.rally = null; // Rally the Pack window: { target, t, dur } (target may be null until an enemy is in reach)
    this.ability.cdLeft = Math.min(this.ability.cdLeft, this.abilityCooldown);

    this.patches = [];
    for (let i = 0; i < this.chapter.rootPatches; i++) {
      this.patches.push({
        x: this.rng.range(80, size - 80),
        y: this.rng.range(80, size - 80),
        r: this.rng.range(18, 34),
      });
    }

    this.addWeapon(this.character.weapon);
  }

  // ------------------------------------------------------------------ helpers
  get minutes() { return this.time / 60; }
  pushEvent(type, extra) { this.events.push({ type, ...extra }); }
  addFx(fx) { this.fx.push(fx); }
  get cardCtx() {
    return { weapons: this.weapons, data: this.data, banished: this.banished, blessings: this.blessDef, blessRanks: this.blessRanks, treeMul: this.treeMul, evoLuck: this.tfx.evoLuck, weaponBonus: this.weaponBonus, unlockedWeapons: this.unlockedWeapons, unlockedEvolutions: this.unlockedEvolutions };
  }

  // Ability cooldown after tree reductions; never below the design floor (balance.abilityCdFloor, 30s).
  get abilityCooldown() {
    const a = this.ability;
    const floor = Math.min(a.cooldown, this.balance.abilityCdFloor ?? 30);
    return Math.max(floor, a.cooldown * this.mods.abilityCd);
  }

  // Read-time clamped Blessing multipliers (separate from this.mods, which stay untouched).
  get bless() { return blessTotals(this.blessDef, this.blessRanks, this._bless, this.treeMul); }

  dmgMult(w) {
    let m = this.mods.damage;
    if (this.data.weapons[w.id].type === 'summon') m *= this.bless.damage;
    if (this.buffs.rush > 0 && this.data.weapons[w.id].type === 'summon') m *= 1 + this.tfx.rush.pct / 100;
    for (const tag of this.data.weapons[w.id].tags) {
      const t = this.character.traits[`${tag}Damage`];
      if (t) m *= t;
    }
    return m;
  }

  addWeapon(id) {
    const w = newWeapon(id, this.data.weapons[id], this.weaponBonus[id] || null);
    this.weapons.push(w);
    return w;
  }

  makeUnit(w, kind, props) {
    const p = this.player;
    return { id: this.nextId++, owner: w.id, kind, x: p.x, y: p.y, r: 4, dead: false, ...props };
  }

  addSpeedBoost(mult, secs) {
    this.buffs.speedMult = mult;
    this.buffs.speedBoost = Math.max(this.buffs.speedBoost, secs);
  }

  canHit(e, key, interval) {
    const last = e.cd[key];
    if (last === undefined || this.time - last >= interval) {
      e.cd[key] = this.time;
      return true;
    }
    return false;
  }

  // Product of the temporary damage amps on this hit (Mark on the target x the source's own amp), clamped to AMP_CAP.
  damageAmp(e) {
    let a = 1;
    if (e.markT > 0) a *= 1 + MARK_AMP;
    const sa = this._src ? this.srcAmps[this._src] : 0;
    if (sa > 1) a *= sa;
    return a > AMP_CAP ? AMP_CAP : a;
  }

  // Apply Mark to a foe (owner = the weapon currently acting). Refresh only: no stacking, no stronger version.
  mark(e) {
    if (e.dead) return;
    e.markT = MARK_TIME + this.tfx.markAdd; // Raven's Eye adds uptime only; the amp stays 15% and inside the x1.75 cap
    e.markSrc = this._src;
  }

  hurt(e, amount, opts = {}) {
    if (e.dead || amount <= 0) return 0;
    const amp = this.damageAmp(e);
    if (amp !== 1) {
      const extra = amount * (amp - 1);
      amount += extra;
      this.ampBonus += extra;
      if (e.markT > 0 && e.markSrc) this.markBy[e.markSrc] = (this.markBy[e.markSrc] || 0) + extra;
    }
    e.hp -= amount;
    this.damageDealt += amount;
    if (this._src) this.dmgBy[this._src] = (this.dmgBy[this._src] || 0) + amount;
    if (!opts.silent) { e.flash = 0.08; this.logHit(e, amount, false); }
    if (e.hp <= 0) { e.dead = true; e.killer = this._src; }
    return amount;
  }

  logHit(e, a, kill) {
    const h = this.hitBuf[this.hitN < 64 ? this.hitN++ : 63];
    h.x = e.x; h.y = e.y; h.a = a; h.id = e.id; h.mx = e.maxHp; h.boss = e.boss; h.kill = kill;
  }

  bleed(e, dps, dur) {
    if (e.dead) return;
    e.bleedSrc = this._src;
    e.bleedDps = Math.max(e.bleedDps, dps * this.tfx.bleedMul);
    e.bleedT = Math.max(e.bleedT, dur);
  }

  // Burn (Elias, Holy Orbit hits only): 20% of the triggering hit per second for 2 s. One instance per enemy:
  // potency = strongest, time refreshes to 2 s, potency ends with the burn. Sim-only state (never saved).
  burn(e, hit) {
    if (e.dead || !(hit > 0)) return;
    e.burnSrc = this._src;
    e.burnDps = Math.max(e.burnDps, hit * BURN_RATE * this.tfx.burnMul);
    e.burnT = Math.max(e.burnT, BURN_TIME);
  }

  nearestEnemy(x, y, maxR, pred) {
    let best = null;
    let bestD = maxR * maxR;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD && (!pred || pred(e))) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  nearestEnemies(x, y, maxR, n) {
    const r2 = maxR * maxR;
    const list = [];
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < r2) list.push([d, e]);
    }
    list.sort((a, b) => a[0] - b[0]);
    return list.slice(0, n).map((x2) => x2[1]);
  }

  toughestEnemy(x, y, maxR, filter) {
    let best = null;
    let bestHp = -1;
    const r2 = maxR * maxR;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy < r2 && e.hp > bestHp && (!filter || filter(e))) {
        bestHp = e.hp;
        best = e;
      }
    }
    return best;
  }

  healPlayer(amount) {
    const p = this.player;
    p.hp = Math.min(p.maxHp, p.hp + amount);
  }

  // src = what hurt the hero (enemy type id; counter only, never read by the sim: bot/sweep damage-by-source readout)
  // meta (optional, counters + render only): { kind: contact|lunge|charge|slam|burst|thorn, id: attacker id, x, y: attacker position (thorn: its origin side), dx, dy: thorn travel direction }
  damagePlayer(amount, src = 'contact', meta = null) {
    const p = this.player;
    if (p.iframes > 0 || this.state !== 'running') return;
    this.hurtBy[src] = (this.hurtBy[src] || 0) + amount;
    this.hitsBy[src] = (this.hitsBy[src] || 0) + 1;
    const kind = meta && meta.kind ? meta.kind : 'contact';
    if (kind === 'lunge') this.lungeHits += 1;
    const ax = meta && Number.isFinite(meta.x) ? meta.x : p.x, ay = meta && Number.isFinite(meta.y) ? meta.y : p.y;
    const id = meta && Number.isFinite(meta.id) ? meta.id : -1;
    this.lastHit = { src, kind, id, t: this.time, amt: amount, x: ax, y: ay };
    if (!this.godMode) p.hp -= amount;
    p.iframes = this.balance.playerIframes;
    if (!this.godMode) this.pushEvent('hurt', { src, kind, id, amt: amount, x: ax, y: ay, dx: meta && Number.isFinite(meta.dx) ? meta.dx : 0, dy: meta && Number.isFinite(meta.dy) ? meta.dy : 0 });
    if (p.hp <= 0) {
      if (this.reviveLeft > 0) {
        this.reviveLeft -= 1;
        p.hp = Math.max(1, Math.round(p.maxHp * this.tfx.revive));
        p.iframes = 2;
        this.pushEvent('revive');
        return;
      }
      p.hp = 0;
      this.state = 'defeat';
    }
  }

  spawnBolt({ x, y, ang, speed, dmg, pierce, r, homing, explode, life, target, color, turn = 5, ...extra }) {
    this.projectiles.push({
      id: this.nextId++, kind: 'bolt', x, y,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      ang, speed, dmg, pierce, r, homing, explode, life, turn, target, color, hit: new Set(), src: this._src, ...extra,
    });
  }

  spawnZone(z) {
    this.zones.push({ id: this.nextId++, tick: 0, src: this._src, ...z });
  }

  // ------------------------------------------------------------------ enemies
  spawnEnemy(typeId, x, y) {
    const d = this.data.enemies[typeId];
    const hs = this.balance.hpScale;
    const m = this.minutes;
    const hpMul = (d.boss ? 1 : 1 + hs.linear * m + hs.quad * m * m) * (d.boss ? this.tier.bossHp : this.tier.enemyHp); // tier multipliers are exactly 1 on Twilight
    const dmgMul = (1 + this.balance.dmgScale.linear * m) * this.tier.enemyDmg;
    const size = this.balance.worldSize;
    const e = {
      id: this.nextId++, type: typeId,
      x: clamp(x, 10, size - 10), y: clamp(y, 10, size - 10),
      r: d.r, hp: d.hp * hpMul, maxHp: d.hp * hpMul,
      speed: d.speed, dmg: d.dmg * dmgMul, xp: d.xp, gold: d.gold, mass: d.mass, boss: !!d.boss,
      state: 'run', stT: 0, dx: 0, dy: 0, tele: false,
      chargeCd: this.rng.range(1, 3.5), slamCd: 5,
      phase: this.rng.range(0, 6.28), cd: {},
      markT: 0, markSrc: null, bleedT: 0, bleedDps: 0, bleedTot: 0, burnT: 0, burnDps: 0, burnTot: 0, burnSrc: null, fearT: 0, flash: 0, dead: false, faceX: 1,
    };
    if (d.ai) { // EN3-EN5: data-driven telegraph behaviour (src/sim/enemyai.js); the ai block is shared read-only data
      e.ai = d.ai; e.grace = d.ai.grace ?? 0.8; e.dmgMul = dmgMul; e.aiCd = this.rng.range(d.ai.firstCd?.[0] ?? 1, d.ai.firstCd?.[1] ?? 2);
      if (d.ai.chargeDmg) e.cdmg = d.ai.chargeDmg * dmgMul;
    }
    this.alive[typeId] = (this.alive[typeId] || 0) + 1;
    this.enemies.push(e);
    return e;
  }

  ringPoint(angle, extra = 0) {
    const p = this.player;
    const d = this.balance.spawnDistance + extra;
    return { x: p.x + Math.cos(angle) * d, y: p.y + Math.sin(angle) * d };
  }

  updateSpawns(dt) {
    const t = this.time;
    const cap = this.balance.maxEnemies;
    const bossLive = this.boss && !this.boss.dead;
    this.chapter.waves.forEach((wave, i) => {
      if (t < wave.from || t > wave.to) return;
      const k = (t - wave.from) / (wave.to - wave.from);
      const rate = (wave.rate0 + (wave.rate1 - wave.rate0) * Math.pow(k, wave.curve || 1)) * (bossLive && wave.bossMul !== undefined ? wave.bossMul : 1);
      this.spawnAcc[i] = Math.min(4, this.spawnAcc[i] + rate * dt);
      // per-type live cap (EN3-EN5 must-react types), optionally raised after a time (maxAliveAfter: { t, n })
      const maxA = wave.maxAlive === undefined ? Infinity : (wave.maxAliveAfter && t >= wave.maxAliveAfter.t ? wave.maxAliveAfter.n : wave.maxAlive);
      while (this.spawnAcc[i] >= 1) {
        this.spawnAcc[i] -= 1;
        if (this.enemies.length >= cap || (this.alive[wave.enemy] || 0) >= maxA) continue;
        const pt = this.ringPoint(this.rng.range(0, 6.2832), this.rng.range(0, 40));
        this.spawnEnemy(wave.enemy, pt.x, pt.y);
      }
    });

    this.chapter.events.forEach((ev, i) => {
      if (this.eventsDone.has(i) || t < ev.t) return;
      this.eventsDone.add(i);
      const base = this.rng.range(0, 6.2832);
      for (let n = 0; n < ev.count; n++) {
        const a = base + this.rng.range(-0.6, 0.6);
        const pt = this.ringPoint(a, this.rng.range(0, 50));
        this.spawnEnemy(ev.enemy, pt.x, pt.y);
      }
      this.pushEvent('swarm', { enemy: ev.enemy, count: ev.count });
    });

    if (!this.bossSpawned && t >= this.chapter.bossAt) {
      this.bossSpawned = true;
      const pt = this.ringPoint(this.rng.range(0, 6.2832));
      this.boss = this.spawnEnemy(this.chapter.bossId, pt.x, pt.y);
      this.pushEvent('boss');
    }
  }

  updateEnemies(dt) {
    const p = this.player;
    const size = this.balance.worldSize;
    // live tells per telegraph type (the token cap in enemyai.canTell); recounted so a dead/interrupted teller always frees its token
    for (const k in this.tells) this.tells[k] = 0;
    for (const e of this.enemies) if (e.ai && e.state === 'tele' && !e.dead) this.tells[e.type] = (this.tells[e.type] || 0) + 1;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      if (e.markT > 0) e.markT = Math.max(0, e.markT - dt);

      if (e.bleedT > 0) {
        e.bleedT -= dt;
        this._src = e.bleedSrc || null;
        const dealt = this.hurt(e, e.bleedDps * dt, { silent: true });
        e.bleedTot += dealt; // running total the renderer batches into small numbers (counter only)
        if (this._src) this.dotBy[this._src] = (this.dotBy[this._src] || 0) + dealt;
        this._src = null;
        if (e.bleedT <= 0) e.bleedDps = 0; // potency ends with the bleed (B3)
        if (e.dead) continue;
      }

      if (e.burnT > 0) {
        e.burnT -= dt;
        this._src = e.burnSrc || null;
        const dealt = this.hurt(e, e.burnDps * dt, { silent: true });
        e.burnTot += dealt; // running total the renderer batches into small numbers (counter only)
        if (this._src) { this.dotBy[this._src] = (this.dotBy[this._src] || 0) + dealt; this.burnBy[this._src] = (this.burnBy[this._src] || 0) + dealt; }
        this._src = null;
        if (e.burnT <= 0) e.burnDps = 0;
        if (e.dead) continue;
      }

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;
      let vx = 0;
      let vy = 0;

      if (e.ai && e.ai.immune === e.state) { e.heldT = 0; e.fearT = 0; } // control-immune state (Bramble Hart charge): fear/pin do nothing
      if (e.heldT > 0) {
        e.heldT -= dt;
        e.tele = false;
        if (e.ai) aiInterrupt(e);
      } else if (e.fearT > 0) {
        e.fearT -= dt;
        vx = -nx * e.speed * 1.3;
        vy = -ny * e.speed * 1.3;
        e.tele = false;
        if (e.ai) aiInterrupt(e);
      } else if (e.ai) {
        aiStep(this, e, dt, nx, ny, dist, this._v);
        vx = this._v[0];
        vy = this._v[1];
        if (e.dead) continue;
      } else if (e.type === 'wolf') {
        if (e.state === 'run') {
          vx = nx * e.speed;
          vy = ny * e.speed;
          e.chargeCd -= dt;
          if (e.chargeCd <= 0 && dist < 130) {
            e.state = 'tele';
            e.stT = 0.55;
            e.dx = nx;
            e.dy = ny;
          }
        } else if (e.state === 'tele') {
          e.tele = true;
          e.stT -= dt;
          if (e.stT <= 0) {
            e.tele = false;
            e.state = 'charge';
            e.stT = 0.6;
          }
        } else if (e.state === 'charge') {
          vx = e.dx * e.speed * 3.2;
          vy = e.dy * e.speed * 3.2;
          e.stT -= dt;
          if (e.stT <= 0) {
            e.state = 'run';
            e.chargeCd = 3.5 + this.rng.range(0, 1.5);
          }
        }
      } else if (e.type === 'crow') {
        const sway = Math.sin(this.time * 5 + e.phase) * e.speed * 0.9;
        vx = nx * e.speed - ny * sway;
        vy = ny * e.speed + nx * sway;
      } else if (e.type === 'elder_treant') {
        if (e.state === 'run') {
          vx = nx * e.speed;
          vy = ny * e.speed;
          e.slamCd -= dt;
          if (e.slamCd <= 0 && dist < 150) {
            e.state = 'tele';
            e.stT = 0.9;
          }
        } else if (e.state === 'tele') {
          e.tele = true;
          e.stT -= dt;
          if (e.stT <= 0) {
            e.tele = false;
            e.state = 'run';
            e.slamCd = 6.5;
            this.addFx({ kind: 'ring', x: e.x, y: e.y, r: 74, ttl: 0.3, color: '#7a4a1b' });
            this.pushEvent('slam');
            if (dist < 74 + p.r) this.damagePlayer(e.dmg * 1.4, e.type, { kind: 'slam', id: e.id, x: e.x, y: e.y });
            for (let k = 0; k < 3; k++) {
              const a = this.rng.range(0, 6.2832);
              this.spawnEnemy('root_crawler', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40);
            }
          }
        }
      } else {
        vx = nx * e.speed;
        vy = ny * e.speed;
      }

      e.x = clamp(e.x + vx * dt, 5, size - 5);
      e.y = clamp(e.y + vy * dt, 5, size - 5);
      if (Math.abs(vx) > 1) e.faceX = vx > 0 ? 1 : -1;
    }

    // Soft separation so hordes spread out instead of stacking into one pixel.
    const g = this.grid;
    g.clear();
    for (const e of this.enemies) if (!e.dead) g.insert(e);
    for (const a of this.enemies) {
      if (a.dead) continue;
      g.neighbours(a, (b) => {
        if (b.id <= a.id || b.dead) return;
        const ddx = b.x - a.x;
        const ddy = b.y - a.y;
        const minD = (a.r + b.r) * 0.85;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 >= minD * minD) return;
        const d = Math.sqrt(d2) || 0.01;
        const overlap = minD - d;
        const ux = ddx / d;
        const uy = ddy / d;
        const ia = 1 / a.mass;
        const ib = 1 / b.mass;
        const tot = ia + ib;
        a.x -= ux * overlap * (ia / tot) * 0.5;
        a.y -= uy * overlap * (ia / tot) * 0.5;
        b.x += ux * overlap * (ib / tot) * 0.5;
        b.y += uy * overlap * (ib / tot) * 0.5;
      });
    }

    // Contact damage: the strongest overlapping enemy lands one hit per i-frame window.
    let worst = 0, wsrc = 'contact', wE = null;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const rr = p.r + e.r * 0.85;
      const dm = e.cdmg && e.state === 'charge' ? e.cdmg : e.dmg; // a charging Bramble Hart hits harder
      if (dx * dx + dy * dy < rr * rr && dm > worst) { worst = dm; wsrc = e.type; wE = e; }
    }
    if (worst > 0) this.damagePlayer(worst, wsrc, { kind: wE.state === 'charge' ? (wE.type === 'wolf' ? 'lunge' : 'charge') : 'contact', id: wE.id, x: wE.x, y: wE.y });
  }

  // ------------------------------------------------------------------ the rest of the frame
  updatePlayer(dt, input) {
    const p = this.player;
    let mx = input.x || 0;
    let my = input.y || 0;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    let spd = p.speed * (this.character.traits.moveSpeed || 1) * this.mods.speed * this.bless.speed;
    if (this.buffs.speedBoost > 0) spd *= this.buffs.speedMult;
    for (const pt of this.patches) {
      const dx = p.x - pt.x;
      const dy = p.y - pt.y;
      if (dx * dx + dy * dy < pt.r * pt.r) { spd *= 0.65; break; }
    }
    const size = this.balance.worldSize;
    p.x = clamp(p.x + mx * spd * dt, p.r, size - p.r);
    p.y = clamp(p.y + my * spd * dt, p.r, size - p.r);
    if (Math.abs(mx) > 0.1) p.faceX = mx > 0 ? 1 : -1;
    p.iframes = Math.max(0, p.iframes - dt);
    if (this.tfx.regen > 0) this.healPlayer(this.tfx.regen * dt);
    this.buffs.rush = Math.max(0, this.buffs.rush - dt);
    this.buffs.speedBoost = Math.max(0, this.buffs.speedBoost - dt);
  }

  updateWeapons(dt) {
    for (const w of this.weapons) {
      this._src = w.id;
      WEAPON_BEHAVIOURS[w.id].update(this, w, dt);
    }
    this._src = null;
  }

  updateProjectiles(dt) {
    const size = this.balance.worldSize;
    for (const b of this.projectiles) {
      if (b.dead) continue;
      if (b.pages) { pagesStep(this, b, dt); continue; } // W10d Returning Pages: out and home again, own movement and hit set
      if (b.seek > 0) { b.seek -= dt; if (b.seek <= 0) boltSeek(this, b); } // W10b: burst phase over, take your own prey
      if (b.homing) {
        if (!b.target || b.target.dead) b.target = b.vol ? boltRetarget(this, b) : this.nearestEnemy(b.x, b.y, 180);
        if (b.target) {
          const want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
          let diff = want - b.ang;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          b.ang += clamp(diff, -b.turn * dt, b.turn * dt);
          b.vx = Math.cos(b.ang) * b.speed;
          b.vy = Math.sin(b.ang) * b.speed;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      for (const e of this.enemies) {
        if (e.dead || b.hit.has(e.id)) continue;
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        const rr = e.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          this._src = b.src || null;
          this.hurt(e, b.dmg);
          this._src = null;
          b.hit.add(e.id);
          if (b.explode && b.blastEach && b.pierce > 0) this.explodeBolt(b);
          if (b.pierce <= 0) {
            b.dead = true;
            if (b.explode) this.explodeBolt(b);
            break;
          }
          b.pierce -= 1;
        }
      }
      if (!b.dead && (b.life <= 0 || b.x < 0 || b.y < 0 || b.x > size || b.y > size)) {
        b.dead = true; // W10b: a blast needs a hit; a glyph that fades in empty air just fades
      }
    }
    this.projectiles = this.projectiles.filter((b) => !b.dead);
  }

  explodeBolt(b) {
    this._src = b.src || null;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + (b.blastR ?? 22)) this.hurt(e, b.dmg * (b.blast ?? 0.6));
    }
    this._src = null;
    if (this.fx.length < 48) this.addFx({ kind: 'ring', x: b.x, y: b.y, r: b.blastR ?? 22, ttl: 0.18, color: '#7ff0ff' });
  }

  updateZones(dt) {
    const p = this.player;
    for (const z of this.zones) {
      z.ttl -= dt;
      z.tick -= dt;
      if (z.wheel) z.age += dt;
      if (z.tick <= 0) {
        z.tick = 0.25;
        if (z.dps > 0) for (const e of this.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) { this._src = z.src || null; this.hurt(e, z.dps * 0.25, { silent: true }); this._src = null; }
        }
      }
      if (z.heal && Math.hypot(p.x - z.x, p.y - z.y) < z.r) this.healPlayer(z.heal * dt);
    }
    this.zones = this.zones.filter((z) => z.ttl > 0);
  }

  addGem(x, y, v) {
    this.gems.push({ id: this.nextId++, x, y, v, mag: false });
    if (this.gems.length > this.balance.gemCap) {
      const old = this.gems.shift();
      this.gems[this.gems.length - 1].v += old.v;
    }
  }

  updateGems(dt) {
    const p = this.player;
    const pick = this.balance.pickupRadius * this.mods.pickup * this.bless.pickup;
    const keep = [];
    for (const g of this.gems) {
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d < pick) g.mag = true;
      if (g.mag) {
        const step = Math.min(d, this.balance.magnetSpeed * this.tfx.gemPull * dt);
        g.x += (dx / d) * step;
        g.y += (dy / d) * step;
      }
      if (d < 5) {
        this.gemsTaken += 1;
        this.xp += g.v * this.mods.xp;
      } else {
        keep.push(g);
      }
    }
    this.gems = keep;
  }

  rollDrops(e) {
    const b = this.balance.drops;
    const p = this.player;
    const low = p.hp < p.maxHp * 0.5 ? 2 : 1;
    if (e.boss) {
      this.addPickup('heart', e.x - 12, e.y);
      this.addPickup('magnet', e.x + 12, e.y);
      return;
    }
    const pityH = Math.max(10, b.pityHeart + this.tfx.heartPity) * this.tier.heartPity, pityM = Math.max(10, b.pityMagnet + this.tfx.magnetPity); // Kinder Hearts / Lodestar shorten the timers; Long Night stretches the heart timer
    const heartP = b.heart * this.tfx.heart * low * (1 + this.sinceHeart / pityH);
    const magnetP = b.magnet * this.tfx.magnet * (1 + this.sinceMagnet / pityM);
    const forced = this.sinceHeart >= (b.pityHeartForce || Infinity) && p.hp < p.maxHp * 0.8; // guaranteed heart after a long dry spell
    if (p.hp < p.maxHp && (forced || this.rng.chance(heartP))) { this.addPickup('heart', e.x, e.y); this.sinceHeart = 0; }
    else if (this.gems.length > (b.magnetGems ?? 12) && this.rng.chance(magnetP)) { this.addPickup('magnet', e.x, e.y); this.sinceMagnet = 0; }
  }

  addPickup(type, x, y) {
    this.pickups.push({ id: this.nextId++, type, x, y, ttl: this.balance.drops.ttl });
  }

  updatePickups(dt) {
    this.sinceHeart += dt;
    this.sinceMagnet += dt;
    const p = this.player;
    const keep = [];
    for (const k of this.pickups) {
      k.ttl -= dt;
      if (k.ttl <= 0) continue;
      const dx = p.x - k.x;
      const dy = p.y - k.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d < this.balance.pickupRadius * this.mods.pickup * this.bless.pickup * 0.6) {
        const step = Math.min(d, this.balance.magnetSpeed * dt);
        k.x += (dx / d) * step;
        k.y += (dy / d) * step;
      }
      if (d < 9) {
        if (k.type === 'heart') {
          this.healPlayer(p.maxHp * this.balance.drops.heartHeal * this.tfx.heartHeal);
          this.pushEvent('heart');
        } else {
          for (const g of this.gems) g.mag = true;
          this.pushEvent('magnet');
        }
        continue;
      }
      keep.push(k);
    }
    this.pickups = keep;
  }

  useAbility() {
    const a = this.ability;
    if (a.cdLeft > 0 || this.state !== 'running') return false;
    const p = this.player;
    a.cdLeft = this.abilityCooldown;
    this.abilityUses += 1;
    const dur = 6 * this.tfx.abilityDur;
    if (a.id === 'rally_pack') {
      const dur = 6 * this.tfx.abilityDur + this.tfx.rallyAdd; // Firm Grip: a longer window, never a stronger one (pins still never hold bosses)
      // Rally the Pack: the wolves converge on (and pin) the toughest non-boss enemy; wolf damage +bonus while it lasts.
      // The window is its own state (this.rally), never a speed boost. Ravens stay independent.
      this.buffs.rally = dur;
      this.rally = { target: this.pickRallyTarget(), t: dur, dur };
      this.srcAmps.ghost_wolves = 1 + (a.bonus ?? 0.5); // +50% bite via the shared amp product (Rally x Mark = 1.725, under the x1.75 cap)
      this.addFx({ kind: 'ring', x: p.x, y: p.y, r: 90, ttl: 0.35, color: '#ffcf7a' });
      this.pushEvent('rally');
    } else if (a.id === 'candle_wheel') {
      // Candle Wheel: a planted ring of light. Heals Elias only while he stands inside; his Holy Orbit lights lock
      // into the ring (weapons.js) and burn what crosses it. The zone itself deals no damage.
      const d = this.character.ability;
      this.zones = this.zones.filter((z) => !z.wheel);
      this.spawnZone({ wheel: true, x: p.x, y: p.y, r: (d.radius ?? 80) * this.tfx.wheelMul, ttl: dur, dur, age: 0, dps: d.dps ?? 0, heal: d.heal ?? 1.5, color: '#fff3b0' });
      this.pushEvent('wheel');
    }
    return true;
  }

  // Toughest (highest current HP) non-boss enemy near the hero; a boss only if nothing else is in reach (wolves bite it, never pin it).
  pickRallyTarget() {
    const p = this.player;
    let best = null;
    let boss = null;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (e.boss) { if (d < 300 && !boss) boss = e; continue; }
      if (d < 240 && (!best || e.hp > best.hp || (e.hp === best.hp && e.id < best.id))) best = e;
    }
    return best || boss;
  }

  updateRally(dt) {
    const r = this.rally;
    if (!r) return;
    r.t -= dt;
    this.buffs.rally = Math.max(0, r.t);
    if (r.t <= 0) {
      const t = r.target;
      if (t && !t.dead) this.addFx({ kind: 'ring', x: t.x, y: t.y, r: 26, ttl: 0.3, color: '#ffcf7a' });
      this.pushEvent('rallyEnd');
      this.rally = null;
      delete this.srcAmps.ghost_wolves;
      return;
    }
    if (!r.target || r.target.dead) r.target = this.pickRallyTarget();
    const t = r.target;
    if (t && !t.boss) t.heldT = Math.max(t.heldT || 0, 0.25); // pin; a boss is never pinned
  }

  cleanupDead() {
    let any = false;
    for (const e of this.enemies) {
      if (!e.dead) continue;
      any = true;
      this.alive[e.type] -= 1;
      if (e.burst) { this.addGem(e.x, e.y, e.xp); this.logHit(e, 0, true); continue; } // EN4 Puffback Toad burst: spent, XP only (no kill credit/gold/drops)
      if (e.ai && e.ai.kind === 'fuse' && e.state === 'tele' && this.fx.length < 48) this.addFx({ kind: 'fizzle', x: e.x, y: e.y, r: 12, ttl: 0.35, color: '#9aa39a' }); // killed during the fuse: it only fizzles
      this.kills += 1;
      this.killsByEnemy[e.type] = (this.killsByEnemy[e.type] || 0) + 1;
      if (e.killer) this.killsBy[e.killer] = (this.killsBy[e.killer] || 0) + 1;
      this.logHit(e, 0, true);
      if (e.killer === 'ghost_wolves' && !e.boss && !e.echoKill && this.fallen.length < 16 && this.weapons.some((w) => w.evo === 'howling_legion')) this.fallen.push({ x: e.x, y: e.y });
      this.gold += e.gold * this.mods.gold * this.bless.gold;
      this.addGem(e.x, e.y, e.xp);
      this.rollDrops(e);
      if (e.boss) {
        this.bossKilled = true;
        this.shards += this.chapter.bossShards;
        this.pushEvent('bossDead');
      }
    }
    if (any) this.enemies = this.enemies.filter((e) => !e.dead);
    this.units = this.units.filter((u) => !u.dead);

    // Recycle enemies that have been left far behind so the horde keeps finding you.
    const p = this.player;
    const far = this.balance.despawnDistance;
    for (const e of this.enemies) {
      if (e.boss) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dx * dx + dy * dy > far * far) {
        const pt = this.ringPoint(this.rng.range(0, 6.2832), this.rng.range(0, 30));
        e.x = pt.x;
        e.y = pt.y;
      }
    }
  }

  updateFx(dt) {
    for (const f of this.fx) f.ttl -= dt;
    this.fx = this.fx.filter((f) => f.ttl > 0);
  }

  get xpNeeded() { return xpForLevel(this.level, this.balance); }

  checkLevelUp() {
    while (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level += 1;
      this.pending += 1;
      if (this.tfx.rush) this.buffs.rush = this.tfx.rush.secs;
      if (this.tfx.gemCall) { // Lantern Call: gems within twice your pickup range fly to you
        const reach = this.balance.pickupRadius * this.mods.pickup * this.bless.pickup * 2;
        for (const g of this.gems) if (!g.mag && Math.hypot(this.player.x - g.x, this.player.y - g.y) < reach) g.mag = true;
      }
      if (this.tfx.levelHeal > 0) this.healPlayer((this.player.maxHp * this.tfx.levelHeal) / 100);
      this.pushEvent('levelup');
    }
    if (this.pending > 0 && this.state === 'running') this.beginLevelUp();
  }

  beginLevelUp() {
    this.state = 'levelup';
    this.offer = this.withHealSwap(generateOffer(this.cardCtx, this.rng));
  }

  withHealSwap(offer) {
    const cards = healSwap(offer.cards, this.cardCtx, this.player.hp, this.player.maxHp, this.time, this.healSwapReady, () => fallbackCard('heal', this.data));
    return cards === offer.cards ? offer : { ...offer, cards };
  }

  // Sets a Blessing rank (clamped) and re-derives max HP; Wrapped Warmth heals the HP it adds.
  setBlessRank(id, rank) {
    const d = this.blessDef && Object.hasOwn(this.blessDef.items, id) ? this.blessDef.items[id] : null;
    if (!d || !Number.isFinite(rank)) return false;
    this.blessRanks[id] = Math.min(d.ranks, Math.max(0, Math.floor(rank)));
    const p = this.player;
    const nm = Math.round(this.baseMaxHp * this.bless.maxHp);
    if (nm !== p.maxHp) {
      const gain = nm - p.maxHp;
      p.maxHp = nm;
      p.hp = gain > 0 ? Math.min(nm, p.hp + gain) : Math.min(nm, p.hp);
    }
    return true;
  }

  canReroll() { return this.state === 'levelup' && this.rerollsLeft > 0; }
  canBanish() { return this.state === 'levelup' && this.banishesLeft > 0; }

  reroll() {
    if (!this.canReroll()) return false;
    this.rerollsLeft -= 1;
    this.offer = this.withHealSwap(rerollOffer(this.cardCtx, this.rng, this.offer));
    return true;
  }

  banish(key) {
    if (!this.canBanish()) return false;
    if (!this.offer.cards.some((c) => c.key === key)) return false;
    this.banishesLeft -= 1;
    this.offer = this.withHealSwap(banishCard(this.cardCtx, this.rng, this.offer, key));
    return true;
  }

  pickCard(key) {
    if (this.state !== 'levelup' || !this.offer) return false;
    const card = this.offer.cards.concat(this.offer.gold).find((c) => c.key === key);
    if (!card) return false;
    if (card.kind === 'fallback') {
      if (card.fallback === 'heal') { this.healPlayer(this.player.maxHp * 0.35); if (card.swapped) this.healSwapReady = this.time + this.blessDef.heal.cooldown; }
      else if (card.fallback === 'gold') this.gold += 25;
      else if (card.fallback === 'xp') this.xp += Math.ceil(this.xpNeeded * 0.5);
    } else if (card.kind === 'blessing') {
      this.setBlessRank(card.blessId, (this.blessRanks[card.blessId] || 0) + 1);
      this.blessingsTaken += 1;
    } else {
      if (card.kind === 'evolution') {
        for (const u of this.units) if (u.owner === card.weaponId) u.dead = true;
        this.pushEvent('evolve', { id: card.evoId });
      }
      applyCard(this.cardCtx, card);
    }
    this.pending -= 1;
    this.offer = null;
    if (this.pending > 0) this.beginLevelUp();
    else this.state = 'running';
    return true;
  }

  checkEnd() {
    if (this.state === 'running' && this.time >= this.balance.runSeconds) this.state = 'victory';
  }

  step(dt, input = {}) {
    if (this.state !== 'running') return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.updatePlayer(dt, input);
    this.updateSpawns(dt);
    this.updateRally(dt);
    this.updateEnemies(dt);
    if (this.state !== 'running') return;
    if (this.eshots.length) { updateEnemyShots(this, dt); if (this.state !== 'running') return; }
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.ability.cdLeft = Math.max(0, this.ability.cdLeft - dt);
    if (input.ability) this.useAbility();
    else if (this.tfx.autoHp > 0 && this.player.hp < this.player.maxHp * this.tfx.autoHp) this.useAbility();
    this.cleanupDead();
    this.updateGems(dt);
    this.updatePickups(dt);
    this.updateFx(dt);
    this.checkLevelUp();
    this.checkEnd();
  }

  // ------------------------------------------------------------------ results & debug helpers
  result() {
    return {
      outcome: this.state === 'victory' ? 'victory' : 'defeat',
      time: this.time,
      level: this.level,
      kills: this.kills,
      gold: Math.floor(this.gold),
      shards: this.shards,
      bossKilled: this.bossKilled,
      chapter: this.chapterId,
      character: this.characterId,
      killsByEnemy: { ...this.killsByEnemy },
      bossId: this.bossKilled ? this.chapter.bossId : null,
      weapons: this.weapons.map((w) => ({ id: w.id, evo: w.evo, ranks: { ...w.ranks }, damage: this.dmgBy[w.id] || 0, kills: this.killsBy[w.id] || 0 })),
      damageDealt: this.damageDealt,
      tier: this.tier.id,
      gems: this.gemsTaken,
      abilityUses: this.abilityUses,
      blessings: this.blessingsTaken,
    };
  }

  // Dev/test: give a weapon (or set its ranks) without going through level-ups.
  debugBless(id, rank) { return this.setBlessRank(id, rank); }

  debugGrant(id, ranks = {}, evo = null) {
    if (!Object.hasOwn(this.data.weapons, id)) return null;
    let w = this.weapons.find((x) => x.id === id);
    if (!w) w = this.addWeapon(id);
    // Debug input is untrusted (URL): only known stats, clamped ranks; evo must be a real evolution of this weapon.
    for (const k of Object.keys(w.ranks)) if (Object.hasOwn(ranks, k) && Number.isFinite(ranks[k])) w.ranks[k] = Math.min(this.balance.maxRank, Math.max(0, Math.floor(ranks[k])));
    if (evo && !(Object.hasOwn(this.data.evolutions, evo) && this.data.evolutions[evo].weapon === id)) evo = null;
    w.s = {};
    w.s = computeStats(this.data.weapons[id], w.ranks, w.bonus);
    if (evo) {
      for (const u of this.units) if (u.owner === id) u.dead = true;
      w.evo = evo;
      w.rt = {};
    }
    return w;
  }
}
