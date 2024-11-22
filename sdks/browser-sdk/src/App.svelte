<script lang="ts">
  import { trpc } from './trpc';
  import Widget from './Widget.svelte';

  type Props = {
    dom: HTMLElement;
    siteId: string;
  };

  let { dom, siteId }: Props = $props();
</script>

{#await trpc.widget.site.query({ siteId }) then site}
  <Widget {dom} {site} />
{/await}
