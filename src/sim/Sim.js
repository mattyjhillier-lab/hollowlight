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
  xpForLevel,
} from './cards.js';
import { WEAPON_BEHAVIOURS } from './weapons.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class Sim {
  constructor({ data, characterId = 'wren', chapterId = 'cursed_forest', seed = 1, meta = {}, startTime = 0, godMode = false }) {
    this.data = data;
    this.balance = data.balance;
    this.chapterId = chapterId;
    this.chapter = data.chapters[chapterId];
    this.character = data.characters[characterId];
    this.characterId = characterId;
    this.seed = seed;
    this.rng = createRng(seed);
    this.godMode = godMode;

    this.time = startTime;
    this.state = 'running'; // running | levelup | victory | defeat
    this.nextId = 1;
    this.events = [];

    const size = this.balance.worldSize;
    this.player = {
      x: size / 2, y: size / 2, r: 6,
      hp: this.character.hp, maxHp: this.character.hp,
      speed: this.character.speed, iframes: 0, faceX: 1,
    };

    // Tree / meta hooks. The skill tree will adjust these later.
    this.mods = { damage: 1, area: 1, cooldown: 1, speed: 1, pickup: 1, xp: 1, gold: 1, abilityCd: 1 };
    this.buffs = { packHowl: 0, speedBoost: 0, speedMult: 1 };

    this.enemies = [];
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
    this.boss = null;
    this.bossSpawned = false;
    this.bossKilled = false;

    this.offer = null;
    this.banished = new Set();
    this.rerollsLeft = meta.rerolls || 0;
    this.banishesLeft = meta.banishes || 0;

    this.spawnAcc = this.chapter.waves.map(() => 0);
    this.eventsDone = new Set();
    this.chapter.events.forEach((ev, i) => { if (ev.t < startTime) this.eventsDone.add(i); });

    const ab = this.character.ability;
    this.ability = { id: ab.id, name: ab.name, cooldown: ab.cooldown, cdLeft: 10 };

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
  get cardCtx() { return { weapons: this.weapons, data: this.data, banished: this.banished }; }

  dmgMult(w) {
    let m = this.mods.damage;
    for (const tag of this.data.weapons[w.id].tags) {
      const t = this.character.traits[`${tag}Damage`];
      if (t) m *= t;
    }
    return m;
  }

  addWeapon(id) {
    const w = newWeapon(id, this.data.weapons[id]);
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

  hurt(e, amount, opts = {}) {
    if (e.dead || amount <= 0) return 0;
    e.hp -= amount;
    this.damageDealt += amount;
    if (!opts.silent) e.flash = 0.08;
    if (e.hp <= 0) e.dead = true;
    return amount;
  }

  bleed(e, dps, dur) {
    if (e.dead) return;
    e.bleedDps = Math.max(e.bleedDps, dps);
    e.bleedT = Math.max(e.bleedT, dur);
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

  toughestEnemy(x, y, maxR) {
    let best = null;
    let bestHp = -1;
    const r2 = maxR * maxR;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy < r2 && e.hp > bestHp) {
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

  damagePlayer(amount) {
    const p = this.player;
    if (p.iframes > 0 || this.state !== 'running') return;
    if (!this.godMode) p.hp -= amount;
    p.iframes = this.balance.playerIframes;
    if (!this.godMode) this.pushEvent('hurt');
    if (p.hp <= 0) {
      p.hp = 0;
      this.state = 'defeat';
    }
  }

  spawnBolt({ x, y, ang, speed, dmg, pierce, r, homing, explode, life, target, color }) {
    this.projectiles.push({
      id: this.nextId++, kind: 'bolt', x, y,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      ang, speed, dmg, pierce, r, homing, explode, life, target, color, hit: new Set(),
    });
  }

  spawnZone(z) {
    this.zones.push({ id: this.nextId++, tick: 0, ...z });
  }

  // ------------------------------------------------------------------ enemies
  spawnEnemy(typeId, x, y) {
    const d = this.data.enemies[typeId];
    const hs = this.balance.hpScale;
    const m = this.minutes;
    const hpMul = d.boss ? 1 : 1 + hs.linear * m + hs.quad * m * m;
    const dmgMul = 1 + this.balance.dmgScale.linear * m;
    const size = this.balance.worldSize;
    const e = {
      id: this.nextId++, type: typeId,
      x: clamp(x, 10, size - 10), y: clamp(y, 10, size - 10),
      r: d.r, hp: d.hp * hpMul, maxHp: d.hp * hpMul,
      speed: d.speed, dmg: d.dmg * dmgMul, xp: d.xp, gold: d.gold, mass: d.mass, boss: !!d.boss,
      state: 'run', stT: 0, dx: 0, dy: 0, tele: false,
      chargeCd: this.rng.range(1, 3.5), slamCd: 5,
      phase: this.rng.range(0, 6.28), cd: {},
      bleedT: 0, bleedDps: 0, fearT: 0, flash: 0, dead: false, faceX: 1,
    };
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
    this.chapter.waves.forEach((wave, i) => {
      if (t < wave.from || t > wave.to) return;
      const k = (t - wave.from) / (wave.to - wave.from);
      const rate = wave.rate0 + (wave.rate1 - wave.rate0) * Math.pow(k, wave.curve || 1);
      this.spawnAcc[i] = Math.min(4, this.spawnAcc[i] + rate * dt);
      while (this.spawnAcc[i] >= 1) {
        this.spawnAcc[i] -= 1;
        if (this.enemies.length >= cap) continue;
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
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);

      if (e.bleedT > 0) {
        e.bleedT -= dt;
        this.hurt(e, e.bleedDps * dt, { silent: true });
        if (e.dead) continue;
      }

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;
      let vx = 0;
      let vy = 0;

      if (e.heldT > 0) {
        e.heldT -= dt;
        e.tele = false;
      } else if (e.fearT > 0) {
        e.fearT -= dt;
        vx = -nx * e.speed * 1.3;
        vy = -ny * e.speed * 1.3;
        e.tele = false;
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
            if (dist < 74 + p.r) this.damagePlayer(e.dmg * 1.4);
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
    let worst = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const rr = p.r + e.r * 0.85;
      if (dx * dx + dy * dy < rr * rr && e.dmg > worst) worst = e.dmg;
    }
    if (worst > 0) this.damagePlayer(worst);
  }

  // ------------------------------------------------------------------ the rest of the frame
  updatePlayer(dt, input) {
    const p = this.player;
    let mx = input.x || 0;
    let my = input.y || 0;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    let spd = p.speed * (this.character.traits.moveSpeed || 1) * this.mods.speed;
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
    this.buffs.packHowl = Math.max(0, this.buffs.packHowl - dt);
    this.buffs.speedBoost = Math.max(0, this.buffs.speedBoost - dt);
  }

  updateWeapons(dt) {
    for (const w of this.weapons) WEAPON_BEHAVIOURS[w.id].update(this, w, dt);
  }

  updateProjectiles(dt) {
    const size = this.balance.worldSize;
    for (const b of this.projectiles) {
      if (b.dead) continue;
      if (b.homing) {
        if (!b.target || b.target.dead) b.target = this.nearestEnemy(b.x, b.y, 180);
        if (b.target) {
          const want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
          let diff = want - b.ang;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          b.ang += clamp(diff, -5 * dt, 5 * dt);
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
          this.hurt(e, b.dmg);
          b.hit.add(e.id);
          if (b.pierce <= 0) {
            b.dead = true;
            if (b.explode) this.explodeBolt(b);
            break;
          }
          b.pierce -= 1;
        }
      }
      if (!b.dead && (b.life <= 0 || b.x < 0 || b.y < 0 || b.x > size || b.y > size)) {
        b.dead = true;
        if (b.explode && b.life <= 0) this.explodeBolt(b);
      }
    }
    this.projectiles = this.projectiles.filter((b) => !b.dead);
  }

  explodeBolt(b) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + 22) this.hurt(e, b.dmg * 0.6);
    }
    this.addFx({ kind: 'ring', x: b.x, y: b.y, r: 22, ttl: 0.18, color: '#7ff0ff' });
  }

  updateZones(dt) {
    const p = this.player;
    for (const z of this.zones) {
      z.ttl -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.25;
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) this.hurt(e, z.dps * 0.25, { silent: true });
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
    const pick = this.balance.pickupRadius * this.mods.pickup;
    const keep = [];
    for (const g of this.gems) {
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d < pick) g.mag = true;
      if (g.mag) {
        const step = Math.min(d, this.balance.magnetSpeed * dt);
        g.x += (dx / d) * step;
        g.y += (dy / d) * step;
      }
      if (d < 5) {
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
    const heartP = b.heart * low * (1 + this.sinceHeart / b.pityHeart);
    const magnetP = b.magnet * (1 + this.sinceMagnet / b.pityMagnet);
    if (p.hp < p.maxHp && this.rng.chance(heartP)) { this.addPickup('heart', e.x, e.y); this.sinceHeart = 0; }
    else if (this.gems.length > 12 && this.rng.chance(magnetP)) { this.addPickup('magnet', e.x, e.y); this.sinceMagnet = 0; }
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
      if (d < this.balance.pickupRadius * this.mods.pickup * 0.6) {
        const step = Math.min(d, this.balance.magnetSpeed * dt);
        k.x += (dx / d) * step;
        k.y += (dy / d) * step;
      }
      if (d < 9) {
        if (k.type === 'heart') {
          this.healPlayer(p.maxHp * this.balance.drops.heartHeal);
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
    a.cdLeft = a.cooldown * this.mods.abilityCd;
    if (a.id === 'pack_howl') {
      this.buffs.packHowl = 6;
      this.addSpeedBoost(1.25, 6);
      for (const e of this.enemies) {
        if (!e.dead && !e.boss && Math.hypot(e.x - p.x, e.y - p.y) < 130) e.fearT = Math.max(e.fearT, 2);
      }
      this.addFx({ kind: 'ring', x: p.x, y: p.y, r: 130, ttl: 0.35, color: '#9fd8ff' });
      this.pushEvent('howl');
    } else if (a.id === 'sanctuary') {
      const holy = this.character.traits.holyDamage || 1;
      this.spawnZone({ x: p.x, y: p.y, r: 70, ttl: 6, dps: 14 * this.mods.damage * holy, heal: 3, color: '#fff3b0' });
      this.pushEvent('sanctuary');
    }
    return true;
  }

  cleanupDead() {
    let any = false;
    for (const e of this.enemies) {
      if (!e.dead) continue;
      any = true;
      this.kills += 1;
      this.gold += e.gold * this.mods.gold;
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
      this.pushEvent('levelup');
    }
    if (this.pending > 0 && this.state === 'running') this.beginLevelUp();
  }

  beginLevelUp() {
    this.state = 'levelup';
    this.offer = generateOffer(this.cardCtx, this.rng);
  }

  canReroll() { return this.state === 'levelup' && this.rerollsLeft > 0; }
  canBanish() { return this.state === 'levelup' && this.banishesLeft > 0; }

  reroll() {
    if (!this.canReroll()) return false;
    this.rerollsLeft -= 1;
    this.offer = rerollOffer(this.cardCtx, this.rng, this.offer);
    return true;
  }

  banish(key) {
    if (!this.canBanish()) return false;
    if (!this.offer.cards.some((c) => c.key === key)) return false;
    this.banishesLeft -= 1;
    this.offer = banishCard(this.cardCtx, this.rng, this.offer, key);
    return true;
  }

  pickCard(key) {
    if (this.state !== 'levelup' || !this.offer) return false;
    const card = this.offer.cards.concat(this.offer.gold).find((c) => c.key === key);
    if (!card) return false;
    if (card.kind === 'fallback') {
      if (card.fallback === 'heal') this.healPlayer(this.player.maxHp * 0.35);
      else if (card.fallback === 'gold') this.gold += 25;
      else if (card.fallback === 'xp') this.xp += Math.ceil(this.xpNeeded * 0.5);
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
    this.updateEnemies(dt);
    if (this.state !== 'running') return;
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.ability.cdLeft = Math.max(0, this.ability.cdLeft - dt);
    if (input.ability) this.useAbility();
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
      weapons: this.weapons.map((w) => ({ id: w.id, evo: w.evo, ranks: { ...w.ranks } })),
    };
  }

  // Dev/test: give a weapon (or set its ranks) without going through level-ups.
  debugGrant(id, ranks = {}, evo = null) {
    let w = this.weapons.find((x) => x.id === id);
    if (!w) w = this.addWeapon(id);
    Object.assign(w.ranks, ranks);
    w.s = {};
    for (const k of Object.keys(this.data.weapons[id].stats)) {
      const st = this.data.weapons[id].stats[k];
      w.s[k] = st.base + st.perRank * w.ranks[k];
    }
    if (evo) {
      for (const u of this.units) if (u.owner === id) u.dead = true;
      w.evo = evo;
      w.rt = {};
    }
    return w;
  }
}
