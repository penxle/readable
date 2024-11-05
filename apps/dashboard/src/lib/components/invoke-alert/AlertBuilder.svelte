<script lang="ts">
  import { Alert } from '@readable/ui/components';
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    oncancel?: () => void;
    onaction: () => void;
    title: Snippet;
    content: Snippet;
    action?: Snippet;
    cancel?: Snippet;
    variant?: 'primary' | 'danger';
  };

  let {
    open = $bindable(false),
    oncancel,
    onaction,
    title,
    content,
    action,
    cancel,
    variant = 'danger',
  }: Props = $props();
</script>

<Alert {action} {cancel} {content} {onaction} {oncancel} {title} {variant} bind:open />
