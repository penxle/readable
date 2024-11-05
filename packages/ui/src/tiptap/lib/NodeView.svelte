<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { getContext } from 'svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';
  import type { DragEventHandler } from 'svelte/elements';

  type Props = {
    as?: keyof HTMLElementTagNameMap;
    style?: SystemStyleObject;
    children: Snippet;
    [key: string]: unknown;
  };

  let { as = 'div', style, children, ...rest }: Props = $props();

  const onDragStart = getContext<DragEventHandler<HTMLDivElement>>('onDragStart');
</script>

<svelte:element
  this={as}
  class={cx(css({ whiteSpace: 'normal' }, style))}
  data-node-view
  ondragstart={onDragStart}
  role="presentation"
  {...rest}
>
  {@render children()}
</svelte:element>
