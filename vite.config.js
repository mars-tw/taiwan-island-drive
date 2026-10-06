import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig(({ mode }) => ({
  base: './',
  server: { host: '0.0.0.0', port: 5178 },
  preview: { host: '0.0.0.0', port: 5178 },
  build: { outDir: mode === 'native' ? 'dist-native' : 'dist', chunkSizeWarningLimit: 750, rollupOptions: { input: { home: resolve('index.html'), car: resolve('car/index.html'), train: resolve('train/index.html'), flight: resolve('flight/index.html') }, output: { manualChunks(id) { if (id.includes('node_modules/three/')) return 'three'; } } } }
}));
