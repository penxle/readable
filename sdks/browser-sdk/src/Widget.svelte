<script lang="ts">
  import { Readability } from '@mozilla/readability';
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { Button, FormProvider, Icon, Img, MarkdownRenderer, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { getAccessibleTextColor, hexToRgb } from '@readable/ui/utils';
  import stringHash from '@sindresorhus/string-hash';
  import dayjs from 'dayjs';
  import stringify from 'fast-json-stable-stringify';
  import mixpanel from 'mixpanel-browser';
  import { onMount, tick, untrack } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { z } from 'zod';
  import ArrowUpIcon from '~icons/lucide/arrow-up';
  import BookOpenTextIcon from '~icons/lucide/book-open-text';
  import ChevronLeftIcon from '~icons/lucide/chevron-left';
  import MessageCircleIcon from '~icons/lucide/message-circle';
  import IconX from '~icons/lucide/x';
  import AiLoading from './assets/AiLoading.svelte';
  import ReadableLogo from './assets/readable-logo.svg';
  import Sparkle from './assets/Sparkle.svelte';
  import SparkleSmall from './assets/SparkleSmall.svelte';
  import { trpc } from './trpc';
  import type { TRPCOutput } from './trpc';

  type Props = {
    site: TRPCOutput['widget']['site'];
  };

  let { site }: Props = $props();

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
      bottom: '32px',
      right: '32px',
      display: 'block',
      size: '48px',
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
        style:--widget-theme-color={site.themeColor}
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
    <div style:--widget-theme-color={site.themeColor} class={css({ display: 'contents' })}>
      <div
        class={flex({
          direction: 'column',
          position: 'fixed',
          bottom: '92px',
          right: '32px',
          borderRadius: '12px',
          overflow: 'auto',
          width: '384px',
          maxHeight: '[calc(100vh - 184px)]',
          textStyle: '14m',
          color: 'neutral.90',
          backgroundColor: 'white',
          boxShadow: 'heavy',
          pointerEvents: 'auto',
        })}
        onpointerdown={(e) => e.stopPropagation()}
        transition:fly={{ y: 5 }}
      >
        {#if chatHistory.length > 0}
          <div
            class={flex({
              flexShrink: 0,
              gap: '4px',
              height: '48px',
              alignItems: 'center',
              paddingX: '4px',
              borderBottomWidth: '1px',
              borderBottomColor: 'border.primary',
            })}
          >
            <button
              class={center({
                padding: '6px',
                borderRadius: 'full',
                _hover: {
                  backgroundColor: 'neutral.20',
                },
              })}
              onclick={() => (chatHistory = [])}
              type="button"
            >
              <Icon icon={ChevronLeftIcon} size={20} />
            </button>
            <h1 class={css({ textStyle: '14b' })}>
              {site.name} AI 문의
            </h1>
          </div>
        {:else}
          <div
            class={center({
              flexDirection: 'column',
              height: '150px',
              gap: '16px',
              bgGradient: 'to-b',
              gradientFrom: '[var(--widget-theme-color)/60]',
              gradientTo: '[var(--widget-theme-color)/100]',
              flexShrink: 0,
            })}
          >
            {#if site.logoUrl}
              <Img
                style={css.raw({
                  size: '56px',
                  borderRadius: '8px',
                  borderWidth: '1px',
                  borderColor: 'border.image',
                })}
                alt=""
                size={64}
                url={site.logoUrl}
              />
            {/if}
            <h1
              style:color={getAccessibleTextColor(hexToRgb(site.themeColor))}
              class={css({
                textStyle: '16eb',
              })}
            >
              {site.name}
            </h1>
          </div>
        {/if}
        {#if chatHistory.length > 0}
          <div
            bind:this={chatHistoryEl}
            class={flex({
              flexDirection: 'column',
              gap: '12px',
              paddingX: '16px',
              paddingY: '20px',
              overflow: 'auto',
              minHeight: '170px',
              maxHeight: '512px',
              marginBottom: '-40px',
              paddingBottom: '60px',
            })}
          >
            {#each chatHistory as chat, idx (idx)}
              <div class={flex({ justifyContent: 'flex-end', paddingLeft: '40px' })}>
                <p
                  class={cx(
                    'question-bubble',
                    css({
                      paddingX: '12px',
                      paddingY: '8px',
                      backgroundColor: 'neutral.20',
                      textStyle: '14m',
                      borderRadius: '[18px]',
                    }),
                  )}
                  in:fly|global={{ y: 10 }}
                >
                  {chat.question}
                </p>
              </div>
              {#if chat.answer}
                <div class={flex({ justifyContent: 'flex-start', gap: '12px' })}>
                  <SparkleSmall />
                  <MarkdownRenderer style={css.raw({ textStyle: '14m' })} source={chat.answer} />
                </div>
              {:else if chat.answer === null}
                <div class={flex({ justifyContent: 'flex-start', gap: '12px' })}>
                  <SparkleSmall />
                  <p class={css({ textStyle: '14m' })}>
                    "{chat.question}"과 연관된 내용을 찾지 못했어요.
                  </p>
                </div>
              {:else}
                <div class={flex({ justifyContent: 'flex-start', gap: '12px' })}>
                  <SparkleSmall />
                  <AiLoading />
                </div>
              {/if}
            {/each}
          </div>
        {:else if loadingCount > 0}
          <div class={center({ flexDirection: 'column', paddingY: '20px', gap: '20px' })}>
            <Sparkle />
            <p class={css({ textStyle: '14b' })}>현재 페이지에서 가장 도움이 될 문서를 찾고 있어요...</p>
          </div>
        {:else if response && pages}
          <div
            class={flex({
              flexDirection: 'column',
              gap: '12px',
              paddingX: '16px',
              paddingTop: '20px',
              paddingBottom: '40px',
            })}
          >
            {#if pages.length > 0}
              <h2 class={flex({ alignItems: 'center', gap: '6px' })}>
                <SparkleSmall />
                <span class={css({ textStyle: '16b' })}>현재 페이지와 연관된 문서를 찾았어요.</span>
              </h2>

              <ul
                class={flex({
                  flexDirection: 'column',
                  gap: '4px',
                  marginLeft: '20px',
                  paddingLeft: '20px',
                  listStyle: 'disc',
                  textStyle: '14m',
                  color: 'neutral.80',
                })}
              >
                {#each pages as page, idx (idx)}
                  <li>
                    <a
                      class={css({
                        textDecoration: 'underline',
                        textUnderlineOffset: '4px',
                        _hover: {
                          color: 'neutral.100',
                        },
                      })}
                      href={`${site.url}/go/${page.id}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {page.title}
                    </a>
                  </li>
                {/each}
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

        <div class={flex({ flexDirection: 'column', gap: '8px', paddingX: '16px', pointerEvents: 'none' })}>
          <div class={flex({ gap: '6px' })}>
            <Button
              style={css.raw({ gap: '4px', borderRadius: '16px', pointerEvents: 'auto' })}
              href={site.url}
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              type="link"
              variant="secondary"
            >
              <Icon icon={BookOpenTextIcon} size={16} />
              <span class={css({ textStyle: '14b' })}>{site.name}</span>
            </Button>
            {#if site.widget.outLink}
              <Button
                style={css.raw({ gap: '4px', borderRadius: '16px', pointerEvents: 'auto' })}
                href={site.widget.outLink}
                rel="noopener noreferrer"
                size="sm"
                target="_blank"
                type="link"
                variant="secondary"
              >
                <Icon icon={MessageCircleIcon} size={16} />
                <span class={css({ textStyle: '14b' })}>문의</span>
              </Button>
            {/if}
          </div>
          <FormProvider context={chatFormContext} form={chatForm}>
            <TextInput
              name="question"
              style={css.raw({ borderRadius: '[20px]', pointerEvents: 'auto' })}
              placeholder={chatHistory.length > 0 ? '추가 문의하기' : '무엇이든 물어보세요'}
            >
              {#snippet rightItem()}
                <Button
                  style={css.raw({ marginRight: '-8px', borderRadius: 'full', padding: '4px', size: '24px' })}
                  disabled={!$chatFormData.question || $chatFormIsSubmitting}
                  size="sm"
                  type="submit"
                  variant="secondary"
                >
                  <Icon icon={ArrowUpIcon} size={16} />
                </Button>
              {/snippet}
            </TextInput>
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
