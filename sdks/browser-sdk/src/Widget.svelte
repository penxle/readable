<script lang="ts">
  import { createBubbler, run, stopPropagation } from 'svelte/legacy';

  const bubble = createBubbler();
  import { Readability } from '@mozilla/readability';
  import stringHash from '@sindresorhus/string-hash';
  import stringify from 'fast-json-stable-stringify';
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
  let open = $state(false);

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

  let loadingCount = $state(0);
  let lastHash = 0;

  let response = $state<{
    site: { id: string; name: string; url: string };
    pages: { id: string; title: string; score: number }[];
  } | null>(null);

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

      const keywords = elements
        .map((element) => element.textContent)
        .map((text) => text?.replaceAll(/\s+/g, ' ').trim())
        .filter((text) => text?.length) as string[];

      const text = article?.textContent?.replaceAll(/\s+/g, ' ').trim();

      const hash = stringHash(stringify({ keywords, text }));

      if (hash === lastHash) {
        return;
      }

      lastHash = hash;

      const url = import.meta.env.PROD ? 'https://api.rdbl.io/widget/query' : 'http://localhost:3000/widget/query';
      const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ siteId, keywords, text }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

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

  const pages = $derived.by(() => response?.pages.filter((page) => page.score >= 0.8));

  run(() => {
    if (open) {
      observe();
    }
  });
</script>

<div
  bind:this={popoverEl}
  class={css({
    position: 'fixed',
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
    onclick={() => (open = !open)}
    onpointerdown={stopPropagation(bubble('pointerdown'))}
    type="button"
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
      onpointerdown={stopPropagation(bubble('pointerdown'))}
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
