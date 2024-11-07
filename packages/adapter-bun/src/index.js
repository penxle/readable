import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns {import("@sveltejs/kit").Adapter}
 */
export const bun = () => {
  return {
    name: '@readable/adapter-bun',
    adapt: async (builder) => {
      const tmp = builder.getBuildDirectory('adapter-bun');
      const out = 'dist';

      builder.rimraf(tmp);
      builder.rimraf(out);

      builder.mkdirp(tmp);
      builder.mkdirp(out);

      const prerendered = {};
      for (const [p, { file }] of builder.prerendered.pages.entries()) {
        prerendered[p] = file;
      }

      builder.log.info('Copying assets');
      builder.writeClient(path.join(out, 'assets'));
      builder.writePrerendered(path.join(out, 'assets'));

      builder.log.info('Building server');
      builder.writeServer(path.join(tmp, 'server'));

      await fs.appendFile(
        path.join(tmp, 'server/manifest.js'),
        `export const prerendered = ${JSON.stringify(prerendered)};`,
      );

      await fs.writeFile(
        path.join(tmp, 'index.js'),
        `
          import { serve } from './serve.js';
          import { Server } from './server/index.js';
          import { manifest, prerendered } from './server/manifest.js';

          await serve({ Server, manifest, prerendered });
        `,
      );

      builder.copy(path.join(__dirname, 'serve.js'), path.join(tmp, 'serve.js'));

      await build({
        entry: [path.join(tmp, 'index.js')],
        outDir: out,

        format: 'esm',
        target: 'esnext',

        noExternal: [/.*/],

        esbuildOptions: (options) => {
          options.chunkNames = 'chunks/[name]-[hash]';
        },
      });
    },
  };
};
