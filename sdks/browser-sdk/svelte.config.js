import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: sveltePreprocess(),
  compilerOptions: {
    customElement: true,
  },
  kit: {
    alias: {
      '@/*': '../../apps/api/src/*',
    },
  },
};
