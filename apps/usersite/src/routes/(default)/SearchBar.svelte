<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { HorizontalDivider, Icon } from '@readable/ui/components';
  import * as R from 'remeda';
  import { getContext, tick } from 'svelte';
  import { run } from 'svelte/legacy';
  import { writable } from 'svelte/store';
  import SvelteMarkdown from 'svelte-markdown';
  import ChevronLeftIcon from '~icons/lucide/chevron-left';
  import CircleXIcon from '~icons/lucide/circle-x';
  import MoveLeftIcon from '~icons/lucide/move-left';
  import SearchIcon from '~icons/lucide/search';
  import { browser } from '$app/environment';
  import { beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { fragment, graphql } from '$graphql';
  import { pageUrl } from '$lib/utils/url';
  import AiIcon from './@ai/AiIcon.svelte';
  import AiLoading from './@ai/AiLoading.svelte';
  import type { SearchBar_publicSite } from '$graphql';

  const searchBarOpen = getContext('searchBarOpen');
  const hasCmd = getContext('hasCmd');

  // NOTE: p, em, strong, ul, ol, li 이외에는 AI 출력에서 발견하지 못함
  const markdownStyles = css({
    '& p:not(:last-child)': {
      marginBottom: '16px',
      lineHeight: '[1.6]',
    },
    '& em': {
      fontStyle: 'italic',
    },
    '& strong': {
      fontWeight: 'bold',
    },
    '& a': {
      // TODO: 본문 인라인 링크 스타일 적용
      textDecoration: 'underline',
    },
    '& del': {
      textDecoration: 'line-through',
    },
    '& code': {
      // TODO: 본문 인라인 코드 스타일 적용
      fontFamily: 'mono',
      backgroundColor: 'neutral.30/70',
      paddingX: '4px',
      paddingY: '2px',
      borderRadius: '4px',
      fontSize: '[0.9em]',
    },
    '& ul, & ol': {
      marginBottom: '16px',
      paddingLeft: '24px',
    },
    '& ul': {
      listStyleType: 'disc',
    },
    '& ol': {
      listStyleType: 'decimal',
    },
    '& li': {
      marginBottom: '8px',
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontWeight: 'bold',
      marginTop: '24px',
      marginBottom: '16px',
      lineHeight: '[1.25]',
    },
    '& h1': { fontSize: '[2em]' },
    '& h2': { fontSize: '[1.5em]' },
    '& h3': { fontSize: '[1.25em]' },
    '& h4': { fontSize: '[1em]' },
    '& h5': { fontSize: '[0.875em]' },
    '& h6': { fontSize: '[0.85em]' },
  });

  const searchQuery = writable($page.url.searchParams.get('q') ?? '');
  searchBarOpen.set($searchQuery.length > 0);

  if (browser) {
    searchQuery.subscribe((value) => {
      const url = new URL(location.toString());
      if (value.length > 0) {
        url.searchParams.set('q', value);
      } else {
        url.searchParams.delete('q');
      }
      // NOTE: 상태 업데이트를 유발하지 않기 위해 history.replaceState 사용
      history.replaceState(null, '', url.toString());
    });
  }

  let lastRequestedQuery = '';
  type Props = {
    $publicSite: SearchBar_publicSite;
    searchResults?: Awaited<ReturnType<typeof searchPublicPage.refetch>>['searchPublicPage']['hits'];
  };

  let { $publicSite: _publicSite, searchResults = $bindable([]) }: Props = $props();

  const searchPublicPage = graphql(`
    query SearchBar_Query($query: String!) @manual {
      searchPublicPage(query: $query) {
        estimatedTotalHits

        hits {
          highlight {
            title
            subtitle
            text
          }

          page {
            id
            title

            ...PageUrl_publicPage
          }
        }
      }
    }
  `);

  const searchPublicPageByNaturalLanguage = graphql(`
    query SearchBar_Query_ByNaturalLanguage($query: String!) @manual {
      searchPublicPageByNaturalLanguage(query: $query) {
        answer
        pages {
          id
          title

          ...PageUrl_publicPage
        }
      }
    }
  `);

  let aiState: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
  let aiSearchResult:
    | Awaited<ReturnType<typeof searchPublicPageByNaturalLanguage.refetch>>['searchPublicPageByNaturalLanguage']
    | null = $state(null);

  const debouncedSearch = R.debounce(
    async (query: string) => {
      const result = await searchPublicPage.refetch({ query });
      searchResults = result.searchPublicPage.hits;
      if (selectedResultIndex !== -1) {
        selectedResultIndex = null;
      }
    },
    {
      timing: 'trailing',
      waitMs: 16,
    },
  );

  async function aiSearch(query: string) {
    if (query === lastRequestedQuery) {
      return;
    }

    aiState = 'loading';
    lastRequestedQuery = query;
    try {
      const result = await searchPublicPageByNaturalLanguage.refetch({ query });

      if (query !== lastRequestedQuery) {
        return;
      }

      aiState = 'success';
      aiSearchResult = result.searchPublicPageByNaturalLanguage;
    } catch {
      if (query !== lastRequestedQuery) {
        return;
      }

      aiState = 'error';
      aiSearchResult = null;
    }
  }

  function closeModal() {
    aiState = 'idle';
    aiSearchResult = null;
    searchBarOpen.set(false);
    searchQuery.set('');
    lastRequestedQuery = '';
    searchResults = [];
    selectedResultIndex = null;
  }

  function clearSearch(e: MouseEvent) {
    e.stopPropagation();
    searchQuery.set('');
    lastRequestedQuery = '';
    searchResults = [];
    selectedResultIndex = null;
    inputEl.focus();
  }

  let modalEl: HTMLDivElement = $state();
  let inputEl: HTMLInputElement = $state();
  let listEl: HTMLUListElement = $state();
  let selectedResultIndex: number | null = $state(null);

  function handleInputKeyDown(event: KeyboardEvent) {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && event.isComposing) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if ($searchBarOpen) {
      if (event.key === 'Escape') {
        closeModal();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedResultIndex === null) {
          selectedResultIndex = aiEnabled ? -1 : 0;
        } else {
          if (selectedResultIndex === -1) {
            aiSearch($searchQuery);
          } else {
            goto(pageUrl(searchResults[selectedResultIndex].page));
          }
        }
        return;
      }

      if (aiState === 'idle') {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (selectedResultIndex === null) {
            selectedResultIndex = aiEnabled ? -1 : 0;
          } else if (event.key === 'ArrowDown') {
            selectedResultIndex = selectedResultIndex + 1;
            if (selectedResultIndex >= searchResults.length) {
              selectedResultIndex = aiEnabled ? -1 : 0;
            }
          } else if (event.key === 'ArrowUp') {
            selectedResultIndex = selectedResultIndex - 1;
            if (selectedResultIndex < -1) {
              selectedResultIndex = aiEnabled ? -1 : searchResults.length - 1;
            }
          }
        }

        await tick();
        const selectedElem = listEl?.querySelector<HTMLElement>(`& > [aria-selected="true"]`);
        if (
          selectedElem &&
          (selectedElem.offsetTop < listEl.scrollTop ||
            selectedElem.offsetTop + selectedElem.clientHeight > listEl.scrollTop + listEl.clientHeight)
        ) {
          selectedElem.scrollIntoView({
            block: 'nearest',
          });
        }
      }
    } else {
      const metaOrCtrlKeyOnly =
        ($hasCmd ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey) &&
        !event.altKey &&
        !event.shiftKey;
      if (!$searchBarOpen && event.key === 'k' && metaOrCtrlKeyOnly) {
        event.preventDefault();
        searchBarOpen.set(true);
      }
    }
  }

  beforeNavigate(() => {
    closeModal();
  });
  let publicSite = $derived(
    fragment(
      _publicSite,
      graphql(`
        fragment SearchBar_publicSite on PublicSite {
          id
          aiSearchEnabled
        }
      `),
    ),
  );
  let aiEnabled = $derived($publicSite.aiSearchEnabled);
  run(() => {
    if ($searchQuery.length > 0 && aiState === 'idle') {
      if (browser) {
        debouncedSearch.call($searchQuery);
      }
    } else if ($searchQuery.length === 0 && aiState !== 'idle') {
      aiState = 'idle';
      aiSearchResult = null;
    }
  });
  run(() => {
    if (browser && $searchBarOpen) {
      tick().then(() => {
        inputEl.focus();
      });
    }
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if $searchBarOpen}
  <div
    class={css({
      position: 'fixed',
      zIndex: '50',
      paddingTop: '80px',
      paddingX: '80px',
      smOnly: {
        padding: '0',
      },
      inset: '0',
    })}
  >
    <div
      class={css({
        hideBelow: 'md',
        position: 'fixed',
        inset: '0',
        backgroundColor: 'white/60',
        backdropFilter: 'auto',
        backdropBlur: '4px',
      })}
      aria-label="검색 모드 닫기"
      onclick={closeModal}
      onkeydown={closeModal}
      role="button"
      tabindex="-1"
    ></div>
    <div
      bind:this={modalEl}
      class={flex({
        position: 'relative',
        zIndex: '100',
        flexDirection: 'column',
        width: 'full',
        marginX: 'auto',
        maxWidth: '850px',
        maxHeight: '590px',
        backgroundColor: 'surface.primary',
        borderRadius: { md: '[22px]' },
        boxShadow: 'heavy',
        padding: '8px',
        smOnly: {
          height: 'screen',
          maxHeight: 'none',
          padding: '0',
        },
      })}
    >
      <div
        class={flex({
          flexShrink: 0,
          alignItems: 'center',
          smOnly: {
            gap: '12px',
            height: '64px',
            paddingX: '20px',
            borderBottomWidth: '1px',
            borderColor: 'border.secondary',
          },
        })}
      >
        <button class={flex({ hideFrom: 'md' })} aria-label="검색 모드 닫기" onclick={closeModal} type="button">
          <Icon icon={MoveLeftIcon} size={24} />
        </button>
        <label
          class={flex({
            position: 'relative',
            width: 'full',
            borderRadius: '14px',
            smOnly: {
              borderRadius: '10px',
            },
            textStyle: '16m',
            alignItems: 'center',
            borderWidth: '1px',
            borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
            paddingX: '18px',
            color: { base: 'gray.500', _dark: 'darkgray.400' },
            backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
            transition: 'common',
            _hover: {
              borderColor: 'var(--usersite-theme-color)/46',
            },
            _hasFocusedInput: {
              borderColor: 'var(--usersite-theme-color)',
              outlineWidth: '1px',
              outlineColor: 'var(--usersite-theme-color)',
            },
            _hasFilledInput: {
              color: { base: 'gray.1000', _dark: 'darkgray.100' },
              borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
            },
            _hasDisabledInput: {
              color: { base: 'gray.500', _dark: 'darkgray.600' },
              backgroundColor: { base: 'gray.200', _dark: 'darkgray.900' },
              borderColor: { base: 'gray.200', _dark: 'darkgray.700' },
            },
            _hasInvalidInput: {
              borderColor: { base: 'red.600', _dark: 'red.500' },
              _hasFocusedInput: {
                borderColor: { base: 'red.600', _dark: 'red.500' },
              },
              _hasFilledInput: {
                color: { base: 'gray.1000', _dark: 'darkgray.100' },
                backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
              },
            },
          })}
          for="search-input"
        >
          {#if aiState === 'idle'}
            <Icon style={css.raw({ color: 'neutral.50' })} icon={SearchIcon} size={18} />
          {:else}
            <button
              class={flex({
                borderRadius: '4px',
                backgroundColor: 'neutral.20',
                _hover: {
                  backgroundColor: 'neutral.30',
                },
                padding: '2px',
              })}
              aria-label="AI 검색 취소"
              onclick={() => (aiState = 'idle')}
              type="button"
            >
              <Icon style={css.raw({ color: 'neutral.50' })} icon={ChevronLeftIcon} size={18} />
            </button>
          {/if}

          <input
            bind:this={inputEl}
            id="search-input"
            class={css({
              marginLeft: '8px',
              width: 'full',
              paddingY: '8px',
              height: '47px',
            })}
            aria-live={$searchQuery ? 'polite' : 'off'}
            onkeydown={handleInputKeyDown}
            placeholder="검색어를 입력하세요"
            type="text"
            bind:value={$searchQuery}
          />

          {#if $searchQuery}
            <button
              class={css({
                marginLeft: '14px',
                cursor: 'pointer',
                color: 'neutral.50',
              })}
              aria-label="검색어 지우기"
              onclick={clearSearch}
              type="button"
            >
              <Icon icon={CircleXIcon} size={18} />
            </button>
          {/if}
        </label>
      </div>
      {#if $searchQuery.length > 0}
        {#if aiState === 'idle'}
          <ul bind:this={listEl} class={css({ marginTop: '12px', overflowY: 'auto', smOnly: { paddingX: '20px' } })}>
            {#if aiEnabled}
              <div
                class={flex({
                  gap: '16px',
                  alignItems: 'center',
                  paddingX: '18px',
                  paddingY: '16px',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  _hover: {
                    backgroundColor: 'var(--usersite-theme-color)/4',
                  },
                  _selected: {
                    backgroundColor: 'var(--usersite-theme-color)/4',
                  },
                  _focus: {
                    backgroundColor: 'var(--usersite-theme-color)/4',
                  },
                })}
                aria-selected={selectedResultIndex === -1}
                onclick={() => aiSearch($searchQuery)}
                onfocus={() => {
                  selectedResultIndex = -1;
                }}
                onkeydown={null}
                role="option"
                tabindex="0"
              >
                <AiIcon />

                <div class={css({ flexDirection: 'column', truncate: true })}>
                  <p class={css({ fontSize: '0' })}>
                    <span class={css({ textStyle: '16sb' })}>AI에게 물어보기: "</span>
                    <em class={css({ textStyle: '16sb', color: 'var(--usersite-theme-color)' })}>{$searchQuery}</em>
                    <span class={css({ textStyle: '16sb' })}>"</span>
                  </p>
                  <p class={css({ textStyle: '14r', truncate: true })}>
                    사이트의 내용을 기반으로 가장 도움이 되는 정보를 찾아드릴게요
                  </p>
                </div>
              </div>
            {/if}

            {#if searchResults.length > 0}
              {#each searchResults as result, index (result.page.id)}
                <a
                  class={flex({
                    flexDirection: 'column',
                    gap: '2px',
                    paddingX: '18px',
                    paddingY: '16px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    _hover: {
                      backgroundColor: 'var(--usersite-theme-color)/4',
                    },
                    _selected: {
                      backgroundColor: 'var(--usersite-theme-color)/4',
                    },
                    _focus: {
                      backgroundColor: 'var(--usersite-theme-color)/4',
                    },
                  })}
                  aria-selected={selectedResultIndex === index}
                  href={pageUrl(result.page)}
                  onfocus={() => {
                    selectedResultIndex = index;
                  }}
                  role="option"
                  tabindex="0"
                >
                  <h3
                    class={css({
                      color: 'text.primary',
                      textStyle: '16sb',
                      '& em': {
                        color: 'var(--usersite-theme-color)',
                      },
                      truncate: true,
                    })}
                    aria-label={result.page.title}
                  >
                    {@html result.highlight?.title || result.page.title}
                  </h3>
                  {#if result.highlight?.text}
                    <p
                      class={css({
                        color: 'text.secondary',
                        textStyle: '14r',
                        '& em': {
                          color: 'var(--usersite-theme-color)',
                        },
                        truncate: true,
                      })}
                      aria-label={result.highlight.text}
                    >
                      {@html result.highlight.text}
                    </p>
                  {/if}
                </a>
              {/each}
            {:else if !aiEnabled}
              <div
                class={flex({
                  flexDirection: 'column',
                  paddingX: '18px',
                  smOnly: {
                    paddingX: '38px',
                  },
                  paddingY: '16px',
                  color: 'text.tertiary',
                  gap: '2px',
                })}
              >
                <p class={css({ textStyle: '16sb' })}>검색 결과가 없습니다</p>
                <p class={css({ textStyle: '14r' })}>다른 검색어를 입력해보세요</p>
              </div>
            {/if}
          </ul>
        {:else if aiState === 'loading'}
          <div
            class={flex({ alignItems: 'center', gap: '12px', marginTop: '12px', paddingX: '18px', paddingY: '16px' })}
          >
            <AiIcon variant="gray" />
            <AiLoading />
          </div>
        {:else if aiState === 'success' && aiSearchResult}
          <div
            class={flex({
              marginTop: '12px',
              paddingX: '18px',
              paddingY: '16px',
              gap: '12px',
              overflow: 'auto',
            })}
          >
            <AiIcon />
            <div class={flex({ flexDirection: 'column', gap: '24px' })}>
              <p class={cx(css({ textStyle: '16r' }), markdownStyles)}>
                <SvelteMarkdown source={aiSearchResult.answer} />
              </p>
              {#if aiSearchResult.pages.length > 0}
                <HorizontalDivider />
                <div>
                  <ul class={flex({ flexDirection: 'column', gap: '6px' })}>
                    {#each aiSearchResult.pages as page, index (index)}
                      <li class={flex()}>
                        <a class={flex({ gap: '6px', alignItems: 'center' })} href={pageUrl(page)}>
                          <div
                            class={center({
                              size: '17px',
                              backgroundColor: 'neutral.30',
                              color: 'text.tertiary',
                              textStyle: '12sb',
                              borderRadius: 'full',
                            })}
                          >
                            {index + 1}
                          </div>
                          <span
                            class={css({
                              textStyle: '16r',
                              color: 'text.secondary',
                              truncate: true,
                              textDecoration: 'underline',
                              textDecorationColor: 'text.secondary/40',
                              textUnderlineOffset: '3px',
                            })}
                          >
                            {page.title}
                          </span>
                        </a>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        {:else if aiState === 'error'}
          <div
            class={flex({
              marginTop: '12px',
              alignItems: 'center',
              gap: '12px',
              paddingX: '18px',
              paddingY: '16px',
            })}
          >
            <AiIcon variant="gray" />
            <p class={css({ textStyle: '14m', color: 'text.tertiary' })}>검색 결과가 없습니다</p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
