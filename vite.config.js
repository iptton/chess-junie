import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    'https': true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['stockfish'],
  },
  assetsInclude: ['**/*.wasm'],
});
