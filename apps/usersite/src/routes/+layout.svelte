<script lang="ts">
  import '../app.css';

  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';

  export let data: { hasCmd: boolean };

  const mobileNavOpen = writable(false);
  const searchBarOpen = writable(false);
  const hasCmd = writable(false);

  hasCmd.set(data.hasCmd);

  setContext('mobileNavOpen', mobileNavOpen);
  setContext('searchBarOpen', searchBarOpen);
  setContext('hasCmd', hasCmd);

  $: if (browser) {
    hasCmd.set(navigator.platform.toUpperCase().includes('MAC') || /(ipad|iphone|ipod)/i.test(navigator.userAgent));
  }
</script>

<slot />
