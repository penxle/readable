<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';

  let { children } = $props();
</script>

<div
  class={flex({
    direction: 'column',
    grow: 1,
    minHeight: 'screen',
  })}
>
  {@render children()}
</div>
