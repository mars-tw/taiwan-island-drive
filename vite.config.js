import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5178 },
  preview: { host: '0.0.0.0', port: 5178 },
  build: { chunkSizeWarningLimit: 700, rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules/three/')) return 'three'; } } } }
});
