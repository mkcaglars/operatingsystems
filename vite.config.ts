import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

// Geliştirme: önce PHP sunucusunu başlatın (npm run dev:php), sonra npm run dev.
const php = 'http://127.0.0.1:8081';

// Görev dosyalarındaki örnek çözümler (test_cozum) yalnızca testler içindir; tarayıcıya gönderilmez.
function stripTestSolutions(): Plugin {
  return {
    name: 'gorev-cozumlerini-cikar',
    enforce: 'pre',
    transform(code, id) {
      if (!/content[\\/]tasks[\\/][^\\/]+\.json$/.test(id)) return null;
      const obj = JSON.parse(code);
      delete obj.test_cozum;
      return { code: JSON.stringify(obj), map: null };
    },
  };
}

// Hangi görsellerin mevcut olduğu derleme sırasında listelenir; olmayan görsel için istek atılmaz (404 yok).
function imageManifest(): Plugin {
  const id = 'virtual:gorseller';
  return {
    name: 'gorsel-listesi',
    resolveId: (x) => (x === id ? '\0' + id : null),
    load(x) {
      if (x !== '\0' + id) return null;
      let files: string[] = [];
      try {
        files = readdirSync(fileURLToPath(new URL('./assets/gorseller', import.meta.url))).filter((f) => /\.(webp|png|jpe?g)$/i.test(f));
      } catch {
        /* klasör yok */
      }
      return `export default ${JSON.stringify(files)};`;
    },
  };
}

export default defineConfig({
  root: 'web',
  base: './',
  publicDir: fileURLToPath(new URL('./assets', import.meta.url)),
  plugins: [stripTestSolutions(), imageManifest(), react()],
  resolve: {
    alias: { '@content': fileURLToPath(new URL('./content', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
  },
  server: {
    proxy: {
      '/api': php,
      '^/[a-z-]+\\.php': php,
    },
  },
});
