<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import MessageSquareMoreIcon from '~icons/lucide/message-square-more';
  import MessageSquarePlusIcon from '~icons/lucide/message-square-plus';

  type Props = {
    pos: number;
    commentCount?: number;
    onclick?: (value: { pos: number; anchor: HTMLButtonElement }) => void;
  };

  let { pos, commentCount = 0, onclick }: Props = $props();

  let buttonEl = $state<HTMLButtonElement>();
</script>

<div class={flex({ position: 'relative', align: 'center', pointerEvents: 'auto' })}>
  <button
    bind:this={buttonEl}
    class={css({ borderRadius: '6px', padding: '2px', color: 'neutral.50', _hover: { backgroundColor: 'neutral.20' } })}
    onclick={() => buttonEl && onclick?.({ pos, anchor: buttonEl })}
    type="button"
  >
    <Icon icon={commentCount > 0 ? MessageSquareMoreIcon : MessageSquarePlusIcon} size={18} />
  </button>
</div>
