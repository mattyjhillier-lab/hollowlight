# CHK resume (2026-11-14, branch wip/chk, not merged)

DONE
- Elias ability symbol: he DID have one (thin sun/halo, read as a ship's wheel). Redrawn as a solid brass three-candle candelabra (src/ui/hudsvg.js 'sanctuary'); hero cards now show each hero's ability emblem (heroView.abilityId, title.js); test added (tests/title.test.mjs). Shots: docs/screenshots/chk/before-* / after-*.
- Ground-bland: harness scripts/chk-ground.mjs, data docs/screenshots/chk/ground-*.json + jpgs (normal static, normal roam, brighter roam, gentle roam). Findings: life map only lights a lantern-sized trail (~90 cells static, ~500 roaming of 65k), decays 25 s. Ground luma/chroma are flat until ~8:00 (chroma 34->37, luma 80->90, arc ambient Y 0.03->0.08); real change only from 10:00 (Y 0.14), vivid at 14:00 (chroma 53, luma 137). So the dark deep-dusk ARC (arc.js, locked visibility-arc) not the life map causes it. Brighter lifts chroma ~+15%. Gentle Light = no visual difference.

REMAINING
- Write 3 options (recommended first), no look change yet: (A) pull ARC ambient/sat rows 300-600 s earlier/up; (B) longer life-map decay or wider trail stamps; (C) Brighter default on desktop. Needs Matt's pick.
- T1 synthetic tree test fails under CPU load only (passes alone); re-run npm test when quiet. Audit: 0 vulns.
