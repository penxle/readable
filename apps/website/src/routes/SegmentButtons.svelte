<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';

  type Props = {
    variant?: 'default' | 'white';
    defaultValue?: string;
    items?: {
      label: string;
      value: string;
    }[];
    onselect?: (value: string) => void;
  };

  let { variant = 'default', defaultValue, items = [], onselect }: Props = $props();

  let selectedValue = $state(defaultValue ?? items[0].value);
  const selectedIndex = $derived(items.findIndex((item) => item.value === selectedValue));
</script>

<div
  class={flex({
    position: 'relative',
    gap: '4px',
    padding: '4px',
    borderRadius: '10px',
    background: 'white/14',
  })}
>
  <div
    style:left={`calc(4px + ${selectedIndex} * (${100 / items.length}% - ${4 / items.length}px))`}
    class={css(
      {
        position: 'absolute',
        width: '94px',
        height: '36px',
        lgDown: {
          width: '84px',
          height: '32px',
        },
        borderRadius: '6px',
        background: 'white/14',
        boxShadow: '[0px 3px 8px 0px rgba(0, 0, 0, 0.12), 0px 3px 1px 0px rgba(0, 0, 0, 0.04)]',
        transition: '[left 100ms cubic-bezier(0.3, 0, 0, 1)]',
      },
      variant === 'white' && { background: 'white' },
    )}
    aria-hidden="true"
  ></div>

  {#each items as item (item.value)}
    <button
      class={css(
        {
          width: '94px',
          height: '36px',
          textStyle: '16m',
          zIndex: '1',
          lgDown: {
            width: '84px',
            height: '32px',
            textStyle: '14m',
          },
        },
        variant === 'white' && selectedValue === item.value && { color: 'text.primary' },
      )}
      onclick={() => {
        selectedValue = item.value;
        onselect?.(selectedValue);
      }}
      type="button"
    >
      {item.label}
    </button>
  {/each}
</div>
