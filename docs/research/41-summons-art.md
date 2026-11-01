# 41. Summons art: how to make friendly summons read in a swarm (short)

Date 2026-10-20. For design sheet #3 (`docs/design/summons-art-v1.md`). Labels: OFFICIAL / COMMUNITY / OPINION / MEASURED (our build).

## What comparable games do
- Vampire Survivors offers a 'Flashing VFX' toggle plus damage-number and screen-shake options; players report late endless-mode screens becoming unreadable from weapon effects and ask for an effects-visibility slider (COMMUNITY: vampire.survivors.wiki Options page; Steam discussion, Nov 2024). Lesson: weapon effects are the main clutter source in the genre; budget them from the start.
- Soulstone Survivors has a weapon-FX visibility setting (COMMUNITY, Steam discussion). Lesson: a per-effect opacity cap is a known, accepted fix; ours is the combat clarity rule + tier caps.
- One survivors-like patch note (game not identified in the search, so not attributed) fades allied and own summons at high clutter while keeping the character and threats in the foreground (COMMUNITY, SteamDB patch notes). Same idea as our DR3 threat hierarchy, extended to summons.
- Earlier Hollowlight research already set the rules this sheet builds on: summons brighter than enemies, one signature light colour per weapon, an impact shape 2-3x the body, every cast lights the ground (docs/research/15, OPINION/house rules); one additive halo per spirit, batched (docs/research/06).

## Measured in our build (HEAD 25efa05, `docs/mockups/summons-art/audit.mjs`)
- Summon sprites are the old style-B pipeline (posterised, 1 px outline) while heroes and Husks are painted Style v1: the one inconsistent art family left.
- Ghost wolf body ~25 px vs Fell Wolf ~52 px; raven 12x10 units; orbit flame ~10 px visible: summons are the smallest creatures on screen.
- Evolution looks are mostly generic white strokes (rings, beams, splats); Thunder Judgment pillars reach the HUD band; Light Trails draws a screen-wide line web.

## Design takeaways (OPINION, applied in summons-art-v1)
1. Separate friend from foe by VALUE (light bodies vs dark Husks) before hue; it survives colour-blind sims and night.
2. One shape grammar per weapon (bite crescents, peck star, ink spatter, crack-star, flame flare) instead of white flashes.
3. Evolutions keep the creature and add ONE signature change + the gold rim, so the player recognises 'my wolves, upgraded'.
4. Cap friendly coverage near the hero (tier caps, clarity rule) and keep effects under numbers.

Sources: [vampire.survivors.wiki Options](https://vampire.survivors.wiki/w/Options), [Steam: Vampire Survivors discussion](https://steamcommunity.com/app/1794680/discussions/0/4631482569784862180), [Steam: Soulstone Survivors discussion](https://steamcommunity.com/app/2066020/discussions/0/3591086730691827584), [SteamDB patch notes (unattributed game)](https://steamdb.info/patchnotes/15212284).
