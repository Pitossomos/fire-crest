import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Caminho relativo para funcionar no GitHub Pages (https://<user>.github.io/fire-crest/).
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
