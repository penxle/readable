import { Extension, posToDOMRect } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { mount, unmount } from 'svelte';
import { addHttpScheme, isValidLinkStructure } from '../../../utils/url';
import Component from './Component.svelte';
import type { VirtualElement } from '@floating-ui/dom';
import type { Selection } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands<ReturnType> {
    linkEditPopover: {
      showLinkEditPopoverForActiveSelection: () => ReturnType;
      showLinkEditPopover: (options: {
        selection: Selection;
        currentLink: string | null;
        defaultLink: string;
      }) => ReturnType;
    };
  }
}

type Options = {
  handleLink: (url: string) => Promise<Record<string, unknown>>;
};

export const LinkEditPopover = Extension.create<Options>({
  name: 'linkEditPopover',

  addOptions() {
    return {
      handleLink: async () => ({}),
    };
  },

  addStorage() {
    return {
      opened: false,
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-k': ({ editor }) => {
        if (this.storage.opened) {
          return false;
        }

        const { selection } = editor.state;
        const { from, to } = selection;

        if (from !== to) {
          editor.commands.showLinkEditPopoverForActiveSelection();
          return true;
        }

        return false;
      },
    };
  },

  addCommands() {
    return {
      showLinkEditPopoverForActiveSelection:
        () =>
        ({ editor, view }) => {
          const { selection } = view.state;
          const { from, to } = selection;

          let defaultLink = '';

          const currentLink = editor.getAttributes('link');
          if (currentLink.href) {
            defaultLink = currentLink.href;
          } else {
            const maybeLink = editor.state.doc.textBetween(from, to);
            if (isValidLinkStructure(maybeLink)) {
              defaultLink = addHttpScheme(maybeLink);
            }
          }

          editor.commands.showLinkEditPopover({
            selection,
            defaultLink,
            currentLink: currentLink.href,
          });
          return true;
        },
      showLinkEditPopover:
        ({ selection, defaultLink, currentLink }) =>
        ({ view }) => {
          const { from, to } = selection;

          const element: VirtualElement = {
            getBoundingClientRect: () => {
              if (selection instanceof NodeSelection) {
                const node = view.nodeDOM(selection.from) as HTMLElement;
                return node.getBoundingClientRect();
              } else {
                return posToDOMRect(view, selection.from, selection.to);
              }
            },
            getClientRects: () => {
              if (selection instanceof NodeSelection) {
                const node = view.nodeDOM(selection.from) as HTMLElement;
                return node.getClientRects();
              } else if (selection instanceof TextSelection) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return window.getSelection()!.getRangeAt(0).getClientRects();
              } else {
                return [posToDOMRect(view, selection.from, selection.to)];
              }
            },
            contextElement: view.dom,
          };

          const modalDom = document.createElement('div');
          const modalComponent = mount(Component, {
            target: modalDom,
            props: {
              editor: this.editor,
              handleLink: this.options.handleLink,
              from,
              to,
              referenceElement: element,
              currentLink,
              defaultLink,
              onclose: () => {
                unmount(modalComponent);
                modalDom.remove();
                this.storage.opened = false;
                this.editor.view.focus();
              },
            },
          });

          document.body.append(modalDom);
          this.storage.opened = true;

          return true;
        },
    };
  },
});
