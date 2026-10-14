import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Single-file build so the whole game can be opened or hosted as one page.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [viteSingleFile()],
  build: { chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 },
});
