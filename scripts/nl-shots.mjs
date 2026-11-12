// Q5b: Next lights on the real results (loss + win), the pause screen, and Continue flying the tree camera back with a pulse. Own Chrome (port 9399).
// Usage: node scripts/nl-shots.mjs <baseUrl> <outDir>      (serve dist first: cd dist && python -m http.server 5301)
import { launch, sleep, VIEWS } from './u3-lib.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5301', out = process.argv[3] || 'docs/screenshots/tree-look';
const c = await launch(9399);
// a lantern with some history: starter set, some kills banked, little gold, so a run's gold makes lanterns affordable and kills move bars
const PREP = "(()=>{const a=__app,s=a.save.data;a.save.saveNow=()=>{};a.save.saveSoon=()=>{};s.gold=0;s.stats={...s.stats,runs:4,killsByEnemy:{crow:20,wolf:60}};a.chooseStarter&&a.chooseStarter('wren','chain_lightning');return 1})()";
const END = (state, extra) => `(()=>{const s=__app.sim;s.time=${state === 'victory' ? 900 : 391};s.level=12;s.kills=240;s.gold=${extra || 700};s.shards=1;s.player.hp=${state === 'victory' ? 40 : 0};s.state='${state}';return 1})()`;
const waitSim = async () => { for (let i = 0; i < 80; i++) { if (await c.ev('!!(__app.sim && __app.sim.time >= 0)')) break; await sleep(250); } await sleep(1500); };
try {
  for (const [name, w, h, dpr, mobile] of VIEWS) {
    for (const [tag, st] of [['loss', 'defeat'], ['win', 'victory']]) {
      await c.open(`${base}/?x=1`, w, h, dpr, mobile);
      await c.ev(PREP);
      await c.ev("__app.startRun('wren')"); await waitSim();
      await c.ev(END(st)); await sleep(1900);
      const info = await c.ev("(()=>{const r=document.querySelector('.layer-end .u6-wrap');const n=document.querySelector('.layer-end .nl');return {dropped:r&&r.getAttribute('data-dropped'),nl:!!n,text:n&&n.textContent.slice(0,300)}})()");
      console.log(name, tag, JSON.stringify(info));
      await c.shot(out, `${name}-results-${tag}`);
      if (tag === 'loss') {
        // Continue: the Tree button flies the camera to what moved and rings it
        await c.ev("(()=>{const b=document.querySelector('.layer-end .lg-btn:last-of-type'); const t=[...document.querySelectorAll('.layer-end button')].find((x)=>/web|tree/i.test(x.textContent)); (t||b).click(); return 1})()");
        await sleep(1800);
        await c.shot(out, `${name}-results-continue-tree`);
      }
    }
    // pause (read-only nearest unlocks)
    await c.open(`${base}/?x=1`, w, h, dpr, mobile);
    await c.ev(PREP);
    await c.ev("__app.startRun('wren')"); await waitSim();
    await c.ev("__app.togglePause()"); await sleep(700);
    await c.shot(out, `${name}-pause`);
  }
  console.log('errors', JSON.stringify(c.errors.slice(0, 5)));
} finally { c.close(); }
