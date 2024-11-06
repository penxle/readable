<script lang="ts">
  import { Alert } from '@readable/ui/components';

  type Props = {
    open?: boolean;
    oncancel?: () => void;
    onaction: () => void;
    title: string;
    content: string;
    action?: string;
    cancel?: string;
    variant?: 'primary' | 'danger';
  };

  let {
    open = $bindable(false),
    oncancel,
    onaction,
    title: titleText,
    content: contentText,
    action: actionText = '확인',
    cancel: cancelText = '취소',
    variant = 'danger',
  }: Props = $props();
</script>

<Alert {onaction} {oncancel} {variant} bind:open>
  {#snippet title()}
    {titleText}
  {/snippet}

  {#snippet content()}
    {contentText}
  {/snippet}

  {#snippet action()}
    {actionText}
  {/snippet}

  {#snippet cancel()}
    {cancelText}
  {/snippet}
</Alert>
