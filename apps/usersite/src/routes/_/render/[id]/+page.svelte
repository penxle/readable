<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { TiptapRenderer } from '@readable/ui/tiptap';
  import { beforeNavigate } from '$app/navigation';
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

  beforeNavigate(({ to, willUnload, cancel }) => {
    if (willUnload) {
      return;
    }

    cancel();

    if (to) {
      window.open(to.url, '_blank');
    }
  });
</script>

<div style:--usersite-theme-color={$query.publicSite.themeColor} class={css({ display: 'contents' })}>
  <h1 class={css({ textStyle: '34b', marginTop: '28px', marginBottom: '32px' })}>{$query.publicPageById.title}</h1>
  <TiptapRenderer style={css.raw({ marginBottom: '28px' })} content={$query.publicPageById.content.content} />
</div>
