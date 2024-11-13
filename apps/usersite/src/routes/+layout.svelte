<script lang="ts">
  import '../app.css';

  import { setContext } from 'svelte';

  let { data, children } = $props();

  let uiState = $state({
    mobileNavOpen: false,
    searchBarOpen: false,
    hasCmd: false,
  });

  uiState.hasCmd = data.hasCmd;
  setContext('uiState', uiState);

  $effect(() => {
    uiState.hasCmd =
      navigator.platform.toUpperCase().includes('MAC') || /(ipad|iphone|ipod)/i.test(navigator.userAgent);
  });
</script>

{@render children()}
