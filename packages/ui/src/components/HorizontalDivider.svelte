<script lang="ts">
  import { css, cva, cx } from '@readable/styled-system/css';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  type Props = {
    color?: 'primary' | 'secondary';
    style?: SystemStyleObject;
  };

  let { color = 'primary', style }: Props = $props();
</script>

<hr
  class={cx(
    cva({
      base: {
        border: 'none',
        width: 'full',
        height: '1px',
        flexShrink: 0,
      },
      variants: {
        color: {
          primary: { backgroundColor: 'divider.primary' },
          secondary: { backgroundColor: 'divider.secondary' },
        },
      },
    })({ color }),
    css(style),
  )}
/>
