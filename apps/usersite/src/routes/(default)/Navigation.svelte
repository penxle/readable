<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import { getContext } from 'svelte';
  import ChevronDownIcon from '~icons/lucide/chevron-down';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { fragment, graphql } from '$graphql';
  import { pageUrl } from '$lib/utils/url';
  import type { Navigation_publicSite } from '$graphql';

  type Props = {
    $publicSite: Navigation_publicSite;
  };

  let { $publicSite: _publicSite }: Props = $props();

  const publicSite = fragment(
    _publicSite,
    graphql(`
      fragment Navigation_publicSite on PublicSite {
        # NOTE: maxDepth = 2
        categories {
          id
          name
          order
          slug

          pages {
            id
            state
            order
            slug
            title

            parent {
              id
              slug
            }

            children {
              id
              state
              order
              slug
              title

              parent {
                id
                slug
              }

              ...PageUrl_publicPage
            }

            ...PageUrl_publicPage
          }
        }
      }
    `),
  );

  const currentSlug = $derived($page.params.slug);

  function findPage(slug: string) {
    const [categorySlug, ...pageSlugs] = slug.split('/');

    const category = $publicSite.categories.find((c) => c.slug === categorySlug);
    if (!category) {
      return null;
    }

    let page = null;
    for (const slug of pageSlugs) {
      if (page) {
        page = page.children.find((p) => p.slug === slug);
      } else {
        page = category.pages.find((p) => p.slug === slug);
      }
    }

    return page;
  }

  let currentPageId = $state<string>();
  let treeOpenState = $state<Record<string, boolean>>({});
  const uiState = getContext('uiState');

  function updateTreeOpenState() {
    if (currentSlug) {
      let newTreeOpenState: Record<string, boolean> = {};

      // NOTE: 모바일에서 사이드바를 열 때는 현재 페이지만 트리에서 열도록 함
      if (!uiState.mobileNavOpen) {
        newTreeOpenState = treeOpenState;
      }

      const page = findPage(currentSlug);

      if (page) {
        currentPageId = page.id;
        newTreeOpenState[page.id] = true;
        if (page.parent) {
          newTreeOpenState[page.parent.id] = true;
        }
      }

      treeOpenState = newTreeOpenState;
    }
  }

  updateTreeOpenState();
  $effect.pre(() => {
    updateTreeOpenState();
  });

  let navEl = $state<HTMLElement>();

  $effect(() => {
    if (navEl) {
      const currentEl = navEl.querySelector('[aria-current="page"]');

      if (currentEl) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const navRect = navEl.parentElement!.getBoundingClientRect();
        const currentRect = currentEl.getBoundingClientRect();
        navEl.parentElement?.scrollTo({ top: currentRect.top - navRect.height / 2 });
      }
    }
  });

  beforeNavigate(() => {
    uiState.mobileNavOpen = false;
  });
</script>

<nav bind:this={navEl} class={flex({ direction: 'column', gap: '40px', mdDown: { marginBottom: '80px' } })}>
  {#each $publicSite.categories as category (category.id)}
    <div>
      <h2
        class={css({
          color: 'text.primary',
          textStyle: '15eb',
          paddingX: '12px',
          paddingY: '9px',
          borderRadius: '4px',
        })}
      >
        {category.name}
      </h2>
      <ul class={flex({ direction: 'column', listStyle: 'none', gap: '2px' })}>
        {#each category.pages as page (page.id)}
          <li
            class={cx(
              flex({
                position: 'relative',
                alignItems: 'center',
                textStyle: '15r',
                color: 'text.primary',
              }),
              'group',
            )}
            aria-current={page.id === currentPageId ? 'page' : undefined}
          >
            <a
              class={css({
                paddingX: '12px',
                paddingY: '9px',
                borderRadius: '6px',
                paddingRight: '36px',
                flex: '1',
                _groupHover: {
                  backgroundColor: 'var(--usersite-theme-color)/3',
                },
                _currentPage: {
                  color: 'var(--usersite-theme-color)',
                  textStyle: '15b',
                  backgroundColor: 'var(--usersite-theme-color)/3',
                  '& + button': {
                    color: 'var(--usersite-theme-color)',
                  },
                },
              })}
              aria-current={page.id === currentPageId ? 'page' : undefined}
              href={pageUrl(page)}
              onclick={() => {
                treeOpenState[page.id] = true;
              }}
            >
              {page.title}
            </a>
            {#if page.children.length > 0}
              <button
                class={css({
                  position: 'absolute',
                  right: '12px',
                  top: '8px',
                  size: '24px',
                  padding: '4px',
                  borderRadius: '4px',
                  color: 'neutral.50',
                  _hover: {
                    backgroundColor: 'var(--usersite-theme-color)/10',
                    color: 'var(--usersite-theme-color)',
                  },
                })}
                aria-expanded={treeOpenState[page.id] ? 'true' : 'false'}
                aria-label={treeOpenState[page.id] ? '하위 메뉴 닫기' : '하위 메뉴 열기'}
                onclick={() => {
                  treeOpenState[page.id] = !treeOpenState[page.id];
                }}
                type="button"
              >
                <Icon ariaHidden={true} icon={treeOpenState[page.id] ? ChevronDownIcon : ChevronRightIcon} size={16} />
              </button>
            {/if}
          </li>
          {#if page.children.length > 0 && treeOpenState[page.id]}
            <li>
              <ul class={flex({ direction: 'column', listStyle: 'none', gap: '2px' })}>
                {#each page.children as childPage (childPage.id)}
                  <li class={css({ display: 'contents' })}>
                    <a
                      class={css({
                        padding: '7px',
                        paddingLeft: '32px',
                        textStyle: '15r',
                        color: 'text.primary',
                        borderRadius: '6px',
                        _hover: {
                          backgroundColor: 'var(--usersite-theme-color)/3',
                        },
                        _currentPage: {
                          color: 'var(--usersite-theme-color)',
                          textStyle: '15b',
                          backgroundColor: 'var(--usersite-theme-color)/3',
                        },
                      })}
                      aria-current={childPage.id === currentPageId ? 'page' : undefined}
                      href={pageUrl(childPage)}
                    >
                      {childPage.title}
                    </a>
                  </li>
                {/each}
              </ul>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
  {/each}
</nav>
