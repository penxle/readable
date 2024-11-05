<script lang="ts">
  import '../app.css';

  import { ToastProvider } from '@readable/ui/notification';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();
</script>

{@render children?.()}
<ToastProvider />
