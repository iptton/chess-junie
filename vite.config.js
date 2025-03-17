import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    'https': false,
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
      output: {
        assetFileNames: (assetInfo) => {
          // Keep WASM files at the root level instead of in assets directory
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        output: {
          assetFileNames: (assetInfo) => {
            // Keep WASM files at the root level instead of in assets directory
            if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
              return '[name][extname]';
            }
            return '[name]-[hash][extname]';
          }
        }
      }
    },
  },
  optimizeDeps: {
    exclude: ['stockfish'],
  },
  assetsInclude: ['**/*.wasm'],
});
