<script lang="ts">
  import { TinyColor } from '@ctrl/tinycolor';
  import { Readability } from '@mozilla/readability';
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { FormProvider, Icon } from '@readable/ui/components';
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
  import IconEllipsis from '~icons/lucide/ellipsis';
  import IconX from '~icons/lucide/x';
  import ReadableLogo from './assets/readable-logo.svg';
  import Sparkles from './assets/Sparkles.svelte';
  import { BOT_MESSAGE } from './assets/strings';
  import { BotMessage } from './components';
  import OtherOptions from './components/OtherOptions.svelte';
  import { trpc } from './trpc';
  import type { TRPCOutput } from './trpc';

  type Props = {
    site: TRPCOutput['widget']['site'];
  };

  let { site }: Props = $props();

  let popoverEl: HTMLDivElement;
  let open = $state(false);
  let expanded = $state(false);

  const themeColor2 = $derived(new TinyColor(site.themeColor).spin(26).toString());

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

  let response = $state<TRPCOutput['widget']['pages']['lookup']>();

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

      response = await trpc.widget.pages.lookup.query({
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
  const lastChat = $derived(chatHistory.at(-1));

  let chatHistoryEl = $state<HTMLDivElement>();
  let chatFormTextareaEl = $state<HTMLTextAreaElement>();
  let questionDraft = $state('');

  const textareaLineHeightPx = $derived(
    Number.parseFloat(chatFormTextareaEl?.computedStyleMap().get('line-height')?.toString() ?? '1.6') *
      Number.parseFloat(chatFormTextareaEl?.computedStyleMap().get('font-size')?.toString() ?? '16'),
  );

  $effect(() => {
    questionDraft;

    if (!chatFormTextareaEl) {
      return;
    }

    // textarea 높이 자동 조정
    chatFormTextareaEl.style.height = 'auto';
    chatFormTextareaEl.style.height = `${chatFormTextareaEl.scrollHeight}px`;
  });

  const {
    form: chatForm,
    context: chatFormContext,
    isSubmitting: chatFormIsSubmitting,
    createSubmitHandler: chatFormCreateSubmitHandler,
  } = createMutationForm({
    schema: z.object({
      question: z.string(),
    }),
    mutation: async ({ question }) => {
      questionDraft = '';

      if (chatHistory.length === 0) {
        const resp = await trpc.widget.chat.new.mutate({ siteId: site.id });
        chatSessionId = resp.sessionId;
      }

      chatHistory.push({ question });

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

  const chatFormSubmit = chatFormCreateSubmitHandler();
  // enter로 submit, shift+enter로 개행
  function onKeydownInTextarea(e: KeyboardEvent) {
    if (e.isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }

      e.preventDefault();
      if (questionDraft.trim() && !$chatFormIsSubmitting && !(lastChat && lastChat.answer === undefined)) {
        chatFormSubmit();
      }
    }
  }

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

  const pages = $derived(
    response?.pages.filter((page: TRPCOutput['widget']['pages']['lookup']['pages'][number]) =>
      'score' in page ? page.score >= 0.8 : true,
    ),
  );

  const pagesVisible = $derived(expanded ? pages : pages?.slice(0, 3));

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
    {#if open}
      <div
        style:--widget-theme-color={site.themeColor}
        style:--widget-theme-color-2={themeColor2}
        class={center({
          position: 'absolute',
          inset: '0',
          size: 'full',
          color: 'neutral.0',
          background: '[linear-gradient(160deg, var(--widget-theme-color-2) 9.28%, var(--widget-theme-color) 75%)]',
          borderRadius: 'full',
          boxShadow: 'strong',
        })}
        transition:scale={{ start: 0.8 }}
      >
        <Icon icon={IconX} size={18} />
      </div>
    {:else}
      <div
        style:--widget-theme-color={site.themeColor}
        style:--widget-theme-color-2={themeColor2}
        class={center({
          position: 'absolute',
          inset: '0',
          size: 'full',
          color: 'neutral.0',
          background: '[linear-gradient(160deg, var(--widget-theme-color-2) 9.28%, var(--widget-theme-color) 75%)]',
          borderRadius: 'full',
          boxShadow: 'strong',
        })}
        transition:scale={{ start: 0.8 }}
      >
        <Sparkles />
      </div>
    {/if}
  </button>

  {#if open}
    <div
      style:--widget-theme-color={site.themeColor}
      style:--widget-theme-color-2={themeColor2}
      class={css({ display: 'contents' })}
    >
      <div
        class={flex({
          direction: 'column',
          position: 'fixed',
          bottom: '68px',
          right: '20px',
          borderRadius: '[20px]',
          overflowY: 'auto',
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
            <h1 class={css({ textStyle: '14sb', truncate: true })}>
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
              gap: '24px',
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
                      whiteSpace: 'pre-wrap',
                    }),
                  )}
                  in:fly|global={{ y: 10 }}
                >
                  {chat.question}
                </p>
              </div>

              {#if chat.answer}
                <BotMessage message={chat.answer} {site} />
              {:else if chat.answer === null}
                <BotMessage message={`"${chat.question}"과 연관된 내용을 찾지 못했어요.`} {site} />
                <BotMessage {site} title="다른 도움이 필요하신가요?">
                  {#snippet content()}
                    <OtherOptions {site} />
                  {/snippet}
                </BotMessage>
              {:else}
                <BotMessage loading {site} />
              {/if}
            {/each}
          </div>
        {:else}
          <div class={center({ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '24px' })}>
            <BotMessage message={BOT_MESSAGE.INITIAL} {site} />
            {#if loadingCount > 0}
              <BotMessage loading {site}>
                <!-- {#snippet content()}
                  <div class={center({ height: '28px' })}>
                    <AiLoading />
                  </div>
                {/snippet} -->
              </BotMessage>
            {:else if response && pages && pagesVisible}
              {#if pages.length > 0}
                <BotMessage
                  {site}
                  title={response.type === 'match'
                    ? `이 페이지에 대한 추천 문서 (${pages.length})`
                    : `도움센터에서 자주 찾는 문서 (${pages.length})`}
                >
                  {#snippet content()}
                    <ul
                      class={flex({
                        flexDirection: 'column',
                        textStyle: '14r',
                      })}
                    >
                      {#each pagesVisible as page, idx (idx)}
                        <li>
                          <a
                            class={css({
                              display: 'inline-flex',
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              gap: '6px',
                              padding: '4px',
                              paddingRight: '6px',
                              borderRadius: '6px',
                              backgroundColor: {
                                _hover: 'neutral.20',
                              },
                            })}
                            href={`${site.url}/go/${page.id}`}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Icon
                              style={css.raw({ color: 'neutral.50', marginTop: '2px' })}
                              icon={IconArrowRight}
                              size={16}
                            />
                            <span class={css({ lineClamp: 2 })}>{page.title}</span>
                          </a>
                        </li>
                      {/each}
                      {#if pages.length > pagesVisible.length && !expanded}
                        <li>
                          <button
                            class={flex({
                              align: 'center',
                              gap: '6px',
                              padding: '4px',
                              paddingRight: '6px',
                              borderRadius: '6px',
                              backgroundColor: {
                                _hover: 'neutral.20',
                              },
                              color: 'text.tertiary',
                            })}
                            onclick={() => (expanded = true)}
                            type="button"
                          >
                            <Icon style={css.raw({ color: 'neutral.50' })} icon={IconEllipsis} />
                            <span>더보기</span>
                          </button>
                        </li>
                      {/if}
                    </ul>
                  {/snippet}
                </BotMessage>
              {/if}
              {#if !response || pages.length === 0}
                <BotMessage message={BOT_MESSAGE.NOT_FOUND} {site} />
              {/if}
              {#if !response || response.type === 'fallback'}
                <!-- 로딩 끝났는데 결과가 없는 경우 (에러) 또는 결과 타입이 fallback인 경우 -->
                <BotMessage {site} title="다른 도움이 필요하신가요?">
                  {#snippet content()}
                    <OtherOptions {site} />
                  {/snippet}
                </BotMessage>
              {/if}
            {/if}
          </div>
        {/if}

        <div
          class={flex({
            flexDirection: 'column',
            marginTop: 'auto',
            paddingX: '16px',
            pointerEvents: 'none',
          })}
        >
          <FormProvider context={chatFormContext} form={chatForm}>
            <label
              class={flex({
                width: 'full',
                align: 'center',
                gap: '8px',
                borderWidth: '1px',
                borderRadius: '10px',
                borderColor: 'transparent',
                pointerEvents: 'auto',
                backgroundImage:
                  '[linear-gradient(#fff, #fff), linear-gradient(to right, var(--widget-theme-color-2) 0%, var(--widget-theme-color) 100%)]',
                backgroundOrigin: 'border-box',
                backgroundClip: '[content-box, border-box]',
              })}
            >
              <textarea
                bind:this={chatFormTextareaEl}
                name="question"
                style:max-height={`${textareaLineHeightPx * 5}px`}
                class={css({
                  flexGrow: '1',
                  paddingLeft: '14px',
                  paddingY: '10px',
                  textStyle: '14m',
                  height: 'auto',
                  resize: 'none',
                })}
                onkeydown={onKeydownInTextarea}
                placeholder="AI를 통해 무엇이든 물어보고, 쓰고, 검색하세요"
                rows="1"
                bind:value={questionDraft}
              ></textarea>
              <button
                class={css({
                  alignSelf: 'flex-end',
                  borderRadius: 'full',
                  padding: '3px',
                  marginY: '8px',
                  marginRight: '10px',
                  size: '22px',
                  color: 'white',
                  backgroundColor: {
                    base: '[var(--widget-theme-color)]',
                    _disabled: 'neutral.40',
                  },
                })}
                disabled={!questionDraft.trim() || $chatFormIsSubmitting || (lastChat && lastChat.answer === undefined)}
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
