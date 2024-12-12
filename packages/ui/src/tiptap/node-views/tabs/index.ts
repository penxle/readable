import { css } from '@readable/styled-system/css';
import { findParentNode, mergeAttributes, Node } from '@tiptap/core';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { createNodeView } from '../../lib';
import Component from './Component.svelte';

declare module '@tiptap/core' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands<ReturnType> {
    tabs: {
      setTabs: () => ReturnType;
      addTab: () => ReturnType;
      deleteTab: (idx: number) => ReturnType;
      renameTab: (idx: number, title: string) => ReturnType;
      selectTab: (idx: number) => ReturnType;
    };
  }
}

type State = {
  pos: number;
  idx: number;
}[];

type Meta = {
  pos: number;
  idx: number | null;
};

const key = new PluginKey<State>();

const getTabs = findParentNode((node) => node.type.name === 'tabs');
export const getSelectedTabIdx = (state: EditorState, pos: number) => {
  const s = key.getState(state);
  if (!s) {
    return 0;
  }

  const e = s.find((v) => v.pos === pos);
  if (!e) {
    return 0;
  }

  return e.idx;
};

export const Tabs = createNodeView(Component, {
  name: 'tabs',
  group: 'block',
  content: 'tab+',

  addCommands() {
    return {
      setTabs:
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
      addTab:
        () =>
        ({ state, tr, dispatch }) => {
          const tabs = getTabs(state.selection);
          if (!tabs) {
            return false;
          }

          const pos = tabs.pos + tabs.node.nodeSize - 1;
          const tabNode = state.schema.nodes.tab.createChecked(null, state.schema.nodes.paragraph.createAndFill());

          if (dispatch) {
            tr.setMeta(key, { pos: tabs.pos, idx: tabs.node.childCount });
            tr.insert(pos, tabNode);
          }

          return true;
        },
      deleteTab:
        (idx) =>
        ({ state, tr, dispatch }) => {
          const tabs = getTabs(state.selection);
          if (!tabs) {
            return false;
          }

          let offset = 0;
          for (let i = 0; i < idx; i++) {
            const child = tabs.node.maybeChild(i);
            if (!child) {
              return false;
            }

            offset += child.nodeSize;
          }

          const child = tabs.node.maybeChild(idx);
          if (!child) {
            return false;
          }

          const pos = tabs.pos + offset + 1;

          if (dispatch) {
            if (tabs.node.childCount === 1) {
              tr.setMeta(key, { pos: tabs.pos, idx: null });
              tr.delete(tabs.pos, tabs.pos + tabs.node.nodeSize);
            } else {
              const selectedIdx = getSelectedTabIdx(state, tabs.pos);
              if (selectedIdx >= idx) {
                tr.setMeta(key, { pos: tabs.pos, idx: Math.max(0, selectedIdx - 1) });
              }
              tr.delete(pos, pos + child.nodeSize);
            }
          }

          return true;
        },
      renameTab:
        (idx, title) =>
        ({ state, tr, dispatch }) => {
          const tabs = getTabs(state.selection);
          if (!tabs) {
            return false;
          }

          if (title.trim() === '') {
            return false;
          }

          let offset = 0;
          for (let i = 0; i < idx; i++) {
            const child = tabs.node.maybeChild(i);
            if (!child) {
              return false;
            }

            offset += child.nodeSize;
          }

          const pos = tabs.pos + offset + 1;

          if (dispatch) {
            tr.setNodeAttribute(pos, 'title', title);
          }

          return true;
        },
      selectTab:
        (idx) =>
        ({ state, tr, dispatch }) => {
          const tabs = getTabs(state.selection);
          if (!tabs) {
            return false;
          }

          if (dispatch) {
            tr.setMeta(key, { pos: tabs.pos, idx });
          }

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<State>({
        key,
        state: {
          init: (_, state) => {
            const { doc } = state;
            const s: State = [];

            doc.descendants((node, pos) => {
              if (node.type === this.type) {
                s.push({ pos, idx: 0 });
              }
            });

            return s;
          },
          apply: (tr, s) => {
            if (tr.docChanged) {
              s = s.map((v) => ({ pos: tr.mapping.map(v.pos), idx: v.idx }));
            }

            const meta = tr.getMeta(key) as Meta | undefined;
            if (!meta) {
              return s;
            }

            if (meta.idx === null) {
              s = s.filter((v) => v.pos !== meta.pos);
            } else {
              const e = s.find((v) => v.pos === meta.pos);
              if (e) {
                e.idx = meta.idx;
              } else {
                s.push({ pos: meta.pos, idx: meta.idx });
              }
            }

            return s;
          },
        },
        props: {
          decorations: (state) => {
            const s = key.getState(state);
            if (!s) {
              return null;
            }

            const decorations: Decoration[] = [];
            const visited = new Set<number>();

            for (const { pos, idx } of s) {
              const node = state.doc.nodeAt(pos);
              if (!node) {
                continue;
              }

              node.forEach((node, offset, index) => {
                if (index === idx) {
                  const decoration = Decoration.node(pos + offset + 1, pos + offset + 1 + node.nodeSize, {
                    'data-tab-selected': '',
                  });

                  decorations.push(decoration);
                }
              });

              visited.add(pos);
            }

            state.doc.descendants((node, pos) => {
              if (node.type !== this.type || visited.has(pos)) {
                return;
              }

              node.forEach((node, offset, index) => {
                if (index === 0) {
                  const decoration = Decoration.node(pos + offset + 1, pos + offset + 1 + node.nodeSize, {
                    'data-tab-selected': '',
                  });

                  decorations.push(decoration);
                }
              });
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export const Tab = Node.create({
  name: 'tab',
  content: '(paragraph|orderedList|bulletList|image|file|embed|codeBlock)+',
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: '새 탭',
        rendered: false,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        role: 'tabpanel',
        class: css({ display: 'none', marginTop: '0' }),
      }),
      0,
    ];
  },
});
