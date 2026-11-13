# Lucinda and Ophimber: look options v2 (design sheet, NOT locked)

The first six options (v1: Hearth Mantle / Stoker / Wick Hood; Hatchling / Shoulder Wyrmling / Kettle Drake) were REJECTED by Matt: none matched the locked pick. This sheet replaces them and takes three different variations ON the locked brief (H-A Hybrid Hearth-Warden, docs/design/new-weapon-hero-v1.md section 4).

Sandbox: `C:\Users\matty\spirit-lucinda-sandbox\index.html` (switcher, pose idle/walk/ability, Night/Calm/Swarm/Stand-ins, size/glow sliders, Copy settings, reserved-colour check). Shots in `...\spirit-lucinda-sandbox\shots\`: main.png, perched-B-w.png, ability-C-b.png. Wren/Elias/Wyrm in the sandbox are rough stand-ins for scale.

## Fixed by the brief (all options)
Lucinda: female dragon-kin, P1 chibi, small curled horns, short tail with a rose-gold leaf tip, ember scale freckles on cheeks and forearms, hooded scale-hide cloak of overlapping plates whose hem ends in a tail-point, accent rose-gold #ef8a5a, small hearth flame in her hand (light, not a body colour). Silhouette: pointed hood + thin tail line + pet on shoulder ("triangle with a flick"). Ophimber: ember wyrmling, a real baby dragon about the size of a loaf, snout, curled horns, tail with ember tip, tiny bat wings, gold-cream belly, ember spots; follows 26 px behind, perches on her shoulder when still, hovers above her in the ability. All six pass the sandbox colour check (reserved gold/role colours, contrast 1.6 day / 1.4 night, distance 45+ from enemy greys); the rose-gold accent, ember spots and scale tail are the brief's own colours and are excluded from the role-colour warning (they sit near the enemy rim colour by design, used only as small trim).

## Lucinda: three takes (horn / hood / tail variations)
- **A Curl-Horn Hood (Recommended).** Medium pointed hood swept back, small forward-curl horns through the hood, rose-brown plate cloak, short tail with a leaf flick, hem point trailing behind. Closest to the brief word for word; reads as a small triangle with a flick at game size. Risk: rose-brown is the quietest palette of the three; horns are small so they vanish at phone size unless the Lucinda scale is bumped.
- **B Swept-Horn Long Hood.** Tall hood whose tip itself flicks back like a tail, long swept-back horns, bronze-olive plates, longer tail and longer hem point. Strongest silhouette and the most dragon. Risk: tallest sprite (hit-box and camera budget), bronze is close to evolution gold in feel (checked clear numerically), the hood tip can be mistaken for the tail.
- **C Ram-Horn Wide Hood.** Wider, shorter pointed hood, spiral ram horns outside the hood, slate-teal plates, tail curled up high like a question mark. Cutest and most readable horns. Risk: teal is nearest to Wren's blue tunic, and the wide hood loses some of the "triangle".

## Ophimber: three takes (stance / wing / snout variations)
- **1 Loaf Hatchling, four legs (Recommended).** Round loaf body, four stub legs, short blunt snout, two small curled horns, tiny wings, ember-tipped tail; trots and hops 26 px behind, curls on her shoulder when still. Friendliest and clearly a baby dragon at 3.4x. Risk: at true 1x size he is about 14 px and the detail is the horns and tail ember only; the wings blur.
- **2 Upright Wyrmling, two legs.** Stands upright on hind legs with a long neck, medium snout, mid-size wings; bobs as he follows, grips her shoulder when perched. Most character and the best head read. Risk: taller than a loaf, and the neck can look like a lizard at phone size.
- **3 Wyvern Crawler, wing-arms.** Low and long, long snout, wings are the forelimbs and open wide, arrow-tip ember tail. Most obviously "dragon" because of the wing span. Risk: flat and wide in motion, and the spread wings clutter near her shoulder.

## Questions for Matt
1. Lucinda look? A Curl-Horn Hood (Recommended) / B Swept-Horn Long Hood / C Ram-Horn Wide Hood.
2. Ophimber look? 1 Loaf Hatchling (Recommended) / 2 Upright Wyrmling / 3 Wyvern Crawler.
3. Tweaks (size, colour, horn length)? Tune in the sandbox, Copy settings, paste back.

Weak spot to fix once picked: at true 1x Ophimber is small by design; if it does not read on a real phone, scale him up (sandbox slider "Ophimber size", default 1.3).

Fit check: locked H-A brief, warm flame as light, own silhouette vs Wren (hood and wolf ears) and Elias (tall coat). Mechanical sense: visual follower, rises in her ability; no sim change. Security check: docs only, no deps, no network.
