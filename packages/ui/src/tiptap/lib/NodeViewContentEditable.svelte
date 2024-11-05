<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  type Props = {
    as?: keyof HTMLElementTagNameMap;
    style?: SystemStyleObject | undefined;
    [key: string]: unknown;
  };

  let { as = 'div', style, ...rest }: Props = $props();
</script>

<svelte:element this={as} class={css(style)} data-node-view-content-editable {...rest} />
