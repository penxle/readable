import { NodeView } from '@tiptap/core';
import { mount, unmount } from 'svelte';
import type {
  DecorationWithType,
  NodeViewProps,
  NodeViewRenderer,
  NodeViewRendererOptions,
  NodeViewRendererProps,
} from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Decoration, DecorationSource, NodeView as ProseMirrorNodeView } from '@tiptap/pm/view';
import type { Component } from 'svelte';

export type NodeViewComponent = Component<NodeViewProps>;
export type { NodeViewProps } from '@tiptap/core';

class SvelteNodeView extends NodeView<NodeViewComponent> implements ProseMirrorNodeView {
  #element: HTMLElement;
  #contentElement: HTMLElement | null = null;
  #component: Record<string, never>;
  #props: NodeViewProps = $state({} as NodeViewProps);

  #handleSelectionUpdate: () => void;
  #handleTransaction: () => void;
  #onDragStart: (event: DragEvent) => void;

  constructor(component: NodeViewComponent, props: NodeViewRendererProps, options?: Partial<NodeViewRendererOptions>) {
    super(component, props, options);

    this.#onDragStart = (event: DragEvent) => {
      this.onDragStart(event);

      const img = document.createElement('img');
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      document.body.append(img);

      event.dataTransfer?.setDragImage(img, 0, 0);

      setTimeout(() => {
        img.remove();
      }, 0);
    };

    const context = new Map();
    context.set('onDragStart', (event: DragEvent) => this.#onDragStart(event));

    this.#props = {
      editor: this.editor,
      view: this.view,
      node: this.node,
      decorations: this.decorations as DecorationWithType[],
      innerDecorations: this.innerDecorations,
      HTMLAttributes: this.HTMLAttributes,
      extension: this.extension,
      selected: false,

      getPos: () => this.getPos(),
      updateAttributes: (attrs) => this.updateAttributes(attrs),
      deleteNode: () => this.deleteNode(),
    };

    const target = document.createElement(this.node.isInline ? 'span' : 'div');
    this.#component = mount(this.component, {
      target,
      props: this.#props,
      context,
    });

    const element = target.querySelector<HTMLElement>('[data-node-view]');
    if (!element) {
      throw new Error('<NodeView /> not found');
    }

    this.#element = element;

    if (!this.node.isLeaf) {
      const contentElement = element.querySelector<HTMLElement>('[data-node-view-content-editable]');
      if (!contentElement) {
        throw new Error('<NodeViewContentEditable /> not found');
      }

      this.#contentElement = contentElement;
    }

    this.#handleSelectionUpdate = () => {
      if (this.node.type.spec.selectable !== false) {
        const { from, to } = this.editor.state.selection;
        const pos = this.getPos();

        if (from <= pos && to >= pos + this.node.nodeSize) {
          this.selectNode();
        } else {
          this.deselectNode();
        }
      }
    };

    this.#handleTransaction = () => {
      this.#props.editor = this.editor;
    };

    this.editor.on('selectionUpdate', this.#handleSelectionUpdate);
    this.editor.on('transaction', this.#handleTransaction);
  }

  override get dom() {
    return this.#element;
  }

  override get contentDOM() {
    return this.#contentElement;
  }

  update(node: ProseMirrorNode, decorations: readonly Decoration[], innerDecorations: DecorationSource) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.decorations = decorations;
    this.innerDecorations = innerDecorations;

    this.#props.node = node;
    this.#props.decorations = decorations as DecorationWithType[];
    this.#props.innerDecorations = innerDecorations;

    return true;
  }

  selectNode() {
    if (this.editor.isEditable && this.node.type.spec.selectable !== false) {
      this.#props.selected = true;
    }
  }

  deselectNode() {
    if (this.editor.isEditable && this.node.type.spec.selectable !== false) {
      this.#props.selected = false;
    }
  }

  destroy() {
    this.editor?.off('selectionUpdate', this.#handleSelectionUpdate);
    this.editor?.off('transaction', this.#handleTransaction);
    unmount(this.#component);
    this.#contentElement = null;
  }
}

export const SvelteNodeViewRenderer = (
  component: NodeViewComponent,
  options?: Partial<NodeViewRendererOptions>,
): NodeViewRenderer => {
  return (props) => new SvelteNodeView(component, props, options);
};
