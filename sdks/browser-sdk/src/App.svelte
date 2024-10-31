<svelte:options customElement={{ tag: 'rdbl-widget' }} />

<script lang="ts">
  import { onMount } from 'svelte';
  import Widget from './Widget.svelte';

  let loaded = false;

  onMount(() => {
    loaded = true;
  });
</script>

{#if loaded}
  <Widget />
{/if}
