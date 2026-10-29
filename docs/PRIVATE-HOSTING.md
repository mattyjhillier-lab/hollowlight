# Private hosting for Wispwick (free)

Status 2026-10-28: the game is PRIVATE and NON-COMMERCIAL (LOCKED). Today it is on public GitHub Pages: anyone with the link can play, and the repo/source is public. Done already: `noindex` meta + `robots.txt` (asks search engines not to list it; not a lock).

## STATUS 2026-10-29: LIVE (see LOCKED 'PRIVATE HOSTING LIVE')
Pages project `hollowlight` built from the repo; stable test link https://dev.hollowlight-12n.pages.dev (dev branch). Access email gate was tried and removed (nobody else plays until launch). Production address still serves the old build until the launch merge. Phone install/offline checked OK.

## The real lock (Matt does these account steps; nothing here needs a secret in the repo)
Cloudflare Pages (free) + Cloudflare Access (free for up to 50 users) can hide both the game and, if the repo is private, the source.
1. Create a free Cloudflare account (turn on 2FA).
2. Workers & Pages -> Create -> Pages -> Connect to Git -> authorise ONLY the `hollowlight` repo (read access).
3. Build settings: framework none; build command `npm run build`; output directory `dist`; production branch `main` (preview branch `dev` is fine for testers).
4. Zero Trust -> Access -> Applications -> Add -> Self-hosted: pick the Pages domain; policy Allow = the email addresses of friends you invite (one-time PIN by email, no passwords).
5. Test in a private window: you get the email gate. Send friends the Cloudflare link instead of the GitHub Pages link.
6. Only AFTER that works: make the GitHub repo private (Settings -> General -> Danger zone -> Change visibility). Public GitHub Pages then stops working (private-repo Pages needs a paid plan), which is expected. Branch protection and CI settings stay.
7. Optional: rename the repo to match the game (Settings -> General -> Repository name); update the Cloudflare connection; GitHub redirects old links.

## Notes
- Saves live in each player's browser, so a new web address means a fresh save: export from the old address first (Settings -> Save -> Export), import on the new one.
- Do not put API tokens in the repo. Cloudflare's Git connection needs none.
- Until step 6, treat the GitHub Pages address as public.

## Making the installed app (PWA) work behind Cloudflare Access
Why: the browser fetches the install files without your login cookie, so the Access redirect can break "Add to Home Screen" (plain icon, wrong name, or no install prompt) and the service worker update check. Fix = let ONLY these public files bypass the gate (they contain no secrets):
1. Zero Trust -> Access -> Applications -> Add -> Self-hosted, one app per path on the SAME Pages domain: `/manifest.webmanifest`, `/sw.js`, `/favicon.svg`, and each icon (`/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`, `/apple-touch-icon.png`, `/favicon-32.png`, `/favicon-64.png`, `/icon-128.png`). (A wildcard like `/icon-*` is fine if the dashboard allows it.)
2. Policy for each: Action = Bypass, Include = Everyone. More specific paths win over the main app.
3. Leave the game page (`/` and everything else) behind the email gate.
4. Test on a real phone: open the link in Safari/Chrome, sign in once, then Add to Home Screen / Install app; open the installed app, switch to airplane mode, relaunch (it should open offline).
Facts: the manifest uses relative paths (`start_url ./`, `scope ./`), so it works on any host or sub-path. iPhone: the home-screen app has separate storage from Safari, so export/import a save when switching between them. The Access login lasts 24 hours by default; raise it to 30 days in the Access app settings (Session duration) so testers are not asked every day.
