<script lang="ts">
  import '../app.css';

  import { setContext } from 'svelte';
  import { run } from 'svelte/legacy';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';

  type Props = {
    data: { hasCmd: boolean };
    children?: import('svelte').Snippet;
  };

  let { data, children }: Props = $props();

  const mobileNavOpen = writable(false);
  const searchBarOpen = writable(false);
  const hasCmd = writable(false);

  hasCmd.set(data.hasCmd);

  setContext('mobileNavOpen', mobileNavOpen);
  setContext('searchBarOpen', searchBarOpen);
  setContext('hasCmd', hasCmd);

  run(() => {
    if (browser) {
      hasCmd.set(navigator.platform.toUpperCase().includes('MAC') || /(ipad|iphone|ipod)/i.test(navigator.userAgent));
    }
  });
</script>

{@render children?.()}
