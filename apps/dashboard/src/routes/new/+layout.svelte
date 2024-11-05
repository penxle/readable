<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();
</script>

<div
  class={flex({
    direction: 'column',
    grow: 1,
    minHeight: 'screen',
  })}
>
  {@render children?.()}
</div>
