import { svg } from '@readable/lib/vite';
import { readableIcons } from '@readable/ui/icons';
import { sveltekit } from '@sveltejs/kit/vite';
import icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    svg(),
    icons({
      scale: 1,
      compiler: 'svelte',
      customCollections: {
        rdbl: readableIcons,
      },
    }),
    sveltekit(),
  ],
  server: {
    port: 4000,
    strictPort: true,
  },
  ssr: {
    noExternal: ['felte'],
  },
});
