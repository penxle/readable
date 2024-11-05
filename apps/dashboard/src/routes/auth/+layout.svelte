<script lang="ts">
  import { center } from '@readable/styled-system/patterns';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();
</script>

<div
  class={center({
    flexDirection: 'column',
    minHeight: 'screen',
    background:
      '[radial-gradient(135.27% 56.6% at 43.4% 46.41%, rgba(254, 219, 198, 0.00) 0%, rgba(255, 192, 156, 0.08) 100%), #FFF]',
  })}
>
  {@render children?.()}
</div>
