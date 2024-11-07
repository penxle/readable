<svelte:options customElement={{ tag: 'rdbl-widget' }} />

<script lang="ts">
  import { trpc } from './trpc';
  import Widget from './Widget.svelte';

  type Props = {
    'site-id': string;
  };

  let { 'site-id': siteId }: Props = $props();
</script>

{#await trpc.widget.site.query({ siteId }) then site}
  <Widget {site} />
{/await}
