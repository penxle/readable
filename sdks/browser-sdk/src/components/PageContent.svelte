<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { TiptapRenderer } from '@readable/ui/tiptap';
  import { trpc } from '../trpc';

  type Props = {
    siteId: string;
    pageId: string;
  };

  let { siteId, pageId }: Props = $props();
</script>

{#await trpc.widget.page.get.query({ siteId, pageId }) then page}
  <div class={css({ paddingX: '16px' })}>
    <TiptapRenderer content={page.content} />
  </div>
{/await}
