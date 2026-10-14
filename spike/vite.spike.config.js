// Spike-only build (not the shipping game): npx vite build --config spike/vite.spike.config.js -> dist-spike/ (delete afterwards)
import { defineConfig } from 'vite';
export default defineConfig({ root: 'spike', base: './', build: { outDir: '../dist-spike', emptyOutDir: true, chunkSizeWarningLimit: 4000 } });
