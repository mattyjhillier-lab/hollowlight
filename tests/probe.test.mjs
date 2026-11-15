// FIX4: the ?perf=1 probe is a no-op when off, tags long frames with the lazy work that ran, and keeps no personal data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { probe, LONG_MS, refreshHz, verdict } from '../src/gfx/probe.js';
import { parseParams } from '../src/params.js';

test('off by default: tag/first/frame do nothing', () => {
  probe.on = false; probe.tags.length = 0; probe.long.length = 0;
  probe.tag('x', 5); probe.first('y'); probe.frame(100); probe.frame(900);
  assert.equal(probe.tags.length, 0); assert.equal(probe.long.length, 0);
  assert.equal(probe.span('s', () => 7), 7);
});

test('on: a long frame is logged with the tags collected in it; first() fires once', () => {
  probe.on = true; probe.last = 0; probe.runStart(); probe.seen.clear();
  probe.frame(1000);
  probe.tag('bake:test', 80); probe.first('weapon:chain_lightning'); probe.first('weapon:chain_lightning');
  probe.frame(1000 + LONG_MS + 40);
  assert.equal(probe.long.length, 1);
  assert.deepEqual(probe.long[0].tags, ['bake:test 80ms', 'first:weapon:chain_lightning']);
  probe.frame(1000 + LONG_MS + 56);
  assert.equal(probe.long.length, 1, 'a normal frame is not logged');
  probe.on = false;
});

test('IPHONE-PERF: refresh rate from the raw rAF interval, and a plain verdict', () => {
  assert.equal(refreshHz(16.7), 60); assert.equal(refreshHz(8.33), 120); assert.equal(refreshHz(33.4), 30); assert.equal(refreshHz(25), 40); assert.equal(refreshHz(0), 0); assert.equal(refreshHz(13), 0);
  assert.match(verdict(33.4, 5, 33.3), /30 Hz/);
  assert.match(verdict(17, 15.5, 16.7), /CPU bound/);
  assert.match(verdict(25, 6, 16.7, 12), /GPU bound/);
  assert.match(verdict(25, 6, 16.7), /outside our JS/);
  assert.equal(verdict(16.8, 6, 16.7), 'ok');
  assert.equal(verdict(0, 0, 0), '');
});

test('IPHONE-PERF: endFrame sums the section split; the line shows cpu / sections / rAF; off = no-op', () => {
  probe.on = false; probe.add('sim', 5); probe.endFrame(9, 2, [4, 3, 0, 0, 0, 0, 0, 1]); assert.equal(probe.sum.n, 0);
  probe.on = true; probe.gpu = false;
  for (const k in probe.sum) probe.sum[k] = 0;
  probe.add('sim', 1.5); probe.add('hud', 0.5); probe.endFrame(8, 2, [3, 2.5, 0, 0, 0, 0, 0, 0.5]);
  probe.add('sim', 1.5); probe.add('hud', 0.5); probe.endFrame(8, 2, [3, 2.5, 0, 0, 0, 0, 0, 0.5]);
  assert.equal(probe.sum.n, 2); assert.equal(probe.sum.app, 2); assert.equal(probe.cur.sim, 0);
  probe.rn = 0; for (let i = 0; i < 20; i++) { probe.raf[i] = 16.7; probe.rn++; }
  const s = probe.splitLine(25);
  assert.match(s, /cpu 8\.0 ms\/f \(sim 1\.5 hud 0\.5 app 1\.0 draw 2\.5 fx 0\.5 render 2\.0\)/);
  assert.match(s, /rAF 16\.7 ms \(60 Hz\)  cb 25\.0  idle 17\.0  frames lost outside our JS/);
  probe.on = false;
});

test('?perf=1 is a pure render flag, and the probe source stores and sends nothing', () => {
  assert.equal(parseParams('?perf=1').perf, true);
  assert.equal(parseParams('?perf=yes').perf, false);
  const src = readFileSync(new URL('../src/gfx/probe.js', import.meta.url), 'utf8');
  assert.equal(/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|innerHTML|cookie/.test(src), false);
});
