/** @returns {import('vite').Plugin[]} */
export const css = () => {
  return [
    {
      name: 'css:inline',
      enforce: 'post',

      resolveId(id) {
        if (id.endsWith('virtual:style.css?inline')) {
          return '\u0000css:style.js';
        }
      },

      load(id) {
        if (id === '\u0000css:style.js') {
          return 'export default __CSS_STYLE_MARKER__';
        }
      },

      generateBundle(_, bundle) {
        let css = '';
        for (const [name, chunk] of Object.entries(bundle)) {
          if (name === 'style.css' && chunk.type === 'asset') {
            css = chunk.source;
          }
        }

        for (const [name, chunk] of Object.entries(bundle)) {
          if (name === 'script.js' && chunk.type === 'chunk') {
            chunk.code = chunk.code.replaceAll('__CSS_STYLE_MARKER__', JSON.stringify(css));
          }
        }

        delete bundle['style.css'];
      },
    },
  ];
};
