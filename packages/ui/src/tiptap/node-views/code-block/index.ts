import { Editor, findChildren } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { getSingletonHighlighter, getTokenStyleObject, stringifyTokenStyle } from 'shiki';
import { createNodeView } from '../../lib';
import Component from './Component.svelte';
import type { Node } from '@tiptap/pm/model';
import type { BundledTheme, Highlighter, TokenStyles } from 'shiki';

declare module '@tiptap/core' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands<ReturnType> {
    codeBlock: {
      setCodeBlock: () => ReturnType;
    };
  }
}

type Options = {
  theme: BundledTheme;
};

type Storage = {
  highlighter: Highlighter | undefined;
};

const key = new PluginKey('codeBlock');

export const CodeBlock = createNodeView<Options, Storage>(Component, {
  name: 'codeBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'pre' }];
  },

  renderText: () => '',

  addOptions() {
    return {
      theme: 'min-light',
    };
  },

  addAttributes() {
    return {
      language: { default: 'text' },
    };
  },

  addStorage() {
    return {
      highlighter: undefined,
    };
  },

  addCommands() {
    return {
      setCodeBlock:
        () =>
        ({ tr, dispatch }) => {
          const node = this.type.createAndFill();
          if (!node) {
            return false;
          }

          if (dispatch) {
            tr.replaceSelectionWith(node);
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $anchor, empty } = editor.state.selection;

        if (!empty || $anchor.parent.type !== this.type || $anchor.parent.textContent.length > 0) {
          return false;
        }

        return true;
      },

      'Mod-a': ({ editor }) => {
        const { $anchor } = editor.state.selection;
        if ($anchor.parent.type !== this.type) {
          return false;
        }

        return editor.commands.setTextSelection({
          from: $anchor.start(),
          to: $anchor.end(),
        });
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        state: {
          init: () => {
            getSingletonHighlighter({
              themes: [this.options.theme],
              langs: [],
            }).then((highlighter) => {
              this.storage.highlighter = highlighter;

              const { tr } = this.editor.state;
              tr.setMeta(key, true);
              this.editor.view.dispatch(tr);
            });

            return DecorationSet.empty;
          },
          apply: (tr, decorationSet) => {
            if (!this.storage.highlighter) {
              return DecorationSet.empty;
            }

            if (tr.getMeta(key) === true || tr.docChanged) {
              return getDecorations(this.editor, this.storage.highlighter, this.options.theme, tr.doc);
            }

            return decorationSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations: (state) => {
            return key.getState(state);
          },
        },
      }),
    ];
  },
});

const themedTokenToStyle = (token: TokenStyles) => {
  return stringifyTokenStyle(token.htmlStyle || getTokenStyleObject(token));
};

const getDecorations = (editor: Editor, highlighter: Highlighter, theme: BundledTheme, doc: Node) => {
  const decorations: Decoration[] = [];
  const languages = new Set(['text', ...highlighter.getLoadedLanguages()]);

  const children = findChildren(doc, (node) => node.type.name === 'codeBlock');
  for (const child of children) {
    const lang = child.node.attrs.language;
    if (!languages.has(lang)) {
      highlighter.loadLanguage(lang).then(() => {
        const { tr } = editor.state;
        tr.setMeta(key, true);
        editor.view.dispatch(tr);
      });

      continue;
    }

    const result = highlighter.codeToTokens(child.node.textContent, { theme, lang });

    for (const token of result.tokens.flat()) {
      const from = child.pos + token.offset + 1;
      const to = from + token.content.length;

      decorations.push(
        Decoration.inline(from, to, {
          style: themedTokenToStyle(token),
        }),
      );
    }
  }

  return DecorationSet.create(doc, decorations);
};
