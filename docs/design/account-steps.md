# Account steps for Matt (plain click-by-click). NOTHING HERE HAS BEEN DONE.
Status 2026-10-30. Docs only. Every step is yours to do (account/security settings are Matt-only per CLAUDE.md). Labels: OFFICIAL = vendor docs, COMMUNITY = forum/blog, UNVERIFIED = from memory, check the screen.
Menu names in Cloudflare and GitHub move around; if a button is not where written, search the page for the bold words.

## 0. Read this first: the three facts that matter
1. **Saves are tied to the web address (origin), not to the repo name.** A browser keeps localStorage per origin = scheme + host + port (OFFICIAL: MDN, "Same-origin policy" / Web Storage). The path after the host does NOT count.
   - GitHub Pages address `mattyjhillier-lab.github.io/hollowlight/` -> renaming the repo only changes the path. Origin stays `https://mattyjhillier-lab.github.io`, so saves in the same browser SURVIVE a repo rename.
   - Cloudflare address `hollowlight-12n.pages.dev` -> the project name is baked into the host. A new project means a new host = a NEW origin = **players see an empty game; saves do NOT carry over.** (OFFICIAL: Cloudflare says a *.pages.dev subdomain cannot be changed; to change it, delete the project and create a new one: developers.cloudflare.com/pages/platform/known-issues/.)
   - iPhone "Add to Home Screen" apps keep their own storage, separate from Safari (COMMUNITY/UNVERIFIED), so reinstalling there can also start empty. Tell testers to export first.
2. **Making the repo private very likely switches off GitHub Pages on the free plan.** See section C.
3. **Do none of this before the launch checklist is done.** The live site is an old build and the Release Gate stands. Renaming is cheap to do right BEFORE launch (few real players = few lost saves) and costly after.

Safety net for every step below: in the game, Settings (or the save screen) has **Export save** (file). Players with a save should export before the change and import after. You and any tester can do this in 1 minute. (Game feature exists: see LAUNCH-CHECKLIST / save export.)

---
## A. Protect "production" with Cloudflare Access (or alternatives)
### What Cloudflare actually protects (OFFICIAL, developers.cloudflare.com/pages/configuration/preview-deployments/)
- The built-in switch **Enable access policy** protects **preview deployments only**. It does NOT cover production, the `*.pages.dev` production address or a custom domain.
- Your `dev` branch build (dev.hollowlight-12n.pages.dev) IS a preview deployment, so that switch covers the test link. The `main` build (production) is not covered.
- Earlier you tried an Access gate and removed it (CLAUDE.md). Likely cause: the switch/app also caught the address players use, or the sign-in page blocked testers. Known issue (OFFICIAL, known-issues page): you cannot add a custom domain while an Access policy is already on that domain, and projects with a custom domain need an Access policy added manually.

### Option A1 (recommended, no change): leave production unlisted and noindex
Current state: no login, unlisted, noindex (robots.txt exists in /public). The test build is "private by obscurity" only. Fine for a game with no secrets; anyone with the link can play. Nothing to do.

### Option A2: gate the test link (dev preview) only - 2 minutes, free
1. Go to dash.cloudflare.com and sign in.
2. Left menu: **Workers & Pages**. Click the project **hollowlight**.
3. Click **Settings** (top tabs), then **General**.
4. Find **Access policy** (or "Enable access policy") and click **Enable access policy**. (OFFICIAL)
5. A Zero Trust window opens. Choose **Allow** policy; under Include pick **Emails** and type the testers' email addresses (including yours). Save.
6. Test in a private window: open dev.hollowlight-12n.pages.dev; you should be asked for an email and a one-time code.
7. To undo: same place, click **Disable access policy**.
Effect on saves: none (same origin). Effect on friends: they need a one-time code emailed to them each session (usually lasts about 24 hours; UNVERIFIED).

### Option A3: gate production itself (full lock-down)
Use only if you want the live address private until launch.
1. dash.cloudflare.com -> left menu **Zero Trust** (first use: pick a team name, choose the **Free** plan; it may ask for a payment card on file even though Free is $0 - UNVERIFIED, tell me before you enter any card; do not enter one if unsure).
2. **Access** -> **Applications** -> **Add an application** -> **Self-hosted**.
3. Application name: `Wispwick prod`. Domain: `hollowlight-12n.pages.dev` (leave path empty). If you later have a custom domain, add it as a second domain on the same app.
4. Add a policy: Action **Allow**, rule **Emails** = the people allowed. Save.
5. Test in a private window; then check phone browser too.
6. To open to the public at launch: Access -> Applications -> the app -> **Delete** (or edit the policy to **Bypass**, Everyone).
Cost: Free plan covers up to 50 users (OFFICIAL, Cloudflare Zero Trust pricing page; check the current number on screen). Risk: this is what you removed before; PWA installs and the service worker can show a sign-in page instead of the game when the session expires; only use before launch.

### Option A4: alternative with no Cloudflare login
Keep the repo public, stay unlisted (A1), and give testers the dev link only. Or share builds as a zip of dist/index.html (single file, plays offline) by email/Drive. No account settings change. Saves are per file location, so tell testers to use Export save.

---
## B. Rename repo and Cloudflare project to `wispwick`
Name rule: repo and live URL still say hollowlight on purpose (CLAUDE.md). Internal names stay: localStorage keys `hollowlight:*`, service-worker cache prefix `hollowlight-`, font family. DO NOT rename those; saves depend on them (public/sw.js, tests/brandname.test.mjs).

### What breaks (honest list)
| Thing | Effect of renaming | Fix |
|---|---|---|
| GitHub repo rename | Old git remote URLs still redirect (OFFICIAL, GitHub docs "Renaming a repository"). Open PRs and branches survive. Local clones keep working but should be repointed. | `git remote set-url origin https://github.com/mattyjhillier-lab/wispwick.git` |
| GitHub Pages address | `.../hollowlight/` stops working (no automatic redirect for Pages, COMMUNITY); new address `mattyjhillier-lab.github.io/wispwick/`. Same origin, so **saves survive**. | Update every link you gave out. |
| Service worker / PWA install on GitHub Pages | Worker scope is the old path; the new path is a new scope, installed apps at the old path would 404. Same origin so their storage is the same on desktop/Android; iPhone home-screen apps may start empty (UNVERIFIED). | Players reinstall from the new link; export first. |
| Cloudflare project rename | **Not possible**; must create a new project (OFFICIAL). New host `wispwick.pages.dev` (or `wispwick-xxx.pages.dev` if taken) = **new origin = empty saves for anyone who played on the old host.** PWA installs break the same way. | Export saves first; keep the old project alive for a few weeks with a banner-free redirect (see below). |
| Cloudflare Git link | The Git integration points at the repo; GitHub keeps the old name redirecting but the Cloudflare connection may need re-authorising (UNVERIFIED; check Builds after renaming). | Settings -> Builds -> Manage; reinstall the GitHub app on the renamed repo if shown red. |
| Branch protection, required check `test`, Dependabot, secret scanning | Stay with the repo (OFFICIAL: settings belong to the repo). Check once. | Settings -> Rules/Branches shows `main` still protected. |
| deploy.yml / ci.yml | Checked: no "hollowlight" string in .github/ or public/manifest.webmanifest, and vite `base: './'` makes the build work at any path. | Nothing to change in workflows; only docs/URL text. |
| Players' bookmarks, shared links, notes in docs/ and README/About | Old Cloudflare/GitHub Pages links die or change. | Update docs; email testers. |

### Safest order (do each, check, then continue)
1. Pick a quiet time. Make sure launch checklist is done or deliberately paused.
2. In the game on every browser/device you care about: **Export save** (file). Keep the files.
3. **GitHub rename first** (reversible): github.com -> repo **Settings** -> General -> **Repository name** -> type `wispwick` -> **Rename**.
4. On your PC: terminal in the project folder, run `git remote set-url origin https://github.com/mattyjhillier-lab/wispwick.git`, then `git fetch`.
5. Check CI: push nothing; open the Actions tab; re-run the last workflow. Check Settings -> Rules shows `main` protected and the `test` check required.
6. Check GitHub Pages (Settings -> Pages): new address shown. Open `https://mattyjhillier-lab.github.io/wispwick/` and confirm your save is still there (same browser). If not, import your exported file.
7. **Cloudflare new project** (only if you want the wispwick.pages.dev address): Workers & Pages -> **Create** -> **Pages** -> **Connect to Git** -> pick `wispwick` -> production branch `main`, build command `npm run build`, output `dist` (copy these from the old project's Settings -> Builds so they match). Deploy. Confirm the preview branch `dev` builds.
8. Open the new address; **Import save** from the file; confirm a run starts.
9. Keep the OLD Cloudflare project running until nobody uses it. Do NOT delete it first (deleting is permanent and loses its address). Later, delete: Settings -> scroll to **Delete project**.
10. Update docs/LAUNCH-CHECKLIST.md, CLAUDE.md URLs and the About page link (ask me; I will do the text edits).
Rollback: GitHub rename can be renamed back any time; old Cloudflare project is untouched until step 9.

### Optional soften: carry saves automatically across Cloudflare hosts
Not built. A one-time "move your saves" link between the old and new host would need code; note as a parked idea if many players exist. Pre-launch with few players, Export/Import is enough.

---
## C. Make the repo private
### What happens (verified from search results this session, not by trying it)
- **GitHub Pages on the Free plan only works for public repositories** (OFFICIAL: GitHub plans page lists Pages under public repos for Free; docs.github.com/en/get-started/learning-about-github/githubs-plans). Pages from a private repo needs a paid plan (COMMUNITY says Pro; OFFICIAL says org + Enterprise Cloud for private-visibility Pages sites).
- A GitHub Support Community reply says changing visibility disables the Pages site (COMMUNITY); one user reports it stayed up (anecdotal, may be old). Treat it as: **the live GitHub Pages site will probably go offline**, and the free 'CI + deploy to Pages' route stops working.
- Other free features change for private repos: branch protection and rulesets (including blocking admins/force-push) are **not available on free private repos** (COMMUNITY/UNVERIFIED, check current docs), secret scanning/push protection and Dependabot alerts may be limited (UNVERIFIED), Actions minutes are capped for private repos (OFFICIAL: free plan 2,000 min/month). Your current protected `main` + required check `test` could silently lose its protection. Check before flipping.
- **Cloudflare Pages is not affected by the repo being private**, as long as the Cloudflare GitHub app keeps access to it (OFFICIAL: Cloudflare Pages git integration supports private repos; manage under Settings -> Builds -> Manage). So the site can stay live on Cloudflare.
- Saves: unaffected on the Cloudflare host. On the GitHub Pages host the game disappears, so those players' saves are unreachable until the page returns (they remain in their browser).
### Recommendation
Do not make it private just to hide the code before launch if you rely on GitHub Pages and branch protection. Better: (1) keep repo public, (2) host the playable game on Cloudflare only, (3) turn off GitHub Pages first, then decide on private. If you still want private (e.g. unreleased art/prompts), the safe order is below.
### Steps (only after reading the recommendation)
1. Make sure Cloudflare is the only host you will use (production branch `main` builds fine there). Tell testers the new link first.
2. In the game, Export save on the GitHub Pages address (if anyone has saves there) and import on the Cloudflare address - saves do not carry over between hosts (different origin).
3. GitHub repo -> **Settings** -> **Pages** -> set Source to **None / unpublish** (so it does not break unannounced).
4. Settings -> General -> scroll to **Danger Zone** -> **Change repository visibility** -> **Make private** -> confirm by typing the repo name. (You re-enter your password: that is you only.)
5. Check: Settings -> Rules/Branches - is `main` protection still active? If a banner says "not available for private repositories", you have lost it: either go back to public or accept merging with care (never merge without checking tests).
6. Cloudflare: Workers & Pages -> project -> Settings -> Builds -> **Manage** under Git Repository; confirm access to the private repo; trigger a deploy.
7. Open the live Cloudflare address and run a game.
Rollback: Settings -> Danger Zone -> **Make public** (Pages may need re-enabling and a fresh commit).
GitHub also says forks of a repo become detached when the repo goes private (OFFICIAL, GitHub docs on changing visibility); you have none that matter.

---
## D. Self-review (gaps found and fixed)
- Gap fixed: origin vs path. First draft treated both renames as losing saves; correct answer is GitHub rename keeps saves (same origin), Cloudflare rename loses them (new host). Stated up top.
- Gap fixed: Cloudflare Access covers previews only; production gating needs Zero Trust app. Both written, with the previous-failure warning.
- Gap: free-plan card requirement for Zero Trust, Pages-after-private behaviour, branch protection on private free repos, and Cloudflare re-linking after a repo rename are UNVERIFIED; marked inline, check the screen before acting and stop if it says Pay.
- Gap: iOS home-screen storage separation is UNVERIFIED; the Export/Import fallback covers it.
- Checked by search: no repo name hard-coded in .github/ or the manifest. public/sw.js uses the internal `hollowlight-` cache prefix (kept on purpose).
- No account setting was changed, nothing performed.

## E. Questions for Matt
1. Do you want production gated before launch? A1 leave as is (recommended), A2 gate the dev test link only, or A3 gate production?
2. Rename: do it BEFORE launch (recommended, few players, saves loss small) or after? And rename GitHub only (saves safe) or also create a new Cloudflare project (saves reset)?
3. Private repo: still wanted? Recommended: no, keep public and use Cloudflare; if yes, I should first read the current plan limits on your screen with you.

Sources: developers.cloudflare.com/pages/configuration/preview-deployments/ (OFFICIAL), developers.cloudflare.com/pages/platform/known-issues/ (OFFICIAL), docs.github.com/en/get-started/learning-about-github/githubs-plans (OFFICIAL), github.com/orgs/community/discussions/22817 and github.community thread 10574 (COMMUNITY), MDN Web Storage / same-origin (OFFICIAL).
