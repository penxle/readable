import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';
import { css } from './src/vite/css';

export default defineConfig({
  plugins: [
    svelte(),
    icons({
      scale: 1,
      compiler: 'svelte',
    }),
    css(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '../../apps/api/src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    lib: {
      name: 'Readable',
      entry: './src/script.ts',
      fileName: () => 'script.js',
      formats: ['umd'],
    },
    rollupOptions: {
      external: [/^\$app\//],
      output: {
        globals: {
          '$app/stores': '{}',
          '$app/navigation': '{}',
        },
      },
    },
  },
});
