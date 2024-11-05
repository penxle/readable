import { autoUpdate, computePosition } from '@floating-ui/dom';
import { center } from '@readable/styled-system/patterns';
import { Extension, posToDOMRect } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { mount, unmount } from 'svelte';
import Component from './Component.svelte';
import type { VirtualElement } from '@floating-ui/dom';
import type { Node } from '@tiptap/pm/model';

type State = {
  pos: number;
  anchorNode: Node | null;
};

type Options = {
  handleLink: (url: string) => Promise<Record<string, unknown>>;
};

const key = new PluginKey<State>('linkTooltip');

export const LinkTooltip = Extension.create<Options>({
  name: 'linkTooltip',

  addOptions() {
    return {
      handleLink: async () => ({}),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<State>({
        key,
        props: {
          handleDOMEvents: {
            pointermove: (view, event) => {
              const target = event.target as HTMLElement;

              const anchor = target.closest('a');

              if (anchor) {
                const pos = view.posAtDOM(anchor, 0);
                const node = view.state.doc.nodeAt(pos);

                if (node) {
                  const { tr } = view.state;
                  tr.setMeta(key, { anchorNode: node, pos });
                  view.dispatch(tr);
                  return;
                }
              }

              const { tr } = view.state;
              tr.setMeta(key, { anchorNode: null, pos: -1 });
              view.dispatch(tr);
            },
          },
        },
        state: {
          init: () => ({ anchorNode: null, pos: -1 }),
          apply: (tr, value) => {
            const meta = tr.getMeta(key);
            if (meta) {
              return meta;
            }

            return value;
          },
        },
        view: () => {
          const dom = document.createElement('div');
          let cleanup: (() => void) | undefined;

          const hideTooltip = () => {
            dom.style.visibility = 'hidden';
            cleanup?.();
          };

          let tooltipComponent: object | null = null;
          const tooltipComponentProps = $state<{
            hide: () => void;
            handleLink: (url: string) => Promise<Record<string, unknown>>;
            unsetLink: () => void;
            linkHref: string;
            openLinkEditPopover: () => void;
          }>({
            hide: hideTooltip,
            handleLink: this.options.handleLink,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            unsetLink: () => {},
            linkHref: '',
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            openLinkEditPopover: () => {},
          });

          return {
            update: async (view, oldState) => {
              const state = key.getState(view.state);
              const prevState = key.getState(oldState);

              if (!state || state.anchorNode === prevState?.anchorNode) {
                return;
              }

              const { anchorNode, pos } = state;

              if (!anchorNode) {
                hideTooltip();
                return;
              }

              const selection = TextSelection.create(view.state.doc, pos, pos + anchorNode.nodeSize);
              const element: VirtualElement = {
                getBoundingClientRect: () => {
                  return posToDOMRect(view, selection.from, selection.to);
                },
                getClientRects: () => {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  return window.getSelection()!.getRangeAt(0).getClientRects();
                },
                contextElement: view.dom,
              };

              const linkHref = anchorNode.marks.find((mark) => mark.type.name === 'link')?.attrs.href;

              const openLinkEditPopover = () => {
                hideTooltip();
                this.editor.commands.showLinkEditPopover({
                  selection,
                  currentLink: linkHref,
                  defaultLink: linkHref,
                });
              };

              const unsetLink = () => {
                this.editor.chain().focus().setTextSelection(selection).unsetLink().run();
              };

              tooltipComponentProps.unsetLink = unsetLink;
              tooltipComponentProps.linkHref = linkHref;
              tooltipComponentProps.openLinkEditPopover = openLinkEditPopover;

              if (!tooltipComponent) {
                tooltipComponent = mount(Component, {
                  target: dom,
                  props: tooltipComponentProps,
                });

                dom.className = center({
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: 'max',
                  visibility: 'hidden',
                });

                document.body.append(dom);
              }

              cleanup?.();
              cleanup = autoUpdate(element, dom, async () => {
                const { x, y } = await computePosition(element, dom, {
                  placement: 'bottom-start',
                });

                dom.style.left = `${x}px`;
                dom.style.top = `${y}px`;
              });

              dom.style.visibility = 'visible';
            },
            destroy: () => {
              hideTooltip();
              if (tooltipComponent) {
                unmount(tooltipComponent);
              }
              dom.remove();
            },
          };
        },
      }),
    ];
  },
});
