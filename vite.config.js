import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Stamps public/sw.js (copied to dist) with package version + hash of the built index.html, so every changed build
// gets a new cache name and the browser sees a new service worker.
function stampServiceWorker() {
  return {
    name: 'stamp-sw',
    apply: 'build',
    writeBundle(opts) {
      const out = opts.dir || 'dist';
      const sw = out + '/sw.js', idx = out + '/index.html';
      if (!existsSync(sw) || !existsSync(idx)) return;
      const id = createHash('sha256').update(readFileSync(idx)).digest('hex').slice(0, 10);
      writeFileSync(sw, readFileSync(sw, 'utf8').replace('__SW_VERSION__', `${pkg.version}-${id}`));
    },
  };
}

// Single-file build so the whole game can be opened or hosted as one page.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [viteSingleFile(), stampServiceWorker()],
  build: { chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 },
});
