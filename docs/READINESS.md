# Ready-to-build checklist (the "GO" gate)

Goal (Matt): once all research is in and everything is ready, we just GO and build, in order, with checkpoints but without re-deciding things.

## Gate 1: research complete (Claude/agents)
- [x] Balance, hosting/saves, art/wow, audio, bosses/enemies, mobile/perf, art-pack licences, UI/visual style, stylised 3D, Spirit Hunters reference, AI art pipeline (docs/research/00-20)
- [~] 3D proof (spike-3d): real 3D vs pre-rendered, life-map prototype
- [~] Polished 2D cartoon mock-ups (P1/P2)
- [~] Summons and evolution design review (docs/research/18)
- [~] Best-tools research (docs/research/21)
- [~] Skill tree v1 build (data, logic, save, node web)

## Gate 2: decisions (Matt, using one Decision Sheet that Claude prepares with a recommended answer for each)
1. Art family and look: 3D (real or pre-rendered) vs polished 2D cartoon; palette; UI personality
2. Bible: approve/edit heroes, spirits, enemies, chapter list, renames, tone
3. Name: final check of "Hollowlight: Spirits of the Dusk" (clash risk)
4. Game design: Elias evolution rule, new verbs for Howling Legion/Pouncing Pack, summon mastery idea, life-map gameplay link (yes/no), boss length
5. Hosting and privacy: private repo + Cloudflare vs stay public; tester access
6. AI art: which models/tools, licences OK, disclosure plan
7. Tools: approve the starter toolkit (installs/downloads Matt must approve)

## Gate 3: foundations ready (Claude)
- [ ] Master Build Plan v2 (supersedes docs/BUILD-GUIDE.md): ordered phases, owner per step, acceptance criteria, screenshot/fps checks, security + fit checks, token/model plan
- [ ] Decision Sheet (single page, recommendations pre-filled)
- [ ] Creature design sheets approved (hero, boss, signature spirits)
- [ ] Asset licence log + CREDITS files set up
- [ ] CI checks on dev (tests, build, audit) and PR template
- [ ] Phone test device/viewport plan

## GO
When Gates 1-3 are ticked: Matt says "GO". Claude then runs phases in order. Each phase ends with: tests green, security + fit check, screenshots/fps numbers, a PR to main, Matt playtests, merge. No new big decisions mid-phase (they go to docs/QUEUE.md).
