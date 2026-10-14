import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build so the whole game can be opened or hosted as one page.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 },
});
