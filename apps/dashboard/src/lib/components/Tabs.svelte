<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';

  type Props = {
    tabs?: {
      title: string;
      path: string;
      selected: boolean;
      badge?: number | string;
    }[];
  };

  let { tabs = [] }: Props = $props();
</script>

<div class={flex({ gap: '4px', position: 'relative', paddingTop: '6px' })} role="tablist">
  {#each tabs as { title, path, selected, badge }, i (i)}
    <a
      class={css({
        zIndex: '10',
        height: '40px',
        paddingBottom: '4px',
        _selected: {
          borderBottomWidth: '[1.5px]',
          borderColor: { base: 'gray.1000', _dark: 'darkgray.100' },
          color: { base: 'gray.1000', _dark: 'darkgray.100' },
          '& > span': {
            backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
          },
          _hover: {
            color: { base: 'gray.1000', _dark: 'darkgray.100' },
          },
        },
        _hover: {
          color: { base: 'gray.700', _dark: 'darkgray.300' },
          '& > span': {
            backgroundColor: { base: 'gray.200', _dark: 'darkgray.900' },
          },
        },
        color: { base: 'gray.700', _dark: 'darkgray.300' },
        '& > span': {
          backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
        },
      })}
      aria-selected={selected}
      href={path}
      role="tab"
    >
      <span
        class={flex({
          align: 'center',
          justify: 'center',
          borderRadius: '6px',
          paddingX: '16px',
          textStyle: '14sb',
          height: '34px',
          alignItems: 'center',
          gap: '6px',
        })}
      >
        {title}
        {#if badge}
          <span
            class={center({
              size: '17px',
              borderRadius: 'full',
              backgroundColor: 'neutral.30',
              color: 'text.secondary',
              textStyle: '12sb',
              marginRight: '-2px',
            })}
          >
            {badge}
          </span>
        {/if}
      </span>
    </a>
  {/each}
</div>
