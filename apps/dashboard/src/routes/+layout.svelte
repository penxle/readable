<script lang="ts">
  import '../app.css';

  import { ToastProvider } from '@readable/ui/notification';

  let { children } = $props();
</script>

{@render children()}

<ToastProvider />
