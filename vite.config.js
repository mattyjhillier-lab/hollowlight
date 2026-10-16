import { defineConfig } from 'vite';
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

// Inlines the built JS and CSS into dist/index.html so the whole game is one page. Replaces vite-plugin-singlefile, whose
// micromatch -> braces dependency has an open advisory (GHSA-vfj7-8cjw-p6xm) with no fixed release. Same output, no extra deps.
function inlineSingleFile() {
  const esc = (f) => f.replaceAll('.', '\\.');
  return {
    name: 'inline-single-file',
    apply: 'build',
    enforce: 'post',
    config(config) {
      const b = (config.build ||= {});
      b.cssCodeSplit = false; // one CSS file to inline
      b.assetsDir = ''; // bundle files at dist root so index.html references them by bare name
      const out = ((b.rollupOptions ||= {}).output ||= {});
      out.inlineDynamicImports = true; // one JS chunk
    },
    generateBundle(_o, bundle) {
      const names = Object.keys(bundle);
      const del = [];
      for (const hn of names.filter((n) => /\.html?$/.test(n))) {
        let html = bundle[hn].source;
        for (const f of names.filter((n) => /\.[mc]?js$/.test(n))) {
          const code = bundle[f].code;
          if (code == null) continue;
          del.push(f);
          const body = code.replace(/"?__VITE_PRELOAD__"?/g, 'void 0').replace(/<(\/script>|!--)/g, '\\x3C$1').trim();
          html = html.replace(new RegExp(`<script([^>]*?) src="(?:[^"]*?/)?${esc(bundle[f].fileName)}"([^>]*)></script>`), (_, a, c) => `<script${a}${c}>${body}</script>`);
        }
        for (const f of names.filter((n) => /\.css$/.test(n))) {
          del.push(f);
          const css = String(bundle[f].source).replace('@charset "UTF-8";', '').trim();
          html = html.replace(new RegExp(`<link([^>]*?) href="(?:[^"]*?/)?${esc(bundle[f].fileName)}"([^>]*)>`), (_, a, c) => `<style${a}${c}>${css}</style>`);
        }
        bundle[hn].source = html;
      }
      for (const f of del) delete bundle[f];
    },
  };
}

// Single-file build so the whole game can be opened or hosted as one page.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [inlineSingleFile(), stampServiceWorker()],
  // Dev server: only watch what the game loads. docs/ holds ~150 mockup .html files and screenshots that agents write while Matt
  // plays; any change there made the dev server full-reload his open game page.
  server: { watch: { ignored: ['**/docs/**', '**/scripts/**', '**/tests/**', '**/dist/**', '**/.claude/**', '**/*.log'] } },
  build: { chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 },
});
