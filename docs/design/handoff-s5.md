# S5 handoff (Spirit Bolt "Ink Glyph Orb"), paused 2026-10-22 on coordinator request (one big job at a time)

Branch: `wip/s5` (from origin/dev 5d51a90). Not merged. Tests/build NOT run yet on this WIP.

## Done
- `src/gfx/summon/glyph.js` (new): SVG painters on the Husk paint engine: orb (cyan, ink rim, cream glyph, 5 invented glyphs), gold rim overlay
  (2.6 du soft + 1.1 du hot), ink tail (straight / curl; mock-up len 38 du), Returning Pages folded page (out cream / home pale, gold edges),
  Soul Lance capsule (glyph row, gold edges), Tempest torn page; `glyphSheet()`; `GLYPH_CAPS` (tails 40/28/0, rims 40/24/12);
  `glyphLook()` (tail curl from smoothed turn with hysteresis, straight under Calm; glyph stays upright). `GLYPH_K = 1.3` is PROVISIONAL
  (1.0x vs 1.3x gem-confusion check still to run).
- `frames.js`: glyph_ and page_ frames 64 -> 48 px; new glyph_rim 48, gtail_0/1 74x32 (anchor 44/46), lance_0 144x23 (anchor 172/176),
  gtorn 48. Atlas page stays 1024x640 (at the cap; S4 additions may push it over: re-check after merging S4).
- `atlas.js` (additive): KIND_OF.unshift glyph kinds, GLYPH_BAKE / GLYPH_KINDS / glyphRects / boltReady / bakeBoltArt (lazy, uses bakeKinds).
- `paint.js` (additive line): PAINTERS.glyph and flat_glyph = none (lazy bake paints them).

## Not done (next steps, in order)
1. Merge origin/dev (S4 touches atlas.js / frames.js / RunScene.js); re-check PACK.h <= 640.
2. RunScene.js: import bakeBoltArt/boltReady/glyphLook/GLYPH_*; pools uGlyph, uGlyphRim, uGlyphTail, uLance, uTorn (SUM_KEY); in the
   projectile loop (~line 1486) when `this.sumAtlas && boltReady()`: orb sprite (scale GLYPH_WPD*GLYPH_K*32/48 per texel, Low = flat_glyph,
   no tail), tail sprite rotated to heading (flipY per glyphLook, capped), rim overlay on evolved glyphs (cap), lance capsule replacing the
   line body (keep the faint wide body for real width), page frames for Pages (+ dotted curl dots home, ink tail out), torn page at the
   Tempest burst ring fx (`kind 'ring'`, color #7ff0ff, r 46) fading over 0.24 s. Call `bakeBoltArt(sa, evo)` when spirit_bolts is owned.
   Old path unchanged for `?summons=0`. Consider an additive self-light copy under the High bloom if contrast fails (as S1/S3).
3. Tests: tests/summon-glyph.test.mjs (frame list/sizes, no external refs in sheet, kinds, glyphLook hysteresis + Calm, caps).
4. scripts/s5-bolt.mjs (copy of s3-raven.mjs): shots, contrast (WL6), coverage, bake, plus a gem contact sheet (orb 1.0x vs 1.3x next to the
   mint gem, colour + greyscale + protan/deutan/tritan); keep the passing size, log as 'default, Matt may override'.
5. Gates: sweep wren/elias 24 byte-identical, pace.mjs, tests, build, screenshots docs/screenshots/summons/s5-*; LOCKED + QUEUE 'S5 BUILT'.
