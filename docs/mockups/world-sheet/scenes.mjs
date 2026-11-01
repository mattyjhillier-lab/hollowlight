// Shared scene data for the world sheet: every frame (desktop, phone, 4 moments, take A/B) uses the SAME forest (seeded scatter) and the same battle, so differences are the take and the time of day.
// Coordinates are world units relative to the hero (1 unit = 1 px on the 1280x720 desktop frame; the phone frame is the same world at u = 2/3).
import { scatter } from './world.mjs';
import { pair } from '../elias-v2/actual.mjs';

export const drawHero = () => pair();
export const HERO_DESK = [640, 396];
export const HERO_PHONE = [232, 470];

const PATH = { pts: [[-900, 250], [-420, 170], [-60, 190], [330, 120], [820, 170]], w: 46, hol: '#8a95a2', ali: '#cdb98e', a: 0.55 };

export const LIFE = {
  dusk: { blobs: [[0, 8, 120]], trails: [], corr: [[-430, 20, 110, 1]] },
  night: { blobs: [[0, 8, 160], [100, 24, 100], [-60, 120, 60], [190, -70, 64], [390, 90, 70]], trails: [{ pts: [[110, 30], [250, 74], [400, 44], [560, 96], [720, 66]], w: 44, fade: true }, { pts: [[-60, 30], [-130, 66], [-110, 100]], w: 30 }], corr: [[-390, -6, 120, 1], [-330, 150, 90, 2], [-270, -140, 80, 3], [-520, 90, 80, 4]] },
  deep: { blobs: [[0, 8, 190], [110, 24, 130], [-70, 130, 80], [200, -70, 90], [400, 90, 100], [-260, 40, 70], [620, -50, 90]], trails: [{ pts: [[110, 30], [260, 80], [420, 40], [560, 100], [760, 60]], w: 54 }, { pts: [[-60, 30], [-180, 70], [-290, 36]], w: 34, fade: true }], corr: [[-430, -60, 140, 1], [-380, 150, 100, 2], [-300, -170, 90, 3], [-560, 60, 90, 4], [-90, -210, 70, 5]] },
  dawn: { all: true },
};

export const BATTLE = {
  night: { fell: [[-330, -80, 1], [-350, 30, 1], [-250, 120, 1], [-215, -130, 1], [-290, -20, 1]], crawlers: [[-370, 150], [-310, -150]], ghost: [[-102, 30, -1], [-84, -42, -1]], gems: [[-215, -46], [-235, 70], [-130, 62], [-55, 80]], ravens: [[190, -130]] },
  dusk: { fell: [[-380, -30, 1], [-330, 70, 1]], crawlers: [], ghost: [[-102, 30, -1]], gems: [[-200, 10]], ravens: [] },
  deep: { fell: [[-330, -100, 1], [-370, 10, 1], [-300, 100, 1], [-230, -160, 1], [-260, 0, 1], [-420, -70, 1], [-380, 120, 1], [-200, 140, 1]], crawlers: [[-360, 170], [-310, -190], [-450, 20]], ghost: [[-102, 30, -1], [-84, -42, -1], [-130, 90, -1]], gems: [[-215, -46], [-250, 70], [-140, 62], [-62, 84], [-170, 130]], ravens: [[190, -130], [260, -60]] },
  dawn: { fell: [], crawlers: [], ghost: [[-102, 30, -1], [-84, -42, -1]], gems: [[-215, -46]], ravens: [[190, -130]] },
};

const dmg = []; // damage numbers are the HUD sheet's job; the world sheet keeps the frame clean

// authored dressing near the hero's zone so every take shows the full set in the first look
const authored = (K) => (K === 'A'
  ? [['stump', 210, -118, 1, { sd: 2 }], ['grave', -190, -106, 1], ['mush', 330, 120, 1], ['lamp', 470, -70, 1, { lit: true }], ['boulder', -520, 200, 1]]
  : [['pillar', -600, -120, 1.1], ['pillar', -520, 250, 1.0], ['pillar', 560, -150, 1.0], ['pillar', 650, 220, 1.1], ['pillar', -180, -330, 1], ['pillar', 150, -360, 1.05], ['pillar', -300, 420, 1], ['pillar', 330, 400, 1], ['stump', 220, -110, 1], ['log', -210, -118, 1], ['mush', 340, 120, 1], ['lamp', 470, -70, 1, { lit: true }], ['boulder', -520, 200, 1]]);

export function cfgFor(K, mom, dev = 'desk', over = {}) {
  const f = { dusk: 0.03, night: 0.43, deep: 0.65, dawn: 0.99 }[mom];
  const life = LIFE[mom];
  const props = [...scatter(K, K === 'A' ? 5 : 9, 1500), ...authored(K)];
  const phone = dev === 'phone';
  return {
    take: K, f, life, props, seed: 11, hero: phone ? HERO_PHONE : HERO_DESK, drawHero,
    paths: [PATH], scene: BATTLE[mom], dawn: mom === 'dawn',
    ribbons: mom === 'dusk' ? [] : [{ pts: [[40, -50], [140, -66], [260, -40], [380, -70], [520, -44]], w: 14 }, { pts: [[-20, -70], [60, -96], [160, -80]], w: 9, col: '#ffe3a6' }],
    sparks: mom === 'dusk' ? [] : [[-262, -14, 4], [-250, 22, 3], [-276, -48, 3.4], [-240, 56, 2.6]],
    sprouts: mom === 'dusk' ? [] : [[190, -30], [-175, 88], [-80, -150]],
    fx: { fogA: mom === 'dawn' ? 0.08 : mom === 'deep' ? 0.2 : 0.16, nFly: mom === 'dawn' ? 30 : 22 },
    ...over,
  };
}
