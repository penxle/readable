<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon, Modal } from '@readable/ui/components';
  import XIcon from '~icons/lucide/x';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  type Props = {
    open?: boolean;
    style?: SystemStyleObject | undefined;
    title?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  };

  let { open = $bindable(false), style = undefined, title, children }: Props = $props();
</script>

<Modal style={css.raw({ width: '600px' }, style)} close={() => (open = false)} bind:open>
  <div
    class={flex({
      position: 'sticky',
      top: '0',
      zIndex: '10',
      backgroundColor: 'surface.primary',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingX: '32px',
      paddingY: '20px',
      borderBottomWidth: '1px',
      borderColor: 'border.secondary',
    })}
  >
    <h2 class={css({ textStyle: '16sb' })}>
      {@render title?.()}
    </h2>
    <button onclick={() => (open = false)} type="button">
      <Icon icon={XIcon} size={20} />
    </button>
  </div>

  <div class={css({ paddingX: '32px', paddingY: '24px' })}>
    {@render children?.()}
  </div>
</Modal>
