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
  build: {
    target: 'es2020',
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
