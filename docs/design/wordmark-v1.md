# Wordmark v1: three takes (checklist item 18)
Mock-up: docs/mockups/wordmark/index.html (?take=a|b|c). Screenshots: docs/screenshots/wordmark/ (take-a, take-b, take-c). All code-drawn SVG; subtitle uses system-safe Trebuchet/Segoe UI, no fonts or assets downloaded. Nothing in src/ changed.

| | A. Brass Lantern (RECOMMENDED) | B. Hollow Blue, Two Lit Lanterns | C. Spirit Trail |
|---|---|---|---|
| Concept | Chunky brass letters, lantern Os with live flames, candle I, thread-and-knot underline. This is the in-game wordmark, polished. | Word drained blue-grey like the Hollow; only the two lantern Os are alive and their warm light bleeds into neighbouring letters (colour returns). | Slim cream letters, ring-lantern Os, a glowing spirit thread swooping under the word to a wisp. |
| Lantern/glow use | Flames + warm halo + brass rim light | Warm glass vs cold frame; warm tint spreads to letters | Ring lanterns + long trail (Style v1 trails) |
| 32px icon | Single lantern: reads well | Lit lantern in blue tile: reads well | Ring + trail: weakest, ring only |
| 120px phone | Strong (fat letters) | OK, cool letters lose contrast | Weakest (thin strokes) |
| Dark / light bg | Both good | Dark: moderate; light: good | Dark good; light needs outline, ok |
| Share 1200x630 | Strong | Strongest story, lower punch | Elegant, quiet |

Fit check: all three keep tinted outlines, soft rim light, warm lantern on cool blue, restraint (one glow idea each), gold only as brass/flame (no evolution-gold misuse). Mechanically they are static art; no gameplay link. A also matches the existing UI glass/brass kit and favicon.svg lantern, so icons and wordmark stay one family; B is the most on-concept for "colour returns" but weakest at small sizes; C is closest to trails but least legible.

Recommendation: A (fastest, most legible at 32/120px, already consistent with the build); optionally borrow B's warm bleed on the letters nearest the Os as a later polish.

Decision for Matt: pick A/B/C; then build chunk = swap kit.js wordmark(), regenerate icons (public/*.png/svg) and share image, tests/screenshots.
Security: no deps, no assets, no user input.

## Update 2026-10-28: relettered for WISPWICK (name locked)
Option A style kept (chunky brass, tinted outline, rim light, thread underline). WISPWICK has no O, so the lantern mark moved: a small brass lantern now hangs from the thread under the word. Both Is are candles; the first has a small detached wisp floating off its flame, the second has a wick curl. New skeletons S, P, C, K in src/ui/kit.js `wordmark()`. Subtitle 'Spirits of the Dusk' unchanged. Screenshots: docs/screenshots/brand/. Fit: same family as the lantern UI kit; one glow idea (flames). Taste call (candle-Is vs other motif) is Matt's at review.
