import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Geliştirme: önce PHP sunucusunu başlatın (npm run dev:php), sonra npm run dev.
const php = 'http://127.0.0.1:8081';

export default defineConfig({
  root: 'web',
  base: './',
  publicDir: fileURLToPath(new URL('./assets', import.meta.url)),
  plugins: [react()],
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
