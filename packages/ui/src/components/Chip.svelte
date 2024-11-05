<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<div
  class={css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: '1px',
    borderColor: 'accent.20',
    borderRadius: '4px',
    paddingX: '7px',
    paddingY: '6px',
    textStyle: '13sb',
    color: 'text.accent',
    backgroundColor: 'accent.10',
    height: '26px',
  })}
>
  {@render children()}
</div>
