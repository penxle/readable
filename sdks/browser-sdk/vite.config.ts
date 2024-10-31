import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svelte(),
    icons({
      scale: 1,
      compiler: 'svelte',
    }),
  ],
  resolve: {
    alias: {
      '$styled-system': path.resolve(import.meta.dirname, './styled-system'),
    },
  },
  build: {
    target: 'es2020',
    lib: {
      name: 'Readable',
      entry: './src/script.ts',
      fileName: () => 'script.js',
      formats: ['umd'],
    },
  },
});
