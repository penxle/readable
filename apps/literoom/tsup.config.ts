import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,

  entry: {
    handler: 'src/handler.ts',
  },

  format: ['cjs'],
  outDir: 'dist/function',
  splitting: false,

  esbuildOptions: (options) => {
    options.packages = 'external';
  },
});
