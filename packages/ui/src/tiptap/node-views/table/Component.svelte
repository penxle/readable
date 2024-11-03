<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { mergeAttributes } from '@tiptap/core';
  import { createColGroup } from '@tiptap/extension-table';
  import { TableMap } from '@tiptap/pm/tables';
  import { tick } from 'svelte';
  import { NodeView, NodeViewContentEditable } from '../../lib';
  import AddRowColButton from './AddRowColButton.svelte';
  import ColHandle from './ColHandle.svelte';
  import RowHandle from './RowHandle.svelte';
  import type { Node } from '@tiptap/pm/model';
  import type { NodeViewProps } from '../../lib';

  type $$Props = NodeViewProps;
  $$restProps;

  let colgroupRendered = false;

  tick().then(() => {
    colgroupRendered = true;
  });

  export let node: NodeViewProps['node'];
  export let HTMLAttributes: NodeViewProps['HTMLAttributes'];
  export let extension: NodeViewProps['extension'];
  export let editor: NodeViewProps['editor'] | undefined;
  // export let selected: NodeViewProps['selected'];
  // export let deleteNode: NodeViewProps['deleteNode'];
  export let getPos: NodeViewProps['getPos'];
  // export let updateAttributes: NodeViewProps['updateAttributes'];

  $: ({ colgroup, tableWidth, tableMinWidth } = createColGroup(node, extension.options.cellMinWidth));

  let cols: ['col', Record<string, string>][] = [];
  $: cols = (colgroup?.slice(2) as ['col', Record<string, string>][]) ?? [];

  let _colElems: HTMLElement[] = [];
  $: colElems = _colElems.filter(Boolean); // 열 삭제에 대응

  let hasSpan = false;
  $: {
    hasSpan = false;
    node.descendants((node) => {
      if (node.type.name === 'tableCell' && (node.attrs.colspan > 1 || node.attrs.rowspan > 1)) {
        hasSpan = true;
      }
    });
  }

  let rowElems: HTMLElement[] = [];

  async function getRows(tableNode: Node) {
    if (!editor || !tableNode) {
      return;
    }

    const { state, view } = editor;

    const map = TableMap.get(tableNode);
    const rowsLength = map.height;
    const tablePos = getPos();
    const tableStart = tablePos + 1;

    // table row가 렌더링되길 기다림
    await tick();

    rowElems = [];
    for (let i = 0; i < rowsLength; i++) {
      const pos = map.positionAt(i, 0, tableNode);
      const cellPos = tableStart + pos;
      const rowPos = state.doc.resolve(cellPos - 1);
      const row = view.nodeDOM(rowPos.pos);
      if (row) {
        rowElems.push(row as HTMLElement);
      }
    }
  }

  $: getRows(node);

  let hoveredRowIndex: number | null = null;
  let hoveredColumnIndex: number | null = null;
  $: isLastRowHovered = hoveredRowIndex === rowElems.length - 1;
  $: isLastColumnHovered = hoveredColumnIndex === cols.length - 1;
  function handlePointerover(event: PointerEvent) {
    const target = event.target as HTMLElement;

    const cell = target.closest('td,th');

    if (cell) {
      hoveredColumnIndex = (cell as HTMLTableCellElement).cellIndex;
      hoveredRowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex;
    }
  }
</script>

<NodeView
  style={css.raw(
    {
      position: 'relative',
      width: editor?.isEditable ? 'fit' : 'full',
    },
    // 바깥으로 튀어나온 행/열 핸들과 행/열 추가 버튼이 보일 수 있도록 함
    editor?.isEditable && {
      '* + &': {
        marginTop: '[calc(-10px + var(--prosemirror-block-gap))]',
      },
      marginTop: '-10px',
      paddingTop: '10px',
      '&:last-child': {
        marginBottom: '-23px',
      },
      marginBottom: '[calc(var(--prosemirror-block-gap) * -1)]',
      paddingBottom: '23px',

      overflowX: 'auto',

      '.block-selection-decoration &': {
        marginTop: '0 !important',
        paddingTop: '0',
        marginBottom: '0 !important',
        paddingBottom: '0',
      },
    },
  )}
>
  <div
    class={css(
      {
        position: 'relative',
        width: editor?.isEditable ? 'fit' : 'full',
        overflowX: editor?.isEditable ? 'unset' : 'auto',
      },
      editor?.isEditable && { paddingY: '24px' },
    )}
  >
    <table
      on:pointerover={handlePointerover}
      on:pointerleave={() => {
        hoveredRowIndex = null;
        hoveredColumnIndex = null;
      }}
      {...mergeAttributes(extension.options.HTMLAttributes, HTMLAttributes, {
        class: css({
          position: 'relative',
          borderRadius: '4px',
          borderStyle: 'hidden',
          outline: '1px solid',
          outlineOffset: '-1px',
          outlineColor: 'neutral.30',
        }),
        style: tableWidth ? `width: ${tableWidth}` : `min-width: ${tableMinWidth}`,
      })}
    >
      <colgroup>
        <!-- @ts-ignore -->
        {#each cols as col, i (col)}
          <col bind:this={_colElems[i]} {...col[1]} />
        {/each}
      </colgroup>
      {#if editor?.isEditable}
        <div
          class={css({
            position: 'absolute',
            inset: '0',
          })}
          contenteditable={false}
          role="rowgroup"
        >
          {#each rowElems as row, i (row)}
            <div
              style:height={`${row.clientHeight}px`}
              style:top={`${row.offsetTop}px`}
              class={flex({
                position: 'absolute',
                left: '0',
                width: '18px',
                height: '24px',
                translateX: '-1/2',
                translate: 'auto',
                zIndex: '10',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: hoveredRowIndex === i ? 'auto' : 'none',
              })}
              role="row"
            >
              <RowHandle {editor} {hasSpan} {hoveredRowIndex} {i} tableNode={node} tablePos={getPos()} />
            </div>
          {/each}
        </div>
        {#if colgroupRendered}
          {#each colElems as col, i (i)}
            <div
              style:left={`${col.offsetLeft}px`}
              style:width={`${col.clientWidth}px`}
              class={flex({
                position: 'absolute',
                top: '0',
                width: '24px',
                height: '18px',
                translateY: '-1/2',
                translate: 'auto',
                zIndex: '10',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: hoveredColumnIndex === i ? 'auto' : 'none',
                '.block-selection-decoration &': {
                  display: 'none',
                },
              })}
            >
              <ColHandle {editor} {hasSpan} {hoveredColumnIndex} {i} tableNode={node} tablePos={getPos()} />
            </div>
          {/each}
        {/if}
      {/if}
      <NodeViewContentEditable as="tbody" />
      {#if editor?.isEditable}
        <AddRowColButton {editor} {isLastColumnHovered} {isLastRowHovered} tableNode={node} tablePos={getPos()} />
      {/if}
    </table>
  </div>
</NodeView>
