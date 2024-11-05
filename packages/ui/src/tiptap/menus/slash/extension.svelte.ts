import { autoUpdate, computePosition, flip, hide } from '@floating-ui/dom';
import { css } from '@readable/styled-system/css';
import { Extension, posToDOMRect } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { disassemble } from 'es-hangul';
import { matchSorter } from 'match-sorter';
import { mount, unmount } from 'svelte';
import Component from './Component.svelte';
import { menuItems } from './items';
import type { VirtualElement } from '@floating-ui/dom';
import type { Range } from '@tiptap/core';
import type { MenuItem } from './types';

type State =
  | { active: false }
  | {
      active: true;
      range: Range;
      items: MenuItem[];
    };

export const pluginKey = new PluginKey<State>('slashMenu');
const pattern = /\/(\S*)/g;
const menuItemTypeSet = new Set(menuItems.map((item) => item.type));

export const SlashMenu = Extension.create({
  name: 'slashMenu',

  addProseMirrorPlugins() {
    let dom: HTMLElement | null = null;
    let component: { handleKeyDown: (event: KeyboardEvent) => boolean } | null = null;
    let cleanup: (() => void) | null = null;

    return [
      new Plugin<State>({
        key: pluginKey,
        state: {
          init: () => {
            return { active: false };
          },
          apply: (tr, prev, _, state) => {
            const meta = tr.getMeta(pluginKey);
            if (meta) {
              return meta;
            }

            if (!tr.docChanged) {
              return prev;
            }

            const { $anchor, empty } = state.selection;
            if (!empty) {
              return { active: false };
            }

            if ($anchor.parent.type.name === 'codeBlock') {
              return { active: false };
            }

            const node = $anchor.node();
            const text = node.textContent;

            if (!text) {
              return { active: false };
            }

            const matches = text.matchAll(pattern);
            const match = [...matches].find(
              (match) => $anchor.parentOffset > match.index && $anchor.parentOffset <= match.index + match[0].length,
            );

            if (!match) {
              return { active: false };
            }

            const query = match[1];

            const block = match.index === 0 ? $anchor.node(Math.max(0, $anchor.depth - 1)) : $anchor.parent;
            const typeSet = new Set<string>();

            for (let i = 0; i < block.type.contentMatch.edgeCount; i++) {
              const edge = block.type.contentMatch.edge(i);
              if (menuItemTypeSet.has(edge.type.name)) {
                typeSet.add(edge.type.name);
              }
            }

            const availableItems = menuItems.filter((item) => item.visible !== false && typeSet.has(item.type));

            const items = matchSorter(availableItems, disassemble(query), {
              keys: [(item) => disassemble(item.name), (item) => item.keywords.map((v) => disassemble(v))],
              sorter: (items) => items,
            });

            return {
              active: true,
              range: {
                from: $anchor.start() + match.index,
                to: $anchor.start() + match.index + match[0].length,
              },
              items,
            };
          },
        },
        view: () => {
          return {
            update: (view, prevState) => {
              const state = pluginKey.getState(view.state);
              const prev = pluginKey.getState(prevState);
              if (!state || !prev) {
                return;
              }

              if (state.active) {
                let items = $state(state.items);

                if (!prev.active) {
                  dom = document.createElement('div');
                  component = mount(Component, {
                    target: dom,
                    props: {
                      editor: this.editor,
                      items,
                      onexecute: (item) => {
                        const state = pluginKey.getState(this.editor.state);
                        if (!state?.active) {
                          return;
                        }

                        item.command({ editor: this.editor, range: state.range });
                      },
                      onclose: () => {
                        const { tr } = this.editor.state;
                        tr.setMeta(pluginKey, { active: false });
                        this.editor.view.dispatch(tr);
                      },
                    },
                  });

                  dom.className = css({
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: 'max',
                    visibility: 'hidden',
                  });

                  document.body.append(dom);
                }

                if (!dom || !component) {
                  return;
                }

                items = state.items;

                const virtualEl: VirtualElement = {
                  getBoundingClientRect: () => posToDOMRect(view, state.range.from, state.range.to),
                  contextElement: this.editor.view.dom,
                };

                cleanup?.();
                cleanup = autoUpdate(virtualEl, dom, async () => {
                  if (!dom) {
                    return;
                  }

                  const { x, y, middlewareData } = await computePosition(virtualEl, dom, {
                    placement: 'bottom-start',
                    middleware: [flip({ padding: 16 }), hide({ padding: 16 })],
                  });

                  dom.style.left = `${x}px`;
                  dom.style.top = `${y}px`;
                  dom.style.visibility = middlewareData.hide?.referenceHidden ? 'hidden' : 'visible';
                  dom.style.zIndex = '20';
                });
              }

              if (!state.active && prev.active) {
                cleanup?.();
                if (component) {
                  unmount(component);
                }
                dom?.remove();
              }
            },
            destroy: () => {
              cleanup?.();
              if (component) {
                unmount(component);
              }
              dom?.remove();
            },
          };
        },
        props: {
          handleKeyDown: (_, event) => {
            return component?.handleKeyDown?.(event) ?? false;
          },
        },
      }),
    ];
  },
});
