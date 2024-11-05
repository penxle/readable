<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon, Tooltip, VerticalDivider } from '@readable/ui/components';
  import { CellSelection } from '@tiptap/pm/tables';
  import { onMount } from 'svelte';
  import { run } from 'svelte/legacy';
  import BoldIcon from '~icons/lucide/bold';
  import CheckIcon from '~icons/lucide/check';
  import ChevronDownIcon from '~icons/lucide/chevron-down';
  import CodeXmlIcon from '~icons/lucide/code-xml';
  import Heading1Icon from '~icons/lucide/heading-1';
  import Heading2Icon from '~icons/lucide/heading-2';
  import Heading3Icon from '~icons/lucide/heading-3';
  import ItalicIcon from '~icons/lucide/italic';
  import LetterTextIcon from '~icons/lucide/letter-text';
  import LinkIcon from '~icons/lucide/link';
  import StrikethroughIcon from '~icons/lucide/strikethrough';
  import TableCellsMergeIcon from '~icons/lucide/table-cells-merge';
  import TableCellsSplitIcon from '~icons/lucide/table-cells-split';
  import TypeIcon from '~icons/lucide/type';
  import UnderlineIcon from '~icons/lucide/underline';
  import { createFloatingActions } from '../../../actions';
  import type { Editor } from '@tiptap/core';
  import type { Node } from '@tiptap/pm/model';

  type Props = {
    editor: Editor;
    openLinkEditPopover: () => void;
  };

  let { editor, openLinkEditPopover }: Props = $props();

  let topLevelNodeTypePickerOpened = $state(false);
  let colorPickerOpened = $state(false);

  const { anchor, floating } = createFloatingActions({
    placement: 'bottom-start',
    offset: 10,
    onClickOutside: () => {
      topLevelNodeTypePickerOpened = false;
    },
  });

  const { anchor: colorPickerAnchor, floating: colorPickerFloating } = createFloatingActions({
    placement: 'bottom-start',
    offset: 10,
    onClickOutside: () => {
      colorPickerOpened = false;
    },
  });

  const topLevelNodeTypes = [
    { id: 'heading-1', label: '제목 1', icon: Heading1Icon },
    { id: 'heading-2', label: '제목 2', icon: Heading2Icon },
    { id: 'heading-3', label: '제목 3', icon: Heading3Icon },
    { id: 'paragraph', label: '텍스트', icon: LetterTextIcon },
  ];

  const marks = [
    { name: 'bold', icon: BoldIcon },
    { name: 'italic', icon: ItalicIcon },
    { name: 'underline', icon: UnderlineIcon },
    { name: 'strike', icon: StrikethroughIcon },
    { name: 'code', icon: CodeXmlIcon },
  ];

  // TODO: dark mode 지원
  const colors = [
    { name: 'black', label: '검정' },
    { name: 'gray', label: '회색' },
    { name: 'red', label: '빨간색' },
    { name: 'yellow', label: '노란색' },
    { name: 'orange', label: '주황색' },
    { name: 'green', label: '초록색' },
    { name: 'blue', label: '파란색' },
  ];

  let activeMarks = $state<string[]>([]);
  let activeNode = $state<Node | null>(null);
  let activeColor = $state<string | null>(null);
  let selectedBlocks = $state<Node[]>([]);
  let isInlineContentSelected = $state(false);
  let activeNodeTypeId = $state<string | null | undefined>(null);
  let cellSelection = $state<CellSelection | null>(null);

  const showCellSplitButton = $derived(
    cellSelection?.ranges &&
      cellSelection.ranges.length === 1 &&
      selectedBlocks.find(
        (block) =>
          (block.type.name === 'tableCell' && (block.attrs.colspan ?? 1) > 1) || (block.attrs.rowspan ?? 1) > 1,
      ),
  );
  const showCellMergeButton = $derived(cellSelection?.ranges && cellSelection.ranges.length > 1);

  const showCellButtons = $derived(showCellSplitButton || showCellMergeButton);
  const showBlockSwitchButton = $derived(
    selectedBlocks.length === 1 && activeNodeTypeId && topLevelNodeTypes.some((node) => node.id === activeNodeTypeId),
  );
  const showMarksMenu = $derived(isInlineContentSelected);
  const isInCodeblock = $derived(activeNode?.type.name === 'codeBlock');
  const showBubbleMenu = $derived(!isInCodeblock && (showCellButtons || showBlockSwitchButton || showMarksMenu));

  const bubbleMenuButtonStyle = flex({
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    width: '30px',
    height: '30px',
    _hover: {
      backgroundColor: 'neutral.20',
    },
    _pressed: {
      // theme=selected
      color: 'text.accent',
      '& *': { strokeWidth: '[2.5]' },
    },
    _active: {
      // theme=pressed
      backgroundColor: 'neutral.30',
    },
  });

  const updateSelectedNodeAndMarks = () => {
    activeMarks = marks.map(({ name }) => name).filter((name) => editor.isActive(name));
    activeNode = editor.state.selection.$head.parent;
    activeColor = editor.getAttributes('textStyle').class;

    selectedBlocks = [];
    isInlineContentSelected = false;

    cellSelection = editor.state.selection instanceof CellSelection ? editor.state.selection : null;

    if (cellSelection?.ranges) {
      for (const range of cellSelection.ranges) {
        editor.state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node) => {
          if (node && node.isBlock) {
            selectedBlocks.push(node);
          }

          if (node.inlineContent && node.content.size > 0) {
            isInlineContentSelected = true;
          }
        });
      }
    } else {
      const { from, to } = editor.state.selection;
      if (from !== null && to !== null) {
        editor.state.doc.nodesBetween(from, to, (node) => {
          if (node.isBlock) {
            selectedBlocks.push(node);
          }

          if (node.inlineContent && node.content.size > 0) {
            isInlineContentSelected = true;
          }
        });
      }
    }

    selectedBlocks = selectedBlocks;
  };

  run(() => {
    activeNodeTypeId =
      activeNode?.type.name === 'heading'
        ? `${activeNode?.type.name}-${activeNode?.attrs?.level}`
        : activeNode?.type.name;
  });

  onMount(() => {
    editor.on('update', updateSelectedNodeAndMarks);
    editor.on('selectionUpdate', updateSelectedNodeAndMarks);

    return () => {
      editor.off('update', updateSelectedNodeAndMarks);
      editor.off('selectionUpdate', updateSelectedNodeAndMarks);
    };
  });
</script>

<div
  class={flex({
    alignItems: 'center',
    gap: '2px',
    borderWidth: '1px',
    borderColor: 'border.secondary',
    borderRadius: '10px',
    padding: '4px',
    backgroundColor: 'background.overlay',
    height: '42px',
    boxShadow: 'strong',
    zIndex: '20',
  })}
  hidden={!showBubbleMenu}
>
  {#if showCellButtons}
    {#if showCellMergeButton}
      <Tooltip message="셀 병합" placement="top">
        <button
          class={bubbleMenuButtonStyle}
          onclick={() => {
            editor.chain().focus().mergeCells().run();
          }}
          type="button"
        >
          <Icon icon={TableCellsMergeIcon} size={16} />
        </button>
      </Tooltip>
    {/if}
    {#if showCellSplitButton}
      <Tooltip message="셀 분할" placement="top">
        <button
          class={bubbleMenuButtonStyle}
          onclick={() => {
            editor.chain().focus().splitCell().run();
          }}
          type="button"
        >
          <Icon icon={TableCellsSplitIcon} size={16} />
        </button>
      </Tooltip>
    {/if}
    {#if showBlockSwitchButton || showMarksMenu}
      <VerticalDivider style={css.raw({ marginX: '2px' })} />
    {/if}
  {/if}
  {#if showBlockSwitchButton}
    <button
      class={flex({
        paddingLeft: '8px',
        paddingRight: '4px',
        height: '30px',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '4px',
        _hover: {
          backgroundColor: 'neutral.20',
        },
        _pressed: {
          // theme=selected
          color: 'text.accent',
        },
        _active: {
          // theme=pressed
          backgroundColor: 'neutral.30',
        },
      })}
      aria-pressed={topLevelNodeTypePickerOpened}
      onclick={() => {
        topLevelNodeTypePickerOpened = true;
      }}
      type="button"
      use:anchor
    >
      <div class={css({ textStyle: '15m' })}>
        {topLevelNodeTypes.find((nodeType) => nodeType.id === activeNodeTypeId)?.label}
      </div>
      <Icon style={css.raw({ color: 'neutral.50' })} icon={ChevronDownIcon} />
    </button>
    {#if topLevelNodeTypePickerOpened}
      <div
        class={flex({
          flexDirection: 'column',
          gap: '4px',
          borderWidth: '1px',
          borderColor: 'border.secondary',
          borderRadius: '10px',
          padding: '4px',
          backgroundColor: 'background.overlay',
          width: '164px',
          boxShadow: 'strong',
        })}
        use:floating
      >
        {#each topLevelNodeTypes as nodeType (nodeType.id)}
          <button
            class={flex({
              align: 'center',
              gap: '8px',
              paddingLeft: '4px',
              paddingRight: '8px',
              paddingY: '4px',
              borderRadius: '8px',
              textStyle: '14m',
              _hover: {
                color: 'text.tertiary',
                backgroundColor: 'neutral.20',
              },
              _focus: {
                backgroundColor: 'neutral.30',
              },
            })}
            aria-pressed={activeNodeTypeId === nodeType.id}
            onclick={() => {
              if (nodeType.id.includes('heading')) {
                const level = Number(nodeType.id.split('-')[1]);
                editor.chain().focus().setNode('heading', { level }).run();
              } else {
                editor.chain().focus().setNode(nodeType.id).run();
              }

              topLevelNodeTypePickerOpened = false;
            }}
            type="button"
          >
            <div
              class={css({
                borderWidth: '1px',
                borderColor: 'border.secondary',
                borderRadius: '4px',
                padding: '2px',
              })}
            >
              <Icon icon={nodeType.icon} size={16} />
            </div>
            <span class={css({ color: 'text.primary' })}>{nodeType.label}</span>

            {#if activeNodeTypeId === nodeType.id}
              <Icon
                style={css.raw({ marginLeft: 'auto', color: 'text.accent', '& *': { strokeWidth: '[2.5]' } })}
                icon={CheckIcon}
                size={12}
              />
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  {/if}
  {#if showMarksMenu}
    {#each marks as { name, icon } (name)}
      <button
        class={bubbleMenuButtonStyle}
        aria-pressed={activeMarks.includes(name)}
        onclick={() => {
          editor.chain().focus().toggleMark(name).run();
        }}
        type="button"
      >
        <Icon {icon} size={16} />
      </button>
    {/each}
    <button
      class={bubbleMenuButtonStyle}
      onclick={() => {
        openLinkEditPopover();
      }}
      type="button"
    >
      <Icon icon={LinkIcon} size={16} />
    </button>
    <button
      class={flex({
        alignItems: 'center',
        gap: '4px',
        height: '30px',
        borderRadius: '4px',
        paddingLeft: '8px',
        paddingRight: '4px',
        _hover: {
          backgroundColor: 'neutral.20',
        },
        _active: {
          // theme=pressed
          backgroundColor: 'neutral.30',
        },
      })}
      aria-pressed={colorPickerOpened}
      onclick={() => {
        colorPickerOpened = true;
      }}
      type="button"
      use:colorPickerAnchor
    >
      <div
        style:background-color={activeColor && `var(--prosemirror-color-${activeColor})`}
        class={css({
          borderRadius: 'full',
          backgroundColor: 'text.primary',
          size: '16px',
        })}
      ></div>
      <Icon style={css.raw({ color: 'neutral.50' })} icon={ChevronDownIcon} />
    </button>
  {/if}

  {#if colorPickerOpened}
    <div
      class={flex({
        flexDirection: 'column',
        gap: '4px',
        borderWidth: '1px',
        borderColor: 'border.secondary',
        borderRadius: '10px',
        padding: '4px',
        backgroundColor: 'background.overlay',
        boxShadow: 'strong',
        width: '164px',
      })}
      use:colorPickerFloating
    >
      {#each colors as { name, label } (name)}
        <button
          class={flex({
            align: 'center',
            gap: '8px',
            borderRadius: '8px',
            paddingLeft: '4px',
            paddingRight: '8px',
            paddingY: '4px',
            _hover: {
              backgroundColor: 'neutral.20',
            },
            _focus: {
              backgroundColor: 'neutral.30',
            },
          })}
          aria-pressed={activeColor === name || (!activeColor && name === 'black')}
          onclick={() => {
            if (name === 'black') {
              editor.chain().focus().unsetColor().run();
            } else {
              editor.chain().focus().setColor(name).run();
            }
            colorPickerOpened = false;
          }}
          type="button"
        >
          <div
            style:color={name && `var(--prosemirror-color-${name})`}
            class={css({ borderWidth: '1px', borderColor: 'border.secondary', borderRadius: '4px', padding: '2px' })}
          >
            <Icon icon={TypeIcon} size={14} />
          </div>

          <div class={css({ textStyle: '14m' })}>
            {label}
          </div>

          {#if activeColor === name || (!activeColor && name === 'black')}
            <Icon
              style={css.raw({ marginLeft: 'auto', color: 'text.accent', '& *': { strokeWidth: '[2.5]' } })}
              icon={CheckIcon}
              size={12}
            />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
