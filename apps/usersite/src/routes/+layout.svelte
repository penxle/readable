<script lang="ts">
  import '../app.css';

  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';

  let { data, children } = $props();

  const mobileNavOpen = writable(false);
  const searchBarOpen = writable(false);
  const hasCmd = writable(false);

  hasCmd.set(data.hasCmd);

  setContext('mobileNavOpen', mobileNavOpen);
  setContext('searchBarOpen', searchBarOpen);
  setContext('hasCmd', hasCmd);

  $effect(() => {
    hasCmd.set(navigator.platform.toUpperCase().includes('MAC') || /(ipad|iphone|ipod)/i.test(navigator.userAgent));
  });
</script>

{@render children()}
