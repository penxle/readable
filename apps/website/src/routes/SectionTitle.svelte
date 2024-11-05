<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import type { Snippet } from 'svelte';

  type Props = {
    subtitle?: Snippet;
    title?: Snippet;
    description?: Snippet;
  };

  let { subtitle, title, description }: Props = $props();
</script>

<div
  class={flex({
    flexDirection: 'column',
    gap: '16px',
    lgDown: {
      gap: '10px',
    },
  })}
>
  <div
    class={css({
      fontSize: '20px',
      fontWeight: '[600]',
      lgDown: {
        fontSize: '13px',
      },
    })}
  >
    {@render subtitle?.()}
  </div>

  <h1
    class={css({
      fontSize: '[45px]',
      fontWeight: '[800]',
      lineHeight: '[138%]',
      lgDown: {
        fontSize: '24px',
        marginTop: '2px',
      },
    })}
  >
    {@render title?.()}
  </h1>

  <div
    class={css({
      fontSize: '0',
      '& > * > span': {
        fontSize: '20px',
        fontWeight: '[500]',
        color: 'text.tertiary',
        lgDown: {
          fontSize: '14px',
        },
      },
      '& > * > em': {
        fontSize: '20px',
        fontWeight: '[700]',
        color: 'text.primary',
        lgDown: {
          fontSize: '14px',
        },
      },
    })}
  >
    {@render description?.()}
  </div>
</div>
