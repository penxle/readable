<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import GripVerticalIcon from '~icons/lucide/grip-vertical';
  import PlusIcon from '~icons/lucide/plus';
  import type { Editor } from '@tiptap/core';

  type Props = {
    editor: Editor;
    pos: number;
  };

  let { editor = $bindable(), pos }: Props = $props();

  const handlePlusClick = () => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) {
      return;
    }

    if (node.type.name === 'paragraph' && node.childCount === 0) {
      editor
        .chain()
        .focus(pos + 1)
        .run();
    } else {
      editor
        .chain()
        .insertContentAt(pos + node.nodeSize, { type: 'paragraph' })
        .focus(pos + node.nodeSize + 1)
        .run();
    }
  };

  const handleGripClick = () => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) {
      return;
    }

    editor
      .chain()
      .setBlockSelection({
        from: pos,
        to: pos + node.nodeSize,
      })
      .focus()
      .run();
  };

  const handleDragStart = (event: DragEvent) => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) {
      return;
    }

    if (!event.dataTransfer) {
      return;
    }

    const dom = editor.view.domAtPos(pos);
    if (!(dom.node instanceof Element)) {
      return;
    }

    editor.commands.setTextSelection(pos);
    const child = dom.node.children[dom.offset];

    const target = document.createElement('div');
    target.className = cx(
      'ProseMirror',
      css({
        width: '720px',
        position: 'fixed',
        backgroundColor: 'white',
        overflow: 'hidden',

        '& > *': {
          width: 'full!',
          margin: '0!',
          padding: '0!',
        },
      }),
    );

    const cloned = child.cloneNode(true) as HTMLElement;

    target.append(cloned);
    document.body.append(target);

    event.dataTransfer.setDragImage(target, 0, 0);
    event.dataTransfer.clearData();
    event.dataTransfer.effectAllowed = 'move';

    setTimeout(() => {
      target.remove();
    }, 0);

    editor
      .chain()
      .setBlockSelection(
        {
          from: pos,
          to: pos + node.nodeSize,
        },
        true,
      )
      .focus()
      .run();

    editor.view.dragging = {
      slice: editor.state.selection.content(),
      move: true,
    };
  };
</script>

<div class={flex({ align: 'center', pointerEvents: 'auto' })}>
  <button
    class={css({ borderRadius: '6px', padding: '2px', color: 'neutral.50', _hover: { backgroundColor: 'neutral.20' } })}
    onclick={handlePlusClick}
    type="button"
  >
    <Icon icon={PlusIcon} size={18} />
  </button>

  <button
    class={css({ borderRadius: '6px', padding: '2px', color: 'neutral.50', _hover: { backgroundColor: 'neutral.20' } })}
    draggable="true"
    onclick={handleGripClick}
    ondragstart={handleDragStart}
    type="button"
  >
    <Icon icon={GripVerticalIcon} size={18} />
  </button>
</div>
