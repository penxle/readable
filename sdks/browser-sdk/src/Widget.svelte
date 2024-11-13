<script lang="ts">
  import { Readability } from '@mozilla/readability';
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { Button, FormProvider, Icon, MarkdownRenderer } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import stringHash from '@sindresorhus/string-hash';
  import dayjs from 'dayjs';
  import stringify from 'fast-json-stable-stringify';
  import mixpanel from 'mixpanel-browser';
  import { onMount, tick, untrack } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { z } from 'zod';
  import ArrowLeftIcon from '~icons/lucide/arrow-left';
  import IconArrowRight from '~icons/lucide/arrow-right';
  import ArrowUpIcon from '~icons/lucide/arrow-up';
  import BookOpenTextIcon from '~icons/lucide/book-open-text';
  import IconEllipsis from '~icons/lucide/ellipsis';
  import MessageCircleIcon from '~icons/lucide/message-circle';
  import IconX from '~icons/lucide/x';
  import AiLoading from './assets/AiLoading.svelte';
  import ReadableLogo from './assets/readable-logo.svg';
  import Sparkle from './assets/Sparkle.svelte';
  import Sparkles from './assets/Sparkles.svelte';
  import SparkleSmall from './assets/SparkleSmall.svelte';
  import { trpc } from './trpc';
  import type { TRPCOutput } from './trpc';

  type Props = {
    site: TRPCOutput['widget']['site'];
  };

  let { site }: Props = $props();

  let popoverEl: HTMLDivElement;
  let open = $state(false);
  let expanded = $state(false);

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

  let response = $state<TRPCOutput['widget']['lookup']>();

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

      const startedAt = dayjs();

      const elements = [...document.querySelectorAll(selectors.join(','))];
      const readability = new Readability(document.cloneNode(true) as Document);
      const article = readability.parse();

      const keywords = elements
        .map((element) => element.textContent)
        .map((text) => text?.replaceAll(/\s+/g, ' ').trim())
        .filter((text) => text?.length) as string[];

      const text = article?.textContent?.replaceAll(/\s+/g, ' ').trim() ?? '';

      const hash = stringHash(stringify({ keywords, text }));

      if (hash === lastHash) {
        return;
      }

      lastHash = hash;

      response = await trpc.widget.lookup.query({
        siteId: site.id,
        keywords,
        text,
      });

      const duration = dayjs().diff(startedAt, 'seconds', true);

      mixpanel.track('widget:lookup', {
        duration,
      });
    } finally {
      loadingCount -= 1;
    }
  };

  let chatSessionId = $state('');
  let chatHistory = $state<
    {
      question: string;
      answer?: string | null;
    }[]
  >([]);

  let chatHistoryEl = $state<HTMLDivElement | undefined>(undefined);

  const {
    form: chatForm,
    context: chatFormContext,
    data: chatFormData,
    isSubmitting: chatFormIsSubmitting,
    resetField: chatFormResetField,
  } = createMutationForm({
    schema: z.object({
      question: z.string(),
    }),
    mutation: async ({ question }) => {
      if (chatHistory.length === 0) {
        const resp = await trpc.widget.chat.new.mutate({ siteId: site.id });
        chatSessionId = resp.sessionId;
      }

      chatHistory.push({ question });

      chatFormResetField('question');

      tick().then(() => {
        chatHistoryEl?.scrollTo({ top: chatHistoryEl.scrollHeight });
      });

      const startedAt = dayjs();

      const answer = await trpc.widget.chat.message.mutate({
        siteId: site.id,
        sessionId: chatSessionId,
        message: question,
      });

      const duration = dayjs().diff(startedAt, 'seconds', true);

      mixpanel.track('widget:chat:message', {
        session_id: chatSessionId,
        duration,
      });

      chatHistory[chatHistory.length - 1] = { question, answer };

      tick().then(() => {
        const questions = chatHistoryEl?.querySelectorAll('.question-bubble');
        if (questions) {
          questions.item(questions.length - 1)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    },
  });

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

  const pages = $derived(response?.pages.filter((page) => page.score >= 0.8));

  $effect(() => {
    if (open) {
      untrack(() => {
        observe();
      });
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
      bottom: '20px',
      right: '20px',
      display: 'block',
      size: '40px',
      pointerEvents: 'auto',
    })}
    onclick={() => (open = !open)}
    onpointerdown={(e) => e.stopPropagation()}
    type="button"
    transition:fly={{ y: 5 }}
  >
    <div
      style:--widget-theme-color={site.themeColor}
      class={center({
        position: 'absolute',
        inset: '0',
        size: 'full',
        color: 'neutral.0',
        background: '[linear-gradient(160deg, var(--widget-theme-color) 9.28%, var(--widget-theme-color) 75%)]', // TODO: hue
        borderRadius: 'full',
        boxShadow: 'strong',
      })}
      transition:scale={{ start: 0.8 }}
    >
      {#if open}
        <Icon icon={IconX} size={18} />
      {:else}
        <Sparkles />
      {/if}
    </div>
  </button>

  {#if open}
    <div style:--widget-theme-color={site.themeColor} class={css({ display: 'contents' })}>
      <div
        class={flex({
          direction: 'column',
          position: 'fixed',
          bottom: '68px',
          right: '20px',
          borderRadius: '[20px]',
          overflow: 'auto',
          width: '380px',
          minHeight: '480px',
          maxHeight: '[calc(100vh - 184px)]',
          textStyle: '14m',
          color: 'text.primary',
          backgroundColor: 'white',
          boxShadow: 'heavy',
          pointerEvents: 'auto',
        })}
        onpointerdown={(e) => e.stopPropagation()}
        transition:fly={{ y: 5 }}
      >
        <div
          class={flex({
            align: 'center',
            justify: 'space-between',
            borderBottomWidth: '1px',
            borderBottomColor: 'border.primary',
            paddingX: '16px',
            paddingY: '14px',
            height: '48px',
          })}
        >
          <div class={flex({ align: 'center', gap: '6px', truncate: true })}>
            {#if chatHistory.length > 0}
              <button
                class={center({ padding: '2px', color: 'neutral.50' })}
                onclick={() => (chatHistory = [])}
                type="button"
              >
                <Icon icon={ArrowLeftIcon} />
              </button>
            {/if}
            <h1 class={css({ textStyle: '14b', truncate: true })}>
              {chatHistory.length > 0 ? `${site.name} AI 문의` : '이 페이지에 대해 물어보기'}
            </h1>
          </div>
          <button class={css({ padding: '2px', color: 'neutral.50' })} onclick={() => (open = false)} type="button">
            <Icon icon={IconX} size={16} />
          </button>
        </div>

        {#if chatHistory.length > 0}
          <div
            bind:this={chatHistoryEl}
            class={flex({
              flexDirection: 'column',
              gap: '10px',
              padding: '16px',
              overflow: 'auto',
              minHeight: '170px',
              maxHeight: '340px',
            })}
          >
            {#each chatHistory as chat, idx (idx)}
              <div class={flex({ justifyContent: 'flex-end', paddingLeft: '68px' })}>
                <p
                  class={cx(
                    'question-bubble',
                    css({
                      borderWidth: '1px',
                      borderColor: 'border.primary',
                      borderRadius: '10px',
                      paddingX: '16px',
                      paddingY: '12px',
                      textStyle: '14r',
                      color: 'text.tertiary',
                      textAlign: 'right',
                      backgroundColor: 'neutral.10',
                    }),
                  )}
                  in:fly|global={{ y: 10 }}
                >
                  {chat.question}
                </p>
              </div>
              <div class={flex({ justifyContent: 'flex-start', gap: '12px' })}>
                <SparkleSmall />

                {#if chat.answer}
                  <MarkdownRenderer
                    style={css.raw({
                      borderWidth: '1px',
                      borderColor: '[var(--widget-theme-color)/8]',
                      borderRadius: '10px',
                      paddingX: '16px',
                      paddingY: '12px',
                      textStyle: '14r',
                      backgroundColor: '[var(--widget-theme-color)/8]',
                      width: 'full',
                    })}
                    source={chat.answer}
                  />
                {:else if chat.answer === null}
                  <p
                    class={css({
                      borderWidth: '1px',
                      borderColor: '[var(--widget-theme-color)/8]',
                      borderRadius: '10px',
                      paddingX: '16px',
                      paddingY: '12px',
                      textStyle: '14r',
                      backgroundColor: '[var(--widget-theme-color)/8]',
                      width: 'full',
                    })}
                  >
                    "{chat.question}"과 연관된 내용을 찾지 못했어요.
                  </p>
                {:else}
                  <AiLoading />
                {/if}
              </div>
            {/each}
          </div>
        {:else if loadingCount > 0}
          <div class={center({ flexDirection: 'column', paddingY: '20px', gap: '20px' })}>
            <Sparkle />
            <p class={css({ textStyle: '14b' })}>현재 페이지에서 가장 도움이 될 문서를 찾고 있어요...</p>
          </div>
        {:else if response && pages}
          <div class={css({ padding: '16px' })}>
            {#if pages.length > 0}
              <div
                class={css({
                  marginBottom: '20px',
                  borderWidth: '1px',
                  borderColor: '[var(--widget-theme-color)/16]',
                  borderRadius: '10px',
                  paddingX: '16px',
                  paddingY: '12px',
                  backgroundColor: '[var(--widget-theme-color)/6]',
                })}
              >
                이 페이지에 대해 무엇이든 자유롭게 물어보세요.
                <br />
                어떻게 도와드릴까요?
              </div>

              <p class={css({ marginBottom: '8px', textStyle: '12m', color: 'text.tertiary' })}>
                해당 페이지에서 자주 찾는 문서({pages.length})
              </p>

              <ul
                class={flex({
                  flexDirection: 'column',
                  textStyle: '14r',
                })}
              >
                {#each pages.slice(0, 3) as page, idx (idx)}
                  <li class={flex({ align: 'center', gap: '6px', paddingY: '6px' })}>
                    <Icon style={css.raw({ color: 'neutral.50' })} icon={IconArrowRight} />
                    <a href={`${site.url}/go/${page.id}`} rel="noopener noreferrer" target="_blank">
                      {page.title}
                    </a>
                  </li>
                {/each}
                {#if pages.length > 3}
                  {#if !expanded}
                    <li class={css({ paddingY: '6px' })}>
                      <button
                        class={flex({ align: 'center', gap: '6px', color: 'text.disabled' })}
                        onclick={() => (expanded = true)}
                        type="button"
                      >
                        <Icon style={css.raw({ color: 'neutral.50' })} icon={IconEllipsis} />
                        <span>더보기</span>
                      </button>
                    </li>
                  {:else}
                    {#each pages.slice(3) as page, idx (idx)}
                      <li class={flex({ align: 'center', gap: '6px', paddingY: '6px' })}>
                        <Icon style={css.raw({ color: 'neutral.50' })} icon={IconArrowRight} />
                        <a href={`${site.url}/go/${page.id}`} rel="noopener noreferrer" target="_blank">
                          {page.title}
                        </a>
                      </li>
                    {/each}
                  {/if}
                {/if}
              </ul>
            {:else}
              <div class={flex({ gap: '6px' })}>
                <SparkleSmall />
                <div class={flex({ flexDirection: 'column', gap: '4px' })}>
                  <p class={css({ textStyle: '16b' })}>현재 페이지와 연관된 문서를 찾지 못했어요.</p>
                  <p class={css({ textStyle: '14m', color: 'neutral.80' })}>
                    도움센터 문서를 이용하시거나, 문의를 남겨보세요.
                  </p>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class={flex({ gap: '6px' })}>
            <SparkleSmall />
            <div class={flex({ flexDirection: 'column', gap: '4px' })}>
              <p class={css({ textStyle: '16b' })}>현재 페이지와 연관된 문서를 찾지 못했어요.</p>
              <p class={css({ textStyle: '14m', color: 'neutral.80' })}>
                도움센터 문서를 이용하시거나, 문의를 남겨보세요.
              </p>
            </div>
          </div>
        {/if}

        <div
          class={flex({
            flexDirection: 'column',
            gap: '16px',
            marginTop: 'auto',
            paddingX: '16px',
            pointerEvents: 'none',
          })}
        >
          <div>
            <p class={css({ marginBottom: '10px', textStyle: '12m', color: 'text.tertiary' })}>제안</p>
            <div class={flex({ gap: '8px' })}>
              <Button
                style={css.raw({ gap: '6px', paddingLeft: '16px', pointerEvents: 'auto' })}
                href={site.url}
                rel="noopener noreferrer"
                size="md"
                target="_blank"
                type="link"
                variant="secondary"
              >
                <Icon icon={BookOpenTextIcon} size={18} />
                <span>{site.name}</span>
              </Button>

              {#if site.widget.outLink}
                <Button
                  style={css.raw({ gap: '6px', paddingLeft: '16px', pointerEvents: 'auto' })}
                  href={site.widget.outLink}
                  rel="noopener noreferrer"
                  size="md"
                  target="_blank"
                  type="link"
                  variant="secondary"
                >
                  <Icon icon={MessageCircleIcon} size={18} />
                  <span>문의</span>
                </Button>
              {/if}
            </div>
          </div>

          <FormProvider context={chatFormContext} form={chatForm}>
            <label
              class={flex({
                align: 'center',
                borderWidth: '1px',
                borderRadius: '10px',
                borderColor: 'transparent',
                pointerEvents: 'auto',
                backgroundImage: '[linear-gradient(#fff, #fff), linear-gradient(to right, #FDB536 0%, #F66E1E 100%)]', // TODO: hue, user theme color
                backgroundOrigin: 'border-box',
                backgroundClip: '[content-box, border-box]',
              })}
            >
              <textarea
                name="question"
                class={css({
                  flexGrow: '1',
                  paddingY: '8px',
                  paddingLeft: '14px',
                  width: 'full',
                  minWidth: '0',
                  maxHeight: '100px',
                  resize: 'none',
                })}
                oninput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                placeholder="AI를 통해 무엇이든 물어보고, 쓰고, 검색하세요"
                rows="1"
              ></textarea>

              <button
                class={css({
                  borderRadius: 'full',
                  marginY: '8px',
                  marginRight: '10px',
                  padding: '3px',
                  size: '22px',
                  color: 'white',
                  backgroundColor: 'neutral.40',
                })}
                disabled={!$chatFormData.question || $chatFormIsSubmitting}
                type="submit"
              >
                <Icon icon={ArrowUpIcon} size={16} />
              </button>
            </label>
          </FormProvider>
        </div>
        <div class={center({ paddingTop: '8px', paddingBottom: '16px' })}>
          <a href="https://rdbl.io" rel="noopener noreferrer" target="_blank">
            <img alt="Readable" src={ReadableLogo} />
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>
