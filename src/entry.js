// Boot switch. ?specimen=1 shows the dev type specimen (fonts + tokens proof); ?kit=1 shows the Lantern Glass UI kit (U2). Neither starts the game, the save or the sim.
import { installBootGuard, errText } from './ui/bootguard.js';
const q = new URLSearchParams(window.location.search);
if (q.get('specimen') === '1') import('./ui/specimen.js').then((m) => m.mountSpecimen(document.body));
else if (q.get('kit') === '1') import('./ui/kitpage.js').then((m) => m.mountKit(document.body));
else {
  // PWA-FIX: a visible message (with Try again / Repair) instead of a blank screen if the title never appears
  const guard = installBootGuard(window, document, typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '');
  import('./main.js').catch((e) => { guard.errors.push(errText(e)); });
}
