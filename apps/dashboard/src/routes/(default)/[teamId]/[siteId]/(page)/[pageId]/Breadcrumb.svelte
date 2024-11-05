<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { fragment, graphql } from '$graphql';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { PagePage_Breadcrumb_query } from '$graphql';

  type Props = {
    $query: PagePage_Breadcrumb_query;
    style?: SystemStyleObject;
  };

  let { $query: _query, style }: Props = $props();

  const query = fragment(
    _query,
    graphql(`
      fragment PagePage_Breadcrumb_query on Query {
        page(pageId: $pageId) {
          id
          title

          category {
            id
            name
          }

          # NOTE: maxDepth = 2
          parent {
            id
            title
          }

          site {
            id

            team {
              id
            }
          }
        }
      }
    `),
  );

  // NOTE: maxDepth = 2
  const breadcrumbs = $derived([$query.page.parent, $query.page].filter(Boolean) as NonNullable<typeof $query.page>[]);
</script>

<nav class={css({ truncate: true }, style)} aria-label="Breadcrumb">
  <ol
    class={flex({
      align: 'center',
      gap: '6px',
      truncate: true,
      '& > li': {
        textStyle: '15r',
      },
      '& > li > a': {
        display: 'block',
        borderRadius: '4px',
        truncate: true,
        _hover: { color: 'var(--usersite-theme-color)' },
      },
    })}
  >
    <li class={css({ color: 'text.secondary', truncate: true })}>
      <span>{$query.page.category.name}</span>
    </li>
    {#each breadcrumbs as page, i (page.id)}
      <li class={css({ color: 'neutral.50' })} aria-hidden="true">/</li>
      {@const current = i === breadcrumbs.length - 1}
      <li class={css({ color: 'text.secondary', truncate: true })}>
        <a
          aria-current={current ? 'page' : undefined}
          href={`/${$query.page.site.team.id}/${$query.page.site.id}/${page.id}`}
        >
          {page.title}
        </a>
      </li>
    {/each}
  </ol>
</nav>
