<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { fragment, graphql } from '$graphql';
  import { pageUrl } from '$lib/utils/url';
  import type { PagePage_Breadcrumb_publicPage } from '$graphql';

  type Props = {
    $publicPage: PagePage_Breadcrumb_publicPage;
  };

  let { $publicPage: _publicPage }: Props = $props();

  const publicPage = fragment(
    _publicPage,
    graphql(`
      fragment PagePage_Breadcrumb_publicPage on PublicPage {
        id
        slug
        title

        category {
          id
          name
        }

        parent {
          id
          slug
          title

          ...PageUrl_publicPage
        }

        ...PageUrl_publicPage
      }
    `),
  );
</script>

<nav aria-label="Breadcrumb">
  <ol
    class={css({
      '& > li': {
        display: 'inline-block',
        color: 'text.secondary',
        textStyle: '15r',
      },
      '& > li > a': {
        _hover: { color: 'var(--usersite-theme-color)' },
      },
    })}
  >
    <li>
      <span>{$publicPage.category.name}</span>
      <span class={css({ color: 'neutral.50' })} aria-hidden="true">/</span>
    </li>
    {#if $publicPage.parent}
      <li>
        <a href={pageUrl($publicPage.parent)}>
          {$publicPage.parent.title}
        </a>
        <span class={css({ color: 'neutral.50' })} aria-hidden="true">/</span>
      </li>
    {/if}
    <li>
      <a aria-current="page" href={pageUrl($publicPage)}>
        {$publicPage.title}
      </a>
    </li>
  </ol>
</nav>
