# Private hosting for Wispwick (free)

Status 2026-10-28: the game is PRIVATE and NON-COMMERCIAL (LOCKED). Today it is on public GitHub Pages: anyone with the link can play, and the repo/source is public. Done already: `noindex` meta + `robots.txt` (asks search engines not to list it; not a lock).

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
