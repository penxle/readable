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
        title

        content {
          id
          content
        }
      }
    }
  `);

  const handleClick = (e: MouseEvent) => {
    if (e.target instanceof HTMLAnchorElement) {
      e.preventDefault();
      window.open(e.target.href, '_blank');
    }
  };
</script>

<div
  style:--usersite-theme-color={$query.publicSite.themeColor}
  class={css({ display: 'contents' })}
  onclickcapture={handleClick}
>
  <h1 class={css({ textStyle: '34b', marginBottom: '32px' })}>{$query.publicPageById.title}</h1>
  <TiptapRenderer content={$query.publicPageById.content.content} />
</div>
