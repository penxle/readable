import path from 'node:path';
import { getClientAddress } from '@readable/lib';
import { Hono } from 'hono';

/**
 * @typedef {Object} ServeParams
 * @property {typeof import('@sveltejs/kit').Server} Server
 * @property {import('@sveltejs/kit').SSRManifest} manifest
 * @property {Record<string, string>} prerendered
 */

/**
 * @param {ServeParams} params
 */

export const serve = async ({ Server, manifest, prerendered }) => {
  const basePath = path.dirname(Bun.main);

  const sveltekit = new Server(manifest);
  await sveltekit.init({ env: process.env });

  const app = new Hono();

  app.get('/healthz', (c) => c.json({ '*': true }));

  app.all('*', async (c) => {
    const relativePath = c.req.path.slice(1);
    if (manifest.assets.has(relativePath) || relativePath.startsWith(manifest.appPath)) {
      const immutable = relativePath.startsWith(`${manifest.appPath}/immutable`);
      const filePath = path.join(basePath, 'assets', relativePath);
      const file = Bun.file(filePath);

      return new Response(file, {
        headers: {
          'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
          'content-type': file.type,
          'content-length': file.size,
        },
      });
    }

    if (c.req.path in prerendered) {
      const filePath = path.join(basePath, 'assets', prerendered[c.req.path]);
      const file = Bun.file(filePath);

      return new Response(file, {
        headers: {
          'cache-control': 'public, max-age=0, must-revalidate',
          'content-type': file.type,
          'content-length': file.size,
        },
      });
    }

    const response = await sveltekit.respond(c.req.raw, {
      getClientAddress: () => {
        return getClientAddress(c);
      },
    });

    if (response.headers.get('cache-control') === null) {
      response.headers.set('cache-control', 'private, no-cache');
    }

    return response;
  });

  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  });
};
