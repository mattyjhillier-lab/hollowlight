// How often is a "Something stirs" card offered in bot runs, and when first? Display-only check.
// Usage: node scripts/evohint-stats.mjs [char] [seeds]   (FOCUS=1 for focused bot)
import { playRun } from './bot.mjs';
const char = process.argv[2] || 'wren', seeds = Number(process.argv[3] || 24);
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const fmt = (s) => (s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const firsts = [], offers = [], lvls = [];
for (let sd = 1; sd <= seeds; sd++) {
  let n = 0, first = null, fl = null;
  playRun(char, sd, { onOffer: (sim) => { if (sim.offer.cards.some((c) => c.stirs)) { n++; if (first === null) { first = sim.time; fl = sim.level; } } } });
  offers.push(n); if (first !== null) { firsts.push(first); lvls.push(fl); }
}
console.log(`${char} ${process.env.FOCUS === '1' ? 'FOCUS' : 'random'} x${seeds}: runs with a stirs card ${firsts.length}/${seeds}; offers/run median ${med(offers)} (max ${Math.max(...offers)}); first at ${fmt(med(firsts))} (level ${med(lvls)})`);
