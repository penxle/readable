<script lang="ts">
  import { flex } from '@readable/styled-system/patterns';
</script>

<div
  class={flex({
    direction: 'column',
    grow: 1,
    minHeight: 'screen',
  })}
>
  <slot />
</div>
