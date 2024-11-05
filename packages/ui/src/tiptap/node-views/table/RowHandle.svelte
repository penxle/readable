<script lang="ts">
  import { center } from '@readable/styled-system/patterns';
  import { Icon, Menu, MenuItem, Tooltip } from '@readable/ui/components';
  import { CellSelection, TableMap } from '@tiptap/pm/tables';
  import ArrowDownToLineIcon from '~icons/lucide/arrow-down-to-line';
  import ArrowUpToLineIcon from '~icons/lucide/arrow-up-to-line';
  import EllipsisVerticalIcon from '~icons/lucide/ellipsis-vertical';
  import MoveDownIcon from '~icons/lucide/move-down';
  import MoveUpIcon from '~icons/lucide/move-up';
  import Trash2Icon from '~icons/lucide/trash-2';
  import type { Editor } from '@tiptap/core';
  import type { Node } from '@tiptap/pm/model';

  type Props = {
    editor?: Editor;
    tableNode: Node;
    tablePos: number;
    i: number;
    hoveredRowIndex?: number | null;
    hasSpan?: boolean;
  };

  let { editor, tableNode, tablePos, i, hoveredRowIndex, hasSpan = false }: Props = $props();

  function selectRow(rowIndex: number) {
    if (!editor) {
      return;
    }

    const { tr } = editor.state;

    const map = TableMap.get(tableNode);
    const tableStart = tablePos + 1;

    if (rowIndex < 0 || rowIndex >= map.height) {
      return false;
    }

    const rowCells = map.cellsInRect({
      left: 0,
      right: map.width,
      top: rowIndex,
      bottom: rowIndex + 1,
    });

    const anchorCell = tr.doc.resolve(tableStart + rowCells[0]);
    // eslint-disable-next-line unicorn/prefer-at
    const headCell = tr.doc.resolve(tableStart + rowCells[rowCells.length - 1]);

    const rowSelection = CellSelection.rowSelection(anchorCell, headCell);
    editor.view.dispatch(tr.setSelection(rowSelection));

    return true;
  }

  function swapRows(a: number, b: number) {
    if (!editor) {
      return false;
    }

    const { tr } = editor.state;

    if (hasSpan) {
      return false;
    }

    let map = TableMap.get(tableNode);

    if (a < 0 || a >= map.height || b < 0 || b >= map.height) {
      return false;
    }

    if (a === b) {
      return false;
    }

    const rowNodes = [];
    for (let rowIndex = 0; rowIndex < map.height; rowIndex++) {
      const row = tableNode.child(rowIndex);
      rowNodes.push(row);
    }

    const tempRow = rowNodes[a];
    rowNodes[a] = rowNodes[b];
    rowNodes[b] = tempRow;

    const tableType = tableNode.type;
    const newTable = tableType.createChecked(tableNode.attrs, rowNodes, tableNode.marks);

    tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);

    editor.view.dispatch(tr);

    return true;
  }
</script>

<Menu
  offset={4}
  onopen={() => {
    selectRow(i);
  }}
  placement="right-start"
>
  {#snippet button({ open })}
    <div
      class={center({
        display: open || hoveredRowIndex === i ? 'flex' : 'none',
        '.block-selection-decoration &': {
          display: 'none',
        },
        _hover: {
          backgroundColor: 'neutral.20',
        },
        _pressed: {
          color: 'white',
          backgroundColor: '[var(--prosemirror-color-selection)]',
          borderWidth: '0',
          _hover: {
            backgroundColor: '[var(--prosemirror-color-selection)]',
          },
        },
        width: '18px',
        height: '24px',
        color: 'neutral.50',
        borderRadius: '4px',
        backgroundColor: 'white',
        borderWidth: '1px',
        borderColor: 'neutral.30',
        boxShadow: 'normal',
      })}
      aria-pressed={open}
    >
      <Icon icon={EllipsisVerticalIcon} size={14} />
    </div>
  {/snippet}
  {#snippet children({ close })}
    {#if i !== 0}
      <Tooltip enabled={hasSpan} message="표에 병합된 셀이 없을 때만 이동할 수 있습니다.">
        <MenuItem
          disabled={hasSpan}
          onclick={() => {
            close();
            swapRows(i, i - 1);
          }}
        >
          <Icon icon={MoveUpIcon} size={14} />
          <span>위로 이동</span>
        </MenuItem>
      </Tooltip>
    {/if}
    {#if i !== tableNode.childCount - 1}
      <Tooltip enabled={hasSpan} message="표에 병합된 셀이 없을 때만 이동할 수 있습니다.">
        <MenuItem
          disabled={hasSpan}
          onclick={() => {
            close();
            swapRows(i, i + 1);
          }}
        >
          <Icon icon={MoveDownIcon} size={14} />
          <span>아래로 이동</span>
        </MenuItem>
      </Tooltip>
    {/if}
    <MenuItem
      onclick={() => {
        close();
        editor?.commands.addRowBefore();
      }}
    >
      <Icon icon={ArrowUpToLineIcon} size={14} />
      <span>위에 행 추가</span>
    </MenuItem>
    <MenuItem
      onclick={() => {
        close();
        editor?.commands.addRowAfter();
      }}
    >
      <Icon icon={ArrowDownToLineIcon} size={14} />
      <span>아래에 행 추가</span>
    </MenuItem>
    <MenuItem
      onclick={() => {
        close();
        editor?.commands.deleteRow();
      }}
      variant="danger"
    >
      <Icon icon={Trash2Icon} size={14} />
      <span>행 삭제</span>
    </MenuItem>
  {/snippet}
</Menu>
