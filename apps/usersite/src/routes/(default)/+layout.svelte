<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex, visuallyHidden } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import { getAccessibleTextColor, hexToRgb } from '@readable/ui/utils';
  import qs from 'query-string';
  import { getContext, setContext } from 'svelte';
  import { swipe } from 'svelte-gestures';
  import CommandIcon from '~icons/lucide/command';
  import SearchIcon from '~icons/lucide/search';
  import ReadableIcon from '~icons/rdbl/readable';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { graphql } from '$graphql';
  import { Img } from '$lib/components';
  import MobileSidebar from './MobileSidebar.svelte';
  import Navigation from './Navigation.svelte';
  import SearchBar from './SearchBar.svelte';
  import type { SwipeCustomEvent } from 'svelte-gestures';

  let { children } = $props();

  const query = graphql(`
    query DefaultLayout_Query($searchQuery: String!) {
      publicSite {
        id
        name
        url
        themeColor
        aiSearchEnabled

        headerLink {
          id
          label
          url
        }

        logo {
          id
          url
          ...Img_image
        }

        firstPage {
          id
        }

        ...Navigation_publicSite
        ...SearchBar_publicSite
      }

      searchPublicPage(query: $searchQuery) {
        estimatedTotalHits

        hits {
          highlight {
            title
            subtitle
            text
          }

          page {
            id
            slug
            title

            ...PageUrl_publicPage
          }
        }
      }
    }
  `);

  const blurEffectThreshold = 100;
  let blurEffectState = $state({
    blurEffect: browser ? window.scrollY < blurEffectThreshold : true,
  });
  setContext('blurEffectState', blurEffectState);

  const uiState = getContext('uiState');

  function openSearchBar() {
    uiState.searchBarOpen = true;
  }

  const swipeHandler = (event: SwipeCustomEvent) => {
    if (event.detail.direction === 'left') {
      uiState.mobileNavOpen = false;
    } else if (event.detail.direction === 'right') {
      uiState.mobileNavOpen = true;
    }
  };
</script>

<svelte:head>
  {#if $query.publicSite.logo}
    <link href={`${$query.publicSite.logo.url}?s=32&f=png`} rel="icon" sizes="32x32" type="image/png" />
  {:else}
    <link href="data:image/x-icon;," rel="icon" type="image/x-icon" />
  {/if}
</svelte:head>

<svelte:window onscroll={() => (blurEffectState.blurEffect = window.scrollY < blurEffectThreshold)} />

<div
  style:--usersite-theme-color={$query.publicSite.themeColor}
  class={flex({ direction: 'column', minHeight: 'screen' })}
  onswipe={swipeHandler}
  use:swipe={{
    touchAction: 'pan-y',
    minSwipeDistance: 60, // default
    timeFrame: 800,
  }}
>
  <a
    class={visuallyHidden({
      zIndex: '100',
      padding: '16px',
      color: 'neutral.0',
      backgroundColor: '[#005FCC]',
      borderBottomColor: 'border.primary',
      borderBottomWidth: '1px',
      textStyle: '16sb',
      _focus: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: 'auto',
        height: 'auto',
        clip: 'auto',
      },
    })}
    href="#main-content"
  >
    메인 콘텐츠로 이동
  </a>

  <header
    class={css({
      display: 'flex',
      position: 'sticky',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '50',
      alignItems: 'center',
      height: '64px',
      borderBottomColor: 'border.secondary',
      borderBottomWidth: {
        md: '1px',
        lg: '1px',
      },
    })}
  >
    <div
      class={css({
        hideBelow: 'md',
        position: 'absolute',
        inset: '0',
        transition: 'background',
        transitionDuration: '500ms',
        backgroundColor: blurEffectState.blurEffect ? 'surface.primary/60' : 'surface.primary',
        backdropFilter: 'auto',
        backdropBlur: '8px',
      })}
      aria-hidden="true"
    ></div>
    <div
      class={flex({
        position: 'relative',
        alignItems: 'center',
        flex: '1',
        width: 'full',
        maxWidth: '1280px',
        marginX: 'auto',
        paddingX: '20px',
        gap: '16px',
        justifyContent: 'space-between',
      })}
    >
      <a class={css({ truncate: true })} href="/">
        <h1
          class={flex({
            flex: '1',
            alignItems: 'center',
            gap: '12px',
            truncate: true,
          })}
        >
          {#if $query.publicSite.logo}
            <Img
              style={css.raw({
                borderRadius: '6px',
                size: '28px',
              })}
              $image={$query.publicSite.logo}
              alt=""
              size={32}
            />
          {/if}
          <span class={css({ textStyle: '18b', truncate: true })}>{$query.publicSite.name}</span>
        </h1>
      </a>

      <div class={flex({ align: 'center', justify: 'flex-end', gap: '8px', flex: 'none' })}>
        <button
          class={flex({
            alignItems: 'center',
            justifyContent: 'space-between',
            shrink: 0,
            borderRadius: '10px',
            borderWidth: '1px',
            borderColor: 'border.secondary',
            paddingX: '14px',
            backgroundColor: 'surface.primary',
            color: 'text.tertiary',
            textStyle: '14r',
            height: '41px',
            width: '260px',
            _hover: {
              borderColor: 'border.primary',
              backgroundColor: 'surface.secondary',
            },
            hideBelow: 'md',
          })}
          aria-label="검색"
          onclick={openSearchBar}
          type="button"
        >
          <div class={flex({ alignItems: 'center', gap: '8px' })}>
            <Icon icon={SearchIcon} size={16} />
            <span>
              {#if $query.publicSite.aiSearchEnabled}
                묻거나 검색하기
              {:else}
                검색하기
              {/if}
            </span>
          </div>
          <div
            class={flex({
              borderRadius: '4px',
              paddingX: '6px',
              paddingY: '2px',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'surface.tertiary',
              color: 'text.tertiary',
              textStyle: '12sb',
              borderWidth: '1px',
            })}
          >
            {#if uiState.hasCmd}
              <Icon icon={CommandIcon} size={12} />
            {:else}
              <span>Ctrl</span>
            {/if}
            <span>K</span>
          </div>
        </button>
        <button
          class={flex({ hideFrom: 'md', marginLeft: 'auto', color: 'neutral.60' })}
          aria-label="검색"
          onclick={openSearchBar}
          type="button"
        >
          <Icon icon={SearchIcon} size={24} />
        </button>

        {#if $query.publicSite.headerLink}
          <a
            style:color={getAccessibleTextColor(hexToRgb($query.publicSite.themeColor))}
            class={flex({
              align: 'center',
              flex: 'none',
              borderRadius: { base: '8px', md: '10px' },
              paddingX: '14px',
              textStyle: '14sb',
              backgroundColor: { base: 'var(--usersite-theme-color)', _hover: 'var(--usersite-theme-color)/80' },
              height: { base: '31px', md: '41px' },
            })}
            href={$query.publicSite.headerLink.url}
          >
            {$query.publicSite.headerLink.label}
          </a>
        {/if}
      </div>
    </div>
  </header>

  <SearchBar $publicSite={$query.publicSite} searchResults={$query.searchPublicPage.hits} />

  <div class={flex({ maxWidth: '1280px', marginX: 'auto', grow: '1', width: 'full' })}>
    {#if $query.publicSite.firstPage}
      <div
        class={css({
          hideBelow: 'md',
          position: 'sticky',
          top: '64px',
          width: '260px',
          height: '[calc(100vh - 64px)]',
          flexShrink: 0,
          paddingTop: '32px',
          paddingX: '20px',
          paddingBottom: '120px',
          overflow: 'auto',
        })}
      >
        <Navigation $publicSite={$query.publicSite} />
      </div>

      <MobileSidebar siteId={$query.publicSite.id} siteUrl={$query.publicSite.url}>
        {#snippet navigation()}
          <Navigation $publicSite={$query.publicSite} />
        {/snippet}
      </MobileSidebar>
    {/if}

    <main id="main-content" class={flex({ flex: '1', width: 'full', alignItems: 'flex-start' })} tabindex="-1">
      {@render children()}
    </main>
  </div>
</div>

<!-- TODO: 결제하면 숨기기 -->
<!-- eslint-disable svelte/no-target-blank -->
<a
  class={flex({
    position: 'fixed',
    bottom: '24px',
    right: '28px',
    gap: '6px',
    paddingX: '12px',
    paddingY: '9px',
    alignItems: 'center',
    borderRadius: '8px',
    boxShadow: 'strong',
    backgroundColor: {
      base: 'gray.1000',
      _dark: 'darkgray.100',
    },
    color: 'neutral.0',
    '& svg path': {
      fill: 'neutral.0',
    },
    textStyle: '13b',
  })}
  href={qs.stringifyUrl({
    url: env.PUBLIC_WEBSITE_URL,
    query: {
      utm_source: 'usersite',
      utm_medium: 'madewithreadable',
      utm_content: new URL($query.publicSite.url).hostname,
      utm_site_id: $query.publicSite.id,
    },
  })}
  target="_blank"
>
  <Icon icon={ReadableIcon} size={18} />
  <span>Made with Readable</span>
</a>
<!-- eslint-enable svelte/no-target-blank -->
