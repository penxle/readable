import { mergeAttributes, Node } from '@tiptap/core';
import { render } from 'svelte/server';
import { browser } from '$app/environment';
import { SvelteNodeViewRenderer } from './renderer.svelte';
import type { NodeConfig } from '@tiptap/core';
import type { NodeViewComponent } from './renderer.svelte';

type CreateNodeViewOptions<Options, Storage> = NodeConfig<Options, Storage>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createNodeView = <Options = any, Storage = any>(
  component: NodeViewComponent,
  options: CreateNodeViewOptions<Options, Storage>,
) => {
  return extendNodeToNodeView(Node.create<Options, Storage>(), component, options);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extendNodeToNodeView = <Options = any, Storage = any>(
  node: Node,
  component: NodeViewComponent,
  options?: Partial<CreateNodeViewOptions<Options, Storage>>,
) => {
  return node.extend({
    ...options,

    parseHTML() {
      return [
        { tag: `node-view[data-node-view-type=${options?.name ?? this.name}]` },
        ...(options?.parseHTML?.bind(this)() ?? []),
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      if (browser) {
        const attributes = mergeAttributes(HTMLAttributes, {
          'data-node-view-type': options?.name ?? this.name,
        });

        return node.isLeaf ? ['node-view', attributes] : ['node-view', attributes, 0];
      } else {
        const { body } = render(component, {
          props: {
            node,
            // @ts-expect-error Type mismatch -- fix this
            extension: this,
            selected: false,
          },
        });

        return node.isLeaf
          ? ['node-view', { 'data-html': body }]
          : ['node-view', { 'data-html': body }, ['node-view-content-editable', 0]];
      }
    },

    addNodeView() {
      return SvelteNodeViewRenderer(component);
    },
  });
};
