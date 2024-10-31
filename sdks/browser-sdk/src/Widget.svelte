<script lang="ts">
  import { Readability } from '@mozilla/readability';
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import IconX from '~icons/lucide/x';
  import { css } from '$styled-system/css';
  import { center, flex } from '$styled-system/patterns';
  import { token } from '$styled-system/tokens';
  import { Icon } from './components';

  const siteId = (document.currentScript as HTMLScriptElement).dataset.siteId;
  const themeColor = token('colors.neutral.100');

  let popoverEl: HTMLDivElement;
  let open = false;

  const selectors = [
    'title',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    '[role="heading"]',
    '[role="tab"][aria-selected="true"]',
  ];

  let loadingCount = 0;
  let response: {
    site: { id: string; name: string; url: string };
    pages: { id: string; title: string; score: number }[];
  } | null = null;
  let lastQueriedKeywords: string[] = [];

  $: pages = response?.pages.filter((page) => page.score > 0.5);

  $: if (open) {
    observe();
  }

  let lastTopLayerElement: HTMLElement | null = null;
  let topLayerElements: HTMLElement[] = [];

  const observe = async () => {
    const elements = [...document.querySelectorAll('dialog[open], :popover-open')] as HTMLElement[];
    topLayerElements = topLayerElements.filter((el) => elements.includes(el));
    topLayerElements = [...topLayerElements, ...elements.filter((el) => !topLayerElements.includes(el))];

    const topLayerElement = topLayerElements.at(-1) ?? null;
    if (topLayerElement !== lastTopLayerElement) {
      lastTopLayerElement = topLayerElement;
      const widgetEl = document.querySelector('rdbl-widget');
      if (widgetEl) {
        (topLayerElement ?? document.body).append(widgetEl);
        popoverEl.showPopover();
      }
    }

    try {
      loadingCount += 1;

      // NOTE: 위젯이 열려있지 않으면 쿼리하지 않도록 임시 처리
      if (!open) {
        return;
      }

      const elements = [...document.querySelectorAll(selectors.join(','))];
      const readability = new Readability(document.cloneNode(true) as Document);
      const article = readability.parse();

      const texts = [...elements.map((element) => element.textContent), article?.title, article?.textContent]
        .map((text) => text?.replaceAll(/\s+/g, ' ').trim())
        .filter((text) => text?.length) as string[];

      if (texts.length === 0) {
        return;
      }

      // 간단한 캐싱
      if (JSON.stringify(lastQueriedKeywords) === JSON.stringify(texts)) {
        return;
      }

      lastQueriedKeywords = texts;

      const url = import.meta.env.PROD ? 'https://api.rdbl.io/widget/query' : 'http://localhost:3000/widget/query';
      const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ keywords: texts, siteId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // 쿼리 결과가 한번에 여러개 들어오는 경우 마지막 쿼리 결과만 사용하도록 함
      if (lastQueriedKeywords !== texts) {
        return;
      }

      response = await resp.json();
    } finally {
      loadingCount -= 1;
    }
  };

  onMount(() => {
    popoverEl.showPopover();

    const observer = new MutationObserver(() => {
      observe();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    observe();

    return () => {
      observer.disconnect();
    };
  });
</script>

<div
  bind:this={popoverEl}
  class={css({
    position: 'relative',
    width: 'screen',
    height: 'screen',
    pointerEvents: 'none',
    _backdrop: {
      display: 'none',
    },
  })}
  popover="manual"
>
  <button
    class={css({
      position: 'absolute',
      bottom: '32px',
      right: '32px',
      display: 'block',
      size: '48px',
      pointerEvents: 'auto',
    })}
    type="button"
    on:click={() => (open = !open)}
    on:pointerdown|stopPropagation
    transition:fly={{ y: 5 }}
  >
    {#if open}
      <div
        style:--widget-theme-color={themeColor}
        class={center({
          position: 'absolute',
          inset: '0',
          size: 'full',
          color: 'neutral.30',
          backgroundColor: 'neutral.80',
          borderRadius: 'full',
          boxShadow: '[0px 8px 32px 0px token(colors.neutral.100/10)]',
        })}
        transition:scale={{ start: 0.8 }}
      >
        <Icon icon={IconX} size={24} />
      </div>
    {:else}
      <div
        style:--widget-theme-color={themeColor}
        class={center({
          position: 'absolute',
          inset: '0',
          size: 'full',
          color: 'neutral.0',
          backgroundColor: '[var(--widget-theme-color)]',
          borderRadius: 'full',
          textStyle: '24eb',
          boxShadow: '[0px 8px 32px 0px token(colors.neutral.100/10)]',
        })}
        transition:scale={{ start: 0.8 }}
      >
        ?
      </div>
    {/if}
  </button>

  {#if open}
    <div
      class={flex({
        direction: 'column',
        gap: '4px',
        position: 'fixed',
        bottom: '92px',
        right: '32px',
        borderRadius: '16px',
        paddingX: '24px',
        paddingY: '16px',
        width: '320px',
        height: '160px',
        // height: '480px',
        textStyle: '14m',
        color: 'neutral.80',
        backgroundColor: 'white',
        boxShadow: 'emphasize',
        pointerEvents: 'auto',
      })}
      on:pointerdown|stopPropagation
      transition:fly={{ y: 5 }}
    >
      <div class={css({ textStyle: '14b' })}>관련 문서</div>
      {#if loadingCount > 0}
        현재 페이지에서 가장 <br />
        도움이 될 문서를 찾고 있어요...
      {:else if response && pages}
        {#each pages as page, idx (idx)}
          <div>
            <a
              class={css({
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                _hover: {
                  color: 'neutral.100',
                },
              })}
              href={`${response.site.url}/go/${page.id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {page.title}
            </a>
          </div>
        {:else}
          결과 없음
        {/each}
      {:else}
        결과 없음
      {/if}
    </div>
  {/if}
</div>
