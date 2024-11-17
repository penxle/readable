<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { TiptapRenderer } from '@readable/ui/tiptap';
  import { graphql } from '$graphql';

  const query = graphql(`
    query RenderPage_Query($pageId: ID!) {
      publicSite {
        id
        themeColor
      }

      publicPageById(pageId: $pageId) {
        id

        content {
          id
          content
        }
      }
    }
  `);
</script>

<div style:--usersite-theme-color={$query.publicSite.themeColor} class={css({ display: 'contents' })}>
  <TiptapRenderer content={$query.publicPageById.content.content} />
</div>
