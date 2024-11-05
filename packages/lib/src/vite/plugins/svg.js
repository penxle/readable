import { readFile } from 'node:fs/promises';
import { compile } from 'svelte/compiler';
import { optimize } from 'svgo';

/**
 * @returns {import('vite').Plugin}
 */
export const svg = () => ({
  name: 'svg',

  transform: async (_, id, transformOptions) => {
    if (!id.endsWith('.svg?component')) {
      return;
    }

    const filename = id.replace('?component', '');
    const content = await readFile(filename, { encoding: 'utf8' });

    const { data } = optimize(content, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: { overrides: { inlineStyles: { onlyMatchedOnce: false } } },
        },
        'convertStyleToAttrs',
        { name: 'prefixIds', params: { prefix: (_, info) => `svg__${info.multipassCount}` } },
      ],
    });

    const svg = data.replace(/<svg/, '<svg {...$$$$props}');

    const { js } = compile(svg, {
      filename,
      namespace: 'svg',
      generate: transformOptions?.ssr ? 'server' : 'client',
    });

    return js;
  },
});
