import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,

  entry: { index: 'src/main.ts' },
  outDir: 'dist',

  format: 'esm',
  esbuildOptions: (options) => {
    options.chunkNames = 'chunks/[name]-[hash]';
  },

  noExternal: [/^@readable\//],
});
