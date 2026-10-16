// Boot switch. ?specimen=1 shows the dev type specimen (fonts + tokens proof); ?kit=1 shows the Lantern Glass UI kit (U2). Neither starts the game, the save or the sim.
const q = new URLSearchParams(window.location.search);
if (q.get('specimen') === '1') import('./ui/specimen.js').then((m) => m.mountSpecimen(document.body));
else if (q.get('kit') === '1') import('./ui/kitpage.js').then((m) => m.mountKit(document.body));
else import('./main.js');
