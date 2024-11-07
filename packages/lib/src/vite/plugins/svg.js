import { readFile } from 'node:fs/promises';
import { compile } from 'svelte/compiler';
import { optimize } from 'svgo';

/**
 * @returns {import('vite').Plugin}
 */
export const svg = () => ({
  name: 'svg',

  transform: async (_, id, options) => {
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

    const svg = data.replace(/<svg/, '<script>let props = $props();</script><svg {...props}');

    const { js } = compile(svg, {
      filename,
      namespace: 'svg',
      generate: options?.ssr ? 'ssr' : 'dom',
      hydratable: true,
    });

    return js;
  },
});
