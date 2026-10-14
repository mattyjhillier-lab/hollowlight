# 03 Summons AI, pickups, meta-progression

Labels as in 01. Most items here are OPINION/RECALLED; sources noted where verified.

## Summon AI design (OPINION, standard genre practice)
| Rule | Why |
|---|---|
| Leash radius from player (~120-180 px at 640x360) | prevents "zipping around" off-screen, Matt feedback #4 |
| Target selection: nearest unclaimed enemy per summon; claim set refreshed every 0.3-0.5 s | wolves attack different targets (done) |
| Attack = commit + recover (windup 0.15s, strike, 0.4-0.8s recover) | readable, can't DPS-cheat by zipping |
| Cap per-summon speed (max ~1.6x player speed) and per-target damage tick (internal cooldown 0.25-0.4s) | stops stampede scaling with count |
| Summon count scales sub-linearly: each extra summon +60-70% of previous DPS contribution via ICD/target sharing | Spirit Hunters/VS "amount" stat is the most abused stat |
| Summons not killable OR respawn on timer (4-8 s) | avoids a managing-minions chore |
| Evolutions that change behaviour: leap/pin (wolves), orbit->spiral/shockwave, chain->forking, bolts->homing barrage | Evolve = new verb, not x2 numbers |
Spirit Hunters: up to 4 abilities + 5 pets; pets are passive companions; skill cap 25 (https://seasonedgaming.com/2023/07/21/review-spirit-hunters-infinite-horde-unending-spirit/) COMMUNITY.

## Healing and magnet drops
| Item | Finding | Label |
|---|---|---|
| VS floor chicken | Rare floor heal (~30 HP, rarer with Luck); plus Regen passives and Hollow Heart max HP (RECALLED) | RECALLED |
| VS magnet | Rare floor pickup, pulls all gems; gem cap 400-500 with merge into red gem | OFFICIAL wiki https://vampire-survivors.fandom.com/wiki/Experience_Gem |
| Soulstone | Curse tier can LIMIT healing - healing is treated as a difficulty knob | COMMUNITY https://rogueliker.com/soulstone-survivors-review |
| Brotato | Health only from regen/lifesteal/harvest, consumable fruit; no heart pickups in standard design | OFFICIAL |
Recommended: heart heal 25-30% max HP, average one per ~75-100 s on normal, pity timer at 2.5 min no heart. Magnet: ~one per 90-120 s, plus swarm-event guaranteed drop optional. Bosses drop both (current design OK). Heart rate should drop on higher tiers (Soulstone-style curse lever).

## Meta-progression
| Game | Design | Label/Source |
|---|---|---|
| Soulstone Survivors | Skill tree spending soul gems for permanent stats across all chars; complaint: meta bonuses irrelevant in late game, lacking growth feeling; 2024 rework stretched tree per character | COMMUNITY (Steam threads on https://steamcommunity.com/app/2066020/discussions/0/4355617604372911098) |
| Death Must Die | Early access criticised for little meta beyond gear; dev: content takes time; trade-off option "more relics at cost of stronger Death legions" = risk/reward dial | COMMUNITY https://steamcommunity.com/app/2334730/discussions/0/4036976577922761705 |
| Spirit Hunters | Oracle permanent upgrades; complaint: +1% increments feel unimpactful | COMMUNITY (seasonedgaming) |
| Halls of Torment | Agony as player-chosen difficulty with XP reward scaling | OFFICIAL primagames |
| Brotato | Danger levels unlocked by winning; each tier adds flat % + new mechanic; no stat meta | OFFICIAL |
| 20MTD | Darkness levels only in standard mode, unlocked by progress; scale spawn batch/interval, not cap | OFFICIAL wiki |

### Recommendations (OPINION)
| Topic | Recommendation |
|---|---|
| Node size | First 10-15 nodes noticeable (+5-10% each or a new verb: reroll, banish, revive); avoid +1% nodes |
| Total meta power | Whole tree maxed <= +35-45% effective power vs fresh, so skill still decides win |
| Power vs difficulty | Pair every power tier with a difficulty tier: Curse 1-5 (Brotato-style +12/26/40 + one mechanic each) |
| Curse/tier rewards | Each tier +15-25% gold and shards (Halls of Torment: risk -> reward) |
| Gold sinks | Cost curve ~1.3-1.5x per tier; early node ~100 gold, run yields ~150-300 gold at start |
| Shards from bosses | Boss 1 first kill big, repeats small, to keep 1st clear exciting without farming |
| Verbs over stats | Reroll/banish/revive/starting-weapon unlocks give variety; pure stats give flatness |
