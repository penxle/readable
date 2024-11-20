<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';

  type Props = {
    defaultValue?: string;
    items?: {
      label: string;
      value: string;
    }[];
    onselect?: (value: string) => void;
  };

  let { defaultValue, items = [], onselect }: Props = $props();

  let selectedValue = $state(defaultValue ?? items[0].value);
  const selectedIndex = $derived(items.findIndex((item) => item.value === selectedValue));
</script>

<div
  class={flex({
    position: 'relative',
    smOnly: {
      width: 'full',
    },
  })}
>
  <div
    style:left={`calc(${selectedIndex} * (${100 / items.length}%))`}
    style:width={`calc(100% / ${items.length})`}
    class={css({
      position: 'absolute',
      height: '2px',
      bottom: '0',
      borderRadius: '6px',
      background: '[#09090B]',
      transition: '[left 100ms cubic-bezier(0.3, 0, 0, 1)]',
    })}
    aria-hidden="true"
  ></div>

  {#each items as item (item.value)}
    <button
      class={css(
        center.raw({
          smOnly: {
            flex: '1',
          },
          md: {
            width: '112px',
          },
          height: '46px',
          textStyle: '14sb',
          zIndex: '1',
          color: '[#52525B]',
        }),
        selectedValue === item.value && { color: '[#09090B]' },
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
