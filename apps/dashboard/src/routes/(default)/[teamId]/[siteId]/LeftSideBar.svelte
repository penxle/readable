<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { ReadableError } from '@/errors';
  import { goto } from '$app/navigation';
  import { fragment, graphql } from '$graphql';
  import { editingCategoryId, treeOpenState } from '$lib/svelte/stores/ui';
  import { PageList } from './@page-tree';
  import type { LeftSideBar_site } from '$graphql';
  import type { CategoryData, PageData } from './@page-tree/types';

  type Props = {
    $site: LeftSideBar_site;
  };

  let { $site: _site }: Props = $props();

  const site = fragment(
    _site,
    graphql(`
      fragment LeftSideBar_site on Site {
        id

        team {
          id
        }

        # NOTE: maxDepth = 2
        categories {
          id
          name
          slug
          order
          recursivePageCount
          __typename

          pages {
            id
            slug
            state
            order
            recursiveChildCount
            title
            __typename

            category {
              id
              slug
            }

            parent {
              id
              slug
            }

            children {
              id
              slug
              state
              order
              recursiveChildCount
              title
              __typename

              category {
                id
                slug
              }

              parent {
                id
                slug
              }
            }
          }
        }
      }
    `),
  );

  async function onCreatePage(parent: CategoryData | PageData) {
    const createPageInput: Parameters<typeof createPage>[0] = {
      siteId: $site.id,
      categoryId: '',
      parentId: '',
    };

    if (parent.__typename === 'Category') {
      createPageInput.categoryId = parent.id;
      createPageInput.parentId = null;
    } else {
      createPageInput.categoryId = parent.category.id;
      createPageInput.parentId = parent.id;
    }

    const page = await createPage(createPageInput);

    mixpanel.track('page:create', {
      depth: parent.__typename === 'Category' ? 1 : 2,
    });

    await goto(`/${$site.team.id}/${$site.id}/${page.id}`);
  }

  async function onDropPage(target: {
    categoryId: string;
    pageId: string;
    parentId: string | null;
    previousOrder?: string;
    nextOrder?: string;
  }) {
    try {
      await updatePagePosition({
        categoryId: target.categoryId,
        pageId: target.pageId,
        parentId: target.parentId,
        lower: target.previousOrder,
        upper: target.nextOrder,
      });
    } catch (err) {
      if (err instanceof ReadableError && err.message === 'page_slug_exists') {
        toast.error('URL이 동일한 페이지가 있습니다');
        return false;
      }

      toast.error('알 수 없는 오류가 발생했습니다');
      return false;
    }

    mixpanel.track('page:move');

    return true;
  }

  const createCategory = graphql(`
    mutation LeftSideBar_CreateCategory_Mutation($input: CreateCategoryInput!) {
      createCategory(input: $input) {
        id
        name
        order
        __typename
      }
    }
  `);

  const updateCategoryPosition = graphql(`
    mutation LeftSideBar_UpdateCategoryPosition_Mutation($input: UpdateCategoryPositionInput!) {
      updateCategoryPosition(input: $input) {
        id
        order
      }
    }
  `);

  const createPage = graphql(`
    mutation LeftSideBar_CreatePage_Mutation($input: CreatePageInput!) {
      createPage(input: $input) {
        id
      }
    }
  `);

  const updatePagePosition = graphql(`
    mutation LeftSideBar_UpdatePagePosition_Mutation($input: UpdatePagePositionInput!) {
      updatePagePosition(input: $input) {
        id
      }
    }
  `);
</script>

<aside
  class={flex({
    position: 'relative',
    zIndex: '50',
    flexDirection: 'column',
    flex: 'none',
    backgroundColor: 'surface.secondary',
    minWidth: '240px',
    width: '[18.75%]',
    maxWidth: '360px',
    borderRightWidth: '1px',
    borderColor: 'border.secondary',
    overflowY: 'auto',
  })}
>
  <nav class={flex({ flex: '1', flexDirection: 'column', overflow: 'auto' })}>
    <div
      class={css({
        flex: '1',
        padding: '20px',
        paddingBottom: '120px',
        overflow: 'auto',
      })}
      role="tree"
    >
      <PageList
        getPageUrl={(page) => `/${$site.team.id}/${$site.id}/${page.id}`}
        items={$site.categories}
        oncreate={onCreatePage}
        oncreatecategory={async () => {
          const category = await createCategory({
            siteId: $site.id,
            lower: $site.categories.at(-1)?.order,
          });

          editingCategoryId.set(category.id);

          mixpanel.track('category:create');
        }}
        ondrop={onDropPage}
        ondropcategory={async (target) => {
          await updateCategoryPosition({
            categoryId: target.categoryId,
            lower: target.previousOrder,
            upper: target.nextOrder,
          });

          mixpanel.track('category:move');
        }}
        openState={$treeOpenState}
      />
    </div>
  </nav>
</aside>
