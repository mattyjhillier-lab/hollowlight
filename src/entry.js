// Boot switch. ?specimen=1 shows the dev type specimen (fonts + tokens proof) and never starts the game, the save or the sim.
const specimen = new URLSearchParams(window.location.search).get('specimen') === '1';
if (specimen) import('./ui/specimen.js').then((m) => m.mountSpecimen(document.body));
else import('./main.js');
