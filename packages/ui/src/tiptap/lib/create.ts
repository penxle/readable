import { mergeAttributes, Node } from '@tiptap/core';
import { browser } from '$app/environment';
import { SvelteNodeViewRenderer } from './renderer';
import type { NodeConfig } from '@tiptap/core';
import type { NodeViewComponentType } from './renderer';

type CreateNodeViewOptions<Options, Storage> = NodeConfig<Options, Storage>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createNodeView = <Options = any, Storage = any>(
  component: NodeViewComponentType,
  options: CreateNodeViewOptions<Options, Storage>,
) => {
  return extendNodeToNodeView(Node.create<Options, Storage>(), component, options);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extendNodeToNodeView = <Options = any, Storage = any>(
  node: Node,
  component: NodeViewComponentType,
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
        // @ts-expect-error svelte internal
        const { html } = component.render({
          node,
          extension: this,
          selected: false,
        });

        return node.isLeaf
          ? ['node-view', { 'data-html': html }]
          : ['node-view', { 'data-html': html }, ['node-view-content-editable', 0]];
      }
    },

    addNodeView() {
      return SvelteNodeViewRenderer(component);
    },
  });
};
