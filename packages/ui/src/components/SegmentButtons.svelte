<script lang="ts">
  import { css, sva } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import type { RecipeVariant } from '@readable/styled-system/css';

  type Props = {
    defaultValue?: string;
    items?: { label: string; value: string }[];
    size?: Variants['size'];
    onselect?: (value: string) => void;
  };

  let { defaultValue, items = [], size = 'md', onselect }: Props = $props();

  type Variants = RecipeVariant<typeof recipe>;
  const recipe = sva({
    slots: ['activeIndicator', 'button'],
    base: {
      activeIndicator: {
        position: 'absolute',
        borderRadius: '6px',
        background: 'white',
        borderWidth: '1px',
        borderColor: 'border.secondary',
        transition: '[left 100ms cubic-bezier(0.3, 0, 0, 1)]',
      },
      button: {
        flex: '1',
        zIndex: '1',
        color: 'text.tertiary',
        _selected: {
          color: 'text.primary',
        },
      },
    },
    variants: {
      size: {
        sm: {
          activeIndicator: {
            height: '28px',
          },
          button: {
            textStyle: '12sb',
            height: '28px',
          },
        },
        md: {
          activeIndicator: {
            height: '36px',
          },
          button: {
            textStyle: '16m',
            height: '36px',
          },
        },
      },
    },
  });

  const classes = $derived(recipe.raw({ size }));

  let selectedValue = $state(defaultValue ?? items[0].value);
  const selectedIndex = $derived(items.findIndex((item) => item.value === selectedValue));
</script>

<div
  class={flex({
    position: 'relative',
    gap: '4px',
    padding: '4px',
    borderRadius: '10px',
    backgroundColor: 'neutral.20',
  })}
>
  <div
    style:left={`calc(4px + ${selectedIndex} * ((100% - ${4 * (items.length + 1)}px) / ${items.length} + 4px))`}
    style:width={`calc((100% - ${4 * (items.length + 1)}px) / ${items.length})`}
    class={css(classes.activeIndicator)}
    aria-hidden="true"
  ></div>

  {#each items as item (item.value)}
    <button
      class={css(classes.button)}
      aria-selected={selectedValue === item.value}
      onclick={() => {
        selectedValue = item.value;
        onselect?.(selectedValue);
      }}
      role="tab"
      type="button"
    >
      {item.label}
    </button>
  {/each}
</div>
