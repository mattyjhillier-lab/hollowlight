# Build plan (draft for Matt's approval)

Each step ends with: tests pass, bot run, Matt playtests, he says go. Nothing parked starts without him.

## 0. Setup (one-off, ~30 min, step-by-step help)
- Install Node LTS + Git. `git init`, commit current project.
- Create **public** GitHub repo, push. Deploy workflow (see `research/05-hosting-and-saves.md`), enable Pages -> Actions.
- Pick final URL now (saves are tied to it). Result: playable link that updates on every push.

## 1. Balance pass (research -> game)
Targets from `research/00-SUMMARY.md` (opinion-based, tune with bot):
- Level-ups 38-45/run; first evolution median ~5:30 (now ~4:00).
- Evolution = 1.8-2.3x maxed base AND a new behaviour; never >3x. Review all 11 one by one.
- Scale enemy HP/damage only, not speed; cap ~200 alive; extra swarms at 300s/600s.
- Bot win rate: random picks 15-25%, focused 45-60% (now ~100%).
- Check heart/magnet frequency.
Output: changed JSON + before/after bot table. Matt playtests.

## 2. Save system
- localStorage, versioned JSON, migration chain, backup slot, `navigator.storage.persist()`, prefixed key.
- Export/import save file buttons. Gold + shard banking. Results screen.
- Unit tests for migrations and corrupt saves.

## 3. Skill tree v1 (~60 nodes)
- Data-driven JSON, greyed-out locked nodes with unlock conditions, reroll/banish, Summoner/Magic branches, ability cooldown.
- Whole tree capped at ~+40% power; fewer bigger nodes. Design for 500+ later.

## 4. Art pass
- Free CC0 16x16 packs; verify licence for each; keep a CREDITS file. Replace generated textures.

## 5. Polish + release
- Sound (CC0), pause/settings, tutorial text, performance check, itch.io optional.

## Parked (not started)
Weapon combining, boss chests, items/passives, chapters 2-8, 8 more characters, prestige, touch, codex.
