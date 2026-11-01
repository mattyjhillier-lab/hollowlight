import { launch } from './u3-lib.mjs';
const c = await launch(9377);
await c.open('http://localhost:4181/', 1280, 720, 2, false);
await c.ev("document.querySelector('.u3-h1').scrollIntoView()");
await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false });
const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 320, y: 40, width: 640, height: 150, scale: 2 } });
(await import('node:fs')).writeFileSync(process.argv[2], Buffer.from(r.data, 'base64'));
c.close();
