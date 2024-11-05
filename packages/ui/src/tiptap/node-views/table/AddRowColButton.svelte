<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { center } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import { TableMap } from '@tiptap/pm/tables';
  import PlusIcon from '~icons/lucide/plus';
  import type { Editor } from '@tiptap/core';
  import type { Node } from '@tiptap/pm/model';

  type Props = {
    editor?: Editor;
    tableNode: Node;
    tablePos: number;
    isLastRowHovered: boolean;
    isLastColumnHovered: boolean;
  };

  let { editor, tableNode, tablePos, isLastRowHovered, isLastColumnHovered }: Props = $props();

  function addRowAtEnd(tableNode: Node) {
    if (!editor) {
      return;
    }

    const { state } = editor;
    const { tr } = state;

    const map = TableMap.get(tableNode);
    const lastRowIndex = map.height - 1;

    const tableStart = tablePos + 1;

    const cellPos = map.positionAt(lastRowIndex, 0, tableNode);
    const cellResolvedPos = tr.doc.resolve(tableStart + cellPos);

    editor.commands.setTextSelection(cellResolvedPos.pos);

    const result = editor.commands.addRowAfter();

    return result;
  }

  function addColumnAtEnd(tableNode: Node) {
    if (!editor) {
      return;
    }

    const { state } = editor;
    const { tr } = state;

    const map = TableMap.get(tableNode);
    const lastColumnIndex = map.width - 1;

    const tableStart = tablePos + 1;

    const cellPos = map.positionAt(0, lastColumnIndex, tableNode);
    const cellResolvedPos = tr.doc.resolve(tableStart + cellPos);

    editor.commands.setTextSelection(cellResolvedPos.pos);

    const result = editor.commands.addColumnAfter();

    return result;
  }
</script>

<div
  class={cx(
    'group',
    css({
      position: 'absolute',
      zIndex: '10',
      left: '0',
      bottom: '0',
      right: '0',
      width: 'full',
      height: '23px',
      translate: 'auto',
      translateY: 'full',
      paddingTop: '5px',
      '.block-selection-decoration &': {
        display: 'none',
      },
    }),
  )}
  contenteditable={false}
>
  <button
    class={center({
      size: 'full',
      borderRadius: '4px',
      textStyle: '14m',
      color: 'neutral.50',
      backgroundColor: 'neutral.20',
      display: isLastRowHovered ? 'flex' : 'none',
      _groupHover: {
        display: 'flex',
      },
      _hover: {
        backgroundColor: 'neutral.30',
      },
      _active: {
        color: 'white',
        backgroundColor: '[var(--prosemirror-color-selection)]',
      },
    })}
    onclick={() => addRowAtEnd(tableNode)}
    type="button"
  >
    <Icon icon={PlusIcon} size={14} />
  </button>
</div>

<div
  class={cx(
    'group',
    css({
      position: 'absolute',
      zIndex: '10',
      top: '0',
      right: '0',
      bottom: '0',
      width: '23px',
      height: 'full',
      translate: 'auto',
      translateX: 'full',
      paddingLeft: '5px',
      '.block-selection-decoration &': {
        display: 'none',
      },
    }),
  )}
  contenteditable={false}
>
  <button
    class={center({
      size: 'full',
      borderRadius: '4px',
      textStyle: '14m',
      color: 'neutral.50',
      backgroundColor: 'neutral.20',
      display: isLastColumnHovered ? 'flex' : 'none',
      _groupHover: {
        display: 'flex',
      },
      _hover: {
        backgroundColor: 'neutral.30',
      },
      _active: {
        color: 'white',
        backgroundColor: '[var(--prosemirror-color-selection)]',
      },
    })}
    onclick={() => {
      addColumnAtEnd(tableNode);
    }}
    type="button"
  >
    <Icon icon={PlusIcon} size={14} />
  </button>
</div>

<div
  class={cx(
    'group',
    css({
      position: 'absolute',
      zIndex: '10',
      right: '0',
      bottom: '0',
      size: '23px',
      translate: 'auto',
      translateX: 'full',
      translateY: 'full',
      paddingLeft: '5px',
      paddingTop: '5px',
      '.block-selection-decoration &': {
        display: 'none',
      },
    }),
  )}
  contenteditable={false}
>
  <button
    class={center({
      size: 'full',
      borderRadius: 'full',
      textStyle: '14m',
      color: 'neutral.50',
      backgroundColor: 'neutral.20',
      display: isLastRowHovered && isLastColumnHovered ? 'flex' : 'none',
      _groupHover: {
        display: 'flex',
      },
      _hover: {
        backgroundColor: 'neutral.30',
      },
      _active: {
        color: 'white',
        backgroundColor: '[var(--prosemirror-color-selection)]',
      },
    })}
    onclick={() => {
      addRowAtEnd(tableNode);
      addColumnAtEnd(tableNode);
    }}
    type="button"
  >
    <Icon icon={PlusIcon} size={14} />
  </button>
</div>
