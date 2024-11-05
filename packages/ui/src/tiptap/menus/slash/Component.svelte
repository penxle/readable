<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { HorizontalDivider, Icon } from '@readable/ui/components';
  import type { Editor } from '@tiptap/core';
  import type { MenuItem } from './types';

  type Props = {
    editor: Editor;
    items: MenuItem[];
    onexecute: (item: MenuItem) => void;
    onclose: () => void;
  };

  let { editor, items, onexecute, onclose }: Props = $props();

  let selectedIdx = $state(0);

  let isOnKeyboardNavigation = $state(false);

  export const handleKeyDown = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      isOnKeyboardNavigation = true;

      if (event.key === 'ArrowDown') {
        selectedIdx = (selectedIdx + 1) % items.length;
      }

      if (event.key === 'ArrowUp') {
        selectedIdx = (selectedIdx - 1 + items.length) % items.length;
      }

      selectableElems[selectedIdx]?.focus();
      return true;
    }

    isOnKeyboardNavigation = false;
    if (!editor.view.hasFocus()) {
      editor.view.focus();
    }

    if (event.key === 'Escape') {
      onclose();
    }

    if (event.key === 'Enter' && items[selectedIdx]) {
      event.preventDefault();
      onexecute(items[selectedIdx]);
      return true;
    }

    return false;
  };

  let selectableElems: HTMLElement[] = $state([]);
</script>

<div
  class={flex({
    direction: 'column',
    gap: '1px',
    borderWidth: '1px',
    borderColor: 'border.secondary',
    borderRadius: '12px',
    paddingY: '4px',
    backgroundColor: 'background.overlay',
    width: '210px',
    maxHeight: '340px',
    overflow: 'auto',
    boxShadow: 'heavy',
  })}
  role="menu"
>
  {#each items as item, idx (item.id)}
    {#if items[idx - 1]?.group !== item.group}
      {#if idx !== 0}
        <HorizontalDivider style={css.raw({ marginY: '2px' })} color="secondary" />
      {/if}
    {/if}

    <div
      bind:this={selectableElems[idx]}
      class={flex({
        align: 'center',
        gap: '8px',
        marginX: '4px',
        borderRadius: '6px',
        padding: '4px',
        backgroundColor: selectedIdx === idx ? 'neutral.20' : undefined,
      })}
      onclick={() => onexecute(item)}
      onkeydown={handleKeyDown}
      onpointermove={() => {
        if (isOnKeyboardNavigation) {
          isOnKeyboardNavigation = false;
        } else {
          selectedIdx = idx;
        }
      }}
      role="menuitem"
      tabindex="-1"
    >
      <div class={css({ padding: '4px' })}>
        <Icon icon={item.icon} />
      </div>

      <div class={css({ textStyle: '14m' })}>{item.name}</div>
    </div>
  {:else}
    <div class={css({ paddingX: '8px', color: 'text.tertiary', textStyle: '14sb' })}>결과 없음</div>
  {/each}
</div>
